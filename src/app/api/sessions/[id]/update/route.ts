import { NextResponse } from "next/server";
import { auth as adminAuth, db as adminDb } from "@/lib/firebase/server";

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

        const body = await req.json();
        const { questions, status } = body; // Allow partial updates (e.g. only status)

        if (!id) return NextResponse.json({ error: "Session ID required" }, { status: 400 });

        // Check Ownership
        const sessionRef = adminDb.collection("sessions").doc(id);
        const sessionDoc = await sessionRef.get();

        if (!sessionDoc.exists) {
            return NextResponse.json({ error: "Session not found" }, { status: 404 });
        }

        if (sessionDoc.data()?.ownerId !== decodedToken.uid) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // Prepare Update Data
        const updates: any = {};
        if (questions !== undefined) {
            // Basic validation: ensure questions is an array
            if (!Array.isArray(questions)) {
                return NextResponse.json({ error: "Invalid format for questions" }, { status: 400 });
            }
            updates.questions = questions;
        }
        if (status !== undefined) {
            if (!["DRAFT", "OPEN", "CLOSED"].includes(status)) {
                return NextResponse.json({ error: "Invalid status" }, { status: 400 });
            }
            updates.status = status;
        }
        if (body.analysis !== undefined) {
            updates.analysis = body.analysis;
        }

        if (Object.keys(updates).length === 0) {
            return NextResponse.json({ message: "No updates provided" });
        }

        await sessionRef.update(updates);

        return NextResponse.json({ success: true });

    } catch (e: any) {
        console.error("Session Update Error:", e);
        return NextResponse.json({ error: e.message || "Failed to update session" }, { status: 500 });
    }
}
