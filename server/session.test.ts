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
  getParticipantCount: vi.fn(),
  getStudentResponses: vi.fn(),
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
  type: "Text" as const,
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

  it("creates a session with null user (auth gate removed for testing)", async () => {
    vi.mocked(db.createSession).mockResolvedValue({ id: 10, code: "ABCDE" });
    const caller = appRouter.createCaller(makeCtx(null));
    // Auth gate was intentionally removed; null user should still create a session
    const result = await caller.session.save({ name: "X", questions: [] });
    expect(result).toEqual({ id: 10, code: "ABCDE" });
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

  it("deletes a session regardless of ownership (auth gate removed for testing)", async () => {
    vi.mocked(db.getSessionById).mockResolvedValue({ ...sampleSession, userId: 99 });
    vi.mocked(db.deleteSession).mockResolvedValue(undefined);

    const caller = appRouter.createCaller(makeCtx());
    // Auth gate was intentionally removed; ownership check is not enforced
    const result = await caller.session.delete({ id: 10 });
    expect(result).toEqual({ success: true });
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

describe("session.exportCsv", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns CSV string with header and response rows", async () => {
    vi.mocked(db.getSessionById).mockResolvedValue(sampleSession);
    vi.mocked(db.getResponsesForSession).mockResolvedValue([
      {
        id: 1,
        sessionId: 10,
        questionId: "q1",
        studentId: "stu-1",
        answer: "I learned tRPC",
        submittedAt: new Date("2026-01-01T12:00:00Z"),
      },
    ]);

    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.session.exportCsv({ id: 10 });

    expect(result.totalResponses).toBe(1);
    expect(result.csv).toContain("Question Text");
    expect(result.csv).toContain("I learned tRPC");
    expect(result.sessionName).toBe("Test Session");
  });

  it("exports CSV regardless of ownership (auth gate removed for testing)", async () => {
    vi.mocked(db.getSessionById).mockResolvedValue({ ...sampleSession, userId: 99 });
    vi.mocked(db.getResponsesForSession).mockResolvedValue([]);

    const caller = appRouter.createCaller(makeCtx());
    // Auth gate was intentionally removed; ownership check is not enforced
    const result = await caller.session.exportCsv({ id: 10 });
    expect(result.totalResponses).toBe(0);
  });
});

describe("session.participantCount", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns the unique participant count for a session", async () => {
    vi.mocked(db.getSessionById).mockResolvedValue(sampleSession);
    vi.mocked(db.getParticipantCount).mockResolvedValue(7);

    const caller = appRouter.createCaller(makeCtx(null)); // public procedure
    const result = await caller.session.participantCount({ sessionId: 10 });

    expect(result.count).toBe(7);
  });

  it("returns 0 when no students have joined", async () => {
    vi.mocked(db.getSessionById).mockResolvedValue(sampleSession);
    vi.mocked(db.getParticipantCount).mockResolvedValue(0);

    const caller = appRouter.createCaller(makeCtx(null));
    const result = await caller.session.participantCount({ sessionId: 10 });

    expect(result.count).toBe(0);
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

describe("session.save — polling preset question", () => {
  beforeEach(() => vi.clearAllMocks());

  it("accepts a Multiple Choice question with presetSource='polling' and two empty options", async () => {
    const pollingQuestion = {
      id: "q-poll",
      type: "Multiple Choice" as const,
      text: "Which topic would you like to explore further?",
      color: "oklch(0.52 0.22 290)",
      options: ["", ""],
      presetSource: "polling" as const,
    };

    vi.mocked(db.createSession).mockResolvedValue({ id: 11, code: "XYZAB" });

    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.session.save({
      name: "Polling Session",
      questions: [pollingQuestion],
    });

    expect(db.createSession).toHaveBeenCalledWith(
      expect.objectContaining({
        questions: [pollingQuestion],
      })
    );
    expect(result).toEqual({ id: 11, code: "XYZAB" });
  });
});

describe("session.reactivate", () => {
  beforeEach(() => vi.clearAllMocks());

  it("resets a closed session back to draft status", async () => {
    const closedSession = {
      ...sampleSession,
      status: "closed" as const,
      closedAt: new Date("2026-03-01T10:00:00Z"),
      launchedAt: new Date("2026-02-28T09:00:00Z"),
    };
    vi.mocked(db.getSessionById).mockResolvedValue(closedSession);
    vi.mocked(db.updateSession).mockResolvedValue({ ...closedSession, status: "draft", closedAt: null, launchedAt: null, currentQuestionIndex: 0 });

    const caller = appRouter.createCaller(makeCtx());
    await caller.session.reactivate({ id: 10 });

    expect(db.updateSession).toHaveBeenCalledWith(10, {
      status: "draft",
      closedAt: null,
      launchedAt: null,
      currentQuestionIndex: 0,
    });
  });

  it("throws when session is not found", async () => {
    vi.mocked(db.getSessionById).mockResolvedValue(null);

    const caller = appRouter.createCaller(makeCtx());
    await expect(caller.session.reactivate({ id: 99 })).rejects.toThrow("Session not found");
  });

  it("throws when session is not closed", async () => {
    vi.mocked(db.getSessionById).mockResolvedValue({ ...sampleSession, status: "draft" });

    const caller = appRouter.createCaller(makeCtx());
    await expect(caller.session.reactivate({ id: 10 })).rejects.toThrow("Only closed sessions");
  });
});

describe("session.studentPoll", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns session name, status, and current question for a live session", async () => {
    vi.mocked(db.getSessionById).mockResolvedValue({
      ...sampleSession,
      status: "live",
    });

    const caller = appRouter.createCaller(makeCtx(null));
    const result = await caller.session.studentPoll({ sessionId: 10 });

    expect(result).toMatchObject({
      name: "Test Session",
      status: "live",
      questionCount: 1,
      currentQuestionIndex: 0,
    });
    expect(result.currentQuestion).toBeTruthy();
  });

  it("returns draft status with session name for sessions not yet started", async () => {
    vi.mocked(db.getSessionById).mockResolvedValue({
      ...sampleSession,
      status: "draft",
    });

    const caller = appRouter.createCaller(makeCtx(null));
    const result = await caller.session.studentPoll({ sessionId: 10 });

    expect(result).toMatchObject({
      name: "Test Session",
      status: "draft",
      questionCount: 1,
    });
  });

  it("throws when session is not found", async () => {
    vi.mocked(db.getSessionById).mockResolvedValue(null);

    const caller = appRouter.createCaller(makeCtx(null));
    await expect(caller.session.studentPoll({ sessionId: 999 })).rejects.toThrow(
      "Session not found"
    );
  });
});

describe("session.joinByCode — draft sessions (pre-live waiting)", () => {
  beforeEach(() => vi.clearAllMocks());

  it("allows joining a draft session so students can wait", async () => {
    vi.mocked(db.getSessionByCode).mockResolvedValue({
      ...sampleSession,
      status: "draft",
    });

    const caller = appRouter.createCaller(makeCtx(null));
    const result = await caller.session.joinByCode({ code: "ABCDE" });

    expect(result).toMatchObject({
      id: 10,
      status: "draft",
      name: "Test Session",
    });
  });

  it("returns session name in joinByCode response", async () => {
    vi.mocked(db.getSessionByCode).mockResolvedValue({
      ...sampleSession,
      name: "Midterm Review",
      status: "live",
    });

    const caller = appRouter.createCaller(makeCtx(null));
    const result = await caller.session.joinByCode({ code: "ABCDE" });

    expect(result.name).toBe("Midterm Review");
  });
});

describe("session.studentReview", () => {
  beforeEach(() => vi.clearAllMocks());

  const mcQuestion = {
    id: "q-mc",
    type: "Multiple Choice" as const,
    text: "What is 2+2?",
    color: "oklch(0.52 0.22 290)",
    options: ["3", "4", "5"],
    correctIndex: 1,
  };

  const tfQuestion = {
    id: "q-tf",
    type: "True / False" as const,
    text: "The sky is blue",
    color: "oklch(0.42 0.14 60)",
    tfAnswer: "True" as const,
  };

  const textQuestion = {
    id: "q-txt",
    type: "Text" as const,
    text: "Describe your experience",
    color: "oklch(0.48 0.18 264)",
    modelAnswer: "A thoughtful reflection on the course material.",
  };

  const sessionWithMixed = {
    ...sampleSession,
    status: "closed" as const,
    questions: [mcQuestion, tfQuestion, textQuestion],
  };

  it("returns all questions with student answers and correctness", async () => {
    vi.mocked(db.getSessionById).mockResolvedValue(sessionWithMixed);
    vi.mocked(db.getStudentResponses).mockResolvedValue([
      { id: 1, sessionId: 10, questionId: "q-mc", studentId: "stu-1", studentName: null, answer: "1", createdAt: new Date() },
      { id: 2, sessionId: 10, questionId: "q-tf", studentId: "stu-1", studentName: null, answer: "False", createdAt: new Date() },
      { id: 3, sessionId: 10, questionId: "q-txt", studentId: "stu-1", studentName: null, answer: "Great class!", createdAt: new Date() },
    ]);

    const caller = appRouter.createCaller(makeCtx(null));
    const result = await caller.session.studentReview({ sessionId: 10, studentId: "stu-1" });

    expect(result.sessionName).toBe("Test Session");
    expect(result.questionCount).toBe(3);
    expect(result.answeredCount).toBe(3);
    expect(result.reviewItems).toHaveLength(3);

    // MC: correct (answered index "1", correctIndex=1)
    expect(result.reviewItems[0].isCorrect).toBe(true);
    expect(result.reviewItems[0].studentAnswer).toBe("1");

    // T/F: incorrect (answered "False", correct is "True")
    expect(result.reviewItems[1].isCorrect).toBe(false);
    expect(result.reviewItems[1].studentAnswer).toBe("False");

    // Text: no auto-grading
    expect(result.reviewItems[2].isCorrect).toBeNull();
    expect(result.reviewItems[2].studentAnswer).toBe("Great class!");
  });

  it("marks unanswered questions as null", async () => {
    vi.mocked(db.getSessionById).mockResolvedValue(sessionWithMixed);
    vi.mocked(db.getStudentResponses).mockResolvedValue([
      { id: 1, sessionId: 10, questionId: "q-mc", studentId: "stu-2", studentName: null, answer: "0", createdAt: new Date() },
    ]);

    const caller = appRouter.createCaller(makeCtx(null));
    const result = await caller.session.studentReview({ sessionId: 10, studentId: "stu-2" });

    expect(result.answeredCount).toBe(1);
    // MC: incorrect (answered index "0", correctIndex is 1)
    expect(result.reviewItems[0].isCorrect).toBe(false);
    // T/F: not answered
    expect(result.reviewItems[1].studentAnswer).toBeNull();
    expect(result.reviewItems[1].isCorrect).toBeNull();
    // Text: not answered
    expect(result.reviewItems[2].studentAnswer).toBeNull();
  });

  it("includes question metadata (options, modelAnswer, etc.)", async () => {
    vi.mocked(db.getSessionById).mockResolvedValue(sessionWithMixed);
    vi.mocked(db.getStudentResponses).mockResolvedValue([]);

    const caller = appRouter.createCaller(makeCtx(null));
    const result = await caller.session.studentReview({ sessionId: 10, studentId: "stu-3" });

    expect(result.reviewItems[0].question.options).toEqual(["3", "4", "5"]);
    expect(result.reviewItems[0].question.correctIndex).toBe(1);
    expect(result.reviewItems[1].question.tfAnswer).toBe("True");
    expect(result.reviewItems[2].question.modelAnswer).toBe("A thoughtful reflection on the course material.");
  });

  it("throws when session is not found", async () => {
    vi.mocked(db.getSessionById).mockResolvedValue(null);

    const caller = appRouter.createCaller(makeCtx(null));
    await expect(
      caller.session.studentReview({ sessionId: 999, studentId: "stu-1" })
    ).rejects.toThrow("Session not found");
  });

  it("returns empty answers when student has no responses", async () => {
    vi.mocked(db.getSessionById).mockResolvedValue(sessionWithMixed);
    vi.mocked(db.getStudentResponses).mockResolvedValue([]);

    const caller = appRouter.createCaller(makeCtx(null));
    const result = await caller.session.studentReview({ sessionId: 10, studentId: "stu-new" });

    expect(result.answeredCount).toBe(0);
    expect(result.reviewItems.every((item) => item.studentAnswer === null)).toBe(true);
    expect(result.reviewItems.every((item) => item.isCorrect === null)).toBe(true);
  });
});
