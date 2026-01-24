"use client";

import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { Session } from "@/lib/types";

export function useSession(code: string) {
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Safety timeout
        const timer = setTimeout(() => {
            if (loading) {
                console.warn("Session load timeout - forcing stop");
                setLoading(false);
                if (!session) setError("Timeout loading session");
            }
        }, 8000);

        if (!code) {
            setLoading(false);
            return () => clearTimeout(timer);
        }

        // Dev Bypass for static testing codes
        if (code === "TESTCODE" || code === "QsNeM3uxs0Ozp470VNO6") {
            setSession({
                id: "mock_session_id",
                code: code,
                status: "OPEN",
                ownerId: "mock_owner",
                createdAt: { seconds: Date.now() / 1000, nanoseconds: 0 },
                questions: [
                    { id: "q1", type: "short_text", text: "Mock Question: How are you?" },
                    { id: "q2", type: "multiple_choice", text: "Rate this bypass", options: ["Good", "Bad"] }
                ]
            } as any);
            setLoading(false);
            return () => clearTimeout(timer);
        }

        // Check Local Demo Storage first
        const localSessionsStr = localStorage.getItem("harvard_poll_dev_sessions");
        if (localSessionsStr) {
            try {
                const sessions = JSON.parse(localSessionsStr) as Session[];
                const found = sessions.find(s => s.code === code);
                if (found) {
                    setSession(found);
                    setLoading(false);
                    return () => clearTimeout(timer);
                }
            } catch (e) {
                console.error("Local storage parse error", e);
            }
        }

        setLoading(true);
        const q = query(collection(db, "sessions"), where("code", "==", code));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            if (snapshot.empty) {
                // Double check local storage just in case it was created after mount? 
                // Unlikely but if we want to be safe we can re-read here or just fail.
                // We typically fail here.
                setSession(null);
                setError("Session not found");
                setLoading(false);
            } else {
                const doc = snapshot.docs[0];
                setSession({ id: doc.id, ...doc.data() } as Session);
                setError(null);
                setLoading(false);
            }
        }, (err) => {
            console.error(err);
            // If permissions failed, we assume it might be a local session we missed or just error out.
            // But we already checked local storage above.
            setError(err.message);
            setLoading(false);
        });

        return () => {
            unsubscribe();
            clearTimeout(timer);
        };
    }, [code]);

    return { session, loading, error };
}
