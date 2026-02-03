import { Activity } from "@/lib/types";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface OpenEndedEditorProps {
    activity: Activity;
    onChange: (updates: Partial<Activity>) => void;
}

export function OpenEndedEditor({ activity, onChange }: OpenEndedEditorProps) {
    return (
        <div className="space-y-6">
            <div className="p-6 bg-slate-50 rounded-xl border border-slate-200 text-center">
                <p className="text-slate-500 mb-2">Participant View Preview</p>
                <Input
                    disabled
                    placeholder={activity.type === "word_cloud"
                        ? "Participants submit words to build the cloud..."
                        : "Participants will type their answer here..."
                    }
                    className="bg-white"
                />
            </div>
        </div>
    );
}
