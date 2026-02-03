import { db } from "@/lib/firebase/client";
import { UserProfile } from "@/lib/types";
import {
    doc,
    getDoc,
    updateDoc,
    collection,
    query,
    where,
    getDocs,
    onSnapshot
} from "firebase/firestore";

const USERS_COLLECTION = "users";

export const getUser = async (uid: string) => {
    const docRef = doc(db, USERS_COLLECTION, uid);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;
    return snap.data() as UserProfile;
};

// For now, we assume simple handle resolution via query.
// In production, we'd want a dedicated "handles" collection for O(1) lookups and uniqueness constraints.
export const resolveHandle = async (handle: string): Promise<UserProfile | null> => {
    const q = query(collection(db, USERS_COLLECTION), where("handle", "==", handle));
    const snap = await getDocs(q);
    if (snap.empty) return null;
    return snap.docs[0].data() as UserProfile;
};

export const subscribeToUserProfile = (uid: string, onData: (profile: UserProfile | null) => void) => {
    return onSnapshot(doc(db, USERS_COLLECTION, uid), (doc) => {
        if (doc.exists()) onData(doc.data() as UserProfile);
        else onData(null);
    });
};

export const activateActivity = async (uid: string, activityId: string | null) => {
    // Sets the user's "current live activity".
    // If activityId is null, it deactivates everything.
    const docRef = doc(db, USERS_COLLECTION, uid);

    // We update the 'currentActivityId' field on the user profile.
    // Note: UserProfile type needs to include this field theoretically, but Firestore is flexible.
    await updateDoc(docRef, {
        currentActivityId: activityId || null,
        // We might also want to set status on the Activity itself to "ACTIVE" for query purposes,
        // but Single-Source-Of-Truth on the User is UR-B2.2 (Single active constraint).
    });
};
