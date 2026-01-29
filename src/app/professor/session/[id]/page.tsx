"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { Session } from "@/lib/types";
import { IS_DEMO_MODE } from "@/lib/config";
import { SessionBuilder } from "@/components/professor/SessionBuilder";
import { LiveDashboard } from "@/components/professor/LiveDashboard";
import { SynthesisView } from "@/components/professor/SynthesisView";
import { Loader2 } from "lucide-react";

export default function SessionCommandCenter() {
    const params = useParams();
    const id = typeof params.id === 'string' ? params.id : "";

    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!id) return;

        // Local Demo Mode Logic
        if (id.startsWith("local_")) {
            if (!IS_DEMO_MODE) {
                setSession(null);
                setLoading(false);
                return;
            }
            setTimeout(() => {
                const localSessionsStr = localStorage.getItem("harvard_poll_dev_sessions");
                if (localSessionsStr) {
                    const sessions = JSON.parse(localSessionsStr) as Session[];
                    const found = sessions.find(s => s.id === id);
                    if (found) {
                        setSession(found);
                    } else {
                        setSession(null);
                    }
                }
                setLoading(false);
            }, 0);
            return;
        }

        const ref = doc(db, "sessions", id);
        const unsub = onSnapshot(ref, (snap) => {
            if (snap.exists()) {
                setSession({ id: snap.id, ...snap.data() } as Session);
            } else {
                setSession(null);
            }
            setLoading(false);
        }, (err) => {
            console.error("Session Error:", err);
            // If permission denied, checking local storage might be a fallback, but for now just stop loading
            setLoading(false);
        });
        return () => unsub();
    }, [id]);

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
    );

    if (!session) return <div className="p-10 text-center">Session not found</div>;

    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            {session.status === "DRAFT" && <SessionBuilder session={session} />}
            {session.status === "OPEN" && <LiveDashboard session={session} />}
            {(session.status === "CLOSED" || session.status === "ARCHIVED") && <SynthesisView session={session} />}
        </div>
    );
}
