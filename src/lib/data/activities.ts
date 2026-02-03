import { db } from "@/lib/firebase/client";
import { Activity, ActivityType } from "@/lib/types";
import {
    collection,
    addDoc,
    doc,
    updateDoc,
    serverTimestamp,
    query,
    where,
    orderBy,
    onSnapshot,
    getDoc,
    deleteDoc
} from "firebase/firestore";

const ACTIVITIES_COLLECTION = "activities";

export const createActivity = async (
    ownerId: string,
    type: ActivityType,
    folderId?: string,
    defaults?: { timerSeconds?: number; profanityFilter?: boolean }
) => {
    const newActivity: Partial<Activity> = {
        ownerId,
        type,
        folderId: folderId || null as any, // Firestore doesn't like undefined
        title: "Untitled Activity",
        status: "DRAFT",
        createdAt: serverTimestamp() as any,
        updatedAt: serverTimestamp() as any,
        prompt: { text: "" },
        settings: {
            isAnonymous: false,
            responseLimit: 1,
            timerSeconds: defaults?.timerSeconds || null,
            profanityFilter: defaults?.profanityFilter || false
        }
    };

    if (type === "multiple_choice") {
        newActivity.options = [
            { id: crypto.randomUUID(), content: { text: "Option A" } },
            { id: crypto.randomUUID(), content: { text: "Option B" } }
        ];
    }

    const docRef = await addDoc(collection(db, ACTIVITIES_COLLECTION), newActivity);
    return docRef.id;
};

export const updateActivity = async (id: string, updates: Partial<Activity>) => {
    const docRef = doc(db, ACTIVITIES_COLLECTION, id);
    await updateDoc(docRef, {
        ...updates,
        updatedAt: serverTimestamp()
    });
};

export const deleteActivity = async (id: string) => {
    // Soft delete is required by UR-A7.1
    // We will move to trash status instead of hard delete
    await updateActivity(id, { status: "TRASH" });
};

export const getActivity = async (id: string) => {
    const docRef = doc(db, ACTIVITIES_COLLECTION, id);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() } as Activity;
};

export const useActivities = (ownerId?: string, folderId: string | null = null, onData?: (data: Activity[]) => void) => {
    if (!ownerId) return () => { };

    // Base constraints
    const constraints: any[] = [
        where("status", "!=", "TRASH"), // Exclude trash
        // In Firestore, if we filter by status, we might need composite index if sorting by createdAt.
        // For now, let's keep it simple.
        orderBy("createdAt", "desc")
    ];

    // Folder filtering
    if (folderId) {
        // If in a folder, just list everything in that folder (Shared or Personal)
        // We do NOT filter by ownerId here, so we can see Team content.
        constraints.push(where("folderId", "==", folderId));
    } else {
        // Root level: Must filter by ownerId to show only "My" root activities
        constraints.push(where("ownerId", "==", ownerId));
        constraints.push(where("folderId", "==", null));
    }

    const q = query(collection(db, ACTIVITIES_COLLECTION), ...constraints);

    return onSnapshot(q, (snapshot) => {
        const activities = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Activity));
        if (onData) onData(activities);
    });
};
