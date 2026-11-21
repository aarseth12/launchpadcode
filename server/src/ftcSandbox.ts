import { execFile, spawn, type ChildProcess } from "node:child_process";
import { promisify } from "node:util";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const execFileAsync = promisify(execFile);
const HERE = path.dirname(fileURLToPath(import.meta.url));
const MOCK_ROOT = path.resolve(HERE, "..", "ftc-mock");
const JAVA_RELEASE = "17"; // match the FTC SDK language level so sim code stays portable
const BUILD_ROOT = process.platform === "darwin" ? "/tmp" : tmpdir(); // bind-mountable by Docker (macOS won't share /var/folders)
const SANDBOX_IMAGE = process.env.FTC_SANDBOX_IMAGE ?? "eclipse-temurin:17-jre";

export interface Diagnostic {
  file: string;
  line: number;
  kind: string;
  message: string;
}

export interface StateSample {
  t: number;
  x: number;
  y: number;
  h: number;
  fl: number;
  fr: number;
  bl: number;
  br: number;
  claw?: number;
  touch?: boolean;
  dist?: number;
  telemetry?: Record<string, string>;
}

export interface CompileResult {
  ok: boolean;
  className?: string;
  dir?: string;     // temp dir to clean up after the run (only on success)
  outDir?: string;  // classpath root for the worker
  diagnostics?: Diagnostic[];
}

export function extractClassName(source: string): string | null {
  const m = source.match(/public\s+class\s+(\w+)/);
  return m ? m[1] : null;
}

function parseJavacDiagnostics(stderr: string): Diagnostic[] {
  const out: Diagnostic[] = [];
  const re = /^(.*\.java):(\d+):\s*(error|warning):\s*(.*)$/gm;
  let m: RegExpExecArray | null;
  while ((m = re.exec(stderr)) !== null) {
    out.push({ file: path.basename(m[1]), line: Number(m[2]), kind: m[3], message: m[4].trim() });
  }
  return out;
}

/**
 * Compile a student OpMode against the mock FTC SDK. On success, leaves the build in a temp
 * dir (caller must cleanup(dir) after the run). On failure, cleans up and returns diagnostics.
 */
export async function compile(source: string): Promise<CompileResult> {
  const className = extractClassName(source);
  if (!className) {
    return { ok: false, diagnostics: [{ file: "OpMode.java", line: 1, kind: "error", message: "Could not find a `public class` declaration." }] };
  }

  const dir = await mkdtemp(path.join(BUILD_ROOT, "ftc-run-"));
  const outDir = path.join(dir, "out");
  await mkdir(outDir, { recursive: true });
  const studentPath = path.join(dir, `${className}.java`);
  await writeFile(studentPath, source, "utf8");

  const sourcepath = [MOCK_ROOT, dir].join(path.delimiter);
  const runnerPath = path.join(MOCK_ROOT, "sim", "Runner.java");

  try {
    await execFileAsync(
      "javac",
      ["--release", JAVA_RELEASE, "-d", outDir, "-sourcepath", sourcepath, runnerPath, studentPath],
      { timeout: 20_000, maxBuffer: 4 * 1024 * 1024 },
    );
  } catch (err: any) {
    const stderr = String(err.stderr ?? err.message ?? "");
    await rm(dir, { recursive: true, force: true });
    const diagnostics = parseJavacDiagnostics(stderr);
    return {
      ok: false,
      className,
      diagnostics: diagnostics.length ? diagnostics : [{ file: `${className}.java`, line: 0, kind: "error", message: stderr.trim() }],
    };
  }

  return { ok: true, className, dir, outDir };
}

function dockerArgs(outDir: string, className: string, mode: string, durMs: number, runId: string): string[] {
  return [
    "run", "--rm", "-i",
    "--name", `ftc-${runId}`,
    "--network", "none",          // no network access
    "--read-only",                // immutable root filesystem
    "--tmpfs", "/tmp:rw,size=32m,noexec,nosuid",
    "--user", "1000:1000",        // non-root
    "--cpus", "0.75",             // cap CPU (bounds busy-spin loops)
    "--memory", "256m", "--memory-swap", "256m",
    "--pids-limit", "64",         // no fork bombs
    "--cap-drop", "ALL",
    "--security-opt", "no-new-privileges",
    "-e", "HOME=/tmp",
    "-v", `${outDir}:/work:ro`,   // compiled classes, read-only
    SANDBOX_IMAGE,
    "java", "-XX:-UsePerfData", "-XX:+UseSerialGC", "-Xmx192m",
    "-cp", "/work", "sim.Runner", className, mode, String(durMs),
  ];
}

export interface SpawnOpts { sandbox?: "docker" | "none"; runId?: string; }

/**
 * Spawn the compiled OpMode as a long-lived worker with piped stdio.
 *   stream   — gamepad on stdin ("g1 lx ly rx ry"), runs until "stop" or maxMs; bridged to WS.
 *   scripted — headless self-test with a fixed window.
 *
 * sandbox "docker" runs it inside a locked-down container (the real isolation boundary);
 * "none" runs java directly (local dev / trusted self-tests only).
 */
export function spawnWorker(
  outDir: string,
  className: string,
  mode: "stream" | "scripted",
  durMs: number,
  opts: SpawnOpts = {},
): ChildProcess {
  if (opts.sandbox === "docker") {
    return spawn("docker", dockerArgs(outDir, className, mode, durMs, opts.runId ?? "anon"), { stdio: ["pipe", "pipe", "pipe"] });
  }
  return spawn("java", ["-XX:-UsePerfData", "-cp", outDir, "sim.Runner", className, mode, String(durMs)], {
    stdio: ["pipe", "pipe", "pipe"],
  });
}

/** Force-remove a sandboxed run's container — it won't die just because the `docker run` client is killed. */
export function killSandbox(runId: string): void {
  try { spawn("docker", ["rm", "-f", `ftc-${runId}`], { stdio: "ignore" }); } catch { }
}

export async function cleanup(dir?: string): Promise<void> {
  if (dir) await rm(dir, { recursive: true, force: true });
}

export interface RunResult {
  ok: boolean;
  stage: "compile" | "run";
  className?: string;
  diagnostics?: Diagnostic[];
  samples?: StateSample[];
  runtimeError?: string;
}

/** Headless compile-and-run for tests: compiles, runs the scripted self-test, returns state samples. */
export async function compileAndRun(source: string, opts: { runMillis?: number } = {}): Promise<RunResult> {
  const runMillis = opts.runMillis ?? 1000;
  const c = await compile(source);
  if (!c.ok) return { ok: false, stage: "compile", className: c.className, diagnostics: c.diagnostics };

  const child = spawnWorker(c.outDir!, c.className!, "scripted", runMillis);
  let stdout = "";
  child.stdout!.on("data", (d) => (stdout += d.toString()));
  child.stderr!.on("data", () => {});

  await new Promise<void>((resolve) => {
    const killTimer = setTimeout(() => child.kill("SIGKILL"), runMillis + 5_000);
    child.on("close", () => { clearTimeout(killTimer); resolve(); });
    child.on("error", () => { clearTimeout(killTimer); resolve(); });
  });
  await cleanup(c.dir);

  const samples: StateSample[] = [];
  let runtimeError: string | undefined;
  for (const line of stdout.split("\n")) {
    const s = line.trim();
    if (!s.startsWith("{")) continue;
    let obj: any;
    try { obj = JSON.parse(s); } catch { continue; }
    if (obj.type === "state") samples.push(obj as StateSample);
    else if (obj.type === "runtimeError" || obj.type === "error" || obj.type === "timeout") runtimeError = obj.message;
  }

  return { ok: !runtimeError, stage: "run", className: c.className, samples, runtimeError };
}
