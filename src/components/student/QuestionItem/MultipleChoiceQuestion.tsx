"use client";

import { Question } from "@/lib/types";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

interface MultipleChoiceQuestionProps {
    question: Question;
    answer: string;
    onChange: (value: string) => void;
}

function StarScaleInput({ question, answer, onChange }: MultipleChoiceQuestionProps) {
    return (
        <div className="flex flex-col items-center gap-4 py-4">
            <div className="flex items-center gap-2">
                {question.options?.map((opt, idx) => {
                    const starNum = idx + 1;
                    const currentRating = answer ? parseInt(answer.split(" ")[0]) : 0;
                    const isFilled = starNum <= currentRating;

                    return (
                        <button
                            key={opt}
                            onClick={() => onChange(opt)}
                            className="focus:outline-none transition-transform hover:scale-110 active:scale-95"
                            type="button"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill={isFilled ? "#fbbf24" : "none"}
                                stroke={isFilled ? "#fbbf24" : "#cbd5e1"}
                                strokeWidth="2"
                                className="w-10 h-10 md:w-12 md:h-12 transition-colors duration-200"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.545.044.77.77.349 1.118l-4.247 3.527a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.247-3.527c-.421-.349-.196-1.075.349-1.118l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                            </svg>
                        </button>
                    );
                })}
            </div>
            <div className="h-6 text-sm font-medium text-slate-500">
                {answer || "Tap a star to rate"}
            </div>
        </div>
    );
}

function RadioInput({ question, answer, onChange }: MultipleChoiceQuestionProps) {
    return (
        <RadioGroup value={answer} onValueChange={onChange} className="gap-3">
            {question.options?.map((opt) => (
                <div key={opt} className={`flex items-center space-x-3 p-4 rounded-xl border transition-all ${answer === opt ? "bg-primary/5 border-primary" : "bg-white border-slate-200 hover:bg-slate-50"}`}>
                    <RadioGroupItem value={opt} id={opt} className="text-primary border-slate-300" />
                    <Label htmlFor={opt} className="flex-1 cursor-pointer font-sans text-slate-700">{opt}</Label>
                </div>
            ))}
        </RadioGroup>
    );
}

export function MultipleChoiceQuestion({ question, answer, onChange }: MultipleChoiceQuestionProps) {
    const isStarScale = question.options?.length === 5 && question.options[0] === "1 Star" && question.options[4] === "5 Stars";

    if (isStarScale) {
        return <StarScaleInput question={question} answer={answer} onChange={onChange} />;
    }
    return <RadioInput question={question} answer={answer} onChange={onChange} />;
}
