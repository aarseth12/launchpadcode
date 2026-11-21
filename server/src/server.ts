import http from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { WebSocketServer, type WebSocket } from "ws";
import { randomUUID } from "node:crypto";
import type { ChildProcess } from "node:child_process";
import { killSandbox } from "./ftcSandbox.ts";
import { sweepLeakedContainers } from "./pySandbox.ts";
import { streamTutor, tutorConfigured, hintForAttempt } from "./tutor.ts";
import { COURSES, courseById, defaultCourse, DEFAULT_COURSE_ID } from "./courses/index.ts";
import { loginStudent, getProgress, saveCode, setPassed, saveChat, tutorAsksLastMinute, tutorChatAsksForLesson } from "./db.ts";
import { readFileSync, existsSync } from "node:fs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const WEB_ROOT = path.resolve(HERE, "..", "..", "web");
const PORT = 8090;
const SANDBOX: "docker" | "none" = process.env.FTC_SANDBOX === "none" ? "none" : "docker";

// Tutor rate limits (per student). Middle-schoolers spam the Ask button and every call is a real
// Haiku request; counts come from the persistent tutor_chats log so the limits survive server
// restarts and page reloads (an in-memory counter would reset on both).
const ASKS_PER_MIN = 3;      // burst guard, shared across chat asks + drill hints
const ASKS_PER_LESSON = 20;  // total chat-tutor asks per lesson

/** null = allowed; otherwise a friendly, kid-appropriate block message for the chat tutor. */
function chatTutorBlock(studentId: number | undefined, lessonId: string | undefined): string | null {
  if (!studentId) return null; // not signed in — can't attribute; don't block
  if (tutorAsksLastMinute(studentId) >= ASKS_PER_MIN)
    return "⏳ Whoa, slow down! Take a minute to try it yourself, then ask again.";
  if (lessonId && tutorChatAsksForLesson(studentId, lessonId) >= ASKS_PER_LESSON)
    return "✋ You've used all your tutor hints for this lesson — give the challenge a try, or ask your coach!";
  return null;
}

// Minimal .env loader (no dependency): make server/.env's ANTHROPIC_API_KEY available.
const ENV_PATH = path.resolve(HERE, "..", ".env");
if (existsSync(ENV_PATH)) {
  for (const line of readFileSync(ENV_PATH, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

const MIME: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".ico": "image/x-icon",
};

function readBody(req: http.IncomingMessage): Promise<string> {
  return new Promise((resolve) => {
    let b = ""; req.on("data", (c) => (b += c)); req.on("end", () => resolve(b));
  });
}

const server = http.createServer(async (req, res) => {
  try {
    let urlPath = decodeURIComponent((req.url || "/").split("?")[0]);
    if (urlPath === "/") urlPath = "/home.html";
    if (urlPath === "/api/courses") {
      const data = COURSES.map((c) => ({
        id: c.meta.id, title: c.meta.title, subtitle: c.meta.subtitle,
        language: c.meta.language, runPanel: c.meta.runPanel, editorFilename: c.meta.editorFilename,
        lessonCount: c.lessons.filter((l) => c.hasChallenge(l)).length,
      }));
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(data));
      return;
    }
    if (urlPath === "/api/lessons") {
      const cid = new URL(req.url!, "http://x").searchParams.get("course") ?? DEFAULT_COURSE_ID;
      const course = courseById(cid) ?? defaultCourse();
      const data = course.lessons.map((l) => ({
        id: l.id, order: l.order, title: l.title, concepts: l.concepts,
        instructions: l.instructions, starterCode: l.starterCode, tutorial: l.tutorial, canvas: l.canvas,
        checks: (l.checks || []).map((c) => ({ id: c.id, label: c.label })),
      }));
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(data));
      return;
    }
    if (urlPath === "/api/login" && req.method === "POST") {
      let name = "";
      try { name = String(JSON.parse(await readBody(req)).name ?? ""); } catch { }
      try {
        const student = loginStudent(name);
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(student));
      } catch {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "name required" }));
      }
      return;
    }
    if (urlPath === "/api/progress") {
      const sid = Number(new URL(req.url!, "http://x").searchParams.get("student"));
      const data = Number.isFinite(sid) && sid > 0 ? getProgress(sid) : {};
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(data));
      return;
    }
    // Haiku coaching for a wrong "type it out" attempt. Returns {hint:""} when the key is
    // missing or the call fails, so the page falls back to the lesson's built-in hint.
    if (urlPath === "/api/hint" && req.method === "POST") {
      let hint = "";
      if (tutorConfigured()) {
        let body: any = {};
        try { body = JSON.parse(await readBody(req)); } catch { }
        const course = courseById(String(body.course ?? DEFAULT_COURSE_ID)) ?? defaultCourse();
        const sid = Number(body.student);
        const studentId = Number.isFinite(sid) && sid > 0 ? sid : undefined;
        const lessonId = body.lessonId ? String(body.lessonId) : null;
        // Same per-minute burst guard as the chat tutor (shared budget via tutor_chats). Over the
        // limit → return no hint, so the drill quietly falls back to its built-in static hint (no
        // error shown, no Haiku call). Successful hints are logged so they count toward the window.
        const overLimit = studentId ? tutorAsksLastMinute(studentId) >= ASKS_PER_MIN : false;
        if (!overLimit) {
          try {
            hint = await hintForAttempt({
              prompt: String(body.prompt ?? "").slice(0, 400),
              expected: String(body.expected ?? "").slice(0, 400),
              attempt: String(body.attempt ?? "").slice(0, 400),
            }, course.tutor.hintSystem);
            if (hint && studentId) saveChat(studentId, lessonId, "hint", String(body.attempt ?? "").slice(0, 400));
          } catch (e: any) { console.error("[/api/hint] Haiku call failed (student falls back to the static hint):", e?.message ?? e); hint = ""; }
        }
      }
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ hint }));
      return;
    }
    const filePath = path.join(WEB_ROOT, path.normalize(urlPath));
    if (!filePath.startsWith(WEB_ROOT)) { res.writeHead(403); res.end("Forbidden"); return; }
    const body = await readFile(filePath);
    res.writeHead(200, { "Content-Type": MIME[path.extname(filePath)] ?? "application/octet-stream" });
    res.end(body);
  } catch {
    res.writeHead(404); res.end("Not found");
  }
});

const wss = new WebSocketServer({ server, path: "/ws" });

function num(v: any): number { const n = Number(v); return Number.isFinite(n) ? Math.max(-1, Math.min(1, n)) : 0; }

wss.on("connection", (ws: WebSocket) => {
  let worker: ChildProcess | null = null;    // current run's child (docker run for FTC, docker exec for a session)
  let workCleanup: (() => void) | undefined; // FTC per-run temp-dir cleanup
  let session: unknown = null;               // persistent per-student container handle (session courses only)
  let closed = false;
  let buf = "";
  let runId: string | undefined;
  let studentId: number | undefined;
  let course = defaultCourse(); // set from the `hello` message; FTC by default

  const send = (obj: any) => { try { ws.send(JSON.stringify(obj)); } catch { } };

  // Forward a run child's framed-JSON stdout to the client; announce "ended" when it exits.
  const wireStream = (w: ChildProcess) => {
    w.stdout!.on("data", (d) => {
      buf += d.toString();
      let i;
      while ((i = buf.indexOf("\n")) >= 0) {
        const line = buf.slice(0, i).trim();
        buf = buf.slice(i + 1);
        if (line.startsWith("{")) { try { ws.send(line); } catch { } } // forward worker JSON verbatim
      }
    });
    w.on("close", () => {
      send({ type: "status", state: "ended" });
      if (worker === w) worker = null;
      if (!course.session && workCleanup) { workCleanup(); workCleanup = undefined; } // FTC per-run cleanup
    });
  };

  // FTC per-run teardown: kill the docker-run worker + remove its container + temp dir.
  const stopWorker = () => {
    if (worker) {
      const w = worker;
      worker = null;
      try { w.stdin?.write("stop\n"); } catch { }
      setTimeout(() => { try { w.kill("SIGKILL"); } catch { } }, 500);
    }
    if (runId) { if (SANDBOX === "docker") killSandbox(runId); runId = undefined; }
    if (workCleanup) { workCleanup(); workCleanup = undefined; }
  };

  // Container work (start, Run, Check) runs one operation at a time per student. Messages are handled
  // concurrently, and overlapping operations used to start a second container (orphaning the first) or
  // share /tmp/prog.py and kill each other's program — so a Run clicked mid-Check now waits its turn.
  let sandboxQueue: Promise<unknown> = Promise.resolve();
  const inSandbox = <T>(work: () => Promise<T>): Promise<T> => {
    const p = sandboxQueue.then(work, work);
    sandboxQueue = p.catch(() => { });
    return p;
  };

  // The student's container, created on first use (only ever called inside inSandbox, so never twice).
  // A start that finishes after the student disconnects is removed straight away.
  const ensureSession = async (): Promise<unknown> => {
    if (session) return session;
    if (closed) throw new Error("disconnected");
    const sess = course.session!;
    const s = await sess.start(randomUUID());
    if (closed) { sess.destroy(s); throw new Error("disconnected"); }
    session = s;
    return s;
  };

  // Stop just the current run. Session courses keep the container warm (kill only the program inside);
  // per-run courses (FTC) tear the whole thing down.
  const stopRun = async () => {
    if (course.session) {
      if (worker) { const w = worker; worker = null; try { w.kill("SIGKILL"); } catch { } }
      if (session) await course.session.interrupt(session);
    } else {
      stopWorker();
    }
  };

  ws.on("message", async (data) => {
    let msg: any;
    try { msg = JSON.parse(data.toString()); } catch { return; }

    if (msg.type === "hello") {
      const sid = Number(msg.student);
      studentId = Number.isFinite(sid) && sid > 0 ? sid : undefined;
      course = courseById(String(msg.course ?? DEFAULT_COURSE_ID)) ?? defaultCourse();
      return;
    }
    if (msg.type === "save") {
      if (studentId) saveCode(studentId, String(msg.lessonId ?? ""), String(msg.code ?? ""));
      return;
    }
    if (msg.type === "run") {
      if (course.session) {
        // --- persistent per-student container: exec into it (no per-run create/destroy churn) ---
        const sess = course.session;
        await inSandbox(async () => {
          if (worker) { const w = worker; worker = null; try { w.kill("SIGKILL"); } catch { } }
          try {
            if (!session) send({ type: "status", state: "compiling" });
            const s = await ensureSession();
            await sess.interrupt(s);
            buf = "";
            worker = await sess.exec(s, String(msg.source ?? ""));
            send({ type: "status", state: "running", className: course.meta.editorFilename });
            wireStream(worker);
          } catch {
            send({ type: "runtimeError", message: "Could not start your sandbox — press Run again in a moment." });
          }
        });
        return;
      }
      // --- per-run model (FTC): compile on the host, then a fresh docker run ---
      stopWorker();
      send({ type: "status", state: "compiling" });
      runId = randomUUID();
      const prep = await course.prepare(String(msg.source ?? ""), { sandbox: SANDBOX, runId });
      if (!prep.ok) { send({ type: "compileError", diagnostics: prep.diagnostics }); runId = undefined; return; }
      workCleanup = prep.cleanup;
      buf = "";
      worker = prep.launch();
      send({ type: "status", state: "running", className: prep.label });
      wireStream(worker);
    } else if (msg.type === "gamepad" && worker) {
      const g = msg.g1 ?? {};
      try { worker.stdin?.write(`g1 ${num(g.lx)} ${num(g.ly)} ${num(g.rx)} ${num(g.ry)}\n`); } catch { }
    } else if (msg.type === "stdin" && worker) {
      try { worker.stdin?.write(String(msg.text ?? "") + "\n"); } catch { } // feed the student's input() answer
    } else if (msg.type === "stop") {
      await stopRun();
      send({ type: "status", state: "stopped" });
    } else if (msg.type === "grade") {
      if (!course.session) await stopRun(); // session courses stop the run inside their sandbox turn
      const lesson = course.lessonById(String(msg.lessonId ?? ""));
      if (!lesson) { send({ type: "gradeResult", error: "unknown lesson" }); return; }
      if (!course.hasChallenge(lesson)) { send({ type: "gradeResult", error: "this lesson has no practice challenge" }); return; }
      send({ type: "status", state: "grading" });
      let result;
      if (course.session) {
        const sess = course.session;
        try {
          result = await inSandbox(async () => { await stopRun(); return sess.grade(await ensureSession(), lesson, String(msg.source ?? "")); });
        } catch {
          send({ type: "gradeResult", lessonId: lesson.id, error: "Could not start your sandbox — press Check again in a moment." });
          return;
        }
      } else {
        result = await course.verify(lesson, String(msg.source ?? ""), { sandbox: SANDBOX });
      }
      if (studentId) { saveCode(studentId, lesson.id, String(msg.source ?? "")); if (result.passed) setPassed(studentId, lesson.id); }
      send({ type: "gradeResult", lessonId: lesson.id, ...result });
    } else if (msg.type === "gradeStep") {
      // Grade a runnable walkthrough mini-exercise (`code` step) against its own expect/inputs.
      const lesson = course.lessonById(String(msg.lessonId ?? ""));
      const step: any = (lesson?.tutorial ?? []).find((s: any) => s.kind === "code" && s.id === msg.stepId);
      if (!step || !course.session) { send({ type: "stepResult", stepId: msg.stepId, passed: false, results: [] }); return; }
      send({ type: "status", state: "grading" });
      const sess = course.session;
      const pseudo: any = { id: lesson!.id + ":" + step.id, expect: step.expect, inputs: step.inputs };
      try {
        const result = await inSandbox(async () => { await stopRun(); return sess.grade(await ensureSession(), pseudo, String(msg.source ?? "")); });
        send({ type: "stepResult", stepId: step.id, ...result });
      } catch {
        send({ type: "stepResult", stepId: step.id, passed: false, results: [], error: "Could not start your sandbox — press Check again in a moment." });
      }
    } else if (msg.type === "tutor") {
      if (!tutorConfigured()) {
        send({ type: "tutorError", message: "Tutor isn't configured — add ANTHROPIC_API_KEY to server/.env and restart." });
        return;
      }
      const lessonId = msg.lessonId ? String(msg.lessonId) : undefined;
      const blocked = chatTutorBlock(studentId, lessonId);
      if (blocked) { send({ type: "tutorError", message: blocked, limited: true }); return; }
      try {
        const question = String(msg.question ?? "");
        const lesson = lessonId ? course.lessonById(lessonId) : undefined;
        const reply = await streamTutor({
          lesson: lesson ? { title: lesson.title, instructions: lesson.instructions, checks: lesson.checks } : undefined,
          code: String(msg.code ?? ""),
          output: msg.output ? String(msg.output) : undefined,
          history: Array.isArray(msg.history) ? msg.history : [],
          question,
        }, { system: course.tutor.chatSystem, fence: course.tutor.fence }, (t) => send({ type: "tutorToken", text: t }));
        if (studentId) { saveChat(studentId, lessonId ?? null, "user", question); saveChat(studentId, lessonId ?? null, "assistant", reply); }
        send({ type: "tutorDone" });
      } catch (e: any) {
        send({ type: "tutorError", message: e?.message ?? "tutor error" });
      }
    }
  });

  // On disconnect: kill any run, and for session courses remove the student's whole container.
  const cleanupConnection = () => {
    closed = true;
    if (worker) { const w = worker; worker = null; try { w.kill("SIGKILL"); } catch { } }
    if (course.session) {
      if (session) { course.session.destroy(session); session = null; }
    } else {
      if (runId) { if (SANDBOX === "docker") killSandbox(runId); runId = undefined; }
      if (workCleanup) { workCleanup(); workCleanup = undefined; }
    }
  };
  ws.on("close", cleanupConnection);
  ws.on("error", cleanupConnection);
});

if (SANDBOX === "docker") sweepLeakedContainers(); // clear any sandbox containers left over from a crash
server.listen(PORT, () => console.log(`Launchpad Code server → http://localhost:${PORT}`));
