"use client";

import { useEffect, useState } from "react";
import { Session, Question, StudentResponse } from "@/lib/types";
import { collection, query, where, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import { Users, StopCircle, QrCode } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { SessionQR } from "@/components/professor/SessionQR";

export function LiveDashboard({ session }: { session: Session }) {
    // ... existing state ...

    // ... further down in the file ...

    // Note: I will use a separate replace call or do it in one go if I match correctly.
    // Let's split this. First add imports.
    const [responses, setResponses] = useState<StudentResponse[]>([]);

    useEffect(() => {
        // Skip firestore subscription for local demo sessions to avoid permission errors
        if (session.id && session.id.startsWith("local_")) {
            return;
        }

        const q = query(collection(db, "responses"), where("sessionId", "==", session.code));
        const unsub = onSnapshot(q, (snapshot) => {
            const list = snapshot.docs.map(d => d.data() as StudentResponse);
            setResponses(list);
        }, (err) => {
            console.error("LiveDashboard Error:", err);
        });
        return () => unsub();
    }, [session.code, session.id]);

    const closeSession = async () => {
        // Try Cloud Close First
        try {
            await updateDoc(doc(db, "sessions", session.id!), { status: "CLOSED" });
            return;
        } catch (e) {
            console.warn("Cloud close failed, trying local", e);
        }

        // Local Demo Mode Close Fallback
        if (session.id && (session.id.startsWith("local_") || session.ownerId === "dev_lunr_ID")) {
            try {
                const localSessionsStr = localStorage.getItem("harvard_poll_dev_sessions");
                if (localSessionsStr) {
                    const sessions = JSON.parse(localSessionsStr) as Session[];
                    const updatedSessions = sessions.map(s =>
                        s.id === session.id ? { ...s, status: "CLOSED" as const } : s
                    );
                    localStorage.setItem("harvard_poll_dev_sessions", JSON.stringify(updatedSessions));
                    // Force reload to update parent view
                    window.location.reload();
                }
            } catch (e) {
                console.error(e);
            }
            return;
        }
    };

    const getAggregatedData = (question: Question) => {
        if (question.type === "multiple_choice") {
            const counts: Record<string, number> = {};
            question.options?.forEach(o => counts[o] = 0);
            responses.forEach(r => {
                const ans = r.answers[question.id];
                if (ans && counts[ans] !== undefined) counts[ans]++;
            });
            return Object.entries(counts).map(([name, value]) => ({ name, value }));
        }
        return [];
    };

    const getTextAnswers = (questionId: string) => {
        return responses
            .map(r => r.answers[questionId])
            .filter(a => a && typeof a === 'string' && !a.startsWith("http")) // Filter out file URLs if any
            .slice(-5); // Show last 5
    };

    return (
        <div className="max-w-6xl mx-auto p-6 space-y-6">
            <header className="flex justify-between items-center bg-slate-900 text-white p-6 rounded-2xl shadow-lg">
                <div className="flex items-center gap-6">
                    <div className="text-center">
                        <div className="text-xs text-slate-400 uppercase tracking-widest font-bold">Join Code</div>
                        <div className="text-5xl font-mono font-bold tracking-widest">{session.code}</div>
                    </div>
                    <div className="h-12 w-px bg-slate-700"></div>
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


                <div className="flex gap-4">
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button variant="outline" size="lg" className="rounded-xl px-6 font-bold text-lg bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white">
                                <QrCode className="mr-2 w-6 h-6" /> Share
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md">
                            <SessionQR sessionCode={session.code} />
                        </DialogContent>
                    </Dialog>

                    <Button variant="destructive" size="lg" onClick={closeSession} className="rounded-xl px-8 font-bold text-lg">
                        <StopCircle className="mr-2 w-6 h-6" /> Close & Analyze
                    </Button>
                </div>
            </header>

            <div className="grid grid-cols-1 gap-6">
                {session.questions.map((q) => (
                    <Card key={q.id} className="border-slate-200 shadow-sm overflow-hidden">
                        <CardHeader className="bg-slate-50 border-b border-slate-100 pb-3">
                            <CardTitle className="font-serif text-xl">{q.text}</CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            {q.type === "multiple_choice" ? (
                                <div className="h-[200px] w-full">
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
                                </div>
                            ) : q.type === "short_text" ? (
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
                                                "{ans}"
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                    {getTextAnswers(q.id).length === 0 && <p className="text-slate-400 italic">No responses yet...</p>}
                                </div>
                            ) : (
                                <div className="text-slate-500 italic">File uploads are collected in storage. Visualization coming soon.</div>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
