"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth, db } from "@/lib/firebase/client";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { UserProfile } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function SettingsPage() {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const router = useRouter();

    // Form Stats
    const [primaryColor, setPrimaryColor] = useState("#E11D48"); // Default Rose-600
    const [logoUrl, setLogoUrl] = useState("");
    const [defaultTimer, setDefaultTimer] = useState(60);
    const [profanityFilter, setProfanityFilter] = useState(true);

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, async (u) => {
            if (u) {
                setUser(u);
                const snap = await getDoc(doc(db, "users", u.uid));
                if (snap.exists()) {
                    const data = snap.data() as UserProfile;
                    setProfile(data);
                    // Init form
                    if (data.branding?.primaryColor) setPrimaryColor(data.branding.primaryColor);
                    if (data.branding?.logoUrl) setLogoUrl(data.branding.logoUrl);
                    if (data.defaults?.timerSeconds) setDefaultTimer(data.defaults.timerSeconds);
                    if (data.defaults?.profanityFilter !== undefined) setProfanityFilter(data.defaults.profanityFilter);
                }
            } else {
                router.push("/professor");
            }
            setLoading(false);
        });
        return () => unsub();
    }, [router]);

    const handleSave = async () => {
        if (!user) return;
        setSaving(true);
        try {
            const updates: Partial<UserProfile> = {
                branding: {
                    primaryColor,
                    logoUrl
                },
                defaults: {
                    timerSeconds: defaultTimer,
                    profanityFilter
                }
            };
            await updateDoc(doc(db, "users", user.uid), updates);
            toast.success("Settings saved successfully");
        } catch (e) {
            console.error(e);
            toast.error("Failed to save settings");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-20 text-center">Loading settings...</div>;

    return (
        <main className="min-h-screen bg-slate-50 p-8">
            <div className="max-w-3xl mx-auto space-y-8">
                <header className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={() => router.back()}>
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                        <div>
                            <h1 className="text-3xl font-serif font-bold text-slate-900">Settings</h1>
                            <p className="text-slate-500">Customize your teaching experience.</p>
                        </div>
                    </div>
                    <Button onClick={handleSave} disabled={saving} className="bg-primary">
                        {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Save Changes
                    </Button>
                </header>

                <Tabs defaultValue="branding" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="branding">Branding & Appearance</TabsTrigger>
                        <TabsTrigger value="defaults">Activity Defaults</TabsTrigger>
                    </TabsList>

                    {/* BRANDING */}
                    <TabsContent value="branding" className="mt-6 space-y-6">
                        <div className="bg-white p-6 rounded-xl border border-slate-200 space-y-6">
                            <div className="space-y-2">
                                <Label>Primary Brand Color</Label>
                                <div className="flex items-center gap-4">
                                    <div
                                        className="w-12 h-12 rounded-lg shadow-sm border border-slate-200"
                                        style={{ backgroundColor: primaryColor }}
                                    />
                                    <Input
                                        type="color"
                                        value={primaryColor}
                                        onChange={(e) => setPrimaryColor(e.target.value)}
                                        className="w-24 h-10 p-1"
                                    />
                                    <Input
                                        value={primaryColor}
                                        onChange={(e) => setPrimaryColor(e.target.value)}
                                        className="w-32 font-mono uppercase"
                                        placeholder="#E11D48"
                                        maxLength={7}
                                    />
                                </div>
                                <p className="text-xs text-slate-400">
                                    This color will be used for buttons and headers on the participant screen.
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label>Logo URL</Label>
                                <Input
                                    value={logoUrl}
                                    onChange={(e) => setLogoUrl(e.target.value)}
                                    placeholder="https://example.com/logo.png"
                                />
                                {logoUrl && (
                                    <div className="mt-2 p-4 bg-slate-50 border border-slate-100 rounded-lg flex justify-center">
                                        <img src={logoUrl} alt="Logo Preview" className="h-16 object-contain" />
                                    </div>
                                )}
                                <p className="text-xs text-slate-400">
                                    Provide a direct link to your institution's logo (PNG/SVG transparent recommended).
                                </p>
                            </div>
                        </div>
                    </TabsContent>

                    {/* DEFAULTS */}
                    <TabsContent value="defaults" className="mt-6 space-y-6">
                        <div className="bg-white p-6 rounded-xl border border-slate-200 space-y-6">
                            <div className="space-y-2">
                                <Label>Default Timer Duration (Seconds)</Label>
                                <Input
                                    type="number"
                                    value={defaultTimer}
                                    onChange={(e) => setDefaultTimer(parseInt(e.target.value) || 0)}
                                    min={10}
                                    max={300}
                                />
                                <p className="text-xs text-slate-400">
                                    Created activities will start with this timer value.
                                </p>
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label className="text-base">Profanity Filter</Label>
                                    <p className="text-xs text-slate-400">
                                        Automatically filter offensive words in Word Clouds and Open Responses.
                                    </p>
                                </div>
                                <Switch
                                    checked={profanityFilter}
                                    onCheckedChange={setProfanityFilter}
                                />
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </main>
    );
}
