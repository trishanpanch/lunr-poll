# Harvard Poll Platform

A real-time classroom interaction platform for Harvard University professors, built with Next.js 15, Firebase, and Google Vertex AI.

## Features

- **Student Flow**: Join via 6-character code, no login required (Anonymous Auth). Real-time optimistic updates.
- **Professor Dashboard**: Manage sessions, build dynamic polls, view live results with charts / tickers.
- **AI Synthesis**: "Close & Analyze" triggers Google Gemini (Vertex AI) to synthesize hundreds of open-ended responses into actionable pedagogical advice.
- **Design**: "Harvard Minimalist" aesthetic using Tailwind CSS & Shadcn UI.

## Setup Instructions

### 1. Environment Variables

Copy `.env.example` to `.env.local` and fill in your Firebase and Google Cloud credentials.

```bash
cp .env.example .env.local
```

You need a Firebase Project with:
- **Authentication**: Email/Password (Professor) & Anonymous (Student).
- **Firestore Database**: Create default database in `Nam5` (us-central1) or similar.
- **Storage**: Enable Storage.

For AI features:
- Enable **Vertex AI API** in your Google Cloud Console.
- Ensure your local environment has credentials (e.g., `gcloud auth application-default login`) or set `FIREBASE_SERVICE_ACCOUNT_KEY` in env for server-side usage if not on GCP.

### 2. Firestore Rules

For the MVP, you can use these rules (update for production security!):

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /sessions/{sessionId} {
      allow read: if true; // Students need to read session to join
      allow write: if request.auth != null; // Professors create/update
    }
    match /responses/{responseId} {
      allow read: if request.auth != null; // Professors read responses
      allow write: if true; // Students write their responses
    }
    match /users/{userId} {
      allow read, write: if request.auth.uid == userId;
    }
  }
}
```

### 3. Run Locally

```bash
npm run dev
```

Visit `http://localhost:3000`.

## Architecture

- **Frontend**: Next.js 15 App Router, React Server Components + Client Components.
- **Styling**: Tailwind CSS v4, Framer Motion, Shadcn UI.
- **Backend**: Next.js API Routes (`/api/synthesize`), Firebase Admin SDK.
- **Real-time**: Cloud Firestore `onSnapshot`.

## Deployment

Deploy to **Firebase App Hosting** or **Vercel**.
If deploying to Vercel, ensure you add the Environment Variables in the project settings.
