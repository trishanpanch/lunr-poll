"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { resolveHandle, subscribeToUserProfile } from "@/lib/data/users";
import { getActivity } from "@/lib/data/activities";
import { UserProfile, Activity } from "@/lib/types";
import { ResponsiveContainer } from "@/components/ui/responsive-container";
import { WaitScreen } from "@/components/participant/WaitScreen";
import { MultipleChoiceResponse } from "@/components/participant/MultipleChoiceResponse";
import { OpenEndedResponse } from "@/components/participant/OpenEndedResponse";
import { SurveyParticipant } from "@/components/participant/SurveyParticipant";
import { QAParticipant } from "@/components/participant/QAParticipant";
import { ClickableImageParticipant } from "@/components/participant/ClickableImageParticipant";
import { RankingParticipant } from "@/components/participant/RankingParticipant";
import { CompetitionParticipant } from "@/components/participant/CompetitionParticipant";
import { Loader2 } from "lucide-react";

export default function ParticipantPage() {
    const params = useParams();
    // Decode handle from URL as it might be case sensitive or have special chars? 
    // Usually standard slug.
    const handle = params.handle as string;

    const [professor, setProfessor] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [currentActivityId, setCurrentActivityId] = useState<string | null>(null);
    const [activity, setActivity] = useState<Activity | null>(null);
    const [participantId, setParticipantId] = useState("");

    // 1. Resolve Handle -> Professor UID
    useEffect(() => {
        const init = async () => {
            // Generate anonymous Participant ID if not exists
            let pid = localStorage.getItem("participant_id");
            if (!pid) {
                pid = crypto.randomUUID();
                localStorage.setItem("participant_id", pid);
            }
            setParticipantId(pid);

            try {
                // Try resolving handle
                const prof = await resolveHandle(handle);
                if (prof) {
                    setProfessor(prof);
                } else {
                    // Handle not found
                    setLoading(false);
                }
            } catch (e) {
                console.error(e);
                setLoading(false);
            }
        };
        init();
    }, [handle]);

    // 2. Subscribe to Professor's Live State
    useEffect(() => {
        if (!professor) return;

        const unsub = subscribeToUserProfile(professor.uid, (updatedProfile) => {
            if (updatedProfile) {
                // Check if currentActivityId changed
                if ((updatedProfile as any).currentActivityId !== currentActivityId) {
                    setCurrentActivityId((updatedProfile as any).currentActivityId);
                }
                setLoading(false);
            }
        });

        return () => unsub();
    }, [professor, currentActivityId]);

    // 3. Fetch Activity Data when ID changes
    useEffect(() => {
        if (!currentActivityId) {
            setActivity(null);
            return;
        }

        const fetchAct = async () => {
            const act = await getActivity(currentActivityId);
            setActivity(act);
        };
        fetchAct();
    }, [currentActivityId]);

    if (loading) return (
        <div className="h-screen flex items-center justify-center bg-slate-50">
            <Loader2 className="w-8 h-8 text-slate-300 animate-spin" />
        </div>
    );

    if (!professor) return (
        <div className="h-screen flex items-center justify-center bg-slate-50 text-slate-500">
            Professor not found. Check the URL.
        </div>
    );

    // Branding Styles
    const brandingStyle = professor.branding?.primaryColor ? {
        "--primary": professor.branding.primaryColor,
        "--ring": professor.branding.primaryColor,
        "--search-button": professor.branding.primaryColor // Custom variables just in case
    } as React.CSSProperties : {};

    return (
        <main className="min-h-screen bg-slate-50 py-6 px-4" style={brandingStyle}>
            <ResponsiveContainer size="sm" className="bg-white min-h-[80vh] rounded-2xl shadow-sm border border-slate-100 p-6 md:p-8">
                {/* Header / Branding */}
                <div className="mb-6 border-b border-slate-100 pb-4 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        {professor.branding?.logoUrl ? (
                            <img src={professor.branding.logoUrl} alt="Logo" className="h-8 w-auto object-contain" />
                        ) : (
                            <span className="font-serif font-bold text-slate-900">Harvard<span className="text-[var(--primary)]">Poll</span></span>
                        )}
                    </div>
                    <span className="text-xs text-slate-400 font-mono">{handle}</span>
                </div>

                {/* Content Switcher */}
                {!activity ? (
                    <WaitScreen professor={professor} />
                ) : (
                    <>
                        {activity.type === "multiple_choice" && (
                            <MultipleChoiceResponse activity={activity} participantId={participantId} />
                        )}
                        {activity.type === "open_ended" && (
                            <OpenEndedResponse activity={activity} participantId={participantId} />
                        )}
                        {activity.type === "word_cloud" && (
                            <OpenEndedResponse activity={activity} participantId={participantId} />
                        )}
                        {activity.type === "survey" && (
                            <SurveyParticipant activity={activity} participantId={participantId} />
                        )}
                        {activity.type === "qa" && (
                            <QAParticipant activity={activity} participantId={participantId} />
                        )}
                        {activity.type === "clickable_image" && (
                            <ClickableImageParticipant activity={activity} participantId={participantId} />
                        )}
                        {activity.type === "ranking" && (
                            <RankingParticipant activity={activity} participantId={participantId} />
                        )}
                        {activity.type === "competition" && (
                            <CompetitionParticipant activity={activity} participantId={participantId} />
                        )}
                        {/* Fallback for unknown types */}
                        {!["multiple_choice", "open_ended", "word_cloud", "survey", "qa", "clickable_image", "ranking", "competition"].includes(activity.type) && (
                            <div className="text-center text-slate-500 py-10">
                                This activity type is not yet supported on mobile.
                            </div>
                        )}
                    </>
                )}
            </ResponsiveContainer>
        </main>
    );
}
