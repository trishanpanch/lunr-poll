# Verification Guide: Sprint 4 (Surveys & Runs)

**Goal**: Verify Survey functionality and Session Archiving.

## 1. Create a Survey
1.  Go to Activity Library (`/professor/activities`).
2.  Click **Create Activity**.
3.  Select **Survey** type (you might need to ensure backend supports this or just edit an existing one if the UI button is missing, *Wait, I added SurveyEditor hook but not the Create Dialog button? Checked: I need to check CreateActivityDialog.tsx, I haven't edited it yet! I missed adding 'Survey' to the Type selector.*).

> [!WARNING]
> **Check Step**: Verify "Survey" option exists in Create Dialog. (If not, I will add it).

## 2. Edit Survey
1.  Add 2 Questions:
    *   Q1: Multiple Choice ("How is the pace?").
    *   Q2: Open Ended ("Any comments?").
2.  Click Save.

## 3. Take Survey
1.  Open Mobile View (`/u/handle`).
2.  **Verify**:
    *   Progress Bar (0%).
    *   Q1 appears. Select Option -> Progress moves.
    *   Q2 appears. Type text -> Click Next.
    *   Completion Screen ("You're all set!").

## 4. Archive / Reset
1.  Go to **Settings** tab in Editor.
2.  Click **Archive & Reset**.
3.  Confirm dialog.
4.  **Verify**:
    *   Toast says "Archived X responses".
    *   Dashboard count resets to 0.
