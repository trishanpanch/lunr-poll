# Harvard Poll Platform - Architecture & Status

**Status**: Alpha / Local MVP  
**Last Updated**: 2026-01-23

## 1. System Architecture

The platform is a **Real-Time Interactive Polling System** designed for high-concurrency classroom environments.

### Core Stack
*   **Frontend**: Next.js 15 (App Router)
*   **Styling**: Tailwind CSS v4 + Shadcn UI (Harvard Minimalist Theme)
*   **Database**: Google Cloud Firestore (NoSQL, Real-time)
*   **Authentication**: Firebase Auth (Anonymous for Students & Professors for now)
*   **AI Engine**: Google Vertex AI (`gemini-1.5-pro`)

### Data Flow
1.  **Session Creation**: Professor creates a `session` doc in Firestore.
2.  **Student Joining**: Students input 6-char code. App queries `sessions` where `code == INPUT`.
3.  **Real-Time Push**: 
    *   Students subscribe to `sessions/{id}` via `onSnapshot` hook.
    *   When Professor adds a question or changes status to `OPEN`, students see it instantly.
4.  **Response Submission**:
    *   Students write to `responses/{session_user_id}`.
    *   Professor dashboard subscribes to `responses` collection for real-time charts.
5.  **AI Synthesis**:
    *   Professor clicks "Analyze".
    *   Next.js API Route (`/api/synthesize`) fetches all text responses.
    *   Sends prompt to Vertex AI.
    *   Updates `session.analysis` field in Firestore.
    *   Professor UI (and optionally Student UI) updates with insights.

---

## 2. Current Functionality Status

| Feature | Status | Notes |
| :--- | :--- | :--- |
| **Student Landing** | ✅ Ready | Clean input, redirects to session. |
| **Professor Login** | ⚠️ Bypass | Use `lunr` / `lunr` to login (Anonymous Auth). |
| **Session Builder** | ✅ Ready | Can add Text, MCQ, File questions. |
| **Join Logic** | ✅ Ready | Validates code, connects to live session. |
| **Live Dashboard** | ✅ Ready | Real-time counters and bar charts. |
| **Question Types** | ✅ Ready | Short Text & Multiple Choice working. |
| **AI Synthesis** | ✅ Ready | API wired to Vertex AI. Needs GCP credentials. |
| **Deployment** | ⏸️ Pending | `deploy.sh` script created for `bline-v2`. |

---

## 3. "What's Left" (To-Do List)

### Critical for Production
- [ ] **Enable Authentication Providers**: 
    - Go to [Firebase Console](https://console.firebase.google.com/).
    - Enable **Anonymous** (for Students/Dev Bypass).
    - Enable **Email/Password** (for real Professors).
- [ ] **Firestore Indexes**:
    - When you run the app with much data, Firestore might ask for composite indexes (e.g., `sessionId` + `timestamp`). The console will provide a link to create them.
- [ ] **Firestore Security Rules**:
    - Copy the rules from `README.md` to your Firebase Console > Firestore > Rules tab. Currently, anyone can write anything if they guess the ID.

### Polish & Enhancements
- [ ] **File Upload Visualization**: 
    - Creating a gallery for uploaded images/files in the synthesis view.
- [ ] **Export Data**:
    - CSV export button for Professor to download responses.
- [ ] **Student "Results" View**:
    - Allow students to see the AI consensus after the session closes.
- [ ] **Better Error Handling**:
    - Graceful UI when AI quota is exceeded or network fails.

## 4. How to Run (Local Dev)

1.  **Start Server**:
    ```bash
    npm run dev
    ```
2.  **Professor Flow**:
    - Go to `http://localhost:3000/professor`
    - Login: `lunr` / `lunr`
    - Create Session -> Add Qs -> Launch.
3.  **Student Flow**:
    - Go to `http://localhost:3000`
    - Enter Code -> Answer.
4.  **Analysis**:
    - On Professor Dashboard -> "Close & Analyze".

## 5. Deployment Guide

1.  **Check Env Vars**: Ensure `.env.local` has your `bline-v2` keys.
2.  **Deploy**:
    ```bash
    ./deploy.sh
    ```
3.  **Verify**: Go to the Cloud Run URL provided.
