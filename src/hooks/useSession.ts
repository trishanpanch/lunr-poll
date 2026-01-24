"use client";

import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { Session } from "@/lib/types";

export function useSession(code: string, sessionId?: string, options: { enabled?: boolean } = {}) {
    const { enabled = true } = options;
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // If not enabled (waiting for auth), just wait.
        if (!enabled) {
            return;
        }

        // Safety timeout
        const timer = setTimeout(() => {
            if (loading) {
                console.warn("Session load timeout - forcing stop");
                setLoading(false);
                if (!session) setError("Timeout loading session");
            }
        }, 15000); // Increased timeout for safety

        if (!code && !sessionId) {
            setLoading(false);
            return () => clearTimeout(timer);
        }

        // Check Local Demo Storage first
        const localSessionsStr = localStorage.getItem("harvard_poll_dev_sessions");
        if (localSessionsStr) {
            try {
                const sessions = JSON.parse(localSessionsStr) as Session[];
                const found = sessionId
                    ? sessions.find(s => s.id === sessionId)
                    : sessions.find(s => s.code === code);
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

        // If we have a sessionId, we can do a DIRECT lookup (faster/more robust)
        if (sessionId && !sessionId.startsWith("local_")) {
            const docRef = doc(db, "sessions", sessionId);

            // 1. One-time Direct Fetch
            getDoc(docRef).then((snap) => {
                if (snap.exists()) {
                    setSession({ id: snap.id, ...snap.data() } as Session);
                    setError(null);
                    setLoading(false);
                }
            }).catch(e => console.warn("Direct fetch failed", e));

            // 2. Realtime Direct Listener
            const unsub = onSnapshot(docRef, (snap) => {
                if (snap.exists()) {
                    setSession({ id: snap.id, ...snap.data() } as Session);
                    setError(null);
                    setLoading(false);
                } else {
                    setError("Session not found (ID)");
                    setLoading(false);
                }
            }, (err) => {
                setError(err.message);
                setLoading(false);
            });

            return () => {
                unsub();
                clearTimeout(timer);
            };
        }

        // Fallback to Code Query
        const q = query(collection(db, "sessions"), where("code", "==", code));

        // 1. One-time Fetch
        getDocs(q).then((snapshot) => {
            if (!snapshot.empty) {
                const doc = snapshot.docs[0];
                setSession({ id: doc.id, ...doc.data() } as Session);
                setError(null);
                setLoading(false);
            }
        }).catch(e => console.warn("Query fetch failed", e));

        // 2. Realtime Listener
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
            if (!session) {
                setError(err.message);
                setLoading(false);
            }
        });

        return () => {
            unsubscribe();
            clearTimeout(timer);
        };
    }, [code, sessionId, enabled]);

    return { session, loading, error };
}
