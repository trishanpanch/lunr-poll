/*
  Changelog — Product & Design Improvements
  Design: Editorial / release-notes aesthetic.
  Clean white background, strong typographic hierarchy using Geist + Playfair Display.
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
    date: "March 21, 2026",
    title: "AI Panel & Generation Improvements",
    groups: [
      {
        category: "AI Panel",
        color: "oklch(0.52 0.22 290)",
        items: [
          {
            title: "Curved tab handle with gradient",
            description:
              "The AI drawer tab handle has been redesigned from a rectangular button into a smooth SVG shape with concave bezier curves on the top and bottom corners, flowing organically into the drawer edge. The fill now uses the same diagonal purple-to-pink gradient as the AI banner in the sidebar, and deepens when the drawer is open.",
            tag: "Polish",
          },
          {
            title: "Checkbox moved to top-right of generated question cards",
            description:
              "The select/deselect checkbox on AI-generated question preview cards has been moved from the top-left to the top-right corner. This prevents accidental deselection when clicking into the question text or answer options, making selection a deliberate action rather than an easy misclick.",
            tag: "UX Flow",
          },
          {
            title: "Robust JSON parsing for AI responses",
            description:
              "The generation endpoint now extracts the JSON array by bracket-matching rather than relying on the model returning a perfectly clean response. Trailing commas before ] or } are automatically removed, preventing occasional parse failures when the model adds extra text or formatting around the JSON.",
            tag: "Reliability",
          },
        ],
      },
      {
        category: "Question Cards",
        color: "oklch(0.55 0.2 250)",
        items: [
          {
            title: "Generated questions start selected by default",
            description:
              "All AI-generated questions now arrive pre-checked in the review panel. Previously they defaulted to unselected, requiring an extra click before adding them to the session.",
            tag: "UX Flow",
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
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: "clamp(28px, 4vw, 42px)",
              fontWeight: 700,
              color: "oklch(0.145 0 0)",
              margin: "0 0 12px",
              lineHeight: 1.15,
              letterSpacing: "-0.02em",
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
                    fontFamily: "'Playfair Display', Georgia, serif",
                    fontSize: 22,
                    fontWeight: 700,
                    color: "oklch(0.145 0 0)",
                    margin: 0,
                    letterSpacing: "-0.01em",
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
