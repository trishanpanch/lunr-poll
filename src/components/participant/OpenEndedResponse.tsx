import { useState, useEffect } from "react";
import { Activity } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { submitResponse, updateResponse, useMyResponse } from "@/lib/data/responses";
import { Send, Loader2 } from "lucide-react";
import { RichText } from "@/components/ui/RichText";
import { toast } from "sonner";

interface OpenEndedResponseProps {
    activity: Activity;
    participantId: string;
    onSubmit?: (text: string) => Promise<void>;
}

export function OpenEndedResponse({ activity, participantId, onSubmit }: OpenEndedResponseProps) {
    const [text, setText] = useState("");
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [responseId, setResponseId] = useState<string | null>(null);

    const allowChange = activity.settings?.allowChangeAnswer ?? false;

    // Load existing response
    useEffect(() => {
        if (!activity.id || !participantId) return;
        if (onSubmit) return;

        const unsub = useMyResponse(activity.id, participantId, (data) => {
            if (data) {
                setResponseId(data.id);
                setSubmitted(true);
                if (data.content?.text) {
                    setText(data.content.text);
                }
            } else {
                setSubmitted(false);
                setResponseId(null);
            }
        });
        return () => unsub();
    }, [activity.id, participantId, onSubmit]);

    const handleSubmit = async () => {
        if (!text.trim()) return;
        setLoading(true);

        try {
            if (onSubmit) {
                await onSubmit(text);
                setSubmitted(true);
            } else {
                if (responseId && allowChange) {
                    await updateResponse(responseId, { content: { text } });
                    toast.success("Answer updated");
                } else {
                    await submitResponse(activity.id, participantId, { text });
                    toast.success("Answer submitted");
                }
            }
        } catch (e) {
            console.error(e);
            toast.error("Failed to submit");
        } finally {
            setLoading(false);
        }
    };

    if (submitted && !allowChange) {
        return (
            <div className="space-y-6 text-center py-10 animate-in fade-in">
                <h2 className="text-xl font-medium text-slate-900">Response Sent!</h2>
                <p className="text-slate-500">Your answer has been recorded.</p>
                {/* No 'Edit' button if allowChange is false */}
            </div>
        );
    }

    // If allowChange is true, we stay in the edit view but show "Update" instead of "Submit"
    // Or we show the "Response Sent" screen with an "Edit" button? Use "Edit" button for better UX.

    if (submitted && allowChange && !loading) {
        return (
            <div className="space-y-6 text-center py-10 animate-in fade-in">
                <h2 className="text-xl font-medium text-slate-900">Response Recorded</h2>
                <div className="bg-slate-50 p-4 rounded-xl text-left border border-slate-100 italic text-slate-600">
                    "{text}"
                </div>
                <Button variant="outline" onClick={() => setSubmitted(false)}>Change Answer</Button>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in slide-in-from-bottom-4">
            <div className="text-xl md:text-2xl font-serif font-medium text-slate-900 leading-snug">
                <RichText content={activity.prompt.text} />
            </div>

            <div className="space-y-4">
                <Textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Type your answer here..."
                    className="min-h-[150px] text-lg p-4 bg-white border-slate-200 focus:border-primary"
                />
                <Button
                    onClick={handleSubmit}
                    disabled={loading || !text.trim()}
                    className="w-full h-12 text-lg rounded-xl bg-primary hover:bg-rose-800"
                >
                    {loading ? <Loader2 className="animate-spin w-5 h-5" /> : (
                        <>{responseId ? "Update Answer" : "Submit Answer"} <Send className="ml-2 w-4 h-4" /></>
                    )}
                </Button>
            </div>
        </div>
    );
}
