import { useRef } from "react";
import { Response } from "@/lib/types";
import { motion } from "framer-motion";

interface ClickableImageViewProps {
    imageUrl: string;
    responses: Response[];
}

export function ClickableImageView({ imageUrl, responses }: ClickableImageViewProps) {
    // Collect points
    const points = responses.filter(r => r.content.x !== undefined && r.content.y !== undefined);

    return (
        <div className="relative inline-block border border-slate-200 rounded-lg overflow-hidden shadow-2xl bg-white">
            <img
                src={imageUrl}
                alt="Results"
                className="max-h-[60vh] object-contain"
            />
            {points.map((r) => (
                <motion.div
                    key={r.id}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 0.8 }}
                    className="absolute w-4 h-4 bg-rose-600/60 rounded-full border border-white/40 transform -translate-x-1/2 -translate-y-1/2"
                    style={{
                        left: `${(r.content.x as number) * 100}%`,
                        top: `${(r.content.y as number) * 100}%`
                    }}
                />
            ))}
        </div>
    );
}
