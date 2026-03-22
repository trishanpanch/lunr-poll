/**
 * Tests for the settings tRPC router.
 *
 * DB helpers are mocked so no real database is needed.
 */

import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// ── Mock DB helpers ───────────────────────────────────────────────────────────

vi.mock("./db", () => ({
  // session helpers (needed because appRouter imports session router too)
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
  // settings helpers
  getSettings: vi.fn(),
  upsertSettings: vi.fn(),
}));

import * as db from "./db";

// ── Context helpers ───────────────────────────────────────────────────────────

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

function makeCtx(user: AuthenticatedUser | null = null): TrpcContext {
  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

// ── Default settings shape returned by DB ────────────────────────────────────

const defaultRow = {
  id: 1,
  settingsKey: "demo",
  displayName: null,
  institutionName: null,
  sessionNameTemplate: null,
  emailNotifications: false,
  themePref: "light" as const,
  allowLateJoins: true,
  showResponseCountToStudents: false,
  autoAdvance: false,
  autoAdvanceTimer: 30,
  anonymousResponses: true,
  maxResponsesPerStudent: 1,
  defaultQuestionType: "Short Text",
  waitingRoomMessage: null,
  sessionEndedMessage: null,
  requireStudentName: false,
  showQuestionNumber: true,
  revealTotalQuestionCount: true,
  allowResponseEditing: false,
  brandingLogoUrl: null,
  primaryAccentColor: null,
  pollingInterval: 2,
  showWordCloudByDefault: false,
  showCorrectAnswerOverlay: false,
  confettiOnLaunch: true,
  csvDateFormat: "iso" as const,
  csvIncludeStudentId: true,
  autoDeleteAfterDays: null,
  exportFormat: "csv" as const,
  createdAt: new Date(),
  updatedAt: new Date(),
};

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("settings.get", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns defaults when no settings row exists (demo mode)", async () => {
    vi.mocked(db.getSettings).mockResolvedValue(null);
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.settings.get();
    expect(result.settingsKey).toBe("demo");
    expect(result.allowLateJoins).toBe(true);
    expect(result.pollingInterval).toBe(2);
    expect(result.confettiOnLaunch).toBe(true);
    expect(db.getSettings).toHaveBeenCalledWith("demo");
  });

  it("returns existing row when settings exist", async () => {
    vi.mocked(db.getSettings).mockResolvedValue({ ...defaultRow, displayName: "Prof. Smith" });
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.settings.get();
    expect(result.displayName).toBe("Prof. Smith");
  });

  it("uses user id as settings key when authenticated", async () => {
    vi.mocked(db.getSettings).mockResolvedValue({ ...defaultRow, settingsKey: "1" });
    const caller = appRouter.createCaller(makeCtx(makeUser({ id: 1 })));
    await caller.settings.get();
    expect(db.getSettings).toHaveBeenCalledWith("1");
  });
});

describe("settings.save", () => {
  beforeEach(() => vi.clearAllMocks());

  it("calls upsertSettings with demo key in no-auth mode", async () => {
    vi.mocked(db.upsertSettings).mockResolvedValue({ ...defaultRow, displayName: "Test Prof" });
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.settings.save({ displayName: "Test Prof" });
    expect(db.upsertSettings).toHaveBeenCalledWith("demo", expect.objectContaining({ displayName: "Test Prof" }));
    expect(result?.displayName).toBe("Test Prof");
  });

  it("calls upsertSettings with user id key when authenticated", async () => {
    vi.mocked(db.upsertSettings).mockResolvedValue({ ...defaultRow, settingsKey: "1", institutionName: "MIT" });
    const caller = appRouter.createCaller(makeCtx(makeUser({ id: 1 })));
    await caller.settings.save({ institutionName: "MIT" });
    expect(db.upsertSettings).toHaveBeenCalledWith("1", expect.objectContaining({ institutionName: "MIT" }));
  });

  it("validates pollingInterval — only 1, 2, 5 are allowed", async () => {
    const caller = appRouter.createCaller(makeCtx());
    await expect(caller.settings.save({ pollingInterval: 3 })).rejects.toThrow();
  });

  it("validates autoAdvanceTimer range", async () => {
    const caller = appRouter.createCaller(makeCtx());
    await expect(caller.settings.save({ autoAdvanceTimer: 5 })).rejects.toThrow();
    await expect(caller.settings.save({ autoAdvanceTimer: 400 })).rejects.toThrow();
  });

  it("accepts null for nullable fields", async () => {
    vi.mocked(db.upsertSettings).mockResolvedValue({ ...defaultRow, waitingRoomMessage: null });
    const caller = appRouter.createCaller(makeCtx());
    await expect(
      caller.settings.save({ waitingRoomMessage: null, brandingLogoUrl: null })
    ).resolves.toBeDefined();
  });

  it("saves all session default fields", async () => {
    vi.mocked(db.upsertSettings).mockResolvedValue({
      ...defaultRow,
      allowLateJoins: false,
      autoAdvance: true,
      autoAdvanceTimer: 60,
      anonymousResponses: false,
      maxResponsesPerStudent: 3,
      defaultQuestionType: "Multiple Choice",
    });
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.settings.save({
      allowLateJoins: false,
      autoAdvance: true,
      autoAdvanceTimer: 60,
      anonymousResponses: false,
      maxResponsesPerStudent: 3,
      defaultQuestionType: "Multiple Choice",
    });
    expect(result?.allowLateJoins).toBe(false);
    expect(result?.autoAdvanceTimer).toBe(60);
  });

  it("saves export settings", async () => {
    vi.mocked(db.upsertSettings).mockResolvedValue({
      ...defaultRow,
      csvDateFormat: "us",
      csvIncludeStudentId: false,
      exportFormat: "excel",
    });
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.settings.save({
      csvDateFormat: "us",
      csvIncludeStudentId: false,
      exportFormat: "excel",
    });
    expect(result?.csvDateFormat).toBe("us");
    expect(result?.exportFormat).toBe("excel");
  });
});
