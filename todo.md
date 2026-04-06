# Project TODO

## Bugs
- [x] AI generation 401 error — VITE_FRONTEND_FORGE_API_KEY is invalid; needs backend proxy route using BUILT_IN_FORGE_API_KEY
- [x] Session state not cleared on new session — old name/code/questions persist when leaving without saving and starting a new session

## Features
- [x] AI panel → collapsible drawer — convert the Generate with AI sidebar into a slide-in drawer with a tab handle and backdrop overlay

## Polish
- [x] Changelog mono font — apply monospace font to the "Changelog" header pill and "N updates" count badges (tag badges already done)
- [x] Changelog should not visually affect the Design System page — confirm styles are fully scoped and do not bleed across routes (all styles are inline, no shared CSS imports)
- [x] Favicon in dashboard view — removed from scope

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
- [x] AI preview card selection — cards start selected; clicking toggles deselection

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
- [x] Student Experience: "Waiting room" state before session goes live — friendly waiting page with auto-redirect when session starts
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

## Sprint — UI Polish (cont. 3)
- [x] Remove pencil icon from session name input hover state
- [x] Lighten placeholder text color in session name input
- [x] Fix "Saved" button state — should not show "Saved" on a brand-new unsaved session

## Sprint — Q-Number Reorder
- [x] Q-number badge: clicking it opens a dropdown showing all positions to select from
- [x] Selecting a position moves the question to that slot, shifting others

## Sprint — Settings Feature
- [x] DB schema: add `professorSettings` table with all settings columns
- [x] DB migration: run pnpm db:push
- [x] DB helpers: getSettings / upsertSettings in db.ts
- [x] tRPC router: settings.get and settings.save procedures
- [x] Wire settings router into appRouter
- [x] Settings page: /settings route with 6 sections (Session Defaults, Student Experience, Live Mode, Export & Data, Professor/Account, System)
- [x] Settings page: two-column layout (left nav + right panel) on desktop, tab bar on mobile
- [x] Settings page: unsaved-changes guard with Save / Discard banner
- [x] Settings page: wire all form controls to tRPC get/save
- [x] App.tsx: register /settings route
- [x] Navigation: add Settings link to bottom nav and Sessions dashboard sidebar
- [x] Session builder: apply session default settings when creating a new session
- [x] Vitest: add tests for settings.get and settings.save procedures

## Bug — Session Builder Sidebar Height
- [x] Fix left sidebar and right panel not extending to bottom of page when scrolling

## Bug — Session Builder AI Panel Divider
- [x] Add divider line to the left of the AI panel (matching the right border of the left sidebar)

## Polish — Question Card Header
- [x] Remove standalone question type icon (keep only the dropdown with icon+label)
- [x] Shift the type dropdown 4px to the left

## Polish — Question Type Dropdown
- [x] Remove Star Rating and File Upload from the interchangeable type-switch dropdown

## Dev Tool — Type Dropdown X-Offset Slider
- [x] Add a small slider in the session builder canvas to control the type dropdown X offset interactively

## Polish — Type Dropdown Fine-tuning
- [x] Slider should only shift the dropdown button X position, not the whole content area
- [x] Revert content area marginLeft to 0 (remove the -4 nudge from the whole block)
- [x] Increase gap between icon and label text inside the dropdown by 4px

## Feature — Dark Mode
- [x] Research Manus dark mode color values
- [x] Update index.css .dark variables to match Manus dark mode
- [x] Wire ThemeProvider to support light/dark toggle
- [x] Fix hardcoded oklch/hex colors in Home.tsx for dark mode
- [x] Fix hardcoded colors in Sessions.tsx, Settings.tsx, other pages
- [x] Add theme toggle button to app header/nav
- [x] Update changelog with dark mode entry

## Bug — Dark Mode Remaining Issues
- [x] Audit all pages in dark mode and identify hardcoded white/light colors
- [x] Fix Home.tsx (session builder) remaining hardcoded colors
- [x] Fix Sessions.tsx remaining hardcoded colors
- [x] Fix Settings.tsx remaining hardcoded colors
- [x] Fix Landing.tsx, Join.tsx, LiveSession.tsx, StudentSession.tsx, SessionResults.tsx
- [x] Remove ThemeContext debug console.log statements
- [x] Update changelog with dark mode fix entry

## Design System — Saved State Button
- [x] Find all "Saved" state button instances across the codebase
- [x] Normalize all instances to: outlined border, green CheckCircle2 icon, "Saved" label, no fill

## Design System — Shared SavedButton & DiscardButton Components
- [x] Create shared SavedButton component (outlined, green CheckCircle2 icon, green text, no fill)
- [x] Create shared DiscardButton component (outlined, muted text, RotateCcw icon)
- [x] Replace inline Save Draft / Saved button in Home.tsx with SavedButton
- [x] Replace inline Save / Saved button in Settings.tsx with SavedButton
- [x] Replace inline Discard button in Settings.tsx with DiscardButton
- [x] Update changelog with design system component extraction entry
- [x] Add SavedButton and DiscardButton to Design System page with live examples
- [x] Remove Save icon from SavedButton dirty state (text only)

## Feature — Resizable AI Panel
- [ ] Make AI panel (right sidebar) resizable by dragging its left edge
- [ ] Persist panel width in localStorage
- [ ] Show visual drag handle on the divider line
- [ ] Test in both light and dark modes

## Bug — Dark Mode AI Panel Contrast
- [x] Fix AI panel header text color (too dark in dark mode)
- [x] Fix AI panel description text color (too dark in dark mode)
- [x] Fix AI panel background gradient (too dark in dark mode)
- [x] Replace hardcoded oklch/hex colors with CSS variables in AiPanel

## Feature — Resizable AI Panel
- [x] Add AI panel width state with localStorage persistence
- [x] Implement drag-from-edge resize (Manus-style, no visible handle)
- [x] Update gradient background to use dynamic panel width
- [x] Disable transition during active resize for smooth dragging

## Accessibility — Dark Mode Contrast Audit
- [x] Scan all pages for hardcoded light-only colors (oklch light values, #fff, #000, white/black hex)
- [x] Fix contrast issues in Home.tsx (session builder, sidebar, topbar, modals)
- [x] Fix contrast issues in Sessions.tsx
- [x] Fix contrast issues in Settings.tsx
- [x] Fix contrast issues in LiveSession.tsx
- [x] Fix contrast issues in DesignSystem.tsx
- [x] Replace all hardcoded oklch/hex colors with CSS variables across all pages
- [x] Add --destructive-border CSS variable to light and dark themes

## Bug — Session Not Found on /session/:id
- [x] Diagnose "Session not found" error on /session/60004 (stale URL, session deleted/rolled back)
- [x] Add graceful error handling: show toast and reset to new session when ID not found in DB

## Bug — AI Tab Handle Icon Not Visible
- [x] Find AI tab handle icon in Home.tsx
- [x] Fix icon color to #fff (always visible against violet/crimson gradient background)

## Polish — AI Panel Selection State Visibility
- [x] Add Selection States section to Design System page with live examples (Indigo for general UI, Violet for AI panel)
- [x] Update question type filter buttons selection state in AI panel to match Design System (violet border + violet-light bg)
- [x] Update question count selector selection state in AI panel to match Design System (violet border + violet-light bg)

## Polish — AI Panel Collapse Button
- [x] Replace X close button with ChevronsRight collapse button in AI panel header

## Polish — AI Panel Collapse Button Alignment
- [x] Align ChevronsRight button with AI panel content margins (removed right padding so icon sits flush at 18px edge)

## Feature — Persist AI Panel Collapsed State
- [x] Read AI panel open/close state in Home.tsx
- [x] Initialize state from localStorage on mount (lazy useState initializer)
- [x] Write to localStorage whenever state changes (useEffect on aiPanelOpen)

## Feature — Collapsible Left Sidebar (Manus-style)
- [x] Read current left sidebar structure in Home.tsx
- [x] Add collapsed state with localStorage persistence
- [x] Show icon-only strip when collapsed, full labels when expanded
- [x] Add toggle button (PanelLeftClose / PanelLeftOpen icons)
- [x] Smooth width transition between states
- [x] Show tooltips on icons when collapsed (native title attribute)

## Polish — Remove Icon Boxes
- [x] Remove colored rounded-square icon boxes from question type icons everywhere (dialog tiles, question card badges, AI panel, type dropdown)

## Feature — AI Panel Post-Generation Flow
- [x] After adding generated questions, return to pre-generation panel keeping source material (URLs, files, pasted text) but clearing objectives and generated results
- [x] Add "Start fresh" button to reset all source material, objectives, and results to blank state

## Feature — Persist AI Panel Width
- [x] Save AI panel width to localStorage on resize; restore on mount (fixed stale closure bug)

## Polish — Toast After Adding Questions
- [x] Show "N question(s) added to session" toast after clicking Add Questions in the AI panel

## Feature — Tap to Copy Session Code
- [x] Make session code tappable/clickable to copy on the sessions page, with visual feedback (brief "Copied!" state)

## Feature — Move to Draft (Reactivate Past Session)
- [x] Add tRPC procedure to reset a closed session's status back to draft
- [x] Add "Move to Draft" action to past session cards (direct button in row actions)
- [x] After moving to draft, session appears in Active tab and is editable/re-launchable

## Feature — Tap to Copy Session Code (continued)
- [x] Apply tap-to-copy treatment to list view code badge (past sessions tab)

## Feature — Question Media Attachments (Photos)
- [x] Add optional mediaUrl field to Question type in drizzle/schema.ts and session router Zod schema
- [x] Add tRPC mutation for uploading a question photo to S3 and returning the URL
- [x] Add photo upload/remove UI to question cards in the session builder (above question text area)
- [x] Display photo above question text in the live session professor view
- [x] Display photo above question text in the student join/answer view

## Polish — MC Option Letter Prefixes
- [x] Strip "A) ", "B) " etc. prefixes from MC option text in the editor and AI-generated questions

## Feature — Question Photo Attachments
- [x] Add server-side /api/upload-question-media endpoint (multipart, S3 upload, returns URL)
- [x] Add "Add image" button to each question card in the session builder
- [x] Show thumbnail preview with remove (×) button on cards that have a mediaUrl
- [x] Display image above question text in live session view (professor screen)
- [x] Display image above question text in student join/answer view

## Polish — Sticky Generate Button in AI Panel
- [x] Make Generate Questions button sticky at the bottom of the AI panel so it's always visible regardless of scroll position

## AI Deduplication
- [x] Pass existing session questions to AI generation so generated questions avoid duplicating saved ones

## Image Attachment Display
- [x] Fix question photo display: preserve original aspect ratio (no cropping), apply max-height constraint only

## Onboarding Persistence
- [x] Persist onboarding dismissed state to localStorage so it does not reappear after page refresh

## Image Attachment Polish
- [x] Add spacing between question text and image, and internal padding inside the image container

## Image Lightbox
- [x] Tap question photo to expand full-screen lightbox; tap backdrop or press Escape to close (all three views)

## Photo Remove Button
- [x] Replace ImageOff icon with plain X; add confirm dialog before removing photo attachment

## Sprint — AI Deduplication + Onboarding Persistence
- [x] Persist onboarding dismissed state to localStorage so it does not reappear after page refresh
- [x] Pass existing session question texts to AI generation prompt so AI avoids near-duplicate questions

## Question Card Three-Dot Menu
- [x] Move Add image / Remove image into a three-dot overflow menu in the top-right of each question card; remove inline Add image button from card footer

## Confirm Delete Question
- [x] Add confirm dialog to Delete question in the three-dot menu

## Preview Image Fix
- [x] Show question photo attachments in the session preview

## Session Code Badge
- [x] Remove copy icon from the session code badge in the topbar

## Zoom Icon Restyle
- [x] Make zoom icon plain black with no background, position in bottom corner of image container

## Zoom Icon Position Sliders
- [x] Add X/Y sliders to adjust zoom icon position on question images, persisted to localStorage (cancelled — icon removed instead)

## Zoom Icon Removal
- [x] Remove zoom icon entirely from question image containers in all three views

## Changelog Update
- [x] Add changelog entries for all recent updates

## Duplicate Session
- [x] Add server-side duplicate tRPC procedure (copies session + questions as new draft)
- [x] Add Duplicate option to session card overflow menu on Sessions page

## Sticky Generate Button
- [x] Pin Generate Questions button to bottom of AI panel (sticky footer) so it's always visible when the preview list is long

## File Type Restriction
- [x] Restrict question media file picker to JPEG/PNG/GIF/WebP; add client-side MIME validation fallback with toast error

## AI Panel Post-Add Behaviour (Option B)
- [x] Keep AI panel open after adding questions; reset to source material view (clear generated list, scroll to top)
- [x] Strengthen deduplication: send full question details (type, options, model answer) to the AI prompt instead of just question text

## Feature — LMS Integrations
- [x] Add lmsConnections table to schema (userId, provider, instanceUrl, apiToken, createdAt)
- [x] Add lmsSyncLog table to schema (sessionId, provider, courseId, columnId, syncedAt, status, error)
- [x] Run pnpm db:push to migrate schema
- [x] Add Canvas API helper (server/lms/canvas.ts): fetchCourses, createGradeColumn, pushGrades
- [x] Add tRPC lms router: connect, disconnect, listConnections, listCourses, syncSession, listSyncLogs
- [x] Add CSV export endpoint: GET /api/export/session/:id/csv (Canvas format + generic format)
- [x] Build LMS Integrations settings page (client/src/pages/LmsIntegrations.tsx)
- [x] Add Canvas connection form (instance URL + API token, test connection button)
- [x] Add connected Canvas accounts list with disconnect button
- [x] Add "Sync to LMS" button on session results page with course picker modal
- [x] Add CSV export button on session results page
- [x] Add LTI 1.3 scaffolding section (UI placeholder with "Contact your LMS admin" instructions)
- [x] Register /integrations route in App.tsx
- [x] Add Integrations nav item to Settings or sidebar
- [x] Write vitest tests for Canvas API helper and sync procedure

## Feature — Learning Objectives Guardrails
- [x] Tier 1: Strengthen suggest-objectives system prompt to explicitly exclude administrative/biographical content
- [x] Tier 2: Add post-generation classification filter pass to reject non-academic objectives

## Feature — Likert Scale & Numeric Scale Question Types
- [x] Add "Likert Scale" and "Numeric Scale" to QuestionType union and TYPE_META
- [x] Likert Scale: 5-point labeled scale with preset label sets (Agreement, Confidence, Frequency, Satisfaction) + custom labels + reset to default
- [x] Numeric Scale: 1–10 slider/row with custom min/max labels and configurable range + reset to default
- [x] Session builder card editor: render label editors for both types
- [x] Sidebar: add both types to the Add a Question grid
- [x] StudentSession: render Likert as labeled button row, Numeric as number row
- [x] LiveSession: render live response distribution for both types
- [x] SessionResults: render bar chart / distribution for both types
- [x] normaliseType: handle any legacy type name mismatches

## Rename — Likert Scale → Labeled Scale
- [x] Replace all "Likert Scale" strings with "Labeled Scale" across all source files
- [x] Add "Likert Scale" → "Labeled Scale" to normaliseType for backward compatibility with existing DB data

## Feature — Download QR Code as PNG
- [x] Add Download QR Code button to the live session QR display
- [x] Implement PNG export using canvas drawImage from the SVG QR element
- [ ] Add Download QR as PNG button to My Sessions dashboard QR modal

## Polish — Session Card Cleanup
- [x] Remove question type icon badges from My Sessions session cards
- [x] Add Download QR as PNG button to My Sessions QR modal
- [x] QR modal: all three buttons in one row with consistent white/outlined style, wider modal
- [x] Show instructor answer key in live session view
- [x] Show instructor answer key in session preview modal
- [x] Auto-join session when QR code is scanned (skip code entry screen)
- [x] Dev mode bar visible on student session pages
- [x] Draggable PiP student preview window in instructor live session view
- [x] Bento two-column layout: student preview docked left, instructor panel right
- [x] Pop-out student preview into separate browser window (like YouTube PiP), synced with current question
- [x] Fix vertical alignment of ANSWER label and answer text in live session green banner
- [x] Use native Document Picture-in-Picture API for chromeless student preview overlay (like YouTube PiP)
- [x] Fix student preview panel border radius to match app design system
- [ ] Add phone-frame bezel to student preview (notch, status bar, rounded corners)
- [x] Replace AI question count selector with slider (4-12 range)
- [x] Ensure shared links include session code and auto-join students directly
