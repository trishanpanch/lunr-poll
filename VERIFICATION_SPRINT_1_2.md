# Verification Guide: Sprints 1 & 2

The following steps authenticate the features implemented in **Sprint 1 (Activity Library)** and **Sprint 2 (Participation Loop)**.

## Prerequisites
1.  **Professor Account**: You need a professor account.
    *   If you don't have one, go to `/professor` and sign up with code `02143` (or your enviroment variable).
2.  **Mobile Device**: For testing the participation flow.

## 1. Activity Library (Sprint 1)
**Goal**: Verify you can manage Activities and Folders.

1.  Navigate to `/professor/activities`.
2.  **Create Folder**: Click "New Folder", name it "Test Course".
3.  **Enter Folder**: Click "Test Course".
4.  **Create Activity**: Click "New Activity", select "Multiple Choice".
5.  **Verify**: You are redirected to the Editor.

## 2. Activity Editor (Sprint 1)
**Goal**: Verify authoring works.

1.  **Edit Title**: Change title to "Color Poll".
2.  **Edit Prompt**: Type "What is your favorite color?".
3.  **Edit Options**:
    *   Add "Red".
    *   Add "Blue".
    *   Mark "Red" as correct (toggle checkmark).
4.  **Settings**: Open sidebar, verify "Anonymous" is toggled on/off.
5.  **Persistence**: Refresh the page. Ensure your changes are still there.

## 3. Live Activation (Sprint 2)
**Goal**: Verify "Present" mode.

1.  In the Editor, click the **"Present"** button (Top Right).
2.  Verify it turns **Red** ("Stop Presenting").
3.  This sets your account's `currentActivityId` to this activity.

## 4. Participant Flow (Sprint 2)
**Goal**: Verify a student can join.

1.  **Find your Handle**:
    *   Currently, the system uses your UID or Handle. 
    *   *Self-Correction*: Since we haven't built a "Edit Profile" page yet, check the URL in the participant view.
    *   *Dev Note*: If you don't have a handle set in Firestore, the resolve logic might fail unless you manually updating your user doc in Firestore to have `handle: "yourname"`.
    *   **Workaround**: Use the Simulator or check your user document ID.
2.  **Visit Participant Page**:
    *   Go to `http://localhost:3000/u/yourhandle` (or whatever handle you set).
3.  **Verify Active State**:
    *   You should see "Color Poll".
    *   Select "Red".
    *   You should see "Response recorded".
4.  **Verify Wait Screen**:
    *   Go back to Professor Editor.
    *   Click "Stop Presenting".
    *   Participant screen should instantly change to "Waiting for presentation...".

## 5. Data Check
1.  Check Firestore `responses` collection.
2.  You should see a new document with your `participantId` and `optionId`.
