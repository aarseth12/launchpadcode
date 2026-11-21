import Anthropic from "@anthropic-ai/sdk";

// The student explicitly chose Haiku. Haiku 4.5 is $1 / $5 per 1M input/output tokens —
// a tutoring exchange runs a fraction of a cent. Effort/extended-thinking aren't supported
// on Haiku and aren't needed for syntax coaching, so we keep the call lean and stream.
//
// This module is course-agnostic: the system prompts + code-fence language come from the
// caller (a Course's tutor config), so the same coach machinery serves FTC Java, Python, etc.
const MODEL = "claude-haiku-4-5";

export interface TutorTurn { role: "user" | "assistant"; content: string; }
/** The slice of a lesson the chat tutor needs for context (course-independent). */
export interface TutorLessonCtx { title: string; instructions: string; checks?: { label: string }[]; }
export interface TutorRequest {
  lesson?: TutorLessonCtx;
  code: string;
  output?: string;
  history?: TutorTurn[];
  question: string;
}
/** Per-course prompt config for the chat tutor. */
export interface ChatPrompts { system: string; fence: string; }

let _client: Anthropic | null = null;
function client(): Anthropic { return (_client ??= new Anthropic()); } // reads ANTHROPIC_API_KEY lazily

export function tutorConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

/** Stream a Socratic tutor reply, assembling lesson + code + output context. Calls onToken per delta. */
export async function streamTutor(req: TutorRequest, prompts: ChatPrompts, onToken: (t: string) => void): Promise<string> {
  const context = [
    req.lesson ? `Lesson: ${req.lesson.title}\n${req.lesson.instructions}` : "",
    req.lesson ? `The auto-grader checks for:\n${(req.lesson.checks ?? []).map((c) => `- ${c.label}`).join("\n")}` : "",
    `The student's current code:\n\`\`\`${prompts.fence}\n${req.code}\n\`\`\``,
    req.output ? `The latest output the student is looking at:\n${req.output}` : "",
  ].filter(Boolean).join("\n\n");

  const history = (req.history ?? []).slice(-6).map((t) => ({ role: t.role, content: t.content }));
  const messages = [
    ...history,
    { role: "user" as const, content: `<context>\n${context}\n</context>\n\nStudent's question: ${req.question}` },
  ];

  let full = "";
  const stream = client().messages.stream({ model: MODEL, max_tokens: 1024, system: prompts.system, messages });
  stream.on("text", (delta: string) => { full += delta; onToken(delta); });
  await stream.finalMessage();
  return full;
}

// ---- Type-it-out coaching (guided practice drill) ----
// Much narrower than the chat tutor: the student typed ONE line slightly wrong; give ONE
// targeted fix-hint. The context is tiny on purpose (task + correct line + their attempt),
// so each call is a sliver of a cent on Haiku. The system prompt is supplied per-course.
export interface HintRequest { prompt: string; expected: string; attempt: string; }

/** One short, targeted hint when a type-it-out attempt is wrong. Non-streaming, tiny token budget. */
export async function hintForAttempt(req: HintRequest, system: string): Promise<string> {
  const user = `Task: ${req.prompt}\nThe correct line: ${req.expected}\nWhat the student typed: ${req.attempt}\n\nGive ONE short hint to fix their mistake. Do not paste the whole correct line.`;
  // Try twice: a transient API blip (or a rare empty reply) shouldn't drop the student to the
  // generic fallback. (The SDK already retries connection/5xx errors; this also re-rolls an empty reply.)
  let lastErr: unknown;
  for (let i = 0; i < 2; i++) {
    try {
      const msg = await client().messages.create({
        model: MODEL,
        max_tokens: 120,
        system,
        messages: [{ role: "user", content: user }],
      });
      const text = msg.content
        .filter((b: any) => b.type === "text")
        .map((b: any) => b.text)
        .join("")
        .trim();
      if (text) return text;
    } catch (e) {
      lastErr = e;
    }
  }
  if (lastErr) throw lastErr; // surface to the route so it logs and falls back
  return "";
}
