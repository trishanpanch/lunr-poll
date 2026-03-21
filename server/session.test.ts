/**
 * Tests for the session tRPC router.
 *
 * These tests use the router's createCaller API so they run entirely in-process
 * without a real HTTP server or database. DB helpers are mocked via vi.mock.
 */

import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// ── Mock all DB helpers ──────────────────────────────────────────────────────
vi.mock("./db", () => ({
  createSession: vi.fn(),
  updateSession: vi.fn(),
  getSessionById: vi.fn(),
  getSessionByCode: vi.fn(),
  getSessionsByUser: vi.fn(),
  deleteSession: vi.fn(),
  submitResponse: vi.fn(),
  getResponsesForSession: vi.fn(),
  getResponsesForQuestion: vi.fn(),
  hasStudentResponded: vi.fn(),
}));

import * as db from "./db";

// ── Helpers ──────────────────────────────────────────────────────────────────

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function makeUser(overrides: Partial<AuthenticatedUser> = {}): AuthenticatedUser {
  return {
    id: 1,
    openId: "prof-open-id",
    email: "prof@example.com",
    name: "Professor Test",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
    ...overrides,
  };
}

function makeCtx(user: AuthenticatedUser | null = makeUser()): TrpcContext {
  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

const sampleQuestion = {
  id: "q1",
  type: "Short Text" as const,
  text: "What did you learn today?",
  color: "oklch(0.48 0.18 264)",
};

const sampleSession = {
  id: 10,
  userId: 1,
  name: "Test Session",
  code: "ABCDE",
  status: "draft" as const,
  questions: [sampleQuestion],
  currentQuestionIndex: 0,
  launchedAt: null,
  closedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

// ── Tests ────────────────────────────────────────────────────────────────────

describe("session.save (create)", () => {
  beforeEach(() => vi.clearAllMocks());

  it("creates a new session and returns id + code", async () => {
    vi.mocked(db.createSession).mockResolvedValue({ id: 10, code: "ABCDE" });

    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.session.save({
      name: "Test Session",
      questions: [sampleQuestion],
    });

    expect(db.createSession).toHaveBeenCalledWith({
      userId: 1,
      name: "Test Session",
      questions: [sampleQuestion],
    });
    expect(result).toEqual({ id: 10, code: "ABCDE" });
  });

  it("throws when not authenticated", async () => {
    const caller = appRouter.createCaller(makeCtx(null));
    await expect(
      caller.session.save({ name: "X", questions: [] })
    ).rejects.toThrow();
  });
});

describe("session.save (update)", () => {
  beforeEach(() => vi.clearAllMocks());

  it("updates an existing session", async () => {
    vi.mocked(db.getSessionById).mockResolvedValue(sampleSession);
    vi.mocked(db.updateSession).mockResolvedValue({ ...sampleSession, name: "Updated" });

    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.session.save({
      id: 10,
      name: "Updated",
      questions: [sampleQuestion],
    });

    expect(db.updateSession).toHaveBeenCalledWith(10, {
      name: "Updated",
      questions: [sampleQuestion],
    });
    expect(result).toMatchObject({ id: 10, code: "ABCDE" });
  });

  it("throws when session not found", async () => {
    vi.mocked(db.getSessionById).mockResolvedValue(null);

    const caller = appRouter.createCaller(makeCtx());
    await expect(
      caller.session.save({ id: 99, name: "X", questions: [] })
    ).rejects.toThrow("Session not found");
  });
});

describe("session.list", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns sessions for the authenticated user", async () => {
    vi.mocked(db.getSessionsByUser).mockResolvedValue([sampleSession]);

    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.session.list();

    expect(db.getSessionsByUser).toHaveBeenCalledWith(1);
    expect(result).toHaveLength(1);
  });
});

describe("session.delete", () => {
  beforeEach(() => vi.clearAllMocks());

  it("deletes a session owned by the user", async () => {
    vi.mocked(db.getSessionById).mockResolvedValue(sampleSession);
    vi.mocked(db.deleteSession).mockResolvedValue(undefined);

    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.session.delete({ id: 10 });

    expect(db.deleteSession).toHaveBeenCalledWith(10);
    expect(result).toEqual({ success: true });
  });

  it("throws Forbidden when user does not own the session", async () => {
    vi.mocked(db.getSessionById).mockResolvedValue({ ...sampleSession, userId: 99 });

    const caller = appRouter.createCaller(makeCtx());
    await expect(caller.session.delete({ id: 10 })).rejects.toThrow("Forbidden");
  });
});

describe("session.launch", () => {
  beforeEach(() => vi.clearAllMocks());

  it("sets status to live and currentQuestionIndex to 0", async () => {
    vi.mocked(db.getSessionById).mockResolvedValue(sampleSession);
    vi.mocked(db.updateSession).mockResolvedValue({ ...sampleSession, status: "live" });

    const caller = appRouter.createCaller(makeCtx());
    await caller.session.launch({ id: 10 });

    expect(db.updateSession).toHaveBeenCalledWith(
      10,
      expect.objectContaining({ status: "live", currentQuestionIndex: 0 })
    );
  });
});

describe("session.close", () => {
  beforeEach(() => vi.clearAllMocks());

  it("sets status to closed", async () => {
    vi.mocked(db.getSessionById).mockResolvedValue(sampleSession);
    vi.mocked(db.updateSession).mockResolvedValue({ ...sampleSession, status: "closed" });

    const caller = appRouter.createCaller(makeCtx());
    await caller.session.close({ id: 10 });

    expect(db.updateSession).toHaveBeenCalledWith(
      10,
      expect.objectContaining({ status: "closed" })
    );
  });
});

describe("session.nextQuestion", () => {
  beforeEach(() => vi.clearAllMocks());

  it("advances to the next question index", async () => {
    const twoQSession = {
      ...sampleSession,
      questions: [sampleQuestion, { ...sampleQuestion, id: "q2", text: "Q2" }],
      currentQuestionIndex: 0,
    };
    vi.mocked(db.getSessionById).mockResolvedValue(twoQSession);
    vi.mocked(db.updateSession).mockResolvedValue({ ...twoQSession, currentQuestionIndex: 1 });

    const caller = appRouter.createCaller(makeCtx());
    await caller.session.nextQuestion({ id: 10 });

    expect(db.updateSession).toHaveBeenCalledWith(10, { currentQuestionIndex: 1 });
  });

  it("does not advance past the last question", async () => {
    const oneQSession = { ...sampleSession, currentQuestionIndex: 0 };
    vi.mocked(db.getSessionById).mockResolvedValue(oneQSession);
    vi.mocked(db.updateSession).mockResolvedValue(oneQSession);

    const caller = appRouter.createCaller(makeCtx());
    await caller.session.nextQuestion({ id: 10 });

    // questions.length - 1 = 0, so index stays at 0
    expect(db.updateSession).toHaveBeenCalledWith(10, { currentQuestionIndex: 0 });
  });
});

describe("session.joinByCode (student, public)", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns session info for a valid code", async () => {
    vi.mocked(db.getSessionByCode).mockResolvedValue({
      ...sampleSession,
      status: "live",
    });

    const caller = appRouter.createCaller(makeCtx(null)); // no auth needed
    const result = await caller.session.joinByCode({ code: "ABCDE" });

    expect(result).toMatchObject({ id: 10, code: "ABCDE", status: "live" });
  });

  it("throws when session is closed", async () => {
    vi.mocked(db.getSessionByCode).mockResolvedValue({ ...sampleSession, status: "closed" });

    const caller = appRouter.createCaller(makeCtx(null));
    await expect(caller.session.joinByCode({ code: "ABCDE" })).rejects.toThrow(
      "already ended"
    );
  });

  it("throws when code not found", async () => {
    vi.mocked(db.getSessionByCode).mockResolvedValue(null);

    const caller = appRouter.createCaller(makeCtx(null));
    await expect(caller.session.joinByCode({ code: "XXXXX" })).rejects.toThrow(
      "not found"
    );
  });
});

describe("session.submitResponse (student, public)", () => {
  beforeEach(() => vi.clearAllMocks());

  it("submits a response for a live session", async () => {
    vi.mocked(db.getSessionById).mockResolvedValue({ ...sampleSession, status: "live" });
    vi.mocked(db.hasStudentResponded).mockResolvedValue(false);
    vi.mocked(db.submitResponse).mockResolvedValue(undefined);

    const caller = appRouter.createCaller(makeCtx(null));
    const result = await caller.session.submitResponse({
      sessionId: 10,
      questionId: "q1",
      studentId: "stu-abc",
      answer: "I learned about tRPC",
    });

    expect(db.submitResponse).toHaveBeenCalled();
    expect(result).toEqual({ success: true });
  });

  it("throws when session is not live", async () => {
    vi.mocked(db.getSessionById).mockResolvedValue({ ...sampleSession, status: "draft" });

    const caller = appRouter.createCaller(makeCtx(null));
    await expect(
      caller.session.submitResponse({
        sessionId: 10,
        questionId: "q1",
        studentId: "stu-abc",
        answer: "answer",
      })
    ).rejects.toThrow("not live");
  });

  it("throws when student already answered", async () => {
    vi.mocked(db.getSessionById).mockResolvedValue({ ...sampleSession, status: "live" });
    vi.mocked(db.hasStudentResponded).mockResolvedValue(true);

    const caller = appRouter.createCaller(makeCtx(null));
    await expect(
      caller.session.submitResponse({
        sessionId: 10,
        questionId: "q1",
        studentId: "stu-abc",
        answer: "answer",
      })
    ).rejects.toThrow("already answered");
  });
});
