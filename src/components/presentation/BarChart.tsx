import { motion } from "framer-motion";

interface BarChartProps {
    data: { name: string; value: number; isCorrect?: boolean }[];
    total: number;
    showCorrect?: boolean;
}

export function BarChart({ data, total, showCorrect }: BarChartProps) {
    const maxVal = Math.max(...data.map(d => d.value), 1);

    return (
        <div className="w-full h-full flex flex-col justify-end space-y-4 px-4 overflow-y-auto">
            {data.map((item, idx) => {
                const percentage = Math.round((item.value / total) * 100) || 0;
                const isCorrect = item.isCorrect && showCorrect;

                return (
                    <div key={idx} className="space-y-1">
                        <div className="flex justify-between text-lg font-medium text-slate-700">
                            <span className={isCorrect ? "text-green-700 font-bold" : ""}>
                                {item.name}
                                {isCorrect && " ✓"}
                            </span>
                            <span>{percentage}% <span className="text-sm text-slate-400">({item.value})</span></span>
                        </div>

                        <div className="h-4 bg-slate-100 rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${percentage}%` }}
                                transition={{ type: "spring", stiffness: 50 }}
                                className={`h-full rounded-full ${isCorrect ? "bg-green-600" : "bg-primary"}`}
                            />
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
