"use client";

import { Question, StudentResponse, AnalysisResult } from "@/lib/types";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import { Bot } from "lucide-react";
import { StarRating } from "@/components/ui/StarRating";

interface ResponseChartProps {
    question: Question;
    responses: StudentResponse[];
    analysis?: AnalysisResult;
}

function getAggregatedData(question: Question, responses: StudentResponse[]) {
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
}

function getTextAnswers(questionId: string, responses: StudentResponse[]) {
    return responses
        .map(r => r.answers ? r.answers[questionId] : undefined)
        .filter(a => a && typeof a === 'string' && !a.startsWith("http"))
        .slice(-5);
}

function MultipleChoiceChart({ question, responses }: { question: Question; responses: StudentResponse[] }) {
    const data = getAggregatedData(question, responses);
    if (data.length === 0) return <p className="text-slate-400 italic">Waiting for responses...</p>;

    return (
        <div className="h-[200px] w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} layout="vertical" margin={{ left: 0 }}>
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" width={150} tick={{ fontSize: 12 }} />
                    <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: 8 }} />
                    <Bar dataKey="value" fill="var(--primary)" radius={[0, 4, 4, 0]}>
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#be123c' : '#e11d48'} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}

function TextResponses({ question, responses, analysis }: { question: Question; responses: StudentResponse[]; analysis?: AnalysisResult }) {
    const answers = getTextAnswers(question.id, responses);

    return (
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
                        &quot;{analysis.consensus}&quot;
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
                    {answers.map((ans, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className={`p-3 rounded-lg border text-lg font-medium ${i === 0 ? "bg-white border-primary/20 shadow-sm text-slate-800" : "bg-slate-50 border-transparent text-slate-500"}`}
                        >
                            &quot;{ans}&quot;
                        </motion.div>
                    ))}
                </AnimatePresence>
                {answers.length === 0 && <p className="text-slate-400 italic">No responses yet...</p>}
            </div>
        </div>
    );
}

function RatingChart({ question, responses }: { question: Question; responses: StudentResponse[] }) {
    const answers = responses
        .map(r => r.answers ? parseFloat(r.answers[question.id] || "0") : 0)
        .filter(v => v > 0);

    const avg = answers.length > 0 ? (answers.reduce((a, b) => a + b, 0) / answers.length) : 0;

    const counts: Record<string, number> = { "5 Stars": 0, "4 Stars": 0, "3 Stars": 0, "2 Stars": 0, "1 Star": 0 };
    answers.forEach(a => {
        const bucket = Math.round(a);
        if (bucket >= 1 && bucket <= 5) counts[`${bucket} ${bucket === 1 ? "Star" : "Stars"}`]++;
    });
    const chartData = Object.entries(counts).map(([name, value]) => ({ name, value }));

    return (
        <div className="flex flex-col md:flex-row gap-8 items-center justify-center py-8">
            <div className="flex flex-col items-center">
                <div className="text-6xl font-serif font-bold text-slate-800">{avg.toFixed(1)}</div>
                <div className="mb-2">
                    <StarRating value={avg} readOnly size="lg" />
                </div>
                <div className="text-slate-400 text-sm">{answers.length} Responses</div>
            </div>
            {answers.length > 0 && (
                <div className="h-[200px] w-full md:w-1/2">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} layout="vertical" margin={{ left: 0 }}>
                            <XAxis type="number" hide />
                            <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 12 }} />
                            <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: 8 }} />
                            <Bar dataKey="value" fill="var(--primary)" radius={[0, 4, 4, 0]}>
                                {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill='#fbbf24' />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}
        </div>
    );
}

export function ResponseChart({ question, responses, analysis }: ResponseChartProps) {
    if (question.type === "multiple_choice") {
        return <MultipleChoiceChart question={question} responses={responses} />;
    }
    if (question.type === "short_text") {
        return <TextResponses question={question} responses={responses} analysis={analysis} />;
    }
    if (question.type === "rating") {
        return <RatingChart question={question} responses={responses} />;
    }
    return <div className="text-slate-500 italic">File uploads are collected in storage. Visualization coming soon.</div>;
}
