# Verification Guide: Sprint 3 (Live Mode)

**Goal**: Verify the full "Show on Projector" flow.

## 1. Setup
1.  Open Professor Activity Editor.
2.  Open `/u/handle` on a mobile device (or sim).

## 2. Verify "Present" Button (Editor)
1.  Click **Present**.
2.  Verify button turns Red/Pulse.
3.  *Participant*: Should see the activity immediately.

## 3. Verify Projector View (`/present` route)
1.  Navigate to `/professor/activity/[ID]/present`.
2.  **Verify**:
    *   Big Question Text.
    *   "Join at..." instruction.
    *   Floating Control Dock (Bottom).
    *   Participant Counter (should be 0 or 1).

## 4. Verify Live Responses
1.  *Participant*: Select an option ("Blue").
2.  **Verify Projector**:
    *   Counter increments.
    *   (If "Show Results" is OFF) -> Big "Responses are hidden" icon.
    *   (If "Show Results" is ON) -> Bar chart updates instantly.

## 5. Verify Controls
1.  **Toggle Results**: Click Eye Icon. Chart toggles.
2.  **Highlight Correct**: Click Check Icon. Correct bar turns Green.
3.  **Lock**: Click Lock Icon.
    *   *Visual check*: Icon changes.
    *   *Note*: Actual blocking of participant input requires Phase 2 rule enforcement, but the persistent state is tracked.
