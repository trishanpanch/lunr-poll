# Verification Guide: Sprint 4 (Surveys & Runs)

**Goal**: Verify Survey functionality and Session Archiving.

## 1. Create a Survey
1.  Go to Activity Library (`/professor/activities`).
2.  Click **Create Activity**.
3.  Select **Survey** type.

## 2. Edit Survey
1.  Add 2 Questions:
    *   Q1: Multiple Choice ("How is the pace?").
    *   Q2: Open Ended ("Any comments?").
2.  Click Save.

## 3. Run & Take Survey
1.  **Student**: Open Mobile View (`/u/handle`).
    *   **Verify**: "Waiting for presentation..." screen appears.
2.  **Professor**: On the Activity Editor page, click **Present** (Play icon).
3.  **Student**:
    *   **Verify**: Screen automatically updates to show the Survey.
    *   Progress Bar (0%).
    *   Q1 appears. Select Option -> Progress moves.
    *   Q2 appears. Type text -> Click Next.
    *   Completion Screen ("You're all set!").

## 4. Archive / Reset
1.  Go to **Activity Settings** (Sidebar or Tab).
2.  Click **Archive & Reset**.
3.  Confirm dialog.
4.  **Verify**:
    *   Toast says "Archived X responses".
    *   Dashboard count resets to 0.
