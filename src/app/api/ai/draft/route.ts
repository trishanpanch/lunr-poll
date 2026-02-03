import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { auth as adminAuth } from "@/lib/firebase/server";
import { QuestionType } from "@/lib/types";

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
            return NextResponse.json({ error: "Invalid token" }, { status: 401 });
        }

        // Rate Limit Check
        if (!checkRateLimit(decodedToken.uid)) {
            return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
        }

        const { topic, type } = await req.json();

        if (!topic) {
            return NextResponse.json({ error: "Topic is required" }, { status: 400 });
        }

        const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

        // MOCK MODE FOR DEV/VERIFICATION
        if (!apiKey) {
            console.warn("No GEMINI_API_KEY found, returning mock draft.");
            // Wait a bit to simulate network
            await new Promise(r => setTimeout(r, 1500));

            return NextResponse.json({
                text: `[MOCK] Why is **${topic}** important? (AI Generated)`,
                options: type === "multiple_choice" ? ["Reason 1", "Reason 2", "Reason 3"] : null
            });
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
            model: "gemini-2.0-flash",
            generationConfig: {
                responseMimeType: "application/json"
            }
        });

        const prompt = `
            You are an expert professor authoring a question for a class activity.
            Topic: "${topic}"
            Question Type: "${type || "multiple_choice"}"

            Create a single high-quality, thought-provoking question.
            
            If the type is "multiple_choice", provide 2-4 distinct options.
            If the type is "short_text" or "open_ended", options should be null.
            
            Output JSON matching this schema:
            {
                "text": "String (The question prompt. Use Markdown if helpful, e.g. for code or math)",
                "options": ["String", "String"] (Array of strings for options, or null/empty if open ended)
            }
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!text) throw new Error("No response from AI");

        return NextResponse.json(JSON.parse(text));
    } catch (error) {
        console.error("AI Draft Error:", error);
        return NextResponse.json({ error: "Failed to generate draft" }, { status: 500 });
    }
}
