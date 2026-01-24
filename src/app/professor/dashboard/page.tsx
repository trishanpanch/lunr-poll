"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase/client";
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import { Session } from "@/lib/types";
import { generateSessionCode } from "@/utils/code";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Plus, ArrowRight, Clock, Users, BarChart } from "lucide-react";
import { formatDistanceToNow } from "date-fns"; // User might not have date-fns. I'll just use simple date.

export default function Dashboard() {
    const [sessions, setSessions] = useState<Session[]>([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [user, setUser] = useState<any>(null);
    const router = useRouter();

    useEffect(() => {
        // Safety timeout for loading
        const timer = setTimeout(() => setLoading(false), 5000);

        // Check for Dev Bypass
        const devUserStr = localStorage.getItem("harvard_poll_dev_user");
        if (devUserStr) {
            const devUser = JSON.parse(devUserStr);
            setUser(devUser);

            // Cloud First Strategy for Demo
            // 1. Try to listen to Firestore
            // 2. If it errors (permission denied), fallback to localStorage
            const q = query(
                collection(db, "sessions"),
                where("ownerId", "==", devUser.uid)
            );

            const unsub = onSnapshot(q, (snapshot) => {
                const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Session));
                // Simple sort
                list.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
                setSessions(list);
                setLoading(false);
            }, (err) => {
                console.warn("Cloud sync failed (likely perm denied), falling back to local storage", err);

                // Fallback to local storage
                const localSessionsStr = localStorage.getItem("harvard_poll_dev_sessions");
                if (localSessionsStr) {
                    setSessions(JSON.parse(localSessionsStr));
                }
                setLoading(false);
            });

            return () => {
                unsub();
                clearTimeout(timer);
            };
        }

        const unsubAuth = onAuthStateChanged(auth, (u) => {
            if (!u) {
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
                        // @ts-ignore
                        const tA = a.createdAt?.toMillis?.() || 0;
                        // @ts-ignore
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
            const code = generateSessionCode();

            // Try Cloud First
            try {
                const docRef = await addDoc(collection(db, "sessions"), {
                    code,
                    ownerId: user.uid,
                    status: "DRAFT",
                    createdAt: serverTimestamp(),
                    questions: []
                });
                router.push(`/professor/session/${docRef.id}`);
                return;
            } catch (cloudErr) {
                console.warn("Cloud create failed, falling back to local", cloudErr);
            }

            // Local Fallback
            if (user.uid === "dev_lunr_ID") {
                const newSession: Session = {
                    id: "local_" + Date.now(),
                    code,
                    ownerId: user.uid,
                    status: "DRAFT",
                    createdAt: {
                        seconds: Date.now() / 1000,
                        nanoseconds: 0,
                        toMillis: () => Date.now()
                    } as any,
                    questions: []
                };
                const updatedSessions = [newSession, ...sessions];
                setSessions(updatedSessions);
                localStorage.setItem("harvard_poll_dev_sessions", JSON.stringify(updatedSessions));
                router.push(`/professor/session/${newSession.id}`);
                setCreating(false);
                return;
            }

            // If real user and cloud failed, we just fail
            alert("Failed to create session (Cloud Error)");
            setCreating(false);
        } catch (e) {
            console.error(e);
            alert("Failed to create session");
            setCreating(false);
        }
    };

    if (loading) return <div className="p-10 text-center">Loading dashboard...</div>;

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
