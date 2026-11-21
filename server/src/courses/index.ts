import type { Course } from "../course.ts";
import { ftcCourse } from "./ftc.ts";
import { pythonCourse } from "./python.ts";

/**
 * The registry of available courses. Add a course by implementing the Course interface and
 * listing it here — the server, tutor, and landing page pick it up automatically.
 * Order is the display order on the landing page.
 */
export const COURSES: Course[] = [ftcCourse, pythonCourse];

/** The course a request falls back to when none is specified (keeps existing FTC URLs working). */
export const DEFAULT_COURSE_ID = "ftc";

const byId = new Map(COURSES.map((c) => [c.meta.id, c]));
export function courseById(id: string): Course | undefined { return byId.get(id); }
export function defaultCourse(): Course { return byId.get(DEFAULT_COURSE_ID)!; }
