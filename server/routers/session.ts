import { z } from "zod";
import * as cheerio from "cheerio";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import {
  createSession,
  updateSession,
  getSessionById,
  getSessionByCode,
  getSessionsByUser,
  deleteSession,
  submitResponse,
  getResponsesForSession,
  getResponsesForQuestion,
  hasStudentResponded,
  getParticipantCount,
} from "../db";
import type { Question } from "../../drizzle/schema";

// ── Zod schemas ───────────────────────────────────────────────────────────────

const QuestionSchema = z.object({
  id: z.string(),
  type: z.enum(["Text", "Multiple Choice", "File Upload", "Star Rating", "True / False"]),
  text: z.string(),
  color: z.string(),
  options: z.array(z.string()).optional(),
  correctIndex: z.number().optional(),
  tfAnswer: z.enum(["True", "False"]).optional(),
  modelAnswer: z.string().optional(),
  presetSource: z.enum(["polling"]).optional(),
  mediaUrl: z.string().url().optional(),
});

export const sessionRouter = router({
  // ── URL fetcher ────────────────────────────────────────────────────────────
  fetchUrl: publicProcedure
    .input(z.object({ url: z.string().url() }))
    .mutation(async ({ input }) => {
      const res = await fetch(input.url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (compatible; SessionBuilder/1.0; +https://sessionbuild.manus.space)",
          Accept: "text/html,application/xhtml+xml,*/*;q=0.8",
        },
        signal: AbortSignal.timeout(10_000),
      });

      if (!res.ok) throw new Error(`Failed to fetch URL: HTTP ${res.status}`);

      const contentType = res.headers.get("content-type") ?? "";
      if (!contentType.includes("html")) {
        const text = await res.text();
        return { text: text.slice(0, 12_000) };
      }

      const html = await res.text();
      const $ = cheerio.load(html);
      $(
        "script, style, noscript, nav, footer, header, aside, [role=navigation], [role=banner], [role=complementary], .nav, .navbar, .footer, .header, .sidebar, .menu, .cookie, .ad, .advertisement"
      ).remove();

      const container =
        $("article").first().text() ||
        $("main").first().text() ||
        $("body").text();

      const cleaned = container.replace(/\s+/g, " ").trim().slice(0, 12_000);
      if (!cleaned) throw new Error("No readable text found on that page.");
      return { text: cleaned };
    }),

  // ── Session CRUD ───────────────────────────────────────────────────────────

  /**
   * Save (create or update) a session.
   * NOTE: Auth is optional — works without login for testing.
   * When logged in, sessions are owned by the user; otherwise userId is null.
   */
  save: publicProcedure
    .input(
      z.object({
        id: z.number().optional(),
        name: z.string().min(1).max(255),
        questions: z.array(QuestionSchema),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const userId = (ctx as { user?: { id: number } }).user?.id ?? null;
      if (input.id) {
        const existing = await getSessionById(input.id);
        if (!existing) throw new Error("Session not found");
        const updated = await updateSession(input.id, {
          name: input.name,
          questions: input.questions as Question[],
        });
        return { id: updated!.id, code: updated!.code };
      }
      const result = await createSession({
        userId,
        name: input.name,
        questions: input.questions as Question[],
      });
      if (!result) throw new Error("Failed to create session");
      return result;
    }),

  /** List sessions — returns all sessions (no-auth mode) or user's sessions (logged in) */
  list: publicProcedure.query(async ({ ctx }) => {
    const userId = (ctx as { user?: { id: number } }).user?.id ?? null;
    return getSessionsByUser(userId);
  }),

  /** Get a single session by id */
  get: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const session = await getSessionById(input.id);
      if (!session) throw new Error("Session not found");
      return session;
    }),

  /** Delete a session and all its responses */
  delete: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const session = await getSessionById(input.id);
      if (!session) throw new Error("Session not found");
      await deleteSession(input.id);
      return { success: true };
    }),

  // ── Live Mode ──────────────────────────────────────────────────────────────

  /** Launch a session (set status to live, record launchedAt) */
  launch: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const session = await getSessionById(input.id);
      if (!session) throw new Error("Session not found");
      return updateSession(input.id, {
        status: "live",
        currentQuestionIndex: 0,
        launchedAt: new Date(),
      });
    }),

  /** Close a session */
  close: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const session = await getSessionById(input.id);
      if (!session) throw new Error("Session not found");
      return updateSession(input.id, {
        status: "closed",
        closedAt: new Date(),
      });
    }),

  /** Reactivate a closed session back to draft so it can be edited and re-launched */
  reactivate: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const session = await getSessionById(input.id);
      if (!session) throw new Error("Session not found");
      if (session.status !== "closed") throw new Error("Only closed sessions can be reactivated");
      return updateSession(input.id, {
        status: "draft",
        closedAt: null,
        launchedAt: null,
        currentQuestionIndex: 0,
      });
    }),

  /** Advance to the next question in live mode */
  nextQuestion: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const session = await getSessionById(input.id);
      if (!session) throw new Error("Session not found");
      const questions = (session.questions as Question[]) ?? [];
      const next = Math.min(session.currentQuestionIndex + 1, questions.length - 1);
      return updateSession(input.id, { currentQuestionIndex: next });
    }),

  /** Go back to the previous question */
  prevQuestion: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const session = await getSessionById(input.id);
      if (!session) throw new Error("Session not found");
      const prev = Math.max(session.currentQuestionIndex - 1, 0);
      return updateSession(input.id, { currentQuestionIndex: prev });
    }),

  /** Professor polls for latest session state + response counts (live mode) */
  liveState: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const session = await getSessionById(input.id);
      if (!session) throw new Error("Session not found");
      const allResponses = await getResponsesForSession(input.id);
      return { session, responses: allResponses };
    }),

  // ── Student-facing (public, no auth) ──────────────────────────────────────

  /** Look up a session by join code — returns public info only */
  joinByCode: publicProcedure
    .input(z.object({ code: z.string().min(4).max(6) }))
    .mutation(async ({ input }) => {
      const session = await getSessionByCode(input.code);
      if (!session) throw new Error("Session not found. Check your code and try again.");
      if (session.status === "closed") throw new Error("This session has already ended.");
      const questions = (session.questions as Question[]) ?? [];
      return {
        id: session.id,
        name: session.name,
        code: session.code,
        status: session.status,
        currentQuestionIndex: session.currentQuestionIndex,
        questionCount: questions.length,
        currentQuestion: questions[session.currentQuestionIndex] ?? null,
      };
    }),

  /** Poll for the current question in a live session (students call this) */
  studentPoll: publicProcedure
    .input(z.object({ sessionId: z.number() }))
    .query(async ({ input }) => {
      const session = await getSessionById(input.sessionId);
      if (!session) throw new Error("Session not found");
      const questions = (session.questions as Question[]) ?? [];
      return {
        status: session.status,
        currentQuestionIndex: session.currentQuestionIndex,
        questionCount: questions.length,
        currentQuestion: questions[session.currentQuestionIndex] ?? null,
      };
    }),

  /** Submit a student response */
  submitResponse: publicProcedure
    .input(
      z.object({
        sessionId: z.number(),
        questionId: z.string(),
        studentId: z.string().min(1).max(64),
        studentName: z.string().max(128).optional(),
        answer: z.string().min(1).max(4000),
      })
    )
    .mutation(async ({ input }) => {
      const session = await getSessionById(input.sessionId);
      if (!session) throw new Error("Session not found");
      if (session.status !== "live") throw new Error("Session is not live");

      const alreadyAnswered = await hasStudentResponded(
        input.sessionId,
        input.questionId,
        input.studentId
      );
      if (alreadyAnswered) throw new Error("You have already answered this question");

      await submitResponse({
        sessionId: input.sessionId,
        questionId: input.questionId,
        studentId: input.studentId,
        studentName: input.studentName ?? null,
        answer: input.answer,
      });
      return { success: true };
    }),

  // ── CSV Export ────────────────────────────────────────────────────────────

  exportCsv: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const session = await getSessionById(input.id);
      if (!session) throw new Error("Session not found");

      const questions = (session.questions as Question[]) ?? [];
      const qMap = new Map(questions.map((q) => [q.id, q]));
      const allResponses = await getResponsesForSession(input.id);

      const header = ["Question #", "Question Text", "Question Type", "Student ID", "Answer", "Submitted At"];
      const rows = allResponses.map((r) => {
        const q = qMap.get(r.questionId);
        const qIndex = q ? questions.indexOf(q) + 1 : "?";
        const qText = q?.text ?? r.questionId;
        const qType = q?.type ?? "Unknown";
        const submittedAt = r.createdAt ? new Date(r.createdAt).toISOString() : "";
        const escape = (v: string | number) => {
          const s = String(v);
          if (s.includes(",") || s.includes('"') || s.includes("\n")) {
            return `"${s.replace(/"/g, '""')}"`;
          }
          return s;
        };
        return [qIndex, qText, qType, r.studentId, r.answer, submittedAt].map(escape).join(",");
      });

      const csv = [header.join(","), ...rows].join("\n");
      return { csv, sessionName: session.name, totalResponses: allResponses.length };
    }),

  // ── Session Results (closed sessions) ─────────────────────────────────────

  results: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const session = await getSessionById(input.id);
      if (!session) throw new Error("Session not found");

      const questions = (session.questions as Question[]) ?? [];
      const allResponses = await getResponsesForSession(input.id);
      const participantCount = await getParticipantCount(input.id);

      const questionResults = questions.map((q) => {
        const qResponses = allResponses.filter((r) => r.questionId === q.id);
        const tally: Record<string, number> = {};
        for (const r of qResponses) {
          tally[r.answer] = (tally[r.answer] ?? 0) + 1;
        }
        return {
          question: q,
          total: qResponses.length,
          tally,
          rawAnswers: q.type === "Text" ? qResponses.map((r) => r.answer) : [],
        };
      });

      return {
        session,
        questionResults,
        totalResponses: allResponses.length,
        participantCount,
      };
    }),

  // ── Duplicate Session ──────────────────────────────────────────────────────

  /** Duplicate a session as a new draft, copying all questions */
  duplicate: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const source = await getSessionById(input.id);
      if (!source) throw new Error("Session not found");
      const userId = (ctx as { user?: { id: number } }).user?.id ?? null;
      const questions = (source.questions as Question[]) ?? [];
      // Give each question a fresh id so there are no collisions
      const newQuestions = questions.map((q) => ({
        ...q,
        id: Math.random().toString(36).slice(2, 9),
      }));
      const result = await createSession({
        userId,
        name: `${source.name} (Copy)`,
        questions: newQuestions as Question[],
      });
      if (!result) throw new Error("Failed to duplicate session");
      return result;
    }),

  // ── Participant Count ─────────────────────────────────────────────────────

  participantCount: publicProcedure
    .input(z.object({ sessionId: z.number() }))
    .query(async ({ input }) => {
      const count = await getParticipantCount(input.sessionId);
      return { count };
    }),

  /** Get response counts per question for a live session (professor) */
  responseCounts: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const session = await getSessionById(input.id);
      if (!session) throw new Error("Session not found");
      const questions = (session.questions as Question[]) ?? [];
      const allResponses = await getResponsesForSession(input.id);

      return questions.map((q) => {
        const qResponses = allResponses.filter((r) => r.questionId === q.id);
        const tally: Record<string, number> = {};
        for (const r of qResponses) {
          tally[r.answer] = (tally[r.answer] ?? 0) + 1;
        }
        return {
          questionId: q.id,
          questionText: q.text,
          type: q.type,
          total: qResponses.length,
          tally,
          responses: qResponses,
        };
      });
    }),
});
