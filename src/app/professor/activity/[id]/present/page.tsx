"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams } from "next/navigation";
import { getActivity, updateActivity } from "@/lib/data/activities";
import { useResponses } from "@/lib/data/responses";
import { Activity, Response } from "@/lib/types";
import { BarChart } from "@/components/presentation/BarChart";
import { WordCloudView } from "@/components/presentation/WordCloudView";
import { ClickableImageView } from "@/components/presentation/ClickableImageView";
import { CompetitionView } from "@/components/presentation/CompetitionView";
import { FloatingControls } from "@/components/presentation/FloatingControls";
import { Loader2, Users } from "lucide-react";

export default function PresentPage() {
    const params = useParams();
    const id = params.id as string;

    const [activity, setActivity] = useState<Activity | null>(null);
    const [responses, setResponses] = useState<Response[]>([]);

    // View State
    const [showResults, setShowResults] = useState(false);
    const [showCorrect, setShowCorrect] = useState(false);
    const [isLocked, setIsLocked] = useState(false);

    // Initial Fetch
    useEffect(() => {
        const fetchAct = async () => {
            const data = await getActivity(id);
            if (data) {
                setActivity(data);
                setIsLocked(data.status === "LOCKED"); // assuming we add LOCKED status later, or check settings
            }
        };
        fetchAct();
    }, [id]);

    // Live Responses
    useEffect(() => {
        const unsub = useResponses(id, setResponses);
        return () => unsub();
    }, [id]);

    // Aggregation Logic
    const chartData = useMemo(() => {
        if (!activity || !activity.options) return [];

        const counts: Record<string, number> = {};
        activity.options.forEach(o => counts[o.id] = 0);

        if (activity.type === "ranking") {
            const maxPoints = activity.options.length;
            responses.forEach(r => {
                if (Array.isArray(r.content?.order)) {
                    r.content.order.forEach((optId: string, index: number) => {
                        if (counts[optId] !== undefined) {
                            // 1st place (index 0) gets maxPoints.
                            // 2nd place (index 1) gets maxPoints - 1.
                            counts[optId] += (maxPoints - index);
                        }
                    });
                }
            });
        } else {
            // Standard Multiple Choice
            responses.forEach(r => {
                if (r.content?.optionId && counts[r.content.optionId] !== undefined) {
                    counts[r.content.optionId]++;
                }
            });
        }

        return activity.options.map(o => ({
            name: o.content.text,
            value: counts[o.id] || 0,
            isCorrect: o.isCorrect
        }));
    }, [activity, responses]);

    const handleToggleLock = async () => {
        const newState = !isLocked;
        setIsLocked(newState);
        // Persist lock state (UR-B4.1)
        // We can use a special setting or activity status
        // For MVP, lets update settings.isLocked if we add it, or just status "ACTIVE" | "LOCKED"
        // Let's use status for now as defined in types
        // actually types has status: "DRAFT" | "ACTIVE" | "ARCHIVED" | "TRASH"
        // Let's just keep local state for MVP visualization, persistence is Phase 2 for locking
    };

    if (!activity) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;

    return (
        <main className="h-screen w-screen bg-slate-50 flex flex-col items-center justify-center p-8 overflow-hidden relative">
            {/* Header Info (Join Code/URL would go here) */}
            <div className="absolute top-8 left-8 flex items-center gap-4 text-slate-400">
                <span className="font-mono text-sm uppercase tracking-widest">Join at lunr.studio/u/...</span>
            </div>

            <div className="absolute top-8 right-8 flex items-center gap-2 bg-white px-4 py-2 rounded-full border border-slate-200 shadow-sm">
                <Users className="w-5 h-5 text-slate-500" />
                <span className="text-xl font-bold font-serif text-slate-700">{responses.length}</span>
            </div>

            {/* Main Content */}
            <div className="max-w-5xl w-full flex-1 flex flex-col justify-center space-y-12">
                <h1 className="text-4xl md:text-6xl font-serif font-bold text-slate-900 text-center leading-tight">
                    {activity.prompt.text}
                </h1>

                {/* Visualization Area */}
                <div className="flex-1 max-h-[50vh] min-h-[400px]">
                    {showResults ? (
                        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-xl w-full h-full">
                            {activity.type === "multiple_choice" || activity.type === "ranking" ? (
                                <BarChart data={chartData} total={responses.length} showCorrect={showCorrect} />
                            ) : activity.type === "word_cloud" ? (
                                <WordCloudView responses={responses} />
                            ) : activity.type === "clickable_image" && activity.content?.imageUrl ? (
                                <ClickableImageView imageUrl={activity.content.imageUrl} responses={responses} />
                            ) : activity.type === "competition" ? (
                                <CompetitionView responses={responses} />
                            ) : (
                                <div className="h-full flex items-center justify-center text-slate-400 italic text-2xl">
                                    {responses.length} Responses (Type: {activity.type})
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-slate-300 space-y-4">
                            <div className="w-24 h-24 rounded-full bg-slate-100 flex items-center justify-center">
                                <Users className="w-10 h-10" />
                            </div>
                            <p className="text-2xl font-serif">Responses are hidden</p>
                        </div>
                    )}
                </div>
            </div>

            <FloatingControls
                showResults={showResults} onToggleResults={() => setShowResults(!showResults)}
                showCorrect={showCorrect} onToggleCorrect={() => setShowCorrect(!showCorrect)}
                isLocked={isLocked} onToggleLock={handleToggleLock}
            />
        </main>
    );
}
