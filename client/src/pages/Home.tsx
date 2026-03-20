/* ── Design: Structured Clarity / Swiss Information Design ──
   DM Sans headings, Inter body. Indigo primary, Crimson for Launch only.
   Fixed sidebar (280px) + fluid document canvas.
   Step tracker onboarding, 2×2 question type grid, AI banner hero.
*/

import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import {
  Rocket, Sparkles, Type, ListChecks, Paperclip, Star,
  RotateCcw, GripVertical, X, ChevronRight, CheckCircle2,
  Circle, Pencil, ArrowLeft, ToggleLeft, Upload, FileText,
  Loader2, Plus as PlusIcon, Trash2 as TrashIcon,
} from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Link as LinkIcon } from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────
type QuestionType = "Short Text" | "Multiple Choice" | "File Upload" | "Star Rating" | "True / False";

interface Question {
  id: string;
  type: QuestionType;
  icon: React.ReactNode;
  text: string;
  color: string;
  options?: string[]; // Multiple Choice answer options
  correctIndex?: number; // Index of the correct answer for Multiple Choice
  tfAnswer?: "True" | "False"; // Correct answer for True / False questions
}

const TYPE_META: Record<QuestionType, { icon: React.ReactNode; color: string; desc: string }> = {
  "Short Text":      { icon: <Type size={18} />,        color: "oklch(0.48 0.18 264)", desc: "Open-ended written response" },
  "Multiple Choice": { icon: <ListChecks size={18} />,  color: "oklch(0.52 0.22 290)", desc: "Select from options" },
  "File Upload":     { icon: <Paperclip size={18} />,   color: "oklch(0.52 0.18 160)", desc: "Students submit a file" },
  "Star Rating":     { icon: <Star size={18} />,        color: "oklch(0.62 0.18 60)",  desc: "1–5 star rating scale" },
  "True / False":    { icon: <ToggleLeft size={18} />,  color: "oklch(0.42 0.14 60)",  desc: "True or false answer" },
};

const PRESETS = [
  {
    name: "Start, Stop, Continue",
    icon: <RotateCcw size={15} />,
    count: 3,
    questions: [
      { type: "Short Text" as QuestionType, text: "What should we START doing in this class?" },
      { type: "Short Text" as QuestionType, text: "What should we STOP doing in this class?" },
      { type: "Short Text" as QuestionType, text: "What should we CONTINUE doing in this class?" },
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
      { type: "Multiple Choice" as QuestionType, text: "Which topic would you like to explore further?" },
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
  hasQuestions,
  onBack,
  onSaveDraft,
  isDirty,
}: {
  sessionName: string;
  onNameChange: (v: string) => void;
  onNameSave: (name: string) => void;
  sessionCode: string;
  isUntitled: boolean;
  onLaunch: () => void;
  hasQuestions: boolean;
  onBack: () => void;
  onSaveDraft: () => void;
  isDirty: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.select();
  }, [editing]);

  const commitName = () => {
    setEditing(false);
    onNameSave(sessionName);
  };

  return (
    <header
      style={{
        background: "#fff",
        borderBottom: "1px solid oklch(0.922 0 0)",
        height: 64,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 28px",
        position: "sticky",
        top: 0,
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
            background: "none", border: "1.5px solid oklch(0.922 0 0)",
            color: "oklch(0.45 0 0)", cursor: "pointer", flexShrink: 0,
            transition: "all 0.15s",
          }}
          className="hover:bg-[oklch(0.982_0.0107_271.3)] hover:border-[oklch(0.88_0.04_264)] hover:text-[oklch(0.45_0.22_264)] transition-all"
        >
          <ArrowLeft size={16} />
        </button>
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {editing ? (
          <input
            ref={inputRef}
            value={sessionName}
            onChange={(e) => onNameChange(e.target.value)}
            onBlur={commitName}
            onKeyDown={(e) => e.key === "Enter" && commitName()}
            style={{
              fontFamily: "'Geist', system-ui, sans-serif",
              fontWeight: 700,
              fontSize: 17,
              color: "oklch(0.145 0 0)",
              border: "1.5px solid oklch(0.45 0.22 264)",
              borderRadius: 8,
              padding: "2px 8px",
              outline: "none",
              background: "oklch(0.97 0.02 264)",
              minWidth: 180,
            }}
          />
        ) : (
          <button
            onClick={() => setEditing(true)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontFamily: "'Geist', system-ui, sans-serif",
              fontWeight: 700,
              fontSize: 17,
              color: isUntitled ? "oklch(0.65 0.01 264)" : "oklch(0.145 0 0)",
              background: "none",
              border: "none",
              padding: "2px 4px",
              borderRadius: 6,
              cursor: "text",
            }}
            className="group hover:bg-[oklch(0.982_0.0107_271.3)] transition-colors"
          >
            {sessionName}
            <Pencil
              size={13}
              style={{ color: "oklch(0.556 0 0)", opacity: 0 }}
              className="group-hover:opacity-100 transition-opacity"
            />
          </button>
        )}
        <span
          style={{
            fontSize: 12,
            color: "oklch(0.556 0 0)",
            paddingLeft: 4,
            letterSpacing: "0.03em", marginTop: '-4px',
          }}
        >
          Code:{" "}
          <span
            style={{
              fontWeight: 700,
              color: "oklch(0.45 0.22 264)",
              letterSpacing: "0.1em",
              fontFamily: "'Geist Mono', monospace",
            }}
          >
            {sessionCode}
          </span>
        </span>
      </div>
      </div>

      {/* Right: actions */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <button
          onClick={onSaveDraft}
          style={{
            padding: "8px 18px",
            borderRadius: 10,
            border: isDirty ? "1.5px solid oklch(0.88 0.04 264)" : "1.5px solid oklch(0.922 0 0)",
            background: isDirty ? "oklch(0.96 0.04 264)" : "#fff",
            color: isDirty ? "oklch(0.45 0.22 264)" : "oklch(0.6 0 0)",
            fontSize: 13,
            fontWeight: isDirty ? 600 : 500,
            fontFamily: "'Geist', system-ui, sans-serif",
            transition: "all 0.15s",
            cursor: "pointer",
          }}
          className="hover:border-[oklch(0.55_0.2_250)] hover:bg-[oklch(0.982_0.0107_271.3)] hover:text-[oklch(0.55_0.2_250)] transition-all"
        >
          {isDirty ? "Save Draft" : "Saved"}
        </button>
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
              ? "linear-gradient(135deg, oklch(0.514 0.2 13.9) 0%, oklch(0.44 0.2 13.9) 100%)"
              : "oklch(0.88 0 0)",
            color: hasQuestions ? "#fff" : "oklch(0.6 0 0)",
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
}: {
  onAddType: (t: QuestionType) => void;
  onAddPreset: (p: typeof PRESETS[0]) => void;
  onOpenMagic: () => void;
}) {
  return (
    <aside
      style={{
        width: 280,
        minWidth: 280,
        background: "#fff",
        borderRight: "1px solid oklch(0.922 0 0)",
        display: "flex",
        flexDirection: "column",
        overflowY: "auto",
        height: "100%",
      }}
    >
      {/* AI Banner */}
      <div
        style={{
          margin: "16px 14px 0",
          background: "linear-gradient(135deg, oklch(0.96 0.04 290) 0%, oklch(0.97 0.03 10) 100%)",
          border: "1.5px solid oklch(0.88 0.06 290)",
          borderRadius: 14,
          padding: "16px 16px 14px",
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Sparkles size={18} style={{ color: "oklch(0.52 0.22 290)" }} />
          <span
            style={{
              fontFamily: "'Geist', system-ui, sans-serif",
              fontWeight: 700,
              fontSize: 14,
              color: "oklch(0.38 0.18 290)",
            }}
          >
            Generate with AI
          </span>
        </div>
        <p
          style={{
            fontSize: 12,
            color: "oklch(0.48 0.14 290)",
            lineHeight: 1.55,
            margin: 0,
          }}
        >
          Paste your lecture notes or topic — AI will draft questions instantly.
        </p>
        <button
          onClick={onOpenMagic}
          style={{
            marginTop: 4,
            padding: "9px 14px",
            borderRadius: 9,
            border: "none",
            background: "linear-gradient(135deg, oklch(0.52 0.22 290) 0%, oklch(0.60 0.2 290) 100%)",
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
        <p
          style={{
            fontSize: 10.5,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.09em",
            color: "oklch(0.556 0 0)",
            marginBottom: 10,
          }}
        >
          Add a Question
        </p>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 8,
          }}
        >
          {(Object.keys(TYPE_META) as QuestionType[]).map((type) => {
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
                  border: "1.5px solid oklch(0.922 0 0)",
                  background: "oklch(0.985 0 0)",
                  fontSize: 12,
                  fontWeight: 500,
                  fontFamily: "'Geist', system-ui, sans-serif",
                  color: "oklch(0.205 0 0)",
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
        <p
          style={{
            fontSize: 10.5,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.09em",
            color: "oklch(0.556 0 0)",
            marginBottom: 10,
          }}
        >
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
                border: "1.5px solid oklch(0.922 0 0)",
                background: "oklch(0.985 0 0)",
                fontSize: 13,
                fontWeight: 500,
                fontFamily: "'Geist', system-ui, sans-serif",
                color: "oklch(0.205 0 0)",
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
          <strong style={{ color: "oklch(0.45 0.22 264)", letterSpacing: "0.08em", fontFamily: "'Geist Mono', monospace" }}>{sessionCode}</strong>.
        </>
      ),
      done: false,
      active: hasNamed && hasQuestions,
    },
  ];

  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 16,
        border: "1px solid oklch(0.922 0 0)",
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
                    : "oklch(0.91 0.005 264)",
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
                  ? { background: "oklch(0.92 0.1 160)", color: "oklch(0.38 0.18 160)" }
                  : step.active
                  ? {
                      background: "oklch(0.55 0.2 250)",
                      color: "#fff",
                      boxShadow: "0 0 0 3px oklch(0.55 0.2 250 / 0.22)",
                      animation: "step-ring-pulse 1.8s ease-in-out infinite",
                    }
                  : { background: "oklch(0.96 0.01 250)", color: "oklch(0.56 0.08 250)" }),
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
                  color: step.active || step.done ? "oklch(0.145 0 0)" : "oklch(0.556 0 0)",
                  margin: 0,
                  transition: "color 0.25s",
                }}
              >
                {step.label}
              </p>
              <p
                style={{
                  fontSize: 12,
                  color: "oklch(0.556 0 0)",
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
          color: "oklch(0.556 0 0)",
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
        background: "#fff",
        borderRadius: 16,
        border: "2px dashed oklch(0.88 0 0)",
        minHeight: 260,
        padding: 40,
        textAlign: "center",
        gap: 12,
        transition: "border-color 0.2s, background 0.2s",
      }}
      className="hover:border-[oklch(0.55_0.2_250)] hover:bg-[oklch(0.982_0.0107_271.3)] transition-all"
    >
      <div style={{ fontSize: 38, opacity: 0.25, lineHeight: 1 }}>🗂️</div>
      <p
        style={{
          fontFamily: "'Geist', system-ui, sans-serif",
          fontWeight: 700,
          fontSize: 16,
          color: "oklch(0.205 0 0)",
          margin: 0,
        }}
      >
        No questions yet
      </p>
      <p
        style={{
          fontSize: 13,
          color: "oklch(0.556 0 0)",
          maxWidth: 300,
          lineHeight: 1.6,
          margin: 0,
        }}
      >
        Add a question from the sidebar, use a preset, or generate questions automatically with AI.
      </p>
      <div style={{ display: "flex", gap: 10, marginTop: 4, flexWrap: "wrap", justifyContent: "center" }}>
        <button
          onClick={onMagic}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "9px 20px",
            borderRadius: 10,
            border: "none",
            background: "linear-gradient(135deg, oklch(0.52 0.22 290) 0%, oklch(0.60 0.2 290) 100%)",
            color: "#fff",
            fontSize: 13,
            fontWeight: 700,
            fontFamily: "'Geist', system-ui, sans-serif",
            boxShadow: "0 2px 8px oklch(0.52 0.22 290 / 0.25)",
          }}
          className="hover:opacity-90 transition-opacity"
        >
          <Sparkles size={14} />
          Generate with AI
        </button>
        <button
          onClick={onManual}
          style={{
            padding: "9px 20px",
            borderRadius: 10,
            border: "1.5px solid oklch(0.922 0 0)",
            background: "#fff",
            color: "oklch(0.205 0 0)",
            fontSize: 13,
            fontWeight: 500,
            fontFamily: "'Geist', system-ui, sans-serif",
          }}
          className="hover:border-[oklch(0.55_0.2_250)] hover:text-[oklch(0.55_0.2_250)] transition-all"
        >
          + Add Manually
        </button>
      </div>
    </div>
  );
}

// ── Question Card ───────────────────────────────────────────────────────────
function QuestionCard({
  question,
  index,
  onRemove,
  onUpdate,
  iconNudge = 1,
}: {
  question: Question;
  index: number;
  onRemove: () => void;
  onUpdate: (text: string) => void;
  iconNudge?: number;
}) {
  const meta = TYPE_META[question.type];
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(question.text);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const startEdit = () => {
    setDraft(question.text);
    setEditing(true);
    setTimeout(() => {
      textareaRef.current?.focus();
      textareaRef.current?.select();
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
      className="card-enter hover:shadow-md transition-all"
      style={{
        background: "#fff",
        borderRadius: 14,
        border: "1.5px solid oklch(0.922 0 0)",
        padding: "16px 18px",
        display: "flex",
        alignItems: "flex-start",
        gap: 12,
        boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
        transition: "box-shadow 0.15s, border-color 0.15s",
      }}
    >
      {/* Drag handle */}
      <div
        style={{
          color: "oklch(0.82 0.005 264)",
          marginTop: 3,
          cursor: "grab",
          flexShrink: 0,
          alignSelf: "flex-start",
        }}
        title="Drag to reorder"
      >
        <GripVertical size={16} />
      </div>

      {/* Type icon */}
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: 7,
          background: `${meta.color}18`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          color: meta.color,
          marginTop: iconNudge,
          alignSelf: "flex-start",
        }}
      >
        {meta.icon}
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            fontSize: 10.5,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            color: meta.color,
            margin: "0 0 4px",
            fontFamily: "'Geist', system-ui, sans-serif",
          }}
        >
          {question.type}
        </p>
        {editing ? (
          <textarea
            ref={textareaRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commitEdit}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); commitEdit(); }
              if (e.key === "Escape") { setDraft(question.text); setEditing(false); }
            }}
            rows={2}
            style={{
              width: "100%",
              fontSize: 14,
              fontWeight: 500,
              color: "oklch(0.145 0 0)",
              lineHeight: 1.5,
              fontFamily: "'Geist', system-ui, sans-serif",
              border: "1.5px solid oklch(0.45 0.22 264)",
              borderRadius: 8,
              padding: "6px 8px",
              resize: "none",
              outline: "none",
              background: "oklch(0.97 0.02 264 / 0.4)",
              boxShadow: "0 0 0 3px oklch(0.45 0.22 264 / 0.12)",
            }}
          />
        ) : (
          <p
            onClick={startEdit}
            title="Click to edit"
            style={{
              fontSize: 14,
              fontWeight: 500,
              color: "oklch(0.145 0 0)",
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
        {/* True / False answer display */}
        {question.type === "True / False" && (
          <div style={{ marginTop: 8, display: "flex", gap: 6 }}>
            {["True", "False"].map((label) => (
              <span
                key={label}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                  fontSize: 11.5,
                  padding: "3px 10px",
                  borderRadius: 20,
                  background: label === "True" ? "oklch(0.92 0.08 160)" : "oklch(0.96 0.04 10)",
                  color: label === "True" ? "oklch(0.38 0.14 160)" : "oklch(0.42 0.14 10)",
                  fontWeight: 600,
                  fontFamily: "'Geist', system-ui, sans-serif",
                  border: label === "True" ? "1px solid oklch(0.82 0.1 160)" : "1px solid oklch(0.88 0.08 10)",
                }}
              >
                {label}
              </span>
            ))}
          </div>
        )}
        {/* Multiple Choice options preview */}
        {question.type === "Multiple Choice" && question.options && question.options.length > 0 && (
          <div style={{ marginTop: 8, display: "flex", flexWrap: "wrap", gap: 5 }}>
            {question.options.map((opt, i) => {
              const isCorrect = question.correctIndex === i;
              return (
                <span
                  key={i}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 5,
                    fontSize: 11.5,
                    padding: "3px 9px",
                    borderRadius: 20,
                    background: isCorrect ? "oklch(0.92 0.08 160)" : "oklch(0.96 0.04 290)",
                    color: isCorrect ? "oklch(0.38 0.14 160)" : "oklch(0.38 0.18 290)",
                    fontWeight: 500,
                    fontFamily: "'Geist', system-ui, sans-serif",
                    border: isCorrect ? "1px solid oklch(0.82 0.1 160)" : "1px solid oklch(0.88 0.04 290)",
                  }}
                >
                  {isCorrect
                    ? <CheckCircle2 size={11} />
                    : <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: 10, fontWeight: 700 }}>{String.fromCharCode(65 + i)}</span>
                  }
                  {opt}
                </span>
              );
            })}
          </div>
        )}
        <div style={{ marginTop: 8 }}>
          <span
            style={{
              fontSize: 11,
              padding: "3px 9px",
              borderRadius: 20,
              background: "oklch(0.97 0 0)",
              color: "oklch(0.556 0 0)",
              fontWeight: 500,
              fontFamily: "'Geist', system-ui, sans-serif",
            }}
          >
            Q{index + 1}
          </span>
        </div>
      </div>

      {/* Remove */}
      <button
        onClick={onRemove}
        title="Remove question"
        style={{
          background: "none",
          border: "none",
          color: "oklch(0.75 0.01 264)",
          borderRadius: 7,
          padding: "4px 5px",
          display: "flex",
          alignItems: "center",
          transition: "background 0.15s, color 0.15s",
          flexShrink: 0,
        }}
        className="hover:bg-[oklch(0.95_0.01_264)] hover:text-[oklch(0.52_0.22_10)] transition-all"
      >
        <X size={15} />
      </button>
    </div>
  );
}

// ── Add Question Modal ──────────────────────────────────────────────────────
const SUGGESTIONS: Record<QuestionType, string[]> = {
  "Short Text": [
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
  onConfirm: (text: string, options?: string[], correctIndex?: number, tfAnswer?: "True" | "False") => void;
}) {
  const [text, setText] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [options, setOptions] = useState<string[]>(["", ""]);
  const [correctIndex, setCorrectIndex] = useState<number | null>(null);
  const meta = type ? TYPE_META[type] : null;
  const suggestions = type ? SUGGESTIONS[type] : [];
  const isMultipleChoice = type === "Multiple Choice";
  const isTrueFalse = type === "True / False";
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
              color: "oklch(0.205 0 0)",
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
              background: "oklch(0.96 0.04 250)",
              border: "1px solid oklch(0.88 0.04 250)",
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
              border: "1px solid oklch(0.922 0 0)",
              borderRadius: 10,
              overflow: "hidden",
              background: "oklch(0.982 0.0107 271.3)",
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
                    color: "oklch(0.25 0 0)",
                    background: "transparent",
                    border: "none",
                    borderBottom: i < suggestions.length - 1 ? "1px solid oklch(0.922 0 0)" : "none",
                    cursor: "pointer",
                    lineHeight: 1.45,
                    transition: "background 0.1s",
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#fff"; }}
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
              <Label style={{ fontSize: 13, fontWeight: 600, color: "oklch(0.205 0 0)", fontFamily: "'Geist', system-ui, sans-serif", display: "block", marginBottom: 8 }}>
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
                        ? "2px solid oklch(0.52 0.18 160)"
                        : "1.5px solid oklch(0.88 0 0)",
                      background: tfAnswer === label
                        ? "oklch(0.92 0.08 160)"
                        : "oklch(0.985 0 0)",
                      color: tfAnswer === label
                        ? "oklch(0.38 0.14 160)"
                        : "oklch(0.45 0 0)",
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

          {/* Multiple Choice options editor */}
          {isMultipleChoice && (
            <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 6 }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 5 }}>
                <Label style={{ fontSize: 13, fontWeight: 600, color: "oklch(0.205 0 0)", fontFamily: "'Geist', system-ui, sans-serif" }}>Answer options</Label>
                <span style={{ fontSize: 11, fontWeight: 400, color: "oklch(0.556 0 0)", fontFamily: "'Geist', system-ui, sans-serif" }}>(min. 2)</span>
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
                      border: correctIndex === i ? "2px solid oklch(0.52 0.18 160)" : "1.5px solid oklch(0.88 0 0)",
                      background: correctIndex === i ? "oklch(0.92 0.08 160)" : "transparent",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      flexShrink: 0, fontSize: 10, fontWeight: 700,
                      color: correctIndex === i ? "oklch(0.38 0.14 160)" : "oklch(0.556 0 0)",
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
                      border: "1.5px solid oklch(0.922 0 0)",
                      fontSize: 13,
                      fontFamily: "'Geist', system-ui, sans-serif",
                      color: "oklch(0.205 0 0)",
                      background: "#fff",
                      outline: "none",
                      transition: "border-color 0.15s, box-shadow 0.15s",
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = "oklch(0.52 0.22 290)";
                      e.currentTarget.style.boxShadow = "0 0 0 3px oklch(0.52 0.22 290 / 0.12)";
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = "oklch(0.922 0 0)";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  />
                  {options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => removeOption(i)}
                      style={{
                        background: "none", border: "none", cursor: "pointer",
                        color: "oklch(0.75 0.01 264)", display: "flex",
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
                  background: "oklch(0.96 0.04 290)",
                  border: "1px solid oklch(0.88 0.04 290)",
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
            ) }
            disabled={!canSubmit}
            style={{
              background: "oklch(0.45 0.22 264)",
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
  modelAnswer?: string;    // Short Text model answer
};

function AiPanel({
  open,
  onClose,
  onOpen,
  onAddQuestions,
}: {
  open: boolean;
  onClose: () => void;
  onOpen: () => void;
  onAddQuestions: (qs: Question[]) => void;
}) {
  const [content, setContent] = useState("");
  const [selectedTypes, setSelectedTypes] = useState<Set<QuestionType>>(new Set(["Short Text", "Multiple Choice", "True / False"] as QuestionType[]));
  const [count, setCount] = useState(3);
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState<AiGenQuestion[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [urlChips, setUrlChips] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const contentTextareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollBodyRef = useRef<HTMLDivElement>(null);

  const handleAddUrl = () => {
    const trimmed = urlInput.trim();
    if (!trimmed) return;
    let url = trimmed;
    if (!/^https?:\/\//i.test(url)) url = "https://" + url;
    if (!urlChips.includes(url)) setUrlChips((prev) => [...prev, url]);
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

  useEffect(() => {
    if (!open) {
      setContent("");
      setGenerated([]);
      setLoading(false);
      setUrlChips([]);
      setUrlInput("");
    }
  }, [open]);

  const toggleType = (t: QuestionType) => {
    setSelectedTypes((prev) => {
      const next = new Set(prev);
      if (next.has(t)) { if (next.size > 1) next.delete(t); }
      else next.add(t);
      return next;
    });
  };

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setContent((prev) => prev + (prev ? "\n\n" : "") + (e.target?.result as string));
      scrollTextareaToBottom();
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const generate = async () => {
    if ((!content.trim() && urlChips.length === 0) || loading) return;
    setLoading(true);
    setGenerated([]);

    const typeList = Array.from(selectedTypes);

    try {
      const res = await fetch("/api/generate-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: content.slice(0, 8000),
          count,
          types: typeList,
          urls: urlChips.length > 0 ? urlChips : undefined,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error || `Server error ${res.status}`);
      }

      const data = await res.json() as { questions: Array<{ type: string; text: string; options?: string[]; correctAnswer?: string; modelAnswer?: string }> };

      const pool: AiGenQuestion[] = data.questions
        .filter((q) => q.text && q.type)
        .map((q) => ({
          type: q.type as QuestionType,
          text: q.text,
          selected: true,
          options: q.options,
          correctAnswer: q.correctAnswer,
          modelAnswer: q.modelAnswer,
        }));

      if (pool.length === 0) throw new Error("No questions returned");
      setGenerated(pool);
    } catch (err) {
      console.error("AI generation error:", err);
      toast.error("Generation failed — check your content and try again.");
    } finally {
      setLoading(false);
    }
  };

  const toggleSelect = (i: number) =>
    setGenerated((prev) => prev.map((q, idx) => idx === i ? { ...q, selected: !q.selected } : q));

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
          base.options = q.options;
          if (q.correctAnswer) {
            const idx = q.options.findIndex((o) => o === q.correctAnswer);
            if (idx !== -1) base.correctIndex = idx;
          }
        }
        // Carry over True / False correct answer
        if (q.type === "True / False" && (q.correctAnswer === "True" || q.correctAnswer === "False")) {
          base.tfAnswer = q.correctAnswer as "True" | "False";
        }
        return base;
      });
    onAddQuestions(toAdd);
  };

  const selectedCount = generated.filter((q) => q.selected).length;

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          onClick={onClose}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.25)",
            zIndex: 200,
            backdropFilter: "blur(2px)",
            WebkitBackdropFilter: "blur(2px)",
          }}
        />
      )}

      {/* Drawer panel */}
      <div
        style={{
          position: "fixed",
          top: 0,
          right: open ? 0 : -360,
          width: 360,
          height: "100dvh",
          background: "#fff",
          boxShadow: open ? "-4px 0 32px rgba(0,0,0,0.14)" : "none",
          zIndex: 201,
          display: "flex",
          flexDirection: "column",
          transition: "right 0.3s cubic-bezier(0.4,0,0.2,1), box-shadow 0.3s ease",
          borderLeft: "1px solid oklch(0.922 0 0)",
        }}
      >
        {/* Tab handle — top-right, always visible, toggles drawer */}
        <button
          onClick={open ? onClose : onOpen}
          style={{
            position: "absolute",
            left: -44,
            top: 80,
            width: 44,
            height: 36,
            background: open ? "oklch(0.96 0.04 290)" : "#fff",
            border: "1px solid oklch(0.922 0 0)",
            borderRight: "none",
            borderRadius: "10px 0 0 10px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 5,
            cursor: "pointer",
            boxShadow: "-2px 2px 8px rgba(0,0,0,0.07)",
            transition: "background 0.15s",
          }}
          title={open ? "Close AI panel" : "Generate with AI"}
        >
          <Sparkles size={13} style={{ color: "oklch(0.52 0.22 290)", flexShrink: 0 }} />
        </button>

        <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
          {/* Header */}
          <div style={{
            padding: "16px 18px 14px",
            borderBottom: "1px solid oklch(0.922 0 0)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "linear-gradient(135deg, oklch(0.97 0.03 290) 0%, oklch(0.98 0.02 10) 100%)",
            flexShrink: 0,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Sparkles size={16} style={{ color: "oklch(0.52 0.22 290)" }} />
              <span style={{ fontFamily: "'Geist', system-ui, sans-serif", fontWeight: 700, fontSize: 14, color: "oklch(0.38 0.18 290)" }}>
                Generate with AI
              </span>
            </div>
            <button
              onClick={onClose}
              style={{ background: "none", border: "none", cursor: "pointer", color: "oklch(0.556 0 0)", display: "flex", alignItems: "center", padding: 4, borderRadius: 6 }}
              className="hover:bg-[oklch(0.93_0.03_290)] transition-colors"
            >
              <X size={15} />
            </button>
          </div>

          {/* Scrollable body */}
          <div ref={scrollBodyRef} style={{ flex: 1, overflowY: "auto", padding: "18px 18px 0" }}>

            {/* Upload / Paste area */}
            {generated.length === 0 && (
              <>
                <p style={{ margin: "0 0 8px", fontSize: 12, fontWeight: 600, color: "oklch(0.38 0 0)", fontFamily: "'Geist', system-ui, sans-serif", textTransform: "uppercase", letterSpacing: "0.07em" }}>
                  Source material
                </p>

                {/* Drop zone */}
                <div
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    border: `1.5px dashed ${isDragging ? "oklch(0.52 0.22 290)" : "oklch(0.82 0.01 264)"}`,
                    borderRadius: 10,
                    padding: "14px 12px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 6,
                    cursor: "pointer",
                    background: isDragging ? "oklch(0.96 0.04 290)" : "oklch(0.985 0 0)",
                    transition: "all 0.15s",
                    marginBottom: 10,
                  }}
                  className="hover:border-[oklch(0.52_0.22_290)] hover:bg-[oklch(0.97_0.03_290)] transition-all"
                >
                  <Upload size={18} style={{ color: "oklch(0.52 0.22 290)" }} />
                  <span style={{ fontSize: 12, color: "oklch(0.45 0 0)", fontFamily: "'Geist', system-ui, sans-serif", textAlign: "center", lineHeight: 1.4 }}>
                    <strong>Drop a file</strong> or click to upload<br />
                    <span style={{ color: "oklch(0.65 0 0)", fontSize: 11 }}>TXT, PDF, DOCX supported</span>
                  </span>
                  <input ref={fileInputRef} type="file" accept=".txt,.pdf,.docx" style={{ display: "none" }} onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
                </div>

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
                          color: "oklch(0.65 0 0)",
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
                          border: "1.5px solid oklch(0.88 0 0)",
                          fontSize: 12,
                          fontFamily: "'Geist', system-ui, sans-serif",
                          color: "oklch(0.205 0 0)",
                          background: "#fff",
                          outline: "none",
                          boxSizing: "border-box",
                          transition: "border-color 0.15s",
                        }}
                        onFocus={(e) => { e.currentTarget.style.borderColor = "oklch(0.52 0.22 290)"; }}
                        onBlur={(e) => { e.currentTarget.style.borderColor = "oklch(0.88 0 0)"; }}
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
                        background: !urlInput.trim() || loading ? "oklch(0.88 0 0)" : "oklch(0.52 0.22 290)",
                        color: !urlInput.trim() || loading ? "oklch(0.6 0 0)" : "#fff",
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
                            background: "oklch(0.96 0.04 290)",
                            border: "1px solid oklch(0.88 0.04 290)",
                            fontSize: 11,
                            fontFamily: "'Geist', system-ui, sans-serif",
                            color: "oklch(0.38 0.18 290)",
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
                              color: "oklch(0.52 0.18 290)",
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

                <p style={{ margin: "0 0 6px", fontSize: 11.5, fontWeight: 600, color: "oklch(0.65 0 0)", fontFamily: "'Geist', system-ui, sans-serif", textAlign: "center" }}>or paste text</p>

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

                {/* Question types */}
                <p style={{ margin: "0 0 8px", fontSize: 12, fontWeight: 600, color: "oklch(0.38 0 0)", fontFamily: "'Geist', system-ui, sans-serif", textTransform: "uppercase", letterSpacing: "0.07em" }}>
                  Question types
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 16 }}>
                  {(Object.keys(TYPE_META) as QuestionType[]).map((t) => {
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
                          border: `1.5px solid ${active ? "oklch(0.52 0.22 290)" : "oklch(0.88 0 0)"}`,
                          background: active ? "oklch(0.96 0.04 290)" : "oklch(0.985 0 0)",
                          color: active ? "oklch(0.38 0.18 290)" : "oklch(0.556 0 0)",
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
                <p style={{ margin: "0 0 8px", fontSize: 12, fontWeight: 600, color: "oklch(0.38 0 0)", fontFamily: "'Geist', system-ui, sans-serif", textTransform: "uppercase", letterSpacing: "0.07em" }}>
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
                        border: `1.5px solid ${count === n ? "oklch(0.52 0.22 290)" : "oklch(0.88 0 0)"}`,
                        background: count === n ? "oklch(0.96 0.04 290)" : "oklch(0.985 0 0)",
                        color: count === n ? "oklch(0.38 0.18 290)" : "oklch(0.556 0 0)",
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
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "oklch(0.205 0 0)", fontFamily: "'Geist', system-ui, sans-serif" }}>
                    {generated.length} questions generated
                  </p>
                  <button
                    onClick={() => { setGenerated([]); }}
                    style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: "oklch(0.55 0.2 250)", fontFamily: "'Geist', system-ui, sans-serif", fontWeight: 600 }}
                  >
                    ← Regenerate
                  </button>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
                  {generated.map((q, i) => {
                    const meta = TYPE_META[q.type];
                    return (
                      <div
                        key={i}
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          gap: 10,
                          padding: "12px 12px",
                          borderRadius: 10,
                          border: `1.5px solid ${q.selected ? meta.color + "60" : "oklch(0.922 0 0)"}`,
                          background: q.selected ? meta.color + "08" : "oklch(0.985 0 0)",
                          transition: "all 0.15s",
                        }}
                      >
                        {/* Checkbox — clicking it toggles selection */}
                        <div
                          onClick={() => toggleSelect(i)}
                          style={{
                            width: 22, height: 22, borderRadius: 6,
                            background: q.selected ? meta.color + "20" : "oklch(0.93 0 0)",
                            color: q.selected ? meta.color : "oklch(0.75 0 0)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            flexShrink: 0, marginTop: 1, cursor: "pointer",
                          }}
                        >
                          {q.selected ? <CheckCircle2 size={13} /> : <Circle size={13} />}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: meta.color, marginBottom: 3 }}>
                            {meta.icon} {q.type}
                          </span>
                          {/* Inline-editable question text — auto-height */}
                          <textarea
                            value={q.text}
                            onChange={(e) => {
                              updateGenerated(i, { text: e.target.value });
                              // auto-height
                              e.target.style.height = "auto";
                              e.target.style.height = e.target.scrollHeight + "px";
                            }}
                            onClick={(e) => e.stopPropagation()}
                            rows={1}
                            style={{
                              display: "block",
                              width: "100%",
                              margin: "0 0 6px",
                              fontSize: 12.5,
                              color: "oklch(0.205 0 0)",
                              lineHeight: 1.5,
                              fontFamily: "'Geist', system-ui, sans-serif",
                              background: "transparent",
                              border: "1px solid transparent",
                              borderRadius: 6,
                              padding: "2px 4px",
                              resize: "none",
                              overflow: "hidden",
                              outline: "none",
                              boxSizing: "border-box",
                              transition: "border-color 0.15s, background 0.15s",
                              height: "auto",
                            }}
                            ref={(el) => {
                              if (el) { el.style.height = "auto"; el.style.height = el.scrollHeight + "px"; }
                            }}
                            onFocus={(e) => {
                              e.currentTarget.style.borderColor = meta.color + "80";
                              e.currentTarget.style.background = "#fff";
                            }}
                            onBlur={(e) => {
                              e.currentTarget.style.borderColor = "transparent";
                              e.currentTarget.style.background = "transparent";
                            }}
                          />
                          {/* Multiple Choice: show options */}
                          {q.type === "Multiple Choice" && q.options && (
                            <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                              {q.options.map((opt, oi) => (
                                <div key={oi} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                                  <span style={{
                                    fontSize: 10, fontFamily: "'Geist Mono', monospace",
                                    width: 16, height: 16, borderRadius: "50%",
                                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                                    background: opt === q.correctAnswer ? "oklch(0.92 0.08 160)" : "oklch(0.93 0 0)",
                                    color: opt === q.correctAnswer ? "oklch(0.38 0.14 160)" : "oklch(0.556 0 0)",
                                    fontWeight: 700,
                                  }}>
                                    {String.fromCharCode(65 + oi)}
                                  </span>
                                  {/* Inline-editable option text — wrapping textarea */}
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
                                      fontSize: 11,
                                      color: opt === q.correctAnswer ? "oklch(0.38 0.14 160)" : "oklch(0.4 0 0)",
                                      fontWeight: opt === q.correctAnswer ? 600 : 400,
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
                                      transition: "border-color 0.15s, background 0.15s",
                                    }}
                                    ref={(el) => {
                                      if (el) { el.style.height = "auto"; el.style.height = el.scrollHeight + "px"; }
                                    }}
                                    onFocus={(e) => {
                                      e.currentTarget.style.borderColor = "oklch(0.52 0.18 160 / 0.5)";
                                      e.currentTarget.style.background = "#fff";
                                    }}
                                    onBlur={(e) => {
                                      e.currentTarget.style.borderColor = "transparent";
                                      e.currentTarget.style.background = "transparent";
                                    }}
                                  />
                                  {opt === q.correctAnswer && <CheckCircle2 size={10} style={{ color: "oklch(0.52 0.18 160)", flexShrink: 0 }} />}
                                </div>
                              ))}
                            </div>
                          )}
                          {/* True / False: show correct answer badge (click to toggle) */}
                          {q.type === "True / False" && q.correctAnswer && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                updateGenerated(i, { correctAnswer: q.correctAnswer === "True" ? "False" : "True" });
                              }}
                              title="Click to toggle correct answer"
                              style={{
                                display: "inline-flex", alignItems: "center", gap: 4,
                                fontSize: 10, fontWeight: 700,
                                background: q.correctAnswer === "True" ? "oklch(0.92 0.08 160)" : "oklch(0.97 0.04 27)",
                                color: q.correctAnswer === "True" ? "oklch(0.38 0.14 160)" : "oklch(0.57 0.22 27)",
                                padding: "2px 7px", borderRadius: 20,
                                border: "none", cursor: "pointer",
                                transition: "all 0.15s",
                              }}
                            >
                              Answer: {q.correctAnswer}
                            </button>
                          )}
                          {/* Short Text: show model answer — auto-height */}
                          {q.type === "Short Text" && q.modelAnswer && (
                            <div style={{ marginTop: 5 }}>
                              <span style={{ fontSize: 9.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "oklch(0.48 0.18 264)", display: "block", marginBottom: 2 }}>Model Answer</span>
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
                                  fontSize: 11,
                                  color: "oklch(0.38 0.18 264)",
                                  lineHeight: 1.5,
                                  fontFamily: "'Geist', system-ui, sans-serif",
                                  background: "oklch(0.96 0.03 264 / 0.4)",
                                  border: "1px solid oklch(0.88 0.04 264)",
                                  borderRadius: 6,
                                  padding: "4px 6px",
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
                                  e.currentTarget.style.borderColor = "oklch(0.88 0.04 264)";
                                  e.currentTarget.style.background = "oklch(0.96 0.03 264 / 0.4)";
                                }}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          <div style={{ padding: "14px 18px", borderTop: "1px solid oklch(0.922 0 0)", flexShrink: 0 }}>
            {generated.length === 0 ? (
              <button
                onClick={generate}
                disabled={!content.trim() || loading}
                style={{
                  width: "100%",
                  padding: "10px 0",
                  borderRadius: 10,
                  border: "none",
                  background: !content.trim() || loading
                    ? "oklch(0.88 0 0)"
                    : "linear-gradient(135deg, oklch(0.52 0.22 290) 0%, oklch(0.60 0.2 290) 100%)",
                  color: !content.trim() || loading ? "oklch(0.6 0 0)" : "#fff",
                  fontSize: 13,
                  fontWeight: 700,
                  fontFamily: "'Geist', system-ui, sans-serif",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 7,
                  cursor: !content.trim() || loading ? "not-allowed" : "pointer",
                  transition: "all 0.15s",
                  boxShadow: !content.trim() || loading ? "none" : "0 2px 10px oklch(0.52 0.22 290 / 0.28)",
                }}
              >
                {loading ? <><Loader2 size={14} className="animate-spin" /> Generating…</> : <><Sparkles size={14} /> Generate Questions</>}
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
                  background: selectedCount === 0 ? "oklch(0.88 0 0)" : "oklch(0.45 0.22 264)",
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
      </div>
    </>
  );
}

// ── Helpers ────────────────────────────────────────────────────────────────
function generateCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 5 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

// ── Main Page ───────────────────────────────────────────────────────────────
export default function Home() {
  // If lunr_new_session flag is set, clear all builder state and start fresh
  const [sessionCode] = useState(() => {
    const isNew = localStorage.getItem("lunr_new_session") === "true";
    if (isNew) {
      localStorage.removeItem("lunr_new_session");
      const code = generateCode();
      localStorage.setItem("lunr_session_code", code);
      localStorage.setItem("lunr_session_name", "Untitled Session");
      localStorage.removeItem(`lunr_questions_${code}`);
      return code;
    }
    const stored = localStorage.getItem("lunr_session_code");
    if (stored) return stored;
    const code = generateCode();
    localStorage.setItem("lunr_session_code", code);
    return code;
  });

  // Session name — persisted in localStorage, only "saved" on blur/Enter
  const [sessionName, setSessionName] = useState(
    () => localStorage.getItem("lunr_session_name") || "Untitled Session"
  );
  const [savedName, setSavedName] = useState(
    () => localStorage.getItem("lunr_session_name") || "Untitled Session"
  );
  const hasNamed = savedName.trim() !== "Untitled Session" && savedName.trim() !== "";

  // Restore questions from the last saved draft for this session code
  const [questions, setQuestions] = useState<Question[]>(() => {
    try {
      const code = localStorage.getItem("lunr_session_code");
      if (!code) return [];
      const raw = localStorage.getItem(`lunr_questions_${code}`);
      if (!raw) return [];
      // Restore serialised questions — re-attach icons from TYPE_META
      const parsed = JSON.parse(raw) as Omit<Question, "icon">[];
      return parsed.map((q) => ({
        ...q,
        icon: TYPE_META[q.type as QuestionType]?.icon ?? null,
      }));
    } catch {
      return [];
    }
  });
  const [showOnboarding, setShowOnboarding] = useState(
    () => localStorage.getItem("lunr_onboarding_done") !== "true"
  );

  const iconNudge = -3;

  const [, navigate] = useLocation();

  // Auto-persist questions whenever they change
  useEffect(() => {
    const serialisable = questions.map(({ icon: _icon, ...rest }) => rest);
    localStorage.setItem(`lunr_questions_${sessionCode}`, JSON.stringify(serialisable));
  }, [questions, sessionCode]);

  // Track whether there are unsaved changes (questions added or name changed)
  const [savedDraft, setSavedDraft] = useState(false);
  const isDirty = (questions.length > 0 || hasNamed) && !savedDraft;

  // Unsaved-changes dialog
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);
  const [pendingNav, setPendingNav] = useState<string | null>(null);

  const handleSaveDraft = () => {
    const session = {
      id: sessionCode,
      name: savedName || "Untitled Session",
      code: sessionCode,
      questionCount: questions.length,
      status: "draft" as const,
      createdAt: Date.now(),
      questionTypes: questions.map((q) => q.type),
    };
    // Write directly into the sessions list so it shows in My Sessions
    try {
      const existing = JSON.parse(localStorage.getItem("lunr_sessions") || "[]") as typeof session[];
      const idx = existing.findIndex((s) => s.id === sessionCode);
      if (idx >= 0) {
        existing[idx] = session;
      } else {
        existing.unshift(session);
      }
      localStorage.setItem("lunr_sessions", JSON.stringify(existing));
    } catch {
      localStorage.setItem("lunr_sessions", JSON.stringify([session]));
    }
    setSavedDraft(true);
    toast.success("Draft saved");
  };

  const handleBack = () => {
    if (isDirty) {
      setPendingNav("/sessions");
      setLeaveDialogOpen(true);
    } else {
      navigate("/sessions");
    }
  };

  const handleLaunch = () => {
    localStorage.setItem("lunr_onboarding_done", "true");
    setShowOnboarding(false);
    // Save this session as a pending session for the Sessions dashboard
    const session = {
      id: sessionCode, // use code as stable id
      name: savedName || "Untitled Session",
      code: sessionCode,
      questionCount: questions.length,
      status: "draft",
      createdAt: Date.now(),
      questionTypes: questions.map((q) => q.type),
    };
    localStorage.setItem("lunr_pending_session", JSON.stringify(session));
    navigate("/sessions");
  };

  // Add modal
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addModalType, setAddModalType] = useState<QuestionType | null>(null);

  // Type picker overlay
  const [typePickerOpen, setTypePickerOpen] = useState(false);

  // AI panel
  const [aiPanelOpen, setAiPanelOpen] = useState(false);

  const openAddType = (type: QuestionType) => {
    setAddModalType(type);
    setAddModalOpen(true);
  };

  const confirmAdd = (text: string, options?: string[], correctIndex?: number) => {
    if (!addModalType) return;
    const meta = TYPE_META[addModalType];
    setQuestions((prev) => [
      ...prev,
      { id: uid(), type: addModalType, icon: meta.icon, text, color: meta.color, options, correctIndex },
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
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden" }}>
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
        hasQuestions={questions.length > 0}
        onBack={handleBack}
        onSaveDraft={handleSaveDraft}
        isDirty={isDirty}
      />

      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        <Sidebar
          onAddType={openAddType}
          onAddPreset={addPreset}
          onOpenMagic={() => setAiPanelOpen(true)}
        />

        {/* Canvas */}
        <main
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "28px 32px",
            display: "flex",
            flexDirection: "column",
            gap: 16,
            transition: "margin-right 0.3s ease",
          }}
        >
          {/* Onboarding */}
          {showOnboarding && (
            <OnboardingSteps
              hasQuestions={questions.length > 0}
              hasNamed={hasNamed}
              sessionCode={sessionCode}
              onDismiss={() => setShowOnboarding(false)}
            />
          )}


          {/* Questions */}
          {questions.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {questions.map((q, i) => (
                <QuestionCard
                  key={q.id}
                  question={q}
                  index={i}
                  onRemove={() => removeQuestion(q.id)}
                  onUpdate={(text) => setQuestions((prev) => prev.map((item) => item.id === q.id ? { ...item, text } : item))}
                  iconNudge={iconNudge}
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
                  color: "oklch(0.556 0 0)",
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
          ) : (
            <EmptyState
              onMagic={() => setAiPanelOpen(true)}
              onManual={() => setTypePickerOpen(true)}
            />
          )}
        </main>

      </div>

      {/* AI Drawer — fixed overlay with backdrop */}
      <AiPanel
        open={aiPanelOpen}
        onClose={() => setAiPanelOpen(false)}
        onOpen={() => setAiPanelOpen(true)}
        onAddQuestions={handleAiAddQuestions}
      />

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
              background: "#fff",
              borderRadius: 18,
              padding: "28px 28px 24px",
              width: 380,
              boxShadow: "0 8px 40px rgba(0,0,0,0.18)",
              fontFamily: "'Geist', system-ui, sans-serif",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "oklch(0.205 0 0)" }}>Choose question type</p>
              <button
                onClick={() => setTypePickerOpen(false)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "oklch(0.556 0 0)", display: "flex", alignItems: "center", padding: 4, borderRadius: 6 }}
                className="hover:bg-[oklch(0.96_0_0)] transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {(Object.keys(TYPE_META) as QuestionType[]).map((type) => {
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
                      border: "1.5px solid oklch(0.922 0 0)",
                      background: "oklch(0.985 0 0)",
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
                        justifyContent: "center",
                        width: 34,
                        height: 34,
                        borderRadius: 8,
                        background: meta.color + "18",
                        color: meta.color,
                      }}
                    >
                      {meta.icon}
                    </span>
                    <div>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "oklch(0.205 0 0)", fontFamily: "'Geist', system-ui, sans-serif" }}>{type}</p>
                      <p style={{ margin: "2px 0 0", fontSize: 11.5, color: "oklch(0.556 0 0)", fontFamily: "'Geist', system-ui, sans-serif" }}>{meta.desc}</p>
                    </div>
                  </button>
                );
              })}
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
