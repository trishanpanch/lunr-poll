"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase/client";
import { collection, query, where, onSnapshot, addDoc, serverTimestamp } from "firebase/firestore";
import { onAuthStateChanged, User } from "firebase/auth";
import { useRouter } from "next/navigation";
import { Session } from "@/lib/types";
import { generateSessionCode } from "@/utils/code";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Plus, ArrowRight } from "lucide-react";

export default function Dashboard() {
    const [sessions, setSessions] = useState<Session[]>([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [user, setUser] = useState<User | null>(null);
    const router = useRouter();

    useEffect(() => {
        // Safety timeout for loading
        const timer = setTimeout(() => setLoading(false), 5000);

        const unsubAuth = onAuthStateChanged(auth, (u) => {
            if (!u || u.isAnonymous) {
                router.push("/professor");
            } else {
                setUser(u);
                // Subscribe to sessions
                const q = query(
                    collection(db, "sessions"),
                    where("ownerId", "==", u.uid)
                );

                const unsubData = onSnapshot(q, (snapshot) => {
                    const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Session));
                    // Manually sort
                    list.sort((a, b) => {
                        const tA = a.createdAt?.toMillis?.() || 0;
                        const tB = b.createdAt?.toMillis?.() || 0;
                        return tB - tA;
                    });
                    setSessions(list);
                    setLoading(false);
                }, (error) => {
                    console.error("Dashboard Error:", error);
                    // If error (e.g. permission denied), just stop loading so UI shows
                    setLoading(false);
                });
                return () => unsubData();
            }
        });
        return () => {
            unsubAuth();
            clearTimeout(timer);
        };
    }, [router]);

    const createSession = async () => {
        if (!user) return;
        setCreating(true);
        try {
            // Cloud Only Strategy via API (Server-Side)
            try {
                const token = await user.getIdToken();
                const res = await fetch("/api/sessions/create", {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${token}`
                    }
                });

                if (!res.ok) {
                    const data = await res.json();
                    throw new Error(data.error || "Failed to create");
                }

                const { id } = await res.json();
                router.push(`/professor/session/${id}`);
            } catch (cloudErr: unknown) {
                console.error("Cloud create failed", cloudErr);
                alert(`Failed to create session in Cloud: ${(cloudErr as Error).message}`);
                setCreating(false);
            }
        } catch (e: unknown) {
            console.error(e);
            alert("Unexpected error creating session");
            setCreating(false);
        }
    };

    if (loading) return <div className="p-10 text-center">Loading dashboard...</div>;
    if (!user) return null;

    return (
        <main className="min-h-screen bg-slate-50 p-8">
            <div className="max-w-5xl mx-auto space-y-8">
                <header className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-serif font-bold text-slate-900">My Classes</h1>
                        <p className="text-slate-500">Manage your polls and view results.</p>
                    </div>
                    <Button onClick={createSession} disabled={creating} size="lg" className="rounded-xl shadow-md">
                        <Plus className="mr-2 w-5 h-5" /> New Session
                    </Button>
                </header>

                {sessions.length === 0 ? (
                    <div className="text-center py-20 border-2 border-dashed border-slate-200 rounded-3xl">
                        <p className="text-slate-400 mb-4">No sessions yet.</p>
                        <Button variant="outline" onClick={createSession}>Get Started</Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {sessions.map(session => (
                            <Card key={session.id} className="hover:shadow-lg transition-shadow border-slate-200">
                                <CardHeader>
                                    <div className="flex justify-between items-start">
                                        <div className="px-2 py-1 bg-slate-100 rounded text-xs font-mono font-medium text-slate-600">
                                            {session.code}
                                        </div>
                                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${session.status === "OPEN" ? "bg-green-100 text-green-700" :
                                            session.status === "DRAFT" ? "bg-amber-100 text-amber-700" :
                                                "bg-slate-100 text-slate-500"
                                            }`}>
                                            {session.status}
                                        </span>
                                    </div>
                                    <CardTitle className="pt-2 font-serif text-lg">
                                        {session.questions.length > 0 ? session.questions[0].text.substring(0, 40) + "..." : "Untitled Session"}
                                    </CardTitle>
                                    <CardDescription>
                                        {session.questions.length} Questions
                                    </CardDescription>
                                </CardHeader>
                                <CardFooter>
                                    <Button
                                        className="w-full"
                                        variant={session.status === "OPEN" ? "default" : "secondary"}
                                        onClick={() => router.push(`/professor/session/${session.id}`)}
                                    >
                                        {session.status === "DRAFT" ? "Edit Session" : session.status === "OPEN" ? "Manage Live" : "View Results"}
                                        <ArrowRight className="ml-2 w-4 h-4" />
                                    </Button>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </main>
    );
}
