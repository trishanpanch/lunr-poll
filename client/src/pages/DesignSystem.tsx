/* ── Design: Structured Clarity / Swiss Information Design ──
   Same token set as Home.tsx. Indigo primary, Crimson for Launch only.
   DM Sans headings, Inter body. This page is the living reference.
*/

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Eye, EyeOff, Lock, Copy, CheckCircle2, Circle,
  Rocket, Sparkles, Type, ListChecks, Paperclip, Star,
  GripVertical, Trash2, Plus, Loader2, ChevronRight,
} from "lucide-react";

const DS_PASSWORD = "lunr";

// ── Password Gate ─────────────────────────────────────────────────────────────
function PasswordGate({ onUnlock }: { onUnlock: () => void }) {
  const [value, setValue] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState(false);

  const attempt = () => {
    if (value.trim() === DS_PASSWORD) {
      onUnlock();
    } else {
      setError(true);
      setTimeout(() => setError(false), 1200);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "oklch(0.982 0.0107 271.3)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <div style={{ width: "100%", maxWidth: 360, display: "flex", flexDirection: "column", gap: 24 }}>
        <div style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 48, height: 48, borderRadius: "50%",
              background: "oklch(0.96 0.04 264)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <Lock size={20} style={{ color: "oklch(0.45 0.22 264)" }} />
          </div>
          <h1
            style={{
              fontFamily: "'Geist', system-ui, sans-serif",
              fontWeight: 700, fontSize: 22,
              color: "oklch(0.145 0 0)", margin: 0,
            }}
          >
            Design System
          </h1>
          <p style={{ fontSize: 13, color: "oklch(0.556 0 0)", margin: 0 }}>
            Internal reference · Harvard Poll Platform
          </p>
        </div>

        <div
          style={{
            background: "#fff",
            borderRadius: 14,
            border: "1px solid oklch(0.922 0 0)",
            padding: "24px 24px 20px",
            boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
            display: "flex", flexDirection: "column", gap: 16,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <Label htmlFor="ds-pw">Password</Label>
            <div style={{ position: "relative" }}>
              <Input
                id="ds-pw"
                type={show ? "text" : "password"}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && attempt()}
                placeholder="Enter access password"
                autoFocus
                style={error ? { borderColor: "oklch(0.57 0.22 27)", boxShadow: "0 0 0 3px oklch(0.57 0.22 27 / 0.15)" } : {}}
              />
              <button
                type="button"
                onClick={() => setShow((s) => !s)}
                style={{
                  position: "absolute", right: 10, top: "50%",
                  transform: "translateY(-50%)",
                  background: "none", border: "none",
                  color: "oklch(0.556 0 0)", cursor: "pointer",
                  display: "flex", alignItems: "center",
                }}
              >
                {show ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {error && (
              <p style={{ fontSize: 12, color: "oklch(0.57 0.22 27)", fontWeight: 500, margin: 0 }}>
                Incorrect password.
              </p>
            )}
          </div>
          <Button onClick={attempt} className="w-full">Enter</Button>
        </div>

        <p style={{ textAlign: "center", fontSize: 11, color: "oklch(0.556 0 0)", margin: 0 }}>
          Not linked from the consumer app.
        </p>
      </div>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function SectionHeader({ title, description }: { title: string; description: string }) {
  return (
    <div style={{ borderBottom: "1px solid oklch(0.922 0 0)", paddingBottom: 14, marginBottom: 24 }}>
      <h2 style={{ fontFamily: "'Geist', system-ui, sans-serif", fontWeight: 700, fontSize: 22, color: "oklch(0.145 0 0)", margin: "0 0 4px" }}>
        {title}
      </h2>
      <p style={{ fontSize: 13, color: "oklch(0.556 0 0)", margin: 0, maxWidth: 560, lineHeight: 1.55 }}>
        {description}
      </p>
    </div>
  );
}

function SubSection({ title, path, children }: { title: string; path: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 32 }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 12 }}>
        <h3 style={{ fontFamily: "'Geist', system-ui, sans-serif", fontWeight: 600, fontSize: 15, color: "oklch(0.145 0 0)", margin: 0 }}>
          {title}
        </h3>
        <code style={{ fontSize: 10, fontFamily: "'Geist Mono', monospace", background: "oklch(0.95 0.003 264)", color: "oklch(0.556 0 0)", padding: "2px 7px", borderRadius: 5 }}>
          {path}
        </code>
      </div>
      <div style={{ padding: 20, borderRadius: 12, border: "1px solid oklch(0.922 0 0)", background: "oklch(0.982 0.0107 271.3)" }}>
        {children}
      </div>
    </div>
  );
}

function Swatch({ label, token, value, light = false }: { label: string; token: string; value: string; light?: boolean }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(token); setCopied(true); setTimeout(() => setCopied(false), 1400); }}
      title={`Copy ${token}`}
      style={{
        display: "flex", flexDirection: "column", overflow: "hidden",
        borderRadius: 12, border: "1px solid oklch(0.922 0 0)",
        background: "#fff", cursor: "pointer", textAlign: "left",
        transition: "box-shadow 0.15s",
      }}
      className="hover:shadow-md transition-shadow"
    >
      <div
        style={{ height: 56, background: `var(${token})`, display: "flex", alignItems: "flex-end", padding: "0 8px 6px" }}
      >
        {copied && (
          <span style={{ fontSize: 10, fontWeight: 600, color: light ? "rgba(0,0,0,0.5)" : "rgba(255,255,255,0.85)" }}>
            Copied!
          </span>
        )}
      </div>
      <div style={{ padding: "10px 10px 12px" }}>
        <p style={{ fontSize: 11, fontWeight: 600, color: "oklch(0.145 0 0)", margin: "0 0 2px" }}>{label}</p>
        <p style={{ fontSize: 9.5, fontFamily: "'Geist Mono', monospace", color: "oklch(0.556 0 0)", margin: "0 0 1px" }}>{token}</p>
        <p style={{ fontSize: 9, fontFamily: "'Geist Mono', monospace", color: "oklch(0.556 0 0)", margin: 0 }}>{value}</p>
      </div>
    </button>
  );
}

function TypeRow({ label, meta, sample, style: s }: { label: string; meta: string; sample: string; style: React.CSSProperties }) {
  return (
    <div style={{ display: "flex", alignItems: "baseline", gap: 20, padding: "16px 0", borderBottom: "1px solid oklch(0.922 0 0)" }}>
      <div style={{ width: 140, flexShrink: 0 }}>
        <p style={{ fontSize: 11, fontWeight: 600, color: "oklch(0.556 0 0)", textTransform: "uppercase", letterSpacing: "0.07em", margin: "0 0 2px" }}>{label}</p>
        <p style={{ fontSize: 9.5, fontFamily: "'Geist Mono', monospace", color: "oklch(0.556 0 0)", margin: 0 }}>{meta}</p>
      </div>
      <p style={{ margin: 0, ...s }}>{sample}</p>
    </div>
  );
}

function SpacingRow({ name, px, rem }: { name: string; px: number; rem: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "6px 0" }}>
      <span style={{ width: 32, fontSize: 11, fontFamily: "'Geist Mono', monospace", color: "oklch(0.556 0 0)", flexShrink: 0 }}>{name}</span>
      <div style={{ width: px, height: 18, background: "oklch(0.55 0.2 250 / 0.18)", borderRadius: 3, flexShrink: 0 }} />
      <span style={{ fontSize: 11, color: "oklch(0.556 0 0)" }}>{rem} · {px}px</span>
    </div>
  );
}

function RadiusRow({ name, token, value }: { name: string; token: string; value: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "6px 0" }}>
      <span style={{ width: 80, fontSize: 11, fontFamily: "'Geist Mono', monospace", color: "oklch(0.556 0 0)", flexShrink: 0 }}>{name}</span>
      <div style={{ width: 56, height: 36, background: "oklch(0.55 0.2 250 / 0.1)", border: "1.5px solid oklch(0.55 0.2 250 / 0.25)", borderRadius: `var(${token})`, flexShrink: 0 }} />
      <span style={{ fontSize: 11, fontFamily: "'Geist Mono', monospace", color: "oklch(0.556 0 0)" }}>{token} · {value}</span>
    </div>
  );
}

function PatternCard({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <div style={{ borderRadius: 12, border: "1px solid oklch(0.922 0 0)", background: "#fff", overflow: "hidden" }}>
      <div style={{ padding: "14px 16px", borderBottom: "1px solid oklch(0.922 0 0)" }}>
        <p style={{ fontFamily: "'Geist', system-ui, sans-serif", fontWeight: 600, fontSize: 13, color: "oklch(0.145 0 0)", margin: "0 0 3px" }}>{title}</p>
        <p style={{ fontSize: 11.5, color: "oklch(0.556 0 0)", margin: 0, lineHeight: 1.5 }}>{description}</p>
      </div>
      <div style={{ padding: 16, background: "oklch(0.982 0.0107 271.3)" }}>{children}</div>
    </div>
  );
}

// ── Main Design System ────────────────────────────────────────────────────────
function DesignSystemContent() {
  const colors = [
    { label: "Indigo (Primary)", token: "--indigo", value: "oklch(0.45 0.22 264)", light: false },
    { label: "Indigo Hover", token: "--indigo-hover", value: "oklch(0.38 0.22 264)", light: false },
    { label: "Indigo Light", token: "--indigo-light", value: "oklch(0.96 0.04 264)", light: true },
    { label: "Crimson (Launch only)", token: "--crimson", value: "oklch(0.514 0.2 13.9)", light: false },
    { label: "Violet (AI)", token: "--violet", value: "oklch(0.52 0.22 290)", light: false },
    { label: "Violet Light", token: "--violet-light", value: "oklch(0.96 0.04 290)", light: true },
    { label: "Background", token: "--background", value: "oklch(0.982 0.0107 271.3)", light: true },
    { label: "Foreground", token: "--foreground", value: "oklch(0.145 0 0)", light: false },
    { label: "Card", token: "--card", value: "oklch(1 0 0)", light: true },
    { label: "Muted", token: "--muted", value: "oklch(0.95 0.003 264)", light: true },
    { label: "Muted Foreground", token: "--muted-foreground", value: "oklch(0.556 0 0)", light: false },
    { label: "Border", token: "--border", value: "oklch(0.922 0 0)", light: true },
    { label: "Destructive", token: "--destructive", value: "oklch(0.57 0.22 27)", light: false },
  ];

  const radii = [
    { name: "sm", token: "--radius-sm", value: "8px" },
    { name: "md", token: "--radius-md", value: "10px" },
    { name: "lg (base)", token: "--radius-lg", value: "12px" },
    { name: "xl", token: "--radius-xl", value: "16px" },
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

  const questionTypes = [
    { type: "Short Text", icon: <Type size={18} />, color: "oklch(0.45 0.22 264)", bg: "oklch(0.96 0.04 264)", desc: "Open-ended written response", token: "short_text" },
    { type: "Multiple Choice", icon: <ListChecks size={18} />, color: "oklch(0.52 0.22 290)", bg: "oklch(0.96 0.04 290)", desc: "Select from defined options", token: "multiple_choice" },
    { type: "File Upload", icon: <Paperclip size={18} />, color: "oklch(0.52 0.18 160)", bg: "oklch(0.96 0.04 160)", desc: "Students submit a file", token: "file_upload" },
    { type: "Star Rating", icon: <Star size={18} />, color: "oklch(0.62 0.18 60)", bg: "oklch(0.97 0.04 60)", desc: "1–5 star rating scale", token: "rating" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "oklch(0.985 0.01 240)", paddingBottom: 80 }}>
      {/* Header */}
      <header
        style={{
          position: "sticky", top: 0, zIndex: 50,
          background: "#fff", borderBottom: "1px solid oklch(0.922 0 0)",
          padding: "14px 32px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
        }}
      >
        <div>
          <h1 style={{ fontFamily: "'Geist', system-ui, sans-serif", fontWeight: 700, fontSize: 18, color: "oklch(0.145 0 0)", margin: "0 0 2px" }}>
Harvard Poll — Design System
        </h1>
          <p style={{ fontSize: 11.5, color: "oklch(0.556 0 0)", margin: 0 }}>
            Internal reference · Not consumer-facing
          </p>
        </div>
        <span
          style={{
            fontSize: 11, fontFamily: "'Geist Mono', monospace",
            background: "oklch(0.96 0.04 264)", color: "oklch(0.45 0.22 264)",
            padding: "4px 12px", borderRadius: 20, fontWeight: 600,
          }}
        >
          v1.0 · March 2026
        </span>
      </header>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "40px 32px" }}>

        {/* ── Foundations ── */}
        <section style={{ marginBottom: 56 }}>
          <SectionHeader title="Foundations" description="The core design decisions that govern every visual element in the product." />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
            {[
              { title: "Primary Color", desc: "Indigo (oklch 0.45 0.22 264) for all primary interactive elements — buttons, links, active states, focus rings. Crimson is reserved exclusively for the Launch Session CTA. One button, one color.", accent: "oklch(0.45 0.22 264)" },
              { title: "Typography", desc: "DM Sans 700 for all headings and labels. Inter 400/500 for body text. Never use a single weight for the entire interface.", accent: "oklch(0.145 0 0)" },
              { title: "Radius System", desc: "Base radius is 12px (--radius-lg). All components use calc() offsets from this base. Never hardcode pixel values for border radius.", accent: "oklch(0.52 0.22 290)" },
            ].map((f) => (
              <div key={f.title} style={{ borderRadius: 12, border: "1px solid oklch(0.922 0 0)", background: "#fff", overflow: "hidden" }}>
                <div style={{ height: 4, background: f.accent }} />
                <div style={{ padding: "14px 16px" }}>
                  <p style={{ fontFamily: "'Geist', system-ui, sans-serif", fontWeight: 600, fontSize: 13, color: "oklch(0.145 0 0)", margin: "0 0 5px" }}>{f.title}</p>
                  <p style={{ fontSize: 11.5, color: "oklch(0.556 0 0)", margin: 0, lineHeight: 1.55 }}>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Colors ── */}
        <section style={{ marginBottom: 56 }}>
          <SectionHeader title="Color Tokens" description="All colors are CSS custom properties in index.css using OKLCH. Click any swatch to copy the token name." />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
            {colors.map((c) => <Swatch key={c.token} {...c} />)}
          </div>
          <div style={{ marginTop: 14, padding: "14px 16px", borderRadius: 10, background: "oklch(0.95 0.003 264)", border: "1px solid oklch(0.922 0 0)", fontSize: 12, color: "oklch(0.205 0 0)", lineHeight: 1.7 }}>
            <strong style={{ display: "block", marginBottom: 4, fontSize: 10.5, textTransform: "uppercase", letterSpacing: "0.07em" }}>Usage Rules</strong>
            · <strong>Indigo</strong> is the primary color. Use for all buttons, links, active states, and focus rings.<br />
            · <strong>Crimson</strong> is reserved for the <em>Launch Session</em> button only. Do not use it anywhere else.<br />
            · <strong>Violet</strong> is the AI feature color. Use only for AI-related UI elements.<br />
            · <strong>Destructive</strong> is for irreversible actions: delete, end session, remove.
          </div>
        </section>

        {/* ── Typography ── */}
        <section style={{ marginBottom: 56 }}>
          <SectionHeader title="Typography" description="Two font families, each with a specific role. DM Sans for structure, Inter for readability." />
          <div style={{ background: "#fff", borderRadius: 12, border: "1px solid oklch(0.922 0 0)", padding: "0 24px" }}>
            <TypeRow label="Display Heading" meta="DM Sans · 700 · 32px" sample="Session Builder" style={{ fontFamily: "'Geist', system-ui, sans-serif", fontWeight: 700, fontSize: 32, color: "oklch(0.145 0 0)" }} />
            <TypeRow label="Heading 2" meta="DM Sans · 700 · 22px" sample="Add a Question" style={{ fontFamily: "'Geist', system-ui, sans-serif", fontWeight: 700, fontSize: 22, color: "oklch(0.145 0 0)" }} />
            <TypeRow label="Heading 3" meta="DM Sans · 600 · 16px" sample="Quick Presets" style={{ fontFamily: "'Geist', system-ui, sans-serif", fontWeight: 600, fontSize: 16, color: "oklch(0.145 0 0)" }} />
            <TypeRow label="Body" meta="Inter · 400 · 14px" sample="Choose a question type from the sidebar, use a preset, or generate questions automatically with AI." style={{ fontFamily: "'Geist', system-ui, sans-serif", fontWeight: 400, fontSize: 14, color: "oklch(0.145 0 0)", lineHeight: 1.6 }} />
            <TypeRow label="Small / Label" meta="Inter · 500 · 11px · caps" sample="ADD A QUESTION" style={{ fontFamily: "'Geist', system-ui, sans-serif", fontWeight: 500, fontSize: 11, textTransform: "uppercase" as const, letterSpacing: "0.09em", color: "oklch(0.556 0 0)" }} />
            <TypeRow label="Mono / Code" meta="monospace · 13px · codes" sample="23EAJB · short_text · oklch(0.45 0.22 264)" style={{ fontFamily: "'Geist Mono', monospace", fontSize: 13, color: "oklch(0.45 0.22 264)" }} />
          </div>
        </section>

        {/* ── Spacing ── */}
        <section style={{ marginBottom: 56 }}>
          <SectionHeader title="Spacing" description="Tailwind's 4px base unit. Prefer multiples of 4. Internal padding: 4–6. Section gaps: 8–12. Page margins: 16–20." />
          <div style={{ background: "#fff", borderRadius: 12, border: "1px solid oklch(0.922 0 0)", padding: "16px 24px" }}>
            {spacing.map((s) => <SpacingRow key={s.name} {...s} />)}
          </div>
        </section>

        {/* ── Border Radius ── */}
        <section style={{ marginBottom: 56 }}>
          <SectionHeader title="Border Radius" description="All radius values derive from --radius (12px base). Use named tokens, never hardcode." />
          <div style={{ background: "#fff", borderRadius: 12, border: "1px solid oklch(0.922 0 0)", padding: "16px 24px" }}>
            {radii.map((r) => <RadiusRow key={r.name} {...r} />)}
          </div>
        </section>

        {/* ── Components ── */}
        <section style={{ marginBottom: 56 }}>
          <SectionHeader title="Components" description="Live renders of every UI component. All sourced from client/src/components/ui/." />

          <SubSection title="Button" path="components/ui/button.tsx">
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center", marginBottom: 12 }}>
              <Button>Default</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="destructive">Destructive</Button>
              <Button variant="link">Link</Button>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
              <button
                style={{
                  display: "flex", alignItems: "center", gap: 8,
                  padding: "9px 22px", borderRadius: 10, border: "none",
                  background: "linear-gradient(135deg, oklch(0.52 0.22 10) 0%, oklch(0.44 0.22 10) 100%)",
                  color: "#fff", fontSize: 14, fontWeight: 700,
                  fontFamily: "'Geist', system-ui, sans-serif",
                  boxShadow: "0 2px 10px oklch(0.52 0.22 10 / 0.3)", cursor: "pointer",
                }}
                onClick={() => toast.info("Launch Session clicked")}
              >
                <Rocket size={15} /> Launch Session
              </button>
              <button
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "9px 16px", borderRadius: 9, border: "none",
                  background: "linear-gradient(135deg, oklch(0.52 0.22 290) 0%, oklch(0.60 0.2 290) 100%)",
                  color: "#fff", fontSize: 13, fontWeight: 700,
                  fontFamily: "'Geist', system-ui, sans-serif", cursor: "pointer",
                }}
                onClick={() => toast.success("AI generation triggered")}
              >
                <Sparkles size={14} /> Generate with AI
              </button>
              <Button size="sm">Small</Button>
              <Button size="icon"><Trash2 size={15} /></Button>
              <Button disabled><Loader2 size={14} className="animate-spin" /> Loading</Button>
            </div>
          </SubSection>

          <SubSection title="Input" path="components/ui/input.tsx">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <Label>Session Title</Label>
                <Input placeholder="e.g. Week 4 — Newton's Laws" />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <Label>Session Code</Label>
                <Input placeholder="23EAJB" style={{ fontFamily: "'Geist Mono', monospace", letterSpacing: "0.12em", fontWeight: 700 }} />
              </div>
            </div>
          </SubSection>

          <SubSection title="Textarea" path="components/ui/textarea.tsx">
            <div style={{ display: "flex", flexDirection: "column", gap: 6, maxWidth: 480 }}>
              <Label>Question Text</Label>
              <Textarea placeholder="e.g. What was the main takeaway from today's lecture?" rows={3} />
            </div>
          </SubSection>

          <SubSection title="Badge" path="components/ui/badge.tsx">
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
              <Badge>Default</Badge>
              <Badge variant="secondary">Secondary</Badge>
              <Badge variant="outline">Outline</Badge>
              <Badge variant="destructive">Destructive</Badge>
              <span style={{ fontSize: 10, fontWeight: 700, background: "oklch(0.96 0.04 264)", color: "oklch(0.45 0.22 264)", padding: "3px 8px", borderRadius: 20 }}>3Q</span>
              <span style={{ fontSize: 10, fontWeight: 700, background: "oklch(0.96 0.04 290)", color: "oklch(0.52 0.22 290)", padding: "3px 8px", borderRadius: 20 }}>AI</span>
            </div>
          </SubSection>
        </section>

        {/* ── Question Types ── */}
        <section style={{ marginBottom: 56 }}>
          <SectionHeader title="Question Types" description="The four question types. Each has a canonical type string, icon, and color. Use these consistently." />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
            {questionTypes.map((qt) => (
              <div key={qt.type} style={{ borderRadius: 12, border: "1px solid oklch(0.922 0 0)", background: "#fff", padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ width: 38, height: 38, borderRadius: 9, background: qt.bg, display: "flex", alignItems: "center", justifyContent: "center", color: qt.color }}>
                  {qt.icon}
                </div>
                <div>
                  <p style={{ fontFamily: "'Geist', system-ui, sans-serif", fontWeight: 600, fontSize: 13, color: "oklch(0.145 0 0)", margin: "0 0 3px" }}>{qt.type}</p>
                  <p style={{ fontSize: 11, color: "oklch(0.556 0 0)", margin: 0 }}>{qt.desc}</p>
                </div>
                <code style={{ fontSize: 10, fontFamily: "'Geist Mono', monospace", background: "oklch(0.95 0.003 264)", color: "oklch(0.556 0 0)", padding: "3px 8px", borderRadius: 5, display: "block" }}>
                  {qt.token}
                </code>
              </div>
            ))}
          </div>
        </section>

        {/* ── Interaction Patterns ── */}
        <section style={{ marginBottom: 56 }}>
          <SectionHeader title="Interaction Patterns" description="Recurring UX patterns used throughout the product. Apply consistently across all views." />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <PatternCard
              title="Empty States"
              description="Always include: a muted icon, a short heading, a one-sentence explanation, and at least one actionable CTA. Never leave a blank canvas with only descriptive text."
            >
              <div style={{ borderRadius: 10, border: "2px dashed oklch(0.922 0 0)", padding: "24px 16px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                <div style={{ fontSize: 28, opacity: 0.25 }}>🗂️</div>
                <p style={{ fontFamily: "'Geist', system-ui, sans-serif", fontWeight: 600, fontSize: 13, color: "oklch(0.145 0 0)", margin: 0 }}>No questions yet</p>
                <p style={{ fontSize: 11.5, color: "oklch(0.556 0 0)", margin: 0 }}>Add a question or use a preset to get started.</p>
                <Button size="sm" style={{ marginTop: 4 }}><Plus size={13} /> Add Question</Button>
              </div>
            </PatternCard>

            <PatternCard
              title="Onboarding Steps"
              description="Use a vertical step tracker for multi-step flows. Pre-check completed steps. Highlight the active step. Gray out future steps."
            >
              <div>
                {[
                  { label: "Name your session", sub: "Click the title to rename.", done: true },
                  { label: "Add your first question", sub: "Use the sidebar or AI.", active: true },
                  { label: "Launch & share", sub: "Students join with the code.", pending: true },
                ].map((s, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, position: "relative" }}>
                    {i < 2 && <div style={{ position: "absolute", left: 13, top: 28, width: 2, height: 24, background: "oklch(0.922 0 0)" }} />}
                    <div style={{
                      width: 28, height: 28, borderRadius: "50%", flexShrink: 0, position: "relative", zIndex: 1,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 11, fontWeight: 700,
                      background: s.done ? "oklch(0.92 0.08 160)" : s.active ? "oklch(0.45 0.22 264)" : "oklch(0.95 0.003 264)",
                      color: s.done ? "oklch(0.38 0.14 160)" : s.active ? "#fff" : "oklch(0.556 0 0)",
                      boxShadow: s.active ? "0 0 0 4px oklch(0.48 0.18 264 / 0.15)" : "none",
                    }}>
                      {s.done ? <CheckCircle2 size={14} /> : s.active ? i + 1 : <Circle size={11} />}
                    </div>
                    <div style={{ paddingBottom: i < 2 ? 20 : 0, paddingTop: 2 }}>
                      <p style={{ fontSize: 12, fontWeight: 600, color: s.pending ? "oklch(0.75 0.04 264)" : "oklch(0.145 0 0)", margin: "0 0 1px" }}>{s.label}</p>
                      <p style={{ fontSize: 11, color: "oklch(0.556 0 0)", margin: 0 }}>{s.sub}</p>
                    </div>
                  </div>
                ))}
              </div>
            </PatternCard>

            <PatternCard
              title="Drag to Reorder"
              description="Use @dnd-kit/sortable. GripVertical handle always visible on the left — never hover-only. Handle is touch-none for mobile."
            >
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {["What should we START doing?", "What should we STOP doing?"].map((q, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 9, border: "1px solid oklch(0.922 0 0)", background: "#fff" }}>
                    <GripVertical size={15} style={{ color: "oklch(0.708 0 0)", cursor: "grab", flexShrink: 0 }} />
                    <span style={{ fontSize: 10, fontFamily: "'Geist Mono', monospace", color: "oklch(0.556 0 0)", flexShrink: 0 }}>Q{i + 1}</span>
                    <span style={{ fontSize: 12, color: "oklch(0.145 0 0)", flex: 1 }}>{q}</span>
                  </div>
                ))}
              </div>
            </PatternCard>

            <PatternCard
              title="Toast Notifications"
              description="Use sonner for all feedback. Success for confirmations, info for neutral updates, error for failures. Keep messages under 8 words."
            >
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                <Button size="sm" onClick={() => toast.success("Question added")}>Success</Button>
                <Button size="sm" variant="outline" onClick={() => toast.info("Draft saved")}>Info</Button>
                <Button size="sm" variant="destructive" onClick={() => toast.error("Failed to save")}>Error</Button>
              </div>
            </PatternCard>
          </div>
        </section>

        {/* ── Voice & Tone ── */}
        <section style={{ marginBottom: 56 }}>
          <SectionHeader title="Voice & Tone" description="How the product speaks to professors and students. Concise, action-oriented, never passive." />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div style={{ borderRadius: 12, border: "1px solid oklch(0.922 0 0)", background: "#fff", overflow: "hidden" }}>
              <div style={{ padding: "12px 16px", borderBottom: "1px solid oklch(0.922 0 0)", background: "oklch(0.96 0.05 160)" }}>
                <p style={{ fontFamily: "'Geist', system-ui, sans-serif", fontWeight: 700, fontSize: 13, color: "oklch(0.35 0.14 160)", margin: 0 }}>Do</p>
              </div>
              <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
                {[
                  '"Add your first question"',
                  '"Students join with code 23EAJB"',
                  '"3 questions generated"',
                  '"Draft saved"',
                  '"Launch & share with students"',
                ].map((s) => (
                  <div key={s} style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                    <CheckCircle2 size={14} style={{ color: "oklch(0.52 0.18 160)", flexShrink: 0, marginTop: 1 }} />
                    <span style={{ fontSize: 12.5, color: "oklch(0.145 0 0)" }}>{s}</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ borderRadius: 12, border: "1px solid oklch(0.922 0 0)", background: "#fff", overflow: "hidden" }}>
              <div style={{ padding: "12px 16px", borderBottom: "1px solid oklch(0.922 0 0)", background: "oklch(0.97 0.04 27)" }}>
                <p style={{ fontFamily: "'Geist', system-ui, sans-serif", fontWeight: 700, fontSize: 13, color: "oklch(0.57 0.22 27)", margin: 0 }}>Don't</p>
              </div>
              <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
                {[
                  '"Add questions to build your session."',
                  '"Please enter a valid session code"',
                  '"Magic" (for AI features)',
                  '"An error has occurred"',
                  '"Click here to get started"',
                ].map((s) => (
                  <div key={s} style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                    <div style={{ width: 14, height: 14, borderRadius: "50%", border: "2px solid oklch(0.57 0.22 27)", flexShrink: 0, marginTop: 1 }} />
                    <span style={{ fontSize: 12.5, color: "oklch(0.556 0 0)", textDecoration: "line-through" }}>{s}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer style={{ borderTop: "1px solid oklch(0.922 0 0)", paddingTop: 24, textAlign: "center" }}>
          <p style={{ fontSize: 11.5, color: "oklch(0.556 0 0)", margin: "0 0 3px" }}>Harvard Poll Platform — Design System</p>
          <p style={{ fontSize: 11, fontFamily: "'Geist Mono', monospace", color: "oklch(0.708 0 0)", margin: 0 }}>
            Internal use only · src/app/design-system/page.tsx
          </p>
        </footer>
      </div>
    </div>
  );
}

const DS_STORAGE_KEY = "lunr_ds_unlocked";

// ── Page Entry Point ──────────────────────────────────────────────────────────
export default function DesignSystemPage() {
  const [unlocked, setUnlocked] = useState(() => {
    try { return localStorage.getItem(DS_STORAGE_KEY) === "1"; } catch { return false; }
  });

  const handleUnlock = () => {
    try { localStorage.setItem(DS_STORAGE_KEY, "1"); } catch {}
    setUnlocked(true);
  };

  if (!unlocked) return <PasswordGate onUnlock={handleUnlock} />;
  return <DesignSystemContent />;
}
