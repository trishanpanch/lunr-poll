"use client";

import { Session } from "@/lib/types";
import { QuestionItem } from "./QuestionItem";
import { motion } from "framer-motion";

export function QuestionList({ session, userId, answeredQuestionIds }: { session: Session; userId: string; answeredQuestionIds?: Set<string> }) {

    const visibleQuestions = session.questions.filter(q => {
        // Show if active (default true) AND not answered
        const isActive = q.isActive !== false;
        const isAnswered = answeredQuestionIds?.has(q.id);
        return isActive && !isAnswered;
    });

    if (visibleQuestions.length === 0) {
        return (
            <div className="text-center py-10 text-slate-500 font-sans">
                <p>Waiting for new questions from the professor...</p>
                {answeredQuestionIds && answeredQuestionIds.size > 0 && <p className="text-sm mt-2">You have answered all available questions.</p>}
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {visibleQuestions.map((q, idx) => (
                <motion.div
                    key={q.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100"
                >
                    <QuestionItem question={q} sessionId={session.id || ""} userId={userId} />
                </motion.div>
            ))}
        </div>
    );
}
