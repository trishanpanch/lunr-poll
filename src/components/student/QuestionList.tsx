"use client";

import { Session } from "@/lib/types";
import { QuestionItem } from "./QuestionItem";
import { motion } from "framer-motion";

export function QuestionList({ session, userId, answeredQuestionIds }: { session: Session; userId: string; answeredQuestionIds?: Set<string> }) {

    const visibleQuestions = (session.questions || []).filter(q => {
        if (!q) return false;

        // Strict Pacing Mode: Show if in activeQuestionIds array OR matches legacy activeQuestionId
        if (session.activeQuestionIds && session.activeQuestionIds.length > 0) {
            return session.activeQuestionIds.includes(q.id);
        }

        // Legacy fallback
        if (session.activeQuestionId) {
            return q.id === session.activeQuestionId;
        }

        // If no strict question is active, show nothing (Professor controls the flow)
        return false;
    });

    if (visibleQuestions.length === 0) {
        return (
            <div className="text-center py-10 text-slate-500 font-sans">
                <p>Waiting for the professor to present the next question...</p>
                {/* Optional: Add a subtle pulse animation or icon here */}
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
