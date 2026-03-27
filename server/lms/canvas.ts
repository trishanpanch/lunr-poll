/**
 * Canvas LMS REST API helper.
 *
 * All methods accept a `connection` object (instanceUrl + apiToken) so they
 * are stateless and easy to test. They throw descriptive errors on failure.
 *
 * Canvas API docs: https://canvas.instructure.com/doc/api/
 */

export interface CanvasConnection {
  instanceUrl: string; // e.g. "https://canvas.harvard.edu"
  apiToken: string;    // Personal Access Token from Canvas account settings
}

export interface CanvasCourse {
  id: number;
  name: string;
  course_code: string;
  enrollment_term_id: number;
  workflow_state: string;
}

export interface CanvasStudent {
  id: number;
  name: string;
  login_id: string; // usually email
  sis_user_id?: string;
}

export interface CanvasAssignment {
  id: number;
  name: string;
  points_possible: number;
  published: boolean;
}

export interface GradeEntry {
  /** Canvas user ID */
  userId: number;
  /** Score 0–100 (percentage) */
  score: number;
  /** Optional comment to attach to the submission */
  comment?: string;
}

// ── Internal fetch wrapper ────────────────────────────────────────────────────

async function canvasFetch<T>(
  conn: CanvasConnection,
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const base = conn.instanceUrl.replace(/\/$/, "");
  const url = `${base}/api/v1${path}`;

  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${conn.apiToken}`,
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(
      `Canvas API error ${res.status} ${res.statusText} — ${path}: ${body.slice(0, 200)}`
    );
  }

  // 204 No Content
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Verify the token works and return the current user's display name.
 * Throws if the token is invalid or the URL is unreachable.
 */
export async function canvasTestConnection(
  conn: CanvasConnection
): Promise<{ name: string; id: number }> {
  const user = await canvasFetch<{ id: number; name: string }>(conn, "/users/self");
  return { id: user.id, name: user.name };
}

/**
 * Return all active courses the authenticated user is enrolled in as a teacher.
 */
export async function canvasListCourses(
  conn: CanvasConnection
): Promise<CanvasCourse[]> {
  // enrollment_type=teacher limits to courses where the user is an instructor
  const courses = await canvasFetch<CanvasCourse[]>(
    conn,
    "/courses?enrollment_type=teacher&state[]=available&per_page=100"
  );
  return courses ?? [];
}

/**
 * Return the student roster for a course (users with student enrollment).
 */
export async function canvasListStudents(
  conn: CanvasConnection,
  courseId: number
): Promise<CanvasStudent[]> {
  const students = await canvasFetch<CanvasStudent[]>(
    conn,
    `/courses/${courseId}/users?enrollment_type[]=student&per_page=200`
  );
  return students ?? [];
}

/**
 * Create a new assignment (grade column) in the Canvas gradebook.
 * Returns the created assignment including its id.
 */
export async function canvasCreateAssignment(
  conn: CanvasConnection,
  courseId: number,
  name: string,
  pointsPossible = 100
): Promise<CanvasAssignment> {
  return canvasFetch<CanvasAssignment>(conn, `/courses/${courseId}/assignments`, {
    method: "POST",
    body: JSON.stringify({
      assignment: {
        name,
        points_possible: pointsPossible,
        submission_types: ["none"],
        published: true,
        grading_type: "percent",
      },
    }),
  });
}

/**
 * Push grade entries to an existing Canvas assignment.
 * Canvas accepts bulk grade updates via the submissions API.
 * Returns the number of grades successfully submitted.
 */
export async function canvasPushGrades(
  conn: CanvasConnection,
  courseId: number,
  assignmentId: number,
  grades: GradeEntry[]
): Promise<number> {
  if (grades.length === 0) return 0;

  // Canvas bulk grade update: POST /courses/:id/assignments/:id/submissions/update_grades
  // Body: { grade_data: { [userId]: { posted_grade: "85%" } } }
  const gradeData: Record<string, { posted_grade: string; text_comment?: string }> = {};
  for (const g of grades) {
    gradeData[String(g.userId)] = {
      posted_grade: `${Math.round(g.score)}%`,
      ...(g.comment ? { text_comment: g.comment } : {}),
    };
  }

  await canvasFetch(
    conn,
    `/courses/${courseId}/assignments/${assignmentId}/submissions/update_grades`,
    {
      method: "POST",
      body: JSON.stringify({ grade_data: gradeData }),
    }
  );

  return grades.length;
}
