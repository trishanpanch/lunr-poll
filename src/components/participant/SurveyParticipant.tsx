import { useState } from "react";
import { Activity, ActivityType } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { submitResponse } from "@/lib/data/responses";
import { CheckCircle2, ChevronRight, Send, Loader2 } from "lucide-react";

interface SurveyParticipantProps {
    activity: Activity;
    participantId: string;
}

export function SurveyParticipant({ activity, participantId }: SurveyParticipantProps) {
    const questions = activity.questions || [];
    const [currentStep, setCurrentStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [completed, setCompleted] = useState(false);

    // Track answers locally to prevent duplicate submits if user goes back? 
    // For MVP, we just move forward. No Back button.

    const currentQ = questions[currentStep];

    const handleSubmitAnswer = async (answerContent: any) => {
        setLoading(true);
        // We submit with Parent Activity ID, but include questionId in content
        await submitResponse(activity.id, participantId, {
            questionId: currentQ.id,
            ...answerContent
        });
        setLoading(false);

        if (currentStep < questions.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            setCompleted(true);
        }
    };

    if (questions.length === 0) return <div>Empty Survey</div>;

    if (completed) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center animate-in zoom-in-50">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
                    <CheckCircle2 className="w-10 h-10 text-green-600" />
                </div>
                <h2 className="text-3xl font-serif font-bold text-slate-800 mb-2">You're all set!</h2>
                <p className="text-slate-500 max-w-xs mx-auto">
                    Thanks for completing the survey. You can close this window.
                </p>
            </div>
        );
    }

    const progress = ((currentStep) / questions.length) * 100;

    return (
        <div className="flex flex-col h-full max-w-2xl mx-auto py-8 px-4">
            {/* Progress Bar */}
            <div className="w-full h-1 bg-slate-100 rounded-full mb-8 overflow-hidden">
                <div className="h-full bg-primary transition-all duration-500" style={{ width: `${progress}%` }} />
            </div>

            <div className="flex-1 flex flex-col justify-center space-y-8 animate-in slide-in-from-right-8 fade-in duration-300" key={currentStep}>
                <div className="space-y-2">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                        Question {currentStep + 1} of {questions.length}
                    </span>
                    <h2 className="text-2xl md:text-3xl font-serif font-medium text-slate-900 leading-snug">
                        {currentQ.prompt.text}
                    </h2>
                </div>

                <div className="flex-1">
                    {currentQ.type === "multiple_choice" && (
                        <MCStep question={currentQ} onSubmit={handleSubmitAnswer} loading={loading} />
                    )}
                    {currentQ.type === "open_ended" && (
                        <TextStep question={currentQ} onSubmit={handleSubmitAnswer} loading={loading} />
                    )}
                </div>
            </div>
        </div>
    );
}

// Sub-components for cleaner render
function MCStep({ question, onSubmit, loading }: { question: Activity, onSubmit: (v: any) => void, loading: boolean }) {
    return (
        <div className="grid gap-3">
            {question.options?.map((opt) => (
                <button
                    key={opt.id}
                    disabled={loading}
                    onClick={() => onSubmit({ optionId: opt.id })}
                    className="p-4 rounded-xl border-2 border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 text-left transition-all active:scale-[0.98]"
                >
                    <div className="font-medium text-lg text-slate-700">{opt.content.text}</div>
                </button>
            ))}
        </div>
    );
}

function TextStep({ question, onSubmit, loading }: { question: Activity, onSubmit: (v: any) => void, loading: boolean }) {
    const [text, setText] = useState("");
    return (
        <div className="space-y-4">
            <Textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Type your answer..."
                className="min-h-[150px] text-lg p-4 bg-white border-slate-200"
                autoFocus
            />
            <Button
                onClick={() => onSubmit({ text })}
                disabled={!text.trim() || loading}
                className="w-full h-12 text-lg"
            >
                {loading ? <Loader2 className="animate-spin" /> : <>Next <ChevronRight className="ml-2 w-4 h-4" /></>}
            </Button>
        </div>
    )
}
