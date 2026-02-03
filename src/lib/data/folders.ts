import { db } from "@/lib/firebase/client";
import { Folder } from "@/lib/types";
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
    deleteDoc
} from "firebase/firestore";

const FOLDERS_COLLECTION = "folders";

export const createFolder = async (ownerId: string, name: string, parentFolderId?: string) => {
    const newFolder: Partial<Folder> = {
        ownerId,
        name,
        parentFolderId: parentFolderId || null as any,
        createdAt: serverTimestamp() as any,
        order: 0 // Default order, can be updated later
    };

    const docRef = await addDoc(collection(db, FOLDERS_COLLECTION), newFolder);
    return docRef.id;
};

export const updateFolder = async (id: string, updates: Partial<Folder>) => {
    const docRef = doc(db, FOLDERS_COLLECTION, id);
    await updateDoc(docRef, updates);
};

export const deleteFolder = async (id: string) => {
    // Note: This is a hard delete for folders usually, or prevent if not empty.
    // For MVP/UR-A1.3, we focus on Activity deletion. Folder deletion policies TBD.
    // Let's assume hard delete for folder container, but items inside should be moved or warned.
    // For now, just delete the folder doc.
    await deleteDoc(doc(db, FOLDERS_COLLECTION, id));
};

export const useFolders = (ownerId?: string, parentFolderId: string | null = null, onData?: (data: Folder[]) => void) => {
    if (!ownerId) return () => { };

    const constraints: any[] = [
        orderBy("name", "asc")
    ];

    if (parentFolderId) {
        // Subfolders: Just match parent
        constraints.push(where("parentFolderId", "==", parentFolderId));
    } else {
        // Root: Match owner
        constraints.push(where("ownerId", "==", ownerId));
        constraints.push(where("parentFolderId", "==", null));
    }

    const q = query(collection(db, FOLDERS_COLLECTION), ...constraints);

    return onSnapshot(q, (snapshot) => {
        const folders = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Folder));
        if (onData) onData(folders);
    });
};

export const useTeamFolders = (teamIds: string[] = [], onData?: (data: Folder[]) => void) => {
    if (!teamIds.length) return () => { };

    // Fetch root folders for these teams
    // Firestore "in" query limits to 10.
    // If > 10, we might need multiple queries, but for MVP let's assume < 10 teams.
    const q = query(
        collection(db, FOLDERS_COLLECTION),
        where("teamId", "in", teamIds),
        where("parentFolderId", "==", null)
        // orderBy name might need composite index with teamId
    );

    return onSnapshot(q, (snapshot) => {
        const folders = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Folder));
        if (onData) onData(folders);
    });
};
