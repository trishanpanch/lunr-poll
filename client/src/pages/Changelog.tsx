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
        background: "oklch(0.9849 0.0029 264.5)",
        fontFamily: "'Geist', system-ui, sans-serif",
      }}
    >
      {/* Page header */}
      <div
        style={{
          background: "#fff",
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
              color: "oklch(0.145 0 0)",
              margin: "0 0 12px",
              lineHeight: 1.1,
              letterSpacing: "-0.03em",
            }}
          >
            Session Builder Updates
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
                    color: "oklch(0.65 0 0)",
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
                    color: "oklch(0.145 0 0)",
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
                      color: "oklch(0.65 0 0)",
                      background: "oklch(0.94 0 0)",
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
                          background: "#fff",
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
                              color: "oklch(0.145 0 0)",
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
          <p style={{ fontSize: 12, color: "oklch(0.65 0 0)", margin: 0 }}>
            Session Builder · Changelog
          </p>
        </div>
      </div>
    </div>
  );
}
