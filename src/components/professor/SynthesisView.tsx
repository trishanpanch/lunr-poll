"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { Session, Question, StudentResponse } from "@/lib/types";
import { collection, query, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { db, auth } from "@/lib/firebase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2, Lightbulb, AlertTriangle, ArrowLeft, Download, FileImage, FileText, Star } from "lucide-react";
import { toast } from "sonner";
import { StarRating } from "@/components/ui/StarRating";
import Link from "next/link";

export function SynthesisView({ session }: { session: Session }) {
    const [responses, setResponses] = useState<StudentResponse[]>([]);
    const [isSynthesizing, setIsSynthesizing] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const summaryRef = useRef<HTMLDivElement>(null);

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

    // ---------- Export Logic ----------

    const exportAsPNG = useCallback(async () => {
        if (!summaryRef.current) return;
        setIsExporting(true);
        try {
            const { toPng } = await import("html-to-image");
            const dataUrl = await toPng(summaryRef.current, {
                backgroundColor: "#ffffff",
                pixelRatio: 2,
                style: { borderRadius: "0" },
            });
            const link = document.createElement("a");
            link.download = `${session.title || "session"}-report.png`;
            link.href = dataUrl;
            link.click();
            toast.success("PNG downloaded");
        } catch (e) {
            console.error(e);
            toast.error("PNG export failed");
        } finally {
            setIsExporting(false);
        }
    }, [session.title]);

    const exportAsPDF = useCallback(async () => {
        if (!summaryRef.current) return;
        setIsExporting(true);
        try {
            const { toPng } = await import("html-to-image");
            const { default: jsPDF } = await import("jspdf");

            const dataUrl = await toPng(summaryRef.current, {
                backgroundColor: "#ffffff",
                pixelRatio: 2,
                style: { borderRadius: "0" },
            });

            const img = new Image();
            img.src = dataUrl;
            await new Promise<void>((resolve, reject) => {
                img.onload = () => resolve();
                img.onerror = reject;
            });

            const padding = 20; // mm padding
            const imgWidthPx = img.width;
            const imgHeightPx = img.height;
            const aspectRatio = imgHeightPx / imgWidthPx;

            // A4: 210mm x 297mm
            const pageWidth = 210;
            const usableWidth = pageWidth - 2 * padding;
            const usableImgHeight = usableWidth * aspectRatio;
            const pageHeight = Math.max(297, usableImgHeight + 2 * padding);

            const pdf = new jsPDF({
                orientation: usableImgHeight > 297 ? "portrait" : "portrait",
                unit: "mm",
                format: [pageWidth, pageHeight],
            });

            pdf.addImage(dataUrl, "PNG", padding, padding, usableWidth, usableImgHeight);
            pdf.save(`${session.title || "session"}-report.pdf`);
            toast.success("PDF downloaded");
        } catch (e) {
            console.error(e);
            toast.error("PDF export failed");
        } finally {
            setIsExporting(false);
        }
    }, [session.title]);

    // ---------- Data Aggregation ----------

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

    const getRatingData = (questionId: string) => {
        const values = responses
            .map(r => r.answers ? parseFloat(r.answers[questionId] || "0") : 0)
            .filter(v => v > 0);
        const avg = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
        const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        values.forEach(v => {
            const bucket = Math.round(v);
            if (bucket >= 1 && bucket <= 5) distribution[bucket]++;
        });
        return { avg, count: values.length, distribution };
    };

    const getTextAnswers = (questionId: string) => {
        return responses
            .map(r => r.answers ? r.answers[questionId] : undefined)
            .filter((a): a is string => !!a && typeof a === "string" && !a.startsWith("http"))
            // Filter out raw rating numbers that leak into text
            .filter(a => isNaN(parseFloat(a)) || a.length > 5);
    };

    // ---------- Render ----------

    return (
        <div className="max-w-5xl mx-auto p-6 space-y-8">
            {/* Header */}
            <header className="text-center space-y-4 mb-10 relative print:mb-4">
                <div className="hidden print:block text-left border-b-2 border-slate-900 pb-4 mb-8">
                    <h1 className="text-3xl font-serif font-bold text-slate-900">Harvard Poll Report</h1>
                    <p className="text-sm text-slate-500">Generated on {new Date().toLocaleDateString()}</p>
                </div>

                <Link href="/professor/dashboard" className="absolute left-0 top-1/2 -translate-y-1/2 p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors text-slate-500 print:hidden">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <h1 className="text-4xl font-serif font-bold text-slate-900 print:text-2xl">{session.title || "Session Report"}</h1>
                <p className="text-slate-500">Code: {session.code} • {responses.length} Participants</p>

                {!session.globalAnalysis && (
                    <Button size="lg" onClick={synthesizeSession} disabled={isSynthesizing} className="mt-4 bg-rose-600 hover:bg-rose-700 text-white font-bold shadow-lg print:hidden">
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
                <div className="space-y-4">
                    {/* Download Buttons */}
                    <div className="flex justify-end gap-3 print:hidden">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={exportAsPNG}
                            disabled={isExporting}
                            className="rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50"
                        >
                            <FileImage className="w-4 h-4 mr-2" />
                            {isExporting ? "Exporting..." : "Download PNG"}
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={exportAsPDF}
                            disabled={isExporting}
                            className="rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50"
                        >
                            <FileText className="w-4 h-4 mr-2" />
                            {isExporting ? "Exporting..." : "Download PDF"}
                        </Button>
                    </div>

                    {/* The exportable panel */}
                    <div ref={summaryRef} className="bg-white rounded-2xl shadow-xl border border-rose-100 overflow-hidden">
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
                </div>
            )}

            {/* ─── Per-Question Breakdown ─── */}
            <div className="space-y-10 pt-4">
                <h2 className="text-2xl font-serif font-bold text-slate-800 border-b border-slate-200 pb-3">
                    Question Breakdown
                </h2>

                {session.questions.map((q, idx) => {
                    const analysis = session.analysis?.[q.id];

                    return (
                        <div key={q.id} className="space-y-4">
                            {/* Question Header */}
                            <div className="flex items-start gap-3">
                                <span className="shrink-0 w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-sm font-mono">
                                    {idx + 1}
                                </span>
                                <div>
                                    <h3 className="text-xl font-serif font-bold text-slate-800">{q.text}</h3>
                                    <span className="text-xs uppercase tracking-wider text-slate-400 font-bold">
                                        {q.type === "rating" ? "Star Rating" : q.type === "multiple_choice" ? "Multiple Choice" : q.type === "file_upload" ? "File Upload" : "Open-Ended"}
                                    </span>
                                </div>
                            </div>

                            {/* Content by Type */}
                            {q.type === "rating" ? (
                                <RatingBreakdown data={getRatingData(q.id)} />
                            ) : q.type === "multiple_choice" ? (
                                <MultipleChoiceBreakdown data={getAggregatedData(q)} total={responses.length} />
                            ) : (
                                <TextResponsesBreakdown answers={getTextAnswers(q.id)} analysis={analysis} />
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}


// ─── Sub-components ───────────────────────────────────────────

function RatingBreakdown({ data }: { data: { avg: number; count: number; distribution: Record<number, number> } }) {
    const maxCount = Math.max(...Object.values(data.distribution), 1);

    return (
        <Card className="border-slate-200 shadow-sm overflow-hidden">
            <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-8 items-center">
                    {/* Average Score */}
                    <div className="flex flex-col items-center gap-2 shrink-0">
                        <div className="text-5xl font-serif font-bold text-slate-800">{data.avg.toFixed(1)}</div>
                        <StarRating value={data.avg} readOnly size="md" />
                        <div className="text-sm text-slate-400 font-medium">{data.count} responses</div>
                    </div>

                    {/* Distribution Histogram */}
                    <div className="flex-1 w-full space-y-2">
                        {[5, 4, 3, 2, 1].map(star => {
                            const count = data.distribution[star] || 0;
                            const pct = data.count > 0 ? (count / data.count) * 100 : 0;
                            return (
                                <div key={star} className="flex items-center gap-3">
                                    <div className="flex items-center gap-1 w-16 justify-end shrink-0">
                                        <span className="text-sm font-bold text-slate-600">{star}</span>
                                        <Star className="w-4 h-4 fill-yellow-400 stroke-yellow-400" />
                                    </div>
                                    <div className="flex-1 h-6 bg-slate-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-yellow-400 rounded-full transition-all duration-500"
                                            style={{ width: `${pct}%` }}
                                        />
                                    </div>
                                    <span className="text-sm font-mono text-slate-500 w-8 text-right">{count}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}


function MultipleChoiceBreakdown({ data, total }: { data: { name: string; value: number }[]; total: number }) {
    const maxValue = Math.max(...data.map(d => d.value), 1);

    return (
        <Card className="border-slate-200 shadow-sm overflow-hidden">
            <CardContent className="p-6">
                {data.length > 0 ? (
                    <div className="space-y-3">
                        {data.map((item, i) => {
                            const pct = total > 0 ? Math.round((item.value / total) * 100) : 0;
                            return (
                                <div key={i} className="flex items-center gap-4">
                                    <span className="w-36 shrink-0 text-sm font-medium text-slate-700 truncate">{item.name}</span>
                                    <div className="flex-1 h-8 bg-slate-100 rounded-lg overflow-hidden">
                                        <div
                                            className="h-full bg-rose-500 rounded-lg transition-all duration-500 flex items-center pl-3"
                                            style={{ width: `${Math.max((item.value / maxValue) * 100, 2)}%` }}
                                        >
                                            {item.value > 0 && (
                                                <span className="text-xs font-bold text-white">{item.value}</span>
                                            )}
                                        </div>
                                    </div>
                                    <span className="text-sm font-mono text-slate-400 w-12 text-right">{pct}%</span>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <p className="text-slate-400 italic">No responses to display.</p>
                )}
            </CardContent>
        </Card>
    );
}


function TextResponsesBreakdown({ answers, analysis }: { answers: string[]; analysis?: any }) {
    return (
        <Card className="border-slate-200 shadow-sm overflow-hidden">
            <CardContent className="p-6 space-y-6">
                {/* AI Analysis for this question */}
                {analysis && (
                    <div className="bg-violet-50 rounded-xl p-5 border border-violet-100 space-y-3">
                        <div className="flex items-center gap-2 text-violet-700 font-bold font-serif text-sm">
                            <Sparkles className="w-4 h-4" /> AI Insight
                        </div>
                        <p className="text-sm text-slate-700 italic border-l-2 border-violet-200 pl-3">
                            &quot;{analysis.consensus}&quot;
                        </p>
                        {analysis.outlier_insight && (
                            <p className="text-xs text-slate-500">
                                <span className="font-bold text-violet-600">Outlier:</span> {analysis.outlier_insight}
                            </p>
                        )}
                    </div>
                )}

                {/* Response List */}
                <div>
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                        {answers.length} Response{answers.length !== 1 ? "s" : ""}
                    </div>
                    {answers.length > 0 ? (
                        <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
                            {answers.map((ans, i) => (
                                <div
                                    key={i}
                                    className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-sm text-slate-700 leading-relaxed"
                                >
                                    &quot;{ans}&quot;
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-slate-400 italic text-sm">No text responses for this question.</p>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
