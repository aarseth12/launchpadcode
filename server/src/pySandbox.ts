import { spawn, type ChildProcess } from "node:child_process";
import { mkdtemp, writeFile, copyFile, rm } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { killSandbox } from "./ftcSandbox.ts";
import type { PrepareResult, RunOpts } from "./course.ts";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PY_RUNTIME = path.resolve(HERE, "..", "py-runtime");
const BUILD_ROOT = process.platform === "darwin" ? "/tmp" : tmpdir(); // Docker-bindable on macOS
const SANDBOX_IMAGE = process.env.FTC_PY_IMAGE ?? "python:3-slim";
const RUN_TIMEOUT_S = 60;   // live "Run" cap — reset on each input() prompt, so it's per-prompt typing time
const GRADE_TIMEOUT_S = 10; // grading cap

// Same locked-down profile as the FTC sandbox; container name keeps the `ftc-` prefix so the
// existing killSandbox(runId) force-removes it unchanged. No compile step — just run the script.
function dockerArgs(dir: string, runId: string, timeoutS: number): string[] {
  return [
    "run", "--rm", "-i",
    "--name", `ftc-${runId}`,
    "--network", "none",
    "--read-only",
    "--tmpfs", "/tmp:rw,size=32m,noexec,nosuid",
    "--user", "1000:1000",
    "--cpus", "0.75",
    "--memory", "256m", "--memory-swap", "256m",
    "--pids-limit", "64",
    "--cap-drop", "ALL",
    "--security-opt", "no-new-privileges",
    "-e", "HOME=/tmp",
    "-v", `${dir}:/work:ro`,
    SANDBOX_IMAGE,
    "python", "/work/pyRunner.py", "/work/main.py", String(timeoutS),
  ];
}

/** Copy the runner + the `draw` canvas module (importable because it sits next to pyRunner.py). */
async function copyRuntime(dir: string): Promise<void> {
  for (const f of ["pyRunner.py", "draw.py"]) await copyFile(path.join(PY_RUNTIME, f), path.join(dir, f));
}

/** Write the student's script + the runner into a fresh temp dir the container bind-mounts read-only. */
async function stage(source: string): Promise<string> {
  const dir = await mkdtemp(path.join(BUILD_ROOT, "py-run-"));
  await writeFile(path.join(dir, "main.py"), source, "utf8");
  await copyRuntime(dir);
  return dir;
}

function spawnPy(dir: string, sandbox: "docker" | "none", runId: string, timeoutS: number): ChildProcess {
  if (sandbox === "docker") return spawn("docker", dockerArgs(dir, runId, timeoutS), { stdio: ["pipe", "pipe", "pipe"] });
  return spawn("python3", [path.join(dir, "pyRunner.py"), path.join(dir, "main.py"), String(timeoutS)], { stdio: ["pipe", "pipe", "pipe"] });
}

/** Prepare a live run: there's no compile, so this always succeeds with a launcher + cleanup. */
export async function preparePython(source: string, { sandbox, runId }: RunOpts): Promise<PrepareResult> {
  const dir = await stage(source);
  return {
    ok: true,
    runId,
    sandbox,
    label: "main.py",
    launch: () => spawnPy(dir, sandbox, runId, RUN_TIMEOUT_S),
    cleanup: () => { rm(dir, { recursive: true, force: true }); },
  };
}

/** One message from the `draw` module ({type:"draw", op:"line"|"circle"|...}), kept for drawing checks. */
export type DrawCmd = { op: string; [k: string]: any };
// outOfInput: the program called input() after every typed answer was used up (pyRunner's EOFError).
export interface PyRunResult { stdout: string; stderr: string; runtimeError?: string; timedOut?: boolean; outOfInput?: boolean; draws: DrawCmd[]; }

/** Headless run-to-completion for grading: reassemble the framed stdout/stderr and any error. */
export async function runPython(source: string, opts: { sandbox?: "docker" | "none"; timeoutS?: number } = {}): Promise<PyRunResult> {
  const sandbox = opts.sandbox ?? "none";
  const timeoutS = opts.timeoutS ?? GRADE_TIMEOUT_S;
  const dir = await stage(source);
  const runId = randomUUID();
  const child = spawnPy(dir, sandbox, runId, timeoutS);

  let stdout = "", stderr = "", buf = "";
  let runtimeError: string | undefined;
  let timedOut = false, outOfInput = false;
  const draws: DrawCmd[] = [];

  child.stdout!.on("data", (d) => {
    buf += d.toString();
    let i;
    while ((i = buf.indexOf("\n")) >= 0) {
      const line = buf.slice(0, i).trim();
      buf = buf.slice(i + 1);
      if (!line.startsWith("{")) continue;
      try {
        const o: any = JSON.parse(line);
        if (o.type === "stdout") stdout += o.text;
        else if (o.type === "stderr") stderr += o.text;
        else if (o.type === "draw") draws.push(o);
        else if (o.type === "runtimeError") { runtimeError = o.message; outOfInput = o.eof === true; }
        else if (o.type === "timeout") { timedOut = true; runtimeError = o.message; }
      } catch { }
    }
  });
  child.stderr!.on("data", () => { }); // interpreter/container stderr (not the student's) — ignored

  await new Promise<void>((resolve) => {
    const killT = setTimeout(() => {
      try { child.kill("SIGKILL"); } catch { }
      if (sandbox === "docker") killSandbox(runId);
    }, (timeoutS + 8) * 1000);
    child.on("close", () => { clearTimeout(killT); resolve(); });
    child.on("error", () => { clearTimeout(killT); resolve(); });
  });
  await rm(dir, { recursive: true, force: true });

  return { stdout, stderr, runtimeError, timedOut, outOfInput, draws };
}

// ---- Persistent per-student session containers ----
// Instead of a fresh `docker run --rm` per Run/Check (create+destroy churn, which wedges Docker
// Desktop under a class's load), each student gets ONE locked-down container that stays warm; each
// run is a lightweight `docker exec` into it. The container is created lazily on the first run and
// removed when the student disconnects. Same security profile as the per-run sandbox.

export interface PySession { name: string; workDir: string; }

const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

function sessionDockerArgs(name: string, workDir: string): string[] {
  return [
    "run", "-d",
    "--name", name,
    "--network", "none",
    "--read-only",
    "--tmpfs", "/tmp:rw,size=32m,noexec,nosuid",
    "--user", "1000:1000",
    "--cpus", "0.75",
    "--memory", "256m", "--memory-swap", "256m",
    "--pids-limit", "64",
    "--cap-drop", "ALL",
    "--security-opt", "no-new-privileges",
    "-e", "HOME=/tmp",
    "-v", `${workDir}:/work:ro`,   // holds pyRunner.py (static; the program itself comes via stdin)
    SANDBOX_IMAGE,
    "sleep", "infinity",
  ];
}

/** Start one student's long-lived container (docker only). runId names it with the `ftc-` prefix. */
export async function createPySession(runId: string): Promise<PySession> {
  const workDir = await mkdtemp(path.join(BUILD_ROOT, "py-sess-"));
  await copyRuntime(workDir);
  const name = `ftc-${runId}`;
  await new Promise<void>((resolve, reject) => {
    const p = spawn("docker", sessionDockerArgs(name, workDir), { stdio: "ignore" });
    p.on("close", (code) => (code === 0 ? resolve() : reject(new Error("docker run -d exited " + code))));
    p.on("error", reject);
  });
  // The container starts `sleep infinity` immediately, but give exec a couple of tries to be safe.
  for (let i = 0; i < 20; i++) {
    const ok = await new Promise<boolean>((res) => {
      const e = spawn("docker", ["exec", name, "true"], { stdio: "ignore" });
      e.on("close", (c) => res(c === 0)); e.on("error", () => res(false));
    });
    if (ok) break;
    await delay(100);
  }
  return { name, workDir };
}

/** Kill the currently-running program inside the container (leaves the container warm). */
export function interruptPyRun(session: PySession): Promise<void> {
  return new Promise((resolve) => {
    const p = spawn("docker", ["exec", session.name, "pkill", "-f", "pyRunner.py"], { stdio: "ignore" });
    p.on("close", () => resolve()); p.on("error", () => resolve());
  });
}

/** Write the student's program into the container's /tmp — leaving the run's stdin FREE for input(). */
function writeProgram(session: PySession, source: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const p = spawn("docker", ["exec", "-i", session.name, "sh", "-c", "cat > /tmp/prog.py"], { stdio: ["pipe", "ignore", "ignore"] });
    p.on("close", (code) => (code === 0 ? resolve() : reject(new Error("write program exited " + code))));
    p.on("error", reject);
    try { p.stdin!.write(source); p.stdin!.end(); } catch (e) { reject(e as Error); }
  });
}

/** Exec a live run in the student's container. stdin stays OPEN so the server can feed input() answers. */
export async function execPyRun(session: PySession, source: string, timeoutS: number = RUN_TIMEOUT_S): Promise<ChildProcess> {
  await writeProgram(session, source);
  return spawn("docker", ["exec", "-i", session.name, "python", "-u", "/work/pyRunner.py", "/tmp/prog.py", String(timeoutS)], {
    stdio: ["pipe", "pipe", "pipe"],
  });
}

/** Headless run-to-completion inside the container (for grading): feed scripted input, collect output. */
export async function capturePyRun(session: PySession, source: string, inputs: string[] = [], timeoutS: number = GRADE_TIMEOUT_S): Promise<PyRunResult> {
  await interruptPyRun(session);
  await writeProgram(session, source);
  const child = spawn("docker", ["exec", "-i", session.name, "python", "-u", "/work/pyRunner.py", "/tmp/prog.py", String(timeoutS)], { stdio: ["pipe", "pipe", "pipe"] });
  // Feed the lesson's scripted answers, then close stdin so a further input() gets EOF instead of hanging.
  try { for (const line of inputs) child.stdin!.write(line + "\n"); child.stdin!.end(); } catch { }
  let stdout = "", stderr = "", buf = "";
  let runtimeError: string | undefined;
  let timedOut = false, outOfInput = false;
  const draws: DrawCmd[] = [];
  child.stdout!.on("data", (d) => {
    buf += d.toString();
    let i;
    while ((i = buf.indexOf("\n")) >= 0) {
      const line = buf.slice(0, i).trim();
      buf = buf.slice(i + 1);
      if (!line.startsWith("{")) continue;
      try {
        const o: any = JSON.parse(line);
        if (o.type === "stdout") stdout += o.text;
        else if (o.type === "stderr") stderr += o.text;
        else if (o.type === "draw") draws.push(o);
        else if (o.type === "runtimeError") { runtimeError = o.message; outOfInput = o.eof === true; }
        else if (o.type === "timeout") { timedOut = true; runtimeError = o.message; }
      } catch { }
    }
  });
  child.stderr!.on("data", () => { });
  await new Promise<void>((resolve) => {
    const killT = setTimeout(() => { try { child.kill("SIGKILL"); } catch { } interruptPyRun(session); }, (timeoutS + 8) * 1000);
    child.on("close", () => { clearTimeout(killT); resolve(); });
    child.on("error", () => { clearTimeout(killT); resolve(); });
  });
  return { stdout, stderr, runtimeError, timedOut, outOfInput, draws };
}

/** Remove a student's container and its work dir. */
export function destroyPySession(session: PySession): void {
  try { spawn("docker", ["rm", "-f", session.name], { stdio: "ignore" }); } catch { }
  rm(session.workDir, { recursive: true, force: true });
}

/** On server startup, clear any `ftc-*` sandbox containers left over from a previous crash. */
export function sweepLeakedContainers(): void {
  try {
    spawn("sh", ["-c", 'docker ps -aq --filter name=ftc- | while read id; do docker rm -f "$id" >/dev/null 2>&1; done'], { stdio: "ignore" });
  } catch { }
}
