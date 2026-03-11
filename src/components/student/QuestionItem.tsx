"use client";

import { useState } from "react";
import { doc, setDoc, serverTimestamp, collection, addDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { toast } from "sonner";
import { Check, Upload, Loader2, CircleCheck, CircleAlert } from "lucide-react";
import { motion } from "framer-motion";
import { Question } from "@/lib/types";
import { db, storage } from "@/lib/firebase/client";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { StarRating } from "@/components/ui/StarRating";
import { RichText } from "@/components/ui/RichText";

interface QuestionItemProps {
    question: Question;
    sessionId: string;
    userId: string;
    studentName?: string;
    initialSubmitted?: boolean;
    initialAnswer?: string;
}

function shouldRevealAfterSubmission(question: Question) {
    return (
        question.type === "multiple_choice" &&
        question.revealMode === "after_submission" &&
        ((question.correctAnswers && question.correctAnswers.length > 0) || question.explanation)
    );
}

function getAssessmentState(question: Question, answer: string) {
    if (!question.correctAnswers?.length) return null;
    return question.correctAnswers.includes(answer);
}

export function QuestionItem({
    question,
    sessionId,
    userId,
    studentName = "Anonymous",
    initialSubmitted = false,
    initialAnswer = ""
}: QuestionItemProps) {
    const [answer, setAnswer] = useState(initialAnswer);
    const [file, setFile] = useState<File | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(initialSubmitted);

    const handleSubmit = async () => {
        if (!answer && !file) return;

        setSubmitting(true);
        try {
            let finalAnswer = answer;

            if (question.type === "file_upload" && file) {
                const storageRef = ref(storage, `responses/${sessionId}/${userId}/${file.name}`);
                await uploadBytes(storageRef, file);
                finalAnswer = await getDownloadURL(storageRef);
            }

            await addDoc(collection(db, "responses"), {
                activityId: sessionId,
                participantId: userId,
                content: {
                    [question.id]: finalAnswer,
                    ...(typeof finalAnswer === "string" ? { text: finalAnswer } : {}),
                    ...((question.type === "multiple_choice" || question.type === "rating") ? { optionId: finalAnswer } : {})
                },
                submittedAt: serverTimestamp(),
                sessionId
            });

            const docRef = doc(db, "sessions", sessionId, "responses", userId);
            await setDoc(
                docRef,
                {
                    sessionId,
                    studentId: userId,
                    studentName,
                    answers: {
                        [question.id]: finalAnswer
                    },
                    submittedAt: serverTimestamp()
                },
                { merge: true }
            );

            setSubmitted(true);
            toast.success("Response sent!");
        } catch (error) {
            console.error(error);
            toast.error("Failed to send response");
        } finally {
            setSubmitting(false);
        }
    };

    const assessmentState = getAssessmentState(question, answer);

    if (submitted) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-4"
            >
                <div className="flex items-center gap-4 rounded-xl border border-green-100 bg-green-50 p-6">
                    <div className="rounded-full bg-green-100 p-2">
                        <Check className="w-6 h-6 text-green-700" />
                    </div>
                    <div className="flex-1">
                        <p className="font-medium text-green-900">Response submitted</p>
                        <p className="text-sm text-green-700">You can edit your answer before the instructor closes the poll.</p>
                    </div>
                    <Button
                        variant="link"
                        size="sm"
                        onClick={() => setSubmitted(false)}
                        className="h-auto p-0 text-green-700"
                    >
                        Edit response
                    </Button>
                </div>

                {shouldRevealAfterSubmission(question) && (
                    <div
                        className={`rounded-xl border p-4 ${
                            assessmentState
                                ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                                : "border-amber-200 bg-amber-50 text-amber-900"
                        }`}
                    >
                        <div className="flex items-start gap-3">
                            {assessmentState ? (
                                <CircleCheck className="mt-0.5 h-5 w-5 shrink-0" />
                            ) : (
                                <CircleAlert className="mt-0.5 h-5 w-5 shrink-0" />
                            )}
                            <div className="space-y-2">
                                <p className="font-semibold">
                                    {assessmentState ? "Correct" : "Not quite"}
                                </p>
                                {!!question.correctAnswers?.length && (
                                    <p className="text-sm">
                                        Correct answer{question.correctAnswers.length === 1 ? "" : "s"}:{" "}
                                        <span className="font-medium">{question.correctAnswers.join(", ")}</span>
                                    </p>
                                )}
                                {question.explanation && (
                                    <p className="text-sm leading-relaxed">{question.explanation}</p>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </motion.div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="text-lg font-semibold text-slate-800">
                <RichText content={question.text} />
            </div>

            {question.type === "short_text" && (
                <Textarea
                    placeholder="Type your response..."
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    className="min-h-[120px] rounded-xl border-slate-200 bg-white focus:border-primary focus:ring-primary"
                />
            )}

            {question.type === "multiple_choice" && (
                <>
                    {question.options?.length === 5 && question.options[0] === "1 Star" && question.options[4] === "5 Stars" ? (
                        <div className="flex flex-col items-center gap-4 py-4">
                            <div className="flex items-center gap-2">
                                {question.options.map((opt, idx) => {
                                    const starNum = idx + 1;
                                    const currentRating = answer ? parseInt(answer.split(" ")[0], 10) : 0;
                                    const isFilled = starNum <= currentRating;

                                    return (
                                        <button
                                            key={opt}
                                            onClick={() => setAnswer(opt)}
                                            className="transition-transform hover:scale-110 active:scale-95 focus:outline-none"
                                            type="button"
                                        >
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                viewBox="0 0 24 24"
                                                fill={isFilled ? "#fbbf24" : "none"}
                                                stroke={isFilled ? "#fbbf24" : "#cbd5e1"}
                                                strokeWidth="2"
                                                className="h-10 w-10 transition-colors duration-200 md:h-12 md:w-12"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.545.044.77.77.349 1.118l-4.247 3.527a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.247-3.527c-.421-.349-.196-1.075.349-1.118l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
                                                />
                                            </svg>
                                        </button>
                                    );
                                })}
                            </div>
                            <div className="h-6 text-sm font-medium text-slate-500">
                                {answer || "Tap a star to rate"}
                            </div>
                        </div>
                    ) : (
                        <RadioGroup value={answer} onValueChange={setAnswer} className="gap-3">
                            {question.options?.map((opt) => (
                                <div
                                    key={opt}
                                    className={`flex items-start space-x-3 rounded-xl border p-4 transition-all ${
                                        answer === opt
                                            ? "border-primary bg-primary/5"
                                            : "border-slate-200 bg-white hover:bg-slate-50"
                                    }`}
                                >
                                    <RadioGroupItem value={opt} id={`${question.id}-${opt}`} className="mt-1 text-primary border-slate-300" />
                                    <Label
                                        htmlFor={`${question.id}-${opt}`}
                                        className="flex-1 cursor-pointer whitespace-normal break-words font-sans leading-relaxed text-slate-700"
                                    >
                                        {opt}
                                    </Label>
                                </div>
                            ))}
                        </RadioGroup>
                    )}
                </>
            )}

            {question.type === "file_upload" && (
                <div className="relative cursor-pointer rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-8 text-center transition-colors hover:bg-slate-100">
                    <input
                        type="file"
                        className="absolute inset-0 cursor-pointer opacity-0"
                        onChange={(e) => setFile(e.target.files?.[0] || null)}
                    />
                    <div className="flex flex-col items-center gap-2">
                        <Upload className="w-8 h-8 text-slate-400" />
                        <p className="font-medium text-slate-600">{file ? file.name : "Tap to upload file"}</p>
                    </div>
                </div>
            )}

            {question.type === "rating" && (
                <div className="flex flex-col items-center justify-center rounded-xl border border-slate-100 bg-slate-50/50 py-10">
                    <StarRating
                        value={parseFloat(answer || "0")}
                        onChange={(val) => setAnswer(val.toString())}
                        size="lg"
                        className="justify-center"
                    />
                    <p className="mt-4 text-sm font-medium uppercase tracking-widest text-slate-400">
                        {answer
                            ? parseFloat(answer) === 5
                                ? "Excellent"
                                : parseFloat(answer) >= 4
                                    ? "Very Good"
                                    : parseFloat(answer) >= 3
                                        ? "Good"
                                        : "Needs Improvement"
                            : "Tap to Rate"}
                    </p>
                </div>
            )}

            <Button
                onClick={handleSubmit}
                disabled={(!answer && !file) || submitting}
                className="w-full rounded-xl py-6 text-lg shadow-sm"
            >
                {submitting ? <Loader2 className="mr-2 animate-spin" /> : "Submit Response"}
            </Button>
        </div>
    );
}
