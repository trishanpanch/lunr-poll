"use client";

import { Textarea } from "@/components/ui/textarea";

interface TextQuestionProps {
    answer: string;
    onChange: (value: string) => void;
}

export function TextQuestion({ answer, onChange }: TextQuestionProps) {
    return (
        <Textarea
            placeholder="Type your response..."
            value={answer}
            onChange={(e) => onChange(e.target.value)}
            className="min-h-[120px] bg-white border-slate-200 focus:border-primary focus:ring-primary rounded-xl"
        />
    );
}
