# Architecture and Implementation Guide: Harvard Poll Platform

## 1. System Overview
The Harvard Poll Platform is a real-time classroom interaction tool designed for university professors to gather instant feedback, conduct polls, and leverage AI to synthesize student understanding. It prioritizes a "Harvard Minimalist" aesthetic—clean, authoritative, and distraction-free.

## 2. Technology Stack

### Frontend
- **Framework:** Next.js 14+ (App Router)
- **Styling:** Tailwind CSS + Vanilla CSS variables
- **UI Components:** Shadcn/UI (Radix Primitives)
- **Animations:** Framer Motion (for smooth transitions and reveals)
- **Icons:** Lucide React

### Backend & Infrastructure
- **Serverless Runtime:** Google Cloud Run (Dockerized Next.js app)
- **Database:** Firebase Firestore (Real-time NoSQL)
- **Authentication:** Firebase Auth (Email/Password for Professors, Anonymous/Ephemeral for Students)
- **AI Engine:** Google Vertex AI (Gemini 1.5 Pro)

---

## 3. Architecture

### Data Flow Diagram
```mermaid
graph TD
    S[Student Device] -->|Submits Answer| DB[(Firestore)]
    P[Professor Dashboard] -->|Listens to Session| DB
    P -->|Triggers AI Analysis| API[Next.js API Route /api/synthesize]
    API -->|Sends Prompt + Context| G[Google Vertex AI (Gemini)]
    G -->|Returns JSON Insights| API
    API -->|Updates Session Doc| DB
    DB -->|Real-time Push| P
```

### Core Features

#### A. Professor Workflow
1.  **Authentication:** Professors sign up using a specific Invite Code (`02143`) to prevent unauthorized access.
2.  **Session Management:** Professors create "Sessions" (e.g., "Week 1 - Ethics").
3.  **Live Dashboard:** 
    -   Professors launch a session, generating a 6-digit Join Code.
    -   They can add ad-hoc questions (Short Text, Multiple Choice).
    -   **Review Mode:** Professors can hide/reveal questions and delete off-topic ones.

#### B. Student Workflow
1.  **Join:** Students enter the 6-digit code on the landing page (or via QR code).
2.  **Participation:** The UI updates in real-time as the professor adds or activates questions.
3.  **Anonymity:** No login required for students; focused on low-friction entry.

#### C. AI Synthesis ("Ask LUNR AI")
-   **Trigger:** A "Sparkles" button on questions with responses.
-   **Process:**
    1.  Frontend sends question text + array of student answers to `/api/synthesize`.
    2.  Backend constructs a structured prompt for Gemini, asking it to act as a "Pedagogical Consultant."
    3.  **Output:** Gemini returns a strictly formatted JSON object containing:
        -   `consensus`: High-level summary.
        -   `distribution_analysis`: Patterns in the data.
        -   `key_inferences`: Deep pedagogical insights.
        -   `outlier_insight`: Interesting edge cases.
    4.  **Display:** Results are saved to Firestore and instantly appear on the Professor's dashboard.

---

## 4. Data Model (Firestore)

### Collection: `sessions`
-   `id`: string (Auto-ID)
-   `code`: string (6-character join code)
-   `hostId`: string (Professor UID)
-   `isActive`: boolean
-   `createdAt`: timestamp
-   `analysis`: Map<QuestionID, AnalysisResult> (Stores AI insights)

### Collection: `sessions/{sessionId}/questions`
-   `id`: string
-   `text`: string
-   `type`: "short_text" | "multiple_choice"
-   `options`: string[] (optional)
-   `isActive`: boolean (Controls visibility to students)

### Collection: `sessions/{sessionId}/responses`
-   `id`: string (Student/Device ID)
-   `answers`: Map<QuestionID, AnswerValue>

---

## 5. Key Implementation Details

### The "Ask LUNR AI" Integration (`src/app/api/synthesize/route.ts`)
We use a structured prompt to force Gemini to return JSON. This is critical for reliable UI rendering.
```typescript
const prompt = `
Analyze these detailed student responses...
Return ONLY valid JSON in the following format:
{
  "consensus": "string",
  "distribution_analysis": "string",
  "key_inferences": ["string"],
  "outlier_insight": "string",
  "recommended_action": "string"
}
`;
```

### Real-time State (`useSession.ts`)
We use standard Firebase `onSnapshot` listeners to keep the `session`, `questions`, and `responses` state in sync. This ensures that when a student submits an answer, it pops up on the professor's screen roughly 300ms later without a page reload.

### Hydration & Extensions
To prevent "Hydration failed" errors caused by browser extensions injecting code into the DOM, we applied `suppressHydrationWarning` to the root `<html>` tag in `layout.tsx`. This tells React to ignore attribute mismatches on that specific tag.
