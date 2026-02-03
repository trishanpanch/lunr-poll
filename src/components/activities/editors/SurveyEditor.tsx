import { Activity, ActivityType } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2, Plus, GripVertical } from "lucide-react";

interface SurveyEditorProps {
    activity: Activity;
    onChange: (updates: Partial<Activity>) => void;
}

export function SurveyEditor({ activity, onChange }: SurveyEditorProps) {
    const questions = activity.questions || [];

    const addQuestion = (type: ActivityType) => {
        const newQ: Activity = {
            id: crypto.randomUUID(),
            ownerId: activity.ownerId,
            title: "",
            type: type,
            status: "DRAFT",
            createdAt: activity.createdAt, // dummy
            updatedAt: activity.updatedAt, // dummy
            prompt: { text: "" },
            options: type === "multiple_choice" ? [
                { id: crypto.randomUUID(), content: { text: "Option 1" } },
                { id: crypto.randomUUID(), content: { text: "Option 2" } }
            ] : undefined,
            settings: {}
        };
        onChange({ questions: [...questions, newQ] });
    };

    const updateQuestion = (idx: number, updates: Partial<Activity>) => {
        const newQs = [...questions];
        newQs[idx] = { ...newQs[idx], ...updates };
        onChange({ questions: newQs });
    };

    // Helper to update nested options for MC
    const updateQuestionOption = (qIdx: number, optIdx: number, text: string) => {
        const newQs = [...questions];
        if (newQs[qIdx].options) {
            const newOpts = [...newQs[qIdx].options!];
            newOpts[optIdx] = { ...newOpts[optIdx], content: { ...newOpts[optIdx].content, text } };
            newQs[qIdx] = { ...newQs[qIdx], options: newOpts };
            onChange({ questions: newQs });
        }
    };

    const removeQuestion = (idx: number) => {
        const newQs = questions.filter((_, i) => i !== idx);
        onChange({ questions: newQs });
    };

    return (
        <div className="space-y-8 animate-in fade-in">
            <div className="space-y-4">
                {questions.map((q, idx) => (
                    <div key={q.id} className="relative group border border-slate-200 rounded-xl p-6 bg-white shadow-sm hover:border-slate-300 transition-all">
                        <div className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-300 cursor-move md:opacity-0 group-hover:opacity-100">
                            <GripVertical className="w-4 h-4" />
                        </div>

                        <div className="pl-6 space-y-4">
                            <div className="flex justify-between items-start gap-4">
                                <div className="space-y-1 flex-1">
                                    <Label className="text-xs text-slate-400 uppercase tracking-wider font-bold">
                                        Question {idx + 1} &middot; {q.type.replace("_", " ")}
                                    </Label>
                                    <Input
                                        value={q.prompt.text}
                                        onChange={(e) => updateQuestion(idx, { prompt: { ...q.prompt, text: e.target.value } })}
                                        placeholder="Question text..."
                                        className="font-medium text-lg border-transparent px-0 hover:border-slate-200 focus:border-primary focus:px-3 transition-all"
                                    />
                                </div>
                                <Button variant="ghost" size="icon" onClick={() => removeQuestion(idx)} className="text-slate-400 hover:text-red-600">
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>

                            {/* Question specific inputs */}
                            {q.type === "multiple_choice" && (
                                <div className="pl-0 space-y-2">
                                    {q.options?.map((opt, optIdx) => (
                                        <div key={opt.id} className="flex items-center gap-2">
                                            <div className="w-4 h-4 rounded-full border border-slate-300" />
                                            <Input
                                                value={opt.content.text}
                                                onChange={(e) => updateQuestionOption(idx, optIdx, e.target.value)}
                                                className="h-8 text-sm"
                                                placeholder={`Option ${optIdx + 1}`}
                                            />
                                        </div>
                                    ))}
                                    <Button
                                        variant="link"
                                        size="sm"
                                        className="h-6 px-0 text-slate-500"
                                        onClick={() => {
                                            const newOpt = { id: crypto.randomUUID(), content: { text: "New Option" } };
                                            const newQs = [...questions];
                                            newQs[idx].options = [...(newQs[idx].options || []), newOpt];
                                            onChange({ questions: newQs });
                                        }}
                                    >
                                        + Add Option
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            <div className="flex gap-4 justify-center py-4 border-t border-slate-100 border-dashed">
                <Button variant="outline" onClick={() => addQuestion("multiple_choice")}>
                    <Plus className="mr-2 w-4 h-4" /> Add Multiple Choice
                </Button>
                <Button variant="outline" onClick={() => addQuestion("open_ended")}>
                    <Plus className="mr-2 w-4 h-4" /> Add Text Question
                </Button>
            </div>
        </div>
    );
}
