import { UserProfile } from "@/lib/types";
import { Loader2 } from "lucide-react";

interface WaitScreenProps {
    professor: UserProfile;
}

export function WaitScreen({ professor }: WaitScreenProps) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-6 text-center animate-in fade-in">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
            </div>

            <div className="space-y-2">
                <h2 className="text-xl font-medium text-slate-900">Waiting for presentation...</h2>
                <p className="text-slate-500 max-w-xs mx-auto">
                    When {professor.name || "the presenter"} activates a poll, it will appear here instantly.
                </p>
            </div>

            <div className="pt-8">
                <p className="text-xs uppercase tracking-widest text-slate-400 font-bold">
                    {professor.handle?.toUpperCase() || "LUNR.STUDIO"}
                </p>
            </div>
        </div>
    );
}
