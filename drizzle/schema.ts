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

// ── Professor Settings ───────────────────────────────────────────────────────

/**
 * Per-professor (or global demo) settings.
 * `settingsKey` is the owner identifier — userId as string when auth is on,
 * or the constant 'demo' when running without auth.
 */
export const professorSettings = mysqlTable("professorSettings", {
  id: int("id").autoincrement().primaryKey(),
  /** 'demo' in no-auth mode, or the user's numeric id as a string */
  settingsKey: varchar("settingsKey", { length: 64 }).notNull().unique(),

  // ── Professor / Account ────────────────────────────────────────────────────
  displayName: varchar("displayName", { length: 128 }),
  institutionName: varchar("institutionName", { length: 255 }),
  sessionNameTemplate: varchar("sessionNameTemplate", { length: 255 }),
  emailNotifications: boolean("emailNotifications").default(false).notNull(),
  themePref: mysqlEnum("themePref", ["light", "dark", "system"]).default("light").notNull(),

  // ── Session Defaults ──────────────────────────────────────────────────────
  allowLateJoins: boolean("allowLateJoins").default(true).notNull(),
  showResponseCountToStudents: boolean("showResponseCountToStudents").default(false).notNull(),
  autoAdvance: boolean("autoAdvance").default(false).notNull(),
  autoAdvanceTimer: int("autoAdvanceTimer").default(30).notNull(),
  anonymousResponses: boolean("anonymousResponses").default(true).notNull(),
  maxResponsesPerStudent: int("maxResponsesPerStudent").default(1).notNull(),
  defaultQuestionType: varchar("defaultQuestionType", { length: 64 }).default("Text").notNull(),

  // ── Student Experience ────────────────────────────────────────────────────
  waitingRoomMessage: text("waitingRoomMessage"),
  sessionEndedMessage: text("sessionEndedMessage"),
  requireStudentName: boolean("requireStudentName").default(false).notNull(),
  showQuestionNumber: boolean("showQuestionNumber").default(true).notNull(),
  revealTotalQuestionCount: boolean("revealTotalQuestionCount").default(true).notNull(),
  allowResponseEditing: boolean("allowResponseEditing").default(false).notNull(),
  brandingLogoUrl: text("brandingLogoUrl"),
  primaryAccentColor: varchar("primaryAccentColor", { length: 64 }),

  // ── Live Mode ─────────────────────────────────────────────────────────────
  pollingInterval: int("pollingInterval").default(2).notNull(),
  showWordCloudByDefault: boolean("showWordCloudByDefault").default(false).notNull(),
  showCorrectAnswerOverlay: boolean("showCorrectAnswerOverlay").default(false).notNull(),
  confettiOnLaunch: boolean("confettiOnLaunch").default(true).notNull(),

  // ── Export & Data ─────────────────────────────────────────────────────────
  csvDateFormat: mysqlEnum("csvDateFormat", ["iso", "us", "eu"]).default("iso").notNull(),
  csvIncludeStudentId: boolean("csvIncludeStudentId").default(true).notNull(),
  autoDeleteAfterDays: int("autoDeleteAfterDays"),
  exportFormat: mysqlEnum("exportFormat", ["csv", "excel"]).default("csv").notNull(),

  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ProfessorSettings = typeof professorSettings.$inferSelect;
export type InsertProfessorSettings = typeof professorSettings.$inferInsert;

// ── Shared Question type (mirrors client-side type) ───────────────────────────

export type QuestionType =
  | "Text"
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
  /** Builder-only metadata: restricts type-change dropdown. "polling" = Text/MC only. */
  presetSource?: "polling";
}
