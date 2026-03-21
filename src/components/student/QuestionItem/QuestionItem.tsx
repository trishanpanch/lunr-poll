"use client";

import { useState } from "react";
import { Question } from "@/lib/types";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db, storage } from "@/lib/firebase/client";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SubmittedState } from "./SubmittedState";
import { TextQuestion } from "./TextQuestion";
import { MultipleChoiceQuestion } from "./MultipleChoiceQuestion";
import { FileUploadQuestion } from "./FileUploadQuestion";
import { StarRatingQuestion } from "./StarRatingQuestion";

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
        return <SubmittedState onEdit={() => setSubmitted(false)} />;
    }

    return (
        <div className="space-y-4">
            <h3 className="font-serif text-lg font-semibold text-slate-800">{question.text}</h3>

            {question.type === "short_text" && (
                <TextQuestion answer={answer} onChange={setAnswer} />
            )}

            {question.type === "multiple_choice" && (
                <MultipleChoiceQuestion question={question} answer={answer} onChange={setAnswer} />
            )}

            {question.type === "file_upload" && (
                <FileUploadQuestion file={file} onFileChange={setFile} />
            )}

            {question.type === "rating" && (
                <StarRatingQuestion answer={answer} onChange={setAnswer} />
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
