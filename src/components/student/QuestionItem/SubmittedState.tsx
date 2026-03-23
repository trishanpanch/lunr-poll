"use client";

import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

interface SubmittedStateProps {
    onEdit: () => void;
}

export function SubmittedState({ onEdit }: SubmittedStateProps) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-6 bg-green-50 rounded-xl border border-green-100 flex items-center gap-4"
        >
            <div className="bg-green-100 p-2 rounded-full">
                <Check className="w-6 h-6 text-green-700" />
            </div>
            <div>
                <p className="text-green-900 font-medium">Response submitted</p>
                <Button variant="link" size="sm" onClick={onEdit} className="text-green-700 p-0 h-auto">
                    Edit response
                </Button>
            </div>
        </motion.div>
    );
}
