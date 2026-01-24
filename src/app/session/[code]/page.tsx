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
        // Use a simple local ID for student identity, avoiding Firebase Auth/Anonymous Login overhead
        // checking if this fixes the timeout issues on mobile.
        const storedId = localStorage.getItem("harvard_poll_student_uid");
        if (storedId) {
            setUser({ uid: storedId, isAnonymous: true } as User);
            setAuthLoading(false);
        } else {
            const newId = "anon_" + Math.random().toString(36).substr(2, 9);
            localStorage.setItem("harvard_poll_student_uid", newId);
            setUser({ uid: newId, isAnonymous: true } as User);
            setAuthLoading(false);
        }
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
            <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6 text-center">
                <div className="bg-white p-8 rounded-2xl shadow-lg max-w-md w-full border border-red-100">
                    <h2 className="text-xl font-bold text-red-600 mb-2">Connection Error</h2>
                    <p className="text-slate-600 mb-6">Could not load session.</p>

                    <div className="text-left bg-slate-100 p-4 rounded-lg font-mono text-xs text-slate-500 overflow-auto mb-4">
                        <p><strong>Code:</strong> {code}</p>
                        <p><strong>Status:</strong> {loading ? "Loading..." : "Failed"}</p>
                        <p><strong>Error:</strong> {error || "Session not found (Empty Result)"}</p>
                    </div>

                    <p className="text-sm text-slate-400">
                        Ask your professor to check if their "Session ID" starts with "local_".
                        If so, mobile sync is disabled.
                    </p>
                </div>
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
