import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { auth as adminAuth, db as adminDb } from "@/lib/firebase/server";

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

const MODELS = ["gemini-2.0-flash", "gemini-2.0-flash-lite"];
const MAX_RETRIES = 2;

function buildPrompt(questions: any[], responses: any[]): string {
    const inputs = questions.map((q: any) => {
        const answers = responses
            .map((r: any) => r.answers ? r.answers[q.id] : undefined)
            .filter((a: any) => a && typeof a === 'string');
        return { question: q.text, answers };
    });

    return `
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
}

async function generateWithRetry(genAI: GoogleGenerativeAI, prompt: string): Promise<object> {
    let lastError: Error | null = null;

    for (const modelName of MODELS) {
        const model = genAI.getGenerativeModel({
            model: modelName,
            generationConfig: { responseMimeType: "application/json" }
        });

        for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
            try {
                if (attempt > 0) {
                    await new Promise(res => setTimeout(res, 1000 * attempt));
                }

                const result = await model.generateContent(prompt);
                const text = result.response.candidates?.[0]?.content?.parts?.[0]?.text;
                if (!text) throw new Error("Empty response from AI");

                return JSON.parse(text);
            } catch (err) {
                lastError = err as Error;
                console.warn(`Attempt ${attempt + 1}/${MAX_RETRIES + 1} failed with ${modelName}:`, lastError.message);
            }
        }
        console.warn(`All retries exhausted for ${modelName}, trying next model...`);
    }

    const message = lastError?.message || "Failed to synthesize";
    const isRateLimit = message.toLowerCase().includes("rate") || message.toLowerCase().includes("quota");
    throw new Error(
        isRateLimit
            ? "AI service is temporarily rate limited. Please wait a minute and try again."
            : `Synthesis failed after retrying: ${message}`
    );
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

        if (!checkRateLimit(decodedToken.uid)) {
            return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
        }

        const sessionDoc = await adminDb.collection("sessions").doc(sessionId).get();
        if (!sessionDoc.exists) {
            return NextResponse.json({ error: "Session not found" }, { status: 404 });
        }

        const sessionData = sessionDoc.data();
        if (sessionData?.ownerId !== decodedToken.uid) {
            return NextResponse.json({ error: "Forbidden: You do not own this session" }, { status: 403 });
        }

        const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
        if (!apiKey) throw new Error("Missing API Key");

        const genAI = new GoogleGenerativeAI(apiKey);
        const prompt = buildPrompt(questions, responses);
        const result = await generateWithRetry(genAI, prompt);

        return NextResponse.json(result);
    } catch (error) {
        const e = error as Error;
        console.error("AI Error:", error);
        return NextResponse.json({ error: e.message || "Failed to synthesize" }, { status: 503 });
    }
}
