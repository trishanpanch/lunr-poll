"use client";

import { useEffect, useState, use } from "react";
import { useSession } from "@/hooks/useSession";
import { signInAnonymously, onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import { Loader2 } from "lucide-react";
import { QuestionList } from "@/components/student/QuestionList";

// React 18+ / Next.js 14+ specific: params is a Promise in some contexts, but in 'use client' pages provided via props or hook?
// Actually in Next 15 params is async in Layouts but Page props used to be simple? 
// Next.js 15: Page props `params` is a Promise.
// But we are in "use client".
// We can use `useParams` from `next/navigation`.

import { useParams } from "next/navigation";

export default function SessionPage() {
    const params = useParams();
    const code = typeof params.code === 'string' ? params.code : "";

    const { session, loading, error } = useSession(code);
    const [user, setUser] = useState<User | null>(null);
    const [authLoading, setAuthLoading] = useState(true);

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, (u) => {
            if (u) {
                setUser(u);
                setAuthLoading(false);
            } else {
                console.log("Signing in anonymously...");
                signInAnonymously(auth)
                    .then(() => console.log("Signed in"))
                    .catch((e) => {
                        console.warn("Sign in failed (likely auth disabled), using mock user", e);
                        // Mock user for dev/bypass
                        setUser({ uid: "anon_student_" + Math.random(), isAnonymous: true } as User);
                        setAuthLoading(false);
                    });
            }
        });
        return () => unsub();
    }, []);

    if (loading || authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (error || !session) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
                <p className="text-slate-500">Session not found or error loading session.</p>
            </div>
        );
    }

    if (session.status !== "OPEN") {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
                <div className="text-center">
                    <h2 className="text-2xl font-serif text-slate-800 mb-2">Session Closed</h2>
                    <p className="text-slate-500">This session is currently {session.status.toLowerCase()}.</p>
                </div>
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-slate-50 p-4 pb-20">
            <header className="mb-6 flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                <div>
                    <span className="text-xs text-slate-400 uppercase tracking-wider font-bold">Session</span>
                    <h1 className="font-mono text-xl font-bold text-slate-900 tracking-wider">{code}</h1>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-700 text-xs font-bold uppercase tracking-wider rounded-full border border-green-100">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                    </span>
                    Live
                </div>
            </header>

            <QuestionList session={session} userId={user?.uid!} />
        </main>
    );
}
