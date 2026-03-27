/**
 * GET /api/export/session/:id/csv
 *
 * Exports session participation data as a CSV file that can be imported
 * directly into Canvas, Blackboard, or any other LMS gradebook.
 *
 * Query params:
 *   format=canvas   (default) — Canvas-compatible: Student,ID,SIS User ID,SIS Login ID,Section,<Session Name>
 *   format=generic  — Simple: Student Name,Questions Answered,Total Questions,Score (%)
 *
 * Authentication: requires a valid session cookie (same JWT as tRPC).
 */

import express from "express";
import { eq, and } from "drizzle-orm";
import { getDb } from "./db";
import { sessions, responses } from "../drizzle/schema";
import { sdk } from "./_core/sdk";

const router = express.Router();

router.get("/api/export/session/:id/csv", async (req, res) => {
  try {
    // ── Auth ──────────────────────────────────────────────────────────────────
    const user = await sdk.authenticateRequest(req).catch(() => null);
    if (!user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const sessionId = parseInt(req.params.id, 10);
    if (isNaN(sessionId)) {
      res.status(400).json({ error: "Invalid session ID" });
      return;
    }

    const db = getDb();
    if (!db) {
      res.status(503).json({ error: "Database unavailable" });
      return;
    }

    // ── Load session ──────────────────────────────────────────────────────────
    const [session] = await db
      .select()
      .from(sessions)
      .where(and(eq(sessions.id, sessionId), eq(sessions.userId, user.id)))
      .limit(1);

    if (!session) {
      res.status(404).json({ error: "Session not found" });
      return;
    }

    const questions = (session.questions as { id: string }[]) ?? [];
    const totalQuestions = questions.length;

    // ── Load responses ────────────────────────────────────────────────────────
    const allResponses = await db
      .select()
      .from(responses)
      .where(eq(responses.sessionId, sessionId));

    // ── Compute per-student participation ─────────────────────────────────────
    const studentData: Record<
      string,
      { name: string; answeredQuestions: Set<string> }
    > = {};

    for (const r of allResponses) {
      if (!studentData[r.studentId]) {
        studentData[r.studentId] = {
          name: r.studentName ?? r.studentId,
          answeredQuestions: new Set(),
        };
      }
      studentData[r.studentId].answeredQuestions.add(r.questionId);
    }

    const format = (req.query.format as string) ?? "canvas";
    const sessionName = session.name.replace(/[^a-zA-Z0-9 _-]/g, "").trim();
    const filename = `alicepoll_${sessionName}_${sessionId}.csv`;

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${filename}"`
    );

    if (format === "canvas") {
      // Canvas gradebook import format
      // Header row Canvas expects:
      // Student,ID,SIS User ID,SIS Login ID,Section,<Assignment Name> (<points> pts)
      const colHeader = `${session.name} (100 pts)`;
      const rows: string[] = [
        `Student,ID,SIS User ID,SIS Login ID,Section,${csvEscape(colHeader)}`,
      ];

      for (const [studentId, data] of Object.entries(studentData)) {
        const score = totalQuestions > 0
          ? Math.round((data.answeredQuestions.size / totalQuestions) * 100)
          : 0;
        rows.push(
          `${csvEscape(data.name)},${csvEscape(studentId)},,,, ${score}`
        );
      }

      res.send(rows.join("\r\n"));
    } else {
      // Generic format
      const rows: string[] = [
        "Student Name,Questions Answered,Total Questions,Score (%)",
      ];

      for (const data of Object.values(studentData)) {
        const score = totalQuestions > 0
          ? Math.round((data.answeredQuestions.size / totalQuestions) * 100)
          : 0;
        rows.push(
          `${csvEscape(data.name)},${data.answeredQuestions.size},${totalQuestions},${score}`
        );
      }

      res.send(rows.join("\r\n"));
    }
  } catch (err) {
    console.error("[export-csv]", err);
    res.status(500).json({ error: "Export failed" });
  }
});

function csvEscape(value: string): string {
  const str = String(value ?? "");
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export default router;
