import { useMemo } from "react";
import { Response } from "@/lib/types";
import { motion } from "framer-motion";
import { Trophy, Medal } from "lucide-react";

interface CompetitionViewProps {
    responses: Response[];
    // We could pass in a map of studentId -> Name if we had it, 
    // but for now we'll assume response might have participant identifier or just "Student X"
    // The data model has 'participantId'. We might not have names locally.
    // For MVP, we'll just show "User ...ABCD".
}

export function CompetitionView({ responses }: CompetitionViewProps) {
    const leaderboard = useMemo(() => {
        // Filter those with scores
        const scored = responses
            .filter(r => typeof r.content.score === 'number')
            .sort((a, b) => b.content.score - a.content.score) // Descending
            .slice(0, 5); // Top 5
        return scored;
    }, [responses]);

    if (leaderboard.length === 0) {
        return <div className="text-center text-slate-400 italic text-2xl">Waiting for scores...</div>;
    }

    return (
        <div className="w-full max-w-2xl mx-auto bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
            <div className="p-6 bg-slate-900 text-white flex items-center justify-center gap-3">
                <Trophy className="w-8 h-8 text-yellow-400" />
                <h2 className="text-2xl font-serif font-bold">Leaderboard</h2>
            </div>
            <div className="p-4 space-y-2">
                {leaderboard.map((entry, index) => (
                    <motion.div
                        key={entry.participantId}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className={`flex items-center p-4 rounded-xl border ${index === 0 ? 'bg-yellow-50 border-yellow-200' :
                                index === 1 ? 'bg-slate-50 border-slate-200' :
                                    index === 2 ? 'bg-orange-50 border-orange-200' : 'bg-white border-transparent'
                            }`}
                    >
                        <div className="font-bold text-2xl w-12 text-slate-400 text-center">
                            #{index + 1}
                        </div>
                        <div className="flex-1 font-mono text-slate-700">
                            {entry.participantId.substring(0, 8)}...
                        </div>
                        <div className="font-bold text-xl text-slate-900">
                            {entry.content.score} pts
                        </div>
                        {index === 0 && <Medal className="ml-2 w-6 h-6 text-yellow-500" />}
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
