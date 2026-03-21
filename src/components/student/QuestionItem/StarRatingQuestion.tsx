"use client";

import { StarRating } from "@/components/ui/StarRating";

interface StarRatingQuestionProps {
    answer: string;
    onChange: (value: string) => void;
}

export function StarRatingQuestion({ answer, onChange }: StarRatingQuestionProps) {
    const value = parseFloat(answer || "0");

    return (
        <div className="flex flex-col items-center justify-center py-10 bg-slate-50/50 rounded-xl border border-slate-100">
            <StarRating
                value={value}
                onChange={(val) => onChange(val.toString())}
                size="lg"
                className="justify-center"
            />
            <p className="mt-4 text-slate-400 text-sm font-medium uppercase tracking-widest">
                {answer ? (value === 5 ? "Excellent" : value >= 4 ? "Very Good" : value >= 3 ? "Good" : "Needs Improvement") : "Tap to Rate"}
            </p>
        </div>
    );
}
