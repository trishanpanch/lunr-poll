"use client";

import { Session, Question, QuestionType } from "@/lib/types";
import { IS_DEMO_MODE } from "@/lib/config";
import { auth } from "@/lib/firebase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Trash2, Plus, GripVertical, Rocket, Sparkles, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
import { RichText } from "@/components/ui/RichText";

// Forcing uuid import/polyfil might be annoying in client. I can use crypto.randomUUID() or Math.random.
// Or just let Firestore handle if collection, but questions are array.
// I'll use simple random id.

const generateId = () => Math.random().toString(36).substr(2, 9);

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

    return (
        <div ref={setNodeRef} style={style} className="mb-4">
            <Card className="relative group border-slate-200">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-slate-200 rounded-l-xl group-hover:bg-primary transition-colors"></div>
                <CardContent className="p-6 space-y-4">
                    <div className="flex items-start gap-4">
                        <div
                            {...attributes}
                            {...listeners}
                            className="mt-3 cursor-move text-slate-300 hover:text-slate-500 touch-none outline-none"
                        >
                            <GripVertical className="w-5 h-5" />
                        </div>
                        <div className="flex-1 space-y-4">
                            <div className="flex justify-between items-start">
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                                    {q.type.replace("_", " ")}
                                </span>
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

                            {q.type === "multiple_choice" && (
                                <div className="space-y-2 pl-4 border-l-2 border-slate-100">
                                    {q.options?.map((opt, optIdx) => (
                                        <div key={optIdx} className="flex items-center gap-2">
                                            <div className="w-4 h-4 rounded-full border border-slate-300"></div>
                                            <Input
                                                value={opt}
                                                onChange={(e) => {
                                                    const newOpts = [...(q.options || [])];
                                                    newOpts[optIdx] = e.target.value;
                                                    updateQuestion(q.id, { options: newOpts });
                                                }}
                                                className="h-8 text-sm"
                                            />
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-slate-300 hover:text-red-500"
                                                onClick={() => {
                                                    const newOpts = q.options?.filter((_, i) => i !== optIdx);
                                                    updateQuestion(q.id, { options: newOpts });
                                                }}
                                            >
                                                <Trash2 className="w-3 h-3" />
                                            </Button>
                                        </div>
                                    ))}
                                    <div className="mt-2 text-xs text-slate-400 pl-6">
                                        <span className="font-semibold">Preview:</span>
                                        <RichText content={q.text} className="inline-block align-top ml-2 text-slate-600" />
                                    </div>
                                    <Button
                                        variant="link"
                                        size="sm"
                                        className="text-primary p-0 h-auto"
                                        onClick={() =>
                                            updateQuestion(q.id, {
                                                options: [...(q.options || []), `Option ${q.options!.length + 1}`]
                                            })
                                        }
                                    >
                                        + Add Option
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

function MagicDraftDialog({
    open,
    onOpenChange,
    onDraft
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onDraft: (topic: string, type: QuestionType) => Promise<void>;
}) {
    const [topic, setTopic] = useState("");
    const [loading, setLoading] = useState(false);
    const [type, setType] = useState<QuestionType>("multiple_choice");

    const handleDraft = async () => {
        if (!topic.trim()) return;
        setLoading(true);
        await onDraft(topic, type);
        setLoading(false);
        onOpenChange(false);
        setTopic("");
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 font-serif">
                        <Sparkles className="w-5 h-5 text-purple-600" />
                        Magic Draft
                    </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Topic or Concept</label>
                        <Input
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                            placeholder="e.g. keynesian economics, mitochondria, supply and demand..."
                            autoFocus
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Activity Type</label>
                        <select
                            value={type}
                            onChange={(e) => setType(e.target.value as QuestionType)}
                            className="w-full h-10 px-3 rounded-md border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        >
                            <option value="multiple_choice">Multiple Choice</option>
                            <option value="short_text">Short Text / Open Ended</option>
                        </select>
                    </div>
                    <Button onClick={handleDraft} disabled={loading || !topic.trim()} className="w-full bg-purple-600 hover:bg-purple-700 text-white">
                        {loading ? <Loader2 className="animate-spin mr-2 w-4 h-4" /> : <Sparkles className="mr-2 w-4 h-4" />}
                        Generate Question
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

export function SessionBuilder({ session }: { session: Session }) {
    const [questions, setQuestions] = useState<Question[]>(session.questions || []);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates
        })
    );

    const saveQuestions = async (newQuestions: Question[]) => {
        setQuestions(newQuestions);

        // Sanitize questions for Firestore (no undefined allowed)
        const sanitizedQuestions = newQuestions.map((q) => ({
            ...q,
            options: q.options === undefined ? null : q.options
        }));

        // Try Cloud First via API (Server-Side)
        try {
            if (auth.currentUser) {
                const token = await auth.currentUser.getIdToken();
                const res = await fetch(`/api/sessions/${session.id}/update`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify({ questions: sanitizedQuestions })
                });

                if (!res.ok) {
                    throw new Error("Update failed");
                }
                return; // Success
            } else {
                throw new Error("Not authenticated");
            }
        } catch (cloudErr) {
            console.warn("Cloud save failed, checking local...", cloudErr);
        }

        // Local Demo Mode Write Fallback
        if (
            IS_DEMO_MODE &&
            session.id &&
            (session.id.startsWith("local_") || session.ownerId === "dev_lunr_ID")
        ) {
            try {
                const localSessionsStr = localStorage.getItem("harvard_poll_dev_sessions");
                if (localSessionsStr) {
                    const sessions = JSON.parse(localSessionsStr) as Session[];
                    const updatedSessions = sessions.map((s) =>
                        s.id === session.id ? { ...s, questions: newQuestions } : s
                    );
                    localStorage.setItem("harvard_poll_dev_sessions", JSON.stringify(updatedSessions));
                    toast.success("Saved locally");
                }
            } catch (e) {
                console.error(e);
                toast.error("Failed to save local session");
            }
            return;
        }

        toast.error("Failed to save");
    };

    const addQuestion = (type: QuestionType, text = "", options?: string[]) => {
        const newQ: Question = {
            id: generateId(),
            text: text || "New Question",
            type,
            options: options || (type === "multiple_choice" ? ["Option A", "Option B"] : undefined)
        };
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
        const mkQ = (type: QuestionType, text: string, options?: string[]): Question => ({
            id: generateId() + Math.random().toString(36).substr(2, 4), // extra random to avoid ID collision in batch
            text,
            type,
            options: options || (type === "multiple_choice" ? ["Option A", "Option B"] : undefined)
        });

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
            newQuestionsToAdd.push(mkQ("rating", "How would you rate today's class?"));
        } else if (preset === "start_stop_continue") {
            newQuestionsToAdd.push(
                mkQ(
                    "short_text",
                    "START: What is one thing I am not doing in these lectures that would help you understand the material better? (e.g., more live polls, specific case studies)"
                )
            );
            newQuestionsToAdd.push(
                mkQ(
                    "short_text",
                    "STOP: What is one thing I am doing that is distracting or makes it harder for you to follow the lecture? (e.g., moving too fast through slides, over-technical jargon)"
                )
            );
            newQuestionsToAdd.push(
                mkQ(
                    "short_text",
                    "CONTINUE: What is the most helpful thing I am doing that I should keep doing for the rest of the course? (e.g., the real-world AI examples, the Q&A breaks)"
                )
            );
        }

        if (newQuestionsToAdd.length > 0) {
            saveQuestions([...questions, ...newQuestionsToAdd]);
        }
    };

    const [isMagicOpen, setIsMagicOpen] = useState(false);

    const handleMagicDraft = async (topic: string, type: QuestionType) => {
        try {
            if (!auth.currentUser) throw new Error("Not logged in");
            const token = await auth.currentUser.getIdToken();

            const res = await fetch("/api/ai/draft", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ topic, type })
            });

            if (!res.ok) throw new Error("Failed to generate");

            const data = await res.json();

            const newQ: Question = {
                id: generateId(),
                text: data.text,
                type,
                options: data.options || (type === "multiple_choice" ? ["Option A", "Option B"] : undefined)
            };

            saveQuestions([...questions, newQ]);
            toast.success("Magic Draft created!");
        } catch (e) {
            console.error(e);
            toast.error("Failed to generate draft. Try again.");
        }
    };

    const [title, setTitle] = useState(session.title || "Untitled Session");

    const saveTitle = async () => {
        try {
            if (auth.currentUser) {
                const token = await auth.currentUser.getIdToken();
                await fetch(`/api/sessions/${session.id}/update`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify({ title })
                });
                toast.success("Title saved");
            }
        } catch (e) {
            console.error("Failed to save title", e);
            toast.error("Failed to save title");
        }
    };

    const handleLaunch = async () => {
        if (questions.length === 0) {
            toast.error("Add at least one question.");
            return;
        }

        // Try Cloud Launch First via API
        try {
            if (auth.currentUser) {
                const token = await auth.currentUser.getIdToken();
                const res = await fetch(`/api/sessions/${session.id}/update`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify({ status: "OPEN" })
                });

                if (!res.ok) throw new Error("Launch failed");

                toast.success("Session is LIVE!");
                return;
            }
        } catch (e) {
            console.warn("Cloud launch failed, trying local", e);
        }

        // Local Demo Mode Launch Fallback
        if (IS_DEMO_MODE && session.id && (session.id.startsWith("local_") || session.ownerId === "dev_lunr_ID")) {
            const localSessionsStr = localStorage.getItem("harvard_poll_dev_sessions");
            if (localSessionsStr) {
                const sessions = JSON.parse(localSessionsStr) as Session[];
                const updatedSessions = sessions.map((s) =>
                    s.id === session.id ? { ...s, status: "OPEN" as const } : s
                );
                localStorage.setItem("harvard_poll_dev_sessions", JSON.stringify(updatedSessions));
                toast.success("Session is LIVE (Local)!");
                window.location.reload(); // Simple reload to refresh parent state
            }
            return;
        }

        toast.error("Failed to launch");
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
        <div className="max-w-4xl mx-auto space-y-8 p-6">
            <header className="flex flex-col md:flex-row justify-between items-center gap-6 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <div className="text-center md:text-left flex-1">
                    <Input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        onBlur={saveTitle}
                        className="text-2xl font-serif font-bold text-slate-800 border-transparent hover:border-slate-200 focus:border-primary px-0 h-auto"
                    />
                    <p className="text-slate-500 font-mono text-sm mt-1">Code: {session.code}</p>
                </div>
                <div className="flex gap-3 w-full md:w-auto">
                    <Button
                        size="lg"
                        onClick={handleLaunch}
                        className="w-full md:w-auto bg-primary hover:bg-rose-800 text-white rounded-xl shadow-lg hover:shadow-xl transition-all"
                    >
                        <Rocket className="mr-2 w-5 h-5" /> Launch Session
                    </Button>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-8">
                <aside className="space-y-6">
                    <Card className="border-slate-200 shadow-sm">
                        <div className="p-4 border-b border-slate-100 font-medium text-slate-700">Presets</div>
                        <CardContent className="p-4 space-y-3">
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
                        </CardContent>
                    </Card>

                    <Card className="border-slate-200 shadow-sm">
                        <div className="p-4 border-b border-slate-100 font-medium text-slate-700 flex justify-between items-center">
                            Add Question
                            <Button size="sm" variant="ghost" className="h-6 text-purple-600 hover:text-purple-700 hover:bg-purple-50" onClick={() => setIsMagicOpen(true)}>
                                <Sparkles className="w-3 h-3 mr-1" /> Magic
                            </Button>
                        </div>
                        <CardContent className="p-4 space-y-3">
                            <Button
                                variant="outline"
                                className="w-full justify-start"
                                onClick={() => addQuestion("short_text")}
                            >
                                <Plus className="mr-2 w-4 h-4" /> Short Text
                            </Button>
                            <Button
                                variant="outline"
                                className="w-full justify-start"
                                onClick={() => addQuestion("multiple_choice")}
                            >
                                <Plus className="mr-2 w-4 h-4" /> Multiple Choice
                            </Button>
                            <Button
                                variant="outline"
                                className="w-full justify-start"
                                onClick={() => addQuestion("file_upload")}
                            >
                                <Plus className="mr-2 w-4 h-4" /> File Upload
                            </Button>
                            <Button
                                variant="outline"
                                className="w-full justify-start"
                                onClick={() => addQuestion("rating")}
                            >
                                <Plus className="mr-2 w-4 h-4" /> Star Rating
                            </Button>
                        </CardContent>
                    </Card>
                </aside>

                <div className="space-y-4">
                    {questions.length === 0 && (
                        <div className="text-center py-20 text-slate-400 bg-white rounded-2xl border border-dashed border-slate-200">
                            Add questions to build your session.
                        </div>
                    )}

                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                    >
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

            <MagicDraftDialog
                open={isMagicOpen}
                onOpenChange={setIsMagicOpen}
                onDraft={handleMagicDraft}
            />
        </div>
    );
}
