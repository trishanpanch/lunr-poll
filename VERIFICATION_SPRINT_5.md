# Verification Guide: Sprint 5 (Q&A & Moderation)

**Goal**: Verify Chat, Upvoting, and Moderation flow.

## 1. Create Q&A Activity
1.  **Professor**: Create Activity -> **Q&A**.
2.  Title: "What's on your mind?".
3.  **UI Check**: You should see the Moderation Dashboard (Two columns: Live Q&A and possibly Moderation Queue if enabled).

## 2. Participant Flow
1.  **Mobile**: Join `/u/handle`.
2.  **Ask**: Type "When is the exam?" -> Send.
3.  **Verify**: It appears in "Live Q&A" view (unless filtered).

## 3. Professor Moderation
1.  **Dashboard**: You should see "When is the exam?" in the Live list.
2.  **Action**: Click **Star** (Feature).
3.  **Verify Mobile**: The question should pop to the top with a Highlight.
4.  **Action**: Click **Eye Off** (Hide).
5.  **Verify Mobile**: Question disappears.

## 4. Enable Moderation Queue
1.  **Professor**: Click "Enable Moderation View" (bottom right).
2.  **Mobile**: Ask "Can I get a hint?".
3.  **Professor**: Verify it appears in the **Right Column** (Queue). It is NOT in the Left Column.
4.  **Action**: Click **Approve**.
5.  **Verify**: Moves to Left Column. Appears on Mobile.
