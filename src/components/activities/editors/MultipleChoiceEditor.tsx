import { Activity, ActivityOption } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2, Plus, CheckCircle2, Circle } from "lucide-react";

interface MultipleChoiceEditorProps {
    activity: Activity;
    onChange: (updates: Partial<Activity>) => void;
}

export function MultipleChoiceEditor({ activity, onChange }: MultipleChoiceEditorProps) {
    const options = activity.options || [];

    const updateOption = (id: string, updates: Partial<ActivityOption> | Partial<{ content: any }>) => {
        const newOptions = options.map(opt => {
            if (opt.id !== id) return opt;
            // Handle content updates specifically or top-level updates
            if ('content' in updates) {
                return { ...opt, content: { ...opt.content, ...updates.content } };
            }
            return { ...opt, ...updates };
        });
        onChange({ options: newOptions });
    };

    const addOption = () => {
        const newOption: ActivityOption = {
            id: crypto.randomUUID(),
            content: { text: `Option ${options.length + 1}` },
            isCorrect: false
        };
        onChange({ options: [...options, newOption] });
    };

    const removeOption = (id: string) => {
        onChange({ options: options.filter(o => o.id !== id) });
    };

    return (
        <div className="space-y-6">
            <div className="space-y-4">
                <Label>Answer Options</Label>
                {options.map((option, idx) => (
                    <div key={option.id} className="flex items-start gap-3 group">
                        <button
                            className="mt-2.5 text-slate-400 hover:text-green-600 transition-colors"
                            onClick={() => updateOption(option.id, { isCorrect: !option.isCorrect })}
                            title="Mark as correct"
                        >
                            {option.isCorrect ? (
                                <CheckCircle2 className="w-5 h-5 text-green-600" />
                            ) : (
                                <Circle className="w-5 h-5" />
                            )}
                        </button>

                        <div className="flex-1 space-y-2">
                            <Input
                                value={option.content.text}
                                onChange={(e) => updateOption(option.id, { content: { text: e.target.value } })}
                                placeholder={`Option ${idx + 1}`}
                            />
                            {/* Rich Content Triggers logic would go here (Add Image) */}
                        </div>

                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeOption(option.id)}
                            className="text-slate-300 hover:text-red-500"
                        >
                            <Trash2 className="w-4 h-4" />
                        </Button>
                    </div>
                ))}

                <Button variant="outline" onClick={addOption} className="ml-8">
                    <Plus className="mr-2 w-4 h-4" /> Add Option
                </Button>
            </div>
        </div>
    );
}
