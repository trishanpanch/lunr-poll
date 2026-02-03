import { Activity } from "@/lib/types";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface ClickableImageEditorProps {
    activity: Activity;
    onChange: (updates: Partial<Activity>) => void;
}

export function ClickableImageEditor({ activity, onChange }: ClickableImageEditorProps) {
    const imageUrl = activity.content?.imageUrl || "";

    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <Label>Image URL (Public)</Label>
                <Input
                    value={imageUrl}
                    onChange={(e) => onChange({ content: { ...activity.content, imageUrl: e.target.value } })}
                    placeholder="https://images.unsplash.com/..."
                />
                <p className="text-xs text-slate-400">
                    Paste a direct link to an image.
                </p>
            </div>

            {imageUrl && (
                <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-100 flex justify-center items-center min-h-[200px]">
                    <img src={imageUrl} alt="Preview" className="max-h-[300px] object-contain" />
                </div>
            )}
        </div>
    );
}
