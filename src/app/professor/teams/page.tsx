"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth, db } from "@/lib/firebase/client";
import { doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { UserProfile } from "@/lib/types";
import { TeamManagement } from "@/components/admin/TeamManagement";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function TeamsPage() {
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, async (u) => {
            if (u) {
                // Fetch full profile
                const snap = await getDoc(doc(db, "users", u.uid));
                if (snap.exists()) {
                    setUserProfile(snap.data() as UserProfile);
                } else {
                    // Fallback profile if not in DB yet
                    setUserProfile({
                        uid: u.uid,
                        email: u.email || "",
                        name: u.displayName || "Professor",
                        createdAt: {} as any,
                        role: "professor"
                    });
                }
            } else {
                router.push("/professor");
            }
            setLoading(false);
        });
        return () => unsub();
    }, [router]);

    if (loading) return <div className="p-20 text-center">Loading...</div>;
    if (!userProfile) return null;

    return (
        <main className="min-h-screen bg-slate-50 p-8">
            <div className="max-w-5xl mx-auto space-y-8">
                <header className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.push("/professor/activities")}>
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-serif font-bold text-slate-900">Teams</h1>
                        <p className="text-slate-500">Collaborate with other professors.</p>
                    </div>
                </header>

                <TeamManagement user={userProfile} />
            </div>
        </main>
    );
}
