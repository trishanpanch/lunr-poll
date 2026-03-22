# Settings — Product Requirements Document

**Product:** AlicePoll / Harvard Poll Session Builder
**Status:** Draft for Review
**Last Updated:** March 2026

---

## Overview

This document defines the requirements for a Settings area within the session builder application. Settings are divided into four domains: **Professor / Account**, **Session Defaults**, **Student Experience**, and **System / Administration**. Each section describes the purpose, individual settings, their default values, and implementation notes.

The Settings page should be accessible from the professor dashboard sidebar (a gear icon at the bottom of the nav) and should persist all values to the database so they survive across devices and sessions.

---

## 1. Professor / Account Settings

These settings are scoped to the logged-in professor's account. When authentication is disabled (demo mode), they fall back to `localStorage`.

| Setting | Type | Default | Description |
|---|---|---|---|
| **Display Name** | Text input | Empty | The name shown to students in the session header (e.g. "Prof. Smith's Class"). |
| **Institution / Course Name** | Text input | Empty | Appears as a subtitle under the session name in Live Mode and on the student join screen. |
| **Default Session Name Template** | Text input | `Untitled Session` | Pre-fills the session name field when creating a new session. Supports tokens like `{date}` and `{course}`. |
| **Email Notifications** | Toggle | Off | Sends a summary email to the professor when a session is closed, including total responses and a CSV attachment. Requires auth to be enabled. |
| **Theme Preference** | Select (Light / Dark / System) | Light | Controls the professor-facing UI theme. Student pages are always dark. |

---

## 2. Session Defaults

These settings define the default behaviour for every new session created by this professor. They can be overridden per-session in the Session Builder.

| Setting | Type | Default | Description |
|---|---|---|---|
| **Allow Late Joins** | Toggle | On | Whether students can join after the first question has already been launched. |
| **Show Response Count to Students** | Toggle | Off | Displays a live "N responses received" counter on the student's screen after they submit. |
| **Auto-Advance Questions** | Toggle | Off | Automatically advances to the next question after a configurable timer expires. |
| **Auto-Advance Timer** | Number (seconds) | 30 | Duration before auto-advance. Only active when Auto-Advance is enabled. Range: 10–300 s. |
| **Anonymous Responses** | Toggle | On | When on, responses are stored without a student identifier. When off, the student's self-reported name or device ID is recorded. |
| **Max Responses Per Student** | Number | 1 | How many times a student can answer the same question. Set to `1` to enforce one-answer-per-question. |
| **Default Question Type** | Select | Short Text | The question type pre-selected when the "Add Question" picker opens. |

---

## 3. Student Experience Settings

These settings control what students see and how they interact with the live session.

| Setting | Type | Default | Description |
|---|---|---|---|
| **Waiting Room Message** | Textarea | `Your professor will start the session soon.` | Custom message displayed to students in the waiting room before the session goes live. Supports basic markdown (bold, italic, links). |
| **Session Ended Message** | Textarea | `Thanks for participating!` | Message shown on the student's screen when the professor closes the session. |
| **Require Student Name** | Toggle | Off | If enabled, students must enter a display name before joining. The name is stored with their responses. |
| **Show Question Number to Students** | Toggle | On | Displays "Question 2 of 5" on the student's screen. Revealing the total count is optional (see below). |
| **Reveal Total Question Count** | Toggle | On | When off, students see "Question 2" without knowing how many remain. Reduces anchoring bias in open-ended responses. |
| **Allow Response Editing** | Toggle | Off | Lets students change their answer before the professor advances to the next question. |
| **Branding / Logo URL** | URL input | Empty | A URL to an image displayed in the student join screen header. Useful for institutional branding. |
| **Primary Accent Color** | Color picker | `oklch(0.45 0.22 264)` (indigo) | The highlight color used for buttons and active states on the student-facing pages. |

---

## 4. Live Mode Settings

These settings control the professor's Live Mode view.

| Setting | Type | Default | Description |
|---|---|---|---|
| **Response Polling Interval** | Select (1s / 2s / 5s) | 2s | How frequently the Live Mode panel polls for new responses. Lower values increase server load. |
| **Show Word Cloud by Default** | Toggle | Off | When on, Short Text response panels open in Word Cloud view instead of List view. |
| **Show Correct Answer Overlay** | Toggle | Off | For Multiple Choice and True/False questions with a model answer set, displays a green highlight on the correct option in the Live Mode chart. |
| **Confetti on Launch** | Toggle | On | Plays a brief confetti animation when the professor clicks "Launch Session". |

---

## 5. Export & Data Settings

| Setting | Type | Default | Description |
|---|---|---|---|
| **CSV Date Format** | Select (ISO 8601 / US / EU) | ISO 8601 | Controls the timestamp format in exported CSV files. |
| **CSV Include Student ID** | Toggle | On | Whether the anonymous student device ID is included as a column in CSV exports. |
| **Auto-Delete Closed Sessions After** | Select (Never / 30 days / 90 days / 1 year) | Never | Automatically purges closed sessions and their responses after the selected period. Requires confirmation before enabling. |
| **Export Format** | Select (CSV / Excel) | CSV | Default format for the "Download" button in Live Mode and Past Sessions. Excel export requires server-side generation. |

---

## 6. System / Administration Settings

These settings are only visible to users with the `admin` role. They control platform-wide behaviour.

| Setting | Type | Default | Description |
|---|---|---|---|
| **Authentication Required** | Toggle | Off (demo mode) | When on, all professor-facing pages require a Manus OAuth login. Student pages remain public. |
| **Max Sessions Per User** | Number | Unlimited | Caps how many sessions a single professor account can create. Useful for rate-limiting in shared deployments. |
| **Max Questions Per Session** | Number | 50 | Hard cap on questions per session to prevent abuse. |
| **Max Responses Per Session** | Number | 500 | Hard cap on student responses per session. Excess responses are silently dropped. |
| **Demo Mode Banner** | Toggle | On | Shows a yellow "Demo Mode — auth disabled" banner at the top of all professor pages when authentication is off. |
| **Analytics** | Toggle | On | Enables page-view and session-launch analytics (privacy-preserving, no PII). |

---

## Implementation Notes

**Persistence.** Professor, Session Default, Student Experience, and Live Mode settings should be stored in a `professorSettings` table keyed by `userId` (nullable for demo mode, falling back to a `localStorage` key). System settings should be stored in a separate `systemSettings` singleton table.

**Settings page layout.** The Settings page should use a two-column layout on desktop: a left nav listing the five sections, and a right panel showing the active section's fields. On mobile, the left nav collapses into a top tab bar.

**Validation.** All numeric fields should enforce their stated ranges client-side with inline error messages. URL fields (e.g. Branding Logo URL) should validate format and optionally preview the image inline.

**Unsaved changes guard.** The Settings page should track dirty state and show a "You have unsaved changes" banner with Save and Discard buttons, consistent with the Session Builder's existing pattern.

**Rollout order.** The recommended implementation sequence is:

1. Session Defaults (highest impact, directly improves every new session)
2. Student Experience (waiting room message, session ended message, require name)
3. Live Mode Settings (polling interval, word cloud default)
4. Export & Data (CSV format, auto-delete)
5. Professor / Account (display name, theme, notifications)
6. System / Administration (auth gate, caps — last because it requires role-based access control to be fully enabled)
