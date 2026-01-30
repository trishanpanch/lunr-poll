"use client";

import { useEffect, useState } from "react";
import { Session, Question, StudentResponse } from "@/lib/types";
import { collection, query, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { db, auth } from "@/lib/firebase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sparkles, Loader2, Lightbulb, AlertTriangle, ArrowRight, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

export function SynthesisView({ session }: { session: Session }) {
    const [responses, setResponses] = useState<StudentResponse[]>([]);
    const [isSynthesizing, setIsSynthesizing] = useState(false);

    useEffect(() => {
        const q = query(collection(db, "sessions", session.id!, "responses"));
        const unsub = onSnapshot(q, (snapshot) => {
            const list = snapshot.docs.map(d => d.data() as StudentResponse);
            setResponses(list);
        });
        return () => unsub();
    }, [session.code, session.id]);

    const synthesizeSession = async () => {
        if (!auth.currentUser) {
            toast.error("You must be logged in to analyze");
            return;
        }

        setIsSynthesizing(true);
        try {
            const token = await auth.currentUser.getIdToken();
            const res = await fetch("/api/synthesize", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    questions: session.questions,
                    responses: responses,
                    sessionId: session.id
                })
            });
            const data = await res.json();
            if (data.error) throw new Error(data.error);

            // Save to Firestore
            const ref = doc(db, "sessions", session.id!);
            await updateDoc(ref, {
                globalAnalysis: data
            });
            toast.success("Session synthesis complete");
        } catch (e) {
            console.error(e);
            toast.error((e as Error).message || "Synthesis failed");
        } finally {
            setIsSynthesizing(false);
        }
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

    return (
        <div className="max-w-5xl mx-auto p-6 space-y-8">
            <header className="text-center space-y-4 mb-10 relative">
                <a href="/professor" className="absolute left-0 top-1/2 -translate-y-1/2 p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors text-slate-500">
                    <ArrowLeft className="w-5 h-5" />
                </a>
                <h1 className="text-4xl font-serif font-bold text-slate-900">{session.title || "Session Report"}</h1>
                <p className="text-slate-500">Code: {session.code} • {responses.length} Participants</p>

                {!session.globalAnalysis && (
                    <Button size="lg" onClick={synthesizeSession} disabled={isSynthesizing} className="mt-4 bg-rose-600 hover:bg-rose-700 text-white font-bold shadow-lg">
                        {isSynthesizing ? (
                            <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Synthesizing Session...</>
                        ) : (
                            <><Sparkles className="mr-2 h-5 w-5" /> Synthesize Session</>
                        )}
                    </Button>
                )}
            </header>

            {/* Global Analysis Section */}
            {session.globalAnalysis && (
                <div className="bg-white rounded-2xl shadow-xl border border-rose-100 overflow-hidden mb-12">
                    <div className="bg-rose-50/50 p-6 border-b border-rose-100 flex items-center gap-3">
                        <div className="bg-rose-100 p-2 rounded-lg">
                            <Sparkles className="w-6 h-6 text-rose-600" />
                        </div>
                        <h2 className="text-2xl font-serif font-bold text-slate-800">Executive Summary</h2>
                    </div>
                    <div className="p-8 space-y-8">
                        <div>
                            <p className="text-lg leading-relaxed text-slate-800 font-medium">
                                {session.globalAnalysis.executive_summary}
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">Class Engagement</h3>
                                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-slate-700">
                                    {session.globalAnalysis.engagement_analysis}
                                </div>
                            </div>
                            <div className="space-y-4">
                                <h3 className="text-sm font-bold uppercase tracking-wider text-amber-500 flex items-center gap-2">
                                    <AlertTriangle className="w-4 h-4" /> Common Misconceptions
                                </h3>
                                <ul className="space-y-2">
                                    {session.globalAnalysis.common_misconceptions.map((item, i) => (
                                        <li key={i} className="flex gap-3 text-slate-700">
                                            <span className="text-amber-400 font-bold">•</span>
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>

                        <div className="bg-indigo-50 rounded-xl p-6 border border-indigo-100">
                            <h3 className="text-sm font-bold uppercase tracking-wider text-indigo-600 mb-4 flex items-center gap-2">
                                <Lightbulb className="w-4 h-4" /> Teaching Recommendations
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {session.globalAnalysis.teaching_recommendations.map((rec, i) => (
                                    <div key={i} className="bg-white p-4 rounded-lg shadow-sm border border-indigo-50 text-slate-700 text-sm">
                                        {rec}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="space-y-12">
                {session.questions.map((q, idx) => {
                    return (
                        <div key={q.id} className="space-y-4">
                            <h2 className="text-2xl font-serif font-bold text-slate-800 border-b pb-2">{idx + 1}. {q.text}</h2>

                            {q.type === "multiple_choice" ? (
                                <Card className="p-6">
                                    <div className="h-[250px] w-full min-w-0">
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
                                            <div className="h-full w-full flex items-center justify-center">
                                                <p className="text-slate-400 italic">No responses to display.</p>
                                            </div>
                                        )}
                                    </div>
                                </Card>
                            ) : (
                                <Card className="h-[400px] flex flex-col">
                                    <div className="p-4 border-b font-medium text-slate-500">Student Responses</div>
                                    <ScrollArea className="flex-1 p-4">
                                        <div className="space-y-3">
                                            {responses.map((r, i) => {
                                                const ans = r.answers[q.id];
                                                if (!ans || typeof ans !== 'string') return null;
                                                return (
                                                    <div key={i} className="p-3 bg-slate-50 rounded-lg text-sm text-slate-700">
                                                        &quot;{ans}&quot;
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </ScrollArea>
                                </Card>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
