"use client";

import { useEffect, useState } from "react";
import { Session, Question, StudentResponse, AnalysisResult } from "@/lib/types";
import { collection, query, where, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sparkles, Loader2, Lightbulb, AlertTriangle, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

export function SynthesisView({ session }: { session: Session }) {
    const [responses, setResponses] = useState<StudentResponse[]>([]);
    const [analyzing, setAnalyzing] = useState<Record<string, boolean>>({});

    useEffect(() => {
        const q = query(collection(db, "responses"), where("sessionId", "==", session.code));
        const unsub = onSnapshot(q, (snapshot) => {
            const list = snapshot.docs.map(d => d.data() as StudentResponse);
            setResponses(list);
        });
        return () => unsub();
    }, [session.code]);

    const analyzeQuestion = async (q: Question) => {
        const answers = responses.map(r => r.answers[q.id]).filter(Boolean);
        if (answers.length === 0) {
            toast.error("No responses to analyze");
            return;
        }

        setAnalyzing(prev => ({ ...prev, [q.id]: true }));
        try {
            const res = await fetch("/api/synthesize", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ question: q.text, responses: answers })
            });
            const data = await res.json();
            if (data.error) throw new Error(data.error);

            // Save to Firestore
            const ref = doc(db, "sessions", session.id!);
            // Update specific key in map
            await updateDoc(ref, {
                [`analysis.${q.id}`]: data
            });
            toast.success("Analysis complete");
        } catch (e: any) {
            console.error(e);
            toast.error(e.message || "Analysis failed");
        } finally {
            setAnalyzing(prev => ({ ...prev, [q.id]: false }));
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

    return (
        <div className="max-w-5xl mx-auto p-6 space-y-8">
            <header className="text-center space-y-2 mb-10">
                <h1 className="text-4xl font-serif font-bold text-slate-900">Session Report</h1>
                <p className="text-slate-500">Code: {session.code} • {responses.length} Participants</p>
            </header>

            {session.questions.map((q, idx) => {
                const analysis = session.analysis?.[q.id];
                const isAnalyzing = analyzing[q.id];

                return (
                    <div key={q.id} className="space-y-4">
                        <h2 className="text-2xl font-serif font-bold text-slate-800">{idx + 1}. {q.text}</h2>

                        {q.type === "multiple_choice" ? (
                            <Card className="p-6">
                                <div className="h-[250px] w-full">
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
                            </Card>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Raw Responses */}
                                <Card className="h-[400px] flex flex-col">
                                    <div className="p-4 border-b font-medium text-slate-500">Student Responses</div>
                                    <ScrollArea className="flex-1 p-4">
                                        <div className="space-y-3">
                                            {responses.map((r, i) => {
                                                const ans = r.answers[q.id];
                                                if (!ans || typeof ans !== 'string') return null;
                                                return (
                                                    <div key={i} className="p-3 bg-slate-50 rounded-lg text-sm text-slate-700">
                                                        "{ans}"
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </ScrollArea>
                                </Card>

                                {/* AI Analysis */}
                                <Card className={`border-l-4 ${analysis ? "border-rose-600 shadow-md" : "border-slate-200"}`}>
                                    <div className="p-4 border-b font-medium flex justify-between items-center">
                                        <div className="flex items-center gap-2 text-rose-700">
                                            <Sparkles className="w-4 h-4" />
                                            <span>AI Synthesis</span>
                                        </div>
                                        {!analysis && (
                                            <Button size="sm" onClick={() => analyzeQuestion(q)} disabled={isAnalyzing}>
                                                {isAnalyzing ? <Loader2 className="animate-spin w-4 h-4" /> : "Analyze"}
                                            </Button>
                                        )}
                                    </div>
                                    <CardContent className="p-6">
                                        {isAnalyzing ? (
                                            <div className="space-y-4 animate-pulse">
                                                <div className="h-4 bg-slate-100 rounded w-3/4"></div>
                                                <div className="h-4 bg-slate-100 rounded w-full"></div>
                                                <div className="h-4 bg-slate-100 rounded w-5/6"></div>
                                            </div>
                                        ) : analysis ? (
                                            <div className="space-y-6">
                                                <div>
                                                    <h4 className="text-xs font-bold uppercase text-slate-400 mb-1">Consensus</h4>
                                                    <p className="text-slate-800 font-medium leading-relaxed">{analysis.consensus}</p>
                                                </div>

                                                <div>
                                                    <h4 className="text-xs font-bold uppercase text-amber-500 mb-1 flex items-center gap-1">
                                                        <AlertTriangle className="w-3 h-3" /> Confusion Points
                                                    </h4>
                                                    <ul className="list-disc list-inside text-sm text-slate-600 space-y-1">
                                                        {analysis.confusion_points.map((p, i) => <li key={i}>{p}</li>)}
                                                    </ul>
                                                </div>

                                                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                                                    <h4 className="text-xs font-bold uppercase text-indigo-500 mb-1 flex items-center gap-1">
                                                        <Lightbulb className="w-3 h-3" /> Outlier Insight
                                                    </h4>
                                                    <p className="text-sm italic text-slate-600">"{analysis.outlier_insight}"</p>
                                                </div>

                                                <div>
                                                    <h4 className="text-xs font-bold uppercase text-green-600 mb-1 flex items-center gap-1">
                                                        <ArrowRight className="w-3 h-3" /> Recommended Action
                                                    </h4>
                                                    <p className="text-sm font-medium text-slate-800">{analysis.recommended_action}</p>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center text-sm p-4">
                                                <Sparkles className="w-8 h-8 mb-2 opacity-20" />
                                                Hit "Analyze" to synthesize student responses with Gemini.
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
