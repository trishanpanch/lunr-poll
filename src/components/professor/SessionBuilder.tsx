"use client";

import { useState } from "react";
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent
} from "@dnd-kit/core";
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
    Question,
    QuestionPurpose,
    QuestionRevealMode,
    QuestionType,
    Session,
    SessionDeliveryMode
} from "@/lib/types";
import { IS_DEMO_MODE } from "@/lib/config";
import { auth } from "@/lib/firebase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import {
    Trash2,
    Plus,
    GripVertical,
    Rocket,
    Sparkles,
    Loader2,
    Check,
    Layers3
} from "lucide-react";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog";
import { RichText } from "@/components/ui/RichText";

const generateId = () => Math.random().toString(36).substr(2, 9);

type DraftQuestionType = QuestionType | "auto" | "mixed";
type DraftDifficulty = "introductory" | "intermediate" | "advanced" | "mixed";

interface DraftRequest {
    topic: string;
    purpose: QuestionPurpose;
    type: DraftQuestionType;
    questionCount: number;
    difficulty: DraftDifficulty;
}

interface GeneratedDraftQuestion {
    text?: string;
    type?: string;
    options?: string[];
    purpose?: QuestionPurpose;
    explanation?: string;
    correctAnswers?: string[];
    revealMode?: QuestionRevealMode;
}

const PURPOSE_OPTIONS: Array<{ value: QuestionPurpose; label: string }> = [
    { value: "discussion", label: "Discussion" },
    { value: "assessment", label: "Assessment" },
    { value: "information_gathering", label: "Information Gathering" },
    { value: "feedback", label: "Feedback" }
];

const REVEAL_OPTIONS: Array<{ value: QuestionRevealMode; label: string }> = [
    { value: "never", label: "Do not reveal" },
    { value: "after_submission", label: "Reveal after submission" },
    { value: "after_session_close", label: "Reveal after poll closes" }
];

const DELIVERY_MODE_COPY: Record<SessionDeliveryMode, { title: string; description: string }> = {
    paced: {
        title: "Paced live poll",
        description: "You decide when each question appears."
    },
    self_paced: {
        title: "Self-paced poll",
        description: "Students answer the full set in one pass."
    }
};

function getQuestionTypeLabel(type: QuestionType) {
    if (type === "short_text") return "Open Ended";
    if (type === "multiple_choice") return "Multiple Choice";
    if (type === "file_upload") return "File Upload";
    return "Star Rating";
}

function createQuestion(
    type: QuestionType,
    text = "New Question",
    options?: string[],
    overrides: Partial<Question> = {}
): Question {
    return {
        id: generateId(),
        text,
        type,
        options: options || (type === "multiple_choice" ? ["Option A", "Option B"] : undefined),
        purpose: overrides.purpose ?? "discussion",
        correctAnswers: overrides.correctAnswers ?? [],
        explanation: overrides.explanation ?? "",
        revealMode: overrides.revealMode ?? "never",
        ...overrides
    };
}

function sanitizeQuestionsForFirestore(questions: Question[]) {
    return questions.map((q) => ({
        ...q,
        options: q.options === undefined ? null : q.options,
        purpose: q.purpose ?? null,
        correctAnswers: q.correctAnswers === undefined ? null : q.correctAnswers,
        explanation: q.explanation ?? null,
        revealMode: q.revealMode ?? null
    }));
}

function SortableQuestionItem({
    q,
    updateQuestion,
    removeQuestion
}: {
    q: Question;
    updateQuestion: (id: string, updates: Partial<Question>) => void;
    removeQuestion: (id: string) => void;
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition
    } = useSortable({ id: q.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition
    };

    const correctAnswers = q.correctAnswers || [];
    const isAssessment = q.purpose === "assessment";

    return (
        <div ref={setNodeRef} style={style} className="mb-4">
            <Card className="relative group border-slate-200">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-slate-200 rounded-l-xl group-hover:bg-primary transition-colors" />
                <CardContent className="p-6 space-y-5">
                    <div className="flex items-start gap-4">
                        <div
                            {...attributes}
                            {...listeners}
                            className="mt-3 cursor-move text-slate-300 hover:text-slate-500 touch-none outline-none"
                        >
                            <GripVertical className="w-5 h-5" />
                        </div>

                        <div className="flex-1 space-y-4">
                            <div className="flex justify-between items-start gap-4">
                                <div className="space-y-2">
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                                        {getQuestionTypeLabel(q.type)}
                                    </span>
                                    <div className="flex flex-wrap gap-2">
                                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-600">
                                            {q.purpose?.replace("_", " ") || "discussion"}
                                        </span>
                                        {isAssessment && (
                                            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-emerald-700">
                                                Assessment
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => removeQuestion(q.id)}
                                    className="text-slate-400 hover:text-red-600"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>

                            <Input
                                value={q.text}
                                onChange={(e) => updateQuestion(q.id, { text: e.target.value })}
                                className="text-lg font-medium border-transparent hover:border-slate-200 focus:border-primary transition-all px-0"
                                placeholder="Enter question text..."
                            />

                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                                        Question Purpose
                                    </label>
                                    <select
                                        value={q.purpose || "discussion"}
                                        onChange={(e) =>
                                            updateQuestion(q.id, { purpose: e.target.value as QuestionPurpose })
                                        }
                                        className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15"
                                    >
                                        {PURPOSE_OPTIONS.map((option) => (
                                            <option key={option.value} value={option.value}>
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {q.type === "multiple_choice" && (
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                                            Feedback Timing
                                        </label>
                                        <select
                                            value={q.revealMode || "never"}
                                            onChange={(e) =>
                                                updateQuestion(q.id, { revealMode: e.target.value as QuestionRevealMode })
                                            }
                                            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15"
                                        >
                                            {REVEAL_OPTIONS.map((option) => (
                                                <option key={option.value} value={option.value}>
                                                    {option.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                            </div>

                            {q.type === "multiple_choice" && (
                                <div className="space-y-3 rounded-xl border border-slate-100 bg-slate-50/60 p-4">
                                    <div className="space-y-3">
                                        {q.options?.map((opt, optIdx) => {
                                            const isCorrect = correctAnswers.includes(opt);
                                            return (
                                                <div key={`${q.id}-${optIdx}`} className="flex items-start gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            const nextCorrect = isCorrect
                                                                ? correctAnswers.filter((value) => value !== opt)
                                                                : [...correctAnswers, opt];
                                                            updateQuestion(q.id, { correctAnswers: nextCorrect });
                                                        }}
                                                        className={`mt-1 flex h-8 w-8 items-center justify-center rounded-full border transition-colors ${
                                                            isCorrect
                                                                ? "border-emerald-600 bg-emerald-600 text-white"
                                                                : "border-slate-300 bg-white text-slate-300 hover:border-emerald-400 hover:text-emerald-500"
                                                        }`}
                                                        title="Mark as correct"
                                                    >
                                                        <Check className="h-4 w-4" />
                                                    </button>

                                                    <div className="flex-1 space-y-1">
                                                        <Input
                                                            value={opt}
                                                            onChange={(e) => {
                                                                const newText = e.target.value;
                                                                const newOptions = [...(q.options || [])];
                                                                newOptions[optIdx] = newText;
                                                                const nextCorrect = correctAnswers.map((value) =>
                                                                    value === opt ? newText : value
                                                                );
                                                                updateQuestion(q.id, {
                                                                    options: newOptions,
                                                                    correctAnswers: nextCorrect
                                                                });
                                                            }}
                                                            className="h-9 text-sm"
                                                        />
                                                        {isCorrect && (
                                                            <p className="text-xs font-medium text-emerald-700">
                                                                Marked as a correct answer
                                                            </p>
                                                        )}
                                                    </div>

                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-slate-300 hover:text-red-500"
                                                        onClick={() => {
                                                            const nextOptions = q.options?.filter((_, i) => i !== optIdx);
                                                            updateQuestion(q.id, {
                                                                options: nextOptions,
                                                                correctAnswers: correctAnswers.filter((value) => value !== opt)
                                                            });
                                                        }}
                                                    >
                                                        <Trash2 className="w-3 h-3" />
                                                    </Button>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    <Button
                                        variant="link"
                                        size="sm"
                                        className="text-primary p-0 h-auto"
                                        onClick={() =>
                                            updateQuestion(q.id, {
                                                options: [...(q.options || []), `Option ${(q.options?.length || 0) + 1}`]
                                            })
                                        }
                                    >
                                        + Add Option
                                    </Button>
                                </div>
                            )}

                            {q.type === "multiple_choice" && isAssessment && (
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                                        Explanation for Students
                                    </label>
                                    <Textarea
                                        value={q.explanation || ""}
                                        onChange={(e) => updateQuestion(q.id, { explanation: e.target.value })}
                                        placeholder="Explain why the correct answer is correct. This is shown based on your feedback timing setting."
                                        className="min-h-[100px]"
                                    />
                                </div>
                            )}

                            <div className="rounded-xl border border-dashed border-slate-200 bg-white p-3 text-xs text-slate-500">
                                <span className="font-semibold text-slate-700">Preview:</span>
                                <RichText content={q.text} className="ml-2 inline-block align-top text-slate-600" />
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

function AIDraftDialog({
    open,
    onOpenChange,
    onDraft
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onDraft: (request: DraftRequest) => Promise<void>;
}) {
    const [topic, setTopic] = useState("");
    const [purpose, setPurpose] = useState<QuestionPurpose>("discussion");
    const [type, setType] = useState<DraftQuestionType>("auto");
    const [difficulty, setDifficulty] = useState<DraftDifficulty>("intermediate");
    const [questionCount, setQuestionCount] = useState(1);
    const [loading, setLoading] = useState(false);

    const handleDraft = async () => {
        if (!topic.trim()) return;
        setLoading(true);
        try {
            await onDraft({
                topic: topic.trim(),
                purpose,
                type,
                questionCount: Math.min(Math.max(questionCount, 1), 5),
                difficulty
            });
            onOpenChange(false);
            setTopic("");
            setQuestionCount(1);
            setPurpose("discussion");
            setType("auto");
            setDifficulty("intermediate");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 font-serif">
                        <Sparkles className="w-5 h-5 text-purple-600" />
                        AI Question Generator
                    </DialogTitle>
                    <DialogDescription>
                        Describe what you want to check or discuss, then choose how many questions to draft and what mix to generate.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-2 md:grid-cols-2">
                    <div className="space-y-2 md:col-span-2">
                        <label className="text-sm font-medium text-slate-700">Topic or Concept</label>
                        <Input
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                            placeholder="e.g. keynesian economics, recursion, mitochondrial respiration..."
                            autoFocus
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Purpose of Poll</label>
                        <select
                            value={purpose}
                            onChange={(e) => setPurpose(e.target.value as QuestionPurpose)}
                            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15"
                        >
                            {PURPOSE_OPTIONS.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">How Many Questions</label>
                        <Input
                            type="number"
                            min={1}
                            max={5}
                            value={questionCount}
                            onChange={(e) => setQuestionCount(Number(e.target.value || 1))}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Question Type Strategy</label>
                        <select
                            value={type}
                            onChange={(e) => setType(e.target.value as DraftQuestionType)}
                            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15"
                        >
                            <option value="auto">Auto choose the best type</option>
                            <option value="mixed">Mixed types</option>
                            <option value="multiple_choice">Multiple Choice</option>
                            <option value="short_text">Open Ended</option>
                            <option value="rating">Star Rating</option>
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Difficulty Level</label>
                        <select
                            value={difficulty}
                            onChange={(e) => setDifficulty(e.target.value as DraftDifficulty)}
                            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15"
                        >
                            <option value="introductory">Introductory</option>
                            <option value="intermediate">Intermediate</option>
                            <option value="advanced">Advanced</option>
                            <option value="mixed">Mixed</option>
                        </select>
                    </div>
                </div>

                <Button
                    onClick={handleDraft}
                    disabled={loading || !topic.trim()}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                >
                    {loading ? <Loader2 className="animate-spin mr-2 w-4 h-4" /> : <Sparkles className="mr-2 w-4 h-4" />}
                    Generate Questions
                </Button>
            </DialogContent>
        </Dialog>
    );
}

export function SessionBuilder({ session }: { session: Session }) {
    const [questions, setQuestions] = useState<Question[]>(session.questions || []);
    const [title, setTitle] = useState(session.title || "Untitled Session");
    const [deliveryMode, setDeliveryMode] = useState<SessionDeliveryMode>(session.deliveryMode || "paced");
    const [isAIOpen, setIsAIOpen] = useState(false);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates
        })
    );

    const persistSessionUpdate = async (updates: Partial<Session>) => {
        try {
            if (auth.currentUser) {
                const token = await auth.currentUser.getIdToken();
                const res = await fetch(`/api/sessions/${session.id}/update`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify(updates)
                });

                if (!res.ok) {
                    throw new Error("Update failed");
                }
                return;
            }
            throw new Error("Not authenticated");
        } catch (cloudErr) {
            console.warn("Cloud save failed, checking local...", cloudErr);
        }

        if (
            IS_DEMO_MODE &&
            session.id &&
            (session.id.startsWith("local_") || session.ownerId === "dev_lunr_ID")
        ) {
            try {
                const localSessionsStr = localStorage.getItem("harvard_poll_dev_sessions");
                if (localSessionsStr) {
                    const sessions = JSON.parse(localSessionsStr) as Session[];
                    const updatedSessions = sessions.map((existingSession) =>
                        existingSession.id === session.id ? { ...existingSession, ...updates } : existingSession
                    );
                    localStorage.setItem("harvard_poll_dev_sessions", JSON.stringify(updatedSessions));
                    return;
                }
            } catch (error) {
                console.error(error);
            }
        }

        throw new Error("Failed to save");
    };

    const saveQuestions = async (newQuestions: Question[]) => {
        setQuestions(newQuestions);
        try {
            await persistSessionUpdate({ questions: sanitizeQuestionsForFirestore(newQuestions) as Question[] });
        } catch (error) {
            console.error(error);
            toast.error("Failed to save");
        }
    };

    const addQuestion = (
        type: QuestionType,
        text = "",
        options?: string[],
        overrides: Partial<Question> = {}
    ) => {
        const newQ = createQuestion(type, text || "New Question", options, overrides);
        saveQuestions([...questions, newQ]);
    };

    const updateQuestion = (id: string, updates: Partial<Question>) => {
        const newQuestions = questions.map((q) => (q.id === id ? { ...q, ...updates } : q));
        saveQuestions(newQuestions);
    };

    const removeQuestion = (id: string) => {
        saveQuestions(questions.filter((q) => q.id !== id));
    };

    const addPreset = (preset: string) => {
        const newQuestionsToAdd: Question[] = [];
        const mkQ = (
            type: QuestionType,
            text: string,
            options?: string[],
            overrides: Partial<Question> = {}
        ) => createQuestion(type, text, options, overrides);

        if (preset === "one_minute") {
            newQuestionsToAdd.push(mkQ("short_text", "What was the most important thing you learned today?"));
            newQuestionsToAdd.push(mkQ("short_text", "What important question remains unanswered?"));
        } else if (preset === "muddiest") {
            newQuestionsToAdd.push(mkQ("short_text", "What was the 'muddiest' point in today's session?"));
        } else if (preset === "vote") {
            newQuestionsToAdd.push(
                mkQ("multiple_choice", "Vote for the best option:", ["Option A", "Option B", "Option C", "Option D"])
            );
        } else if (preset === "rate_class") {
            newQuestionsToAdd.push(mkQ("rating", "How would you rate today's class?", undefined, { purpose: "feedback" }));
        } else if (preset === "start_stop_continue") {
            newQuestionsToAdd.push(
                mkQ(
                    "short_text",
                    "START: What is one thing I am not doing in these lectures that would help you understand the material better?",
                    undefined,
                    { purpose: "feedback" }
                )
            );
            newQuestionsToAdd.push(
                mkQ(
                    "short_text",
                    "STOP: What is one thing I am doing that is distracting or makes it harder for you to follow the lecture?",
                    undefined,
                    { purpose: "feedback" }
                )
            );
            newQuestionsToAdd.push(
                mkQ(
                    "short_text",
                    "CONTINUE: What is the most helpful thing I am doing that I should keep doing for the rest of the course?",
                    undefined,
                    { purpose: "feedback" }
                )
            );
        }

        if (newQuestionsToAdd.length > 0) {
            saveQuestions([...questions, ...newQuestionsToAdd]);
        }
    };

    const handleAIDraft = async (request: DraftRequest) => {
        try {
            if (!auth.currentUser) throw new Error("Not logged in");
            const token = await auth.currentUser.getIdToken();

            const res = await fetch("/api/ai/draft", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(request)
            });

            if (!res.ok) throw new Error("Failed to generate");

            const data = await res.json();
            const rawQuestions: GeneratedDraftQuestion[] = Array.isArray(data.questions)
                ? data.questions
                : [{
                    text: data.text,
                    type: request.type === "auto" || request.type === "mixed" ? "multiple_choice" : request.type,
                    options: data.options || undefined,
                    purpose: request.purpose,
                    explanation: data.explanation,
                    correctAnswers: data.correctAnswers,
                    revealMode: request.purpose === "assessment" ? "after_submission" : "never"
                }];

            const generatedQuestions = rawQuestions.map((rawQuestion) => {
                const supportedTypes: QuestionType[] = ["multiple_choice", "short_text", "rating", "file_upload"];
                const nextType: QuestionType =
                    rawQuestion.type && supportedTypes.includes(rawQuestion.type as QuestionType)
                        ? rawQuestion.type as QuestionType
                        : "multiple_choice";

                return createQuestion(
                    nextType,
                    rawQuestion.text || "AI generated question",
                    rawQuestion.options || undefined,
                    {
                        purpose: rawQuestion.purpose || request.purpose,
                        explanation: rawQuestion.explanation || "",
                        correctAnswers: Array.isArray(rawQuestion.correctAnswers) ? rawQuestion.correctAnswers : [],
                        revealMode: rawQuestion.revealMode || (request.purpose === "assessment" ? "after_submission" : "never")
                    }
                );
            });

            saveQuestions([...questions, ...generatedQuestions]);
            toast.success(`Added ${generatedQuestions.length} AI-generated question${generatedQuestions.length === 1 ? "" : "s"}`);
        } catch (error) {
            console.error(error);
            toast.error("Failed to generate draft. Try again.");
        }
    };

    const saveTitle = async () => {
        try {
            await persistSessionUpdate({ title });
            toast.success("Title saved");
        } catch (error) {
            console.error("Failed to save title", error);
            toast.error("Failed to save title");
        }
    };

    const saveDeliveryMode = async (nextMode: SessionDeliveryMode) => {
        setDeliveryMode(nextMode);
        try {
            await persistSessionUpdate({ deliveryMode: nextMode });
        } catch (error) {
            console.error(error);
            toast.error("Failed to save launch mode");
        }
    };

    const handleLaunch = async (launchAllQuestions = false) => {
        if (questions.length === 0) {
            toast.error("Add at least one question.");
            return;
        }

        const allQuestionIds = questions.map((q) => q.id);
        const updates: Partial<Session> = {
            status: "OPEN",
            deliveryMode,
            activeQuestionIds: launchAllQuestions ? allQuestionIds : [],
            activeQuestionId: launchAllQuestions ? allQuestionIds[0] || null : null
        };

        try {
            await persistSessionUpdate(updates);
            toast.success(launchAllQuestions ? "All questions are live." : "Session is live.");

            if (IS_DEMO_MODE && session.id && (session.id.startsWith("local_") || session.ownerId === "dev_lunr_ID")) {
                window.location.reload();
            }
        } catch (error) {
            console.warn("Launch failed", error);
            toast.error("Failed to launch");
        }
    };

    function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            const oldIndex = questions.findIndex((q) => q.id === active.id);
            const newIndex = questions.findIndex((q) => q.id === over.id);
            saveQuestions(arrayMove(questions, oldIndex, newIndex));
        }
    }

    return (
        <div className="max-w-5xl mx-auto space-y-8 p-6">
            <header className="flex flex-col gap-6 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                    <div className="flex-1 text-center md:text-left">
                        <Input
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            onBlur={saveTitle}
                            className="h-auto border-transparent px-0 text-2xl font-bold text-slate-800 hover:border-slate-200 focus:border-primary"
                        />
                        <p className="mt-1 font-mono text-sm text-slate-500">Code: {session.code}</p>
                    </div>

                    <div className="flex w-full flex-col gap-3 md:w-auto md:flex-row">
                        <Button
                            size="lg"
                            variant="outline"
                            onClick={() => handleLaunch(true)}
                            className="w-full rounded-xl border-slate-200 md:w-auto"
                        >
                            <Layers3 className="mr-2 w-5 h-5" /> Launch All Questions
                        </Button>
                        <Button
                            size="lg"
                            onClick={() => handleLaunch(false)}
                            className="w-full rounded-xl bg-primary text-white shadow-lg transition-all hover:bg-rose-800 hover:shadow-xl md:w-auto"
                        >
                            <Rocket className="mr-2 w-5 h-5" />
                            {deliveryMode === "self_paced" ? "Launch Self-Paced Poll" : "Launch Session"}
                        </Button>
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    {(["paced", "self_paced"] as SessionDeliveryMode[]).map((mode) => {
                        const copy = DELIVERY_MODE_COPY[mode];
                        const isSelected = deliveryMode === mode;

                        return (
                            <button
                                key={mode}
                                type="button"
                                onClick={() => saveDeliveryMode(mode)}
                                className={`rounded-2xl border p-4 text-left transition-all ${
                                    isSelected
                                        ? "border-primary bg-rose-50 shadow-sm"
                                        : "border-slate-200 bg-white hover:border-slate-300"
                                }`}
                            >
                                <div className="text-sm font-semibold text-slate-900">{copy.title}</div>
                                <p className="mt-1 text-sm text-slate-500">{copy.description}</p>
                            </button>
                        );
                    })}
                </div>
            </header>

            <div className="grid grid-cols-1 gap-8 md:grid-cols-[320px_1fr]">
                <aside className="space-y-6">
                    <Card className="border-slate-200 shadow-sm">
                        <div className="border-b border-slate-100 p-4 font-medium text-slate-700">Presets</div>
                        <CardContent className="space-y-3 p-4">
                            <Button
                                variant="ghost"
                                className="w-full justify-start text-slate-600"
                                onClick={() => addPreset("start_stop_continue")}
                            >
                                Start, Stop, Continue
                            </Button>
                            <Button
                                variant="ghost"
                                className="w-full justify-start text-slate-600"
                                onClick={() => addPreset("rate_class")}
                            >
                                Rate the Class
                            </Button>
                            <Button
                                variant="ghost"
                                className="w-full justify-start text-slate-600"
                                onClick={() => addPreset("vote")}
                            >
                                Polling / Vote
                            </Button>
                            <Button
                                variant="ghost"
                                className="w-full justify-start text-slate-600"
                                onClick={() => addPreset("one_minute")}
                            >
                                One-Minute Paper
                            </Button>
                        </CardContent>
                    </Card>

                    <Card className="border-slate-200 shadow-sm">
                        <div className="flex items-center justify-between border-b border-slate-100 p-4 font-medium text-slate-700">
                            Add Question
                            <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 text-purple-600 hover:bg-purple-50 hover:text-purple-700"
                                onClick={() => setIsAIOpen(true)}
                            >
                                <Sparkles className="mr-1 h-3 w-3" /> AI Generator
                            </Button>
                        </div>
                        <CardContent className="space-y-3 p-4">
                            <Button variant="outline" className="w-full justify-start" onClick={() => addQuestion("short_text")}>
                                <Plus className="mr-2 w-4 h-4" /> Open Ended
                            </Button>
                            <Button variant="outline" className="w-full justify-start" onClick={() => addQuestion("multiple_choice")}>
                                <Plus className="mr-2 w-4 h-4" /> Multiple Choice
                            </Button>
                            <Button
                                variant="outline"
                                className="w-full justify-start"
                                onClick={() =>
                                    addQuestion("multiple_choice", "Check for understanding:", ["Option A", "Option B", "Option C", "Option D"], {
                                        purpose: "assessment",
                                        revealMode: "after_submission"
                                    })
                                }
                            >
                                <Plus className="mr-2 w-4 h-4" /> Quick Check Quiz
                            </Button>
                            <Button
                                variant="outline"
                                className="w-full justify-start"
                                onClick={() => addQuestion("multiple_choice", "Do you agree?", ["Yes", "No"])}
                            >
                                <Plus className="mr-2 w-4 h-4" /> Yes / No Poll
                            </Button>
                            <Button
                                variant="outline"
                                className="w-full justify-start"
                                onClick={() => addQuestion("rating", "How confident do you feel right now?", undefined, { purpose: "feedback" })}
                            >
                                <Plus className="mr-2 w-4 h-4" /> Confidence Rating
                            </Button>
                            <Button
                                variant="outline"
                                className="w-full justify-start"
                                onClick={() => addQuestion("file_upload")}
                            >
                                <Plus className="mr-2 w-4 h-4" /> File Upload
                            </Button>
                        </CardContent>
                    </Card>
                </aside>

                <div className="space-y-4">
                    {questions.length === 0 && (
                        <div className="rounded-2xl border border-dashed border-slate-200 bg-white py-20 text-center text-slate-400">
                            Add questions to build your session.
                        </div>
                    )}

                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                        <SortableContext items={questions.map((q) => q.id)} strategy={verticalListSortingStrategy}>
                            {questions.map((q) => (
                                <SortableQuestionItem
                                    key={q.id}
                                    q={q}
                                    updateQuestion={updateQuestion}
                                    removeQuestion={removeQuestion}
                                />
                            ))}
                        </SortableContext>
                    </DndContext>
                </div>
            </div>

            <AIDraftDialog
                open={isAIOpen}
                onOpenChange={setIsAIOpen}
                onDraft={handleAIDraft}
            />
        </div>
    );
}
