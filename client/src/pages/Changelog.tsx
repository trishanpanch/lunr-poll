/*
  Changelog — Product & Design Improvements
  Design: Editorial / release-notes aesthetic.
  Clean white background, strong typographic hierarchy using Geist (headings/body) + Geist Mono (tags/codes).
  Indigo accent throughout. Category chips, entry cards with subtle hover lift.
  Per-day copy button formats content for Google Chat.
*/

import { useState } from "react";
import { Copy, Check } from "lucide-react";

// ── Data ───────────────────────────────────────────────────────────────────────

interface ChangelogDay {
  date: string;
  title: string;
  groups: ChangelogGroup[];
}

interface ChangelogGroup {
  category: string;
  color: string;
  items: ChangelogItem[];
}

interface ChangelogItem {
  title: string;
  description: string;
  tag: string;
}

const DAYS: ChangelogDay[] = [
  {
    date: "March 27, 2026",
    title: "Sessions UX, MC Polish & Media Groundwork",
    groups: [
      {
        category: "Sessions Dashboard",
        color: "oklch(0.48 0.18 160)",
        items: [
          {
            title: "Tap-to-copy session codes",
            description:
              "Session code badges on both the active grid cards and past session list rows are now clickable. Tapping a code copies it to the clipboard and flashes the badge green with a 'Copied!' label for 1.8 seconds before returning to its normal state. No tooltip or extra button needed — the code itself is the copy target.",
            tag: "Feature",
          },
          {
            title: "Move to Draft — reactivate past sessions",
            description:
              "Past session rows now include a 'Move to Draft' button. Clicking it resets the session status back to draft, clears the launched and closed timestamps, and resets the current question index to 0. The session immediately reappears in the Active tab, ready to edit and re-launch. A dedicated tRPC reactivate procedure handles the server-side update and is covered by three Vitest tests.",
            tag: "Feature",
          },
          {
            title: "Edit Session menu icon changed to pencil",
            description:
              "The 'Edit Session' item in the per-card overflow menu was using a BookOpen icon, which didn't clearly communicate editing. It has been replaced with a Pencil icon, consistent with the edit affordance used elsewhere in the app.",
            tag: "Polish",
          },
        ],
      },
      {
        category: "Session Builder",
        color: "oklch(0.52 0.22 290)",
        items: [
          {
            title: "Toast confirmation after adding AI-generated questions",
            description:
              "After clicking 'Add Questions to Session' in the AI panel, a green success toast now appears: 'N question(s) added to session' with the subtitle 'Source material kept — ready for another round.' It auto-dismisses after 3 seconds and correctly pluralizes for 1 vs. multiple questions.",
            tag: "Polish",
          },
          {
            title: "A) B) C) D) prefixes stripped from Multiple Choice options",
            description:
              "AI-generated Multiple Choice options frequently included letter prefixes like 'A) ', 'B) ', 'A. ', or '(A) ' baked into the option text, duplicating the letter badge already shown in the UI. Prefixes are now stripped at three layers: when AI responses are parsed into the preview panel, when questions are added to the session, and in the MCOptionRow component on render — so existing saved questions are also cleaned up immediately without requiring a re-save.",
            tag: "Bug Fix",
          },
          {
            title: "mediaUrl field added to Question schema",
            description:
              "An optional mediaUrl field has been added to the Question interface and Zod validator in preparation for photo attachments on questions. No upload UI is shipped yet — this is groundwork for the upcoming media attachment feature.",
            tag: "Infrastructure",
          },
        ],
      },
    ],
  },
  {
    date: "March 25–26, 2026",
    title: "Polling Preset, Changelog & Sidebar Cleanup",
    groups: [
      {
        category: "Session Builder",
        color: "oklch(0.52 0.22 290)",
        items: [
          {
            title: "Polling / Vote preset creates a Multiple Choice question",
            description:
              "The 'Polling / Vote' quick preset in the sidebar now creates a Multiple Choice question with two blank option slots instead of a Short Text question. Professors can fill in the options immediately after the preset is applied. A presetSource field on the question marks it as polling-origin for future use.",
            tag: "Feature",
          },
          {
            title: "Question type selector in AI panel restricted for polling questions",
            description:
              "For questions created from the Polling / Vote preset, the type-switch dropdown in the AI panel is limited to Text and Multiple Choice only, preventing accidental conversion to incompatible types.",
            tag: "Clarity",
          },
          {
            title: "Left sidebar question type buttons: boxes removed",
            description:
              "The rounded-square tinted background boxes behind question type icons in the left sidebar were removed. The sidebar now shows plain icon + label buttons without any box treatment, reducing visual noise and matching the cleaner style used elsewhere in the app after the March 24 icon cleanup.",
            tag: "Polish",
          },
        ],
      },
      {
        category: "Changelog",
        color: "oklch(0.52 0.18 200)",
        items: [
          {
            title: "March 24 changelog entry added",
            description:
              "A new entry was added to the Changelog page covering the March 24 session: AI panel post-generation flow (Option B), Start fresh button, width persistence bug fix, icon box removal, and purple button color fix.",
            tag: "Documentation",
          },
        ],
      },
    ],
  },
  {
    date: "March 24, 2026",
    title: "AI Panel Flow, Button Polish & Icon Cleanup",
    groups: [
      {
        category: "Session Builder",
        color: "oklch(0.52 0.22 290)",
        items: [
          {
            title: "AI panel post-generation flow (Option B)",
            description:
              "After clicking 'Add Questions to Session,' the AI panel now returns to the pre-generation view instead of closing entirely. Source material (uploaded files, pasted text, and URLs) is preserved so professors can immediately run another round of generation from the same content. Learning objectives and generated results are cleared to signal a fresh generation round. This avoids the frustration of re-uploading lecture notes for a second pass.",
            tag: "Feature",
          },
          {
            title: "'Start fresh' reset button in AI panel header",
            description:
              "A 'Start fresh' button now appears in the AI panel header whenever any content is present (source material, objectives, or generated results). Clicking it clears everything — source material, URLs, files, objectives, question type selection, and count — returning the panel to a completely blank state. The button is styled as a subtle outlined pill so it doesn't compete with the primary Generate action.",
            tag: "Feature",
          },
          {
            title: "AI panel width persistence bug fix",
            description:
              "The AI panel width was already being saved to localStorage, but a stale closure bug in the resize mouseup handler meant the initial width (before any drag) was being saved instead of the final dragged width. Fixed by using a functional state setter in the mouseup handler to read the latest width value at save time.",
            tag: "Bug Fix",
          },
          {
            title: "Removed colored icon boxes from question type badges",
            description:
              "All rounded-square tinted background boxes behind question type icons have been removed across the app — the type picker dialog tiles, question card header badges, AI panel drag overlay, and the Generate with AI tile. Icons now render directly with their accent color against the card background, reducing visual noise and giving the UI a cleaner, flatter feel. The unused colorAlpha() helper function was also removed.",
            tag: "Polish",
          },
          {
            title: "Generate Questions and URL Add buttons changed to purple",
            description:
              "The 'Generate Questions' button and the 'Add' URL button in the AI panel were rendering in a washed-out light blue tint (oklch 0.96 lightness). Both are now solid violet (oklch 0.52 0.22 290), consistent with the rest of the app's primary action color.",
            tag: "Polish",
          },
        ],
      },
    ],
  },
  {
    date: "March 23, 2026",
    title: "Collapsible Sidebar & Panel Polish",
    groups: [
      {
        category: "Session Builder",
        color: "oklch(0.52 0.22 290)",
        items: [
          {
            title: "Manus-style collapsible left sidebar",
            description:
              "The left sidebar now supports a collapsed icon-only mode, matching the Manus panel pattern. A PanelLeftClose / PanelLeftOpen toggle button at the top switches between the full 280px expanded view (with labels, descriptions, and the AI banner) and a compact 56px strip showing icon-only buttons for all actions. Thin dividers separate the AI, question types, and preset sections in the collapsed strip. The transition animates smoothly at 0.2s. Collapsed state persists in localStorage across page reloads.",
            tag: "Feature",
          },
          {
            title: "AI panel collapsed state persisted in localStorage",
            description:
              "The open/closed state of the right-side AI panel is now saved to localStorage alongside its width. Reopening the session builder restores the panel to whichever state it was last left in, so professors who prefer a wider canvas don't have to re-collapse the panel on every visit.",
            tag: "Polish",
          },
          {
            title: "Collapsed sidebar AI button background fixed",
            description:
              "In the collapsed icon strip, the AI (Sparkles) button was rendering with a large violet-to-crimson gradient fill that was visually inconsistent with the plain outlined style of all other icon buttons. The button now uses the same 1.5px border, var(--card) background, and var(--violet) icon color as the question-type and preset buttons, giving the strip a uniform appearance.",
            tag: "Bug Fix",
          },
        ],
      },
    ],
  },
  {
    date: "March 22, 2026",
    title: "Dark Mode & Design System",
    groups: [
      {
        category: "Design System",
        color: "oklch(0.52 0.18 160)",
        items: [
          {
            title: "SavedButton extracted as a shared component",
            description:
              "The Save Draft / Saved toggle is now a reusable <SavedButton> component in client/src/components/SavedButton.tsx. It encapsulates the canonical design: outlined border, green CheckCircle2 icon, green text in the saved state, and a standard Save icon with neutral styling in the dirty state. Both Home.tsx (session builder) and Settings.tsx now import and use this component instead of maintaining separate inline implementations.",
            tag: "Design System",
          },
          {
            title: "DiscardButton extracted as a shared component",
            description:
              "A companion <DiscardButton> component has been added in client/src/components/DiscardButton.tsx. Canonical design: outlined border, muted foreground text, RotateCcw icon. Settings.tsx uses it in both the sticky header and the unsaved-changes banner, replacing two separate inline <button> elements.",
            tag: "Design System",
          },
          {
            title: "Saved state button design standardized across the app",
            description:
              "Prior to this change, the Saved button had two divergent designs: Settings.tsx used a filled green background with white text, while Home.tsx used a hardcoded bg-white that broke in dark mode. Both have been normalized to the canonical outlined design and now delegate to the shared SavedButton component.",
            tag: "Polish",
          },
        ],
      },
      {
        category: "Accessibility",
        color: "oklch(0.52 0.18 160)",
        items: [
          {
            title: "Full dark mode accessibility audit across all pages",
            description:
              "A systematic scan of every page (Home, Sessions, Settings, LiveSession, DesignSystem) identified all remaining hardcoded oklch and hex color values that did not adapt to dark mode. All instances were replaced with CSS variables. A new --destructive-border token was added to both light and dark themes. Key fixes include: status badges, tab underlines, progress dots, True/False and Multiple Choice answer badges, the Launch button gradient, the LiveSession header background, and toggle buttons.",
            tag: "Accessibility",
          },
        ],
      },
      {
        category: "Session Builder",
        color: "oklch(0.52 0.22 290)",
        items: [
          {
            title: "Resizable AI panel (Manus-style edge drag)",
            description:
              "The right-side AI panel is now resizable by dragging its left edge — no visible handle, just a 8px hover zone that changes the cursor to col-resize. Width is constrained between 240px and 600px and persisted in localStorage so it survives page reloads. CSS transitions are disabled during active drag for smooth interaction.",
            tag: "Feature",
          },
          {
            title: "SavedButton dirty state: icon removed",
            description:
              "The floppy disc Save icon was removed from the SavedButton dirty state. The button now shows text only (\"Save Draft\" or \"Save Changes\") with no icon, giving it a cleaner, more modern appearance. The saved state retains its green CheckCircle2 icon for confirmation feedback.",
            tag: "Polish",
          },
        ],
      },
      {
        category: "Bug Fixes",
        color: "oklch(0.52 0.18 27)",
        items: [
          {
            title: "Session not found — graceful fallback to new session",
            description:
              "Navigating to /session/:id with a stale or deleted session ID previously caused a silent crash with a console error. The session builder now catches the \"Session not found\" error from the tRPC query, shows a toast notification, clears the stale ID from state, and resets the URL to /session so the user lands on a clean blank builder.",
            tag: "Bug Fix",
          },
        ],
      },
      {
        category: "Theming",
        color: "oklch(0.52 0.18 264)",
        items: [
          {
            title: "Dark mode with Manus-matching palette",
            description:
              "A full dark mode has been added to the app. The .dark CSS variables use a warm near-black background (oklch(0.13 0.01 264)) with elevated card surfaces (oklch(0.17 0.01 264)), matching the Manus dark mode aesthetic. Pure black is avoided throughout — all surfaces use warm-tinted dark values.",
            tag: "Feature",
          },
          {
            title: "Sun / moon theme toggle in the bottom nav",
            description:
              "A Sun / Moon icon button has been added to the right side of the bottom navigation bar. Clicking it switches between light and dark mode. The preference is persisted in localStorage and restored on next visit.",
            tag: "Feature",
          },
          {
            title: "Hardcoded colors replaced with CSS variables across all pages",
            description:
              "All major pages (session builder, sessions dashboard, settings, join, live session, student session, results, changelog) have had their hardcoded oklch and hex color values replaced with semantic CSS variables (--background, --card, --border, --foreground, --muted-foreground, --indigo-light, --violet-light, --green-light, --blue-light). Accent colors on buttons and interactive elements remain as-is since they are intentional brand colors. Dark-mode overrides for all tinted surface tokens are defined in index.css.",
            tag: "Polish",
          },
          {
            title: "Row wrapper gradient updated for dark mode",
            description:
              "The three-column background gradient in the session builder (which paints the left sidebar, canvas, and right AI panel backgrounds all the way to the page bottom) now uses var(--card) and var(--background) instead of hardcoded white and light-gray values, so it renders correctly in both light and dark mode.",
            tag: "Polish",
          },
        ],
      },
    ],
  },
  {
    date: "March 21, 2026",
    title: "Settings, Layout Fixes & Question Card Polish",
    groups: [
      {
        category: "Settings",
        color: "oklch(0.52 0.18 200)",
        items: [
          {
            title: "Professor Settings page",
            description:
              "A full /settings route has been added with six sections: Session Defaults, Student Experience, Live Mode, Export & Data, Account, and System/Admin. Settings are persisted per-user in a new professorSettings database table (32 columns). A sticky Save / Discard banner appears whenever there are unsaved changes, matching the unsaved-changes pattern in the session builder.",
            tag: "Feature",
          },
          {
            title: "Two-column desktop layout with tab bar on mobile",
            description:
              "The Settings page uses a fixed left navigation column (section links with icons) and a right content panel on desktop. On mobile the layout collapses to a horizontal scrollable tab bar at the top, keeping all six sections reachable without a sidebar.",
            tag: "Polish",
          },
          {
            title: "Settings accessible from Sessions dashboard",
            description:
              "A gear icon button has been added to the Sessions dashboard header, linking directly to /settings. Settings also appears in the bottom navigation bar.",
            tag: "Navigation",
          },
          {
            title: "tRPC settings router with get and save procedures",
            description:
              "A dedicated settings tRPC router exposes settings.get (returns saved settings or defaults) and settings.save (upserts the full settings object). Both procedures use a demo key in unauthenticated mode and the user's ID when logged in, so settings persist correctly in both contexts.",
            tag: "Feature",
          },
        ],
      },
      {
        category: "Session Builder Layout",
        color: "oklch(0.48 0.18 264)",
        items: [
          {
            title: "Sidebar column backgrounds extend to page bottom",
            description:
              "The left sidebar and right AI panel previously showed a gap at the bottom of the page when the canvas grew taller than the viewport. The row wrapper now carries a linear-gradient background that paints white for both sidebar columns and the page background color for the canvas area, extending all the way to the page bottom regardless of content height.",
            tag: "Polish",
          },
          {
            title: "Divider line added to the left of the AI panel",
            description:
              "The canvas <main> element now has a permanent borderRight so a divider line always appears on the left edge of the AI panel when it opens, matching the style of the divider on the right edge of the left sidebar.",
            tag: "Polish",
          },
        ],
      },
      {
        category: "Question Cards",
        color: "oklch(0.55 0.2 250)",
        items: [
          {
            title: "Type dropdown X position hardcoded to −6px",
            description:
              "A temporary dev slider was added to the session builder canvas to tune the horizontal position of the type dropdown button interactively. After testing, −6px was selected as the final value. The slider has been removed and the offset is now baked in permanently.",
            tag: "Polish",
          },
          {
            title: "Icon-to-label gap in type dropdown widened",
            description:
              "The gap between the question type icon and the label text inside the dropdown button was increased from 4px to 8px, giving the two elements more breathing room and improving readability.",
            tag: "Polish",
          },
          {
            title: "Standalone type icon removed from question cards",
            description:
              "Each question card previously showed a standalone icon bubble alongside the type-switch dropdown, resulting in the icon appearing twice. The standalone bubble has been removed; the dropdown button (which already shows the icon and label together) is now the only type indicator on the card.",
            tag: "Clarity",
          },
          {
            title: "Type dropdown shifted 4px left",
            description:
              "After removing the standalone icon, the content area was shifted 4px to the left so the type dropdown aligns more naturally with the drag handle and question text.",
            tag: "Polish",
          },
          {
            title: "Star Rating and File Upload removed from type-switch dropdown",
            description:
              "The type-switch dropdown on each question card now only lists Short Text, Multiple Choice, and True / False — the three types with compatible response structures. Star Rating and File Upload can still be added from the sidebar but are no longer offered as switch targets, preventing data-loss confusion when changing types.",
            tag: "Clarity",
          },
        ],
      },
    ],
  },
  {
    date: "March 20, 2026",
    title: "Product & Design Improvements",
    groups: [
      {
        category: "Question Builder",
        color: "oklch(0.55 0.2 250)",
        items: [
          {
            title: "Launch Session gated until questions exist",
            description:
              "The Launch Session button is now disabled until at least one question has been added. It greys out with a tooltip and transitions smoothly back to active once a question is present.",
            tag: "Validation",
          },
          {
            title: '"+ Add Manually" opens a question type picker',
            description:
              'Tapping "+ Add Manually" now opens a full overlay showing all four question types in a 2×2 grid — each with an icon and a one-line description — instead of silently defaulting to Short Text.',
            tag: "UX Flow",
          },
          {
            title: "Multiple Choice answer options editor",
            description:
              "Multiple Choice questions now include a dedicated answer options editor with a minimum of two options. Each option has a lettered badge, keyboard shortcuts (Enter to advance, Backspace to remove), and inline validation before saving.",
            tag: "Feature",
          },
          {
            title: "Option fields use placeholder text, not pre-filled values",
            description:
              'Option fields no longer pre-fill with "Option A" or "Option B". They start empty and display placeholder text, so you can type straight away without clearing anything first.',
            tag: "Polish",
          },
          {
            title: "Correct answer selection is required",
            description:
              "Marking the correct answer is now required before a Multiple Choice question can be saved. Letter circles toggle green with a checkmark. The hint updates from amber (nothing selected) to green (answer marked), and the Add Question button stays disabled until the requirement is met.",
            tag: "Validation",
          },
          {
            title: '"(min. 2)" label spacing tightened',
            description:
              'The minimum options hint was visually detached from its heading. Spacing has been corrected so the label sits immediately next to "Answer options".',
            tag: "Polish",
          },
          {
            title: "Dashed border removed from session name",
            description:
              'The dashed box around "Untitled Session" in the topbar has been removed. The session name now renders as clean muted text. A pencil icon still appears on hover to indicate it is editable.',
            tag: "Polish",
          },
          {
            title: "Question count badges removed from preset buttons",
            description:
              'The "3Q" and "1Q" count badges on sidebar preset buttons have been removed. They created confusion alongside the Q1, Q2 labels on question cards. Presets are now label-only.',
            tag: "Clarity",
          },
          {
            title: "Back navigation with unsaved-changes guard",
            description:
              "A back arrow has been added to the session builder topbar. If there are unsaved changes (questions added or session renamed), a dialog appears with three choices: Keep editing, Save draft and leave, or Leave anyway. If nothing has been added, navigation proceeds without a prompt.",
            tag: "Feature",
          },
          {
            title: "Save Draft button reflects dirty state",
            description:
              'The Save Draft button now highlights in indigo when there are unsaved changes and shows "Saved" in muted grey when the session is clean — giving a clear visual signal of the current save state.',
            tag: "Polish",
          },
          {
            title: "Active onboarding step ring pulses",
            description:
              "The ring around the active step in the onboarding tracker now breathes in and out with a soft indigo pulse every 1.8 seconds. The animation stops automatically when the step is completed and the circle transitions to green.",
            tag: "Animation",
          },
          {
            title: "True / False question type",
            description:
              "A fifth question type — True / False — has been added with a ToggleLeft icon and green color. The Add Question modal shows a correct-answer selector (True or False buttons). The question card displays both answer pills. AI generation supports True / False with a correct answer badge shown in the preview.",
            tag: "Feature",
          },
          {
            title: "Suggested question templates in the Add Question modal",
            description:
              "Each question type now has 4–6 curated example questions. A \"Show common questions\" toggle button reveals a dropdown list — clicking any suggestion populates the text field instantly and closes the list. Hidden by default to keep the modal clean.",
            tag: "Feature",
          },
          {
            title: "Model answer field on Short Text questions",
            description:
              "Short Text question cards now show an editable model answer box below the question text. The Add Question modal includes an optional Model Answer textarea. AI-generated Short Text questions carry their model answer through when added to the session. The answer renders in an indigo-tinted box matching the AI preview style.",
            tag: "Feature",
          },
          {
            title: "Edit session loads saved state into the builder",
            description:
              "Tapping Edit on a session card in My Sessions now loads that session's saved code, name, and questions into the builder instead of opening a blank session. New Session navigation sets a flag that clears the old session state on mount so there is no bleed-through.",
            tag: "Feature",
          },
          {
            title: "\"Add another question\" button uses Plus icon",
            description:
              "The icon on the \"Add another question\" row at the bottom of the question list was changed from ChevronRight to Plus, which more clearly communicates the action.",
            tag: "Polish",
          },
        ],
      },
      {
        category: "Design System",
        color: "oklch(0.52 0.22 290)",
        items: [
          {
            title: "Primary color renamed from Crimson to Indigo",
            description:
              "All primary color tokens have been renamed to --indigo, --indigo-hover, and --indigo-light with proper indigo values. Crimson is now reserved exclusively for the Launch Session button and documented as such.",
            tag: "Tokens",
          },
          {
            title: "Usage rules updated: Crimson is Launch-only",
            description:
              "All swatch documentation and usage rules in the Design System have been updated to make clear that Crimson must not be used anywhere except the Launch Session button.",
            tag: "Documentation",
          },
          {
            title: "Background color corrected to #F9FAFC",
            description:
              "The Background color token has been updated to the correct oklch value for #F9FAFC. A typo in the previous token value was also corrected.",
            tag: "Tokens",
          },
          {
            title: "Design System password remembered after first entry",
            description:
              "Once the correct password is entered, the unlock state is persisted in localStorage. The password gate is skipped on all subsequent visits, so you only need to enter it once per browser.",
            tag: "UX Flow",
          },
          {
            title: "True / False added to question type reference",
            description:
              "The Design System now documents True / False as the fifth question type alongside Short Text, Multiple Choice, File Upload, and Star Rating.",
            tag: "Documentation",
          },
          {
            title: "Missing color tokens added",
            description:
              "The --green, --green-light, --green-border, --amber, --amber-light, --amber-border, and --destructive-light tokens were missing from index.css, causing color swatches to render incorrectly. All tokens are now defined and the swatches render correctly.",
            tag: "Tokens",
          },
          {
            title: "Null state pattern updated with concrete examples",
            description:
              "The null state pattern in the Design System now shows two concrete examples — the session builder empty state and the My Sessions empty state — with full-opacity emojis and real copy, replacing the generic placeholder.",
            tag: "Documentation",
          },
          {
            title: "Changelog tag badges use Geist Mono",
            description:
              "Tag badges (Validation, UX Flow, Feature, Polish, etc.) in the Changelog now use Geist Mono, matching the monospace font used for session codes throughout the app.",
            tag: "Polish",
          },
        ],
      },
      {
        category: "My Sessions Dashboard",
        color: "oklch(0.48 0.18 160)",
        items: [
          {
            title: "New My Sessions dashboard",
            description:
              "A /sessions route has been built that appears immediately after tapping Launch Session. It shows all saved sessions as cards with status badges (Draft, Live, Closed), question type icons, relative timestamps, context-aware action buttons, a search bar, filter tabs, a per-card overflow menu, and a friendly empty state with a New Session CTA.",
            tag: "Feature",
          },
          {
            title: "My Sessions added to bottom navigation",
            description:
              "The My Sessions dashboard is now accessible from the bottom navigation bar alongside Session Builder, Join Session, and Design System.",
            tag: "Navigation",
          },
        ],
      },
      {
        category: "AI Panel",
        color: "oklch(0.52 0.22 290)",
        items: [
          {
            title: "AI panel converted to a fixed right-side drawer",
            description:
              "The AI generation panel was redesigned from an inline flex column into a fixed right-side drawer that slides in over the canvas. It features a backdrop blur, a Sparkles tab handle on the left edge for toggling, and a dedicated scrollable body so the Generate/Add buttons always stay anchored at the bottom regardless of content length.",
            tag: "Feature",
          },
          {
            title: "Curved tab handle with gradient",
            description:
              "The AI drawer tab handle was redesigned from a rectangular button into a smooth SVG shape with concave bezier curves on the top and bottom corners, flowing organically into the drawer edge. The fill uses the same diagonal purple-to-pink gradient as the AI banner in the sidebar, and deepens when the drawer is open.",
            tag: "Polish",
          },
          {
            title: "Tab handle positioned below the topbar",
            description:
              "The drawer tab was moved from the vertical centre of the screen to top: 80px, placing it just below the 64px topbar. This keeps it visually anchored to the content area rather than floating in the middle of the page.",
            tag: "Polish",
          },
          {
            title: "Tab handle open/close wired correctly",
            description:
              "The tab's onClick was previously only wired for closing. It now correctly opens the drawer when closed and closes it when open, so the tab is a reliable toggle in both directions.",
            tag: "Reliability",
          },
          {
            title: "Real AI generation via server-side API",
            description:
              "Generation now calls a dedicated /api/generate-questions backend route that uses the server-side API key via the invokeLLM helper. The system prompt enforces knowledge-atom extraction — every question must reference specific names, terms, numbers, or claims from the source text rather than writing generic questions. Question types are distributed evenly across the requested count.",
            tag: "Feature",
          },
          {
            title: "URL as source material",
            description:
              "A URL input row sits between the file drop zone and the paste textarea. Entering a URL and pressing Enter or clicking Fetch sends it to the server, which strips navigation and footer noise with cheerio and returns up to 12,000 characters of readable text. The extracted content is appended to the source material field.",
            tag: "Feature",
          },
          {
            title: "URL chips replace inline text injection",
            description:
              "Fetched URLs are now stored as removable pill chips in the AI panel rather than dumping their text into the textarea. At generation time the server fetches each chip URL and merges the extracted text with any pasted content before calling the LLM. The Generate button activates when at least one URL chip is present, even if the textarea is empty.",
            tag: "UX Flow",
          },
          {
            title: "Duplicate URL warning",
            description:
              "Adding a URL that is already in the source chips list now shows a warning toast: \"Already added — This URL is already in your source list.\" The input is cleared and no duplicate chip is created.",
            tag: "Validation",
          },
          {
            title: "Generated questions start selected by default",
            description:
              "All AI-generated questions now arrive pre-checked in the review panel. Previously they defaulted to unselected, requiring an extra click before adding them to the session.",
            tag: "UX Flow",
          },
          {
            title: "Auto-height textareas on generated question cards",
            description:
              "Question text, Multiple Choice options, and model answers in the AI preview panel now use auto-height textareas so long content is never clipped. Cards expand to fit their content rather than truncating.",
            tag: "Polish",
          },
          {
            title: "Robust JSON parsing for AI responses",
            description:
              "The generation endpoint now extracts the JSON array by bracket-matching rather than relying on the model returning a perfectly clean response. Trailing commas before ] or } are automatically removed, preventing occasional parse failures when the model adds extra text or formatting around the JSON.",
            tag: "Reliability",
          },
          {
            title: "Learning Objectives",
            description:
              "A new Learning Objectives section sits between the source material and question types in the AI panel. Professors can add one or more objectives as numbered green chips (Enter or Add button to confirm, × to remove). Objectives persist in localStorage across panel close and reopen. When objectives are present, they are injected into the generation prompt so the AI steers every question toward assessing a specific objective. The Generate button shows the active count: \"Generate (2 objectives)\".",
            tag: "Feature",
          },
          {
            title: "AI-suggested learning objectives",
            description:
              "A Suggest button in the Learning Objectives header calls a new /api/suggest-objectives endpoint that reads the source material and returns 3–5 Bloom's-aligned draft objectives. Suggestions appear as purple preview chips with individual \"+ Add\" and dismiss (×) controls. The button is disabled until source material is present and shows a spinner while loading.",
            tag: "Feature",
          },
        ],
      },
      {
        category: "Question Builder (Canvas)",
        color: "oklch(0.48 0.18 200)",
        items: [
          {
            title: "Sidebar and AI panel extend full height",
            description:
              "The left sidebar and AI drawer now use sticky positioning (top: 64px, height: calc(100vh − 64px)) so they always extend to the bottom of the viewport while the canvas scrolls naturally. Previously both panels were clipped to the initial viewport height when the question list grew long.",
            tag: "Polish",
          },
          {
            title: "Cmd/Ctrl+S saves the draft",
            description:
              "Pressing Cmd+S (Mac) or Ctrl+S (Windows/Linux) anywhere in the session builder now triggers Save Draft instantly, without needing to reach for the button in the topbar.",
            tag: "Feature",
          },
          {
            title: "Question type switcher is now a dropdown",
            description:
              "The horizontal type-switcher pills that appeared inline on each canvas card have been replaced with a compact dropdown button showing the current type, its icon, and a chevron. Clicking opens a menu listing all five question types; the active type is highlighted with a checkmark. Selecting a different type triggers the same AI-powered transform as before.",
            tag: "UX Flow",
          },
          {
            title: "Inline edit textarea auto-resizes",
            description:
              "Clicking into a question card to edit it now opens a textarea that immediately expands to show the full question text. The textarea also grows as you type, so long questions are never clipped or hidden behind a scroll.",
            tag: "Polish",
          },
          {
            title: "Session name always editable",
            description:
              "The session name in the topbar is now a plain always-visible input field. Hovering reveals a subtle underline and a pencil icon to signal that it is editable. Previously the name required a two-step click-to-edit interaction.",
            tag: "UX Flow",
          },
        ],
      },
    ],
  },
];

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatDayForGoogleChat(day: ChangelogDay): string {
  const lines: string[] = [];
  lines.push(`*${day.title}*`);
  lines.push(`_${day.date}_`);
  lines.push("");

  for (const group of day.groups) {
    lines.push(`*${group.category.toUpperCase()}*`);
    for (const item of group.items) {
      lines.push(`• *${item.title}*`);
      lines.push(`  ${item.description}`);
    }
    lines.push("");
  }

  return lines.join("\n").trim();
}

// ── Tag colors ─────────────────────────────────────────────────────────────────

const TAG_COLORS: Record<string, { bg: string; text: string }> = {
  Feature:       { bg: "oklch(0.93 0.08 250)", text: "oklch(0.38 0.18 250)" },
  Validation:    { bg: "oklch(0.93 0.06 27)",  text: "oklch(0.44 0.18 27)"  },
  Polish:        { bg: "oklch(0.94 0.04 100)", text: "oklch(0.42 0.12 100)" },
  Clarity:       { bg: "oklch(0.94 0.05 200)", text: "oklch(0.4 0.14 200)"  },
  Animation:     { bg: "oklch(0.93 0.07 290)", text: "oklch(0.42 0.18 290)" },
  "UX Flow":     { bg: "oklch(0.93 0.06 250)", text: "oklch(0.38 0.18 250)" },
  Tokens:        { bg: "oklch(0.93 0.05 60)",  text: "oklch(0.42 0.14 60)"  },
  Documentation: { bg: "oklch(0.94 0.03 0)",   text: "oklch(0.45 0.08 0)"   },
  Navigation:    { bg: "oklch(0.93 0.06 160)", text: "oklch(0.38 0.16 160)" },
  Reliability:   { bg: "oklch(0.93 0.07 160)", text: "oklch(0.36 0.18 160)" },
};

// ── Copy Button ────────────────────────────────────────────────────────────────

function CopyDayButton({ day }: { day: ChangelogDay }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const text = formatDayForGoogleChat(day);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <button
      onClick={handleCopy}
      title="Copy"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        padding: "5px 12px",
        borderRadius: 8,
        border: copied
          ? "1px solid oklch(0.75 0.14 160)"
          : "1px solid oklch(0.88 0.01 264)",
        background: copied ? "oklch(0.94 0.06 160)" : "#fff",
        color: copied ? "oklch(0.38 0.14 160)" : "oklch(0.5 0 0)",
        fontSize: 12,
        fontWeight: 600,
        fontFamily: "'Geist', system-ui, sans-serif",
        cursor: "pointer",
        transition: "all 0.18s",
        whiteSpace: "nowrap",
      }}
    >
      {copied ? <Check size={13} /> : <Copy size={13} />}
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

export default function Changelog() {
  const totalCount = DAYS.reduce(
    (sum, day) => sum + day.groups.reduce((s, g) => s + g.items.length, 0),
    0
  );

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--background)",
        fontFamily: "'Geist', system-ui, sans-serif",
      }}
    >
      {/* Page header */}
      <div
        style={{
          background: "var(--card)",
          borderBottom: "1px solid oklch(0.93 0.01 264)",
          padding: "48px 0 40px",
        }}
      >
        <div style={{ maxWidth: 760, margin: "0 auto", padding: "0 28px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "oklch(0.55 0.2 250)",
                background: "oklch(0.95 0.04 264)",
                padding: "4px 12px",
                borderRadius: 20,
                fontFamily: "'Geist Mono', monospace",
              }}
            >
              Changelog
            </span>
          </div>
          <h1
            style={{
              fontFamily: "'Geist', system-ui, sans-serif",
              fontSize: "clamp(28px, 4vw, 42px)",
              fontWeight: 800,
              color: "var(--foreground)",
              margin: "0 0 12px",
              lineHeight: 1.1,
              letterSpacing: "-0.03em",
            }}
          >
            AlicePoll Updates
          </h1>
          <p
            style={{
              fontSize: 16,
              color: "oklch(0.45 0 0)",
              margin: 0,
              lineHeight: 1.65,
              maxWidth: 560,
            }}
          >
            {totalCount} improvements across the session builder, design system, and My Sessions dashboard.
          </p>
        </div>
      </div>

      {/* Days */}
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "40px 28px 80px" }}>
        {DAYS.map((day) => (
          <div key={day.date} style={{ marginBottom: 64 }}>
            {/* Day header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
                marginBottom: 28,
                paddingBottom: 16,
                borderBottom: "2px solid oklch(0.91 0.01 264)",
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    color: "var(--muted-foreground)",
                    marginBottom: 4,
                  }}
                >
                  {day.date}
                </div>
                <h2
                  style={{
                    fontFamily: "'Geist', system-ui, sans-serif",
                    fontSize: 22,
                    fontWeight: 700,
                    color: "var(--foreground)",
                    margin: 0,
                    letterSpacing: "-0.02em",
                  }}
                >
                  {day.title}
                </h2>
              </div>
              <CopyDayButton day={day} />
            </div>

            {/* Groups */}
            {day.groups.map((group) => (
              <section key={group.category} style={{ marginBottom: 40 }}>
                {/* Group header */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: 14,
                  }}
                >
                  <span
                    style={{
                      display: "inline-block",
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: group.color,
                      flexShrink: 0,
                    }}
                  />
                  <h3
                    style={{
                      fontFamily: "'Geist', system-ui, sans-serif",
                      fontSize: 11,
                      fontWeight: 700,
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      color: group.color,
                      margin: 0,
                    }}
                  >
                    {group.category}
                  </h3>
                  <span
                    style={{
                      marginLeft: "auto",
                      fontSize: 11,
                      fontWeight: 600,
                      color: "var(--muted-foreground)",
                      background: "var(--muted)",
                      padding: "2px 8px",
                      borderRadius: 20,
                      fontFamily: "'Geist Mono', monospace",
                    }}
                  >
                    {group.items.length} update{group.items.length !== 1 ? "s" : ""}
                  </span>
                </div>

                {/* Items */}
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {group.items.map((item) => {
                    const tagStyle = TAG_COLORS[item.tag] ?? { bg: "oklch(0.94 0 0)", text: "oklch(0.45 0 0)" };
                    return (
                      <div
                        key={item.title}
                        style={{
                          background: "var(--card)",
                          border: "1px solid oklch(0.93 0.01 264)",
                          borderRadius: 12,
                          padding: "16px 20px",
                          transition: "box-shadow 0.18s, transform 0.18s",
                        }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLDivElement).style.boxShadow = "0 4px 20px oklch(0.55 0.2 250 / 0.07)";
                          (e.currentTarget as HTMLDivElement).style.transform = "translateY(-1px)";
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
                          (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 6 }}>
                          <h4
                            style={{
                              fontFamily: "'Geist', system-ui, sans-serif",
                              fontSize: 14,
                              fontWeight: 650,
                              color: "var(--foreground)",
                              margin: 0,
                              lineHeight: 1.4,
                            }}
                          >
                            {item.title}
                          </h4>
                          <span
                            style={{
                              flexShrink: 0,
                              fontSize: 10,
                              fontWeight: 700,
                              letterSpacing: "0.05em",
                              fontFamily: "'Geist Mono', 'Fira Code', 'Cascadia Code', ui-monospace, monospace",
                              background: tagStyle.bg,
                              color: tagStyle.text,
                              padding: "2px 8px",
                              borderRadius: 20,
                              whiteSpace: "nowrap",
                            }}
                          >
                            {item.tag}
                          </span>
                        </div>
                        <p
                          style={{
                            fontSize: 13,
                            color: "oklch(0.45 0 0)",
                            margin: 0,
                            lineHeight: 1.65,
                          }}
                        >
                          {item.description}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        ))}

        {/* Footer */}
        <div
          style={{
            textAlign: "center",
            paddingTop: 28,
            borderTop: "1px solid oklch(0.93 0.01 264)",
          }}
        >
          <p style={{ fontSize: 12, color: "var(--muted-foreground)", margin: 0 }}>
            AlicePoll · Changelog
          </p>
        </div>
      </div>
    </div>
  );
}
