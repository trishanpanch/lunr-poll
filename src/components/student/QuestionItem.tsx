"use client";

import { useState } from "react";
import { Question } from "@/lib/types";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { doc, setDoc, serverTimestamp, collection, addDoc } from "firebase/firestore";
import { db, storage } from "@/lib/firebase/client";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { toast } from "sonner";
import { Check, Upload, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { StarRating } from "@/components/ui/StarRating";
import { RichText } from "@/components/ui/RichText";

interface QuestionItemProps {
    question: Question;
    sessionId: string;
    userId: string;
    studentName?: string;
}

export function QuestionItem({ question, sessionId, userId, studentName = "Anonymous" }: QuestionItemProps) {
    const [answer, setAnswer] = useState("");
    const [file, setFile] = useState<File | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

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

            // Universal Response Format (V2)
            // Writes to global 'responses' collection for compatibility with Preview/Live View
            // Mapping: sessionId -> activityId (for V1 sessions, this assumes strictly V2 usage, but fallback is safe)
            // But QuestionItem is legacy. SessionId passed is often the Session Doc ID.
            // If we are in V2 Mode, 'sessionId' is likely 'activityId'.
            // To support Hybrid: We write to BOTH? Or we write to Global with sessionId as activityId.
            // Best bet: If using V2 components, 'sessionId' is ActivityID.

            // However, verify QuestionItem usage in QuestionList.
            // For now, let's write to global 'responses' collection manually here to match the V2 schema.

            // IMPORT submitResponse DYNAMICALLY TO AVOID CYCLES OR JUST USE RAW FIRESTORE
            const { collection, addDoc, serverTimestamp } = await import("firebase/firestore");
            const responsesRef = collection(db, "responses");

            await addDoc(responsesRef, {
                activityId: sessionId, // In V1 this is session ID. In V2 this is Activity ID.
                participantId: userId,
                content: {
                    [question.id]: finalAnswer, // Legacy structure support
                    // Also support V2 structure "optionId" or "text" if we can detect type
                    text: typeof finalAnswer === 'string' ? finalAnswer : undefined,
                    optionId: question.type === 'multiple_choice' ? finalAnswer : undefined
                },
                submittedAt: serverTimestamp(),
                sessionId: sessionId // Store specifically as sessionId too
            });

            // Also keep legacy write for safety if V1 Dashboard depends on it
            const docRef = doc(db, "sessions", sessionId, "responses", userId);
            await setDoc(docRef, {
                sessionId,
                studentId: userId,
                studentName,
                answers: {
                    [question.id]: finalAnswer
                },
                submittedAt: serverTimestamp(),
            }, { merge: true });

            setSubmitted(true);
            toast.success("Response sent!");
        } catch (error) {
            console.error(error);
            toast.error("Failed to send response");
        } finally {
            setSubmitting(false);
        }
    };

    if (submitted) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-6 bg-green-50 rounded-xl border border-green-100 flex items-center gap-4"
            >
                <div className="bg-green-100 p-2 rounded-full">
                    <Check className="w-6 h-6 text-green-700" />
                </div>
                <div>
                    <p className="text-green-900 font-medium">Response submitted</p>
                    <Button variant="link" size="sm" onClick={() => setSubmitted(false)} className="text-green-700 p-0 h-auto">
                        Edit response
                    </Button>
                </div>
            </motion.div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="font-serif text-lg font-semibold text-slate-800">
                <RichText content={question.text} />
            </div>

            {question.type === "short_text" && (
                <Textarea
                    placeholder="Type your response..."
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    className="min-h-[120px] bg-white border-slate-200 focus:border-primary focus:ring-primary rounded-xl"
                />
            )}

            {question.type === "multiple_choice" && (
                <>
                    {/* Heuristic: Check if options look like a 5-star rating scale */}
                    {question.options?.length === 5 && question.options[0] === "1 Star" && question.options[4] === "5 Stars" ? (
                        <div className="flex flex-col items-center gap-4 py-4">
                            <div className="flex items-center gap-2">
                                {question.options.map((opt, idx) => {
                                    const starNum = idx + 1;
                                    const isSelected = answer === opt;
                                    // Simple logic: if selected is "3 Stars" (idx 2), stars 1,2,3 (idx 0,1,2) are filled
                                    const currentRating = answer ? parseInt(answer.split(" ")[0]) : 0;
                                    const isFilled = starNum <= currentRating;

                                    return (
                                        <button
                                            key={opt}
                                            onClick={() => setAnswer(opt)}
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
                    ) : (
                        <RadioGroup value={answer} onValueChange={setAnswer} className="gap-3">
                            {question.options?.map((opt) => (
                                <div key={opt} className={`flex items-center space-x-3 p-4 rounded-xl border transition-all ${answer === opt ? "bg-primary/5 border-primary" : "bg-white border-slate-200 hover:bg-slate-50"
                                    }`}>
                                    <RadioGroupItem value={opt} id={opt} className="text-primary border-slate-300" />
                                    <Label htmlFor={opt} className="flex-1 cursor-pointer font-sans text-slate-700">{opt}</Label>
                                </div>
                            ))}
                        </RadioGroup>
                    )}
                </>
            )}

            {question.type === "file_upload" && (
                <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer relative">
                    <input
                        type="file"
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        onChange={(e) => setFile(e.target.files?.[0] || null)}
                    />
                    <div className="flex flex-col items-center gap-2">
                        <Upload className="w-8 h-8 text-slate-400" />
                        <p className="text-slate-600 font-medium">{file ? file.name : "Tap to upload file"}</p>
                    </div>
                </div>
            )}

            {question.type === "rating" && (
                <div className="flex flex-col items-center justify-center py-10 bg-slate-50/50 rounded-xl border border-slate-100">
                    <StarRating
                        value={parseFloat(answer || "0")}
                        onChange={(val) => setAnswer(val.toString())}
                        size="lg"
                        className="justify-center"
                    />
                    <p className="mt-4 text-slate-400 text-sm font-medium uppercase tracking-widest">
                        {answer ? (parseFloat(answer) === 5 ? "Excellent" : parseFloat(answer) >= 4 ? "Very Good" : parseFloat(answer) >= 3 ? "Good" : "Needs Improvement") : "Tap to Rate"}
                    </p>
                </div>
            )}

            <Button
                onClick={handleSubmit}
                disabled={(!answer && !file) || submitting}
                className="w-full rounded-xl py-6 text-lg shadow-sm"
            >
                {submitting ? <Loader2 className="animate-spin mr-2" /> : "Submit Response"}
            </Button>
        </div>
    );
}
