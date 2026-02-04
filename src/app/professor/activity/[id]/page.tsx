"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { auth } from "@/lib/firebase/client";
import { onAuthStateChanged } from "firebase/auth";
import { getActivity, updateActivity } from "@/lib/data/activities";
import { subscribeToUserProfile, activateActivity } from "@/lib/data/users";
import { Activity } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MultipleChoiceEditor } from "@/components/activities/editors/MultipleChoiceEditor";
import { OpenEndedEditor } from "@/components/activities/editors/OpenEndedEditor";
import { SurveyEditor } from "@/components/activities/editors/SurveyEditor";
import { ClickableImageEditor } from "@/components/activities/editors/ClickableImageEditor";
import { QAModerationPanel } from "@/components/professor/QAModerationPanel";
import { ActivitySettings } from "@/components/activities/editors/ActivitySettings";
import { ArrowLeft, Save, Loader2, Play, Eye } from "lucide-react";
import { toast } from "sonner";

// Simple debounce utility
function debounce<T extends (...args: any[]) => any>(func: T, wait: number) {
    let timeout: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
}

export default function ActivityPage() {
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;

    const [isLive, setIsLive] = useState(false);
    const [user, setUser] = useState<any>(null);

    const [activity, setActivity] = useState<Activity | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const fetchActivity = async () => {
            try {
                const data = await getActivity(id);
                if (data) setActivity(data);
                else {
                    toast.error("Activity not found");
                    router.push("/professor/activities");
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetchActivity();
    }, [id, router]);

    // Subscribe to Auth & User Profile to check Live State
    useEffect(() => {
        const unsub = onAuthStateChanged(auth, (u) => {
            if (u) {
                setUser(u);
                // Subscribe to profile to see if this activity is live
                // (Ideally we put subscribeToUserProfile in a hook)
                // Subscribe using imported helper
                return subscribeToUserProfile(u.uid, (p: any) => {
                    setIsLive(p?.currentActivityId === id);
                });
            }
        });
        return () => unsub();
    }, [id]);

    // Auto-save logic
    const saveToCloud = async (newData: Activity) => {
        setSaving(true);
        try {
            await updateActivity(id, newData);
        } catch (e) {
            console.error("Save failed", e);
            toast.error("Failed to save changes");
        } finally {
            setSaving(false);
        }
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
    const debouncedSave = useCallback(
        debounce((data: Activity) => saveToCloud(data), 1000),
        [] // stable across renders
    );

    const handleUpdate = (updates: Partial<Activity>) => {
        if (!activity) return;
        const newData = { ...activity, ...updates };
        setActivity(newData);
        // Optimistic update locally, then debounce save
        debouncedSave(newData);
    };

    const toggleLive = async () => {
        if (!user) return;
        if (isLive) {
            await activateActivity(user.uid, null); // Stop
        } else {
            await activateActivity(user.uid, id); // Start
            toast.success("Activity is LIVE!");
        }
    };

    if (loading) return <div className="p-20 text-center">Loading editor...</div>;
    if (!activity) return null;

    return (
        <main className="h-screen flex flex-col bg-slate-50 over">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-6 shrink-0">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.push("/professor/activities")}>
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div className="flex flex-col">
                        <Input
                            value={activity.title}
                            onChange={(e) => handleUpdate({ title: e.target.value })}
                            className="h-8 text-lg font-bold border-transparent hover:border-slate-200 px-2 -ml-2 w-64 md:w-96"
                        />
                        <span className="text-xs text-slate-500 px-0.5 capitalize">{activity.type.replace("_", " ")}</span>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-400">
                        {saving ? "Saving..." : "Saved"}
                    </span>
                    <Button
                        variant="outline"
                        onClick={() => window.open(`/u/preview/${id}`, '_blank')}
                        className="mr-2"
                    >
                        <Eye className="mr-2 w-4 h-4" /> Preview
                    </Button>
                    <Button
                        onClick={async () => {
                            await toggleLive();
                            // Open Present View in new tab
                            window.open(`/professor/activity/${id}/present`, '_blank');
                        }}
                        className={isLive ? "bg-red-600 hover:bg-red-700 animate-pulse" : "bg-primary hover:bg-rose-800"}
                    >
                        {isLive ? (
                            <><div className="w-2 h-2 bg-white rounded-full mr-2" /> Stop Presenting</>
                        ) : (
                            <><Play className="mr-2 w-4 h-4" /> Present</>
                        )}
                    </Button>
                </div>
            </header>

            <div className="flex-1 flex overflow-hidden">
                {/* Main Editor */}
                <div className="flex-1 overflow-y-auto p-8">
                    <div className="max-w-3xl mx-auto space-y-8">
                        {/* Prompt Input */}
                        <div className="space-y-2">
                            <Textarea
                                value={activity.prompt.text}
                                onChange={(e) => handleUpdate({ prompt: { ...activity.prompt, text: e.target.value } })}
                                placeholder="What would you like to ask?"
                                className="text-2xl font-serif font-medium border-none shadow-none resize-none p-0 bg-transparent placeholder:text-slate-300 focus-visible:ring-0 min-h-[80px]"
                            />
                        </div>

                        {/* Type Interface */}
                        {(activity.type === "multiple_choice" || activity.type === "ranking" || activity.type === "competition") && (
                            <MultipleChoiceEditor activity={activity} onChange={handleUpdate} />
                        )}
                        {activity.type === "open_ended" && (
                            <OpenEndedEditor activity={activity} onChange={handleUpdate} />
                        )}
                        {activity.type === "word_cloud" && (
                            <OpenEndedEditor activity={activity} onChange={handleUpdate} />
                        )}
                        {activity.type === "survey" && (
                            <SurveyEditor activity={activity} onChange={handleUpdate} />
                        )}
                        {activity.type === "qa" && (
                            <QAModerationPanel activity={activity} />
                        )}
                        {activity.type === "clickable_image" && (
                            <ClickableImageEditor activity={activity} onChange={handleUpdate} />
                        )}
                        {/* Add other types here */}

                    </div>
                </div>

                {/* Settings Sidebar */}
                <div className="w-80 bg-white border-l border-slate-200 overflow-y-auto hidden md:block">
                    <ActivitySettings activity={activity} onChange={handleUpdate} />
                </div>
            </div>
        </main>
    );
}
