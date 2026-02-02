# Application Walkthrough: Harvard Poll Platform

This document outlines the current state of the Harvard Poll Platform, detailed by user flow and page functionality, including actual screenshots from the live deployment.

## 1. Landing Page (Public)
**Path:** `/`  
**File:** `src/app/page.tsx`

The entry point for all users, designed with a clean, "Harvard Minimalist" aesthetic.

![Landing Page](docs/assets/01_landing.png)

*   **Header**: Contains the "HarvardPoll" logo and navigation buttons.
*   **Hero Section**: Large typography with "Start Teaching" and "I am a Student" CTAs.
*   **Benefits Grid**: Highlights key metrics and features.

---

## 2. Student Experience

### A. Student Landing (Join)
**Path:** `/student`  
**File:** `src/app/student/page.tsx`

A focused page for students to enter a session code.

![Student Join](docs/assets/02_student_join.png)

*   **Input**: Large input field for the 6-character session code.
*   **Functionality**: Auto-joins if `?code=` param is present.

### B. Student Session (Active)
**Path:** `/session/[code]`  
**File:** `src/app/session/[code]/page.tsx` & `src/components/student/*`

The main interface for a student participating in a class.

![Student Perspective](docs/assets/07_student_view.png)

*   **Question Types**:
    *   **Star Rating**: (Shown above) Interactive 5-star rating for "Rate the Class".
    *   **Short Text**: Text area for open feedback.
    *   **Multiple Choice**: Standard radio buttons.

---

## 3. Professor Experience

### A. Professor Logic / Signup
**Path:** `/professor`  
**File:** `src/app/professor/page.tsx`

Secure entry point for faculty.

![Professor Login](docs/assets/03_prof_login.png)

*   **Authentication**: Email/Password login via Firebase Auth.
*   **Toggle**: Switch between "Sign In" and "Sign Up".

### B. Dashboard
**Path:** `/professor/dashboard`  
**File:** `src/app/professor/dashboard/page.tsx`

The "hub" for managing classes.

![Professor Dashboard](docs/assets/04_prof_dashboard.png)

*   **Session List**: Grid of all created sessions.
*   **Actions**: "New Session" button to start a new poll.

### C. Session Command Center
**Path:** `/professor/session/[id]`  
**File:** `src/app/professor/session/[id]/page.tsx`

#### 1. Builder View (Status: DRAFT)
**Component:** `src/components/professor/SessionBuilder.tsx`

![Session Builder](docs/assets/05_session_builder.png)

*   **Presets**: Quick-add buttons for "Start, Stop, Continue" (Feedback Framework), "Rate the Class", "Polling / Vote", etc.
*   **Reorder**: Drag questions using the handle on the left to change their sequence.
*   **Launch**: "Launch Session" activates the poll.

#### 2. Live Dashboard (Status: OPEN)
**Component:** `src/components/professor/LiveDashboard.tsx`

**Empty State:**
![Empty Live Dashboard](docs/assets/06_live_dashboard.png)

**With Results:**
![Live Results](docs/assets/08_results.png)

*   **Real-time**: Bars update instantly as students vote.
*   **Active Count**: Shows number of students connected.

#### 3. Synthesis View (Status: CLOSED)
**Component:** `src/components/professor/SynthesisView.tsx`

![AI Synthesis Report](docs/assets/09_synthesis.png)

*   **AI Analysis**: Generates "Consensus", "Confusion Points", and "Recommended Actions".
*   **Raw Data**: Scrollable list of text responses.

---

### Synchronous Pacing Verification (V2)
**Date:** 2026-01-30
**Verification Goal:** Confirm the "Present" button correctly updates the student view after fixing the API route.

#### 1. Student View - Question 1 Active
Professor clicked "Present" on Q1. Student sees the question input.
![Student View Q1](/Users/trishanpanch/.gemini/antigravity/brain/554fffcc-7012-4d63-b3a7-3e5f6c1b2ab0/student_view_q1_1769874202159.png)

#### 2. Student View - Question 2 Active
Professor clicked "Present" on Q2. Student view updated immediately.
![Student View Q2](/Users/trishanpanch/.gemini/antigravity/brain/554fffcc-7012-4d63-b3a7-3e5f6c1b2ab0/student_view_q2_1769874298208.png)

#### 3. Student View - Waiting State
Professor clicked "Stop". Student sees the waiting message.
![Student View Waiting](/Users/trishanpanch/.gemini/antigravity/brain/554fffcc-7012-4d63-b3a7-3e5f6c1b2ab0/student_view_waiting_1769874477562.png)
