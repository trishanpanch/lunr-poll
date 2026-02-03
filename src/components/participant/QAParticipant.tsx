import { useState, useEffect } from "react";
import { Activity, Response } from "@/lib/types";
import { useResponses, submitResponse } from "@/lib/data/responses";
import { toggleUpvote } from "@/lib/data/upvotes";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Heart, Send, MessageSquare } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface QAParticipantProps {
    activity: Activity;
    participantId: string;
}

export function QAParticipant({ activity, participantId }: QAParticipantProps) {
    const [responses, setResponses] = useState<Response[]>([]);
    const [newQuestion, setNewQuestion] = useState("");
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        const unsub = useResponses(activity.id, (data) => {
            // Filter out rejected/archived if we had them. 
            // For now show everything unless moderation enabled (later).
            // Sort by Upvotes (desc) then Time (desc)
            const sorted = data.sort((a, b) => {
                const nav = a.upvotes || 0;
                const nbv = b.upvotes || 0;
                if (nav !== nbv) return nbv - nav; // Higher votes first
                return b.submittedAt?.toMillis() - a.submittedAt?.toMillis(); // Newer first
            });
            setResponses(sorted);
        });
        return () => unsub();
    }, [activity.id]);

    const handleSubmit = async () => {
        if (!newQuestion.trim()) return;
        setSubmitting(true);
        try {
            await submitResponse(activity.id, participantId, {
                text: newQuestion
            }, "qa"); // "qa" context implies it has status PENDING if moderated
            setNewQuestion("");
        } catch (e) {
            console.error(e);
        } finally {
            setSubmitting(false);
        }
    };

    const handleVote = (r: Response) => {
        toggleUpvote(r.id, participantId);
    };

    return (
        <div className="flex flex-col h-[calc(100vh-80px)] max-w-2xl mx-auto p-4">
            {/* Header */}
            <div className="flex-none mb-6">
                <h1 className="text-2xl font-serif font-bold text-slate-900">{activity.prompt.text}</h1>
                <p className="text-slate-500 text-sm mt-1">
                    Ask a question or upvote existing ones.
                </p>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-2 pb-20">
                <AnimatePresence initial={false}>
                    {responses.length === 0 ? (
                        <div className="py-20 text-center text-slate-400">
                            <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-20" />
                            <p>No questions yet. Be the first!</p>
                        </div>
                    ) : (
                        responses.map((r) => {
                            const isLiked = r.upvoterIds?.includes(participantId);
                            const isAuthor = r.participantId === participantId;

                            // If moderation is on and status is PENDING, only show to author
                            const isPending = r.status === "PENDING";
                            if (isPending && !isAuthor) return null;

                            return (
                                <motion.div
                                    key={r.id}
                                    layout
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`p-4 rounded-xl border ${isPending ? 'border-yellow-200 bg-yellow-50' : 'border-slate-200 bg-white'} shadow-sm flex gap-4`}
                                >
                                    <div className="flex flex-col items-center gap-1 min-w-[3rem]">
                                        <button
                                            onClick={() => handleVote(r)}
                                            className={`p-2 rounded-full transition-all active:scale-90 ${isLiked ? 'text-rose-500 bg-rose-50' : 'text-slate-400 hover:bg-slate-100'}`}
                                        >
                                            <Heart className={`w-6 h-6 ${isLiked ? 'fill-current' : ''}`} />
                                        </button>
                                        <span className={`font-bold text-sm ${isLiked ? 'text-rose-600' : 'text-slate-500'}`}>
                                            {r.upvotes || 0}
                                        </span>
                                    </div>
                                    <div className="flex-1 pt-1">
                                        <p className="text-lg text-slate-800 leading-relaxed font-medium">
                                            {r.content.text}
                                        </p>
                                        {isPending && (
                                            <span className="inline-block mt-2 text-xs font-bold text-yellow-600 bg-yellow-100 px-2 py-0.5 rounded">
                                                Pending Approval
                                            </span>
                                        )}
                                    </div>
                                </motion.div>
                            )
                        })
                    )}
                </AnimatePresence>
            </div>

            {/* Input - Fixed Bottom */}
            <div className="fixed bottom-0 left-0 w-full bg-white border-t border-slate-200 p-4 md:p-6 pb-8 z-10">
                <div className="max-w-2xl mx-auto flex gap-3">
                    <Textarea
                        value={newQuestion}
                        onChange={e => setNewQuestion(e.target.value)}
                        placeholder="Type your question..."
                        className="min-h-[3rem] max-h-[10rem] resize-none text-base bg-slate-50"
                        onKeyDown={e => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSubmit();
                            }
                        }}
                    />
                    <Button
                        onClick={handleSubmit}
                        disabled={submitting || !newQuestion.trim()}
                        className="h-auto aspect-square rounded-xl"
                    >
                        <Send className="w-5 h-5" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
