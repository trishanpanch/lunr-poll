# Session Builder – Design Ideas

## Response 1
<response>
<text>
**Design Movement:** Structured Clarity / Swiss Information Design

**Core Principles:**
- Information hierarchy over decoration — every element earns its space
- Sidebar-first navigation with a persistent, scannable left rail
- Generous whitespace as a signal of trust and professionalism
- Functional color: one brand accent, everything else neutral

**Color Philosophy:**
Deep indigo (#3B3FA8) as the primary action color — authoritative but not aggressive. Warm off-white (#F7F6F3) background to soften the clinical feel of pure white. Crimson (#C0185A) reserved exclusively for the Launch CTA — a single hot signal in a cool environment.

**Layout Paradigm:**
Fixed-width sidebar (280px) + fluid canvas. The sidebar is a permanent tool rail, not a collapsible drawer. The canvas is a vertical scroll of cards — like a document editor, not a dashboard.

**Signature Elements:**
- Step tracker with connecting vertical line (onboarding progress)
- Question type grid with icon + label in a 2×2 tile layout
- AI generation banner with gradient background at the top of the sidebar

**Interaction Philosophy:**
Every action confirms itself — adding a question animates a card into the list. Modals are focused and minimal. Toasts confirm actions without interrupting flow.

**Animation:**
Card entrance: slide-up + fade-in (150ms ease-out). Modal: scale from 0.95 + fade (120ms). Toast: slide-up from bottom. No decorative animations.

**Typography System:**
- Display/headings: DM Sans 700 — geometric, confident
- Body: Inter 400/500 — neutral, readable
- Labels/caps: Inter 600, 0.07em tracking, uppercase
</text>
<probability>0.08</probability>
</response>

## Response 2
<response>
<text>
**Design Movement:** Warm Editorial / Notion-inspired

**Core Principles:**
- Document-first: the canvas feels like a living document, not a form
- Warm neutrals replace cold grays throughout
- Typography does the heavy lifting — minimal borders, maximum whitespace
- Inline editing everywhere — rename, reorder, edit in place

**Color Philosophy:**
Warm sand (#F5F0E8) background. Ink black (#1C1917) for text. Amber (#D97706) as the only accent — warm, academic, like a highlighter on paper. The Launch button is the only saturated element.

**Layout Paradigm:**
No visible sidebar borders — the left panel bleeds into the background. The canvas is a full-bleed white document area with a subtle drop shadow. Everything feels like one continuous surface.

**Signature Elements:**
- Inline-editable session title with a pencil icon on hover
- Question cards styled like index cards with a left accent bar
- Preset items as horizontal pill chips, not list rows

**Interaction Philosophy:**
Hover reveals controls — drag handles, edit buttons, and remove icons only appear on hover. The interface is quiet until you need it.

**Animation:**
Soft fade transitions (200ms). Card reorder uses spring physics. No bouncy or playful motion.

**Typography System:**
- Display: Lora 700 (serif) — editorial, academic weight
- Body: Inter 400 — clean contrast against the serif headers
- Code/IDs: JetBrains Mono — for session codes
</text>
<probability>0.07</probability>
</response>

## Response 3
<response>
<text>
**Design Movement:** Functional Modernism / Linear App aesthetic

**Core Principles:**
- Density without clutter — compact components, tight spacing
- Keyboard-first interactions with visible shortcuts
- Monochromatic base with a single vivid accent
- Status is always visible — progress, counts, and states are never hidden

**Color Philosophy:**
Near-black (#0F0F14) sidebar, white (#FFFFFF) canvas. Electric violet (#5B5FC7) as the system accent. Crimson (#C0185A) for launch only. The contrast between the dark sidebar and white canvas creates a natural focus zone.

**Layout Paradigm:**
Dark sidebar + light canvas — a classic IDE-inspired split. The sidebar feels like a toolbox; the canvas feels like a workspace. The visual contrast directs attention without needing labels.

**Signature Elements:**
- Dark sidebar with light text and icon-first navigation
- Question cards with a left-border accent in the question type's color
- Keyboard shortcut hints on hover (⌘K, ⌘Enter)

**Interaction Philosophy:**
Power-user friendly. Tooltips show keyboard shortcuts. The AI feature is accessible via a command palette. Presets are filterable.

**Animation:**
Instant feedback — no delays. Micro-transitions only (80–120ms). Card entrance: slide from left edge.

**Typography System:**
- UI: Inter 500/600 throughout — consistent, dense
- Monospace: JetBrains Mono for codes and labels
- No serif — this is a tool, not a publication
</text>
<probability>0.06</probability>
</response>

---

**Chosen approach: Response 1 — Structured Clarity / Swiss Information Design**

DM Sans for headings, Inter for body. Indigo primary, crimson for launch CTA. Fixed sidebar + document canvas. Step tracker onboarding. Clean, professional, zero decoration.
