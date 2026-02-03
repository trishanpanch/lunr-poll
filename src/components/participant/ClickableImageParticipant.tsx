import { useState } from "react";
import { Activity } from "@/lib/types";
import { submitResponse } from "@/lib/data/responses";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { motion } from "framer-motion";

interface ClickableImageParticipantProps {
    activity: Activity;
    participantId: string;
}

export function ClickableImageParticipant({ activity, participantId }: ClickableImageParticipantProps) {
    const [selection, setSelection] = useState<{ x: number, y: number } | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const imageUrl = activity.content?.imageUrl;

    const handleImageClick = (e: React.MouseEvent<HTMLImageElement>) => {
        if (submitted) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width;
        const y = (e.clientY - rect.top) / rect.height;
        setSelection({ x, y });
    };

    const handleSubmit = async () => {
        if (!selection) return;
        setSubmitting(true);
        try {
            await submitResponse(activity.id, participantId, { x: selection.x, y: selection.y });
            setSubmitted(true);
            toast.success("Response sent!");
        } catch (e) {
            console.error(e);
            toast.error("Failed to send");
        } finally {
            setSubmitting(false);
        }
    };

    if (!imageUrl) return <div className="text-center p-10">No image provided by professor.</div>;

    return (
        <div className="flex flex-col h-full max-w-2xl mx-auto p-4">
            <h1 className="text-xl font-serif font-bold text-center mb-6">{activity.prompt.text}</h1>

            <div className="flex-1 flex flex-col items-center justify-center">
                <div className="relative inline-block border border-slate-200 rounded-lg overflow-hidden shadow-sm">
                    <img
                        src={imageUrl}
                        alt="Activity Target"
                        onClick={handleImageClick}
                        className={`max-h-[60vh] object-contain cursor-crosshair ${submitted ? 'opacity-50' : ''}`}
                    />
                    {selection && (
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute w-4 h-4 bg-rose-600 rounded-full border-2 border-white shadow-md transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                            style={{ left: `${selection.x * 100}%`, top: `${selection.y * 100}%` }}
                        />
                    )}
                </div>
                <p className="text-sm text-slate-500 mt-2">
                    {submitted ? "Response recorded." : "Tap on the image to select a location."}
                </p>
            </div>

            <div className="mt-6">
                <Button
                    onClick={handleSubmit}
                    disabled={!selection || submitting || submitted}
                    className="w-full"
                    size="lg"
                >
                    {submitting ? "Sending..." : submitted ? "Updated" : "Submit Answer"}
                </Button>
            </div>
        </div>
    );
}
