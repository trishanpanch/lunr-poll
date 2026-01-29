"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Star } from "lucide-react";

interface StarRatingProps {
    value?: number;
    onChange?: (val: number) => void;
    readOnly?: boolean;
    size?: "sm" | "md" | "lg";
    className?: string;
}

export function StarRating({ value = 0, onChange, readOnly = false, size = "lg", className }: StarRatingProps) {
    const [hoverValue, setHoverValue] = useState<number | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const displayValue = hoverValue !== null ? hoverValue : value;

    const sizeClasses = {
        sm: "w-6 h-6",
        md: "w-10 h-10",
        lg: "w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16"
    };

    const handleMouseMove = (e: React.MouseEvent, index: number) => {
        if (readOnly) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const width = rect.width;

        // If x < width / 2, it's a half star (index + 0.5)
        // Otherwise it's a full star (index + 1)
        const newValue = x < width / 2 ? index + 0.5 : index + 1;
        setHoverValue(newValue);
    };

    const handleClick = () => {
        if (!readOnly && onChange && hoverValue !== null) {
            onChange(hoverValue);
        }
    };

    return (
        <div
            className={cn("flex items-center gap-2 select-none", className)}
            onMouseLeave={() => !readOnly && setHoverValue(null)}
            ref={containerRef}
        >
            {[0, 1, 2, 3, 4].map((index) => {
                const filled = displayValue >= index + 1;
                const halfFilled = !filled && displayValue >= index + 0.5;

                return (
                    <motion.div
                        key={index}
                        className={cn("relative cursor-pointer transition-transform duration-100 ease-out",
                            sizeClasses[size],
                            !readOnly && "hover:scale-110 active:scale-95"
                        )}
                        onMouseMove={(e) => handleMouseMove(e, index)}
                        onClick={handleClick}
                        whileTap={!readOnly ? { scale: 0.9 } : undefined}
                    >
                        {/* Background (Empty/Gray Star) */}
                        <div className="absolute inset-0 text-slate-200">
                            <Star className="w-full h-full fill-slate-200 stroke-slate-200" />
                        </div>

                        {/* Foreground (Filled/Gold Star) */}
                        <div className={cn(
                            "absolute inset-0 text-yellow-400 transition-[clip-path] duration-100",
                            filled ? "clip-full" : halfFilled ? "clip-half" : "clip-empty"
                        )}
                            style={{
                                clipPath: filled
                                    ? "inset(0 0 0 0)"
                                    : halfFilled
                                        ? "inset(0 50% 0 0)"
                                        : "inset(0 100% 0 0)"
                            }}
                        >
                            <Star className="w-full h-full fill-yellow-400 stroke-yellow-400" />
                        </div>
                    </motion.div>
                );
            })}

            {/* Numeric Indicator */}
            {!readOnly && (
                <div className="ml-4 w-12 font-serif font-bold text-2xl text-slate-700 tabular-nums">
                    {displayValue > 0 ? displayValue.toFixed(1) : ""}
                </div>
            )}
        </div>
    );
}
