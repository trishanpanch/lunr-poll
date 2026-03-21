"use client";

import { Session, Question, QuestionType } from "@/lib/types";
import { isDemoSession, updateLocalSession } from "@/lib/storage";
import { auth } from "@/lib/firebase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Rocket } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
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
} from "@dnd-kit/sortable";
import { SortableQuestionItem } from "./SortableQuestionItem";
import { Sidebar } from "./Sidebar";

const generateId = () => Math.random().toString(36).substr(2, 9);

export function SessionBuilder({ session }: { session: Session }) {
    const [questions, setQuestions] = useState<Question[]>(session.questions || []);
    const [title, setTitle] = useState(session.title || "Untitled Session");

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates
        })
    );

    const saveQuestions = async (newQuestions: Question[]) => {
        setQuestions(newQuestions);

        const sanitizedQuestions = newQuestions.map((q) => ({
            ...q,
            options: q.options === undefined ? null : q.options
        }));

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
                return;
            } else {
                throw new Error("Not authenticated");
            }
        } catch (cloudErr) {
            console.warn("Cloud save failed, checking local...", cloudErr);
        }

        if (isDemoSession(session)) {
            try {
                updateLocalSession(session.id!, { questions: newQuestions });
                toast.success("Saved locally");
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
            id: generateId() + Math.random().toString(36).substr(2, 4),
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
                mkQ("short_text", "START: What is one thing I am not doing in these lectures that would help you understand the material better? (e.g., more live polls, specific case studies)")
            );
            newQuestionsToAdd.push(
                mkQ("short_text", "STOP: What is one thing I am doing that is distracting or makes it harder for you to follow the lecture? (e.g., moving too fast through slides, over-technical jargon)")
            );
            newQuestionsToAdd.push(
                mkQ("short_text", "CONTINUE: What is the most helpful thing I am doing that I should keep doing for the rest of the course? (e.g., the real-world AI examples, the Q&A breaks)")
            );
        }

        if (newQuestionsToAdd.length > 0) {
            saveQuestions([...questions, ...newQuestionsToAdd]);
        }
    };

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

        if (isDemoSession(session)) {
            updateLocalSession(session.id!, { status: "OPEN" });
            toast.success("Session is LIVE (Local)!");
            window.location.reload();
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
                <Sidebar onAddQuestion={addQuestion} onAddPreset={addPreset} />

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
        </div>
    );
}
