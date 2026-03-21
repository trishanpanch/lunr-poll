"use client";

/**
 * /design-system — Internal design reference for the Harvard Poll platform.
 *
 * Password-gated. Not linked from any consumer-facing route.
 * Password is checked client-side only (obscurity gate, not security).
 * For stronger protection, move this behind a middleware auth check.
 *
 * Tokens sourced from: src/app/globals.css
 * Components sourced from: src/components/ui/*
 * Fonts: Geist Sans (UI), Geist Mono (code/IDs), Playfair Display (display/serif)
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Rocket, Sparkles, Type, ListChecks, Paperclip, Star,
  GripVertical, Trash2, Plus, Eye, EyeOff, Copy, CheckCircle2,
  Circle, Loader2, Lock
} from "lucide-react";

// ── Password Gate ────────────────────────────────────────────────────────────
const DS_PASSWORD = "harvard-ds-2026";

function PasswordGate({ onUnlock }: { onUnlock: () => void }) {
  const [value, setValue] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState(false);

  const attempt = () => {
    if (value === DS_PASSWORD) {
      onUnlock();
    } else {
      setError(true);
      setTimeout(() => setError(false), 1200);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-2">
            <Lock className="w-5 h-5 text-primary" />
          </div>
          <h1 className="font-serif text-2xl font-bold text-foreground">Design System</h1>
          <p className="text-sm text-muted-foreground">
            Internal reference — Harvard Poll Platform
          </p>
        </div>
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="ds-password">Password</Label>
              <div className="relative">
                <Input
                  id="ds-password"
                  type={show ? "text" : "password"}
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && attempt()}
                  placeholder="Enter access password"
                  className={error ? "border-destructive ring-2 ring-destructive/20" : ""}
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShow((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {error && (
                <p className="text-xs text-destructive font-medium">Incorrect password.</p>
              )}
            </div>
            <Button onClick={attempt} className="w-full">
              Enter
            </Button>
          </CardContent>
        </Card>
        <p className="text-center text-xs text-muted-foreground">
          This page is not linked from the consumer app.
        </p>
      </div>
    </div>
  );
}

// ── Token Swatch ─────────────────────────────────────────────────────────────
function Swatch({
  label,
  token,
  value,
  textDark = false,
}: {
  label: string;
  token: string;
  value: string;
  textDark?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(token);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button
      onClick={copy}
      className="group flex flex-col overflow-hidden rounded-xl border border-border hover:shadow-md transition-all text-left w-full"
      title={`Copy ${token}`}
    >
      <div
        className="h-16 w-full flex items-end p-2"
        style={{ background: `var(${token})` }}
      >
        {copied && (
          <span className={`text-xs font-medium ${textDark ? "text-black/60" : "text-white/80"}`}>
            Copied!
          </span>
        )}
      </div>
      <div className="p-3 bg-card space-y-0.5">
        <p className="text-xs font-semibold text-foreground">{label}</p>
        <p className="text-[10px] font-mono text-muted-foreground">{token}</p>
        <p className="text-[10px] font-mono text-muted-foreground/70">{value}</p>
      </div>
    </button>
  );
}

// ── Type Specimen ─────────────────────────────────────────────────────────────
function TypeSpecimen({
  label,
  className,
  sample,
  meta,
}: {
  label: string;
  className: string;
  sample: string;
  meta: string;
}) {
  return (
    <div className="py-5 border-b border-border last:border-0 flex items-baseline gap-6">
      <div className="w-36 shrink-0">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{label}</p>
        <p className="text-[10px] font-mono text-muted-foreground/60 mt-0.5">{meta}</p>
      </div>
      <p className={className}>{sample}</p>
    </div>
  );
}

// ── Spacing Row ───────────────────────────────────────────────────────────────
function SpacingRow({ name, px, rem }: { name: string; px: number; rem: string }) {
  return (
    <div className="flex items-center gap-4 py-2">
      <span className="w-16 text-xs font-mono text-muted-foreground">{name}</span>
      <div className="bg-primary/20 rounded" style={{ width: px, height: 20 }} />
      <span className="text-xs text-muted-foreground">{rem} · {px}px</span>
    </div>
  );
}

// ── Radius Row ────────────────────────────────────────────────────────────────
function RadiusRow({ name, token, value }: { name: string; token: string; value: string }) {
  return (
    <div className="flex items-center gap-4 py-2">
      <span className="w-20 text-xs font-mono text-muted-foreground">{name}</span>
      <div
        className="w-16 h-10 bg-primary/15 border border-primary/30"
        style={{ borderRadius: `var(${token})` }}
      />
      <span className="text-xs text-muted-foreground font-mono">{token} · {value}</span>
    </div>
  );
}

// ── Main Design System ────────────────────────────────────────────────────────
function DesignSystem() {
  const colors = [
    { label: "Primary", token: "--primary", value: "oklch(0.514 0.2 13.9)", textDark: false },
    { label: "Primary Foreground", token: "--primary-foreground", value: "oklch(1 0 0)", textDark: false },
    { label: "Background", token: "--background", value: "oklch(0.985 0.01 240)", textDark: true },
    { label: "Foreground", token: "--foreground", value: "oklch(0.145 0 0)", textDark: false },
    { label: "Card", token: "--card", value: "oklch(1 0 0)", textDark: true },
    { label: "Muted", token: "--muted", value: "oklch(0.97 0 0)", textDark: true },
    { label: "Muted Foreground", token: "--muted-foreground", value: "oklch(0.556 0 0)", textDark: false },
    { label: "Secondary", token: "--secondary", value: "oklch(0.97 0 0)", textDark: true },
    { label: "Border", token: "--border", value: "oklch(0.922 0 0)", textDark: true },
    { label: "Destructive", token: "--destructive", value: "oklch(0.577 0.245 27.325)", textDark: false },
    { label: "Ring", token: "--ring", value: "oklch(0.514 0.2 13.9)", textDark: false },
    { label: "Chart 1", token: "--chart-1", value: "oklch(0.646 0.222 41.116)", textDark: false },
    { label: "Chart 2", token: "--chart-2", value: "oklch(0.6 0.118 184.704)", textDark: false },
    { label: "Chart 3", token: "--chart-3", value: "oklch(0.398 0.07 227.392)", textDark: false },
    { label: "Chart 4", token: "--chart-4", value: "oklch(0.828 0.189 84.429)", textDark: true },
    { label: "Chart 5", token: "--chart-5", value: "oklch(0.769 0.188 70.08)", textDark: true },
  ];

  const radii = [
    { name: "sm", token: "--radius-sm", value: "6px" },
    { name: "md", token: "--radius-md", value: "8px" },
    { name: "lg (base)", token: "--radius-lg", value: "10px" },
    { name: "xl", token: "--radius-xl", value: "14px" },
    { name: "2xl", token: "--radius-2xl", value: "18px" },
    { name: "3xl", token: "--radius-3xl", value: "22px" },
    { name: "4xl", token: "--radius-4xl", value: "26px" },
  ];

  const spacing = [
    { name: "1", px: 4, rem: "0.25rem" },
    { name: "2", px: 8, rem: "0.5rem" },
    { name: "3", px: 12, rem: "0.75rem" },
    { name: "4", px: 16, rem: "1rem" },
    { name: "6", px: 24, rem: "1.5rem" },
    { name: "8", px: 32, rem: "2rem" },
    { name: "10", px: 40, rem: "2.5rem" },
    { name: "12", px: 48, rem: "3rem" },
    { name: "16", px: 64, rem: "4rem" },
    { name: "20", px: 80, rem: "5rem" },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card border-b border-border px-8 py-4 flex items-center justify-between shadow-sm">
        <div>
          <h1 className="font-serif text-xl font-bold text-foreground">Harvard Poll — Design System</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Internal reference · Not consumer-facing</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono bg-primary/10 text-primary px-2.5 py-1 rounded-full font-medium">
            v1.0 · March 2026
          </span>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-8 py-10 space-y-16">

        {/* ── Foundations ── */}
        <section id="foundations">
          <SectionHeader
            title="Foundations"
            description="The core design decisions that govern every visual element in the product."
          />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <FoundationCard
              title="Primary Color"
              description="Rose-700 (oklch 0.514 0.2 13.9). Used exclusively for primary actions — Launch Session, submit buttons, active states. Never use for decorative purposes."
              accent="bg-primary"
            />
            <FoundationCard
              title="Typography"
              description="Geist Sans for all UI text. Geist Mono for codes, IDs, and technical values. Playfair Display (serif) for display headings and editorial moments only."
              accent="bg-foreground"
            />
            <FoundationCard
              title="Radius System"
              description="Base radius is 10px (--radius-lg). Components use calc() offsets from this base. Never mix radius scales within the same component."
              accent="bg-chart-1"
            />
          </div>
        </section>

        {/* ── Color Tokens ── */}
        <section id="colors">
          <SectionHeader
            title="Color Tokens"
            description="All colors are defined as CSS custom properties in globals.css using OKLCH. Click any swatch to copy the token name."
          />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mt-6">
            {colors.map((c) => (
              <Swatch key={c.token} {...c} />
            ))}
          </div>
          <div className="mt-6 p-4 rounded-xl bg-muted border border-border text-sm text-muted-foreground space-y-1">
            <p className="font-semibold text-foreground text-xs uppercase tracking-wider mb-2">Usage Rules</p>
            <p>· <strong>Primary</strong> is rose. Use it only for the single most important action on a screen.</p>
            <p>· <strong>Destructive</strong> is reserved for irreversible actions (delete, end session).</p>
            <p>· <strong>Muted / Secondary</strong> are interchangeable neutral surfaces — prefer <code className="font-mono text-xs bg-background px-1 rounded">muted</code> for backgrounds, <code className="font-mono text-xs bg-background px-1 rounded">secondary</code> for interactive elements.</p>
            <p>· Chart colors are ordered by visual weight — use in sequence (1→5) for data series.</p>
          </div>
        </section>

        {/* ── Typography ── */}
        <section id="typography">
          <SectionHeader
            title="Typography"
            description="Three font families, each with a specific role. Never substitute one for another."
          />
          <Card className="mt-6">
            <CardContent className="pt-2 pb-0 divide-y divide-border">
              <TypeSpecimen
                label="Display / Serif"
                className="font-serif text-4xl font-bold text-foreground"
                sample="Harvard Poll"
                meta="Playfair Display · Bold · Display headings only"
              />
              <TypeSpecimen
                label="Heading 1"
                className="text-3xl font-bold text-foreground"
                sample="Session Builder"
                meta="Geist Sans · 700 · 30px"
              />
              <TypeSpecimen
                label="Heading 2"
                className="text-xl font-semibold text-foreground"
                sample="Add a Question"
                meta="Geist Sans · 600 · 20px"
              />
              <TypeSpecimen
                label="Heading 3"
                className="text-base font-semibold text-foreground"
                sample="Quick Presets"
                meta="Geist Sans · 600 · 16px"
              />
              <TypeSpecimen
                label="Body"
                className="text-sm text-foreground"
                sample="Choose a question type from the sidebar, use a preset, or generate questions automatically with AI."
                meta="Geist Sans · 400 · 14px"
              />
              <TypeSpecimen
                label="Small / Label"
                className="text-xs font-medium text-muted-foreground uppercase tracking-wider"
                sample="ADD A QUESTION"
                meta="Geist Sans · 500 · 12px · uppercase · tracked"
              />
              <TypeSpecimen
                label="Mono / Code"
                className="font-mono text-sm text-foreground"
                sample="23EAJB · short_text · oklch(0.514 0.2 13.9)"
                meta="Geist Mono · 400 · 14px · session codes, types, values"
              />
            </CardContent>
          </Card>
        </section>

        {/* ── Spacing ── */}
        <section id="spacing">
          <SectionHeader
            title="Spacing"
            description="Tailwind's default 4px base unit. Prefer multiples of 4. Internal component padding uses 4–6, section gaps use 8–12, page margins use 16–20."
          />
          <Card className="mt-6">
            <CardContent className="pt-6 divide-y divide-border">
              {spacing.map((s) => <SpacingRow key={s.name} {...s} />)}
            </CardContent>
          </Card>
        </section>

        {/* ── Border Radius ── */}
        <section id="radius">
          <SectionHeader
            title="Border Radius"
            description="All radius values derive from --radius (10px base). Use the named tokens, never hardcode pixel values."
          />
          <Card className="mt-6">
            <CardContent className="pt-6 divide-y divide-border">
              {radii.map((r) => <RadiusRow key={r.name} {...r} />)}
            </CardContent>
          </Card>
        </section>

        {/* ── Components ── */}
        <section id="components">
          <SectionHeader
            title="Components"
            description="Live renders of every UI component in the system. All sourced from src/components/ui/."
          />

          {/* Buttons */}
          <SubSection title="Button" path="src/components/ui/button.tsx">
            <div className="flex flex-wrap gap-3 items-center">
              <Button>Default</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="destructive">Destructive</Button>
              <Button variant="link">Link</Button>
            </div>
            <div className="flex flex-wrap gap-3 items-center mt-4">
              <Button size="lg"><Rocket className="w-4 h-4" /> Launch Session</Button>
              <Button size="default"><Plus className="w-4 h-4" /> Add Question</Button>
              <Button size="sm">Small</Button>
              <Button size="icon"><Trash2 className="w-4 h-4" /></Button>
              <Button disabled><Loader2 className="w-4 h-4 animate-spin" /> Loading</Button>
            </div>
          </SubSection>

          {/* Inputs */}
          <SubSection title="Input" path="src/components/ui/input.tsx">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Session Title</Label>
                <Input placeholder="e.g. Week 4 — Newton's Laws" />
              </div>
              <div className="space-y-2">
                <Label>Invite Code</Label>
                <Input placeholder="02143" type="password" />
              </div>
            </div>
          </SubSection>

          {/* Textarea */}
          <SubSection title="Textarea" path="src/components/ui/textarea.tsx">
            <div className="space-y-2 max-w-lg">
              <Label>Question Text</Label>
              <Textarea
                placeholder="e.g. What was the main takeaway from today's lecture?"
                rows={3}
              />
            </div>
          </SubSection>

          {/* Card */}
          <SubSection title="Card" path="src/components/ui/card.tsx">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Session Builder</CardTitle>
                  <CardDescription>Build and manage your session questions.</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">Card body content goes here.</p>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-primary">
                <CardHeader>
                  <CardTitle className="text-base">Question Card</CardTitle>
                  <CardDescription className="font-mono text-xs">short_text · Q1</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">What was the main takeaway from today's lecture?</p>
                </CardContent>
              </Card>
            </div>
          </SubSection>

          {/* Tabs */}
          <SubSection title="Tabs" path="src/components/ui/tabs.tsx">
            <Tabs defaultValue="builder" className="max-w-lg">
              <TabsList>
                <TabsTrigger value="builder">Builder</TabsTrigger>
                <TabsTrigger value="live">Live Dashboard</TabsTrigger>
                <TabsTrigger value="synthesis">Synthesis</TabsTrigger>
              </TabsList>
              <TabsContent value="builder">
                <p className="text-sm text-muted-foreground pt-3">Session builder content.</p>
              </TabsContent>
              <TabsContent value="live">
                <p className="text-sm text-muted-foreground pt-3">Live dashboard content.</p>
              </TabsContent>
              <TabsContent value="synthesis">
                <p className="text-sm text-muted-foreground pt-3">AI synthesis content.</p>
              </TabsContent>
            </Tabs>
          </SubSection>

          {/* Progress */}
          <SubSection title="Progress" path="src/components/ui/progress.tsx">
            <div className="space-y-4 max-w-sm">
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Responses collected</span><span>24 / 30</span>
                </div>
                <Progress value={80} />
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Session progress</span><span>2 / 5 questions</span>
                </div>
                <Progress value={40} />
              </div>
            </div>
          </SubSection>

          {/* Star Rating */}
          <SubSection title="StarRating" path="src/components/ui/StarRating.tsx">
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <Star
                  key={n}
                  className={`w-7 h-7 ${n <= 4 ? "fill-chart-1 text-chart-1" : "text-border"}`}
                />
              ))}
              <span className="text-sm text-muted-foreground ml-2">4 / 5</span>
            </div>
          </SubSection>
        </section>

        {/* ── Interaction Patterns ── */}
        <section id="patterns">
          <SectionHeader
            title="Interaction Patterns"
            description="Recurring UX patterns used throughout the product. Apply consistently."
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            <PatternCard
              title="Empty States"
              description="Always include: a muted icon, a short heading, a one-sentence explanation, and at least one actionable CTA. Never leave a blank canvas with only descriptive text."
              example={
                <div className="rounded-xl border-2 border-dashed border-border p-6 text-center space-y-2">
                  <div className="text-3xl opacity-30">🗂️</div>
                  <p className="text-sm font-semibold text-foreground">No questions yet</p>
                  <p className="text-xs text-muted-foreground">Add a question or use a preset to get started.</p>
                  <Button size="sm" className="mt-1">+ Add Question</Button>
                </div>
              }
            />
            <PatternCard
              title="Onboarding Steps"
              description="Use a vertical step tracker for multi-step flows. Pre-check completed steps. Highlight the active step with the primary color. Gray out future steps."
              example={
                <div className="space-y-0">
                  {[
                    { label: "Name your session", done: true },
                    { label: "Add your first question", active: true },
                    { label: "Launch & share", pending: true },
                  ].map((s, i) => (
                    <div key={i} className="flex items-start gap-3 relative">
                      {i < 2 && <div className="absolute left-[13px] top-7 w-0.5 h-6 bg-border" />}
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold relative z-10 ${s.done ? "bg-green-100 text-green-700" : s.active ? "bg-primary text-white ring-4 ring-primary/15" : "bg-muted text-muted-foreground"}`}>
                        {s.done ? <CheckCircle2 className="w-4 h-4" /> : s.active ? i + 1 : <Circle className="w-3 h-3" />}
                      </div>
                      <div className="pb-5 pt-0.5">
                        <p className={`text-sm font-medium ${s.pending ? "text-muted-foreground" : "text-foreground"}`}>{s.label}</p>
                      </div>
                    </div>
                  ))}
                </div>
              }
            />
            <PatternCard
              title="Drag to Reorder"
              description="Use @dnd-kit/sortable. Show GripVertical handle on the left of sortable items. Handle is always visible (not hover-only) for discoverability."
              example={
                <div className="space-y-2">
                  {["What should we START doing?", "What should we STOP doing?"].map((q, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card">
                      <GripVertical className="w-4 h-4 text-muted-foreground/50 cursor-grab" />
                      <span className="text-xs font-mono text-muted-foreground">Q{i + 1}</span>
                      <span className="text-sm text-foreground flex-1">{q}</span>
                    </div>
                  ))}
                </div>
              }
            />
            <PatternCard
              title="Toast Notifications"
              description="Use sonner for all feedback toasts. Success for confirmations, info for neutral updates, error for failures. Keep messages under 8 words."
              example={
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" onClick={() => toast.success("Question added")}>Success toast</Button>
                  <Button size="sm" variant="outline" onClick={() => toast.info("Draft saved")}>Info toast</Button>
                  <Button size="sm" variant="destructive" onClick={() => toast.error("Failed to save")}>Error toast</Button>
                </div>
              }
            />
          </div>
        </section>

        {/* ── Question Types ── */}
        <section id="question-types">
          <SectionHeader
            title="Question Types"
            description="The four question types supported by the platform. Each has a canonical type string, icon, and color."
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            {[
              { type: "short_text", label: "Short Text", icon: <Type className="w-5 h-5" />, color: "text-blue-600 bg-blue-50", desc: "Open-ended written response" },
              { type: "multiple_choice", label: "Multiple Choice", icon: <ListChecks className="w-5 h-5" />, color: "text-violet-600 bg-violet-50", desc: "Select from defined options" },
              { type: "file_upload", label: "File Upload", icon: <Paperclip className="w-5 h-5" />, color: "text-emerald-600 bg-emerald-50", desc: "Students submit a file" },
              { type: "rating", label: "Star Rating", icon: <Star className="w-5 h-5" />, color: "text-amber-600 bg-amber-50", desc: "1–5 star rating scale" },
            ].map((qt) => (
              <div key={qt.type} className="rounded-xl border border-border bg-card p-4 space-y-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${qt.color}`}>
                  {qt.icon}
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{qt.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{qt.desc}</p>
                </div>
                <code className="text-[10px] font-mono bg-muted px-2 py-1 rounded text-muted-foreground block">
                  {qt.type}
                </code>
              </div>
            ))}
          </div>
        </section>

        {/* ── Voice & Tone ── */}
        <section id="voice">
          <SectionHeader
            title="Voice & Tone"
            description="How the product speaks to professors and students."
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base text-green-700">Do</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {[
                  "\"Add your first question\"",
                  "\"Students join with code 23EAJB\"",
                  "\"3 questions generated\"",
                  "\"Draft saved\"",
                  "\"Launch & share with students\"",
                ].map((s) => (
                  <div key={s} className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                    <span className="text-foreground">{s}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base text-destructive">Don't</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {[
                  "\"Add questions to build your session.\"",
                  "\"Please enter a valid session code\"",
                  "\"Magic\" (for AI features)",
                  "\"An error has occurred\"",
                  "\"Click here to get started\"",
                ].map((s) => (
                  <div key={s} className="flex items-start gap-2">
                    <div className="w-4 h-4 rounded-full border-2 border-destructive shrink-0 mt-0.5" />
                    <span className="text-muted-foreground line-through">{s}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-border pt-8 pb-16 text-center space-y-1">
          <p className="text-xs text-muted-foreground font-medium">Harvard Poll Platform — Design System</p>
          <p className="text-xs text-muted-foreground">Internal use only · <span className="font-mono">src/app/design-system/</span></p>
        </footer>

      </div>
    </div>
  );
}

// ── Helper Components ─────────────────────────────────────────────────────────
function SectionHeader({ title, description }: { title: string; description: string }) {
  return (
    <div className="space-y-1 border-b border-border pb-4">
      <h2 className="text-2xl font-bold text-foreground">{title}</h2>
      <p className="text-sm text-muted-foreground max-w-2xl">{description}</p>
    </div>
  );
}

function SubSection({ title, path, children }: { title: string; path: string; children: React.ReactNode }) {
  return (
    <div className="mt-8 space-y-3">
      <div className="flex items-baseline gap-3">
        <h3 className="text-base font-semibold text-foreground">{title}</h3>
        <code className="text-[10px] font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded">{path}</code>
      </div>
      <div className="p-5 rounded-xl border border-border bg-background">
        {children}
      </div>
    </div>
  );
}

function FoundationCard({ title, description, accent }: { title: string; description: string; accent: string }) {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className={`h-2 w-full ${accent}`} />
      <div className="p-4 space-y-1.5">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

function PatternCard({ title, description, example }: { title: string; description: string; example: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="p-4 border-b border-border space-y-1">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
      </div>
      <div className="p-4 bg-background">
        {example}
      </div>
    </div>
  );
}

// ── Page Entry Point ──────────────────────────────────────────────────────────
export default function DesignSystemPage() {
  const [unlocked, setUnlocked] = useState(false);

  if (!unlocked) {
    return <PasswordGate onUnlock={() => setUnlocked(true)} />;
  }

  return <DesignSystem />;
}
