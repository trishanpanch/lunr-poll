"use client";

import { motion } from "framer-motion";
import { Session } from "@/lib/types";
import { QuestionItem } from "./QuestionItem";

export function QuestionList({
    session,
    userId,
    answeredQuestionIds,
    submittedAnswers
}: {
    session: Session;
    userId: string;
    answeredQuestionIds?: Set<string>;
    submittedAnswers?: Record<string, string>;
}) {
    const isSelfPaced = session.deliveryMode === "self_paced";

    const visibleQuestions = isSelfPaced
        ? session.questions || []
        : (session.questions || []).filter((q) => {
            if (!q) return false;

            if (session.activeQuestionIds && session.activeQuestionIds.length > 0) {
                return session.activeQuestionIds.includes(q.id);
            }

            if (session.activeQuestionId) {
                return q.id === session.activeQuestionId;
            }

            return false;
        });

    if (visibleQuestions.length === 0) {
        return (
            <div className="py-10 text-center font-sans text-slate-500">
                <p>Waiting for the professor to present the next question...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {isSelfPaced && (
                <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800">
                    <span className="font-semibold">
                        Self-paced mode:
                    </span>{" "}
                    answer the full poll in one pass.
                    {answeredQuestionIds && (
                        <span className="ml-2 font-medium">
                            {answeredQuestionIds.size} of {session.questions.length} answered
                        </span>
                    )}
                </div>
            )}

            {visibleQuestions.map((q, idx) => (
                <motion.div
                    key={q.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.08 }}
                    className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm"
                >
                    <QuestionItem
                        question={q}
                        sessionId={session.id || ""}
                        userId={userId}
                        initialSubmitted={answeredQuestionIds?.has(q.id)}
                        initialAnswer={submittedAnswers?.[q.id]}
                    />
                </motion.div>
            ))}
        </div>
    );
}
