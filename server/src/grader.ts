import { randomUUID } from "node:crypto";
import { compile, spawnWorker, cleanup, killSandbox, type StateSample, type Diagnostic } from "./ftcSandbox.ts";

/** A timed gamepad input. Omitted axes default to 0. */
export interface GamepadInput { lx?: number; ly?: number; rx?: number; ry?: number; }
export interface ScenarioStep { atMs: number; g1: GamepadInput; }
/** A scenario drives the OpMode with a scripted gamepad timeline, then stops. */
export interface Scenario { durationMs: number; steps: ScenarioStep[]; }

/** Everything a check can inspect about a run. */
export interface Trace {
  states: StateSample[];
  telemetry: Record<string, string>; // latest non-empty telemetry snapshot
  runtimeError?: string;
  compileError?: Diagnostic[];
}

/** A behavioral assertion over the run trace. */
export interface Check { id: string; label: string; hint: string; test: (t: Trace) => boolean; }

/**
 * A drawing expectation, for lessons that use the `draw` canvas (300×300, origin top-left, y down).
 * Each kind looks for a shape near a position; `tol` (pixels) loosens how near it must be.
 */
export type DrawSpec =
  | { line: [number, number, number, number]; tol?: number }             // a line joining these two points (either direction)
  | { vline: number; minLen?: number; tol?: number }                      // a vertical line at this x, at least minLen long
  | { hline: number; minLen?: number; tol?: number }                      // a horizontal line at this y, at least minLen long
  | { circle: [number, number] | [number, number, number]; tol?: number } // a circle centered here (with this radius, if given)
  | { cross: [number, number]; tol?: number }                             // an X: two crossing lines centered here
  | { empty: [number, number]; tol?: number };                            // no line, circle or rect centered here

/** An output check for a runnable `code` step (same shape as the course's OutputCheck). */
export interface StepCheck { id: string; label: string; hint: string; equals?: string; contains?: string; containsAny?: string[]; draw?: DrawSpec[]; }

/** A step in a lesson's guided tutorial — the "textbook" stages before the practice challenge. */
export type TutorialStep =
  | { kind: "read"; title?: string; body: string }
  | { kind: "example"; title?: string; body?: string; code: string; explain?: string; legend?: boolean }
  | { kind: "type"; prompt: string; answer: string[]; hint?: string; explain?: string }
  | { kind: "diagram"; title?: string; label?: string; svg: string; caption?: string }
  | { kind: "quiz"; title?: string; intro?: string; code?: string; questions: QuizQuestion[] }
  // A small runnable mini-exercise shown inline in the walkthrough: starter code + Run/Check.
  // `expect`/`inputs` are graded server-side (by step `id`); the client shows `starter` + check labels.
  // An empty `expect` makes it a "try it" step (Run only, no Check); `canvas` shows the drawing canvas.
  | { kind: "code"; id: string; title?: string; body?: string; starter: string; expect: StepCheck[]; inputs?: string[]; hint?: string; solution?: string; canvas?: boolean };

/** One multiple-choice question; `answer` is the 0-based index of the correct option. */
export interface QuizQuestion { q: string; options: string[]; answer: number; explain?: string }

export interface Lesson {
  id: string;
  order: number;
  title: string;
  concepts: string[];
  instructions: string; // markdown
  starterCode?: string;   // optional — concept-only lessons (e.g. the intro) have no practice
  scenario?: Scenario;
  checks?: Check[];
  tutorial?: TutorialStep[]; // guided instruction → examples → type-it-out, before the challenge
}

export interface CheckResult { id: string; label: string; hint: string; pass: boolean; }
export interface GradeResult {
  compiled: boolean;
  ran: boolean;
  passed: boolean;
  compileError?: Diagnostic[];
  runtimeError?: string;
  results: CheckResult[];
}

export function lastState(t: Trace): StateSample | undefined {
  return t.states[t.states.length - 1];
}

/** Compile, run the scenario (scripting the gamepad over the stream protocol), and collect the trace. */
export async function runScenario(source: string, scenario: Scenario, opts: { sandbox?: "docker" | "none" } = {}): Promise<Trace> {
  const c = await compile(source);
  if (!c.ok) return { states: [], telemetry: {}, compileError: c.diagnostics };

  const runId = randomUUID();
  const child = spawnWorker(c.outDir!, c.className!, "stream", scenario.durationMs + 2000, { sandbox: opts.sandbox ?? "none", runId });
  const states: StateSample[] = [];
  let runtimeError: string | undefined;
  let buf = "";
  child.stdout!.on("data", (d) => {
    buf += d.toString();
    let i;
    while ((i = buf.indexOf("\n")) >= 0) {
      const line = buf.slice(0, i).trim();
      buf = buf.slice(i + 1);
      if (!line.startsWith("{")) continue;
      try {
        const o: any = JSON.parse(line);
        if (o.type === "started" || o.type === "state") beginTimeline();
        if (o.type === "state") states.push(o as StateSample);
        else if (o.type === "runtimeError" || o.type === "error" || o.type === "timeout") runtimeError = o.message;
      } catch { }
    }
  });
  child.stderr!.on("data", () => { });

  const send = (g: GamepadInput) => {
    try { child.stdin!.write(`g1 ${g.lx ?? 0} ${g.ly ?? 0} ${g.rx ?? 0} ${g.ry ?? 0}\n`); } catch { }
  };
  // The worker (especially in a Docker container) starts ~1s after spawn. Align the scripted
  // gamepad timeline to its first "started"/state signal so timed inputs land while it's
  // actually reading stdin — not buffered before it boots.
  const timers: ReturnType<typeof setTimeout>[] = [];
  let timelineStarted = false;
  function beginTimeline() {
    if (timelineStarted) return;
    timelineStarted = true;
    for (const step of scenario.steps) timers.push(setTimeout(() => send(step.g1), step.atMs));
    timers.push(setTimeout(() => { try { child.stdin!.write("stop\n"); } catch { } }, scenario.durationMs));
  }

  await new Promise<void>((resolve) => {
    const killT = setTimeout(() => {
      try { child.kill("SIGKILL"); } catch { }
      if (opts.sandbox === "docker") killSandbox(runId);
    }, scenario.durationMs + 15000);
    child.on("close", () => { clearTimeout(killT); resolve(); });
    child.on("error", () => { clearTimeout(killT); resolve(); });
  });
  timers.forEach(clearTimeout);
  await cleanup(c.dir);

  let telemetry: Record<string, string> = {};
  for (const s of states) if (s.telemetry && Object.keys(s.telemetry).length) telemetry = s.telemetry;
  return { states, telemetry, runtimeError };
}

/** Run a student's submission against a lesson and decide pass/fail per check. */
export async function gradeLesson(lesson: Lesson, source: string, opts: { sandbox?: "docker" | "none" } = {}): Promise<GradeResult> {
  if (!lesson.scenario || !lesson.checks) {
    return { compiled: false, ran: false, passed: false, results: [] };
  }
  const trace = await runScenario(source, lesson.scenario, opts);
  if (trace.compileError) {
    return { compiled: false, ran: false, passed: false, compileError: trace.compileError, results: [] };
  }
  const results: CheckResult[] = lesson.checks.map((c) => {
    let pass = false;
    try { pass = c.test(trace); } catch { pass = false; }
    return { id: c.id, label: c.label, hint: c.hint, pass };
  });
  const passed = !trace.runtimeError && results.length > 0 && results.every((r) => r.pass);
  return { compiled: true, ran: !trace.runtimeError, passed, runtimeError: trace.runtimeError, results };
}
