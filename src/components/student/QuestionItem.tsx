"use client";

import { useState } from "react";
import { Question } from "@/lib/types";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db, storage } from "@/lib/firebase/client";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { toast } from "sonner";
import { Check, Upload, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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

            // Update response document
            const docRef = doc(db, "responses", `${sessionId}_${userId}`);
            await setDoc(docRef, {
                sessionId,
                studentId: userId,
                studentName, // In a real app we'd manage names better
                [`answers.${question.id}`]: finalAnswer,
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
            <h3 className="font-serif text-lg font-semibold text-slate-800">{question.text}</h3>

            {question.type === "short_text" && (
                <Textarea
                    placeholder="Type your response..."
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    className="min-h-[120px] bg-white border-slate-200 focus:border-primary focus:ring-primary rounded-xl"
                />
            )}

            {question.type === "multiple_choice" && (
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
