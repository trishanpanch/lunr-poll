import { db } from "@/lib/firebase/client";
import { Activity, Run, Response } from "@/lib/types";
import {
    collection,
    addDoc,
    serverTimestamp,
    query,
    where,
    getDocs,
    writeBatch,
    doc
} from "firebase/firestore";

const RUNS_COLLECTION = "runs";
const RESPONSES_COLLECTION = "responses";

export const archiveCurrentSession = async (activity: Activity, runName: string = "Archive") => {
    // 1. Create a Run document
    const runData: Partial<Run> = {
        activityId: activity.id,
        name: runName,
        startedAt: activity.updatedAt, // Approximate
        endedAt: serverTimestamp() as any,
        status: "COMPLETED",
        responseCount: 0
    };

    const runRef = await addDoc(collection(db, RUNS_COLLECTION), runData);
    const runId = runRef.id;

    // 2. Fetch all current responses for this activity
    const q = query(collection(db, RESPONSES_COLLECTION), where("activityId", "==", activity.id));
    const snap = await getDocs(q);

    // 3. Move them to runs/{runId}/responses OR just update their runId?
    // Updating runId is easier if we want to keep them in one big collection for "All Time" stats.
    // However, clean separation is better for deletion.
    // Let's copy them to a subcollection `runs/{runId}/responses` and DELETE from `responses`.
    // This keeps the `responses` collection as "Current Active State" only, which is fast.

    const batch = writeBatch(db);
    let count = 0;

    snap.docs.forEach(snapshotDoc => {
        const data = snapshotDoc.data();

        // We can't use batch with add() easily without generating ID.
        // Let's Just use doc(collection, id) to preserve ID or generate new.
        // Preserving ID is safer.
        const targetRef = doc(db, RUNS_COLLECTION, runId, "responses", snapshotDoc.id);
        batch.set(targetRef, { ...data, runId });

        // Delete from old
        batch.delete(snapshotDoc.ref);
        count++;
    });

    await batch.commit();

    // Update run count
    return count;
};
