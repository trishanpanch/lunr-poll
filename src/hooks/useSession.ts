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
        if (!code) {
            setLoading(false);
            return;
        }

        // Dev Bypass for testing UI without Firestore connectivity
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
            return;
        }

        setLoading(true);
        const q = query(collection(db, "sessions"), where("code", "==", code));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            if (snapshot.empty) {
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
            setError(err.message);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [code]);

    return { session, loading, error };
}
