import { motion } from "framer-motion";

interface BarChartProps {
    data: { name: string; value: number; isCorrect?: boolean }[];
    total: number;
    showCorrect?: boolean;
}

export function BarChart({ data, total, showCorrect }: BarChartProps) {
    return (
        <div className="flex h-full w-full flex-col justify-end space-y-4 overflow-y-auto px-2 md:px-4">
            {data.map((item, idx) => {
                const percentage = Math.round((item.value / total) * 100) || 0;
                const isCorrect = item.isCorrect && showCorrect;

                return (
                    <div key={idx} className="space-y-2">
                        <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                            <span
                                className={`max-w-3xl whitespace-normal break-words pr-2 text-sm font-medium leading-relaxed text-slate-700 md:text-base ${
                                    isCorrect ? "font-bold text-green-700" : ""
                                }`}
                            >
                                {item.name}
                                {isCorrect && " ✓"}
                            </span>
                            <span className="shrink-0 text-sm font-semibold text-slate-600 md:text-base">
                                {percentage}% <span className="text-sm text-slate-400">({item.value})</span>
                            </span>
                        </div>

                        <div className="h-4 overflow-hidden rounded-full bg-slate-100">
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
