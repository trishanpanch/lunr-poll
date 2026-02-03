import { useState, useEffect } from "react";
import { Activity } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { RichText } from "@/components/ui/RichText";
import { useMyResponse, submitResponse, updateResponse } from "@/lib/data/responses";
import { CheckCircle2, Loader2 } from "lucide-react";

interface MultipleChoiceResponseProps {
    activity: Activity;
    participantId: string;
    onSubmit?: (optionId: string | string[]) => Promise<void>;
}

export function MultipleChoiceResponse({ activity, participantId, onSubmit }: MultipleChoiceResponseProps) {
    const [selectedOptionIds, setSelectedOptionIds] = useState<string[]>([]);
    const [submitted, setSubmitted] = useState(false);
    const [responseId, setResponseId] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    // Settings
    const isMulti = (activity.settings?.optionSelectionLimit || 1) > 1;
    const limit = activity.settings?.optionSelectionLimit || 1;
    const allowChange = activity.settings?.allowChangeAnswer ?? false;

    // Load existing response
    useEffect(() => {
        if (!activity.id || !participantId) return;

        // If preview mode (onSubmit provided), skip DB check
        if (onSubmit) return;

        const unsub = useMyResponse(activity.id, participantId, (data) => {
            if (data) {
                setResponseId(data.id);
                setSubmitted(true);
                // Hydrate selection
                if (data.content?.optionId) {
                    setSelectedOptionIds([data.content.optionId]);
                } else if (data.content?.optionIds) {
                    setSelectedOptionIds(data.content.optionIds);
                }
            } else {
                setSubmitted(false);
                setResponseId(null);
            }
        });
        return () => unsub();
    }, [activity.id, participantId, onSubmit]);

    const handleOptionClick = async (optionId: string) => {
        if (submitted && !allowChange) return;

        let newSelection = [...selectedOptionIds];

        if (isMulti) {
            if (newSelection.includes(optionId)) {
                newSelection = newSelection.filter(id => id !== optionId);
            } else {
                if (newSelection.length < limit) {
                    newSelection.push(optionId);
                } else {
                    // Start replacing oldest? Or block? Block is standard.
                    toast.error(`Select up to ${limit} options.`);
                    return;
                }
            }
        } else {
            // Single select: Immediate submit usually, unless allowChange
            newSelection = [optionId];
        }

        setSelectedOptionIds(newSelection);

        // Auto-submit for Single Select
        if (!isMulti) {
            await submitSelection(newSelection);
        }
    };

    const submitSelection = async (ids: string[]) => {
        setLoading(true);
        const content = isMulti ? { optionIds: ids } : { optionId: ids[0] };

        try {
            if (onSubmit) {
                // Preview Mode
                await onSubmit(isMulti ? ids : ids[0]);
                setSubmitted(true);
            } else {
                if (responseId && allowChange) {
                    await updateResponse(responseId, { content });
                } else {
                    await submitResponse(activity.id, participantId, content);
                }
            }
        } catch (e) {
            console.error(e);
            toast.error("Failed to submit");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 animate-in slide-in-from-bottom-4 fad-in duration-500">
            <div className="text-xl md:text-2xl font-serif font-medium text-slate-900 leading-snug">
                <RichText content={activity.prompt.text} />
            </div>

            <div className="grid gap-3">
                {activity.options?.map((option) => {
                    const isSelected = selectedOptionIds.includes(option.id);
                    const isDisabled = (submitted && !allowChange) || loading;

                    return (
                        <button
                            key={option.id}
                            disabled={isDisabled}
                            onClick={() => handleOptionClick(option.id)}
                            className={`
                                relative p-4 rounded-xl border-2 text-left transition-all
                                ${isSelected
                                    ? "border-primary bg-rose-50 text-primary"
                                    : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                                }
                                ${isDisabled ? "opacity-60 cursor-not-allowed" : ""}
                            `}
                        >
                            <RichText content={option.content.text} className="prose-p:m-0 prose-headings:m-0 text-base" />
                            {isSelected && (
                                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                    <CheckCircle2 className="w-5 h-5 text-primary" />
                                </div>
                            )}
                        </button>
                    );
                })}
            </div>

            {isMulti && (
                <Button
                    onClick={() => submitSelection(selectedOptionIds)}
                    disabled={selectedOptionIds.length === 0 || (submitted && !allowChange) || loading}
                    className="w-full bg-primary"
                >
                    {loading ? <Loader2 className="animate-spin" /> : (submitted ? "Update Answer" : "Submit")}
                </Button>
            )}

            {submitted && (
                <div className="text-center text-sm text-slate-500 animate-in fade-in pt-4">
                    {allowChange ? "Response recorded. You can change it." : "Response recorded. Waiting for next slide..."}
                </div>
            )}
        </div>
    );
}
