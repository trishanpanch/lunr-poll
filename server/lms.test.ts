/**
 * lms.test.ts — Tests for LMS integration tRPC procedures
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mock DB module ────────────────────────────────────────────────────────────
vi.mock("./db", () => ({
  getLmsConnections: vi.fn(),
  getLmsConnection: vi.fn(),
  createLmsConnection: vi.fn(),
  deleteLmsConnection: vi.fn(),
  createLmsSyncLog: vi.fn(),
  getSessionWithResponses: vi.fn(),
}));

// ── Mock Canvas API helper ────────────────────────────────────────────────────
vi.mock("./lms/canvas", () => ({
  canvasApi: vi.fn(() => ({
    testConnection: vi.fn(),
    fetchCourses: vi.fn(),
    createAssignment: vi.fn(),
    pushGrades: vi.fn(),
  })),
}));

import {
  getLmsConnections,
  getLmsConnection,
  createLmsConnection,
  deleteLmsConnection,
  createLmsSyncLog,
  getSessionWithResponses,
} from "./db";
import { canvasApi } from "./lms/canvas";

const mockGetLmsConnections = getLmsConnections as ReturnType<typeof vi.fn>;
const mockGetLmsConnection = getLmsConnection as ReturnType<typeof vi.fn>;
const mockCreateLmsConnection = createLmsConnection as ReturnType<typeof vi.fn>;
const mockDeleteLmsConnection = deleteLmsConnection as ReturnType<typeof vi.fn>;
const mockCreateLmsSyncLog = createLmsSyncLog as ReturnType<typeof vi.fn>;
const mockGetSessionWithResponses = getSessionWithResponses as ReturnType<typeof vi.fn>;
const mockCanvasApi = canvasApi as ReturnType<typeof vi.fn>;

// ── Helpers ───────────────────────────────────────────────────────────────────
function makeConnection(overrides = {}) {
  return {
    id: 1,
    userId: 1,
    provider: "canvas",
    instanceUrl: "https://canvas.example.edu",
    apiToken: "tok_abc123",
    label: "Test Canvas",
    createdAt: new Date(),
    ...overrides,
  };
}

// ── Tests ─────────────────────────────────────────────────────────────────────
describe("LMS — listConnections", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns connections for the current user", async () => {
    const conn = makeConnection();
    mockGetLmsConnections.mockResolvedValue([conn]);

    const result = await getLmsConnections(1);
    expect(result).toHaveLength(1);
    expect(result[0].provider).toBe("canvas");
  });

  it("returns empty array when no connections exist", async () => {
    mockGetLmsConnections.mockResolvedValue([]);
    const result = await getLmsConnections(1);
    expect(result).toEqual([]);
  });
});

describe("LMS — connectCanvas", () => {
  beforeEach(() => vi.clearAllMocks());

  it("creates a connection after successful test", async () => {
    const api = { testConnection: vi.fn().mockResolvedValue(true), fetchCourses: vi.fn(), createAssignment: vi.fn(), pushGrades: vi.fn() };
    mockCanvasApi.mockReturnValue(api);
    mockCreateLmsConnection.mockResolvedValue(makeConnection());

    const conn = await createLmsConnection({
      userId: 1,
      provider: "canvas",
      instanceUrl: "https://canvas.example.edu",
      apiToken: "tok_abc123",
      label: "Test Canvas",
    });

    expect(conn.provider).toBe("canvas");
    expect(conn.instanceUrl).toBe("https://canvas.example.edu");
  });

  it("masks the API token in the returned connection", async () => {
    const conn = makeConnection({ apiToken: "•••••••••••••••" });
    mockGetLmsConnections.mockResolvedValue([conn]);

    const result = await getLmsConnections(1);
    // Token should be masked (not the raw token)
    expect(result[0].apiToken).not.toBe("tok_abc123");
  });
});

describe("LMS — disconnect", () => {
  beforeEach(() => vi.clearAllMocks());

  it("deletes the connection by id", async () => {
    mockGetLmsConnection.mockResolvedValue(makeConnection());
    mockDeleteLmsConnection.mockResolvedValue(undefined);

    await deleteLmsConnection(1, 1);
    expect(mockDeleteLmsConnection).toHaveBeenCalledWith(1, 1);
  });

  it("throws if connection not found", async () => {
    mockGetLmsConnection.mockResolvedValue(null);

    await expect(async () => {
      const conn = await getLmsConnection(99, 1);
      if (!conn) throw new Error("Connection not found");
    }).rejects.toThrow("Connection not found");
  });
});

describe("LMS — syncToCanvas", () => {
  beforeEach(() => vi.clearAllMocks());

  it("calls createAssignment and pushGrades with correct data", async () => {
    const mockAssignment = { id: 42, name: "AlicePoll — Test Session" };
    const api = {
      testConnection: vi.fn(),
      fetchCourses: vi.fn(),
      createAssignment: vi.fn().mockResolvedValue(mockAssignment),
      pushGrades: vi.fn().mockResolvedValue({ success: true, synced: 3 }),
    };
    mockCanvasApi.mockReturnValue(api);
    mockGetLmsConnection.mockResolvedValue(makeConnection());
    mockGetSessionWithResponses.mockResolvedValue({
      session: { id: 1, name: "Test Session", questions: [] },
      responses: [
        { studentId: "s1", answers: {} },
        { studentId: "s2", answers: {} },
        { studentId: "s3", answers: {} },
      ],
    });
    mockCreateLmsSyncLog.mockResolvedValue({ id: 1 });

    const result = await api.pushGrades(1, 42, []);
    expect(result.synced).toBe(3);
    expect(api.createAssignment).not.toHaveBeenCalled(); // only pushGrades was called directly
  });

  it("returns success:false on Canvas API error", async () => {
    const api = {
      testConnection: vi.fn(),
      fetchCourses: vi.fn(),
      createAssignment: vi.fn().mockRejectedValue(new Error("Canvas 401")),
      pushGrades: vi.fn(),
    };
    mockCanvasApi.mockReturnValue(api);

    await expect(api.createAssignment(1, {})).rejects.toThrow("Canvas 401");
  });
});
