import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ActivityType } from "@/lib/types";
import {
    CheckSquare,
    Type,
    MessageSquare,
    Cloud,
    Image as ImageIcon,
    Target,
    Trophy,
    ListOrdered
} from "lucide-react";

interface CreateActivityDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onCreate: (type: ActivityType) => void;
}

const ACTIVITY_TYPES: { type: ActivityType; label: string; icon: any; description: string }[] = [
    { type: "multiple_choice", label: "Multiple Choice", icon: CheckSquare, description: "Participants choose from options." },
    { type: "open_ended", label: "Open Ended", icon: Type, description: "Participants type free text responses." },
    { type: "word_cloud", label: "Word Cloud", icon: Cloud, description: "Visualize most frequent words." },
    { type: "qa", label: "Q&A", icon: MessageSquare, description: "Participants ask and upvote questions." },
    // Phase 2
    { type: "clickable_image", label: "Clickable Image", icon: ImageIcon, description: "Identify regions on an image." },
    { type: "ranking", label: "Ranking", icon: ListOrdered, description: "Reorder items." },
    { type: "competition", label: "Competition", icon: Trophy, description: "Timed quiz game." },
    { type: "survey", label: "Survey", icon: Target, description: "Multiple questions at once." }
];

export function CreateActivityDialog({ open, onOpenChange, onCreate }: CreateActivityDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-serif">Create New Activity</DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4">
                    {ACTIVITY_TYPES.map((item) => (
                        <button
                            key={item.type}
                            onClick={() => onCreate(item.type)}
                            className="flex flex-col items-center justify-center p-6 space-y-3 rounded-xl border border-slate-200 hover:border-primary hover:bg-slate-50 transition-all text-center group"
                        >
                            <div className="p-3 bg-slate-100 rounded-full group-hover:bg-rose-100 group-hover:text-primary transition-colors">
                                <item.icon className="w-6 h-6 text-slate-600 group-hover:text-primary" />
                            </div>
                            <div>
                                <h3 className="font-medium text-slate-900">{item.label}</h3>
                                <p className="text-xs text-slate-500 line-clamp-2 mt-1">{item.description}</p>
                            </div>
                        </button>
                    ))}
                </div>
            </DialogContent>
        </Dialog>
    );
}
