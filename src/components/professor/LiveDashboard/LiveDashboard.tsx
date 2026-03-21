"use client";

import { useEffect, useState } from "react";
import { Session, Question, StudentResponse } from "@/lib/types";
import { collection, query, onSnapshot } from "firebase/firestore";
import { db, auth } from "@/lib/firebase/client";
import { Button } from "@/components/ui/button";
import { Users, StopCircle, QrCode, Loader2, Plus, Trash2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import Link from "next/link";
import { SessionQR } from "@/components/professor/SessionQR";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { isDemoSession, updateLocalSession } from "@/lib/storage";
import { QuestionCard } from "./QuestionCard";

export function LiveDashboard({ session }: { session: Session }) {
    const [responses, setResponses] = useState<StudentResponse[]>([]);

    useEffect(() => {
        if (session.id && session.id.startsWith("local_")) {
            return;
        }

        const q = query(collection(db, "sessions", session.id!, "responses"));
        const unsub = onSnapshot(q, (snapshot) => {
            const list = snapshot.docs.map(d => d.data() as StudentResponse);
            setResponses(list);
        }, (err) => {
            console.error("LiveDashboard Error:", err);
        });
        return () => unsub();
    }, [session.code, session.id]);

    const [analyzing, setAnalyzing] = useState(false);
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [newQText, setNewQText] = useState("");
    const [newQType, setNewQType] = useState<"short_text" | "multiple_choice" | "file_upload" | "rating">("short_text");
    const [newQOptions, setNewQOptions] = useState<string[]>(["Option 1", "Option 2"]);

    const handleAddQuestion = async () => {
        if (!newQText) return;

        const newQ: Question = {
            id: Math.random().toString(36).substr(2, 9),
            text: newQText,
            type: newQType,
            options: newQType === "multiple_choice" ? newQOptions : undefined,
            isActive: true
        };

        const updatedQuestions = [...(session.questions || []), newQ];

        try {
            if (!session.id?.startsWith("local_")) {
                const token = await auth.currentUser?.getIdToken();
                await fetch(`/api/sessions/${session.id}/update`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                    body: JSON.stringify({ questions: updatedQuestions })
                });
            }
            if (isDemoSession(session)) {
                updateLocalSession(session.id!, { questions: updatedQuestions });
                window.location.reload();
            }

            setIsAddOpen(false);
            setNewQText("");
            setNewQOptions(["Option 1", "Option 2"]);
            toast.success("Question added!");
        } catch (e) {
            console.error(e);
            toast.error("Failed to add question");
        }
    };

    const toggleActiveQuestion = async (qId: string) => {
        const currentActiveIds = new Set(session.activeQuestionIds || (session.activeQuestionId ? [session.activeQuestionId] : []));

        let isNowActive = false;
        if (currentActiveIds.has(qId)) {
            currentActiveIds.delete(qId);
            isNowActive = false;
        } else {
            currentActiveIds.add(qId);
            isNowActive = true;
        }

        const newActiveIds = Array.from(currentActiveIds);

        try {
            if (!session.id?.startsWith("local_")) {
                const token = await auth.currentUser?.getIdToken();
                await fetch(`/api/sessions/${session.id}/update`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                    body: JSON.stringify({
                        activeQuestionIds: newActiveIds,
                        activeQuestionId: newActiveIds.length > 0 ? newActiveIds[newActiveIds.length - 1] : null
                    })
                });
            } else if (isDemoSession(session)) {
                updateLocalSession(session.id!, {
                    activeQuestionIds: newActiveIds,
                    activeQuestionId: newActiveIds.length > 0 ? newActiveIds[newActiveIds.length - 1] : null
                });
                window.location.reload();
            }
            if (isNowActive) {
                toast.success("Question is NOW LIVE");
            } else {
                toast.success("Question stopped");
            }
        } catch (e) {
            toast.error("Failed to update status");
        }
    };

    const deleteQuestion = async (qId: string) => {
        const updatedQuestions = session.questions.filter(q => q.id !== qId);
        try {
            if (!session.id?.startsWith("local_")) {
                const token = await auth.currentUser?.getIdToken();
                await fetch(`/api/sessions/${session.id}/update`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                    body: JSON.stringify({ questions: updatedQuestions })
                });
            } else if (isDemoSession(session)) {
                updateLocalSession(session.id!, { questions: updatedQuestions });
                window.location.reload();
            }
            toast.success("Question deleted");
        } catch (e) {
            toast.error("Failed to delete");
        }
    };

    const closeSession = async () => {
        setAnalyzing(true);
        const analysisResults: Record<string, any> = {};

        try {
            if (!session.id?.startsWith("local_")) {
                const token = await auth.currentUser?.getIdToken();
                await fetch(`/api/sessions/${session.id}/update`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                    body: JSON.stringify({
                        status: "CLOSED",
                        ...(Object.keys(analysisResults).length > 0 ? { analysis: analysisResults } : {})
                    })
                });
            } else {
                throw new Error("Force fallback to local");
            }
            toast.success("Session closed and analyzed.");
            return;
        } catch (e) {
            console.warn("Cloud close failed, trying local", e);
        }

        if (isDemoSession(session)) {
            try {
                updateLocalSession(session.id!, { status: "CLOSED" });
                window.location.reload();
            } catch (e) {
                console.error(e);
            }
        }
        setAnalyzing(false);
    };

    return (
        <div className="max-w-6xl mx-auto p-6 space-y-6">
            <header className="flex flex-col md:flex-row justify-between items-center gap-6 bg-slate-900 text-white p-6 rounded-2xl shadow-lg">
                <div className="flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
                    <Link href="/professor/dashboard" className="md:mr-4 p-2 bg-slate-800 rounded-full hover:bg-slate-700 transition-colors">
                        <ArrowLeft className="w-5 h-5 text-slate-300" />
                    </Link>
                    <div className="text-center md:text-left">
                        <div className="text-xs text-slate-400 uppercase tracking-widest font-bold">Join Code</div>
                        <div className="text-5xl font-mono font-bold tracking-widest">{session.code}</div>
                        {session.title && <div className="text-lg font-serif font-bold text-slate-300 mt-1">{session.title}</div>}
                    </div>
                    <div className="hidden md:block h-12 w-px bg-slate-700"></div>
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-rose-600 rounded-full animate-pulse">
                            <Users className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <div className="text-3xl font-bold font-serif">{responses.length}</div>
                            <div className="text-xs text-slate-400">Active Students</div>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                    <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                        <DialogTrigger asChild>
                            <Button size="lg" className="w-full sm:w-auto rounded-xl px-6 font-bold text-lg bg-indigo-600 hover:bg-indigo-700 text-white border-0">
                                <Plus className="mr-2 w-6 h-6" /> Add Question
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <div className="space-y-4">
                                <h3 className="text-lg font-serif font-bold">Add Live Question</h3>
                                <div className="space-y-2">
                                    <Label>Question Text</Label>
                                    <Input value={newQText} onChange={e => setNewQText(e.target.value)} placeholder="What do you want to ask?" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Type</Label>
                                    <Select value={newQType} onValueChange={(v: any) => setNewQType(v)}>
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
                                        {newQOptions.map((opt, idx) => (
                                            <div key={idx} className="flex gap-2">
                                                <Input
                                                    value={opt}
                                                    onChange={e => {
                                                        const newO = [...newQOptions];
                                                        newO[idx] = e.target.value;
                                                        setNewQOptions(newO);
                                                    }}
                                                />
                                                <Button variant="ghost" size="icon" onClick={() => setNewQOptions(newQOptions.filter((_, i) => i !== idx))}>
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        ))}
                                        <Button variant="link" onClick={() => setNewQOptions([...newQOptions, `Option ${newQOptions.length + 1}`])}>+ Add Option</Button>
                                    </div>
                                )}
                                <Button onClick={handleAddQuestion} className="w-full">Launch Question</Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button variant="outline" size="lg" className="w-full sm:w-auto rounded-xl px-6 font-bold text-lg bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white">
                                <QrCode className="mr-2 w-6 h-6" /> Share
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md">
                            <SessionQR sessionCode={session.code} sessionId={session.id} />
                        </DialogContent>
                    </Dialog>

                    <Button variant="destructive" size="lg" onClick={closeSession} disabled={analyzing} className="w-full sm:w-auto rounded-xl px-8 font-bold text-lg">
                        {analyzing ? (
                            <><Loader2 className="mr-2 w-6 h-6 animate-spin" /> Synthesizing...</>
                        ) : (
                            <><StopCircle className="mr-2 w-6 h-6" /> Close</>
                        )}
                    </Button>
                </div>
            </header>

            <div className="grid grid-cols-1 gap-6">
                {session.questions.map((q) => {
                    const isActive = session.activeQuestionIds
                        ? session.activeQuestionIds.includes(q.id)
                        : session.activeQuestionId === q.id;

                    return (
                        <QuestionCard
                            key={q.id}
                            question={q}
                            responses={responses}
                            analysis={session.analysis?.[q.id]}
                            isActive={isActive}
                            onToggleActive={toggleActiveQuestion}
                            onDelete={deleteQuestion}
                        />
                    );
                })}
            </div>
        </div>
    );
}
