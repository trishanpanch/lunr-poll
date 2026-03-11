"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
    Users,
    StopCircle,
    QrCode,
    Loader2,
    Bot,
    Plus,
    Play,
    Trash2,
    ArrowLeft,
    Layers3
} from "lucide-react";
import { collection, onSnapshot, query } from "firebase/firestore";
import { toast } from "sonner";
import { Session, Question, StudentResponse } from "@/lib/types";
import { db, auth } from "@/lib/firebase/client";
import { IS_DEMO_MODE } from "@/lib/config";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { SessionQR } from "@/components/professor/SessionQR";
import { StarRating } from "@/components/ui/StarRating";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart as ResultsBarChart } from "@/components/presentation/BarChart";

type LiveQuestionType = "short_text" | "multiple_choice" | "file_upload" | "rating";

function isLocalSession(session: Session) {
    return !!session.id && (session.id.startsWith("local_") || session.ownerId === "dev_lunr_ID");
}

function sanitizeQuestions(questions: Question[]) {
    return questions.map((question) => ({
        ...question,
        options: question.options ?? null,
        purpose: question.purpose ?? null,
        correctAnswers: question.correctAnswers ?? null,
        explanation: question.explanation ?? null,
        revealMode: question.revealMode ?? null
    }));
}

export function LiveDashboard({ session }: { session: Session }) {
    const [responses, setResponses] = useState<StudentResponse[]>([]);
    const [analyzing, setAnalyzing] = useState(false);
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [newQText, setNewQText] = useState("");
    const [newQType, setNewQType] = useState<LiveQuestionType>("short_text");
    const [newQOptions, setNewQOptions] = useState<string[]>(["Option 1", "Option 2"]);

    useEffect(() => {
        if (session.id && session.id.startsWith("local_")) {
            return;
        }

        const liveResponses = query(collection(db, "sessions", session.id!, "responses"));
        const unsubscribe = onSnapshot(
            liveResponses,
            (snapshot) => {
                const list = snapshot.docs.map((docSnapshot) => docSnapshot.data() as StudentResponse);
                setResponses(list);
            },
            (error) => {
                console.error("LiveDashboard Error:", error);
            }
        );

        return () => unsubscribe();
    }, [session.id]);

    const persistSessionUpdate = async (updates: Partial<Session>) => {
        try {
            if (!session.id) throw new Error("Missing session id");

            if (!session.id.startsWith("local_")) {
                const token = await auth.currentUser?.getIdToken();
                const response = await fetch(`/api/sessions/${session.id}/update`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify(updates)
                });

                if (!response.ok) {
                    throw new Error("Session update failed");
                }
                return;
            }
        } catch (error) {
            console.warn("Cloud update failed, trying local", error);
        }

        if (IS_DEMO_MODE && isLocalSession(session)) {
            const localSessionsStr = localStorage.getItem("harvard_poll_dev_sessions");
            if (!localSessionsStr) throw new Error("Missing local sessions");

            const sessions = JSON.parse(localSessionsStr) as Session[];
            const updatedSessions = sessions.map((existingSession) =>
                existingSession.id === session.id ? { ...existingSession, ...updates } : existingSession
            );
            localStorage.setItem("harvard_poll_dev_sessions", JSON.stringify(updatedSessions));
            window.location.reload();
            return;
        }

        throw new Error("Unable to save session updates");
    };

    const handleAddQuestion = async () => {
        if (!newQText.trim()) return;

        const newQuestion: Question = {
            id: Math.random().toString(36).substr(2, 9),
            text: newQText.trim(),
            type: newQType,
            options: newQType === "multiple_choice" ? newQOptions : undefined,
            purpose: "discussion",
            correctAnswers: [],
            explanation: "",
            revealMode: "never"
        };

        try {
            await persistSessionUpdate({
                questions: sanitizeQuestions([...(session.questions || []), newQuestion]) as Question[]
            });
            setIsAddOpen(false);
            setNewQText("");
            setNewQOptions(["Option 1", "Option 2"]);
            toast.success("Question added!");
        } catch (error) {
            console.error(error);
            toast.error("Failed to add question");
        }
    };

    const toggleActiveQuestion = async (questionId: string) => {
        const currentActiveIds = new Set(
            session.activeQuestionIds || (session.activeQuestionId ? [session.activeQuestionId] : [])
        );

        if (session.deliveryMode === "self_paced") {
            toast.message("This poll is in self-paced mode, so all questions are already visible to students.");
            return;
        }

        let nowActive = false;
        if (currentActiveIds.has(questionId)) {
            currentActiveIds.delete(questionId);
        } else {
            currentActiveIds.add(questionId);
            nowActive = true;
        }

        const newActiveIds = Array.from(currentActiveIds);

        try {
            await persistSessionUpdate({
                activeQuestionIds: newActiveIds,
                activeQuestionId: newActiveIds.length > 0 ? newActiveIds[newActiveIds.length - 1] : null
            });
            toast.success(nowActive ? "Question is now live." : "Question hidden.");
        } catch (error) {
            console.error(error);
            toast.error("Failed to update status");
        }
    };

    const launchAllQuestions = async () => {
        const allQuestionIds = session.questions.map((question) => question.id);

        try {
            await persistSessionUpdate({
                activeQuestionIds: allQuestionIds,
                activeQuestionId: allQuestionIds[0] || null
            });
            toast.success("All questions are now live.");
        } catch (error) {
            console.error(error);
            toast.error("Failed to launch all questions");
        }
    };

    const deleteQuestion = async (questionId: string) => {
        const updatedQuestions = session.questions.filter((question) => question.id !== questionId);

        try {
            await persistSessionUpdate({
                questions: sanitizeQuestions(updatedQuestions) as Question[]
            });
            toast.success("Question deleted");
        } catch (error) {
            console.error(error);
            toast.error("Failed to delete");
        }
    };

    const closeSession = async () => {
        setAnalyzing(true);

        try {
            await persistSessionUpdate({
                status: "CLOSED",
                activeQuestionId: null,
                activeQuestionIds: []
            });
            toast.success("Session closed. Review the report for next steps.");
        } catch (error) {
            console.error(error);
            toast.error("Failed to close session");
        } finally {
            setAnalyzing(false);
        }
    };

    const getAggregatedData = (question: Question) => {
        if (question.type !== "multiple_choice") return [];

        const counts: Record<string, number> = {};
        question.options?.forEach((option) => {
            counts[option] = 0;
        });

        responses.forEach((response) => {
            const answer = response.answers?.[question.id];
            if (answer && counts[answer] !== undefined) {
                counts[answer]++;
            }
        });

        return Object.entries(counts).map(([name, value]) => ({
            name,
            value,
            isCorrect: (question.correctAnswers || []).includes(name)
        }));
    };

    const getTextAnswers = (questionId: string) => {
        return responses
            .map((response) => response.answers?.[questionId])
            .filter((answer): answer is string => !!answer && !answer.startsWith("http"))
            .slice(-5);
    };

    return (
        <div className="max-w-6xl mx-auto space-y-6 p-6">
            <header className="flex flex-col items-center justify-between gap-6 rounded-2xl bg-slate-900 p-6 text-white shadow-lg md:flex-row">
                <div className="flex flex-col items-center gap-6 text-center md:flex-row md:text-left">
                    <Link
                        href="/professor/dashboard"
                        className="rounded-full bg-slate-800 p-2 transition-colors hover:bg-slate-700 md:mr-4"
                    >
                        <ArrowLeft className="h-5 w-5 text-slate-300" />
                    </Link>

                    <div className="text-center md:text-left">
                        <div className="text-xs font-bold uppercase tracking-widest text-slate-400">Join Code</div>
                        <div className="text-5xl font-bold tracking-widest font-mono">{session.code}</div>
                        {session.title && <div className="mt-1 text-lg font-bold font-serif text-slate-300">{session.title}</div>}
                        <div className="mt-2 inline-flex rounded-full bg-slate-800 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-300">
                            {session.deliveryMode === "self_paced" ? "Self-Paced Poll" : "Paced Live Poll"}
                        </div>
                    </div>

                    <div className="hidden h-12 w-px bg-slate-700 md:block" />

                    <div className="flex items-center gap-3">
                        <div className="rounded-full bg-rose-600 p-3 animate-pulse">
                            <Users className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <div className="text-3xl font-bold font-serif">{responses.length}</div>
                            <div className="text-xs text-slate-400">Active Students</div>
                        </div>
                    </div>
                </div>

                <div className="flex w-full flex-col gap-4 md:w-auto md:flex-row">
                    <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                        <DialogTrigger asChild>
                            <Button size="lg" className="w-full rounded-xl border-0 bg-indigo-600 px-6 text-lg font-bold text-white hover:bg-indigo-700 md:w-auto">
                                <Plus className="mr-2 h-6 w-6" /> Add Question
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <div className="space-y-4">
                                <h3 className="text-lg font-bold font-serif">Add Live Question</h3>
                                <div className="space-y-2">
                                    <Label>Question Text</Label>
                                    <Input
                                        value={newQText}
                                        onChange={(event) => setNewQText(event.target.value)}
                                        placeholder="What do you want to ask?"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Type</Label>
                                    <Select value={newQType} onValueChange={(value) => setNewQType(value as LiveQuestionType)}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="short_text">Short Text</SelectItem>
                                            <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                                            <SelectItem value="rating">Star Rating</SelectItem>
                                            <SelectItem value="file_upload">File Upload</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                {newQType === "multiple_choice" && (
                                    <div className="space-y-2">
                                        <Label>Options</Label>
                                        {newQOptions.map((option, index) => (
                                            <div key={`${option}-${index}`} className="flex gap-2">
                                                <Input
                                                    value={option}
                                                    onChange={(event) => {
                                                        const nextOptions = [...newQOptions];
                                                        nextOptions[index] = event.target.value;
                                                        setNewQOptions(nextOptions);
                                                    }}
                                                />
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => setNewQOptions(newQOptions.filter((_, optionIndex) => optionIndex !== index))}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        ))}
                                        <Button variant="link" onClick={() => setNewQOptions([...newQOptions, `Option ${newQOptions.length + 1}`])}>
                                            + Add Option
                                        </Button>
                                    </div>
                                )}
                                <Button onClick={handleAddQuestion} className="w-full">
                                    Add Question
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>

                    <Button
                        variant="outline"
                        size="lg"
                        onClick={launchAllQuestions}
                        className="w-full rounded-xl border-slate-700 bg-slate-800 px-6 text-lg font-bold text-slate-300 hover:bg-slate-700 hover:text-white md:w-auto"
                    >
                        <Layers3 className="mr-2 h-6 w-6" /> Launch All
                    </Button>

                    <Dialog>
                        <DialogTrigger asChild>
                            <Button
                                variant="outline"
                                size="lg"
                                className="w-full rounded-xl border-slate-700 bg-slate-800 px-6 text-lg font-bold text-slate-300 hover:bg-slate-700 hover:text-white md:w-auto"
                            >
                                <QrCode className="mr-2 h-6 w-6" /> Share
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md">
                            <SessionQR sessionCode={session.code} sessionId={session.id} />
                        </DialogContent>
                    </Dialog>

                    <Button
                        variant="destructive"
                        size="lg"
                        onClick={closeSession}
                        disabled={analyzing}
                        className="w-full rounded-xl px-8 text-lg font-bold md:w-auto"
                    >
                        {analyzing ? (
                            <>
                                <Loader2 className="mr-2 h-6 w-6 animate-spin" /> Closing...
                            </>
                        ) : (
                            <>
                                <StopCircle className="mr-2 h-6 w-6" /> Close
                            </>
                        )}
                    </Button>
                </div>
            </header>

            <div className="grid grid-cols-1 gap-6">
                {session.questions.map((question) => {
                    const analysis = session.analysis?.[question.id];
                    const isActive = session.deliveryMode === "self_paced"
                        ? true
                        : session.activeQuestionIds
                            ? session.activeQuestionIds.includes(question.id)
                            : session.activeQuestionId === question.id;

                    return (
                        <Card key={question.id} className="overflow-hidden border-slate-200 shadow-sm">
                            <CardHeader className="flex flex-row items-start justify-between border-b border-slate-100 bg-slate-50 pb-3">
                                <div className="space-y-2">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <CardTitle className="font-serif text-xl">{question.text}</CardTitle>
                                        <span
                                            className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                                                isActive
                                                    ? "bg-rose-100 text-rose-700"
                                                    : "bg-slate-100 text-slate-500"
                                            }`}
                                        >
                                            {isActive ? "Visible to students" : "Hidden"}
                                        </span>
                                        {question.purpose === "assessment" && (
                                            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-700">
                                                Assessment
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    <Button
                                        variant={isActive ? "destructive" : "default"}
                                        size="sm"
                                        onClick={() => toggleActiveQuestion(question.id)}
                                        disabled={session.deliveryMode === "self_paced"}
                                        className={isActive ? "bg-rose-600 text-white hover:bg-rose-700" : "bg-indigo-600 text-white hover:bg-indigo-700"}
                                    >
                                        {isActive ? (
                                            <>
                                                <StopCircle className="mr-2 h-4 w-4" /> Hide
                                            </>
                                        ) : (
                                            <>
                                                <Play className="mr-2 h-4 w-4" /> Show Live
                                            </>
                                        )}
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => deleteQuestion(question.id)}
                                        className="text-slate-400 hover:bg-red-50 hover:text-red-600"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </CardHeader>

                            <CardContent className="p-6">
                                {question.type === "multiple_choice" ? (
                                    getAggregatedData(question).length > 0 ? (
                                        <ResultsBarChart
                                            data={getAggregatedData(question)}
                                            total={Math.max(responses.length, 1)}
                                            showCorrect={question.purpose === "assessment"}
                                        />
                                    ) : (
                                        <p className="italic text-slate-400">Waiting for responses...</p>
                                    )
                                ) : question.type === "short_text" ? (
                                    <div className="space-y-4">
                                        {analysis && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className="space-y-3 rounded-xl border border-violet-100 bg-violet-50 p-5"
                                            >
                                                <div className="flex items-center gap-2 font-bold font-serif text-violet-700">
                                                    <Bot className="h-5 w-5" /> LUNR AI Insights
                                                </div>

                                                <div className="border-l-2 border-violet-200 pl-3 text-sm italic text-slate-700">
                                                    &quot;{analysis.consensus}&quot;
                                                </div>

                                                <div className="grid gap-4 pt-2 md:grid-cols-2">
                                                    <div>
                                                        <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                                                            Distribution
                                                        </h4>
                                                        <p className="text-sm text-slate-700">{analysis.distribution_analysis}</p>
                                                    </div>
                                                    <div>
                                                        <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                                                            Key Inferences
                                                        </h4>
                                                        <ul className="list-inside list-disc space-y-1 text-sm text-slate-700">
                                                            {analysis.key_inferences?.map((inference: string, index: number) => (
                                                                <li key={index}>{inference}</li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                </div>

                                                {analysis.outlier_insight && (
                                                    <div className="rounded-lg border border-violet-100 bg-white p-3 text-sm text-slate-600">
                                                        <span className="font-bold text-violet-600">Outlier:</span> {analysis.outlier_insight}
                                                    </div>
                                                )}
                                            </motion.div>
                                        )}

                                        <div className="space-y-2">
                                            <AnimatePresence>
                                                {getTextAnswers(question.id).map((answer, index) => (
                                                    <motion.div
                                                        key={`${question.id}-${index}`}
                                                        initial={{ opacity: 0, x: -10 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        className={`rounded-lg border p-3 text-lg font-medium ${
                                                            index === 0
                                                                ? "border-primary/20 bg-white text-slate-800 shadow-sm"
                                                                : "border-transparent bg-slate-50 text-slate-500"
                                                        }`}
                                                    >
                                                        &quot;{answer}&quot;
                                                    </motion.div>
                                                ))}
                                            </AnimatePresence>
                                            {getTextAnswers(question.id).length === 0 && (
                                                <p className="italic text-slate-400">No responses yet...</p>
                                            )}
                                        </div>
                                    </div>
                                ) : question.type === "rating" ? (
                                    <div className="flex flex-col gap-8 py-4 md:flex-row md:items-center">
                                        {(() => {
                                            const values = responses
                                                .map((response) => response.answers ? parseFloat(response.answers[question.id] || "0") : 0)
                                                .filter((value) => value > 0);

                                            const average = values.length > 0
                                                ? values.reduce((sum, value) => sum + value, 0) / values.length
                                                : 0;

                                            const counts: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
                                            values.forEach((value) => {
                                                const bucket = Math.round(value);
                                                if (bucket >= 1 && bucket <= 5) counts[bucket]++;
                                            });

                                            return (
                                                <>
                                                    <div className="flex flex-col items-center">
                                                        <div className="text-6xl font-bold font-serif text-slate-800">{average.toFixed(1)}</div>
                                                        <div className="mb-2">
                                                            <StarRating value={average} readOnly size="lg" />
                                                        </div>
                                                        <div className="text-sm text-slate-400">{values.length} responses</div>
                                                    </div>

                                                    <div className="w-full flex-1 space-y-3">
                                                        {[5, 4, 3, 2, 1].map((star) => {
                                                            const count = counts[star];
                                                            const percentage = values.length > 0 ? Math.round((count / values.length) * 100) : 0;
                                                            return (
                                                                <div key={star} className="flex items-center gap-3">
                                                                    <span className="w-16 shrink-0 text-sm font-medium text-slate-600">
                                                                        {star} star
                                                                    </span>
                                                                    <div className="h-6 flex-1 overflow-hidden rounded-full bg-slate-100">
                                                                        <div
                                                                            className="h-full rounded-full bg-yellow-400 transition-all"
                                                                            style={{ width: `${Math.max(percentage, count > 0 ? 8 : 0)}%` }}
                                                                        />
                                                                    </div>
                                                                    <span className="w-12 text-right text-sm font-mono text-slate-400">
                                                                        {count}
                                                                    </span>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </>
                                            );
                                        })()}
                                    </div>
                                ) : (
                                    <div className="italic text-slate-500">
                                        File uploads are collected in storage. Visualization coming soon.
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}
