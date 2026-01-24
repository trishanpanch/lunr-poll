"use client";

import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot, getDocs } from "firebase/firestore";
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

        // Strategy: Run getDocs (one-time fetch) AND onSnapshot (realtime) in parallel.
        // Whoever wins first sets the data. This bypasses 'onSnapshot' hangs on some mobile networks.

        // 1. One-time Fetch
        getDocs(q).then((snapshot) => {
            if (!snapshot.empty) {
                const doc = snapshot.docs[0];
                console.log("One-time fetch success");
                setSession({ id: doc.id, ...doc.data() } as Session);
                setError(null);
                setLoading(false);
            } else {
                // Don't set error here yet, wait for realtime listener to confirm empty
                // unless we want to be fast.
                // Actually if getDocs says empty, it's empty.
                // setSession(null);
                // setError("Session not found");
                // setLoading(false);
            }
        }).catch(e => {
            console.warn("One-time fetch failed", e);
        });

        // 2. Realtime Listener
        const unsubscribe = onSnapshot(q, (snapshot) => {
            if (snapshot.empty) {
                // Only authoritative "Not Found" if both failed or this confirms it
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
            // If realtime fails but getDocs succeeded, we might want to keep the data?
            // But usually this means permission error which applies to both.
            if (!session) {
                setError(err.message);
                setLoading(false);
            }
        });

        return () => {
            unsubscribe();
            clearTimeout(timer);
        };
    }, [code]);

    return { session, loading, error };
}
