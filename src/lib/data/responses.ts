import { db } from "@/lib/firebase/client";
import { Response } from "@/lib/types";
import {
    collection,
    addDoc,
    serverTimestamp,
    query,
    where,
    onSnapshot,
    orderBy,
    doc,
    updateDoc
} from "firebase/firestore";

const RESPONSES_COLLECTION = "responses";

import { Filter } from "bad-words";

const filter = new Filter();

export const submitResponse = async (
    activityId: string,
    participantId: string,
    content: any,
    context?: "qa" | "poll"
) => {
    // Profanity Check (SP5-5)
    if (content.text && typeof content.text === "string") {
        if (filter.isProfane(content.text)) {
            throw new Error("Please use professional language.");
        }
    }

    const newResponse: Partial<Response> = {
        activityId,
        participantId,
        content,
        submittedAt: serverTimestamp() as any
    };

    if (context === "qa") {
        newResponse.upvotes = 0;
        newResponse.upvoterIds = [];
        newResponse.status = "APPROVED"; // Default to APPROVED for now. PENDING if moderation check passes.
    }

    await addDoc(collection(db, RESPONSES_COLLECTION), newResponse);
};

export const useResponses = (activityId: string, onData: (responses: Response[]) => void) => {
    const q = query(
        collection(db, RESPONSES_COLLECTION),
        where("activityId", "==", activityId),
        orderBy("submittedAt", "desc")
    );

    return onSnapshot(q, (snapshot) => {
        const responses = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Response));
        if (onData) onData(responses);
        if (onData) onData(responses);
    });
};

export const useMyResponse = (activityId: string, participantId: string, onData: (response: Response | null) => void) => {
    if (!participantId) return () => { };

    const q = query(
        collection(db, RESPONSES_COLLECTION),
        where("activityId", "==", activityId),
        where("participantId", "==", participantId),
        orderBy("submittedAt", "desc")
        // limit(1) // Ideally limit 1, but order by catches latest
    );

    return onSnapshot(q, (snapshot) => {
        if (!snapshot.empty) {
            const data = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as Response;
            onData(data);
        } else {
            onData(null);
        }
    });
};

export const updateResponse = async (responseId: string, updates: any) => {
    const docRef = doc(db, RESPONSES_COLLECTION, responseId);
    await updateDoc(docRef, {
        ...updates,
        submittedAt: serverTimestamp()
    });
};
