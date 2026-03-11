import { NextResponse } from "next/server";
import { auth as adminAuth, db as adminDb } from "@/lib/firebase/server";
import { Timestamp } from "firebase-admin/firestore";

function generateSessionCode() {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let result = "";
    for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

export async function POST(req: Request) {
    try {
        const authHeader = req.headers.get("Authorization");
        if (!authHeader?.startsWith("Bearer ")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const token = authHeader.split("Bearer ")[1];
        const decodedToken = await adminAuth.verifyIdToken(token);

        const code = generateSessionCode();

        const docRef = await adminDb.collection("sessions").add({
            code,
            ownerId: decodedToken.uid,
            title: "Untitled Session",
            status: "DRAFT",
            createdAt: Timestamp.now(),
            deliveryMode: "paced",
            questions: []
        });

        return NextResponse.json({ id: docRef.id, code });
    } catch (error: unknown) {
        console.error("Session Create Error:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to create session" },
            { status: 500 }
        );
    }
}
