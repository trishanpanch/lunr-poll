"use client";

import { useEffect, useState } from "react";
import { Session, Question, StudentResponse } from "@/lib/types";
import { collection, query, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import { Users, StopCircle, QrCode, Loader2, Sparkles, Bot, Plus, Play, EyeOff, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { SessionQR } from "@/components/professor/SessionQR";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
    const [newQType, setNewQType] = useState<"short_text" | "multiple_choice" | "file_upload">("short_text");
    const [newQOptions, setNewQOptions] = useState<string[]>(["Option 1", "Option 2"]);

    const [analyzingIds, setAnalyzingIds] = useState<Set<string>>(new Set());

    const handleAnalyzeQuestion = async (q: Question) => {
        if (analyzingIds.has(q.id)) return;

        setAnalyzingIds(prev => new Set(prev).add(q.id));
        toast.info("Asking LUNR AI...");

        try {
            // Get answers for this question
            const answers = responses
                .map(r => r.answers ? r.answers[q.id] : undefined)
                .filter(a => a && typeof a === 'string'); // Only analyze text strings

            if (answers.length === 0) {
                toast.error("No responses to analyze yet");
                setAnalyzingIds(prev => {
                    const next = new Set(prev);
                    next.delete(q.id);
                    return next;
                });
                return;
            }

            const res = await fetch("/api/synthesize", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ question: q.text, responses: answers })
            });

            const data = await res.json();

            if (data.error) throw new Error(data.error);

            // Update session with analysis
            const updatedAnalysis = {
                ...(session.analysis || {}),
                [q.id]: data
            };

            if (!session.id?.startsWith("local_")) {
                await updateDoc(doc(db, "sessions", session.id!), { analysis: updatedAnalysis });
            } else {
                // Local logic
                const localSessionsStr = localStorage.getItem("harvard_poll_dev_sessions");
                if (localSessionsStr) {
                    const sessions = JSON.parse(localSessionsStr) as Session[];
                    const sessionsUpd = sessions.map(s =>
                        s.id === session.id ? { ...s, analysis: updatedAnalysis } : s
                    );
                    localStorage.setItem("harvard_poll_dev_sessions", JSON.stringify(sessionsUpd));
                    window.location.reload();
                }
            }
            toast.success("LUNR AI Analysis Complete");

        } catch (e) {
            console.error(e);
            toast.error("Analysis failed");
        } finally {
            setAnalyzingIds(prev => {
                const next = new Set(prev);
                next.delete(q.id);
                return next;
            });
        }
    };

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
                await updateDoc(doc(db, "sessions", session.id!), { questions: updatedQuestions });
            }
            if (session.id && (session.id.startsWith("local_") || session.ownerId === "dev_lunr_ID")) {
                const localSessionsStr = localStorage.getItem("harvard_poll_dev_sessions");
                if (localSessionsStr) {
                    const sessions = JSON.parse(localSessionsStr) as Session[];
                    const updatedSessions = sessions.map(s =>
                        s.id === session.id ? { ...s, questions: updatedQuestions } : s
                    );
                    localStorage.setItem("harvard_poll_dev_sessions", JSON.stringify(updatedSessions));
                    window.location.reload();
                }
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

    const toggleQuestionStatus = async (qId: string, currentStatus?: boolean) => {
        const updatedQuestions = session.questions.map(q =>
            q.id === qId ? { ...q, isActive: !currentStatus } : q
        );

        try {
            if (!session.id?.startsWith("local_")) {
                await updateDoc(doc(db, "sessions", session.id!), { questions: updatedQuestions });
            } else {
                const localSessionsStr = localStorage.getItem("harvard_poll_dev_sessions");
                if (localSessionsStr) {
                    const sessions = JSON.parse(localSessionsStr) as Session[];
                    const sessionsUpd = sessions.map(s =>
                        s.id === session.id ? { ...s, questions: updatedQuestions } : s
                    );
                    localStorage.setItem("harvard_poll_dev_sessions", JSON.stringify(sessionsUpd));
                    window.location.reload();
                }
            }
            toast.success(currentStatus ? "Question closed" : "Question activated");
        } catch (e) {
            toast.error("Failed to update status");
        }
    };

    const deleteQuestion = async (qId: string) => {
        const updatedQuestions = session.questions.filter(q => q.id !== qId);
        try {
            if (!session.id?.startsWith("local_")) {
                await updateDoc(doc(db, "sessions", session.id!), { questions: updatedQuestions });
            } else {
                const localSessionsStr = localStorage.getItem("harvard_poll_dev_sessions");
                if (localSessionsStr) {
                    const sessions = JSON.parse(localSessionsStr) as Session[];
                    const sessionsUpd = sessions.map(s =>
                        s.id === session.id ? { ...s, questions: updatedQuestions } : s
                    );
                    localStorage.setItem("harvard_poll_dev_sessions", JSON.stringify(sessionsUpd));
                    window.location.reload();
                }
            }
            toast.success("Question deleted");
        } catch (e) {
            toast.error("Failed to delete");
        }
    }

    const closeSession = async () => {
        setAnalyzing(true);
        const analysisResults: Record<string, any> = {};

        if (!session.id?.startsWith("local_")) {
            toast.info("Synthesizing student responses with AI...");
            try {
                await Promise.all(session.questions.map(async (q) => {
                    const answers = responses
                        .map(r => r.answers ? r.answers[q.id] : undefined)
                        .filter(a => a && typeof a === 'string');

                    if (answers.length > 0) {
                        try {
                            const res = await fetch("/api/synthesize", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ question: q.text, responses: answers })
                            });
                            const data = await res.json();
                            if (!data.error) {
                                analysisResults[q.id] = data;
                            }
                        } catch (err) {
                            console.error(`Failed to analyze question ${q.id}`, err);
                        }
                    }
                }));
            } catch (e) {
                console.error("Analysis failed", e);
                toast.error("Analysis warning: Some questions could not be processed.");
            }
        }

        try {
            await updateDoc(doc(db, "sessions", session.id!), {
                status: "CLOSED",
                ...(Object.keys(analysisResults).length > 0 ? { analysis: analysisResults } : {})
            });
            toast.success("Session closed and analyzed.");
            return;
        } catch (e) {
            console.warn("Cloud close failed, trying local", e);
        }

        if (session.id && (session.id.startsWith("local_") || session.ownerId === "dev_lunr_ID")) {
            try {
                const localSessionsStr = localStorage.getItem("harvard_poll_dev_sessions");
                if (localSessionsStr) {
                    const sessions = JSON.parse(localSessionsStr) as Session[];
                    const updatedSessions = sessions.map(s =>
                        s.id === session.id ? { ...s, status: "CLOSED" as const } : s
                    );
                    localStorage.setItem("harvard_poll_dev_sessions", JSON.stringify(updatedSessions));
                    window.location.reload();
                }
            } catch (e) {
                console.error(e);
            }
        }
        setAnalyzing(false);
    };

    const getAggregatedData = (question: Question) => {
        if (question.type === "multiple_choice") {
            const counts: Record<string, number> = {};
            question.options?.forEach(o => counts[o] = 0);
            responses.forEach(r => {
                if (!r.answers) return;
                const ans = r.answers[question.id];
                if (ans && counts[ans] !== undefined) counts[ans]++;
            });
            return Object.entries(counts).map(([name, value]) => ({ name, value }));
        }
        return [];
    };

    const getTextAnswers = (questionId: string) => {
        return responses
            .map(r => r.answers ? r.answers[questionId] : undefined)
            .filter(a => a && typeof a === 'string' && !a.startsWith("http"))
            .slice(-5);
    };

    return (
        <div className="max-w-6xl mx-auto p-6 space-y-6">
            <header className="flex flex-col md:flex-row justify-between items-center gap-6 bg-slate-900 text-white p-6 rounded-2xl shadow-lg">
                {/* ... existing header ... */}
                <div className="flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
                    <div className="text-center">
                        <div className="text-xs text-slate-400 uppercase tracking-widest font-bold">Join Code</div>
                        <div className="text-5xl font-mono font-bold tracking-widest">{session.code}</div>
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
                            <Button size="lg" className="w-full sm:w-auto rounded-xl px-6 font-bold text-lg bg-indigo-600 hover:bg-indigo-700 text-white border-0 shadow-lg shadow-indigo-200">
                                <Plus className="mr-2 w-6 h-6" /> Add Question
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            {/* ... existing dialog ... */}
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
                            <>
                                <Loader2 className="mr-2 w-6 h-6 animate-spin" /> Synthesizing...
                            </>
                        ) : (
                            <>
                                <StopCircle className="mr-2 w-6 h-6" /> Close
                            </>
                        )}
                    </Button>
                </div>
            </header>

            <div className="grid grid-cols-1 gap-6">
                {session.questions.map((q) => {
                    const analysis = session.analysis?.[q.id];
                    return (
                        <Card key={q.id} className="border-slate-200 shadow-sm overflow-hidden">
                            <CardHeader className="bg-slate-50 border-b border-slate-100 pb-3 flex flex-row justify-between items-start">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <CardTitle className="font-serif text-xl">{q.text}</CardTitle>
                                        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${q.isActive !== false ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}>
                                            {q.isActive !== false ? "Active" : "Closed"}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleAnalyzeQuestion(q)}
                                        disabled={analyzingIds.has(q.id)}
                                        className="text-violet-600 border-violet-200 hover:bg-violet-50 hover:text-violet-700"
                                    >
                                        {analyzingIds.has(q.id) ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <>
                                                <Sparkles className="w-4 h-4 mr-2" /> Ask LUNR AI
                                            </>
                                        )}
                                    </Button>

                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => toggleQuestionStatus(q.id, q.isActive !== false)}
                                        className={`${q.isActive !== false ? "text-amber-600 hover:text-amber-700 hover:bg-amber-50" : "text-green-600 hover:text-green-700 hover:bg-green-50"}`}
                                    >
                                        {q.isActive !== false ? <EyeOff className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                                    </Button>
                                    <Button variant="ghost" size="sm" onClick={() => deleteQuestion(q.id)} className="text-slate-400 hover:text-red-600 hover:bg-red-50">
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className={`p-6 ${q.isActive === false ? "opacity-50" : ""}`}>
                                {q.type === "multiple_choice" ? (
                                    <div className="h-[200px] w-full flex items-center justify-center">
                                        {getAggregatedData(q).length > 0 ? (
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart data={getAggregatedData(q)} layout="vertical" margin={{ left: 0 }}>
                                                    <XAxis type="number" hide />
                                                    <YAxis dataKey="name" type="category" width={150} tick={{ fontSize: 12 }} />
                                                    <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: 8 }} />
                                                    <Bar dataKey="value" fill="var(--primary)" radius={[0, 4, 4, 0]}>
                                                        {getAggregatedData(q).map((entry, index) => (
                                                            <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#be123c' : '#e11d48'} />
                                                        ))}
                                                    </Bar>
                                                </BarChart>
                                            </ResponsiveContainer>
                                        ) : (
                                            <p className="text-slate-400 italic">Waiting for responses...</p>
                                        )}
                                    </div>
                                ) : q.type === "short_text" ? (
                                    <div className="space-y-4">
                                        {analysis && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className="bg-violet-50 border border-violet-100 rounded-xl p-5 space-y-3"
                                            >
                                                <div className="flex items-center gap-2 text-violet-700 font-bold font-serif">
                                                    <Bot className="w-5 h-5" /> LUNR AI Insights
                                                </div>

                                                <div className="text-slate-700 text-sm italic border-l-2 border-violet-200 pl-3">
                                                    "{analysis.consensus}"
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                                                    <div>
                                                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Distribution</h4>
                                                        <p className="text-sm text-slate-700">{analysis.distribution_analysis}</p>
                                                    </div>
                                                    <div>
                                                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Key Inferences</h4>
                                                        <ul className="list-disc list-inside text-sm text-slate-700 space-y-1">
                                                            {analysis.key_inferences?.map((inf: string, i: number) => (
                                                                <li key={i}>{inf}</li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                </div>


                                                {analysis.outlier_insight && (
                                                    <div className="bg-white p-3 rounded-lg border border-violet-100 text-sm text-slate-600">
                                                        <span className="font-bold text-violet-600">Outlier:</span> {analysis.outlier_insight}
                                                    </div>
                                                )}
                                            </motion.div>
                                        )}

                                        <div className="space-y-2">
                                            <AnimatePresence>
                                                {getTextAnswers(q.id).map((ans, i) => (
                                                    <motion.div
                                                        key={i}
                                                        initial={{ opacity: 0, x: -10 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        className={`p-3 rounded-lg border text-lg font-medium ${i === 0 ? "bg-white border-primary/20 shadow-sm text-slate-800" : "bg-slate-50 border-transparent text-slate-500"
                                                            }`}
                                                    >
                                                        &quot;{ans}&quot;
                                                    </motion.div>
                                                ))}
                                            </AnimatePresence>
                                            {getTextAnswers(q.id).length === 0 && <p className="text-slate-400 italic">No responses yet...</p>}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-slate-500 italic">File uploads are collected in storage. Visualization coming soon.</div>
                                )}
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}
