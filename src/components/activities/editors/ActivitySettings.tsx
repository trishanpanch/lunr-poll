import { useState } from "react";
import { Activity } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { archiveCurrentSession } from "@/lib/data/runs";
import { toast } from "sonner";
import { Archive, RotateCcw } from "lucide-react";

interface ActivitySettingsProps {
    activity: Activity;
    onChange: (updates: Partial<Activity>) => void;
}

export function ActivitySettings({ activity, onChange }: ActivitySettingsProps) {
    const settings = activity.settings || {};

    const updateSettings = (key: keyof typeof settings, value: any) => {
        onChange({ settings: { ...settings, [key]: value } });
    };

    return (
        <Card className="h-full border-l rounded-none border-slate-200 shadow-none">
            <CardHeader>
                <CardTitle className="text-lg">Response Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                        <Label>Map Responses to Users</Label>
                        <p className="text-xs text-slate-500">If off, responses are anonymous.</p>
                    </div>
                    <Switch
                        checked={!settings.isAnonymous}
                        onCheckedChange={(checked) => updateSettings("isAnonymous", !checked)}
                    />
                </div>

                <div className="space-y-2">
                    <Label>Responses per person</Label>
                    <Input
                        type="number"
                        value={settings.responseLimit || 1}
                        onChange={(e) => updateSettings("responseLimit", parseInt(e.target.value))}
                        min={0}
                    />
                    <p className="text-xs text-slate-500">Use 0 for unlimited.</p>
                </div>

                {activity.type === "multiple_choice" && (
                    <div className="space-y-2">
                        <Label>Options selectable</Label>
                        <Input
                            type="number"
                            value={settings.optionSelectionLimit || 1}
                            onChange={(e) => updateSettings("optionSelectionLimit", parseInt(e.target.value))}
                            min={1}
                        />
                    </div>
                )}

                <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                        <Label>Allow changing answers</Label>
                    </div>
                    <Switch
                        checked={settings.allowChangeAnswer}
                        onCheckedChange={(checked) => updateSettings("allowChangeAnswer", checked)}
                    />
                </div>

                <div className="space-y-2">
                    <Label>Timer (seconds)</Label>
                    <Input
                        type="number"
                        value={settings.timerSeconds || 0}
                        onChange={(e) => updateSettings("timerSeconds", parseInt(e.target.value))}
                        placeholder="None"
                    />
                </div>

                {activity.type === "multiple_choice" && (
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label>Show correct answer</Label>
                        </div>
                        <Switch
                            checked={settings.showCorrectAnswer}
                            onCheckedChange={(checked) => updateSettings("showCorrectAnswer", checked)}
                        />
                    </div>
                )}

                {(activity.type === "open_ended" || activity.type === "word_cloud") && (
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label>Moderation</Label>
                            <p className="text-xs text-slate-500">Approve posts before showing.</p>
                        </div>
                        <Switch
                            checked={settings.moderationEnabled}
                            onCheckedChange={(checked) => updateSettings("moderationEnabled", checked)}
                        />
                    </div>
                )}
            </CardContent>

            <CardContent className="pt-6 border-t border-slate-100 space-y-4">
                <h3 className="font-bold text-slate-900 flex items-center gap-2">
                    <Archive className="w-4 h-4" /> Data Management
                </h3>
                <p className="text-xs text-slate-500">
                    Finished with this class? Archive the current responses and reset the activity for the next group.
                </p>
                <ResetButton activity={activity} />
            </CardContent>
        </Card>
    );
}

function ResetButton({ activity }: { activity: Activity }) {
    const [loading, setLoading] = useState(false);

    const handleReset = async () => {
        if (!confirm("Are you sure? This will archive all current responses and clear the dashboard.")) return;
        setLoading(true);
        try {
            const count = await archiveCurrentSession(activity, `Run ${new Date().toLocaleDateString()}`);
            toast.success(`Archived ${count} responses. Activity is clean.`);
        } catch (e) {
            console.error(e);
            toast.error("Failed to archive.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Button variant="outline" onClick={handleReset} disabled={loading} className="w-full border-red-200 text-red-700 hover:bg-red-50">
            {loading ? "Archiving..." : <>
                <RotateCcw className="mr-2 w-4 h-4" /> Archive & Reset
            </>}
        </Button>
    )
}
