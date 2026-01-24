"use client";

import { Session } from "@/lib/types";
import { QuestionItem } from "./QuestionItem";
import { motion } from "framer-motion";

export function QuestionList({ session, userId }: { session: Session; userId: string }) {
    if (!session.questions || session.questions.length === 0) {
        return (
            <div className="text-center py-10 text-slate-500 font-sans">
                <p>Waiting for questions from the professor...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {session.questions.map((q, idx) => (
                <motion.div
                    key={q.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100"
                >
                    <QuestionItem question={q} sessionId={session.code} userId={userId} />
                </motion.div>
            ))}
        </div>
    );
}
