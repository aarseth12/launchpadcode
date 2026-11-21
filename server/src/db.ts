import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// One SQLite file under server/data — the single source of truth for student work.
// Back it up by copying this file; restore by dropping it back. (See server/.env / .gitignore.)
const HERE = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(HERE, "..", "data");
mkdirSync(DATA_DIR, { recursive: true });
export const DB_PATH = path.join(DATA_DIR, "app.db");

const db = new DatabaseSync(DB_PATH);
db.exec(`
  PRAGMA journal_mode = WAL;
  CREATE TABLE IF NOT EXISTS students (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    name       TEXT NOT NULL UNIQUE,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS progress (
    student_id INTEGER NOT NULL,
    lesson_id  TEXT NOT NULL,
    code       TEXT,
    passed     INTEGER NOT NULL DEFAULT 0,
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    PRIMARY KEY (student_id, lesson_id)
  );
  CREATE TABLE IF NOT EXISTS tutor_chats (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL,
    lesson_id  TEXT,
    role       TEXT NOT NULL,
    content    TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

export interface Student { id: number; name: string; }

const qGetByName = db.prepare("SELECT id, name FROM students WHERE name = ?");
const qInsertStudent = db.prepare("INSERT INTO students (name) VALUES (?)");
const qGetById = db.prepare("SELECT id, name FROM students WHERE id = ?");

/** Find a student by name, or create one. Pick-your-name login for a closed camp. */
export function loginStudent(name: string): Student {
  const trimmed = (name || "").trim().slice(0, 40);
  if (!trimmed) throw new Error("name required");
  const existing = qGetByName.get(trimmed) as Student | undefined;
  if (existing) return existing;
  const info = qInsertStudent.run(trimmed);
  return { id: Number(info.lastInsertRowid), name: trimmed };
}

export function getStudent(id: number): Student | undefined {
  return qGetById.get(id) as Student | undefined;
}

const qSaveCode = db.prepare(`
  INSERT INTO progress (student_id, lesson_id, code, updated_at)
  VALUES (?, ?, ?, datetime('now'))
  ON CONFLICT(student_id, lesson_id) DO UPDATE SET code = excluded.code, updated_at = datetime('now')
`);
export function saveCode(studentId: number, lessonId: string, code: string): void {
  qSaveCode.run(studentId, lessonId, code);
}

const qSetPassed = db.prepare(`
  INSERT INTO progress (student_id, lesson_id, passed, updated_at)
  VALUES (?, ?, 1, datetime('now'))
  ON CONFLICT(student_id, lesson_id) DO UPDATE SET passed = 1, updated_at = datetime('now')
`);
export function setPassed(studentId: number, lessonId: string): void {
  qSetPassed.run(studentId, lessonId);
}

const qGetProgress = db.prepare("SELECT lesson_id, code, passed FROM progress WHERE student_id = ?");
export function getProgress(studentId: number): Record<string, { code: string | null; passed: boolean }> {
  const rows = qGetProgress.all(studentId) as { lesson_id: string; code: string | null; passed: number }[];
  const out: Record<string, { code: string | null; passed: boolean }> = {};
  for (const r of rows) out[r.lesson_id] = { code: r.code, passed: !!r.passed };
  return out;
}

const qSaveChat = db.prepare("INSERT INTO tutor_chats (student_id, lesson_id, role, content) VALUES (?, ?, ?, ?)");
export function saveChat(studentId: number, lessonId: string | null, role: string, content: string): void {
  qSaveChat.run(studentId, lessonId, role, content);
}

// ---- Tutor rate-limiting counts (read straight from the persistent chat log, so the limits
// survive server restarts and page reloads — an in-memory counter would reset on both). ----
const qAsksLastMinute = db.prepare(
  "SELECT COUNT(*) AS c FROM tutor_chats WHERE student_id = ? AND role IN ('user','hint') AND created_at > datetime('now','-60 seconds')"
);
const qChatAsksForLesson = db.prepare(
  "SELECT COUNT(*) AS c FROM tutor_chats WHERE student_id = ? AND lesson_id = ? AND role = 'user'"
);
/** Tutor requests (chat asks + drill hints) by this student in the last 60 seconds. */
export function tutorAsksLastMinute(studentId: number): number {
  return (qAsksLastMinute.get(studentId) as { c: number }).c;
}
/** Chat-tutor asks by this student on one lesson (all time). */
export function tutorChatAsksForLesson(studentId: number, lessonId: string): number {
  return (qChatAsksForLesson.get(studentId, lessonId) as { c: number }).c;
}
