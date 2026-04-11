/**
 * Seed script: inserts realistic student responses into the Gone Girl session (id=60003)
 * Run: node scripts/seed-student-responses.mjs
 */

import mysql from "mysql2/promise";

const SESSION_ID = 60003;

// 10 realistic student personas with names
const STUDENTS = [
  { id: "stu-alice-001",   name: "Alice Chen" },
  { id: "stu-bob-002",     name: "Bob Martinez" },
  { id: "stu-carol-003",   name: "Carol Johnson" },
  { id: "stu-david-004",   name: "David Kim" },
  { id: "stu-emma-005",    name: "Emma Williams" },
  { id: "stu-frank-006",   name: "Frank Okafor" },
  { id: "stu-grace-007",   name: "Grace Liu" },
  { id: "stu-henry-008",   name: "Henry Patel" },
  { id: "stu-iris-009",    name: "Iris Thompson" },
  { id: "stu-james-010",   name: "James Nguyen" },
];

// Questions from the session (index 0-based):
// Q0  T/F  tfAnswer=True
// Q1  Short Text
// Q2  Short Text
// Q3  Short Text
// Q4  Short Text
// Q5  MC   options=[Flynn,Fincher,Cronenweth,Milchan] correctIdx=1
// Q6  T/F  tfAnswer=True
// Q7  Short Text
// Q8  MC   options=[Coon,Witherspoon,Pike,Perry] correctIdx=2
// Q9  T/F  tfAnswer=True
// Q10 Short Text
// Q11 MC   options=[Witherspoon,Chaffin,Flynn,Dunne] correctIdx=2

// Per-student answer plan: [q0, q1, q2, q3, q4, q5, q6, q7, q8, q9, q10, q11]
// MC answers are stored as index strings ("0","1","2","3")
// T/F answers are "True" or "False"
// Short text answers are strings (null = skipped)

const ANSWERS = [
  // Alice — strong student, gets most right
  ["True", "The film explores the psychology of marriage and media manipulation.", "More group discussions", "The case study approach", "Fewer last-minute readings", "1", "True", "Psychological manipulation and unreliable narration.", "2", "True", "Amy faked her own death, framed Nick, then returned by killing Desi.", "2"],
  // Bob — average, misses a couple MC
  ["True", "Media framing can distort public perception of criminal cases.", "More real-world examples", "The Socratic questioning", "Less repetition in readings", "0", "True", "The unreliable narrator device and the diary structure.", "2", "False", "She manipulated Desi and staged her return to clear Nick's name.", "2"],
  // Carol — skips some short-text, good on MC
  ["True", null, "More visual aids", "The film clips", null, "1", "True", null, "2", "True", null, "2"],
  // David — misses Q6 MC and Q9 T/F
  ["False", "Today we analyzed how perspective shapes narrative truth.", "More peer review sessions", "The structured debates", "Less dense reading assignments", "2", "False", "The film uses dual timelines to build suspense.", "1", "False", "Amy returned after staging her own kidnapping and framing Desi.", "2"],
  // Emma — perfect score on graded questions
  ["True", "Unreliable narrators challenge the audience to question every detail.", "More primary source analysis", "The close reading exercises", "Less time on plot summary", "1", "True", "Amy's diary entries and her calculated manipulation of perception.", "2", "True", "Amy killed Desi Collings and returned home, using the crime to exonerate Nick.", "2"],
  // Frank — skips most short-text, wrong on some MC
  ["True", null, null, "The lecture format", null, "3", "True", null, "0", "True", null, "1"],
  // Grace — thoughtful short-text answers, one MC wrong
  ["True", "The lecture showed how public narratives can be weaponized.", "More discussion of film technique", "The thematic connections to current events", "Fewer pop quizzes", "1", "True", "The contrast between Amy's public persona and private scheming.", "2", "True", "She framed Desi for kidnapping and murder, then returned to Nick.", "0"],
  // Henry — skips Q1-Q4, good on graded
  [null, null, null, null, null, "1", "True", "The unreliable narrator and the twist ending.", "2", "True", "Amy staged her return by killing Desi and claiming self-defense.", "2"],
  // Iris — gets T/F wrong on Q0, otherwise solid
  ["False", "Media coverage can convict someone before a trial begins.", "More film analysis", "The Socratic method", "Less reliance on textbook readings", "1", "True", "The diary as a constructed narrative device.", "2", "True", "Amy manipulated Desi into keeping her, then killed him to return home.", "2"],
  // James — skips several, wrong on Q5 MC
  ["True", "Perception and reality are central themes in the film.", null, "The interactive discussions", null, "0", "False", null, "2", "True", null, "2"],
];

// Question IDs from the session (need to fetch from DB)
async function main() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL || "");

  // Fetch question IDs
  const [rows] = await conn.execute("SELECT questions FROM sessions WHERE id = ?", [SESSION_ID]);
  const questions = rows[0].questions;
  console.log(`Found ${questions.length} questions in session ${SESSION_ID}`);

  // Clear any existing seed responses
  const [del] = await conn.execute(
    "DELETE FROM responses WHERE sessionId = ? AND studentId LIKE 'stu-%'",
    [SESSION_ID]
  );
  console.log(`Cleared ${del.affectedRows} existing seed responses`);

  // Insert responses
  let inserted = 0;
  for (let si = 0; si < STUDENTS.length; si++) {
    const student = STUDENTS[si];
    const answers = ANSWERS[si];

    for (let qi = 0; qi < questions.length; qi++) {
      const answer = answers[qi];
      if (answer === null || answer === undefined) continue; // student skipped this question

      await conn.execute(
        "INSERT INTO responses (sessionId, questionId, studentId, studentName, answer, createdAt) VALUES (?, ?, ?, ?, ?, NOW())",
        [SESSION_ID, questions[qi].id, student.id, student.name, answer]
      );
      inserted++;
    }
  }

  console.log(`Inserted ${inserted} student responses for ${STUDENTS.length} students`);
  await conn.end();
}

main().catch((e) => {
  console.error("Seed failed:", e.message);
  process.exit(1);
});
