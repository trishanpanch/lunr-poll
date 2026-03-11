import { NextResponse } from "next/server";
import { Timestamp } from "firebase-admin/firestore";
import { auth as adminAuth, db as adminDb } from "@/lib/firebase/server";

function generateSessionCode() {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let result = "";
    for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

export async function POST(req: Request, props: { params: Promise<{ id: string }> }) {
    try {
        const params = await props.params;
        const { id } = params;

        const authHeader = req.headers.get("Authorization");
        if (!authHeader?.startsWith("Bearer ")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const token = authHeader.split("Bearer ")[1];
        const decodedToken = await adminAuth.verifyIdToken(token);

        const sessionRef = adminDb.collection("sessions").doc(id);
        const sessionDoc = await sessionRef.get();

        if (!sessionDoc.exists) {
            return NextResponse.json({ error: "Session not found" }, { status: 404 });
        }

        const session = sessionDoc.data();
        if (!session || session.ownerId !== decodedToken.uid) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const code = generateSessionCode();
        const clonedRef = await adminDb.collection("sessions").add({
            code,
            ownerId: decodedToken.uid,
            title: session.title || "Untitled Session",
            status: "OPEN",
            createdAt: Timestamp.now(),
            deliveryMode: session.deliveryMode || "paced",
            questions: session.questions || [],
            activeQuestionId: null,
            activeQuestionIds: [],
            clonedFromSessionId: id
        });

        return NextResponse.json({ id: clonedRef.id, code });
    } catch (error: unknown) {
        console.error("Session Relaunch Error:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to relaunch session" },
            { status: 500 }
        );
    }
}
