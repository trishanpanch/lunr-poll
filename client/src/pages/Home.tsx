/* ── Design: Structured Clarity / Swiss Information Design ──
   DM Sans headings, Inter body. Indigo primary, Crimson for Launch only.
   Fixed sidebar (280px) + fluid document canvas.
   Step tracker onboarding, 2×2 question type grid, AI banner hero.
*/

import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useLocation } from "wouter";
import { toast } from "sonner";
import {
  Rocket, Sparkles, Type, ListChecks, Paperclip, Star,
  RotateCcw, GripVertical, X, ChevronRight, CheckCircle2, ChevronsRight,
  Circle, Pencil, ArrowLeft, ToggleLeft, Upload, FileText,
  Loader2, Plus as PlusIcon, Trash2 as TrashIcon, Eye,
  ChevronLeft, ChevronRight as ChevronRightIcon, ChevronDown,
  PanelLeftClose, PanelLeftOpen,
  ImagePlus, ImageOff, MoreHorizontal, Trash2, ZoomIn,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { SavedButton } from "@/components/SavedButton";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Link as LinkIcon } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// ── Types ──────────────────────────────────────────────────────────────────
type QuestionType = "Text" | "Multiple Choice" | "File Upload" | "Star Rating" | "True / False";

interface Question {
  id: string;
  type: QuestionType;
  icon: React.ReactNode;
  text: string;
  color: string;
  options?: string[]; // Multiple Choice answer options
  correctIndex?: number; // Index of the correct answer for Multiple Choice
  tfAnswer?: "True" | "False"; // Correct answer for True / False questions
  modelAnswer?: string; // Model answer for Text questions
  presetSource?: "polling"; // Restricts type-change to Text/MC only
  mediaUrl?: string; // Optional photo attached to the question
}

const TYPE_META: Record<QuestionType, { icon: React.ReactNode; color: string; desc: string }> = {
  "Text":      { icon: <Type size={18} />,        color: "oklch(0.48 0.18 264)", desc: "Open-ended written response" },
  "Multiple Choice": { icon: <ListChecks size={18} />,  color: "oklch(0.52 0.22 290)", desc: "Select from options" },
  "File Upload":     { icon: <Paperclip size={18} />,   color: "oklch(0.52 0.18 160)", desc: "Students submit a file" },
  "Star Rating":     { icon: <Star size={18} />,        color: "oklch(0.62 0.18 60)",  desc: "1–5 star rating scale" },
  "True / False":    { icon: <ToggleLeft size={18} />,  color: "oklch(0.42 0.14 60)",  desc: "True or false answer" },
};


const TYPE_META_SMALL: Record<QuestionType, React.ReactNode> = {
  "Text":      <Type size={10} />,
  "Multiple Choice": <ListChecks size={10} />,
  "File Upload":     <Paperclip size={10} />,
  "Star Rating":     <Star size={10} />,
  "True / False":    <ToggleLeft size={10} />,
};

const PRESETS = [
  {
    name: "Start, Stop, Continue",
    icon: <RotateCcw size={15} />,
    count: 3,
    questions: [
      { type: "Text" as QuestionType, text: "What should we START doing in this class?" },
      { type: "Text" as QuestionType, text: "What should we STOP doing in this class?" },
      { type: "Text" as QuestionType, text: "What should we CONTINUE doing in this class?" },
    ],
  },
  {
    name: "Rate the Class",
    icon: <Star size={15} />,
    count: 1,
    questions: [
      { type: "Star Rating" as QuestionType, text: "How would you rate today's class overall?" },
    ],
  },
  {
    name: "Polling / Vote",
    icon: <ListChecks size={15} />,
    count: 1,
    questions: [
      { type: "Multiple Choice" as QuestionType, text: "Which topic would you like to explore further?", options: ["", ""], presetSource: "polling" as const },
    ],
  },
];

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

// ── Topbar ─────────────────────────────────────────────────────────────────
function Topbar({
  sessionName,
  onNameChange,
  onNameSave,
  sessionCode,
  isUntitled,
  onLaunch,
  onPreview,
  hasQuestions,
  onBack,
  onSaveDraft,
  isDirty,
  hasEverSaved,
}: {
  sessionName: string;
  onNameChange: (v: string) => void;
  onNameSave: (name: string) => void;
  sessionCode: string;
  isUntitled: boolean;
  onLaunch: () => void;
  onPreview: () => void;
  hasQuestions: boolean;
  onBack: () => void;
  onSaveDraft: () => void;
  isDirty: boolean;
  hasEverSaved: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [copied, setCopied] = useState(false);

  const commitName = () => {
    onNameSave(sessionName);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(sessionCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <header
      style={{
        background: "var(--card)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderBottom: "1px solid var(--border)",
        height: 64,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 28px",
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
      }}
    >
      {/* Left: back button + session name + code */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <button
          onClick={onBack}
          title="Back to My Sessions"
          style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            width: 34, height: 34, borderRadius: 9,
            background: "none", border: "1.5px solid var(--border)",
            color: "var(--foreground)", cursor: "pointer", flexShrink: 0,
            transition: "all 0.15s",
          }}
          className="hover:bg-[oklch(0.982_0.0107_271.3)] hover:border-[oklch(0.88_0.04_264)] hover:text-[oklch(0.45_0.22_264)] transition-all"
        >
          <ArrowLeft size={16} />
        </button>
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5 }} className="group">
            <input
              ref={inputRef}
              value={sessionName}
              onChange={(e) => onNameChange(e.target.value)}
              onBlur={commitName}
              onKeyDown={(e) => e.key === "Enter" && (e.currentTarget as HTMLInputElement).blur()}
              placeholder="Untitled Session"
              style={{
                fontFamily: "'Geist', system-ui, sans-serif",
                fontWeight: 700,
                fontSize: 17,
                color: "var(--foreground)",
                background: "transparent",
                border: "none",
                borderBottom: "1.5px solid transparent",
                padding: "2px 4px 2px 4px",
                outline: "none",
                minWidth: 120,
                width: `${Math.max((sessionName || "").length || "Untitled Session".length, 10)}ch`,
                maxWidth: 320,
                transition: "border-color 0.15s, background 0.15s",
                cursor: "text",
                borderRadius: "4px 4px 0 0",
              }}
              className="hover:border-b-[oklch(0.82_0.04_264)] focus:border-b-[oklch(0.45_0.22_264)] placeholder:text-[oklch(0.82_0.005_264)] placeholder:font-bold"
            />

          </div>
        <span
          style={{
            fontSize: 12,
            color: "var(--muted-foreground)",
            paddingLeft: '4px',
            letterSpacing: "0.03em", marginTop: '-4px',
          }}
        >
          Code:{" "}
          <span
            onClick={handleCopyCode}
            title="Click to copy"
            style={{
              position: "relative",
              fontWeight: 700,
              color: copied ? "oklch(0.52 0.18 160)" : "oklch(0.45 0.22 264)",
              letterSpacing: "0.1em",
              fontFamily: "'Geist Mono', monospace",
              cursor: "pointer",
              borderRadius: 4,
              padding: "1px 4px",
              background: copied ? "oklch(0.92 0.08 160)" : "transparent",
              transition: "color 0.2s, background 0.2s",
              userSelect: "none",
            }}
          >
            {copied ? "Copied!" : sessionCode}
          </span>
        </span>
      </div>
      </div>

      {/* Right: actions */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <SavedButton
          isDirty={isDirty}
          hasEverSaved={hasEverSaved}
          onSave={onSaveDraft}
          saveLabel="Save Draft"
        />
        {/* Preview button */}
        <Button
          variant="outline"
          onClick={onPreview}
          disabled={!hasQuestions}
          title={!hasQuestions ? "Add at least one question to preview" : "Preview student experience"}
          className="gap-1.5"
          style={{ fontFamily: "'Geist', system-ui, sans-serif", fontSize: 13 }}
        >
          <Eye size={14} />
          Preview
        </Button>
        <button
          onClick={onLaunch}
          disabled={!hasQuestions}
          title={!hasQuestions ? "Add at least one question to launch" : undefined}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "9px 22px",
            borderRadius: 10,
            border: "none",
            background: hasQuestions
              ? "linear-gradient(135deg, var(--crimson) 0%, var(--crimson-hover) 100%)"
              : "var(--border)",
            color: hasQuestions ? "#fff" : "var(--muted-foreground)",
            fontSize: 14,
            fontWeight: 700,
            fontFamily: "'Geist', system-ui, sans-serif",
            boxShadow: hasQuestions ? "0 2px 10px oklch(0.514 0.2 13.9 / 0.3)" : "none",
            transition: "opacity 0.15s, box-shadow 0.15s, background 0.2s, color 0.2s",
            cursor: hasQuestions ? "pointer" : "not-allowed",
          }}
          className={hasQuestions ? "hover:opacity-90 hover:shadow-lg transition-all" : ""}
        >
          <Rocket size={15} />
          Launch Session
        </button>
      </div>
    </header>
  );
}

// ── Sidebar ────────────────────────────────────────────────────────────────
function Sidebar({
  onAddType,
  onAddPreset,
  onOpenMagic,
  collapsed,
  onToggleCollapsed,
}: {
  onAddType: (t: QuestionType) => void;
  onAddPreset: (p: typeof PRESETS[0]) => void;
  onOpenMagic: () => void;
  collapsed: boolean;
  onToggleCollapsed: () => void;
}) {
  const toggleCollapsed = onToggleCollapsed;
  const W = collapsed ? 56 : 280;

  return (
    <aside
      style={{
        width: W,
        minWidth: W,
        background: "var(--card)",
        flexShrink: 0,
        transition: "width 0.2s ease",
        alignSelf: "stretch",
        position: "relative",
        borderRight: "1px solid var(--border)",
      }}
    >
      {/* Sticky inner container — pins content to viewport while aside fills full page height */}
      <div style={{
        position: "sticky",
        top: 64,
        height: "calc(100vh - 64px)",
        display: "flex",
        flexDirection: "column",
        overflowY: collapsed ? "visible" : "auto",
        overflowX: "hidden",
        width: "100%",
      }}>
      {/* Toggle button — always visible at top */}
      <div style={{
        display: "flex",
        justifyContent: collapsed ? "center" : "flex-end",
        padding: collapsed ? "12px 0" : "10px 10px 0",
        flexShrink: 0,
      }}>
        <button
          onClick={toggleCollapsed}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "var(--muted-foreground)",
            display: "flex",
            alignItems: "center",
            padding: 6,
            borderRadius: 8,
          }}
          className="hover:bg-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
        >
          {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
        </button>
      </div>

      {collapsed ? (
        /* ── Icon-only strip ── */
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, padding: "4px 0 16px" }}>
          {/* AI generate icon */}
          <button
            onClick={onOpenMagic}
            title="Generate with AI"
            style={{
              width: 40, height: 40,
              borderRadius: 10,
              border: "1.5px solid var(--border)",
              background: "var(--card)",
              color: "var(--violet)",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer",
              transition: "all 0.15s",
              marginBottom: 4,
            }}
            className="hover:border-[oklch(0.55_0.2_290)] hover:shadow-sm transition-all"
          >
            <Sparkles size={18} />
          </button>

          {/* Divider */}
          <div style={{ width: 28, height: 1, background: "var(--border)", margin: "4px 0" }} />

          {/* Question type icons */}
          {(["Text", "Multiple Choice", "True / False", "Star Rating", "File Upload"] as QuestionType[]).map((type) => {
            const meta = TYPE_META[type];
            return (
              <button
                key={type}
                onClick={() => onAddType(type)}
                title={type}
                style={{
                  width: 40, height: 40,
                  borderRadius: 10,
                  border: "1.5px solid var(--border)",
                  background: "var(--card)",
                  color: meta.color,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
                className="hover:border-[oklch(0.55_0.2_250)] hover:shadow-sm transition-all"
              >
                {meta.icon}
              </button>
            );
          })}

          {/* Divider */}
          <div style={{ width: 28, height: 1, background: "var(--border)", margin: "4px 0" }} />

          {/* Preset icons */}
          {PRESETS.map((preset) => (
            <button
              key={preset.name}
              onClick={() => onAddPreset(preset)}
              title={preset.name}
              style={{
                width: 40, height: 40,
                borderRadius: 10,
                border: "1.5px solid var(--border)",
                background: "var(--card)",
                color: "oklch(0.55 0.2 250)",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer",
                transition: "all 0.15s",
              }}
              className="hover:border-[oklch(0.55_0.2_250)] hover:shadow-sm transition-all"
            >
              {preset.icon}
            </button>
          ))}
        </div>
      ) : (
        /* ── Expanded full sidebar ── */
        <>
          {/* AI Banner */}
          <div
            style={{
              margin: "8px 14px 0",
              background: "linear-gradient(135deg, var(--violet-light) 0%, var(--destructive-light) 100%)",
              border: "1.5px solid var(--border)",
              borderRadius: 14,
              padding: "16px 16px 14px",
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Sparkles size={18} style={{ color: "var(--ai-tab-icon)" }} />
              <span style={{ fontFamily: "'Geist', system-ui, sans-serif", fontWeight: 700, fontSize: 14, color: "var(--foreground)" }}>
                Generate with AI
              </span>
            </div>
            <p style={{ fontSize: 12, color: "var(--muted-foreground)", lineHeight: 1.55, margin: 0 }}>
              Paste your lecture notes or topic — AI will draft questions instantly.
            </p>
            <button
              onClick={onOpenMagic}
              style={{
                marginTop: 4,
                padding: "9px 14px",
                borderRadius: 9,
                border: "none",
                background: "linear-gradient(135deg, var(--violet) 0%, var(--violet-hover) 100%)",
                color: "#fff",
                fontSize: 13,
                fontWeight: 700,
                fontFamily: "'Geist', system-ui, sans-serif",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                boxShadow: "0 2px 8px oklch(0.52 0.22 290 / 0.28)",
                transition: "opacity 0.15s",
              }}
              className="hover:opacity-88 transition-opacity"
            >
              <Sparkles size={14} />
              Generate Questions
            </button>
          </div>

          {/* Question Types */}
          <div style={{ padding: "20px 14px 0" }}>
            <p style={{ fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.09em", color: "var(--muted-foreground)", marginBottom: 10 }}>
              Add a Question
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {(["Text", "Multiple Choice", "True / False", "Star Rating", "File Upload"] as QuestionType[]).map((type) => {
                const meta = TYPE_META[type];
                return (
                  <button
                    key={type}
                    onClick={() => onAddType(type)}
                    title={meta.desc}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 7,
                      padding: "14px 8px",
                      borderRadius: 12,
                      border: "1.5px solid var(--border)",
                      background: "var(--card)",
                      fontSize: 12,
                      fontWeight: 500,
                      fontFamily: "'Geist', system-ui, sans-serif",
                      color: "var(--foreground)",
                      transition: "all 0.15s",
                    }}
                    className="hover:border-[oklch(0.55_0.2_250)] hover:bg-[oklch(0.982_0.0107_271.3)] hover:text-[oklch(0.55_0.2_250)] hover:shadow-sm transition-all"
                  >
                    <span style={{ color: meta.color }}>{meta.icon}</span>
                    {type}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Presets */}
          <div style={{ padding: "20px 14px 20px" }}>
            <p style={{ fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.09em", color: "var(--muted-foreground)", marginBottom: 10 }}>
              Quick Presets
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {PRESETS.map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => onAddPreset(preset)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "10px 12px",
                    borderRadius: 10,
                    border: "1.5px solid var(--border)",
                    background: "var(--card)",
                    fontSize: 13,
                    fontWeight: 500,
                    fontFamily: "'Geist', system-ui, sans-serif",
                    color: "var(--foreground)",
                    transition: "all 0.15s",
                    textAlign: "left",
                  }}
                  className="hover:border-[oklch(0.55_0.2_250)] hover:bg-[oklch(0.982_0.0107_271.3)] hover:text-[oklch(0.55_0.2_250)] transition-all"
                >
                  <span style={{ color: "oklch(0.55 0.2 250)", opacity: 0.8 }}>{preset.icon}</span>
                  <span style={{ flex: 1 }}>{preset.name}</span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
      </div>
    </aside>
  );
}

// ── Onboarding Steps ────────────────────────────────────────────────────────
function OnboardingSteps({
  hasQuestions,
  hasNamed,
  sessionCode,
  onDismiss,
}: {
  hasQuestions: boolean;
  hasNamed: boolean;
  sessionCode: string;
  onDismiss: () => void;
}) {
  const steps = [
    {
      label: "Name your session",
      sub: "Click the title above to give your session a name.",
      done: hasNamed,
      active: !hasNamed,
    },
    {
      label: "Add your first question",
      sub: "Choose a type from the sidebar, use a preset, or generate with AI.",
      done: hasQuestions,
      active: hasNamed && !hasQuestions,
    },
    {
      label: "Launch & share with students",
      sub: (
        <>
          Hit <strong>Launch Session</strong> — students join with code{" "}
          <strong style={{ color: "var(--primary)", letterSpacing: "0.08em", fontFamily: "'Geist Mono', monospace" }}>{sessionCode}</strong>.
        </>
      ),
      done: false,
      active: hasNamed && hasQuestions,
    },
  ];

  return (
    <div
      style={{
        background: "var(--card)",
        borderRadius: 16,
        border: "1px solid var(--border)",
        padding: "20px 24px",
        display: "flex",
        alignItems: "flex-start",
        gap: 20,
        boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
      }}
    >
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        {steps.map((step, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 14,
              position: "relative",
            }}
          >
            {/* Connector line */}
            {i < steps.length - 1 && (
              <div
                style={{
                  position: "absolute",
                  left: 14,
                  top: 30,
                  width: 2,
                  height: "calc(100% - 8px)",
                  background: step.done
                    ? "oklch(0.75 0.12 160)"
                    : "var(--border)",
                  transition: "background 0.3s",
                }}
              />
            )}
            {/* Step indicator */}
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                position: "relative",
                zIndex: 1,
                transition: "all 0.25s",
                ...(step.done
                  ? { background: "var(--green-light)", color: "var(--green)" }
                  : step.active
                  ? {
                      background: "var(--blue)",
                      color: "#fff",
                      boxShadow: "0 0 0 3px oklch(0.55 0.2 250 / 0.22)",
                      animation: "step-ring-pulse 1.8s ease-in-out infinite",
                    }
                  : { background: "var(--blue-light)", color: "oklch(0.56 0.08 250)" }),
              }}
            >
              {step.done ? (
                <CheckCircle2 size={15} />
              ) : step.active ? (
                <span style={{ fontFamily: "'Geist', system-ui, sans-serif", fontWeight: 700, fontSize: 13 }}>
                  {i + 1}
                </span>
              ) : (
                <Circle size={13} />
              )}
            </div>
            {/* Step text */}
            <div style={{ paddingBottom: i < steps.length - 1 ? 22 : 0, paddingTop: 3 }}>
              <p
                style={{
                  fontFamily: "'Geist', system-ui, sans-serif",
                  fontWeight: 600,
                  fontSize: 14,
                  color: step.active || step.done ? "var(--foreground)" : "var(--muted-foreground)",
                  margin: 0,
                  transition: "color 0.25s",
                }}
              >
                {step.label}
              </p>
              <p
                style={{
                  fontSize: 12,
                  color: "var(--muted-foreground)",
                  margin: "3px 0 0",
                  lineHeight: 1.55,
                }}
              >
                {step.sub}
              </p>
            </div>
          </div>
        ))}
      </div>
      <button
        onClick={onDismiss}
        style={{
          fontSize: 12,
          color: "var(--muted-foreground)",
          background: "none",
          border: "none",
          cursor: "pointer",
          textDecoration: "underline",
          whiteSpace: "nowrap",
          marginTop: 2,
          fontFamily: "'Geist', system-ui, sans-serif",
        }}
        className="hover:text-[oklch(0.55_0.2_250)] transition-colors"
      >
        Dismiss
      </button>
    </div>
  );
}

// ── Empty State ─────────────────────────────────────────────────────────────
function EmptyState({
  onMagic,
  onManual,
}: {
  onMagic: () => void;
  onManual: () => void;
}) {
  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--card)",
        borderRadius: 16,
        border: "2px dashed var(--border)",
        minHeight: 260,
        padding: 40,
        textAlign: "center",
        gap: 12,
        transition: "border-color 0.2s, background 0.2s",
      }}
      className="hover:border-[oklch(0.55_0.2_250)] hover:bg-[oklch(0.982_0.0107_271.3)] transition-all"
    >
      <div style={{ fontSize: 38, lineHeight: 1 }}>🗂️</div>
      <p
        style={{
          fontFamily: "'Geist', system-ui, sans-serif",
          fontWeight: 700,
          fontSize: 16,
          color: "var(--foreground)",
          margin: 0,
        }}
      >
        No questions yet
      </p>
      <p
        style={{
          fontSize: 13,
          color: "var(--muted-foreground)",
          maxWidth: 300,
          lineHeight: 1.6,
          margin: 0,
        }}
      >
        Choose a type from the sidebar or use a preset to get started.
      </p>
      <div style={{ display: "flex", gap: 10, marginTop: 4, flexWrap: "wrap", justifyContent: "center" }}>
        <Button
          onClick={onManual}
          style={{
            background: "oklch(0.48 0.18 264)",
            color: "#fff",
            fontSize: 13,
            fontWeight: 700,
            fontFamily: "'Geist', system-ui, sans-serif",
            borderRadius: 10,
            padding: "9px 20px",
            height: "auto",
            gap: 6,
          }}
          className="hover:opacity-90 transition-opacity shadow-sm"
        >
          + Add a Question
        </Button>
      </div>
    </div>
  );
}

// ── MC Option Row ─────────────────────────────────────────────────────────
function MCOptionRow({
  index,
  value,
  isCorrect,
  canRemove,
  onToggleCorrect,
  onChangeText,
  onRemove,
}: {
  index: number;
  value: string;
  isCorrect: boolean;
  canRemove: boolean;
  onToggleCorrect: () => void;
  onChangeText: (val: string) => void;
  onRemove: () => void;
}) {
  // Strip leading letter prefixes like "A) ", "B) ", "A. ", "(A) " from option text
  const stripPrefix = (s: string) => s.replace(/^\(?[A-Za-z]\)?[.)\s]+/, "").trim();
  const cleanValue = stripPrefix(value);

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(cleanValue);
  const inputRef = useRef<HTMLInputElement>(null);

  const commit = () => {
    setEditing(false);
    const trimmed = stripPrefix(draft.trim());
    // If the stored value had a prefix, persist the cleaned version
    if (trimmed !== value) onChangeText(trimmed || cleanValue);
  };

  // Keep draft in sync if parent updates the value (strip prefix on sync)
  useEffect(() => { if (!editing) setDraft(cleanValue); }, [cleanValue, editing]);

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
      {/* Letter badge — click to mark correct */}
      <button
        onClick={onToggleCorrect}
        title={isCorrect ? "Unmark correct" : "Mark as correct"}
        style={{
          width: 22, height: 22, borderRadius: "50%",
          border: isCorrect ? "2px solid var(--green)" : "1.5px solid var(--border)",
          background: isCorrect ? "var(--green-light)" : "var(--muted)",
          color: isCorrect ? "var(--green)" : "var(--muted-foreground)",
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0, fontSize: 10, fontWeight: 700,
          fontFamily: "'Geist Mono', monospace",
          cursor: "pointer", transition: "all 0.15s", padding: 0,
        }}
      >
        {String.fromCharCode(65 + index)}
      </button>

      {/* Option text — click to edit */}
      {editing ? (
        <input
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") { e.preventDefault(); commit(); }
            if (e.key === "Escape") { setDraft(value); setEditing(false); }
          }}
          autoFocus
          style={{
            flex: 1, height: 28, padding: "0 8px",
            borderRadius: 7, border: "1.5px solid oklch(0.52 0.22 290)",
            fontSize: 12.5, fontFamily: "'Geist', system-ui, sans-serif",
            color: "var(--foreground)", background: "var(--card)", outline: "none",
            boxShadow: "0 0 0 3px oklch(0.52 0.22 290 / 0.12)",
          }}
        />
      ) : (
        <span
          onClick={() => setEditing(true)}
          title="Click to edit"
          style={{
            flex: 1, fontSize: 12.5, padding: "3px 6px",
            borderRadius: 6, cursor: "text",
            color: isCorrect ? "var(--green)" : "var(--foreground)",
            fontWeight: isCorrect ? 600 : 400,
            fontFamily: "'Geist', system-ui, sans-serif",
            transition: "background 0.12s",
          }}
          className="hover:bg-[oklch(0.97_0.02_264_/_0.4)]"
        >
          {cleanValue || <span style={{ color: "var(--muted-foreground)" }}>Option {String.fromCharCode(65 + index)}</span>}
        </span>
      )}

      {/* Remove button */}
      {canRemove && (
        <button
          onClick={onRemove}
          style={{
            background: "none", border: "none", cursor: "pointer",
            color: "var(--muted-foreground)", display: "flex",
            alignItems: "center", padding: "3px 4px", borderRadius: 5, flexShrink: 0,
          }}
            className="hover:bg-[var(--muted)] hover:text-[var(--destructive)] transition-colors"
        >
          <X size={12} />
        </button>
      )}
    </div>
  );
}

// ── QBadge — clickable Q-number that opens a position-picker dropdown ────────
function QBadge({
  index,
  totalCount,
  onReorder,
}: {
  index: number;
  totalCount: number;
  onReorder?: (toIndex: number) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Close on outside click
  React.useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const handleSelect = (toIndex: number) => {
    setOpen(false);
    if (toIndex !== index) onReorder?.(toIndex);
  };

  return (
    <div ref={containerRef} style={{ position: "relative", display: "inline-block" }}>
      <span
        onClick={() => onReorder && setOpen((v) => !v)}
        title={onReorder ? "Click to move to a different position" : undefined}
        style={{
          fontSize: 11,
          padding: "3px 9px",
          borderRadius: 20,
          background: open ? "oklch(0.96 0.04 264)" : "var(--muted)",
          color: open ? "oklch(0.45 0.22 264)" : "oklch(0.556 0 0)",
          fontWeight: 500,
          fontFamily: "'Geist', system-ui, sans-serif",
          border: open ? "1.5px solid oklch(0.78 0.1 264)" : "1.5px solid transparent",
          cursor: onReorder ? "pointer" : "default",
          display: "inline-flex",
          alignItems: "center",
          gap: 2,
          transition: "all 0.12s",
          userSelect: "none" as const,
        }}
        className={onReorder ? "hover:bg-[oklch(0.94_0.04_264)] hover:text-[oklch(0.45_0.22_264)] hover:border-[oklch(0.78_0.1_264)] transition-all" : ""}
      >
        Q{index + 1}
      </span>

      {open && (
        <div
          style={{
            position: "absolute",
            bottom: "calc(100% + 6px)",
            left: 0,
            zIndex: 200,
            background: "var(--card)",
            border: "1.5px solid var(--border)",
            borderRadius: 10,
            boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
            padding: "4px",
            display: "flex",
            flexDirection: "column",
            gap: 2,
            minWidth: 56,
          }}
        >
          {Array.from({ length: totalCount }, (_, i) => (
            <button
              key={i}
              onClick={() => handleSelect(i)}
              style={{
                padding: "5px 10px",
                borderRadius: 7,
                border: "none",
                background: i === index ? "oklch(0.94 0.04 264)" : "transparent",
                color: i === index ? "oklch(0.45 0.22 264)" : "oklch(0.25 0 0)",
                fontWeight: i === index ? 700 : 500,
                fontSize: 12,
                fontFamily: "'Geist', system-ui, sans-serif",
                cursor: i === index ? "default" : "pointer",
                textAlign: "left" as const,
                whiteSpace: "nowrap" as const,
              }}
              className={i !== index ? "hover:bg-[oklch(0.97_0.02_264)] transition-colors" : ""}
            >
              Q{i + 1}{i === index ? " ✓" : ""}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Question Card ───────────────────────────────────────────────────────────
function QuestionCard({
  question,
  index,
  onRemove,
  onUpdate,
  onUpdateModelAnswer,
  onUpdateOptions,
  onUpdateType,
  onUpdateMedia,
  iconNudge = 1,
  onReorder,
  totalCount = 1,
}: {
  question: Question;
  index: number;
  onRemove: () => void;
  onUpdate: (text: string) => void;
  onUpdateModelAnswer?: (answer: string) => void;
  onUpdateOptions?: (options: string[], correctIndex: number | undefined) => void;
  onUpdateType?: (newType: QuestionType, newQuestion: Partial<Question>) => void;
  onUpdateMedia?: (mediaUrl: string | undefined) => void;
  iconNudge?: number;
  onReorder?: (toIndex: number) => void;
  totalCount?: number;
}) {
  const meta = TYPE_META[question.type];
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: question.id });
  const sortableStyle: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 10 : undefined,
  };
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(question.text);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [confirmRemoveMedia, setConfirmRemoveMedia] = useState(false);
  const [confirmRemoveQuestion, setConfirmRemoveQuestion] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  // Inline type switching state
  const [transforming, setTransforming] = useState(false);
  const [typeDropdownOpen, setTypeDropdownOpen] = useState(false);
  const typeDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    if (!typeDropdownOpen) return;
    const handler = (e: MouseEvent) => {
      if (typeDropdownRef.current && !typeDropdownRef.current.contains(e.target as Node)) {
        setTypeDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [typeDropdownOpen]);

  const handleSwitchType = async (toType: QuestionType) => {
    if (!onUpdateType || question.type === toType || transforming) return;
    setTransforming(true);
    try {
      const res = await fetch("/api/transform-question", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: question.text, fromType: question.type, toType }),
      });
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      const data = await res.json() as { question: { text: string; type: string; options?: string[]; correctAnswer?: string; modelAnswer?: string } };
      const t = data.question;
      const meta = TYPE_META[toType];
      const update: Partial<Question> = {
        type: toType,
        icon: meta.icon,
        color: meta.color,
        text: t.text ?? question.text,
        options: t.options,
        correctIndex: t.options && t.correctAnswer ? t.options.findIndex((o) => o === t.correctAnswer) : undefined,
        tfAnswer: toType === "True / False" && (t.correctAnswer === "True" || t.correctAnswer === "False") ? t.correctAnswer as "True" | "False" : undefined,
        modelAnswer: t.modelAnswer,
      };
      onUpdateType(toType, update);
    } catch (err) {
      console.error("[canvas-transform] error:", err);
      toast.error("Type switch failed — try again.");
    } finally {
      setTransforming(false);
    }
  };

  // Media upload state
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const mediaInputRef = useRef<HTMLInputElement>(null);

  const handleMediaUpload = async (file: File) => {
    if (!onUpdateMedia) return;
    setUploadingMedia(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload-question-media", { method: "POST", body: formData });
      if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
      const { url } = await res.json();
      onUpdateMedia(url);
    } catch (err) {
      console.error("[media-upload]", err);
      toast.error("Image upload failed — please try again.");
    } finally {
      setUploadingMedia(false);
    }
  };

  // Model answer inline edit state
  const [editingAnswer, setEditingAnswer] = useState(false);
  const [answerDraft, setAnswerDraft] = useState(question.modelAnswer ?? "");
  const answerRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize helper — resets height to auto then sets to scrollHeight
  const autoResize = (el: HTMLTextAreaElement | null) => {
    if (!el) return;
    el.style.height = "auto";
    el.style.height = el.scrollHeight + "px";
  };

  const startEditAnswer = () => {
    setAnswerDraft(question.modelAnswer ?? "");
    setEditingAnswer(true);
    setTimeout(() => {
      answerRef.current?.focus();
      answerRef.current?.select();
      autoResize(answerRef.current);
    }, 0);
  };

  const commitAnswerEdit = () => {
    const trimmed = answerDraft.trim();
    if (onUpdateModelAnswer) {
      if (trimmed !== (question.modelAnswer ?? "")) onUpdateModelAnswer(trimmed);
    }
    setEditingAnswer(false);
  };

  const startEdit = () => {
    setDraft(question.text);
    setEditing(true);
    setTimeout(() => {
      const el = textareaRef.current;
      if (el) {
        el.focus();
        el.select();
        autoResize(el);
      }
    }, 0);
  };

  const commitEdit = () => {
    const trimmed = draft.trim();
    if (trimmed && trimmed !== question.text) onUpdate(trimmed);
    else setDraft(question.text);
    setEditing(false);
  };

  return (
    <div
      ref={setNodeRef}
      style={sortableStyle}
    >
    <div
      className="card-enter hover:shadow-md transition-all"
      style={{
        background: "var(--card)",
        borderRadius: 14,
        border: isDragging ? "1.5px solid oklch(0.55 0.2 250)" : "1.5px solid var(--border)",
        padding: "16px 18px",
        display: "flex",
        alignItems: "flex-start",
        gap: 12,
        boxShadow: isDragging ? "0 8px 24px rgba(0,0,0,0.12)" : "0 1px 4px rgba(0,0,0,0.04)",
        transition: "box-shadow 0.15s, border-color 0.15s",
      }}
    >
      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        style={{
          color: "var(--muted-foreground)",
          marginTop: 3,
          cursor: "grab",
          flexShrink: 0,
          alignSelf: "flex-start",
        }}
        title="Drag to reorder"
      >
        <GripVertical size={16} />
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Type label — dropdown to switch type */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
          {onUpdateType ? (
            <div ref={typeDropdownRef} style={{ position: "relative", marginLeft: iconNudge }}>
              {/* Only Text, Multiple Choice, and True / False can be switched */}
              {/* File Upload and Star Rating show a static badge with no dropdown */}
              {/* Polling preset questions can only switch between Text and Multiple Choice */}
              <button
                onClick={() => {
                  if (transforming) return;
                  if (question.type === "File Upload" || question.type === "Star Rating") return;
                  setTypeDropdownOpen((v) => !v);
                }}
                disabled={transforming}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "2px 7px 2px 5px",
                  borderRadius: 6,
                  border: `1px solid ${meta.color}40`,
                  background: `${meta.color}0d`,
                  color: meta.color,
                  fontSize: 10.5,
                  fontWeight: 700,
                  textTransform: "uppercase" as const,
                  letterSpacing: "0.08em",
                  fontFamily: "'Geist', system-ui, sans-serif",
                  cursor: transforming ? "not-allowed" : "pointer",
                  transition: "all 0.15s",
                }}
                className="hover:opacity-80"
              >
                {transforming
                  ? <Loader2 size={10} className="animate-spin" />
                  : <span style={{ display: "flex", alignItems: "center", color: meta.color, flexShrink: 0 }}>{meta.icon}</span>}
                {question.type}
                {!transforming && question.type !== "File Upload" && question.type !== "Star Rating" && <ChevronDown size={10} style={{ opacity: 0.6 }} />}

              </button>
              {typeDropdownOpen && (
                <div
                  style={{
                    position: "absolute",
                    top: "calc(100% + 4px)",
                    left: 0,
                    zIndex: 50,
                    background: "var(--card)",
                    border: "1.5px solid var(--border)",
                    borderRadius: 10,
                    boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
                    minWidth: 170,
                    overflow: "hidden",
                  }}
                >
                  {((question.presetSource === "polling"
                    ? ["Text", "Multiple Choice"]
                    : ["Text", "Multiple Choice", "True / False"]) as QuestionType[]).map((t, i, arr) => {
                    const tm = TYPE_META[t];
                    const isCurrent = t === question.type;
                    return (
                      <button
                        key={t}
                        onClick={() => { setTypeDropdownOpen(false); if (!isCurrent) handleSwitchType(t); }}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          width: "100%",
                          padding: "8px 12px",
                          background: isCurrent ? `${tm.color}10` : "transparent",
                          border: "none",
                          borderBottom: i < arr.length - 1 ? "1px solid var(--border)" : "none",
                          color: isCurrent ? tm.color : "var(--foreground)",
                          fontSize: 12.5,
                          fontWeight: isCurrent ? 700 : 500,
                          fontFamily: "'Geist', system-ui, sans-serif",
                          cursor: isCurrent ? "default" : "pointer",
                          textAlign: "left" as const,
                          transition: "background 0.1s",
                        }}
                        className={isCurrent ? "" : "hover:bg-[var(--muted)]"}
                      >
                        <span style={{ color: tm.color, display: "flex", alignItems: "center", flexShrink: 0 }}>{tm.icon}</span>
                        {t}
                        {isCurrent && <CheckCircle2 size={12} style={{ marginLeft: "auto", color: tm.color }} />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <p
              style={{
                fontSize: 10.5,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                color: meta.color,
                margin: 0,
                fontFamily: "'Geist', system-ui, sans-serif",
              }}
            >
              {question.type}
            </p>
          )}
        </div>
        {editing ? (
          <textarea
            ref={textareaRef}
            value={draft}
            onChange={(e) => { setDraft(e.target.value); autoResize(e.target); }}
            onBlur={commitEdit}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); commitEdit(); }
              if (e.key === "Escape") { setDraft(question.text); setEditing(false); }
            }}
            rows={1}
            style={{
              width: "100%",
              fontSize: 14,
              fontWeight: 500,
              color: "var(--foreground)",
              lineHeight: 1.5,
              fontFamily: "'Geist', system-ui, sans-serif",
              border: "1.5px solid oklch(0.45 0.22 264)",
              borderRadius: 8,
              padding: "6px 8px",
              resize: "none",
              outline: "none",
              background: "var(--indigo-light)",
              boxShadow: "0 0 0 3px oklch(0.45 0.22 264 / 0.12)",
              overflow: "hidden",
              minHeight: "2.5em",
            }}
          />
        ) : (
          <p
            onClick={startEdit}
            title="Click to edit"
            style={{
              fontSize: 14,
              fontWeight: 500,
              color: "var(--foreground)",
              margin: 0,
              lineHeight: 1.5,
              fontFamily: "'Geist', system-ui, sans-serif",
              cursor: "text",
              borderRadius: 6,
              padding: "2px 4px",
              marginLeft: -4,
              transition: "background 0.12s",
            }}
            className="hover:bg-[oklch(0.97_0.02_264_/_0.4)]"
          >
            {question.text}
          </p>
        )}
        {/* Media image — displayed below question text */}
        {question.mediaUrl && (
          <div style={{ position: "relative", marginTop: 12, marginBottom: 4, background: "var(--muted)", borderRadius: 12, border: "1px solid var(--border)", padding: 10 }}>
            <div
              style={{ position: "relative", cursor: "zoom-in", display: "inline-block", width: "100%" }}
              onClick={() => setLightboxOpen(true)}
              title="Click to expand"
            >
              <img
                src={question.mediaUrl}
                alt="Question media"
                style={{
                  width: "100%",
                  maxHeight: 220,
                  objectFit: "contain",
                  borderRadius: 8,
                  display: "block",
                  height: "auto",
                }}
              />
              <div style={{
                position: "absolute",
                bottom: 6,
                right: 6,
                background: "rgba(0,0,0,0.35)",
                borderRadius: 5,
                padding: "3px 5px",
                display: "flex",
                alignItems: "center",
                color: "#fff",
                pointerEvents: "none",
              }}>
                <ZoomIn size={12} />
              </div>
            </div>
            {/* Lightbox portal */}
            {lightboxOpen && createPortal(
              <div
                onClick={() => setLightboxOpen(false)}
                style={{
                  position: "fixed",
                  inset: 0,
                  zIndex: 9999,
                  background: "rgba(0,0,0,0.85)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: 24,
                  cursor: "zoom-out",
                }}
              >
                <button
                  onClick={(e) => { e.stopPropagation(); setLightboxOpen(false); }}
                  style={{
                    position: "absolute",
                    top: 16,
                    right: 16,
                    background: "rgba(255,255,255,0.12)",
                    border: "none",
                    borderRadius: 8,
                    color: "#fff",
                    width: 36,
                    height: 36,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    fontSize: 20,
                  }}
                >
                  <X size={18} />
                </button>
                <img
                  src={question.mediaUrl}
                  alt="Question media"
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    maxWidth: "90vw",
                    maxHeight: "88vh",
                    objectFit: "contain",
                    borderRadius: 10,
                    boxShadow: "0 8px 40px rgba(0,0,0,0.5)",
                    cursor: "default",
                  }}
                />
              </div>,
              document.body
            )}
            {onUpdateMedia && (
              <button
                onClick={() => setConfirmRemoveMedia(true)}
                title="Remove image"
                style={{
                  position: "absolute",
                  top: 6,
                  right: 6,
                  background: "transparent",
                  border: "none",
                  borderRadius: 6,
                  color: "var(--muted-foreground)",
                  width: 24,
                  height: 24,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  transition: "color 0.15s",
                }}
                className="hover:text-[var(--foreground)]"
              >
                <X size={14} />
              </button>
            )}
            {/* Confirm remove media dialog */}
            <AlertDialog open={confirmRemoveMedia} onOpenChange={setConfirmRemoveMedia}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Remove photo?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently remove the attached photo from this question.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => { setConfirmRemoveMedia(false); onUpdateMedia!(undefined); }}
                    style={{ background: "var(--destructive)", color: "#fff" }}
                  >
                    Remove
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
        {/* True / False answer display */}
        {question.type === "True / False" && question.tfAnswer && (
          <div style={{ marginTop: 8 }}>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                fontSize: 11.5,
                padding: "3px 10px",
                borderRadius: 20,
                background: question.tfAnswer === "True" ? "var(--green-light)" : "var(--destructive-light)",
                color: question.tfAnswer === "True" ? "var(--green)" : "var(--destructive)",
                fontWeight: 600,
                fontFamily: "'Geist', system-ui, sans-serif",
                border: question.tfAnswer === "True" ? "1px solid var(--green-border)" : "1px solid var(--destructive-border)",
              }}
            >
              Answer: {question.tfAnswer}
            </span>
          </div>
        )}
        {/* Multiple Choice options — inline editable */}
        {question.type === "Multiple Choice" && question.options && question.options.length > 0 && (
          <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 5 }}>
            {question.options.map((opt, i) => {
              const isCorrect = question.correctIndex === i;
              return (
                <MCOptionRow
                  key={i}
                  index={i}
                  value={opt}
                  isCorrect={isCorrect}
                  canRemove={(question.options?.length ?? 0) > 2}
                  onToggleCorrect={() => {
                    if (onUpdateOptions) {
                      const newCorrect = isCorrect ? undefined : i;
                      onUpdateOptions(question.options!, newCorrect);
                    }
                  }}
                  onChangeText={(val) => {
                    if (onUpdateOptions) {
                      const newOpts = question.options!.map((o, idx) => idx === i ? val : o);
                      onUpdateOptions(newOpts, question.correctIndex);
                    }
                  }}
                  onRemove={() => {
                    if (onUpdateOptions) {
                      const newOpts = question.options!.filter((_, idx) => idx !== i);
                      const newCorrect = question.correctIndex === i
                        ? undefined
                        : question.correctIndex !== undefined && question.correctIndex > i
                        ? question.correctIndex - 1
                        : question.correctIndex;
                      onUpdateOptions(newOpts, newCorrect);
                    }
                  }}
                />
              );
            })}
            {/* Add option button */}
            {onUpdateOptions && (
              <button
                onClick={() => {
                  const newOpts = [...(question.options ?? []), ""];
                  onUpdateOptions(newOpts, question.correctIndex);
                }}
                style={{
                  alignSelf: "flex-start",
                  marginTop: 2,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  fontSize: 11,
                  fontWeight: 600,
                  color: "oklch(0.52 0.22 290)",
                  background: "var(--violet-light)",
                  border: "1px solid var(--border)",
                  borderRadius: 7,
                  padding: "4px 9px",
                  cursor: "pointer",
                  fontFamily: "'Geist', system-ui, sans-serif",
                }}
                className="hover:opacity-80 transition-opacity"
              >
                + Add option
              </button>
            )}
          </div>
        )}
        {/* Text model answer — always shown for Text, click to edit */}
        {question.type === "Text" && (
          <div style={{ marginTop: 10 }}>
            {editingAnswer ? (
              <>
                <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--primary)", margin: "0 0 4px", fontFamily: "'Geist', system-ui, sans-serif" }}>Model Answer</p>
                <textarea
                  ref={answerRef}
                  value={answerDraft}
                  onChange={(e) => { setAnswerDraft(e.target.value); autoResize(e.target); }}
                  onBlur={commitAnswerEdit}
                  onKeyDown={(e) => {
                    if (e.key === "Escape") { setAnswerDraft(question.modelAnswer ?? ""); setEditingAnswer(false); }
                  }}
                  placeholder="Write a model answer…"
                  rows={1}
                  style={{
                    width: "100%",
                    fontSize: 12.5,
                    color: "var(--foreground)",
                    lineHeight: 1.55,
                    fontFamily: "'Geist', system-ui, sans-serif",
                    border: "1.5px solid oklch(0.45 0.22 264)",
                    borderRadius: 8,
                    padding: "7px 10px",
                    resize: "none",
                    outline: "none",
                    overflow: "hidden",
                    background: "var(--indigo-light)",
                    boxShadow: "0 0 0 3px oklch(0.45 0.22 264 / 0.12)",
                    minHeight: 60,
                    boxSizing: "border-box",
                  }}
                />
              </>
            ) : question.modelAnswer ? (
              <>
                <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--primary)", margin: "0 0 4px", fontFamily: "'Geist', system-ui, sans-serif" }}>Model Answer</p>
                <p
                  onClick={startEditAnswer}
                  title="Click to edit model answer"
                  style={{
                    fontSize: 12.5,
                    color: "oklch(0.3 0.12 264)",
                    lineHeight: 1.55,
                    margin: 0,
                    padding: "7px 10px",
                    background: "var(--indigo-light)",
                    borderRadius: 8,
                    border: "1px solid var(--border)",
                    fontFamily: "'Geist', system-ui, sans-serif",
                    cursor: "text",
                    transition: "background 0.12s, border-color 0.12s",
                    boxSizing: "border-box",
                    display: "block",
                  }}
                  className="hover:bg-[oklch(0.95_0.03_264_/_0.5)] hover:border-[oklch(0.78_0.1_264)]"
                >
                  {question.modelAnswer}
                </p>
              </>
            ) : (
              <button
                onClick={startEditAnswer}
                style={{
                  background: "none",
                  border: "none",
                  padding: 0,
                  fontSize: 12,
                  color: "var(--muted-foreground)",
                  fontFamily: "'Geist', system-ui, sans-serif",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  transition: "color 0.12s",
                }}
                className="hover:text-[oklch(0.45_0.22_264)]"
              >
                <span style={{ fontSize: 14, lineHeight: 1 }}>+</span> Add model answer
              </button>
            )}
          </div>
        )}
        <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <QBadge index={index} totalCount={totalCount ?? 1} onReorder={onReorder} />
          {/* Hidden file input — triggered from dropdown */}
          {onUpdateMedia && (
            <input
              ref={mediaInputRef}
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleMediaUpload(file);
                e.target.value = "";
              }}
            />
          )}
          {uploadingMedia && (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11.5, color: "var(--muted-foreground)", fontFamily: "'Geist', system-ui, sans-serif" }}>
              <Loader2 size={12} className="animate-spin" /> Uploading…
            </span>
          )}
        </div>
      </div>

      {/* Three-dot overflow menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            title="More options"
            style={{
              background: "none",
              border: "none",
              color: "var(--muted-foreground)",
              borderRadius: 7,
              padding: "4px 5px",
              display: "flex",
              alignItems: "center",
              transition: "background 0.15s, color 0.15s",
              flexShrink: 0,
              cursor: "pointer",
            }}
            className="hover:bg-[var(--muted)] hover:text-[var(--foreground)] transition-all"
          >
            <MoreHorizontal size={16} />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          {onUpdateMedia && !question.mediaUrl && (
            <DropdownMenuItem
              onClick={() => mediaInputRef.current?.click()}
              disabled={uploadingMedia}
            >
              <ImagePlus size={14} className="mr-2" />
              Add image
            </DropdownMenuItem>
          )}
          {onUpdateMedia && question.mediaUrl && (
            <DropdownMenuItem
              onClick={() => setConfirmRemoveMedia(true)}
            >
              <ImageOff size={14} className="mr-2" />
              Remove image
            </DropdownMenuItem>
          )}
          {onUpdateMedia && <DropdownMenuSeparator />}
          <DropdownMenuItem
            variant="destructive"
            onClick={() => setConfirmRemoveQuestion(true)}
          >
            <Trash2 size={14} className="mr-2" />
            Delete question
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Confirm delete question dialog */}
      <AlertDialog open={confirmRemoveQuestion} onOpenChange={setConfirmRemoveQuestion}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this question?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the question and any attached image. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => { setConfirmRemoveQuestion(false); onRemove(); }}
              style={{ background: "var(--destructive)", color: "#fff" }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
    </div>
  );
}

// ── Add Question Modal ──────────────────────────────────────────────────────
const SUGGESTIONS: Record<QuestionType, string[]> = {
  "Text": [
    "What was the main takeaway from today's lecture?",
    "In your own words, explain the concept we covered today.",
    "What's one question you still have after today's class?",
    "Describe a real-world example of what we discussed today.",
    "What was the most surprising thing you learned today?",
    "How does today's topic connect to something you already knew?",
  ],
  "Multiple Choice": [
    "Which of the following best describes the concept covered today?",
    "What is the correct definition of the key term from today's lecture?",
    "Which example best illustrates the principle we discussed?",
    "What would happen if the key variable in today's example changed?",
  ],
  "File Upload": [
    "Upload a photo of your completed worksheet.",
    "Submit your annotated diagram from today's activity.",
    "Upload a short written reflection (1 paragraph) on today's topic.",
    "Share a screenshot of your work from today's lab.",
  ],
  "Star Rating": [
    "How confident do you feel about today's material?",
    "Rate your overall understanding of today's lecture.",
    "How engaging did you find today's class?",
    "How well do you feel prepared for the upcoming exam?",
    "How clear was the explanation of today's main concept?",
    "Rate the pace of today's lecture.",
  ],
  "True / False": [],
};

function AddQuestionModal({
  open,
  type,
  onClose,
  onConfirm,
}: {
  open: boolean;
  type: QuestionType | null;
  onClose: () => void;
  onConfirm: (text: string, options?: string[], correctIndex?: number, tfAnswer?: "True" | "False", modelAnswer?: string) => void;
}) {
  const [text, setText] = useState("");
  const [modelAnswer, setModelAnswer] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [options, setOptions] = useState<string[]>(["", ""]);
  const [correctIndex, setCorrectIndex] = useState<number | null>(null);
  const meta = type ? TYPE_META[type] : null;
  const suggestions = type ? SUGGESTIONS[type] : [];
  const isMultipleChoice = type === "Multiple Choice";
  const isTrueFalse = type === "True / False";
  const isShortText = type === "Text";
  const [tfAnswer, setTfAnswer] = useState<"True" | "False" | null>(null);
  const filledOptions = options.map((o, i) => ({ text: o, idx: i })).filter((o) => o.text.trim() !== "");
  const canSubmit = text.trim() !== ""
    && (!isMultipleChoice || (filledOptions.length >= 2 && correctIndex !== null))
    && (!isTrueFalse || tfAnswer !== null);

  const addOption = () => setOptions((prev) => [...prev, ""]);
  const updateOption = (i: number, val: string) => setOptions((prev) => prev.map((o, idx) => idx === i ? val : o));
  const removeOption = (i: number) => setOptions((prev) => prev.filter((_, idx) => idx !== i));

  const optionRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (open) {
      setText("");
      setModelAnswer("");
      setShowSuggestions(false);
      setOptions(["", ""]);
      setCorrectIndex(null);
      setTfAnswer(null);
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent style={{ maxWidth: 440, borderRadius: 18 }}>
        <DialogHeader>
          <DialogTitle
            style={{
              fontFamily: "'Geist', system-ui, sans-serif",
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontSize: 17,
            }}
          >
            {meta && (
              <span style={{ color: meta.color }}>{meta.icon}</span>
            )}
            Add {type} Question
          </DialogTitle>
        </DialogHeader>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <Label
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: "var(--foreground)",
              fontFamily: "'Geist', system-ui, sans-serif",
            }}
          >
            Question text
          </Label>
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={
              type === "Star Rating"
                ? "e.g. How confident do you feel about today's material?"
                : type === "Multiple Choice"
                ? "e.g. Which of the following best describes the concept covered today?"
                : type === "File Upload"
                ? "e.g. Upload a photo of your completed worksheet."
                : type === "True / False"
                ? "e.g. The concept covered today applies in real-world scenarios."
                : "e.g. What was the main takeaway from today's lecture?"
            }
            rows={3}
            style={{ borderRadius: 10, fontSize: 14, resize: "none" }}
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                if (text.trim()) onConfirm(text.trim());
              }
            }}
          />

          {/* Suggestions toggle + list — hidden for True/False */}
          {type !== "True / False" && (<>
          <button
            type="button"
            onClick={() => setShowSuggestions((v) => !v)}
            style={{
              marginTop: 4,
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              fontSize: 12,
              fontWeight: 600,
              color: "oklch(0.55 0.2 250)",
              background: "var(--blue-light)",
              border: "1px solid var(--border)",
              borderRadius: 7,
              padding: "5px 10px",
              cursor: "pointer",
              fontFamily: "'Geist', system-ui, sans-serif",
              transition: "all 0.12s",
            }}
          >
            <Sparkles size={12} />
            {showSuggestions ? "Hide suggestions" : "Show common questions"}
          </button>

          {/* Suggestions list */}
          {showSuggestions && (
            <div style={{
              marginTop: 4,
              border: "1px solid var(--border)",
              borderRadius: 10,
              overflow: "hidden",
              background: "var(--background)",
            }}>
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => { setText(s); setShowSuggestions(false); }}
                  style={{
                    display: "block",
                    width: "100%",
                    textAlign: "left",
                    padding: "9px 12px",
                    fontSize: 13,
                    fontFamily: "'Geist', system-ui, sans-serif",
                    color: "var(--foreground)",
                    background: "transparent",
                    border: "none",
                    borderBottom: i < suggestions.length - 1 ? "1px solid var(--border)" : "none",
                    cursor: "pointer",
                    lineHeight: 1.45,
                    transition: "background 0.1s",
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--card)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                >
                  {s}
                </button>
              ))}
            </div>
          )}
          </>)}

          {/* True / False answer selector */}
          {isTrueFalse && (
            <div style={{ marginTop: 10 }}>
              <Label style={{ fontSize: 13, fontWeight: 600, color: "var(--foreground)", fontFamily: "'Geist', system-ui, sans-serif", display: "block", marginBottom: 8 }}>
                Correct answer
              </Label>
              <div style={{ display: "flex", gap: 8 }}>
                {(["True", "False"] as const).map((label) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => setTfAnswer(label)}
                    style={{
                      flex: 1,
                      padding: "10px 0",
                      borderRadius: 10,
                      border: tfAnswer === label
                        ? "2px solid var(--green)"
                        : "1.5px solid var(--border)",
                      background: tfAnswer === label
                        ? "var(--green-light)"
                        : "var(--card)",
                      color: tfAnswer === label
                        ? "var(--green)"
                        : "var(--foreground)",
                      fontSize: 14,
                      fontWeight: 700,
                      fontFamily: "'Geist', system-ui, sans-serif",
                      cursor: "pointer",
                      transition: "all 0.15s",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 6,
                    }}
                  >
                    {tfAnswer === label && <CheckCircle2 size={14} />}
                    {label}
                  </button>
                ))}
              </div>
              {tfAnswer === null && (
                <p style={{ fontSize: 11, color: "oklch(0.577 0.245 27.325)", margin: "6px 0 0", fontFamily: "'Geist', system-ui, sans-serif" }}>
                  Select the correct answer.
                </p>
              )}
            </div>
          )}

          {/* Text model answer field */}
          {isShortText && (
            <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 4 }}>
              <Label
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: "var(--foreground)",
                  fontFamily: "'Geist', system-ui, sans-serif",
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                }}
              >
                Model Answer
                <span style={{ fontSize: 11, fontWeight: 400, color: "var(--muted-foreground)" }}>(optional)</span>
              </Label>
              <Textarea
                value={modelAnswer}
                onChange={(e) => setModelAnswer(e.target.value)}
                placeholder="Write the ideal answer teachers expect…"
                rows={3}
                style={{ borderRadius: 10, fontSize: 13, resize: "none" }}
              />
            </div>
          )}

          {/* Multiple Choice options editor */}
          {isMultipleChoice && (
            <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 6 }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 5 }}>
                <Label style={{ fontSize: 13, fontWeight: 600, color: "var(--foreground)", fontFamily: "'Geist', system-ui, sans-serif" }}>Answer options</Label>
                <span style={{ fontSize: 11, fontWeight: 400, color: "var(--muted-foreground)", fontFamily: "'Geist', system-ui, sans-serif" }}>(min. 2)</span>
              </div>
              {options.map((opt, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  {/* Correct answer radio */}
                  <button
                    type="button"
                    onClick={() => setCorrectIndex(correctIndex === i ? null : i)}
                    title={correctIndex === i ? "Unmark correct answer" : "Mark as correct answer"}
                    style={{
                      width: 22, height: 22, borderRadius: "50%",
                      border: correctIndex === i ? "2px solid oklch(0.52 0.18 160)" : "1.5px solid var(--border)",
                      background: correctIndex === i ? "var(--green-light)" : "transparent",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      flexShrink: 0, fontSize: 10, fontWeight: 700,
                      color: correctIndex === i ? "var(--green)" : "var(--muted-foreground)",
                      fontFamily: "'Geist Mono', monospace",
                      cursor: "pointer",
                      transition: "all 0.15s",
                      padding: 0,
                    }}
                  >
                    {correctIndex === i ? <CheckCircle2 size={13} /> : String.fromCharCode(65 + i)}
                  </button>
                  <input
                    ref={(el) => { optionRefs.current[i] = el; }}
                    type="text"
                    value={opt}
                    onChange={(e) => updateOption(i, e.target.value)}
                    placeholder={`Option ${String.fromCharCode(65 + i)}`}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        if (i === options.length - 1) {
                          addOption();
                          setTimeout(() => optionRefs.current[i + 1]?.focus(), 0);
                        } else {
                          optionRefs.current[i + 1]?.focus();
                        }
                      }
                      if (e.key === "Backspace" && opt === "" && options.length > 2) {
                        e.preventDefault();
                        removeOption(i);
                        setTimeout(() => optionRefs.current[Math.max(0, i - 1)]?.focus(), 0);
                      }
                    }}
                    style={{
                      flex: 1,
                      height: 34,
                      padding: "0 10px",
                      borderRadius: 8,
                      border: "1.5px solid var(--border)",
                      fontSize: 13,
                      fontFamily: "'Geist', system-ui, sans-serif",
                      color: "var(--foreground)",
                      background: "var(--card)",
                      outline: "none",
                      transition: "border-color 0.15s, box-shadow 0.15s",
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = "oklch(0.52 0.22 290)";
                      e.currentTarget.style.boxShadow = "0 0 0 3px oklch(0.52 0.22 290 / 0.12)";
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = "var(--border)";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  />
                  {options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => removeOption(i)}
                      style={{
                        background: "none", border: "none", cursor: "pointer",
                        color: "var(--muted-foreground)", display: "flex",
                        alignItems: "center", padding: 4, borderRadius: 6,
                        flexShrink: 0,
                      }}
                      className="hover:bg-[oklch(0.96_0_0)] hover:text-[oklch(0.52_0.22_10)] transition-colors"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={() => {
                  addOption();
                  setTimeout(() => optionRefs.current[options.length]?.focus(), 0);
                }}
                style={{
                  marginTop: 2,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                  fontSize: 12,
                  fontWeight: 600,
                  color: "oklch(0.52 0.22 290)",
                  background: "var(--violet-light)",
                  border: "1px solid var(--border)",
                  borderRadius: 7,
                  padding: "5px 10px",
                  cursor: "pointer",
                  fontFamily: "'Geist', system-ui, sans-serif",
                  alignSelf: "flex-start",
                }}
                className="hover:opacity-80 transition-opacity"
              >
                + Add option
              </button>
              {filledOptions.length < 2 && (
                <p style={{ fontSize: 11.5, color: "oklch(0.577 0.245 27.325)", margin: 0, fontFamily: "'Geist', system-ui, sans-serif" }}>
                  Add at least 2 options to continue.
                </p>
              )}
              <p style={{ fontSize: 11, color: correctIndex === null ? "oklch(0.577 0.245 27.325)" : "oklch(0.52 0.18 160)", margin: "2px 0 0", fontFamily: "'Geist', system-ui, sans-serif" }}>
                {correctIndex === null ? "Select the correct answer." : "Correct answer marked."}
              </p>
            </div>
          )}
        </div>
        <DialogFooter style={{ gap: 8 }}>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={() => canSubmit && onConfirm(
              text.trim(),
              isMultipleChoice ? filledOptions.map(o => o.text) : undefined,
              isMultipleChoice && correctIndex !== null ? correctIndex : undefined,
              isTrueFalse ? (tfAnswer ?? undefined) : undefined,
              isShortText && modelAnswer.trim() ? modelAnswer.trim() : undefined,
            ) }
            disabled={!canSubmit}
            style={{
              background: "var(--primary)",
              color: "#fff",
              fontFamily: "'Geist', system-ui, sans-serif",
              fontWeight: 700,
            }}
          >
            Add Question          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── AI Panel ────────────────────────────────────────────────────────────────
type AiGenQuestion = {
  type: QuestionType;
  text: string;
  selected: boolean;
  options?: string[];       // Multiple Choice
  correctAnswer?: string;  // Multiple Choice (option text) or True / False ("True"/"False")
  modelAnswer?: string;    // Text model answer
};

function AiPanel({
  open,
  onClose,
  onOpen,
  onAddQuestions,
  existingQuestions,
  aiPanelWidth,
  isResizingPanel,
  setIsResizingPanel,
  minPanelWidth,
  maxPanelWidth,
}: {
  open: boolean;
  onClose: () => void;
  onOpen: () => void;
  onAddQuestions: (qs: Question[]) => void;
  existingQuestions?: string[];
  aiPanelWidth: number;
  isResizingPanel: boolean;
  setIsResizingPanel: (v: boolean) => void;
  minPanelWidth: number;
  maxPanelWidth: number;
}) {
  const [content, setContent] = useState("");
  const [selectedTypes, setSelectedTypes] = useState<Set<QuestionType>>(new Set(["Text", "Multiple Choice", "True / False"] as QuestionType[]));
  const [count, setCount] = useState(3);
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState<AiGenQuestion[]>([]);
  const [transformingIdx, setTransformingIdx] = useState<Set<number>>(new Set());
  const [isDragging, setIsDragging] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [urlChips, setUrlChips] = useState<string[]>([]);
  const [fileChips, setFileChips] = useState<{ name: string; text: string }[]>([]);
  const [fileUploading, setFileUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const contentTextareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollBodyRef = useRef<HTMLDivElement>(null);

  // Learning objectives — persisted in localStorage
  const [objectives, setObjectives] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem("lunr_objectives") || "[]"); }
    catch { return []; }
  });
  const [objectiveInput, setObjectiveInput] = useState("");
  const objectiveInputRef = useRef<HTMLInputElement>(null);

  const addObjective = () => {
    const trimmed = objectiveInput.trim();
    if (!trimmed) return;
    const next = [...objectives, trimmed];
    setObjectives(next);
    localStorage.setItem("lunr_objectives", JSON.stringify(next));
    setObjectiveInput("");
  };

  const removeObjective = (i: number) => {
    const next = objectives.filter((_, idx) => idx !== i);
    setObjectives(next);
    localStorage.setItem("lunr_objectives", JSON.stringify(next));
  };

  // Suggested objectives from AI — shown as dismissible preview chips
  const [suggestingObjectives, setSuggestingObjectives] = useState(false);
  const [suggestedObjectives, setSuggestedObjectives] = useState<string[]>([]);

  const handleSuggestObjectives = async () => {
    const combinedContent = content.trim();
    if (!combinedContent && urlChips.length === 0 && fileChips.length === 0) return;
    setSuggestingObjectives(true);
    setSuggestedObjectives([]);
    try {
      const res = await fetch("/api/suggest-objectives", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: [
            combinedContent,
            ...fileChips.map((f) => f.text),
          ].filter(Boolean).join("\n\n"),
          urls: urlChips.length > 0 ? urlChips : undefined,
        }),
      });
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      const data = await res.json() as { objectives: string[] };
      setSuggestedObjectives(data.objectives ?? []);
    } catch (err) {
      console.error("[suggest-objectives]", err);
      toast.error("Could not suggest objectives — try again.");
    } finally {
      setSuggestingObjectives(false);
    }
  };

  const acceptSuggested = (obj: string) => {
    if (objectives.includes(obj)) return;
    const next = [...objectives, obj];
    setObjectives(next);
    localStorage.setItem("lunr_objectives", JSON.stringify(next));
    setSuggestedObjectives((prev) => prev.filter((o) => o !== obj));
  };

  const dismissSuggested = (obj: string) => {
    setSuggestedObjectives((prev) => prev.filter((o) => o !== obj));
  };

  const handleAddUrl = () => {
    const trimmed = urlInput.trim();
    if (!trimmed) return;
    let url = trimmed;
    if (!/^https?:\/\//i.test(url)) url = "https://" + url;
    if (urlChips.includes(url)) {
      toast.warning("Already added", { description: "This URL is already in your source list." });
      setUrlInput("");
      return;
    }
    setUrlChips((prev) => [...prev, url]);
    setUrlInput("");
  };

  const removeUrlChip = (url: string) =>
    setUrlChips((prev) => prev.filter((u) => u !== url));

  const scrollPanelToBottom = () => {
    requestAnimationFrame(() => {
      if (scrollBodyRef.current) {
        scrollBodyRef.current.scrollTop = scrollBodyRef.current.scrollHeight;
      }
    });
  };

  const scrollTextareaToBottom = scrollPanelToBottom;

  // State intentionally preserved when drawer closes — no reset on !open

  const toggleType = (t: QuestionType) => {
    setSelectedTypes((prev) => {
      const next = new Set(prev);
      if (next.has(t)) { if (next.size > 1) next.delete(t); }
      else next.add(t);
      return next;
    });
  };

  const handleFile = async (file: File) => {
    setFileUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/extract-file", { method: "POST", body: formData });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Upload failed" }));
        toast.error(err.error || "File upload failed");
        return;
      }
      const data = await res.json() as { text: string; filename: string };
      setFileChips((prev) => [...prev, { name: data.filename, text: data.text }]);
    } catch (e) {
      toast.error("File upload failed");
    } finally {
      setFileUploading(false);
      // reset input so same file can be re-uploaded
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const generate = async () => {
    if ((!content.trim() && urlChips.length === 0 && fileChips.length === 0) || loading) return;
    setLoading(true);
    setGenerated([]);

    // Merge file chip texts into content
    const allContent = [
      content.trim(),
      ...fileChips.map((f) => f.text),
    ].filter(Boolean).join("\n\n");

    const typeList = Array.from(selectedTypes);

    try {
      const res = await fetch("/api/generate-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: allContent.slice(0, 8000),
          count,
          types: typeList,
          urls: urlChips.length > 0 ? urlChips : undefined,
          objectives: objectives.length > 0 ? objectives : undefined,
          existingQuestions: existingQuestions && existingQuestions.length > 0 ? existingQuestions : undefined,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error || `Server error ${res.status}`);
      }

      const data = await res.json() as { questions: Array<{ type: string; text: string; options?: string[]; correctAnswer?: string; modelAnswer?: string }> };

      // Strip leading letter prefixes like "A) ", "B) ", "A. ", "(A) " from MC options
      const stripMcPrefix = (s: string) => s.replace(/^\(?[A-Za-z]\)?[.)\s]+/, "").trim();

      const pool: AiGenQuestion[] = data.questions
        .filter((q) => q.text && q.type)
        .map((q) => {
          const cleanOptions = q.options?.map(stripMcPrefix);
          const cleanCorrect = q.correctAnswer ? stripMcPrefix(q.correctAnswer) : undefined;
          return {
            type: q.type as QuestionType,
            text: q.text,
            selected: true,
            options: cleanOptions,
            correctAnswer: cleanCorrect,
            modelAnswer: q.modelAnswer,
          };
        });

      if (pool.length === 0) throw new Error("No questions returned");
      setGenerated(pool);
    } catch (err) {
      console.error("AI generation error:", err);
      toast.error("Generation failed — check your content and try again.");
    } finally {
      setLoading(false);
    }
  };

  const transformQuestion = async (i: number, toType: QuestionType) => {
    const q = generated[i];
    if (!q || q.type === toType) return;
    setTransformingIdx((prev) => new Set(prev).add(i));
    try {
      const res = await fetch("/api/transform-question", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: q.text,
          fromType: q.type,
          toType,
          sourceContext: content || undefined,
        }),
      });
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      const data = await res.json() as { question: { text: string; type: string; options?: string[]; correctAnswer?: string; modelAnswer?: string } };
      const transformed = data.question;
      updateGenerated(i, {
        type: toType,
        text: transformed.text ?? q.text,
        options: transformed.options,
        correctAnswer: transformed.correctAnswer,
        modelAnswer: transformed.modelAnswer,
      });
    } catch (err) {
      console.error("[transform-question] error:", err);
      toast.error("Transform failed — try again.");
    } finally {
      setTransformingIdx((prev) => { const s = new Set(prev); s.delete(i); return s; });
    }
  };

  const toggleSelect = (i: number) =>
    setGenerated((prev) => prev.map((q, idx) => idx === i ? { ...q, selected: !q.selected } : q));

  const toggleAll = () => {
    const allSelected = generated.every((q) => q.selected);
    setGenerated((prev) => prev.map((q) => ({ ...q, selected: !allSelected })));
  };

  const updateGenerated = (i: number, patch: Partial<AiGenQuestion>) =>
    setGenerated((prev) => prev.map((q, idx) => idx === i ? { ...q, ...patch } : q));

  const addSelected = () => {
    const toAdd: Question[] = generated
      .filter((q) => q.selected)
      .map((q) => {
        const base: Question = {
          id: uid(),
          type: q.type,
          icon: TYPE_META[q.type].icon,
          text: q.text,
          color: TYPE_META[q.type].color,
        };
        // Carry over Multiple Choice options and correct answer
        if (q.type === "Multiple Choice" && q.options && q.options.length >= 2) {
          // Strip leading letter prefixes like "A) ", "B) ", "A. ", "(A) " etc.
          const stripPrefix = (s: string) => s.replace(/^\(?[A-Za-z]\)?[.)\s]+/, "").trim();
          const cleanOptions = q.options.map(stripPrefix);
          base.options = cleanOptions;
          if (q.correctAnswer) {
            // Match against both original and stripped versions
            const stripped = stripPrefix(q.correctAnswer);
            const idx = cleanOptions.findIndex((o) => o === stripped || o === q.correctAnswer);
            if (idx !== -1) base.correctIndex = idx;
          }
        }
        // Carry over True / False correct answer
        if (q.type === "True / False" && (q.correctAnswer === "True" || q.correctAnswer === "False")) {
          base.tfAnswer = q.correctAnswer as "True" | "False";
        }
        // Carry over Text model answer
        if (q.type === "Text" && q.modelAnswer) {
          base.modelAnswer = q.modelAnswer;
        }
        return base;
      });
    onAddQuestions(toAdd);
    // Toast confirmation
    const n = toAdd.length;
    toast.success(`${n} question${n === 1 ? "" : "s"} added to session`, {
      description: "Source material kept — ready for another round.",
      duration: 3000,
    });
    // Option B: keep source material, clear objectives + generated results
    setGenerated([]);
    setObjectives([]);
    setSuggestedObjectives([]);
    localStorage.removeItem("lunr_objectives");
  };

  const handleStartFresh = () => {
    setGenerated([]);
    setContent("");
    setUrlChips([]);
    setFileChips([]);
    setUrlInput("");
    setObjectives([]);
    setSuggestedObjectives([]);
    setObjectiveInput("");
    setSelectedTypes(new Set(["Text", "Multiple Choice", "True / False"] as QuestionType[]));
    setCount(3);
    localStorage.removeItem("lunr_objectives");
  };

  const selectedCount = generated.filter((q) => q.selected).length;

  return (
    <>
      {/* Free-floating trigger — shown only when panel is closed */}
      {!open && (
        <button
          onClick={onOpen}
          title="Generate with AI"
          style={{
            position: "fixed",
            right: 0,
            top: 140,
            width: 44,
            height: 44,
            borderRadius: "12px 0 0 12px",
            background: "linear-gradient(135deg, var(--violet-light) 0%, var(--destructive-light) 100%)",
            border: "1.5px solid var(--border)",
            borderRight: "none",
            padding: 0,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 2px 8px var(--border)",
            zIndex: 300,
          }}
          className="hover:bg-[var(--muted)] transition-colors"
        >
          <Sparkles size={16} style={{ color: "var(--ai-tab-icon)", flexShrink: 0 }} />
        </button>
      )}

      {/* Resize handle — outside the overflow:hidden aside so it isn't clipped */}
      {open && (
        <div
          onMouseDown={() => setIsResizingPanel(true)}
          style={{
            width: 1,
            flexShrink: 0,
            cursor: "col-resize",
            background: "var(--border)",
            alignSelf: "stretch",
            zIndex: 10,
          }}
        />
      )}
      {/* Inline aside — width animates so the canvas resizes naturally */}
      <aside
        style={{
          width: open ? aiPanelWidth : 0,
          minWidth: open ? aiPanelWidth : 0,
          overflow: "hidden",
          transition: isResizingPanel ? "none" : "width 0.3s cubic-bezier(0.4,0,0.2,1), min-width 0.3s cubic-bezier(0.4,0,0.2,1)",
          background: "var(--card)",
          display: "flex",
          flexDirection: "column",
          flexShrink: 0,
          alignSelf: "stretch",
          borderLeft: "none",
        }}
      >
        {/* Resize zone removed — now handled by sibling div above */}
        <div style={{ width: aiPanelWidth, display: "flex", flexDirection: "column", height: "100%", overflow: "hidden", background: "transparent" }}>
          {/* Header */}
          <div style={{
            padding: "16px 18px 14px",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "linear-gradient(135deg, var(--violet-light) 0%, var(--destructive-light) 100%)",
            flexShrink: 0,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Sparkles size={16} style={{ color: "var(--ai-tab-icon)" }} />
              <span style={{ fontFamily: "'Geist', system-ui, sans-serif", fontWeight: 700, fontSize: 14, color: "var(--foreground)" }}>
                Generate with AI
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              {(content.trim() || urlChips.length > 0 || fileChips.length > 0 || objectives.length > 0 || generated.length > 0) && (
                <button
                  onClick={handleStartFresh}
                  title="Clear everything and start over"
                  style={{
                    display: "flex", alignItems: "center", gap: 4,
                    background: "none", border: "1px solid var(--border)",
                    borderRadius: 6, padding: "3px 8px",
                    fontSize: 11, fontWeight: 600,
                    color: "var(--muted-foreground)",
                    fontFamily: "'Geist', system-ui, sans-serif",
                    cursor: "pointer", transition: "all 0.15s",
                  }}
                  className="hover:border-[oklch(0.52_0.22_10)] hover:text-[oklch(0.52_0.22_10)] hover:bg-[oklch(0.97_0.01_10)] transition-all"
                >
                  <RotateCcw size={10} />
                  Start fresh
                </button>
              )}
            <button
              onClick={onClose}
              title="Collapse AI panel"
              style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted-foreground)", display: "flex", alignItems: "center", padding: "4px 0 4px 4px", borderRadius: 6 }}
              className="hover:bg-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
            >
              <ChevronsRight size={16} />
            </button>
            </div>
          </div>

          {/* Scrollable body */}
          <div ref={scrollBodyRef} style={{ flex: 1, overflowY: "auto", padding: "18px 18px 0" }}>

            {/* Upload / Paste area */}
            {generated.length === 0 && (
              <>
                <p style={{ margin: "0 0 8px", fontSize: 12, fontWeight: 600, color: "var(--muted-foreground)", fontFamily: "'Geist', system-ui, sans-serif", textTransform: "uppercase", letterSpacing: "0.07em" }}>
                  Source material
                </p>

                {/* Drop zone */}
                <div
                  onDragOver={(e) => { e.preventDefault(); if (!fileUploading) setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(e) => { e.preventDefault(); setIsDragging(false); if (!fileUploading) { const f = e.dataTransfer.files[0]; if (f) handleFile(f); } }}
                  onClick={() => { if (!fileUploading) fileInputRef.current?.click(); }}
                  style={{
                    border: `1.5px dashed ${isDragging ? "var(--indigo-light)" : "var(--border)"}`,
                    borderRadius: 10,
                    padding: "14px 12px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 6,
                    cursor: fileUploading ? "not-allowed" : "pointer",
                    background: isDragging ? "var(--muted)" : "var(--card)",
                    opacity: fileUploading ? 0.6 : 1,
                    transition: "all 0.15s",
                    marginBottom: fileChips.length > 0 ? 8 : 10,
                  }}
                  className={fileUploading ? "" : "hover:border-[var(--indigo-light)] hover:bg-[var(--muted)] transition-all"}
                >
                  {fileUploading
                    ? <Loader2 size={18} className="animate-spin" style={{ color: "var(--indigo-light)" }} />
                    : <Upload size={18} style={{ color: "var(--indigo-light)" }} />
                  }
                  <span style={{ fontSize: 12, color: "var(--foreground)", fontFamily: "'Geist', system-ui, sans-serif", textAlign: "center", lineHeight: 1.4 }}>
                    {fileUploading ? "Extracting text…" : <><strong>Drop a file</strong> or click to upload</>}<br />
                    <span style={{ color: "var(--muted-foreground)", fontSize: 11 }}>PDF, DOCX, TXT supported</span>
                  </span>
                  <input ref={fileInputRef} type="file" accept=".txt,.pdf,.docx" style={{ display: "none" }} onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
                </div>

                {/* File attachment chips */}
                {fileChips.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
                    {fileChips.map((fc, i) => (
                      <div
                        key={i}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 5,
                          padding: "4px 10px",
                          borderRadius: 20,
                          background: "var(--violet-light)",
                          border: "1px solid var(--border)",
                          fontSize: 12,
                          fontWeight: 500,
                          color: "var(--foreground)",
                          fontFamily: "'Geist', system-ui, sans-serif",
                          maxWidth: 200,
                        }}
                      >
                        <FileText size={12} style={{ flexShrink: 0 }} />
                        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{fc.name}</span>
                        <button
                          onClick={() => setFileChips((prev) => prev.filter((_, idx) => idx !== i))}
                          style={{ background: "none", border: "none", cursor: "pointer", color: "var(--indigo-light)", display: "flex", alignItems: "center", padding: 0, marginLeft: 2 }}
                        >
                          <X size={11} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* URL chip input */}
                <div style={{ marginBottom: 10 }}>
                  <div style={{ display: "flex", gap: 6 }}>
                    <div style={{ flex: 1, position: "relative" }}>
                      <LinkIcon
                        size={13}
                        style={{
                          position: "absolute",
                          left: 9,
                          top: "50%",
                          transform: "translateY(-50%)",
                          color: "var(--muted-foreground)",
                          pointerEvents: "none",
                        }}
                      />
                      <input
                        type="url"
                        value={urlInput}
                        onChange={(e) => setUrlInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleAddUrl()}
                        placeholder="Add a URL as source…"
                        disabled={loading}
                        style={{
                          width: "100%",
                          height: 34,
                          paddingLeft: 28,
                          paddingRight: 10,
                          borderRadius: 8,
                          border: "1.5px solid var(--border)",
                          fontSize: 12,
                          fontFamily: "'Geist', system-ui, sans-serif",
                          color: "var(--foreground)",
                          background: "var(--card)",
                          outline: "none",
                          boxSizing: "border-box",
                          transition: "border-color 0.15s",
                        }}
                        onFocus={(e) => { e.currentTarget.style.borderColor = "oklch(0.52 0.22 290)"; }}
                        onBlur={(e) => { e.currentTarget.style.borderColor = "var(--border)"; }}
                      />
                    </div>
                    <button
                      onClick={handleAddUrl}
                      disabled={!urlInput.trim() || loading}
                      style={{
                        height: 34,
                        padding: "0 12px",
                        borderRadius: 8,
                        border: "none",
                        background: !urlInput.trim() || loading ? "var(--border)" : "oklch(0.52 0.22 290)",
                        color: !urlInput.trim() || loading ? "var(--muted-foreground)" : "#fff",
                        fontSize: 12,
                        fontWeight: 700,
                        fontFamily: "'Geist', system-ui, sans-serif",
                        cursor: !urlInput.trim() || loading ? "not-allowed" : "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 5,
                        flexShrink: 0,
                        transition: "all 0.15s",
                      }}
                    >
                      Add
                    </button>
                  </div>
                  {/* URL chips */}
                  {urlChips.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 7 }}>
                      {urlChips.map((chip) => (
                        <div
                          key={chip}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 5,
                            padding: "3px 8px 3px 7px",
                            borderRadius: 20,
                            background: "var(--violet-light)",
                            border: "1px solid var(--border)",
                            fontSize: 11,
                            fontFamily: "'Geist', system-ui, sans-serif",
                            color: "var(--foreground)",
                            maxWidth: 220,
                          }}
                        >
                          <LinkIcon size={10} style={{ flexShrink: 0 }} />
                          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {chip.replace(/^https?:\/\/(www\.)?/, "")}
                          </span>
                          <button
                            onClick={() => removeUrlChip(chip)}
                            style={{
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                              color: "var(--indigo-light)",
                              display: "flex",
                              alignItems: "center",
                              padding: 0,
                              flexShrink: 0,
                            }}
                          >
                            <X size={10} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <p style={{ margin: "0 0 6px", fontSize: 11.5, fontWeight: 600, color: "var(--muted-foreground)", fontFamily: "'Geist', system-ui, sans-serif", textAlign: "center" }}>or paste text</p>

                <Textarea
                  ref={contentTextareaRef}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  onPaste={() => scrollTextareaToBottom()}
                  placeholder="Paste your lecture notes, slides, or learning objectives here…"
                  rows={6}
                  style={{ borderRadius: 10, fontSize: 13, resize: "none", marginBottom: 16 }}
                  disabled={loading}
                />

                {/* Learning Objectives */}
                <div style={{ marginBottom: 16 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                    <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: "var(--muted-foreground)", fontFamily: "'Geist', system-ui, sans-serif", textTransform: "uppercase", letterSpacing: "0.07em" }}>
                      Learning Objectives
                    </p>
                    <button
                      onClick={handleSuggestObjectives}
                      disabled={suggestingObjectives || (!content.trim() && urlChips.length === 0 && fileChips.length === 0)}
                      title={(!content.trim() && urlChips.length === 0 && fileChips.length === 0) ? "Add source material first" : "Suggest objectives from your source material"}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                        fontSize: 11,
                        fontWeight: 600,
                        color: (!content.trim() && urlChips.length === 0 && fileChips.length === 0) ? "var(--muted-foreground)" : "oklch(0.45 0.18 160)",
                        background: (!content.trim() && urlChips.length === 0 && fileChips.length === 0) ? "var(--muted)" : "var(--green-light)",
                        border: "1px solid " + ((!content.trim() && urlChips.length === 0 && fileChips.length === 0) ? "var(--border)" : "oklch(0.84 0.1 160)"),
                        borderRadius: 6,
                        padding: "3px 8px",
                        cursor: (!content.trim() && urlChips.length === 0 && fileChips.length === 0) ? "not-allowed" : "pointer",
                        fontFamily: "'Geist', system-ui, sans-serif",
                        transition: "all 0.15s",
                      }}
                    >
                      {suggestingObjectives
                        ? <><Loader2 size={10} className="animate-spin" /> Suggesting…</>
                        : <><Sparkles size={10} /> Suggest</>}
                    </button>
                  </div>
                  <p style={{ margin: "0 0 8px", fontSize: 11.5, color: "var(--muted-foreground)", fontFamily: "'Geist', system-ui, sans-serif", lineHeight: 1.5 }}>
                    What should students be able to do after this session? AI will steer questions toward these goals.
                  </p>
                  {/* AI-suggested objectives — accept or dismiss */}
                  {suggestedObjectives.length > 0 && (
                    <div style={{ marginBottom: 10 }}>
                      <p style={{ margin: "0 0 5px", fontSize: 10.5, fontWeight: 700, color: "oklch(0.52 0.22 290)", fontFamily: "'Geist', system-ui, sans-serif", textTransform: "uppercase", letterSpacing: "0.07em" }}>
                        Suggestions — click to add
                      </p>
                      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        {suggestedObjectives.map((obj, i) => (
                          <div
                            key={i}
                            style={{
                              display: "flex",
                              alignItems: "flex-start",
                              gap: 6,
                              padding: "7px 10px",
                              borderRadius: 8,
                              background: "var(--violet-light)",
                              border: "1px solid var(--border)",
                            }}
                          >
                            <span style={{ flex: 1, fontSize: 12, color: "var(--foreground)", fontFamily: "'Geist', system-ui, sans-serif", lineHeight: 1.45 }}>
                              {obj}
                            </span>
                            <div style={{ display: "flex", gap: 4, flexShrink: 0, marginTop: 1 }}>
                              <button
                                onClick={() => acceptSuggested(obj)}
                                title="Add this objective"
                                style={{
                                  background: "var(--green)",
                                  border: "none",
                                  borderRadius: 5,
                                  color: "#fff",
                                  fontSize: 10,
                                  fontWeight: 700,
                                  fontFamily: "'Geist', system-ui, sans-serif",
                                  padding: "2px 7px",
                                  cursor: "pointer",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 3,
                                }}
                              >
                                + Add
                              </button>
                              <button
                                onClick={() => dismissSuggested(obj)}
                                title="Dismiss"
                                style={{ background: "none", border: "none", cursor: "pointer", color: "oklch(0.6 0.06 290)", display: "flex", alignItems: "center", padding: 2 }}
                              >
                                <X size={11} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {/* Objective chips */}
                  {objectives.length > 0 && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 5, marginBottom: 8 }}>
                      {objectives.map((obj, i) => (
                        <div
                          key={i}
                          style={{
                            display: "flex",
                            alignItems: "flex-start",
                            gap: 6,
                            padding: "7px 10px",
                            borderRadius: 8,
                            background: "var(--green-light)",
                            border: "1px solid var(--green-border)",
                          }}
                        >
                          <span style={{ fontSize: 10, fontWeight: 700, color: "var(--green)", fontFamily: "'Geist Mono', monospace", flexShrink: 0, marginTop: 1 }}>
                            {i + 1}.
                          </span>
                          <span style={{ flex: 1, fontSize: 12, color: "var(--foreground)", fontFamily: "'Geist', system-ui, sans-serif", lineHeight: 1.45 }}>
                            {obj}
                          </span>
                          <button
                            onClick={() => removeObjective(i)}
                            style={{ background: "none", border: "none", cursor: "pointer", color: "oklch(0.52 0.12 160)", display: "flex", alignItems: "center", padding: 0, flexShrink: 0, marginTop: 1 }}
                          >
                            <X size={11} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  {/* Add objective input */}
                  <div style={{ display: "flex", gap: 6 }}>
                    <input
                      ref={objectiveInputRef}
                      type="text"
                      value={objectiveInput}
                      onChange={(e) => setObjectiveInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addObjective(); } }}
                      placeholder="e.g. Explain the causes of WWI"
                      style={{
                        flex: 1,
                        height: 34,
                        padding: "0 10px",
                        borderRadius: 8,
                        border: "1.5px solid var(--green-border)",
                        fontSize: 12,
                        fontFamily: "'Geist', system-ui, sans-serif",
                        color: "var(--foreground)",
                        background: "var(--card)",
                        outline: "none",
                        transition: "border-color 0.15s, box-shadow 0.15s",
                      }}
                      onFocus={(e) => { e.currentTarget.style.borderColor = "oklch(0.52 0.18 160)"; e.currentTarget.style.boxShadow = "0 0 0 3px oklch(0.52 0.18 160 / 0.12)"; }}
                      onBlur={(e) => { e.currentTarget.style.borderColor = "oklch(0.88 0.08 160)"; e.currentTarget.style.boxShadow = "none"; }}
                    />
                    <button
                      onClick={addObjective}
                      disabled={!objectiveInput.trim()}
                      style={{
                        height: 34,
                        padding: "0 12px",
                        borderRadius: 8,
                        border: "none",
                        background: objectiveInput.trim() ? "oklch(0.52 0.18 160)" : "var(--border)",
                        color: objectiveInput.trim() ? "#fff" : "var(--muted-foreground)",
                        fontSize: 12,
                        fontWeight: 600,
                        fontFamily: "'Geist', system-ui, sans-serif",
                        cursor: objectiveInput.trim() ? "pointer" : "not-allowed",
                        transition: "all 0.15s",
                        flexShrink: 0,
                      }}
                    >
                      Add
                    </button>
                  </div>
                </div>

                {/* Question types */}
                <p style={{ margin: "0 0 8px", fontSize: 12, fontWeight: 600, color: "var(--muted-foreground)", fontFamily: "'Geist', system-ui, sans-serif", textTransform: "uppercase", letterSpacing: "0.07em" }}>
                  Question types
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 16 }}>
                  {(["Text", "Multiple Choice", "True / False"] as QuestionType[]).map((t) => {
                    const meta = TYPE_META[t];
                    const active = selectedTypes.has(t);
                    return (
                      <button
                        key={t}
                        onClick={() => toggleType(t)}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 5,
                          padding: "5px 10px",
                          borderRadius: 20,
                          border: `1.5px solid ${active ? "var(--violet)" : "var(--border)"}`,
                          background: active ? "var(--violet-light)" : "var(--card)",
                          color: active ? "var(--violet)" : "var(--muted-foreground)",
                          fontSize: 12,
                          fontWeight: 600,
                          fontFamily: "'Geist', system-ui, sans-serif",
                          cursor: "pointer",
                          transition: "all 0.15s",
                        }}
                      >
                        {meta.icon}
                        {t}
                      </button>
                    );
                  })}
                </div>

                {/* Count */}
                <p style={{ margin: "0 0 8px", fontSize: 12, fontWeight: 600, color: "var(--muted-foreground)", fontFamily: "'Geist', system-ui, sans-serif", textTransform: "uppercase", letterSpacing: "0.07em" }}>
                  Number of questions
                </p>
                <div style={{ display: "flex", gap: 6, marginBottom: 18 }}>
                  {[2, 3, 5, 8].map((n) => (
                    <button
                      key={n}
                      onClick={() => setCount(n)}
                      style={{
                        width: 40, height: 36,
                        borderRadius: 8,
                        border: `1.5px solid ${count === n ? "var(--violet)" : "var(--border)"}`,
                        background: count === n ? "var(--violet-light)" : "var(--card)",
                        color: count === n ? "var(--violet)" : "var(--muted-foreground)",
                        fontSize: 13,
                        fontWeight: 700,
                        fontFamily: "'Geist', system-ui, sans-serif",
                        cursor: "pointer",
                        transition: "all 0.15s",
                      }}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </>
            )}

            {/* Generated preview */}
            {generated.length > 0 && (
              <>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                  <button
                    onClick={() => { setGenerated([]); }}
                    style={{
                      display: "flex", alignItems: "center", gap: 5,
                      background: "none", border: "none", cursor: "pointer",
                      fontSize: 12, color: "var(--foreground)",
                      fontFamily: "'Geist', system-ui, sans-serif", fontWeight: 600,
                      padding: 0,
                    }}
                    className="hover:text-[oklch(0.55_0.2_250)] transition-colors"
                  >
                    <ArrowLeft size={13} />
                    Back
                  </button>
                  {!generated.every((q) => q.selected) && (
                    <button
                      onClick={toggleAll}
                      style={{
                        background: "none", border: "none", cursor: "pointer",
                        fontSize: 12, fontWeight: 600,
                        color: "oklch(0.55 0.2 250)",
                        fontFamily: "'Geist', system-ui, sans-serif",
                        padding: 0,
                      }}
                    >
                      Select all
                    </button>
                  )}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 16 }}>
                  {generated.map((q, i) => {
                    const meta = TYPE_META[q.type];
                    return (
                      <div
                        key={i}
                        style={{
                          position: "relative",
                          padding: "16px 16px 14px",
                          paddingRight: 44,
                          borderRadius: 14,
                          border: "1.5px solid var(--border)",
                          background: "var(--card)",
                          boxShadow: "0 1px 4px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.04)",
                          transition: "box-shadow 0.15s, border-color 0.15s",
                          opacity: q.selected ? 1 : 0.45,
                        }}
                        className="hover:shadow-md"
                      >
                        {/* Circular checkbox — top-right */}
                        <div
                          onClick={() => toggleSelect(i)}
                          title={q.selected ? "Deselect" : "Select"}
                          style={{
                            position: "absolute",
                            top: 14, right: 14,
                            width: 24, height: 24, borderRadius: "50%",
                            background: q.selected ? "oklch(0.52 0.18 160)" : "transparent",
                            color: q.selected ? "#fff" : "oklch(0.82 0 0)",
                            border: q.selected ? "none" : "1.5px solid var(--border)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            flexShrink: 0, cursor: "pointer",
                            fontSize: 13, fontWeight: 700, lineHeight: 1,
                            transition: "all 0.15s",
                          }}
                        >
                          {q.selected ? "✓" : ""}
                        </div>

                        {/* Type label + switcher */}
                        <div style={{ marginBottom: 10 }}>
                          <div style={{
                            display: "inline-flex", alignItems: "center", gap: 6,
                            marginBottom: 7,
                          }}>
                            <span style={{ color: meta.color, display: "flex", alignItems: "center" }}>{meta.icon}</span>
                            <span style={{
                              fontSize: 11, fontWeight: 800, textTransform: "uppercase",
                              letterSpacing: "0.09em", color: meta.color,
                              fontFamily: "'Geist', system-ui, sans-serif",
                            }}>{q.type}</span>
                          </div>
                          {/* Type switcher pills — only transformable types */}
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                            {(["Text", "Multiple Choice", "True / False"] as QuestionType[]).map((t) => {
                              const tm = TYPE_META[t];
                              const active = q.type === t;
                              const isTransforming = transformingIdx.has(i);
                              return (
                                <button
                                  key={t}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (active || isTransforming) return;
                                    transformQuestion(i, t);
                                  }}
                                  title={active ? q.type : `Switch to ${t}`}
                                  disabled={isTransforming}
                                  style={{
                                    display: "inline-flex", alignItems: "center", gap: 4,
                                    padding: "3px 8px",
                                    borderRadius: 20,
                                    border: active ? `1.5px solid ${tm.color}` : "1.5px solid oklch(0.91 0 0)",
                                    background: active ? tm.color + "18" : "transparent",
                                    color: active ? tm.color : "oklch(0.65 0 0)",
                                    fontSize: 10.5, fontWeight: active ? 700 : 500,
                                    fontFamily: "'Geist', system-ui, sans-serif",
                                    cursor: active || isTransforming ? "default" : "pointer",
                                    opacity: isTransforming && !active ? 0.45 : 1,
                                    transition: "all 0.12s",
                                    letterSpacing: "0.01em",
                                  }}
                                >
                                  {isTransforming && !active ? (
                                    <Loader2 size={9} style={{ animation: "spin 1s linear infinite" }} />
                                  ) : (
                                    <span style={{ display: "flex", alignItems: "center", opacity: active ? 1 : 0.6, fontSize: 10 }}>
                                      {TYPE_META_SMALL[t]}
                                    </span>
                                  )}
                                  {t}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Question text — inline editable */}
                        <textarea
                          value={q.text}
                          onChange={(e) => {
                            updateGenerated(i, { text: e.target.value });
                            e.target.style.height = "auto";
                            e.target.style.height = e.target.scrollHeight + "px";
                          }}
                          onClick={(e) => e.stopPropagation()}
                          rows={1}
                          style={{
                            display: "block",
                            width: "100%",
                            marginBottom: 12,
                            fontSize: 15,
                            fontWeight: 500,
                            color: "var(--foreground)",
                            lineHeight: 1.55,
                            fontFamily: "'Geist', system-ui, sans-serif",
                            background: "transparent",
                            border: "1px solid transparent",
                            borderRadius: 6,
                            padding: "2px 4px",
                            resize: "none",
                            overflow: "hidden",
                            outline: "none",
                            boxSizing: "border-box",
                            height: "auto",
                            transition: "border-color 0.15s, background 0.15s",
                          }}
                          ref={(el) => {
                            if (el) { el.style.height = "auto"; el.style.height = el.scrollHeight + "px"; }
                          }}
                          onFocus={(e) => {
                            e.currentTarget.style.borderColor = meta.color + "60";
                            e.currentTarget.style.background = "oklch(0.98 0 0)";
                          }}
                          onBlur={(e) => {
                            e.currentTarget.style.borderColor = "transparent";
                            e.currentTarget.style.background = "transparent";
                          }}
                        />

                        {/* Multiple Choice options */}
                        {q.type === "Multiple Choice" && q.options && (
                          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                            {q.options.map((opt, oi) => {
                              const isCorrect = opt === q.correctAnswer;
                              return (
                                <div
                                  key={oi}
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 10,
                                    padding: "7px 10px",
                                    borderRadius: 8,
                                    background: isCorrect ? "oklch(0.95 0.06 160)" : "transparent",
                                    transition: "background 0.15s",
                                  }}
                                >
                                  {/* Letter badge */}
                                  <span style={{
                                    fontSize: 11, fontFamily: "'Geist Mono', monospace",
                                    width: 22, height: 22, borderRadius: "50%",
                                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                                    background: isCorrect ? "oklch(0.52 0.18 160)" : "var(--muted)",
                                    color: isCorrect ? "#fff" : "oklch(0.45 0 0)",
                                    fontWeight: 700,
                                  }}>
                                    {String.fromCharCode(65 + oi)}
                                  </span>
                                  {/* Option text — inline editable */}
                                  <textarea
                                    value={opt}
                                    rows={1}
                                    onClick={(e) => e.stopPropagation()}
                                    onChange={(e) => {
                                      const newOptions = [...(q.options ?? [])];
                                      const wasCorrect = opt === q.correctAnswer;
                                      newOptions[oi] = e.target.value;
                                      updateGenerated(i, {
                                        options: newOptions,
                                        correctAnswer: wasCorrect ? e.target.value : q.correctAnswer,
                                      });
                                      e.target.style.height = "auto";
                                      e.target.style.height = e.target.scrollHeight + "px";
                                    }}
                                    style={{
                                      flex: 1,
                                      fontSize: 13,
                                      color: isCorrect ? "oklch(0.32 0.14 160)" : "oklch(0.25 0 0)",
                                      fontWeight: isCorrect ? 700 : 400,
                                      fontFamily: "'Geist', system-ui, sans-serif",
                                      background: "transparent",
                                      border: "1px solid transparent",
                                      borderRadius: 4,
                                      padding: "1px 4px",
                                      outline: "none",
                                      resize: "none",
                                      overflow: "hidden",
                                      lineHeight: 1.45,
                                      height: "auto",
                                      transition: "border-color 0.15s",
                                    }}
                                    ref={(el) => {
                                      if (el) { el.style.height = "auto"; el.style.height = el.scrollHeight + "px"; }
                                    }}
                                    onFocus={(e) => {
                                      e.currentTarget.style.borderColor = "oklch(0.52 0.18 160 / 0.4)";
                                    }}
                                    onBlur={(e) => {
                                      e.currentTarget.style.borderColor = "transparent";
                                    }}
                                  />

                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* True / False: correct answer badge (click to toggle) */}
                        {q.type === "True / False" && q.correctAnswer && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              updateGenerated(i, { correctAnswer: q.correctAnswer === "True" ? "False" : "True" });
                            }}
                            title="Click to toggle correct answer"
                            style={{
                              display: "inline-flex", alignItems: "center", gap: 5,
                              fontSize: 12, fontWeight: 700,
                              background: q.correctAnswer === "True" ? "oklch(0.92 0.08 160)" : "oklch(0.97 0.04 27)",
                              color: q.correctAnswer === "True" ? "oklch(0.38 0.14 160)" : "oklch(0.57 0.22 27)",
                              padding: "5px 12px", borderRadius: 20,
                              border: q.correctAnswer === "True" ? "1px solid oklch(0.82 0.1 160)" : "1px solid oklch(0.88 0.08 27)",
                              cursor: "pointer",
                              fontFamily: "'Geist', system-ui, sans-serif",
                              transition: "all 0.15s",
                            }}
                          >
                            Answer: {q.correctAnswer}
                          </button>
                        )}

                        {/* Text: model answer */}
                        {q.type === "Text" && q.modelAnswer && (
                          <div style={{ marginTop: 8 }}>
                            <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--primary)", display: "block", marginBottom: 4 }}>Model Answer</span>
                            <textarea
                              value={q.modelAnswer}
                              onChange={(e) => {
                                updateGenerated(i, { modelAnswer: e.target.value });
                                e.target.style.height = "auto";
                                e.target.style.height = e.target.scrollHeight + "px";
                              }}
                              onClick={(e) => e.stopPropagation()}
                              rows={1}
                              style={{
                                display: "block",
                                width: "100%",
                                fontSize: 12,
                                color: "var(--foreground)",
                                lineHeight: 1.5,
                                fontFamily: "'Geist', system-ui, sans-serif",
                                background: "var(--indigo-light)",
                                border: "1px solid var(--border)",
                                borderRadius: 8,
                                padding: "6px 8px",
                                resize: "none",
                                overflow: "hidden",
                                outline: "none",
                                boxSizing: "border-box",
                                height: "auto",
                                transition: "border-color 0.15s, background 0.15s",
                              }}
                              ref={(el) => {
                                if (el) { el.style.height = "auto"; el.style.height = el.scrollHeight + "px"; }
                              }}
                              onFocus={(e) => {
                                e.currentTarget.style.borderColor = "oklch(0.45 0.22 264)";
                                e.currentTarget.style.background = "oklch(0.97 0.02 264)";
                              }}
                              onBlur={(e) => {
                                e.currentTarget.style.borderColor = "var(--border)";
                                e.currentTarget.style.background = "oklch(0.96 0.03 264 / 0.4)";
                              }}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          <div style={{ padding: "14px 18px", borderTop: "1px solid var(--border)", flexShrink: 0 }}>
            {generated.length === 0 ? (
              <button
                onClick={generate}
                disabled={(!content.trim() && urlChips.length === 0 && fileChips.length === 0) || loading}
                style={{
                  width: "100%",
                  padding: "10px 0",
                  borderRadius: 10,
                  border: "none",
                  background: (!content.trim() && urlChips.length === 0 && fileChips.length === 0) || loading
                    ? "var(--border)"
                    : "linear-gradient(135deg, oklch(0.48 0.22 290) 0%, oklch(0.52 0.22 290) 100%)",
                  color: (!content.trim() && urlChips.length === 0 && fileChips.length === 0) || loading ? "var(--muted-foreground)" : "#fff",
                  fontSize: 13,
                  fontWeight: 700,
                  fontFamily: "'Geist', system-ui, sans-serif",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 7,
                  cursor: (!content.trim() && urlChips.length === 0 && fileChips.length === 0) || loading ? "not-allowed" : "pointer",
                  transition: "all 0.15s",
                  boxShadow: (!content.trim() && urlChips.length === 0 && fileChips.length === 0) || loading ? "none" : "0 2px 10px oklch(0.52 0.22 290 / 0.28)",
                }}
              >
                {loading
                  ? <><Loader2 size={14} className="animate-spin" /> Generating…</>
                  : objectives.length > 0
                  ? <><Sparkles size={14} /> Generate ({objectives.length} objective{objectives.length !== 1 ? "s" : ""})</>
                  : <><Sparkles size={14} /> Generate Questions</>}
              </button>
            ) : (
              <button
                onClick={addSelected}
                disabled={selectedCount === 0}
                style={{
                  width: "100%",
                  padding: "10px 0",
                  borderRadius: 10,
                  border: "none",
                  background: selectedCount === 0 ? "var(--border)" : "oklch(0.45 0.22 264)",
                  color: selectedCount === 0 ? "oklch(0.6 0 0)" : "#fff",
                  fontSize: 13,
                  fontWeight: 700,
                  fontFamily: "'Geist', system-ui, sans-serif",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 7,
                  cursor: selectedCount === 0 ? "not-allowed" : "pointer",
                  transition: "all 0.15s",
                }}
              >
                <PlusIcon size={14} />
                Add {selectedCount} Question{selectedCount !== 1 ? "s" : ""} to Session
              </button>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}

// ── Helpers ────────────────────────────────────────────────────────────────
function generateCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 5 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

// ── Main Page ───────────────────────────────────────────────────────────────
export default function Home({ params: routeParams }: { params?: { id?: string } }) {
  const [, navigate] = useLocation();

  // Read id from either path param (/session/:id) or query string (?id=)
  const [dbSessionId, setDbSessionId] = useState<number | null>(() => {
    // Path param takes priority (from /session/:id route)
    if (routeParams?.id) {
      const n = parseInt(routeParams.id, 10);
      if (!isNaN(n)) return n;
    }
    // Fallback: query string (?id=)
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");
    return id ? parseInt(id, 10) : null;
  });

  // Session name
  const [sessionName, setSessionName] = useState("");
  const [savedName, setSavedName] = useState("");
  const hasNamed = savedName.trim() !== "";

  // Session code (display only — assigned by server on first save)
  const [sessionCode, setSessionCode] = useState(() => generateCode());

  // Questions
  const [questions, setQuestions] = useState<Question[]>([]);

  // Load existing session from DB if editing
  const { data: existingSession, error: sessionLoadError } = trpc.session.get.useQuery(
    { id: dbSessionId! },
    { enabled: !!dbSessionId, retry: false }
  );

  // If the session ID in the URL doesn't exist in the DB, reset to a new session
  useEffect(() => {
    if (!sessionLoadError) return;
    toast.error("Session not found — starting a new session.");
    setDbSessionId(null);
    window.history.replaceState(null, "", "/session");
  }, [sessionLoadError]);

  useEffect(() => {
    if (!existingSession) return;
    setSessionName(existingSession.name);
    setSavedName(existingSession.name);
    setSessionCode(existingSession.code);
    const qs = (existingSession.questions as Omit<Question, "icon">[]) ?? [];
    setQuestions(qs.map((q) => ({
      ...q,
      icon: TYPE_META[q.type as QuestionType]?.icon ?? null,
    })));
  }, [existingSession]);

  // Show onboarding unless the user has previously dismissed it
  const [showOnboarding, setShowOnboarding] = useState(() => {
    try { return localStorage.getItem("lunr_onboarding_dismissed") !== "true"; }
    catch { return true; }
  });

  const contentXOffset = -6;

  // tRPC save mutation
  const saveMutation = trpc.session.save.useMutation();

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const [activeId, setActiveId] = useState<string | null>(null);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    if (over && active.id !== over.id) {
      setQuestions((prev) => {
        const oldIndex = prev.findIndex((q) => q.id === active.id);
        const newIndex = prev.findIndex((q) => q.id === over.id);
        return arrayMove(prev, oldIndex, newIndex);
      });
    }
  };

  // Track whether there are unsaved changes
  // hasEverSaved: true only after the user has explicitly saved at least once
  const [hasEverSaved, setHasEverSaved] = useState(false);
  const [savedDraft, setSavedDraft] = useState(false);
  const isDirty = (questions.length > 0 || hasNamed) && !savedDraft;

  // Unsaved-changes dialog
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);
  const [pendingNav, setPendingNav] = useState<string | null>(null);

  const handleSaveDraft = async () => {
    try {
      const serialisable = questions.map(({ icon: _icon, ...rest }) => rest);
      const result = await saveMutation.mutateAsync({
        id: dbSessionId ?? undefined,
        name: savedName || "Untitled Session",
        questions: serialisable,
      });
      if (!dbSessionId) {
        setDbSessionId(result.id);
        setSessionCode(result.code);
        // Update URL without full navigation so back button works
        window.history.replaceState(null, "", `/session?id=${result.id}`);
      }
      setSavedDraft(true);
      setHasEverSaved(true);
      toast.success("Draft saved");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Save failed";
      toast.error(msg);
    }
  };

  // ── Keyboard shortcut: Cmd/Ctrl+S → Save Draft ────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        handleSaveDraft();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questions, savedName, dbSessionId]);

  const handleBack = () => {
    if (isDirty) {
      setPendingNav("/sessions");
      setLeaveDialogOpen(true);
    } else {
      navigate("/sessions");
    }
  };

  const handleLaunch = async () => {
    try {
      // Save first to ensure we have a DB record
      const serialisable = questions.map(({ icon: _icon, ...rest }) => rest);
      const result = await saveMutation.mutateAsync({
        id: dbSessionId ?? undefined,
        name: savedName || "Untitled Session",
        questions: serialisable,
      });
      const id = dbSessionId ?? result.id;
      setDbSessionId(id);
      setSessionCode(result.code);
      setShowOnboarding(false);
      navigate(`/live/${id}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Could not launch session";
      toast.error(msg);
    }
  };

  // Add modal
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addModalType, setAddModalType] = useState<QuestionType | null>(null);

  // Type picker overlay
  const [typePickerOpen, setTypePickerOpen] = useState(false);

  // AI panel
  const [aiPanelOpen, setAiPanelOpen] = useState(() => {
    try { return localStorage.getItem("lunr_ai_panel_open") === "true"; }
    catch { return false; }
  });
  const [aiPanelWidth, setAiPanelWidth] = useState(() => {
    try { return parseInt(localStorage.getItem("lunr_ai_panel_width") || "320", 10); }
    catch { return 320; }
  });
  const minPanelWidth = 240;
  const maxPanelWidth = 600;
  const [isResizingPanel, setIsResizingPanel] = useState(false);

  // Sidebar collapsed state — lifted to Home so the gradient can use the correct width
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try { return localStorage.getItem("lunr_sidebar_collapsed") === "true"; }
    catch { return false; }
  });
  const sidebarWidth = sidebarCollapsed ? 56 : 280;

  // Preview modal
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);

  // ── AI Panel Resize ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isResizingPanel) return;
    const handleMouseMove = (e: MouseEvent) => {
      const viewport = document.documentElement.clientWidth;
      const newWidth = viewport - e.clientX;
      if (newWidth >= minPanelWidth && newWidth <= maxPanelWidth) {
        setAiPanelWidth(newWidth);
      }
    };
    const handleMouseUp = () => {
      setIsResizingPanel(false);
      // Use functional setter to read latest width without stale closure
      setAiPanelWidth((w) => {
        try { localStorage.setItem("lunr_ai_panel_width", w.toString()); } catch { /* ignore */ }
        return w;
      });
    };
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizingPanel]);

  // Persist AI panel open/close state
  useEffect(() => {
    try { localStorage.setItem("lunr_ai_panel_open", aiPanelOpen.toString()); }
    catch { /* ignore */ }
  }, [aiPanelOpen]);

  const openAddType = (type: QuestionType) => {
    setAddModalType(type);
    setAddModalOpen(true);
  };

  const confirmAdd = (text: string, options?: string[], correctIndex?: number, tfAnswer?: "True" | "False", modelAnswer?: string) => {
    if (!addModalType) return;
    const meta = TYPE_META[addModalType];
    setQuestions((prev) => [
      ...prev,
      { id: uid(), type: addModalType, icon: meta.icon, text, color: meta.color, options, correctIndex, tfAnswer, modelAnswer },
    ]);
    setAddModalOpen(false);
    toast.success(`${addModalType} question added`);
  };

  const addPreset = (preset: typeof PRESETS[0]) => {
    const newQs: Question[] = preset.questions.map((q) => ({
      id: uid(),
      type: q.type,
      icon: TYPE_META[q.type].icon,
      text: q.text,
      color: TYPE_META[q.type].color,
      ...("options" in q && q.options ? { options: q.options } : {}),
      ...("presetSource" in q && q.presetSource ? { presetSource: q.presetSource } : {}),
    }));
    setQuestions((prev) => [...prev, ...newQs]);
    toast.success(`"${preset.name}" preset added — ${newQs.length} question${newQs.length > 1 ? "s" : ""}`);
  };

  const handleAiAddQuestions = (newQs: Question[]) => {
    setQuestions((prev) => [...prev, ...newQs]);
    setAiPanelOpen(false);
    toast.success(`✨ ${newQs.length} question${newQs.length !== 1 ? "s" : ""} added from AI`);
  };

  const removeQuestion = (id: string) => {
    setQuestions((prev) => prev.filter((q) => q.id !== id));
    toast.info("Question removed");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 64px)", paddingTop: 64, flex: 1 }} className="home-root">
      <Topbar
        sessionName={sessionName}
        onNameChange={setSessionName}
        onNameSave={(name) => {
          setSavedName(name);
          localStorage.setItem("lunr_session_name", name);
          setSavedDraft(false); // name change marks dirty again
        }}
        sessionCode={sessionCode}
        isUntitled={!hasNamed}
        onLaunch={handleLaunch}
        onPreview={() => { setPreviewIndex(0); setPreviewOpen(true); }}
        hasQuestions={questions.length > 0}
        onBack={handleBack}
        onSaveDraft={handleSaveDraft}
        isDirty={isDirty}
        hasEverSaved={hasEverSaved}
      />

      <div style={{
        display: "flex",
        flex: 1,
        alignItems: "stretch",
        alignSelf: "stretch",
        background: "var(--background)",
      }}>
        <Sidebar
          onAddType={openAddType}
          onAddPreset={addPreset}
          onOpenMagic={() => setAiPanelOpen(true)}
          collapsed={sidebarCollapsed}
          onToggleCollapsed={() => {
            const next = !sidebarCollapsed;
            setSidebarCollapsed(next);
            try { localStorage.setItem("lunr_sidebar_collapsed", next.toString()); } catch { /* ignore */ }
          }}
        />

        {/* Canvas — shrinks when AI panel is open */}
        <main
          style={{
            flex: 1,
            padding: "28px 32px",
            display: "flex",
            flexDirection: "column",
            gap: 16,
            minWidth: 0,
            minHeight: "calc(100vh - 64px)",
            background: "transparent",
            borderLeft: "1px solid var(--border)",
            borderRight: "1px solid var(--border)",
          }}
        >
          {/* Onboarding */}
          {showOnboarding && (
            <OnboardingSteps
              hasQuestions={questions.length > 0}
              hasNamed={hasNamed}
              sessionCode={sessionCode}
              onDismiss={() => {
                setShowOnboarding(false);
                try { localStorage.setItem("lunr_onboarding_dismissed", "true"); } catch { /* ignore */ }
              }}
            />
          )}


          {/* Questions */}
          {questions.length > 0 ? (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={questions.map((q) => q.id)}
                strategy={verticalListSortingStrategy}
              >
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {questions.map((q, i) => (
                    <QuestionCard
                      key={q.id}
                      question={q}
                      index={i}
                      onRemove={() => removeQuestion(q.id)}
                      onUpdate={(text) => setQuestions((prev) => prev.map((item) => item.id === q.id ? { ...item, text } : item))}
                      onUpdateModelAnswer={(answer) => setQuestions((prev) => prev.map((item) => item.id === q.id ? { ...item, modelAnswer: answer || undefined } : item))}
                      onUpdateOptions={(options, correctIndex) => setQuestions((prev) => prev.map((item) => item.id === q.id ? { ...item, options, correctIndex } : item))}
                      onUpdateType={(_newType, update) => setQuestions((prev) => prev.map((item) => item.id === q.id ? { ...item, ...update } : item))}
                      onUpdateMedia={(mediaUrl) => setQuestions((prev) => prev.map((item) => item.id === q.id ? { ...item, mediaUrl } : item))}
                      iconNudge={contentXOffset}
                      totalCount={questions.length}
                      onReorder={(toIndex) => {
                        setQuestions((prev) => {
                          const arr = [...prev];
                          const [moved] = arr.splice(i, 1);
                          arr.splice(toIndex, 0, moved);
                          return arr;
                        });
                        setSavedDraft(false);
                      }}
                    />
                  ))}
                  {/* Add more row */}
              <button
                onClick={() => setTypePickerOpen(true)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "12px 18px",
                  borderRadius: 12,
                  border: "1.5px dashed oklch(0.82 0.01 264)",
                  background: "transparent",
                  color: "var(--muted-foreground)",
                  fontSize: 13,
                  fontWeight: 500,
                  fontFamily: "'Geist', system-ui, sans-serif",
                  transition: "all 0.15s",
                  marginTop: 4,
                }}
                className="hover:border-[oklch(0.55_0.2_250)] hover:text-[oklch(0.55_0.2_250)] hover:bg-[oklch(0.982_0.0107_271.3)] transition-all"
              >
                <PlusIcon size={15} />
                Add another question
              </button>
                </div>
              </SortableContext>
              <DragOverlay>
                {activeId ? (() => {
                  const q = questions.find((q) => q.id === activeId);
                  if (!q) return null;
                  const meta = TYPE_META[q.type];
                  return (
                    <div style={{
                      background: "var(--card)",
                      borderRadius: 14,
                      border: "1.5px solid oklch(0.55 0.2 250)",
                      padding: "16px 18px",
                      boxShadow: "0 12px 32px rgba(0,0,0,0.15)",
                      opacity: 0.95,
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 12,
                    }}>
                      <div style={{ color: "var(--muted-foreground)", marginTop: 3 }}>
                        <GripVertical size={16} />
                      </div>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", color: meta.color, flexShrink: 0, marginTop: 2 }}>
                        {meta.icon}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: meta.color, margin: "0 0 4px" }}>{q.type}</p>
                        <p style={{ fontSize: 14, fontWeight: 500, color: "var(--foreground)", margin: 0, lineHeight: 1.5 }}>{q.text}</p>
                      </div>
                    </div>
                  );
                })() : null}
              </DragOverlay>
            </DndContext>
          ) : (
            <EmptyState
              onMagic={() => setAiPanelOpen(true)}
              onManual={() => setTypePickerOpen(true)}
            />
          )}
        </main>

        {/* AI Panel — inline, resizes the canvas */}
        <AiPanel
          open={aiPanelOpen}
          onClose={() => setAiPanelOpen(false)}
          onOpen={() => setAiPanelOpen(true)}
          onAddQuestions={handleAiAddQuestions}
          existingQuestions={questions.map((q) => q.text)}
          aiPanelWidth={aiPanelWidth}
          isResizingPanel={isResizingPanel}
          setIsResizingPanel={setIsResizingPanel}
          minPanelWidth={minPanelWidth}
          maxPanelWidth={maxPanelWidth}
        />

      </div>

      {/* Question Type Picker Overlay */}
      {typePickerOpen && (
        <div
          onClick={() => setTypePickerOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.35)",
            zIndex: 50,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "var(--card)",
              borderRadius: 18,
              padding: "28px 28px 24px",
              width: 380,
              boxShadow: "0 8px 40px rgba(0,0,0,0.18)",
              fontFamily: "'Geist', system-ui, sans-serif",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "var(--foreground)" }}>Choose question type</p>
              <button
                onClick={() => setTypePickerOpen(false)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted-foreground)", display: "flex", alignItems: "center", padding: 4, borderRadius: 6 }}
                className="hover:bg-[oklch(0.96_0_0)] transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {(["Text", "Multiple Choice", "True / False", "Star Rating", "File Upload"] as QuestionType[]).map((type) => {
                const meta = TYPE_META[type];
                return (
                  <button
                    key={type}
                    onClick={() => {
                      setTypePickerOpen(false);
                      openAddType(type);
                    }}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "flex-start",
                      gap: 8,
                      padding: "16px 14px",
                      borderRadius: 12,
                      border: "1.5px solid var(--border)",
                      background: "var(--card)",
                      cursor: "pointer",
                      textAlign: "left",
                      transition: "all 0.15s",
                    }}
                    className="hover:border-[oklch(0.55_0.2_250)] hover:bg-[oklch(0.982_0.0107_271.3)] hover:shadow-sm transition-all"
                  >
                    <span
                      style={{
                        display: "flex",
                        alignItems: "center",
                        color: meta.color,
                        alignSelf: "flex-start",
                      }}
                    >
                      {meta.icon}
                    </span>
                    <div>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "var(--foreground)", fontFamily: "'Geist', system-ui, sans-serif" }}>{type}</p>
                      <p style={{ margin: "2px 0 0", fontSize: 11.5, color: "var(--muted-foreground)", fontFamily: "'Geist', system-ui, sans-serif" }}>{meta.desc}</p>
                    </div>
                  </button>
                );
              })}
              {/* Generate with AI tile */}
              <button
                onClick={() => { setTypePickerOpen(false); setAiPanelOpen(true); }}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-start",
                  gap: 8,
                  padding: "16px 14px",
                  borderRadius: 12,
                  border: "1.5px solid oklch(0.88 0.06 290)",
                  background: "linear-gradient(135deg, oklch(0.97 0.03 290) 0%, oklch(0.98 0.02 10) 100%)",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "all 0.15s",
                }}
                className="hover:border-[oklch(0.7_0.18_290)] hover:shadow-sm transition-all"
              >
                <span
                  style={{
                    display: "flex",
                    alignItems: "center",
                    color: "oklch(0.52 0.22 290)",
                    alignSelf: "flex-start",
                  }}
                >
                  <Sparkles size={18} />
                </span>
                <div>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "oklch(0.38 0.18 290)", fontFamily: "'Geist', system-ui, sans-serif" }}>Generate with AI</p>
                  <p style={{ margin: "2px 0 0", fontSize: 11.5, color: "oklch(0.52 0.14 290)", fontFamily: "'Geist', system-ui, sans-serif" }}>AI drafts questions for you</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewOpen && questions.length > 0 && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.55)",
            zIndex: 500,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px 16px",
          }}
          onClick={() => setPreviewOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "var(--card)",
              borderRadius: 20,
              width: "100%",
              maxWidth: 560,
              boxShadow: "0 16px 60px rgba(0,0,0,0.22)",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              maxHeight: "90vh",
              fontFamily: "'Geist', system-ui, sans-serif",
            }}
          >
            {/* Preview header */}
            <div style={{
              padding: "16px 20px",
              borderBottom: "1px solid var(--border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              background: "var(--card)",
              flexShrink: 0,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Eye size={15} style={{ color: "var(--primary)" }} />
                <span style={{ fontWeight: 700, fontSize: 14, color: "var(--foreground)" }}>
                  Student Preview
                </span>
                <span style={{ fontSize: 12, color: "var(--muted-foreground)", marginLeft: 4 }}>
                  Question {previewIndex + 1} of {questions.length}
                </span>
              </div>
              <button
                onClick={() => setPreviewOpen(false)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted-foreground)", display: "flex", alignItems: "center", padding: 4, borderRadius: 6 }}
                className="hover:bg-[oklch(0.96_0_0)] transition-colors"
              >
                <X size={15} />
              </button>
            </div>

            {/* Progress bar */}
            <div style={{ height: 3, background: "var(--muted)", flexShrink: 0 }}>
              <div style={{
                height: "100%",
                width: `${((previewIndex + 1) / questions.length) * 100}%`,
                background: "oklch(0.45 0.22 264)",
                transition: "width 0.3s ease",
                borderRadius: "0 2px 2px 0",
              }} />
            </div>

            {/* Question display */}
            <div style={{ flex: 1, overflowY: "auto", padding: "32px 28px 24px" }}>
              {(() => {
                const q = questions[previewIndex];
                const meta = TYPE_META[q.type];
                return (
                  <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                    {/* Type badge */}
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{
                        display: "inline-flex", alignItems: "center", gap: 5,
                        fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em",
                        color: meta.color, background: meta.color + "14",
                        padding: "3px 10px", borderRadius: 20,
                      }}>
                        {meta.icon} {q.type}
                      </span>
                    </div>

                    {/* Question text */}
                    <p style={{ fontSize: 20, fontWeight: 700, color: "var(--foreground)", lineHeight: 1.4, margin: 0 }}>
                      {q.text}
                    </p>

                    {/* Response area by type */}
                    {q.type === "Text" && (
                      <textarea
                        placeholder="Type your answer here…"
                        rows={4}
                        disabled
                        style={{
                          width: "100%", borderRadius: 12, border: "1.5px solid var(--border)",
                          padding: "12px 14px", fontSize: 14, resize: "none",
                          background: "var(--card)", color: "var(--muted-foreground)",
                          fontFamily: "'Geist', system-ui, sans-serif",
                        }}
                      />
                    )}
                    {q.type === "Multiple Choice" && q.options && (
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {q.options.map((opt, i) => (
                          <div key={i} style={{
                            display: "flex", alignItems: "center", gap: 12,
                            padding: "12px 16px", borderRadius: 12,
                            border: "1.5px solid var(--border)",
                            background: "var(--card)", cursor: "default",
                          }}>
                            <span style={{
                              width: 26, height: 26, borderRadius: "50%",
                              border: "1.5px solid var(--border)",
                              display: "flex", alignItems: "center", justifyContent: "center",
                              fontSize: 11, fontWeight: 700, color: "var(--muted-foreground)",
                              fontFamily: "'Geist Mono', monospace", flexShrink: 0,
                            }}>
                              {String.fromCharCode(65 + i)}
                            </span>
                            <span style={{ fontSize: 14, color: "var(--foreground)" }}>{opt}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {q.type === "True / False" && (
                      <div style={{ display: "flex", gap: 12 }}>
                        {["True", "False"].map((label) => (
                          <div key={label} style={{
                            flex: 1, padding: "14px 0", borderRadius: 12,
                            border: "1.5px solid var(--border)",
                            background: "var(--card)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: 15, fontWeight: 600, color: "var(--foreground)",
                            cursor: "default",
                          }}>
                            {label}
                          </div>
                        ))}
                      </div>
                    )}
                    {q.type === "Star Rating" && (
                      <div style={{ display: "flex", gap: 10, justifyContent: "center", padding: "8px 0" }}>
                        {[1,2,3,4,5].map((n) => (
                          <Star key={n} size={36} style={{ color: "oklch(0.82 0.12 60)", cursor: "default" }} />
                        ))}
                      </div>
                    )}
                    {q.type === "File Upload" && (
                      <div style={{
                        border: "2px dashed var(--border)", borderRadius: 12,
                        padding: "28px 20px", textAlign: "center",
                        background: "var(--card)",
                      }}>
                        <Paperclip size={22} style={{ color: "var(--muted-foreground)", margin: "0 auto 8px" }} />
                        <p style={{ fontSize: 14, color: "var(--muted-foreground)", margin: 0 }}>Click to upload a file</p>
                      </div>
                    )}

                    {/* Preview-only notice */}
                    <p style={{ fontSize: 11.5, color: "var(--muted-foreground)", textAlign: "center", margin: 0 }}>
                      This is a read-only preview — students will interact with this live.
                    </p>
                  </div>
                );
              })()}
            </div>

            {/* Navigation footer */}
            <div style={{
              padding: "14px 20px",
              borderTop: "1px solid var(--border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexShrink: 0,
              background: "var(--card)",
            }}>
              <button
                onClick={() => setPreviewIndex((i) => Math.max(0, i - 1))}
                disabled={previewIndex === 0}
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "8px 16px", borderRadius: 9,
                  border: "1.5px solid var(--border)",
                  background: "var(--card)", fontSize: 13, fontWeight: 500,
                  color: previewIndex === 0 ? "oklch(0.75 0 0)" : "oklch(0.205 0 0)",
                  cursor: previewIndex === 0 ? "not-allowed" : "pointer",
                  fontFamily: "'Geist', system-ui, sans-serif",
                }}
              >
                <ChevronLeft size={14} /> Previous
              </button>
              <span style={{ fontSize: 12, color: "var(--muted-foreground)" }}>
                {previewIndex + 1} / {questions.length}
              </span>
              {previewIndex < questions.length - 1 ? (
                <button
                  onClick={() => setPreviewIndex((i) => i + 1)}
                  style={{
                    display: "flex", alignItems: "center", gap: 6,
                    padding: "8px 16px", borderRadius: 9,
                    border: "none",
                    background: "var(--primary)",
                    color: "#fff", fontSize: 13, fontWeight: 600,
                    cursor: "pointer",
                    fontFamily: "'Geist', system-ui, sans-serif",
                  }}
                >
                  Next <ChevronRightIcon size={14} />
                </button>
              ) : (
                <button
                  onClick={() => setPreviewOpen(false)}
                  style={{
                    display: "flex", alignItems: "center", gap: 6,
                    padding: "8px 16px", borderRadius: 9,
                    border: "none",
                    background: "var(--primary)",
                    color: "#fff", fontSize: 13, fontWeight: 600,
                    cursor: "pointer",
                    fontFamily: "'Geist', system-ui, sans-serif",
                  }}
                >
                  Done
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <AddQuestionModal
        open={addModalOpen}
        type={addModalType}
        onClose={() => setAddModalOpen(false)}
        onConfirm={confirmAdd}
      />
      {/* AI panel is rendered inline, not as a modal */}

      {/* Unsaved Changes Dialog */}
      <AlertDialog open={leaveDialogOpen} onOpenChange={setLeaveDialogOpen}>
        <AlertDialogContent style={{ borderRadius: 16, maxWidth: 420 }}>
          <AlertDialogHeader>
            <AlertDialogTitle style={{ fontFamily: "'Geist', system-ui, sans-serif", fontSize: 17 }}>
              Leave without saving?
            </AlertDialogTitle>
            <AlertDialogDescription style={{ fontFamily: "'Geist', system-ui, sans-serif", fontSize: 14 }}>
              You have unsaved changes. Save as a draft to keep your work, or leave and lose your progress.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter style={{ gap: 8, flexDirection: "column", alignItems: "stretch" }}>
            <AlertDialogCancel style={{ fontFamily: "'Geist', system-ui, sans-serif" }}>
              Keep editing
            </AlertDialogCancel>
            <Button
              variant="outline"
              onClick={() => {
                handleSaveDraft();
                setLeaveDialogOpen(false);
                if (pendingNav) navigate(pendingNav);
              }}
              style={{ fontFamily: "'Geist', system-ui, sans-serif", fontWeight: 600 }}
            >
              Save draft &amp; leave
            </Button>
            <AlertDialogAction
              onClick={() => {
                setLeaveDialogOpen(false);
                if (pendingNav) navigate(pendingNav);
              }}
              style={{
                background: "oklch(0.577 0.245 27.325)",
                fontFamily: "'Geist', system-ui, sans-serif",
                fontWeight: 600,
              }}
            >
              Leave anyway
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
