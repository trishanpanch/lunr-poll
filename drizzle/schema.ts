import {
  boolean,
  int,
  json,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ── Sessions ──────────────────────────────────────────────────────────────────

/**
 * A poll session created by a professor.
 * `questions` is stored as JSON (array of Question objects from the builder).
 * `code` is the 6-char join code students use.
 */
export const sessions = mysqlTable("sessions", {
  id: int("id").autoincrement().primaryKey(),
  /** Owner user id — null for demo/local sessions */
  userId: int("userId"),
  name: varchar("name", { length: 255 }).notNull().default("Untitled Session"),
  /** 6-character alphanumeric join code */
  code: varchar("code", { length: 6 }).notNull().unique(),
  status: mysqlEnum("status", ["draft", "live", "closed"]).default("draft").notNull(),
  /** Current question index being shown to students in live mode */
  currentQuestionIndex: int("currentQuestionIndex").default(0).notNull(),
  /** Serialized Question[] from the builder */
  questions: json("questions").notNull().$type<Question[]>().default([]),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  /** When the session was launched */
  launchedAt: timestamp("launchedAt"),
  /** When the session was closed */
  closedAt: timestamp("closedAt"),
});

export type Session = typeof sessions.$inferSelect;
export type InsertSession = typeof sessions.$inferInsert;

// ── Responses ─────────────────────────────────────────────────────────────────

/**
 * A single student response to a question in a live session.
 */
export const responses = mysqlTable("responses", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: int("sessionId").notNull(),
  questionId: varchar("questionId", { length: 16 }).notNull(),
  /** Opaque student identifier (random UUID generated client-side, no auth) */
  studentId: varchar("studentId", { length: 64 }).notNull(),
  studentName: varchar("studentName", { length: 128 }),
  /** The actual answer value (text, option index, rating, etc.) */
  answer: text("answer").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Response = typeof responses.$inferSelect;
export type InsertResponse = typeof responses.$inferInsert;

// ── Shared Question type (mirrors client-side type) ───────────────────────────

export type QuestionType =
  | "Short Text"
  | "Multiple Choice"
  | "File Upload"
  | "Star Rating"
  | "True / False";

export interface Question {
  id: string;
  type: QuestionType;
  text: string;
  color: string;
  options?: string[];
  correctIndex?: number;
  tfAnswer?: "True" | "False";
  modelAnswer?: string;
}
