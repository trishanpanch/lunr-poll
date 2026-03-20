/* ── Design: Structured Clarity / Swiss Information Design ──
   DM Sans headings, Inter body. Indigo primary, Crimson for Launch only.
   Fixed sidebar (280px) + fluid document canvas.
   Step tracker onboarding, 2×2 question type grid, AI banner hero.
*/

import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import {
  Rocket, Sparkles, Type, ListChecks, Paperclip, Star,
  RotateCcw, GripVertical, X, ChevronRight, CheckCircle2,
  Circle, Pencil
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

// ── Types ──────────────────────────────────────────────────────────────────
type QuestionType = "Short Text" | "Multiple Choice" | "File Upload" | "Star Rating";

interface Question {
  id: string;
  type: QuestionType;
  icon: React.ReactNode;
  text: string;
  color: string;
}

const TYPE_META: Record<QuestionType, { icon: React.ReactNode; color: string; desc: string }> = {
  "Short Text":      { icon: <Type size={18} />,       color: "oklch(0.48 0.18 264)", desc: "Open-ended written response" },
  "Multiple Choice": { icon: <ListChecks size={18} />, color: "oklch(0.52 0.22 290)", desc: "Select from options" },
  "File Upload":     { icon: <Paperclip size={18} />,  color: "oklch(0.52 0.18 160)", desc: "Students submit a file" },
  "Star Rating":     { icon: <Star size={18} />,       color: "oklch(0.62 0.18 60)",  desc: "1–5 star rating scale" },
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
  onLaunch,
}: {
  sessionName: string;
  onNameChange: (v: string) => void;
  onLaunch: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.select();
  }, [editing]);

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
      {/* Left: session name + code */}
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {editing ? (
          <input
            ref={inputRef}
            value={sessionName}
            onChange={(e) => onNameChange(e.target.value)}
            onBlur={() => setEditing(false)}
            onKeyDown={(e) => e.key === "Enter" && setEditing(false)}
            style={{
              fontFamily: "'Geist', system-ui, sans-serif",
              fontWeight: 700,
              fontSize: 17,
              color: "oklch(0.145 0 0)",
              border: "1.5px solid oklch(0.514 0.2 13.9)",
              borderRadius: 8,
              padding: "2px 8px",
              outline: "none",
              background: "oklch(0.97 0.02 13.9)",
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
              color: "oklch(0.145 0 0)",
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
            letterSpacing: "0.03em",
          }}
        >
          Code:{" "}
          <span
            style={{
              fontWeight: 700,
              color: "oklch(0.514 0.2 13.9)",
              letterSpacing: "0.1em",
              fontFamily: "'Geist', system-ui, sans-serif",
            }}
          >
            23EAJB
          </span>
        </span>
      </div>

      {/* Right: actions */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <button
          onClick={() => toast.success("Draft saved")}
          style={{
            padding: "8px 18px",
            borderRadius: 10,
            border: "1.5px solid oklch(0.922 0 0)",
            background: "#fff",
            color: "oklch(0.205 0 0)",
            fontSize: 13,
            fontWeight: 500,
            fontFamily: "'Geist', system-ui, sans-serif",
            transition: "border-color 0.15s, background 0.15s",
          }}
          className="hover:border-[oklch(0.55_0.2_250)] hover:bg-[oklch(0.982_0.0107_271.3)] hover:text-[oklch(0.55_0.2_250)] transition-all"
        >
          Save Draft
        </button>
        <button
          onClick={onLaunch}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "9px 22px",
            borderRadius: 10,
            border: "none",
            background: "linear-gradient(135deg, oklch(0.514 0.2 13.9) 0%, oklch(0.44 0.2 13.9) 100%)",
            color: "#fff",
            fontSize: 14,
            fontWeight: 700,
            fontFamily: "'Geist', system-ui, sans-serif",
            boxShadow: "0 2px 10px oklch(0.514 0.2 13.9 / 0.3)",
            transition: "opacity 0.15s, box-shadow 0.15s",
          }}
          className="hover:opacity-90 hover:shadow-lg transition-all"
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
              <span
                style={{
                  fontSize: 10,
                  background: "oklch(0.982 0.0107 271.3)",
                  color: "oklch(0.55 0.2 250)",
                  padding: "2px 7px",
                  borderRadius: 20,
                  fontWeight: 700,
                  letterSpacing: "0.04em",
                }}
              >
                {preset.count}Q
              </span>
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
  onDismiss,
}: {
  hasQuestions: boolean;
  hasNamed: boolean;
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
          <strong style={{ color: "oklch(0.55 0.2 250)", letterSpacing: "0.08em" }}>23EAJB</strong>.
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
                      boxShadow: "0 0 0 4px oklch(0.55 0.2 250 / 0.18)",
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
}: {
  question: Question;
  index: number;
  onRemove: () => void;
}) {
  const meta = TYPE_META[question.type];
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
          marginTop: 2,
          cursor: "grab",
          flexShrink: 0,
        }}
        title="Drag to reorder"
      >
        <GripVertical size={16} />
      </div>

      {/* Type icon */}
      <div
        style={{
          width: 34,
          height: 34,
          borderRadius: 9,
          background: `${meta.color}18`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          color: meta.color,
          marginTop: 0,
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
        <p
          style={{
            fontSize: 14,
            fontWeight: 500,
            color: "oklch(0.145 0 0)",
            margin: 0,
            lineHeight: 1.5,
            fontFamily: "'Geist', system-ui, sans-serif",
          }}
        >
          {question.text}
        </p>
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
    "Rate your understanding of the concept covered today.",
    "How engaging did you find today's lecture?",
    "How well do you feel prepared for the upcoming exam?",
  ],
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
  onConfirm: (text: string) => void;
}) {
  const [text, setText] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const meta = type ? TYPE_META[type] : null;
  const suggestions = type ? SUGGESTIONS[type] : [];

  useEffect(() => {
    if (open) { setText(""); setShowSuggestions(false); }
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
            placeholder="e.g. What was the main takeaway from today's lecture?"
            rows={3}
            style={{ borderRadius: 10, fontSize: 14, resize: "none" }}
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                if (text.trim()) onConfirm(text.trim());
              }
            }}
          />

          {/* Suggestions toggle */}
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
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
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
        </div>
        <DialogFooter style={{ gap: 8 }}>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={() => text.trim() && onConfirm(text.trim())}
            disabled={!text.trim()}
            style={{
              background: "oklch(0.514 0.2 13.9)",
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

// ── Magic Modal ─────────────────────────────────────────────────────────────
function MagicModal({
  open,
  onClose,
  onGenerate,
}: {
  open: boolean;
  onClose: () => void;
  onGenerate: (input: string) => void;
}) {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) { setInput(""); setLoading(false); }
  }, [open]);

  const run = () => {
    if (!input.trim() || loading) return;
    setLoading(true);
    setTimeout(() => {
      onGenerate(input.trim());
      setLoading(false);
    }, 1800);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && !loading && onClose()}>
      <DialogContent style={{ maxWidth: 460, borderRadius: 18 }}>
        <DialogHeader>
          <DialogTitle
            style={{
              fontFamily: "'Geist', system-ui, sans-serif",
              fontSize: 17,
              display: "flex",
              alignItems: "center",
              gap: 8,
              color: "oklch(0.38 0.18 290)",
            }}
          >
            <Sparkles size={18} style={{ color: "oklch(0.52 0.22 290)" }} />
            Generate Questions with AI
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
            Paste your lecture notes, topic, or learning objectives
          </Label>
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="e.g. Today we covered Newton's three laws of motion and their real-world applications in engineering…"
            rows={5}
            style={{ borderRadius: 10, fontSize: 14, resize: "none" }}
            autoFocus
            disabled={loading}
          />
        </div>
        {loading && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              fontSize: 13,
              color: "oklch(0.52 0.22 290)",
              fontWeight: 500,
            }}
          >
            <span className="spinner" />
            Generating questions…
          </div>
        )}
        <DialogFooter style={{ gap: 8 }}>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={run}
            disabled={!input.trim() || loading}
            style={{
              background: "linear-gradient(135deg, oklch(0.52 0.22 290) 0%, oklch(0.60 0.2 290) 100%)",
              color: "#fff",
              fontFamily: "'Geist', system-ui, sans-serif",
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <Sparkles size={14} />
            Generate
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Main Page ───────────────────────────────────────────────────────────────
export default function Home() {
  const [sessionName, setSessionName] = useState("Untitled Session");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [showOnboarding, setShowOnboarding] = useState(
    () => localStorage.getItem("lunr_onboarding_done") !== "true"
  );

  const handleLaunch = () => {
    localStorage.setItem("lunr_onboarding_done", "true");
    setShowOnboarding(false);
    toast.info("Launching session…");
  };

  // Add modal
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addModalType, setAddModalType] = useState<QuestionType | null>(null);

  // Magic modal
  const [magicOpen, setMagicOpen] = useState(false);

  const openAddType = (type: QuestionType) => {
    setAddModalType(type);
    setAddModalOpen(true);
  };

  const confirmAdd = (text: string) => {
    if (!addModalType) return;
    const meta = TYPE_META[addModalType];
    setQuestions((prev) => [
      ...prev,
      { id: uid(), type: addModalType, icon: meta.icon, text, color: meta.color },
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

  const handleMagicGenerate = (input: string) => {
    const generated: Question[] = [
      {
        id: uid(),
        type: "Short Text",
        icon: TYPE_META["Short Text"].icon,
        text: "In your own words, summarize the key concept from today's content.",
        color: TYPE_META["Short Text"].color,
      },
      {
        id: uid(),
        type: "Multiple Choice",
        icon: TYPE_META["Multiple Choice"].icon,
        text: "Which of the following best describes the main idea of the material?",
        color: TYPE_META["Multiple Choice"].color,
      },
      {
        id: uid(),
        type: "Star Rating",
        icon: TYPE_META["Star Rating"].icon,
        text: "How confident do you feel about this topic after today's session?",
        color: TYPE_META["Star Rating"].color,
      },
    ];
    setQuestions((prev) => [...prev, ...generated]);
    setMagicOpen(false);
    toast.success("✨ 3 questions generated");
  };

  const removeQuestion = (id: string) => {
    setQuestions((prev) => prev.filter((q) => q.id !== id));
    toast.info("Question removed");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden" }}>
      <Topbar sessionName={sessionName} onNameChange={setSessionName} onLaunch={handleLaunch} />

      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        <Sidebar
          onAddType={openAddType}
          onAddPreset={addPreset}
          onOpenMagic={() => setMagicOpen(true)}
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
          }}
        >
          {/* Onboarding */}
          {showOnboarding && (
            <OnboardingSteps
              hasQuestions={questions.length > 0}
              hasNamed={sessionName.trim() !== "Untitled Session" && sessionName.trim() !== ""}
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
                />
              ))}
              {/* Add more row */}
              <button
                onClick={() => openAddType("Short Text")}
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
                <ChevronRight size={15} />
                Add another question
              </button>
            </div>
          ) : (
            <EmptyState
              onMagic={() => setMagicOpen(true)}
              onManual={() => openAddType("Short Text")}
            />
          )}
        </main>
      </div>

      {/* Modals */}
      <AddQuestionModal
        open={addModalOpen}
        type={addModalType}
        onClose={() => setAddModalOpen(false)}
        onConfirm={confirmAdd}
      />
      <MagicModal
        open={magicOpen}
        onClose={() => setMagicOpen(false)}
        onGenerate={handleMagicGenerate}
      />
    </div>
  );
}
