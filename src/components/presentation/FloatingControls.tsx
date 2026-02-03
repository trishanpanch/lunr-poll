import { Button } from "@/components/ui/button";
import { Eye, EyeOff, CheckCircle2, Lock, Unlock } from "lucide-react";

interface FloatingControlsProps {
    showResults: boolean;
    onToggleResults: () => void;
    showCorrect: boolean;
    onToggleCorrect: () => void;
    isLocked: boolean;
    onToggleLock: () => void;
}

export function FloatingControls({
    showResults, onToggleResults,
    showCorrect, onToggleCorrect,
    isLocked, onToggleLock
}: FloatingControlsProps) {
    return (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur border border-slate-200 shadow-xl rounded-full p-2 flex items-center gap-2 animate-in slide-in-from-bottom-10 z-50">
            <Button
                variant={showResults ? "secondary" : "ghost"}
                size="icon"
                onClick={onToggleResults}
                title={showResults ? "Hide Results" : "Show Results"}
                className="rounded-full"
            >
                {showResults ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </Button>

            <div className="w-px h-6 bg-slate-300 mx-1" />

            <Button
                variant={showCorrect ? "default" : "ghost"}
                size="icon"
                onClick={onToggleCorrect}
                title="Show Correct Answer"
                className={`rounded-full ${showCorrect ? "bg-green-600 hover:bg-green-700" : ""}`}
            >
                <CheckCircle2 className="w-5 h-5" />
            </Button>

            <Button
                variant={isLocked ? "destructive" : "ghost"}
                size="icon"
                onClick={onToggleLock}
                title={isLocked ? "Unlock Responses" : "Lock Responses"}
                className="rounded-full"
            >
                {isLocked ? <Lock className="w-5 h-5" /> : <Unlock className="w-5 h-5" />}
            </Button>
        </div>
    );
}
