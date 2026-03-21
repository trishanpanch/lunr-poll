# Project TODO

## Bugs
- [x] AI generation 401 error — VITE_FRONTEND_FORGE_API_KEY is invalid; needs backend proxy route using BUILT_IN_FORGE_API_KEY
- [x] Session state not cleared on new session — old name/code/questions persist when leaving without saving and starting a new session

## Features
- [x] AI panel → collapsible drawer — convert the Generate with AI sidebar into a slide-in drawer with a tab handle and backdrop overlay

## Polish
- [x] Changelog mono font — apply monospace font to the "Changelog" header pill and "N updates" count badges (tag badges already done)
- [x] Changelog should not visually affect the Design System page — confirm styles are fully scoped and do not bleed across routes (all styles are inline, no shared CSS imports)
- [ ] Favicon in dashboard view — clarify which dashboard (Manus UI vs. My Sessions vs. browser tab) and fix the wrong icon

## Completed
- [x] Standardise null states — professor-facing null states (session builder + my sessions) use same typography and full-opacity emoji; join session screen also uses full-opacity emoji
- [x] Update design system interaction patterns
- [x] Fix color swatches not showing in Design System (missing --green, --amber, --destructive-light tokens)
- [x] Add True/False to Question Types section in Design System
- [x] Update null state documentation in Design System
- [x] Replace fake AI generation with real Forge API call using knowledge-atom extraction prompt
- [x] Pass MC options and correctAnswer through to session when adding AI-generated questions
- [x] Show MC options and TF answer inline in AI panel preview cards
- [x] Change "Add another question" button icon from ChevronRight to Plus
- [x] Change Changelog tag badge font to monospace (Geist Mono)
- [x] AI preview cards — text cut off — question text textarea, MC option inputs, and model answer textarea all clip content; fix with auto-height textareas and wrapping inputs
- [x] AI drawer tab — tab doesn't open the drawer; also move tab from vertical-center to top of the panel
- [x] URL source material — add URL input to AI panel; server fetches page and extracts text; extracted text populates the source material textarea
- [x] URL source material — rework: URL should be stored as a chip (not pasted into textarea); text is fetched invisibly at generate time on the server
- [x] Short Text model answer — show model answer on the question card in the builder canvas (currently only visible in the AI preview, disappears after adding)
- [x] Editable model answer on card — click-to-edit inline, same pattern as question text
- [x] Editable model answer on card — click-to-edit inline on Short Text cards
- [x] Manual Short Text modal — add optional model answer field
- [x] Session edit flow — Edit button on session card loads saved questions and name into builder
- [x] Duplicate URL toast — show a warning toast when the same URL is added to the AI panel source chips more than once
- [ ] AI preview card selection — cards should start selected; clicking deselects (or re-selects) them; currently tapping in feels like it unchecks unexpectedly

## Session 2026-03-21 Improvements
- [x] Fix sidebar full-height issue — left sidebar and AI panel now use sticky positioning (top: 64px, height: calc(100vh - 64px)) so they stay visible while the canvas scrolls naturally
- [x] Cmd/Ctrl+S keyboard shortcut — triggers Save Draft from anywhere in the session builder
- [x] Inline type switching on canvas cards — Short Text, Multiple Choice, True/False switcher pills appear on each canvas question card (same transform API as AI panel)

## Learning Objectives Feature
- [x] Add Learning Objectives input section to AI panel (above or alongside source material)
- [x] Support multiple objectives as individual chips (add/remove)
- [x] Pass objectives to the generate-questions server route
- [x] Update AI prompt to use objectives to steer question focus and Bloom's taxonomy level
- [x] Persist objectives in localStorage so they survive panel close/reopen
- [x] Show objectives count on Generate button when objectives are active

## Canvas Inline Edit Fix
- [x] Inline edit textarea auto-resizes to show full question text (no clipping)

## Suggest Objectives from Material
- [x] Add /api/suggest-objectives server endpoint (takes content + urls, returns 3–5 objectives)
- [x] Add "Suggest from material" button to Learning Objectives section in AI panel
- [x] Show suggested objectives as dismissible chips (accept/reject individually)
- [x] Disable suggest button when no source material is present

## Type Switcher Dropdown
- [x] Replace horizontal type-switcher pills on canvas cards with a compact dropdown

## Current Sprint — Professor & Student Features
- [x] Professor Dashboard: persist sessions to DB (not just localStorage); list all sessions with status (draft/live/closed)
- [x] Session Builder: wire save/load to DB so sessions survive across devices
- [x] Live Mode: launch a session and stream real-time incoming student responses to the professor view
- [x] QR Code Sharing: generate a QR code for the session join URL; display in Live Mode
- [x] Auto-Join via QR: scanning QR code takes student directly to the join flow with code pre-filled
- [x] Student Join Page: join via 6-character code or QR scan (no login required)
- [x] Student Live Questions: questions appear in real-time as professor launches them
- [x] Local Demo Mode: fully functional offline/demo mode for testing without auth

## Roadmap (after current sprint)
- [x] Response Analysis: export results to CSV/Excel
- [x] Response Analysis: word cloud visualization for short-text responses
- [x] Student Experience: "Waiting room" state before session goes live
- [ ] Advanced Question Types: File Upload backend storage (scaffolding exists)
- [ ] Advanced Question Types: Ranking/Sorting questions
- [ ] Advanced Question Types: Click-on-image heatmap questions
- [ ] Auth & Security: enable real Google/Email auth providers for production
- [ ] Auth & Security: implement row-level security (Firestore Security Rules)
- [ ] Student Experience: "Waiting room" state before session goes live
- [ ] Student Experience: ability to see own past submissions

## Sprint — Analytics & Waiting Room Polish
- [x] CSV export: tRPC procedure to fetch all responses for a session and return as CSV string
- [x] CSV export: "Download CSV" button in Live Mode header
- [x] Word cloud: install d3-cloud, render word-frequency cloud in Live Mode for Short Text questions
- [x] Participant count: track unique student IDs that have polled/joined; expose via tRPC
- [x] Participant count: show live count in student waiting room ("N students joined")
- [x] Participant count: show live count in professor Live Mode header

## Sprint — Past Sessions Tab
- [x] Backend: tRPC procedure `session.results` — returns a closed session with all questions and their full response tallies
- [x] Backend: tRPC procedure `session.closedList` — returns only closed sessions for the professor (or reuse `session.list` with a filter)
- [x] UI: "Past Sessions" tab on the professor dashboard (Sessions.tsx) — lists closed sessions with date, question count, total responses
- [x] UI: `/results/:id` page — shows all questions with final response charts (bar, T/F, star, word cloud), total response count, and CSV download button
- [x] Route: register `/results/:id` in App.tsx
- [x] Vitest: add tests for `session.results` procedure

## Sprint — Remove Auth Gate for Testing
- [x] Frontend: remove login redirect from Sessions.tsx (professor dashboard)
- [x] Frontend: remove login redirect from Home.tsx (session builder) — no redirect existed
- [x] Frontend: remove login redirect from LiveSession.tsx — no redirect existed
- [x] Backend: convert professor tRPC procedures to publicProcedure with optional userId
- [x] Keep auth infrastructure intact (protectedProcedure, useAuth) for easy re-enabling later

## Sprint — Word Cloud in Live Mode
- [x] Add List / Word Cloud toggle to Short Text response panel in LiveSession.tsx
- [x] Word cloud auto-refreshes with each polling cycle (every 2s)

## Sprint — Past Sessions, Share Link, Word Cloud
- [x] Past Sessions tab: dedicated tab in Sessions.tsx listing closed sessions with date, participant count, response count, and "View Results" link to /results/:id
- [x] Share link button: "Copy join link" on session cards (copies https://alicepoll.com/join?code=XXXXXX)
- [x] Share link button: "Copy join link" in Live Mode header
- [x] Word cloud: List/Word Cloud toggle in Live Mode Short Text response panel (auto-refreshes with polling)

## Sprint — Student Mobile Flow
- [x] Join page: full-screen mobile-first layout, large 6-char code input with individual character boxes, auto-advance on complete, touch-friendly CTA
- [x] Join page: works on desktop too (centered card layout on wide screens)
- [x] Join page: auto-fill code from ?code= URL param (QR scan)
- [x] Student session: full-screen question cards, one question at a time
- [x] Student session: large tap-target answer buttons (MC, T/F, Star Rating)
- [x] Student session: Short Text — full-screen textarea with submit button anchored to bottom
- [x] Student session: animated submission confirmation screen ("Answer received ✓") before next question
- [x] Student session: waiting room — full-screen with participant count, animated pulse
- [x] Student session: session ended screen — thank you message
- [x] Student session: smooth slide/fade transitions between question states

## Sprint — UI Polish
- [x] LIVE indicator: change dot and label to red in StudentSession.tsx and LiveSession.tsx

## Bug — Join Link Not Working
- [x] /join?code=XSSNMY does not work — fixed: navigate path was /student/:id instead of /student/session/:id

## Sprint — End Session Confirmation
- [x] Add confirmation dialog to End Session button in LiveSession.tsx

## Sprint — UI Polish (cont.)
- [x] "Untitled Session" placeholder text should be gray in the session builder topbar

## Sprint — UI Polish (cont. 2)
- [x] Session name input: "Untitled Session" is now a true HTML placeholder — clears on focus, typed text is always black, reverts to gray placeholder if left empty
