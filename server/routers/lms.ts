import { z } from "zod";
import { eq, and, desc } from "drizzle-orm";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import {
  lmsConnections,
  lmsSyncLogs,
  responses,
  sessions,
  type LmsConnection,
} from "../../drizzle/schema";
import {
  canvasTestConnection,
  canvasListCourses,
  canvasListStudents,
  canvasCreateAssignment,
  canvasPushGrades,
} from "../lms/canvas";

// ── Helpers ───────────────────────────────────────────────────────────────────

function connToCanvas(c: LmsConnection) {
  return { instanceUrl: c.instanceUrl, apiToken: c.apiToken };
}

// ── Router ────────────────────────────────────────────────────────────────────

export const lmsRouter = router({

  // ── Connections ─────────────────────────────────────────────────────────────

  /** List all LMS connections for the current user */
  listConnections: protectedProcedure.query(async ({ ctx }) => {
    const db = getDb();
    if (!db) return [];
    const rows = await db
      .select()
      .from(lmsConnections)
      .where(eq(lmsConnections.userId, ctx.user.id))
      .orderBy(desc(lmsConnections.createdAt));
    // Mask the token before sending to client
    return rows.map((r) => ({
      ...r,
      apiToken: `••••••••${r.apiToken.slice(-4)}`,
    }));
  }),

  /** Test a Canvas connection and save it if valid */
  connectCanvas: protectedProcedure
    .input(
      z.object({
        instanceUrl: z.string().url("Must be a valid URL"),
        apiToken: z.string().min(10, "Token too short"),
        label: z.string().max(128).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const conn = { instanceUrl: input.instanceUrl, apiToken: input.apiToken };

      // Test the connection first — throws if invalid
      const user = await canvasTestConnection(conn);

      const db = getDb();
      if (!db) throw new Error("Database unavailable");

      const result = await db.insert(lmsConnections).values({
        userId: ctx.user.id,
        provider: "canvas",
        instanceUrl: input.instanceUrl.replace(/\/$/, ""),
        apiToken: input.apiToken,
        label: input.label ?? `Canvas — ${user.name}`,
      });

      const insertId =
        (result as unknown as [{ insertId: number }])[0]?.insertId ?? 0;

      return {
        id: insertId,
        label: input.label ?? `Canvas — ${user.name}`,
        canvasUser: user,
      };
    }),

  /** Delete a connection */
  disconnect: protectedProcedure
    .input(z.object({ connectionId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      if (!db) throw new Error("Database unavailable");
      await db
        .delete(lmsConnections)
        .where(
          and(
            eq(lmsConnections.id, input.connectionId),
            eq(lmsConnections.userId, ctx.user.id)
          )
        );
      return { success: true };
    }),

  // ── Courses ──────────────────────────────────────────────────────────────────

  /** List Canvas courses for a given connection */
  listCourses: protectedProcedure
    .input(z.object({ connectionId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = getDb();
      if (!db) throw new Error("Database unavailable");

      const [conn] = await db
        .select()
        .from(lmsConnections)
        .where(
          and(
            eq(lmsConnections.id, input.connectionId),
            eq(lmsConnections.userId, ctx.user.id)
          )
        )
        .limit(1);

      if (!conn) throw new Error("Connection not found");

      const courses = await canvasListCourses(connToCanvas(conn));
      return courses.map((c) => ({
        id: c.id,
        name: c.name,
        courseCode: c.course_code,
      }));
    }),

  // ── Grade Sync ───────────────────────────────────────────────────────────────

  /**
   * Sync a closed session's participation scores to a Canvas gradebook column.
   *
   * Participation score = (questions answered / total questions) × 100.
   * Students are matched by their self-reported name against Canvas roster;
   * unmatched students are skipped and counted in the log.
   */
  syncToCanvas: protectedProcedure
    .input(
      z.object({
        sessionId: z.number(),
        connectionId: z.number(),
        lmsCourseId: z.number(),
        /** Override the assignment name; defaults to session name */
        assignmentName: z.string().max(255).optional(),
        /** Points possible in Canvas; defaults to 100 */
        pointsPossible: z.number().min(1).max(1000).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      if (!db) throw new Error("Database unavailable");

      // 1. Load connection (verify ownership)
      const [conn] = await db
        .select()
        .from(lmsConnections)
        .where(
          and(
            eq(lmsConnections.id, input.connectionId),
            eq(lmsConnections.userId, ctx.user.id)
          )
        )
        .limit(1);
      if (!conn) throw new Error("Connection not found");

      // 2. Load session (verify ownership)
      const [session] = await db
        .select()
        .from(sessions)
        .where(
          and(
            eq(sessions.id, input.sessionId),
            eq(sessions.userId, ctx.user.id)
          )
        )
        .limit(1);
      if (!session) throw new Error("Session not found");

      const questions = (session.questions as { id: string }[]) ?? [];
      const totalQuestions = questions.length;
      if (totalQuestions === 0) throw new Error("Session has no questions");

      // 3. Load all responses for this session
      const allResponses = await db
        .select()
        .from(responses)
        .where(eq(responses.sessionId, input.sessionId));

      // 4. Compute per-student participation (unique questions answered)
      const studentQuestions: Record<string, Set<string>> = {};
      for (const r of allResponses) {
        if (!studentQuestions[r.studentId]) {
          studentQuestions[r.studentId] = new Set();
        }
        studentQuestions[r.studentId].add(r.questionId);
      }

      // 5. Build name→score map (studentName → participation %)
      const nameScoreMap: Record<string, number> = {};
      for (const [studentId, qSet] of Object.entries(studentQuestions)) {
        const participantName =
          allResponses.find((r) => r.studentId === studentId)?.studentName ??
          studentId;
        const score = Math.round((qSet.size / totalQuestions) * 100);
        nameScoreMap[participantName.toLowerCase().trim()] = score;
      }

      // 6. Fetch Canvas roster and match by name
      const canvasConn = connToCanvas(conn);
      const canvasStudents = await canvasListStudents(
        canvasConn,
        input.lmsCourseId
      );

      const gradeEntries: { userId: number; score: number }[] = [];
      let unmatched = 0;

      for (const cs of canvasStudents) {
        const key = cs.name.toLowerCase().trim();
        const score = nameScoreMap[key];
        if (score !== undefined) {
          gradeEntries.push({ userId: cs.id, score });
        } else {
          unmatched++;
        }
      }

      // 7. Create Canvas assignment column
      const assignmentName =
        input.assignmentName ?? `AlicePoll — ${session.name}`;
      const assignment = await canvasCreateAssignment(
        canvasConn,
        input.lmsCourseId,
        assignmentName,
        input.pointsPossible ?? 100
      );

      // 8. Push grades
      let synced = 0;
      let errorMessage: string | undefined;
      let status = "success";

      try {
        synced = await canvasPushGrades(
          canvasConn,
          input.lmsCourseId,
          assignment.id,
          gradeEntries
        );
      } catch (err) {
        errorMessage = err instanceof Error ? err.message : String(err);
        status = synced > 0 ? "partial" : "error";
      }

      // 9. Write audit log
      await db.insert(lmsSyncLogs).values({
        sessionId: input.sessionId,
        connectionId: input.connectionId,
        lmsCourseId: String(input.lmsCourseId),
        lmsColumnId: String(assignment.id),
        status,
        studentsSync: synced,
        errorMessage: errorMessage ?? null,
      });

      return {
        success: status !== "error",
        synced,
        unmatched,
        total: canvasStudents.length,
        assignmentId: assignment.id,
        assignmentName,
        status,
        errorMessage,
      };
    }),

  // ── Sync Logs ────────────────────────────────────────────────────────────────

  /** List recent sync logs for a session */
  listSyncLogs: protectedProcedure
    .input(z.object({ sessionId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = getDb();
      if (!db) return [];

      // Verify session ownership
      const [session] = await db
        .select({ id: sessions.id })
        .from(sessions)
        .where(
          and(
            eq(sessions.id, input.sessionId),
            eq(sessions.userId, ctx.user.id)
          )
        )
        .limit(1);
      if (!session) return [];

      const logs = await db
        .select()
        .from(lmsSyncLogs)
        .where(eq(lmsSyncLogs.sessionId, input.sessionId))
        .orderBy(desc(lmsSyncLogs.createdAt))
        .limit(20);

      return logs;
    }),
});
