import { useMemo } from "react";
import { motion } from "framer-motion";

interface WordCloudViewProps {
    responses: { content: { text: string } }[];
}

export function WordCloudView({ responses }: WordCloudViewProps) {
    const words = useMemo(() => {
        const counts: Record<string, number> = {};
        responses.forEach(r => {
            if (r.content?.text) {
                // Split by space, remove punctuation, lowercase
                const text = r.content.text.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "");
                text.split(/\s+/).forEach(w => {
                    if (w.length > 2) { // Filter small words
                        counts[w] = (counts[w] || 0) + 1;
                    }
                });
            }
        });

        const max = Math.max(...Object.values(counts), 1);

        return Object.entries(counts).map(([text, count]) => ({
            text,
            count,
            size: 1 + (count / max) * 4 // Scale 1rem to 5rem
        })).sort((a, b) => b.count - a.count).slice(0, 50); // Top 50
    }, [responses]);

    if (words.length === 0) {
        return <div className="text-center text-slate-400 italic text-2xl">Waiting for responses...</div>;
    }

    return (
        <div className="flex flex-wrap justify-center items-center gap-4 p-8 h-full overflow-hidden content-center">
            {words.map((w) => (
                <motion.span
                    key={w.text}
                    layout // Animate layout changes!
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="font-serif leading-none transition-colors"
                    style={{
                        fontSize: `${w.size}rem`,
                        color: w.count > 1 ? '#A51C30' : '#475569', // Crimson if >1
                        opacity: 0.8 + (w.size / 10)
                    }}
                >
                    {w.text}
                </motion.span>
            ))}
        </div>
    );
}
