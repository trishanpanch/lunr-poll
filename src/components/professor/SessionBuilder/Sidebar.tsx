"use client";

import { QuestionType } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus } from "lucide-react";

interface SidebarProps {
    onAddQuestion: (type: QuestionType) => void;
    onAddPreset: (preset: string) => void;
}

export function Sidebar({ onAddQuestion, onAddPreset }: SidebarProps) {
    return (
        <aside className="space-y-6">
            <Card className="border-slate-200 shadow-sm">
                <div className="p-4 border-b border-slate-100 font-medium text-slate-700">Presets</div>
                <CardContent className="p-4 space-y-3">
                    <Button
                        variant="ghost"
                        className="w-full justify-start text-slate-600"
                        onClick={() => onAddPreset("start_stop_continue")}
                    >
                        Start, Stop, Continue
                    </Button>
                    <Button
                        variant="ghost"
                        className="w-full justify-start text-slate-600"
                        onClick={() => onAddPreset("rate_class")}
                    >
                        Rate the Class
                    </Button>
                    <Button
                        variant="ghost"
                        className="w-full justify-start text-slate-600"
                        onClick={() => onAddPreset("vote")}
                    >
                        Polling / Vote
                    </Button>
                </CardContent>
            </Card>

            <Card className="border-slate-200 shadow-sm">
                <div className="p-4 border-b border-slate-100 font-medium text-slate-700">Add Question</div>
                <CardContent className="p-4 space-y-3">
                    <Button variant="outline" className="w-full justify-start" onClick={() => onAddQuestion("short_text")}>
                        <Plus className="mr-2 w-4 h-4" /> Short Text
                    </Button>
                    <Button variant="outline" className="w-full justify-start" onClick={() => onAddQuestion("multiple_choice")}>
                        <Plus className="mr-2 w-4 h-4" /> Multiple Choice
                    </Button>
                    <Button variant="outline" className="w-full justify-start" onClick={() => onAddQuestion("file_upload")}>
                        <Plus className="mr-2 w-4 h-4" /> File Upload
                    </Button>
                    <Button variant="outline" className="w-full justify-start" onClick={() => onAddQuestion("rating")}>
                        <Plus className="mr-2 w-4 h-4" /> Star Rating
                    </Button>
                </CardContent>
            </Card>
        </aside>
    );
}
