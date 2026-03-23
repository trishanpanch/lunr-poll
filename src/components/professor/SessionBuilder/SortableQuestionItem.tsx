"use client";

import { Question } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Trash2, GripVertical } from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface SortableQuestionItemProps {
    q: Question;
    updateQuestion: (id: string, updates: Partial<Question>) => void;
    removeQuestion: (id: string) => void;
}

export function SortableQuestionItem({ q, updateQuestion, removeQuestion }: SortableQuestionItemProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition
    } = useSortable({ id: q.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition
    };

    return (
        <div ref={setNodeRef} style={style} className="mb-4">
            <Card className="relative group border-slate-200">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-slate-200 rounded-l-xl group-hover:bg-primary transition-colors"></div>
                <CardContent className="p-6 space-y-4">
                    <div className="flex items-start gap-4">
                        <div
                            {...attributes}
                            {...listeners}
                            className="mt-3 cursor-move text-slate-300 hover:text-slate-500 touch-none outline-none"
                        >
                            <GripVertical className="w-5 h-5" />
                        </div>
                        <div className="flex-1 space-y-4">
                            <div className="flex justify-between items-start">
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                                    {q.type.replace("_", " ")}
                                </span>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => removeQuestion(q.id)}
                                    className="text-slate-400 hover:text-red-600"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                            <Input
                                value={q.text}
                                onChange={(e) => updateQuestion(q.id, { text: e.target.value })}
                                className="text-lg font-medium border-transparent hover:border-slate-200 focus:border-primary transition-all px-0"
                                placeholder="Enter question text..."
                            />

                            {q.type === "multiple_choice" && (
                                <div className="space-y-2 pl-4 border-l-2 border-slate-100">
                                    {q.options?.map((opt, optIdx) => (
                                        <div key={optIdx} className="flex items-center gap-2">
                                            <div className="w-4 h-4 rounded-full border border-slate-300"></div>
                                            <Input
                                                value={opt}
                                                onChange={(e) => {
                                                    const newOpts = [...(q.options || [])];
                                                    newOpts[optIdx] = e.target.value;
                                                    updateQuestion(q.id, { options: newOpts });
                                                }}
                                                className="h-8 text-sm"
                                            />
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-slate-300 hover:text-red-500"
                                                onClick={() => {
                                                    const newOpts = q.options?.filter((_, i) => i !== optIdx);
                                                    updateQuestion(q.id, { options: newOpts });
                                                }}
                                            >
                                                <Trash2 className="w-3 h-3" />
                                            </Button>
                                        </div>
                                    ))}
                                    <Button
                                        variant="link"
                                        size="sm"
                                        className="text-primary p-0 h-auto"
                                        onClick={() =>
                                            updateQuestion(q.id, {
                                                options: [...(q.options || []), `Option ${q.options!.length + 1}`]
                                            })
                                        }
                                    >
                                        + Add Option
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
