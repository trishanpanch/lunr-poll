"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getActivity } from "@/lib/data/activities";
import { Activity } from "@/lib/types";
import { MultipleChoiceResponse } from "@/components/participant/MultipleChoiceResponse";
import { OpenEndedResponse } from "@/components/participant/OpenEndedResponse";
import { toast } from "sonner";
import { Loader2, Smartphone } from "lucide-react";

export default function PreviewPage() {
    const params = useParams();
    const id = params.id as string;
    const [activity, setActivity] = useState<Activity | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchActivity = async () => {
            try {
                const data = await getActivity(id);
                setActivity(data);
            } catch (e) {
                console.error(e);
                toast.error("Failed to load preview");
            } finally {
                setLoading(false);
            }
        };
        fetchActivity();
    }, [id]);

    const handleMockSubmit = async (data: any) => {
        // Mock delay
        await new Promise(resolve => setTimeout(resolve, 800));
        toast.info("Preview: Response submitted!");
        console.log("Mock Submit Data:", data);
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;
    if (!activity) return <div>Activity not found</div>;

    return (
        <div className="min-h-screen bg-slate-100 flex flex-col items-center py-10">
            <div className="bg-slate-900 text-white px-4 py-2 rounded-full mb-6 flex items-center gap-2 text-sm font-medium">
                <Smartphone className="w-4 h-4" /> Preview Mode
            </div>

            <main className="w-full max-w-md bg-white min-h-[600px] rounded-[3rem] shadow-2xl border-[8px] border-slate-900 overflow-hidden relative">
                {/* Mobile Status Bar Mock */}
                <div className="h-7 bg-slate-50 border-b border-slate-100 flex justify-between items-center px-6">
                    <div className="text-[10px] font-bold text-slate-900">9:41</div>
                    <div className="flex gap-1.5">
                        <div className="w-3 h-3 bg-slate-900 rounded-full opacity-20"></div>
                        <div className="w-3 h-3 bg-slate-900 rounded-full opacity-20"></div>
                    </div>
                </div>

                <div className="p-6 h-full overflow-y-auto">
                    {/* Activity Render */}
                    {(activity.type === "multiple_choice" || activity.type === "ranking" || activity.type === "competition") && (
                        <MultipleChoiceResponse
                            activity={activity}
                            participantId="preview-user"
                            onSubmit={(optId) => handleMockSubmit({ optionId: optId })}
                        />
                    )}
                    {activity.type === "open_ended" && (
                        <OpenEndedResponse
                            activity={activity}
                            participantId="preview-user"
                            onSubmit={(text) => handleMockSubmit({ text })}
                        />
                    )}
                    {/* Fallback for others */}
                    {!["multiple_choice", "ranking", "competition", "open_ended"].includes(activity.type) && (
                        <div className="text-center py-20 text-slate-400">
                            Preview not available for {activity.type} yet.
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
