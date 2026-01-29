import { NextResponse } from "next/server";
import { auth as adminAuth, db as adminDb } from "@/lib/firebase/server";
import { Timestamp } from "firebase-admin/firestore";

export async function POST(req: Request) {
    try {
        const { email, password, inviteCode } = await req.json();

        // Server-side validation of invite code
        // In production, use process.env.PROFESSOR_INVITE_CODE
        const VALID_CODE = process.env.PROFESSOR_INVITE_CODE || "02143";

        if (inviteCode !== VALID_CODE) {
            return NextResponse.json({ error: "Invalid invite code" }, { status: 403 });
        }

        if (!email || !password) {
            return NextResponse.json({ error: "Email and password required" }, { status: 400 });
        }

        try {
            // Create user in Firebase Auth
            const userRecord = await adminAuth.createUser({
                email,
                password,
                displayName: "Professor"
            });

            // Create user document in Firestore
            await adminDb.collection("users").doc(userRecord.uid).set({
                uid: userRecord.uid,
                email: email,
                name: "Professor",
                createdAt: Timestamp.now(),
                role: "professor" // Explicit role assignment
            });

            return NextResponse.json({ success: true, uid: userRecord.uid });

        } catch (firebaseError: any) {
            console.error("Firebase Create Error:", firebaseError);
            if (firebaseError.code === 'auth/email-already-exists') {
                return NextResponse.json({ error: "Email already in use" }, { status: 409 });
            }
            return NextResponse.json({ error: firebaseError.message || "Failed to create account" }, { status: 500 });
        }

    } catch (error) {
        console.error("Server Error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
