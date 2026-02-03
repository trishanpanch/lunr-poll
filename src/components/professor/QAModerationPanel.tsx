import { useState, useEffect } from "react";
import { Activity, Response } from "@/lib/types";
import { useResponses } from "@/lib/data/responses";
import { db } from "@/lib/firebase/client";
import { doc, updateDoc, deleteDoc } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Check, X, Star, Trash2, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

interface QAModerationPanelProps {
    activity: Activity;
}

export function QAModerationPanel({ activity }: QAModerationPanelProps) {
    const [responses, setResponses] = useState<Response[]>([]);

    // For now, simple client-side toggle for visualization. 
    // Real moderation toggle should update activity.settings.moderationEnabled
    const [moderationEnabled, setModerationEnabled] = useState(false);

    useEffect(() => {
        const unsub = useResponses(activity.id, setResponses);
        return () => unsub();
    }, [activity.id]);

    const handleUpdateStatus = async (id: string, status: "APPROVED" | "PENDING" | "REJECTED" | "FEATURED") => {
        try {
            await updateDoc(doc(db, "responses", id), { status });
            toast.success("Updated");
        } catch (e) { console.error(e); }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Delete this question?")) return;
        try {
            await deleteDoc(doc(db, "responses", id));
        } catch (e) { console.error(e); }
    };

    const pending = responses.filter(r => r.status === "PENDING");
    const live = responses.filter(r => r.status === "APPROVED" || r.status === "FEATURED" || !r.status); // Default to live if no status

    return (
        <div className="h-full flex flex-col md:flex-row gap-6 p-6 bg-slate-50 overflow-hidden">
            {/* Live Lane */}
            <div className="flex-1 flex flex-col bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /> Live Q&A
                    </h3>
                    <Badge variant="secondary">{live.length}</Badge>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    <AnimatePresence>
                        {live.sort((a, b) => (b.upvotes || 0) - (a.upvotes || 0)).map(r => (
                            <QuestionCard
                                key={r.id}
                                response={r}
                                onAction={handleUpdateStatus}
                                onDelete={handleDelete}
                                isLive
                            />
                        ))}
                    </AnimatePresence>
                    {live.length === 0 && <div className="text-center text-slate-400 py-10 italic">No questions yet</div>}
                </div>
            </div>

            {/* Moderation Lane (Show conditionally or always?) */}
            {moderationEnabled && (
                <div className="flex-1 flex flex-col bg-slate-100 rounded-xl border border-slate-200 shadow-inner overflow-hidden">
                    <div className="p-4 border-b border-slate-200 flex justify-between items-center">
                        <h3 className="font-bold text-slate-700 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-yellow-500" /> Moderation Queue
                        </h3>
                        <Badge variant="outline" className="bg-white">{pending.length}</Badge>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        <AnimatePresence>
                            {pending.map(r => (
                                <QuestionCard
                                    key={r.id}
                                    response={r}
                                    onAction={handleUpdateStatus}
                                    onDelete={handleDelete}
                                />
                            ))}
                        </AnimatePresence>
                        {pending.length === 0 && <div className="text-center text-slate-400 py-10 italic">Queue empty</div>}
                    </div>
                </div>
            )}

            {!moderationEnabled && (
                <div className="absolute bottom-6 right-6">
                    <Button onClick={() => setModerationEnabled(true)} variant="outline" className="shadow-lg backdrop-blur bg-white/80">
                        Enable Moderation View
                    </Button>
                </div>
            )}
        </div>
    );
}

function QuestionCard({
    response, onAction, onDelete, isLive
}: {
    response: Response,
    onAction: (id: string, s: any) => void,
    onDelete: (id: string) => void,
    isLive?: boolean
}) {
    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className={`p-3 rounded-lg border shadow-sm ${response.status === 'FEATURED' ? 'bg-amber-50 border-amber-200' : 'bg-white border-slate-200'}`}
        >
            <div className="flex justify-between gap-4">
                <p className="text-sm font-medium text-slate-800 flex-1">{response.content.text}</p>
                <div className="text-xs text-slate-400 font-mono whitespace-nowrap">
                    {response.upvotes || 0} votes
                </div>
            </div>

            <div className="mt-3 flex gap-2 justify-end">
                {isLive ? (
                    <>
                        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => onAction(response.id, response.status === 'FEATURED' ? 'APPROVED' : 'FEATURED')}>
                            <Star className={`w-3 h-3 ${response.status === 'FEATURED' ? 'fill-amber-400 text-amber-500' : 'text-slate-400'}`} />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-6 w-6 text-slate-400 hover:text-red-500" onClick={() => onAction(response.id, "REJECTED")}>
                            <EyeOff className="w-3 h-3" />
                        </Button>
                    </>
                ) : (
                    <>
                        <Button size="sm" className="h-7 bg-green-600 hover:bg-green-700 text-white" onClick={() => onAction(response.id, "APPROVED")}>
                            <Check className="w-3 h-3 mr-1" /> Approve
                        </Button>
                        <Button size="sm" variant="ghost" className="h-7 text-red-500 hover:bg-red-50" onClick={() => onAction(response.id, "REJECTED")}>
                            <X className="w-3 h-3" />
                        </Button>
                    </>
                )}
                <Button size="icon" variant="ghost" className="h-6 w-6 text-slate-300 hover:text-red-600 ml-2" onClick={() => onDelete(response.id)}>
                    <Trash2 className="w-3 h-3" />
                </Button>
            </div>
        </motion.div>
    );
}
