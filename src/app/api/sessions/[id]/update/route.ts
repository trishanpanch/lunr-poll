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
        const updates: Record<string, unknown> = {};
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
        if (body.title !== undefined) {
            updates.title = body.title;
        }
        if (body.activeQuestionId !== undefined) {
            updates.activeQuestionId = body.activeQuestionId;
        }
        if (body.activeQuestionIds !== undefined) {
            updates.activeQuestionIds = body.activeQuestionIds;
        }
        if (body.deliveryMode !== undefined) {
            if (!["paced", "self_paced"].includes(body.deliveryMode)) {
                return NextResponse.json({ error: "Invalid delivery mode" }, { status: 400 });
            }
            updates.deliveryMode = body.deliveryMode;
        }
        if (body.clonedFromSessionId !== undefined) {
            updates.clonedFromSessionId = body.clonedFromSessionId;
        }

        if (Object.keys(updates).length === 0) {
            return NextResponse.json({ message: "No updates provided" });
        }

        await sessionRef.update(updates);

        return NextResponse.json({ success: true });

    } catch (error: unknown) {
        console.error("Session Update Error:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to update session" },
            { status: 500 }
        );
    }
}
