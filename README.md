# 🎓 Harvard Poll Platform (Lunr Poll)

A real-time polling application for classrooms, optimized for high-speed interaction between professors and students.

## 🚀 Features

### For Professors
*   **Dashboard:** Manage multiple class sessions.
*   **Session Builder:** Create polls with various question types (Short Text, Multiple Choice).
*   **Live Mode:** Launch sessions instantly and view real-time incoming responses.
*   **QR Code Sharing:** Generate a QR code that students can scan to join immediately (Auto-Join).
*   **Local Demo Mode:** Fully functional offline/demo mode for testing without Firebase authentication.

### For Students
*   **Instant Join:** Join via 6-character code or QR scan.
*   **Live Questions:** Questions appear in real-time as the professor launches them.
*   **No Login Required:** Frictionless entry for maximum participation.

## 🛠️ Technology Stack

*   **Framework:** [Next.js 15](https://nextjs.org/) (App Router)
*   **Styling:** [Tailwind CSS](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/)
*   **Backend:** [Firebase](https://firebase.google.com/) (Firestore for real-time data, Auth for professors)
*   **Deployment:** Google Cloud Run (Dockerized)

## 📂 Project Structure

- `src/app/professor`: Dashboard, Login, and Session management pages.
- `src/app/student`: Student landing and joining logic.
- `src/app/session/[code]`: Real-time student view for answering questions.
- `src/components`: Reusable UI components (shadcn) and feature-specific components.
- `src/lib/firebase`: Firebase client initialization and utilities.
- `src/hooks`: Custom hooks like `useSession` for real-time data subscription.

## 🏗️ Implementation Details

*   **Real-time Updates:** Uses Firestore `onSnapshot` listeners to push question state changes and new answers immediately to connected clients.
*   **Local Demo Mode:** A robust fallback system allows the app to function entirely in the browser using `localStorage` if Firebase Auth is restricted or for demo purposes.
*   **QR Auto-Join:** The student landing page detects `?code=...` in the URL and bypasses the input form.

## 🔮 What Needs to be Built (Roadmap)

1.  **Response Analysis:**
    *   Export results to CSV/Excel.
    *   Word cloud visualization for text responses.
    *   History view for closed sessions.

2.  **Advanced Question Types:**
    *   File Upload (Image/PDF) - *Scaffolding exists but backend storage needs implementation.*
    *   Ranking/Sorting questions.
    *   Click-on-image heatmaps.

3.  **Authentication & Security:**
    *   Enable real Google/Email auth providers in Firebase Console for production use beyond the "lunr" bypass.
    *   Implement row-level security (Firestore Security Rules) to lock down data access.

4.  **Student Experience:**
    *   "Waiting room" state before session goes live.
    *   Ability to see their own past submissions.

## 🏃‍♂️ Getting Started

1.  Clone the repo:
    ```bash
    git clone https://github.com/trishanpanch/lunr-poll.git
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Run locally:
    ```bash
    npm run dev
    ```
4.  **Professor Login (Demo):**
    *   Email: `lunr@lunr.studio`
    *   Password: `lunr`
