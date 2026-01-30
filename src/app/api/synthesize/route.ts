import { NextResponse } from "next/server";
import { VertexAI } from "@google-cloud/vertexai";
import { auth as adminAuth, db as adminDb } from "@/lib/firebase/server";
import { Timestamp } from "firebase-admin/firestore";

// Simple in-memory rate limiter (Token Bucket)
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS = 10;
const rateLimitMap = new Map<string, { count: number; expires: number }>();

function checkRateLimit(uid: string) {
    const now = Date.now();
    const record = rateLimitMap.get(uid);

    if (!record || now > record.expires) {
        rateLimitMap.set(uid, { count: 1, expires: now + RATE_LIMIT_WINDOW });
        return true;
    }

    if (record.count >= MAX_REQUESTS) {
        return false;
    }

    record.count++;
    return true;
}

export async function POST(req: Request) {
    try {
        const authHeader = req.headers.get("Authorization");
        if (!authHeader?.startsWith("Bearer ")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const token = authHeader.split("Bearer ")[1];
        let decodedToken;
        try {
            decodedToken = await adminAuth.verifyIdToken(token);
        } catch (e) {
            console.error("Token verification failed:", e);
            return NextResponse.json({ error: "Invalid token" }, { status: 401 });
        }

        const { questions, responses, sessionId } = await req.json();

        if (!sessionId) {
            return NextResponse.json({ error: "Session ID required" }, { status: 400 });
        }

        // Rate Limit Check
        if (!checkRateLimit(decodedToken.uid)) {
            return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
        }

        // Check Session Ownership
        const sessionDoc = await adminDb.collection("sessions").doc(sessionId).get();
        if (!sessionDoc.exists) {
            return NextResponse.json({ error: "Session not found" }, { status: 404 });
        }

        const sessionData = sessionDoc.data();
        if (sessionData?.ownerId !== decodedToken.uid) {
            return NextResponse.json({ error: "Forbidden: You do not own this session" }, { status: 403 });
        }

        const project = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
        if (!project) throw new Error("Missing Project ID");

        const location = "us-central1";
        const vertexAI = new VertexAI({ project, location });
        const model = vertexAI.getGenerativeModel({
            model: "gemini-1.0-pro",
            generationConfig: {
                responseMimeType: "application/json"
            }
        });

        // Construct a prompt that aggregates all questions and responses
        const inputs = questions.map((q: any) => {
            const answers = responses
                .map((r: any) => r.answers ? r.answers[q.id] : undefined)
                .filter((a: any) => a && typeof a === 'string');
            return {
                question: q.text,
                answers: answers
            };
        });

        const prompt = `
      You are an expert pedagogical consultant for a Harvard graduate course. 
      Analyze the following student responses across the entire session. 
      Do not summarize; diagnose. Identify patterns in understanding and misconceptions.

      Session Data:
      ${JSON.stringify(inputs)}
      
      Output JSON only matching this schema:
      {
        "executive_summary": "String (High-level summary of the class's performance and engagement)",
        "common_misconceptions": ["String", "String (Cross-cutting misunderstandings observed)"],
        "engagement_analysis": "String (Analysis of how students engaged with the material)",
        "teaching_recommendations": ["String", "String (Specific, actionable 2-minute interventions for the professor)"]
      }
    `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!text) throw new Error("No response from AI");

        return NextResponse.json(JSON.parse(text));
    } catch (error) {
        const e = error as Error;
        console.error("AI Error:", error);
        return NextResponse.json({ error: e.message || "Failed to synthesize" }, { status: 500 });
    }
}
