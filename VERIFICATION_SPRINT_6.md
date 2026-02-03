# Verification Guide: Sprint 6 (Advanced Types)

**Goal**: Verify all new activity types function correctly.

## 1. Word Cloud
1.  **Create**: Activity -> **Word Cloud**.
2.  **Particpant**: Enter "Harvard" then Submit. Enter "Boston" then Submit. Enter "Harvard" again.
3.  **Projector**: "Harvard" should be Big/Red. "Boston" should be Small/Grey.

## 2. Clickable Image
1.  **Create**: Activity -> **Clickable Image**.
2.  **URL**: Paste `https://upload.wikimedia.org/wikipedia/commons/thumb/b/b6/Image_created_with_a_mobile_phone.png/640px-Image_created_with_a_mobile_phone.png` (or any public URL).
3.  **Participant**: Image loads. Click Top-Left. Pin appears. Submit.
4.  **Projector**: Dot appears at Top-Left.

## 3. Ranking
1.  **Create**: Activity -> **Ranking**.
2.  **Options**: A, B, C.
3.  **Participant**: Drag C to top. C, A, B. Submit.
4.  **Projector**: Bar chart shows score distribution (C should be leading).

## 4. Competition
1.  **Create**: Activity -> **Competition**.
2.  **Options**: X (Right), Y (Wrong). **Timer**: 30s.
3.  **Participant 1**: Select X quickly.
4.  **Participant 2**: Select X slowly.
5.  **Projector**: Leaderboard shows P1 > P2.
