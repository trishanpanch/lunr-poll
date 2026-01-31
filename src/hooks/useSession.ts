"use client";

import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot, getDocs, doc, getDoc } from "firebase/firestore";
import { db, auth } from "@/lib/firebase/client";
import { Session } from "@/lib/types";

export function useSession(code: string, sessionId?: string, options: { enabled?: boolean } = {}) {
    const { enabled = true } = options;
    const [session, setSession] = useState<Session | null>(null);
    // Initialize loading: If enabled and we have search criteria, we are loading.
    const [loading, setLoading] = useState(() => enabled && (!!code || !!sessionId));
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // If not enabled or no criteria, ensure we are not loading.
        if (!enabled || (!code && !sessionId)) {
            if (loading) setTimeout(() => setLoading(false), 0);
            return;
        }

        // CRITICAL FIX: Do not attempt to query Firestore until we have a user (Anonymous or otherwise)
        if (!auth.currentUser) {
            return;
        }

        // We are starting a request
        setTimeout(() => setLoading(true), 0);

        // Safety timeout to catch hanging connections
        const timer = setTimeout(() => {
            // Check 'loading' roughly. 
            // We rely on cleanup to cancel this if successful.
            setLoading(false);
            setError(prev => prev ? prev : "Timeout loading session");
        }, 15000);

        const clearSafetyTimer = () => clearTimeout(timer);

        // If we have a sessionId, we can do a DIRECT lookup (faster/more robust)
        if (sessionId && !sessionId.startsWith("local_")) {
            const docRef = doc(db, "sessions", sessionId);

            // 1. One-time Direct Fetch
            getDoc(docRef).then((snap) => {
                if (snap.exists()) {
                    setSession({ id: snap.id, ...snap.data() } as Session);
                    setError(null);
                    setLoading(false);
                    clearSafetyTimer();
                }
            }).catch(e => console.warn("Direct fetch failed", e));

            // 2. Realtime Direct Listener
            const unsub = onSnapshot(docRef, (snap) => {
                if (snap.exists()) {
                    setSession({ id: snap.id, ...snap.data() } as Session);
                    setError(null);
                    setLoading(false);
                    clearSafetyTimer();
                } else {
                    setError("Session not found (ID)");
                    setLoading(false);
                    clearSafetyTimer();
                }
            }, (err) => {
                setError(err.message);
                setLoading(false);
                clearSafetyTimer();
            });

            return () => {
                unsub();
                clearSafetyTimer();
            };
        }

        // Fallback to Code Query
        // SECURITY FIX: Must include where("status", "==", "OPEN") to match security rules for public reads.
        const q = query(collection(db, "sessions"), where("code", "==", code), where("status", "==", "OPEN"));

        // 1. One-time Fetch
        getDocs(q).then((snapshot) => {
            if (!snapshot.empty) {
                const doc = snapshot.docs[0];
                setSession({ id: doc.id, ...doc.data() } as Session);
                setError(null);
                setLoading(false);
                clearSafetyTimer();
            }
        }).catch(e => console.warn("Query fetch failed", e));

        // 2. Realtime Listener
        const unsubscribe = onSnapshot(q, (snapshot) => {
            if (snapshot.empty) {
                setSession(null);
                setError("Session not found");
                setLoading(false);
                clearSafetyTimer();
            } else {
                const doc = snapshot.docs[0];
                setSession({ id: doc.id, ...doc.data() } as Session);
                setError(null);
                setLoading(false);
                clearSafetyTimer();
            }
        }, (err) => {
            console.error(err);
            if (!session) {
                setError(err.message);
                setLoading(false);
            }
            clearSafetyTimer();
        });

        return () => {
            unsubscribe();
            clearSafetyTimer();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [code, sessionId, enabled]);

    return { session, loading, error };
}
