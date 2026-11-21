import type { ChildProcess } from "node:child_process";
import type { Diagnostic } from "./ftcSandbox.ts";
import type { TutorialStep, GradeResult } from "./grader.ts";

/**
 * The course-agnostic lesson shape the server serves and the tutor reads. Each course's own
 * lesson type extends this with its challenge data (FTC: a scenario + behavioural checks;
 * Python: expected output) — that extra data is read only inside that course's verify()/prepare().
 */
export interface CheckMeta { id: string; label: string; hint: string; }
export interface CourseLesson {
  id: string;
  order: number;
  title: string;
  concepts: string[];
  instructions: string;   // markdown
  starterCode?: string;
  tutorial?: TutorialStep[];
  checks?: CheckMeta[];    // labels the frontend shows; how they're evaluated is course-specific
  canvas?: boolean;        // the workspace shows the drawing canvas (Python `draw` lessons)
}

/**
 * A Course bundles everything language/domain-specific behind one interface so the server,
 * tutor, and frontend stay course-agnostic. FTC is the first course; Python plugs in as a
 * second by implementing this same shape (a console runtime + stdout/pytest verifier).
 */

export interface CourseMeta {
  id: string;              // stable slug; also the lesson-id namespace ("ftc", "python")
  title: string;          // shown on the landing card + workspace header
  subtitle?: string;      // one line for the landing card
  language: string;       // code-fence language + highlighter key ("java", "python")
  editorFilename: string; // the editor panel heading ("OpMode.java", "main.py")
  runPanel: "sim" | "console"; // which right-pane the frontend mounts
}

/**
 * A compiled/prepared submission ready to launch. `launch` spawns the worker process and
 * `cleanup` removes its temp build dir — mirroring exactly what the WS run-loop needs to
 * stream a run, without the server knowing whether it's a JVM worker or a Python interpreter.
 */
export interface PreparedRun {
  runId: string;
  sandbox: "docker" | "none";
  label?: string;          // e.g. the Java class name — surfaced to the student as "running: X"
  launch: () => ChildProcess;
  cleanup: () => void;
}
export type PrepareResult =
  | { ok: false; diagnostics: Diagnostic[] }
  | ({ ok: true } & PreparedRun);

/** The two Haiku system prompts + the code-fence language for this course's tutor. */
export interface TutorConfig { chatSystem: string; hintSystem: string; fence: string; }

export interface RunOpts { sandbox: "docker" | "none"; runId: string; }

/**
 * Optional persistent per-student runtime. When a course provides this, the server keeps ONE
 * long-lived container per connection and `exec`s each run into it (no per-run create/destroy
 * churn). Courses without it fall back to the per-run prepare()/verify() path. The handle is
 * opaque to the server — the course hands it back to its own methods.
 */
export interface CourseSession {
  start(runId: string): Promise<unknown>;                                   // create the student's container
  exec(handle: unknown, source: string): Promise<ChildProcess>;             // live run — streams framed JSON
  interrupt(handle: unknown): Promise<void>;                                // stop the current run (container stays warm)
  grade(handle: unknown, lesson: CourseLesson, source: string): Promise<GradeResult>; // run-to-completion + checks
  destroy(handle: unknown): void;                                           // remove the container (on disconnect)
}

export interface Course {
  meta: CourseMeta;
  lessons: CourseLesson[];
  lessonById(id: string): CourseLesson | undefined;
  /** Does this lesson have a gradeable practice challenge? (FTC: a scenario + checks.) */
  hasChallenge(lesson: CourseLesson): boolean;
  /** Compile/prepare a submission for a live run, or return compile diagnostics. */
  prepare(source: string, opts: RunOpts): Promise<PrepareResult>;
  /** Grade a submission against a lesson's challenge. */
  verify(lesson: CourseLesson, source: string, opts: { sandbox: "docker" | "none" }): Promise<GradeResult>;
  tutor: TutorConfig;
  /** Optional: a persistent per-student container runtime (used instead of prepare()/verify() when present). */
  session?: CourseSession;
}
