import { useState, useEffect } from "react";
import { Activity } from "@/lib/types";
import { submitResponse } from "@/lib/data/responses";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Timer } from "lucide-react";

interface CompetitionParticipantProps {
    activity: Activity;
    participantId: string;
}

export function CompetitionParticipant({ activity, participantId }: CompetitionParticipantProps) {
    const totalTime = activity.settings?.timerSeconds || 30;
    const [timeLeft, setTimeLeft] = useState(totalTime);
    const [startTime] = useState(Date.now());

    // State
    const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [score, setScore] = useState(0);

    // Timer Logic
    useEffect(() => {
        if (submitted || timeLeft <= 0) return;

        const timer = setInterval(() => {
            setTimeLeft(prev => Math.max(0, prev - 1));
        }, 1000);

        return () => clearInterval(timer);
    }, [submitted, timeLeft]);

    const handleSelect = (optionId: string) => {
        if (submitted || timeLeft <= 0) return;
        setSelectedOptionId(optionId);
    };

    const handleSubmit = async () => {
        if (!selectedOptionId || submitted) return;
        setSubmitting(true);

        // Score Algorithm
        // 1. Check Correctness
        const option = activity.options?.find(o => o.id === selectedOptionId);
        const isCorrect = option?.isCorrect;

        // 2. Calculate Score
        // Base Points: 1000 for correct.
        // Time Bonus: Up to 500 extra points for speed.
        // Max Score = 1500.
        // Min Score (if correct) = 1000.
        // Logic: Bonus = 500 * (TimeLeft / TotalTime)

        let calculatedScore = 0;
        if (isCorrect) {
            const timeBonus = Math.floor(500 * (timeLeft / totalTime));
            calculatedScore = 1000 + timeBonus;
        }

        try {
            await submitResponse(activity.id, participantId, {
                optionId: selectedOptionId,
                score: calculatedScore
            });
            setScore(calculatedScore);
            setSubmitted(true);
            toast.success(isCorrect ? "Answer Submitted!" : "Submitted!");
        } catch (e) {
            console.error(e);
            toast.error("Failed to submit");
        } finally {
            setSubmitting(false);
        }
    };

    const progressValue = (timeLeft / totalTime) * 100;

    return (
        <div className="max-w-xl mx-auto p-4 w-full">
            {/* Header / Timer */}
            <div className="mb-6 space-y-2">
                <div className="flex justify-between items-center text-slate-600 font-bold">
                    <span className="flex items-center gap-2">
                        <Timer className="w-5 h-5" />
                        {timeLeft}s
                    </span>
                    <span>{submitted ? `Score: ${score}` : "Quiz Mode"}</span>
                </div>
                <Progress value={progressValue} className={`h-2 ${timeLeft < 5 ? 'bg-rose-100' : ''}`} />
            </div>

            <h1 className="text-xl font-serif font-bold text-center mb-8">{activity.prompt.text}</h1>

            <div className="space-y-3">
                {activity.options?.map((option) => (
                    <button
                        key={option.id}
                        disabled={submitted || timeLeft <= 0}
                        onClick={() => handleSelect(option.id)}
                        className={`w-full p-4 text-left rounded-xl border-2 transition-all duration-200
                            ${selectedOptionId === option.id
                                ? "border-slate-800 bg-slate-50 shadow-md"
                                : "border-slate-200 hover:border-slate-300 bg-white"
                            }
                            ${submitted && option.isCorrect ? "bg-emerald-50 border-emerald-500" : ""}
                            ${submitted && selectedOptionId === option.id && !option.isCorrect ? "bg-rose-50 border-rose-500" : ""}
                        `}
                    >
                        <span className="font-medium text-lg">{option.content.text}</span>
                    </button>
                ))}
            </div>

            <div className="mt-8">
                <Button
                    onClick={handleSubmit}
                    disabled={!selectedOptionId || submitting || submitted || timeLeft <= 0}
                    className="w-full"
                    size="lg"
                >
                    {submitting ? "Sending..." : submitted ? "Waiting for results..." : "Lock In Answer"}
                </Button>
            </div>
        </div>
    );
}
