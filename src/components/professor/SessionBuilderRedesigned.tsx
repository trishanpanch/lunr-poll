"use client";

/**
 * SessionBuilderRedesigned.tsx
 *
 * Drop-in replacement for SessionBuilder.tsx.
 * Redesigned for improved first-time professor experience.
 *
 * Key changes from original SessionBuilder:
 *  1. Three-step onboarding tracker — guides professors through name → add → launch
 *  2. AI generation banner — surfaces the "Magic" feature prominently at top of sidebar
 *  3. Question type 2×2 icon grid — replaces plain "+ Type" button list
 *  4. Preset badges — each preset shows question count before clicking
 *  5. Active empty state — replaces passive label with two clear CTAs
 *  6. Question cards — type label, color-coded icon, Q-number chip, drag handle
 *  7. Inline session renaming — click title to rename in place
 *  8. "Add another question" continuation row — keeps flow after first question
 *
 * Props are identical to SessionBuilder.tsx for easy substitution.
 * Drag-to-reorder uses the existing @dnd-kit/sortable setup.
 *
 * See: /design-system for full token and component reference.
 */

import { useState, useRef, useEffect } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Rocket, Sparkles, Type, ListChecks, Paperclip, Star,
  RotateCcw, GripVertical, Trash2, Plus, CheckCircle2,
  Circle, Pencil, ChevronRight, Loader2,
} from "lucide-react";
import type { Question, QuestionType, Session } from "@/lib/types";

// ── Type metadata ─────────────────────────────────────────────────────────────
const TYPE_META: Record<QuestionType, {
  icon: React.ReactNode;
  label: string;
  desc: string;
  colorClass: string;
  bgClass: string;
}> = {
  short_text: {
    icon: <Type className="w-[18px] h-[18px]" />,
    label: "Short Text",
    desc: "Open-ended written response",
    colorClass: "text-blue-600",
    bgClass: "bg-blue-50",
  },
  multiple_choice: {
    icon: <ListChecks className="w-[18px] h-[18px]" />,
    label: "Multiple Choice",
    desc: "Select from defined options",
    colorClass: "text-violet-600",
    bgClass: "bg-violet-50",
  },
  file_upload: {
    icon: <Paperclip className="w-[18px] h-[18px]" />,
    label: "File Upload",
    desc: "Students submit a file",
    colorClass: "text-emerald-600",
    bgClass: "bg-emerald-50",
  },
  rating: {
    icon: <Star className="w-[18px] h-[18px]" />,
    label: "Star Rating",
    desc: "1–5 star rating scale",
    colorClass: "text-amber-600",
    bgClass: "bg-amber-50",
  },
};

// ── Preset definitions ────────────────────────────────────────────────────────
const PRESETS = [
  {
    id: "start_stop_continue",
    name: "Start, Stop, Continue",
    icon: <RotateCcw className="w-[15px] h-[15px]" />,
    questions: [
      { text: "What should we START doing in this class?", type: "short_text" as QuestionType },
      { text: "What should we STOP doing in this class?", type: "short_text" as QuestionType },
      { text: "What should we CONTINUE doing in this class?", type: "short_text" as QuestionType },
    ],
  },
  {
    id: "rate_class",
    name: "Rate the Class",
    icon: <Star className="w-[15px] h-[15px]" />,
    questions: [
      { text: "How would you rate today's class overall?", type: "rating" as QuestionType },
    ],
  },
  {
    id: "vote",
    name: "Polling / Vote",
    icon: <ListChecks className="w-[15px] h-[15px]" />,
    questions: [
      { text: "Which topic would you like to explore further?", type: "multiple_choice" as QuestionType },
    ],
  },
];

const generateId = () => Math.random().toString(36).substr(2, 9);

// ── Props ─────────────────────────────────────────────────────────────────────
interface SessionBuilderRedesignedProps {
  session: Session;
  onSave: (questions: Question[]) => void;
  onLaunch: () => void;
}

// ── Sortable Question Card ────────────────────────────────────────────────────
function SortableQuestionCard({
  question,
  index,
  onRemove,
}: {
  question: Question;
  index: number;
  onRemove: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: question.id,
  });
  const style = { transform: CSS.Transform.toString(transform), transition };
  const meta = TYPE_META[question.type];

  return (
    <div ref={setNodeRef} style={style}>
      <div className="group flex items-start gap-3 p-4 rounded-xl border border-border bg-card hover:shadow-sm hover:border-border/80 transition-all">
        {/* Drag handle */}
        <div
          {...attributes}
          {...listeners}
          className="mt-1 text-muted-foreground/40 hover:text-muted-foreground cursor-grab touch-none outline-none transition-colors"
          title="Drag to reorder"
        >
          <GripVertical className="w-4 h-4" />
        </div>

        {/* Type icon */}
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${meta.bgClass} ${meta.colorClass}`}>
          {meta.icon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-1.5">
          <p className={`text-[10px] font-bold uppercase tracking-wider ${meta.colorClass}`}>
            {meta.label}
          </p>
          <p className="text-sm font-medium text-foreground leading-snug">
            {question.text || <span className="text-muted-foreground italic">No question text</span>}
          </p>
          <span className="inline-block text-[10px] font-medium bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
            Q{index + 1}
          </span>
        </div>

        {/* Remove */}
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => onRemove(question.id)}
          className="text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-all shrink-0"
          title="Remove question"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}

// ── Onboarding Steps ──────────────────────────────────────────────────────────
function OnboardingSteps({
  hasQuestions,
  onDismiss,
}: {
  hasQuestions: boolean;
  onDismiss: () => void;
}) {
  const steps = [
    {
      label: "Name your session",
      sub: "Click the title at the top to rename it anytime.",
      done: true,
      active: false,
    },
    {
      label: "Add your first question",
      sub: "Choose a type from the sidebar, use a preset, or generate with AI.",
      done: hasQuestions,
      active: !hasQuestions,
    },
    {
      label: "Launch & share with students",
      sub: "Hit Launch Session — students join with the session code.",
      done: false,
      active: hasQuestions,
    },
  ];

  return (
    <div className="bg-card rounded-xl border border-border p-5 flex items-start gap-5 shadow-sm">
      <div className="flex-1 space-y-0">
        {steps.map((step, i) => (
          <div key={i} className="flex items-start gap-3 relative">
            {i < steps.length - 1 && (
              <div
                className={`absolute left-[13px] top-7 w-0.5 h-6 transition-colors ${step.done ? "bg-green-300" : "bg-border"}`}
              />
            )}
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 relative z-10 text-xs font-bold transition-all ${
                step.done
                  ? "bg-green-100 text-green-700"
                  : step.active
                  ? "bg-primary text-primary-foreground ring-4 ring-primary/15"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {step.done ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : step.active ? (
                i + 1
              ) : (
                <Circle className="w-3 h-3" />
              )}
            </div>
            <div className={`pb-5 pt-0.5 ${i === steps.length - 1 ? "pb-0" : ""}`}>
              <p
                className={`text-sm font-semibold transition-colors ${
                  step.pending ? "text-muted-foreground" : "text-foreground"
                }`}
              >
                {step.label}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{step.sub}</p>
            </div>
          </div>
        ))}
      </div>
      <button
        onClick={onDismiss}
        className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors shrink-0 mt-0.5"
      >
        Dismiss
      </button>
    </div>
  );
}

// ── Empty State ───────────────────────────────────────────────────────────────
function EmptyState({
  onMagic,
  onManual,
}: {
  onMagic: () => void;
  onManual: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center bg-card rounded-xl border-2 border-dashed border-border hover:border-primary/30 hover:bg-primary/[0.02] transition-all min-h-[260px] p-10 text-center gap-3">
      <div className="text-4xl opacity-25 leading-none">🗂️</div>
      <p className="text-base font-semibold text-foreground">No questions yet</p>
      <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
        Add a question from the sidebar, use a preset, or generate questions automatically with AI.
      </p>
      <div className="flex gap-2.5 mt-1 flex-wrap justify-center">
        <Button
          onClick={onMagic}
          className="gap-1.5 bg-violet-600 hover:bg-violet-700 text-white"
        >
          <Sparkles className="w-3.5 h-3.5" />
          Generate with AI
        </Button>
        <Button variant="outline" onClick={onManual} className="gap-1.5">
          <Plus className="w-3.5 h-3.5" />
          Add Manually
        </Button>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function SessionBuilderRedesigned({
  session,
  onSave,
  onLaunch,
}: SessionBuilderRedesignedProps) {
  const [questions, setQuestions] = useState<Question[]>(session.questions ?? []);
  const [title, setTitle] = useState(session.title ?? "Untitled Session");
  const [editingTitle, setEditingTitle] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(true);

  // Add question modal
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addModalType, setAddModalType] = useState<QuestionType>("short_text");
  const [addModalText, setAddModalText] = useState("");

  // Magic modal
  const [magicOpen, setMagicOpen] = useState(false);
  const [magicInput, setMagicInput] = useState("");
  const [magicLoading, setMagicLoading] = useState(false);

  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingTitle) titleInputRef.current?.select();
  }, [editingTitle]);

  // DnD
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setQuestions((qs) => {
        const oldIndex = qs.findIndex((q) => q.id === active.id);
        const newIndex = qs.findIndex((q) => q.id === over.id);
        const reordered = arrayMove(qs, oldIndex, newIndex);
        onSave(reordered);
        return reordered;
      });
    }
  };

  const openAddModal = (type: QuestionType) => {
    setAddModalType(type);
    setAddModalText("");
    setAddModalOpen(true);
  };

  const confirmAdd = () => {
    if (!addModalText.trim()) return;
    const newQ: Question = {
      id: generateId(),
      type: addModalType,
      text: addModalText.trim(),
    };
    const updated = [...questions, newQ];
    setQuestions(updated);
    onSave(updated);
    setAddModalOpen(false);
    toast.success(`${TYPE_META[addModalType].label} question added`);
  };

  const addPreset = (presetId: string) => {
    const preset = PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    const newQs: Question[] = preset.questions.map((q) => ({
      id: generateId(),
      type: q.type,
      text: q.text,
    }));
    const updated = [...questions, ...newQs];
    setQuestions(updated);
    onSave(updated);
    toast.success(`"${preset.name}" added — ${newQs.length} question${newQs.length > 1 ? "s" : ""}`);
  };

  const removeQuestion = (id: string) => {
    const updated = questions.filter((q) => q.id !== id);
    setQuestions(updated);
    onSave(updated);
    toast.info("Question removed");
  };

  const runMagic = () => {
    if (!magicInput.trim() || magicLoading) return;
    setMagicLoading(true);
    // Replace this timeout with your actual AI call (e.g. @google/generative-ai)
    setTimeout(() => {
      const generated: Question[] = [
        { id: generateId(), type: "short_text", text: "In your own words, summarize the key concept from today's content." },
        { id: generateId(), type: "multiple_choice", text: "Which of the following best describes the main idea of the material?", options: ["Option A", "Option B", "Option C", "Option D"] },
        { id: generateId(), type: "rating", text: "How confident do you feel about this topic after today's session?" },
      ];
      const updated = [...questions, ...generated];
      setQuestions(updated);
      onSave(updated);
      setMagicLoading(false);
      setMagicOpen(false);
      toast.success("✨ 3 questions generated");
    }, 1800);
  };

  return (
    <div className="flex flex-col h-full">
      {/* ── Header ── */}
      <header className="sticky top-0 z-40 bg-card border-b border-border px-6 py-3 flex items-center justify-between shadow-sm">
        <div className="flex flex-col gap-0.5">
          {editingTitle ? (
            <input
              ref={titleInputRef}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={() => setEditingTitle(false)}
              onKeyDown={(e) => e.key === "Enter" && setEditingTitle(false)}
              className="text-lg font-bold text-foreground border border-primary rounded-md px-2 py-0.5 outline-none bg-primary/5 min-w-[180px]"
            />
          ) : (
            <button
              onClick={() => setEditingTitle(true)}
              className="group flex items-center gap-1.5 text-lg font-bold text-foreground hover:bg-muted rounded-md px-1.5 py-0.5 transition-colors text-left"
            >
              {title}
              <Pencil className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          )}
          <span className="text-xs text-muted-foreground px-1.5">
            Code:{" "}
            <span className="font-mono font-bold text-primary tracking-widest">
              {session.code}
            </span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => { onSave(questions); toast.success("Draft saved"); }}
          >
            Save Draft
          </Button>
          <Button
            size="sm"
            onClick={onLaunch}
            className="gap-1.5 bg-primary hover:bg-rose-800 text-white shadow-sm hover:shadow-md transition-all"
          >
            <Rocket className="w-4 h-4" />
            Launch Session
          </Button>
        </div>
      </header>

      {/* ── Body ── */}
      <div className="flex flex-1 overflow-hidden">
        {/* ── Sidebar ── */}
        <aside className="w-[280px] min-w-[280px] bg-card border-r border-border flex flex-col overflow-y-auto">
          {/* AI Banner */}
          <div className="m-3.5 rounded-xl border border-violet-200 bg-gradient-to-br from-violet-50 to-pink-50 p-4 space-y-2.5">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-violet-600" />
              <span className="text-sm font-bold text-violet-700">Generate with AI</span>
            </div>
            <p className="text-xs text-violet-600/80 leading-relaxed">
              Paste your lecture notes or topic — AI will draft questions instantly.
            </p>
            <Button
              onClick={() => setMagicOpen(true)}
              className="w-full gap-1.5 bg-violet-600 hover:bg-violet-700 text-white text-xs h-8"
              size="sm"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Generate Questions
            </Button>
          </div>

          {/* Question Types */}
          <div className="px-3.5 pt-1 pb-0">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2.5">
              Add a Question
            </p>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(TYPE_META) as QuestionType[]).map((type) => {
                const meta = TYPE_META[type];
                return (
                  <button
                    key={type}
                    onClick={() => openAddModal(type)}
                    title={meta.desc}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border border-border bg-background text-xs font-medium text-muted-foreground hover:border-primary/40 hover:bg-primary/[0.03] hover:text-foreground transition-all`}
                  >
                    <span className={meta.colorClass}>{meta.icon}</span>
                    {meta.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Presets */}
          <div className="px-3.5 pt-4 pb-4 space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2.5">
              Quick Presets
            </p>
            {PRESETS.map((preset) => (
              <button
                key={preset.id}
                onClick={() => addPreset(preset.id)}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg border border-border bg-background text-sm font-medium text-muted-foreground hover:border-primary/40 hover:bg-primary/[0.03] hover:text-foreground transition-all text-left"
              >
                <span className="text-primary/70">{preset.icon}</span>
                <span className="flex-1">{preset.name}</span>
                <span className="text-[10px] font-bold bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">
                  {preset.questions.length}Q
                </span>
              </button>
            ))}
          </div>
        </aside>

        {/* ── Canvas ── */}
        <main className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Onboarding */}
          {showOnboarding && (
            <OnboardingSteps
              hasQuestions={questions.length > 0}
              onDismiss={() => setShowOnboarding(false)}
            />
          )}

          {/* Questions or empty state */}
          {questions.length > 0 ? (
            <div className="space-y-3">
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={questions.map((q) => q.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {questions.map((q, i) => (
                    <SortableQuestionCard
                      key={q.id}
                      question={q}
                      index={i}
                      onRemove={removeQuestion}
                    />
                  ))}
                </SortableContext>
              </DndContext>

              {/* Continue row */}
              <button
                onClick={() => openAddModal("short_text")}
                className="w-full flex items-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed border-border hover:border-primary/40 hover:bg-primary/[0.02] text-sm font-medium text-muted-foreground hover:text-foreground transition-all"
              >
                <ChevronRight className="w-4 h-4" />
                Add another question
              </button>
            </div>
          ) : (
            <EmptyState
              onMagic={() => setMagicOpen(true)}
              onManual={() => openAddModal("short_text")}
            />
          )}
        </main>
      </div>

      {/* ── Add Question Modal ── */}
      <Dialog open={addModalOpen} onOpenChange={(v) => !v && setAddModalOpen(false)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className={TYPE_META[addModalType].colorClass}>
                {TYPE_META[addModalType].icon}
              </span>
              Add {TYPE_META[addModalType].label} Question
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Question text</Label>
            <Textarea
              value={addModalText}
              onChange={(e) => setAddModalText(e.target.value)}
              placeholder="e.g. What was the main takeaway from today's lecture?"
              rows={3}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) confirmAdd();
              }}
            />
            <p className="text-xs text-muted-foreground">Press ⌘Enter to add quickly</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddModalOpen(false)}>Cancel</Button>
            <Button onClick={confirmAdd} disabled={!addModalText.trim()}>
              Add Question
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Magic Modal ── */}
      <Dialog open={magicOpen} onOpenChange={(v) => !v && !magicLoading && setMagicOpen(false)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-violet-700">
              <Sparkles className="w-4 h-4 text-violet-600" />
              Generate Questions with AI
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Paste your lecture notes, topic, or learning objectives</Label>
            <Textarea
              value={magicInput}
              onChange={(e) => setMagicInput(e.target.value)}
              placeholder="e.g. Today we covered Newton's three laws of motion and their real-world applications in engineering…"
              rows={5}
              autoFocus
              disabled={magicLoading}
            />
          </div>
          {magicLoading && (
            <div className="flex items-center gap-2 text-sm text-violet-600 font-medium">
              <Loader2 className="w-4 h-4 animate-spin" />
              Generating questions…
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setMagicOpen(false)} disabled={magicLoading}>
              Cancel
            </Button>
            <Button
              onClick={runMagic}
              disabled={!magicInput.trim() || magicLoading}
              className="gap-1.5 bg-violet-600 hover:bg-violet-700 text-white"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Generate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
