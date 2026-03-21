import { eq, desc, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  users,
  sessions,
  responses,
  type InsertUser,
  type InsertSession,
  type InsertResponse,
  type Question,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

// ── Connection ────────────────────────────────────────────────────────────────

let _db: ReturnType<typeof drizzle> | null = null;

export function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ── Users ─────────────────────────────────────────────────────────────────────

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");

  const db = getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};

  const textFields = ["name", "email", "loginMethod"] as const;
  type TextField = (typeof textFields)[number];

  const assignNullable = (field: TextField) => {
    const value = user[field];
    if (value === undefined) return;
    const normalized = value ?? null;
    values[field] = normalized;
    updateSet[field] = normalized;
  };
  textFields.forEach(assignNullable);

  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }

  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();

  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0] ?? undefined;
}

// ── Sessions ──────────────────────────────────────────────────────────────────

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

export async function createSession(data: {
  userId?: number | null;
  name: string;
  questions: Question[];
}): Promise<{ id: number; code: string } | null> {
  const db = getDb();
  if (!db) return null;

  let code = generateCode();
  for (let i = 0; i < 10; i++) {
    const existing = await db.select({ id: sessions.id }).from(sessions).where(eq(sessions.code, code)).limit(1);
    if (existing.length === 0) break;
    code = generateCode();
  }

  const result = await db.insert(sessions).values({
    userId: data.userId ?? null,
    name: data.name,
    code,
    questions: data.questions,
    status: "draft",
    currentQuestionIndex: 0,
  });

  // drizzle mysql returns OkPacket with insertId
  const insertId = (result as unknown as [{ insertId: number }])[0]?.insertId ?? 0;
  return { id: insertId, code };
}

export async function updateSession(
  id: number,
  data: Partial<{
    name: string;
    questions: Question[];
    status: "draft" | "live" | "closed";
    currentQuestionIndex: number;
    launchedAt: Date | null;
    closedAt: Date | null;
  }>
) {
  const db = getDb();
  if (!db) return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await db.update(sessions).set(data as any).where(eq(sessions.id, id));
  return getSessionById(id);
}

export async function getSessionById(id: number) {
  const db = getDb();
  if (!db) return null;
  const rows = await db.select().from(sessions).where(eq(sessions.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function getSessionByCode(code: string) {
  const db = getDb();
  if (!db) return null;
  const rows = await db
    .select()
    .from(sessions)
    .where(eq(sessions.code, code.toUpperCase()))
    .limit(1);
  return rows[0] ?? null;
}

export async function getSessionsByUser(userId: number) {
  const db = getDb();
  if (!db) return [];
  return db
    .select()
    .from(sessions)
    .where(eq(sessions.userId, userId))
    .orderBy(desc(sessions.updatedAt));
}

export async function deleteSession(id: number) {
  const db = getDb();
  if (!db) return;
  await db.delete(responses).where(eq(responses.sessionId, id));
  await db.delete(sessions).where(eq(sessions.id, id));
}

// ── Responses ─────────────────────────────────────────────────────────────────

export async function submitResponse(data: InsertResponse) {
  const db = getDb();
  if (!db) return null;
  const result = await db.insert(responses).values(data);
  const insertId = (result as unknown as [{ insertId: number }])[0]?.insertId ?? 0;
  return { id: insertId };
}

export async function getResponsesForSession(sessionId: number) {
  const db = getDb();
  if (!db) return [];
  return db
    .select()
    .from(responses)
    .where(eq(responses.sessionId, sessionId))
    .orderBy(desc(responses.createdAt));
}

export async function getResponsesForQuestion(sessionId: number, questionId: string) {
  const db = getDb();
  if (!db) return [];
  return db
    .select()
    .from(responses)
    .where(and(eq(responses.sessionId, sessionId), eq(responses.questionId, questionId)))
    .orderBy(desc(responses.createdAt));
}

/** Count unique students who have submitted at least one response for a session */
export async function getParticipantCount(sessionId: number): Promise<number> {
  const db = getDb();
  if (!db) return 0;
  // Fetch all studentIds for the session and count distinct values in JS
  // (avoids needing a COUNT DISTINCT raw query across different DB drivers)
  const rows = await db
    .select({ studentId: responses.studentId })
    .from(responses)
    .where(eq(responses.sessionId, sessionId));
  const unique = new Set(rows.map((r) => r.studentId));
  return unique.size;
}

export async function hasStudentResponded(
  sessionId: number,
  questionId: string,
  studentId: string
) {
  const db = getDb();
  if (!db) return false;
  const rows = await db
    .select({ id: responses.id })
    .from(responses)
    .where(
      and(
        eq(responses.sessionId, sessionId),
        eq(responses.questionId, questionId),
        eq(responses.studentId, studentId)
      )
    )
    .limit(1);
  return rows.length > 0;
}
