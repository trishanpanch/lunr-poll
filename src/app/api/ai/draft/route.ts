import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { auth as adminAuth } from "@/lib/firebase/server";
import { QuestionPurpose, QuestionRevealMode, QuestionType } from "@/lib/types";

const RATE_LIMIT_WINDOW = 60 * 1000;
const MAX_REQUESTS = 10;
const rateLimitMap = new Map<string, { count: number; expires: number }>();

type DraftQuestionType = QuestionType | "auto" | "mixed";
type DraftDifficulty = "introductory" | "intermediate" | "advanced" | "mixed";

interface DraftQuestionResponse {
    text: string;
    type: QuestionType;
    options?: string[] | null;
    purpose?: QuestionPurpose;
    correctAnswers?: string[] | null;
    explanation?: string | null;
    revealMode?: QuestionRevealMode | null;
}

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

function normalizeQuestions(
    questions: DraftQuestionResponse[],
    purpose: QuestionPurpose,
    requestedType: DraftQuestionType
) {
    return questions.map((question, index) => {
        const nextType = ["multiple_choice", "short_text", "rating"].includes(question.type)
            ? question.type
            : (requestedType === "auto" || requestedType === "mixed" ? "multiple_choice" : requestedType);

        return {
            text: question.text || `Generated question ${index + 1}`,
            type: nextType as QuestionType,
            options:
                nextType === "multiple_choice"
                    ? Array.isArray(question.options) && question.options.length >= 2
                        ? question.options.slice(0, 5)
                        : ["Option A", "Option B", "Option C"]
                    : null,
            purpose: question.purpose || purpose,
            correctAnswers: Array.isArray(question.correctAnswers) ? question.correctAnswers : [],
            explanation: question.explanation || "",
            revealMode: question.revealMode || (purpose === "assessment" ? "after_submission" : "never")
        };
    });
}

function buildMockQuestions(
    topic: string,
    purpose: QuestionPurpose,
    requestedType: DraftQuestionType,
    questionCount: number
) {
    const rotation: QuestionType[] =
        requestedType === "mixed"
            ? ["multiple_choice", "short_text", "rating"]
            : requestedType === "auto"
                ? purpose === "assessment"
                    ? ["multiple_choice", "multiple_choice", "short_text"]
                    : ["multiple_choice", "short_text", "rating"]
                : [requestedType];

    const questions: DraftQuestionResponse[] = Array.from({ length: questionCount }, (_, index) => {
        const type = rotation[index % rotation.length];

        if (type === "multiple_choice") {
            const options = purpose === "assessment"
                ? ["Key principle", "Common misconception", "Irrelevant detail", "Opposite conclusion"]
                : ["Strongly agree", "Agree", "Disagree", "Strongly disagree"];

            return {
                text: `[MOCK] Which statement best matches ${topic}?`,
                type,
                options,
                purpose,
                correctAnswers: purpose === "assessment" ? [options[0]] : [],
                explanation:
                    purpose === "assessment"
                        ? `${options[0]} is the best answer because it reflects the core concept behind ${topic}.`
                        : "",
                revealMode: purpose === "assessment" ? "after_submission" : "never"
            };
        }

        if (type === "rating") {
            return {
                text: `[MOCK] How confident are you with ${topic}?`,
                type,
                purpose,
                revealMode: "never"
            };
        }

        return {
            text: `[MOCK] What is still unclear about ${topic}?`,
            type: "short_text",
            purpose,
            revealMode: "never"
        };
    });

    return normalizeQuestions(questions, purpose, requestedType);
}

function parseModelJson(text: string) {
    const cleaned = text
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/i, "")
        .replace(/\s*```$/i, "")
        .trim();

    return JSON.parse(cleaned);
}

export async function POST(req: Request) {
    try {
        const authHeader = req.headers.get("Authorization");
        if (!authHeader?.startsWith("Bearer ")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const token = authHeader.split("Bearer ")[1];
        const decodedToken = await adminAuth.verifyIdToken(token);

        if (!checkRateLimit(decodedToken.uid)) {
            return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
        }

        const body = await req.json();
        const topic = String(body.topic || "").trim();
        const purpose = (body.purpose || "discussion") as QuestionPurpose;
        const requestedType = (body.type || "auto") as DraftQuestionType;
        const difficulty = (body.difficulty || "intermediate") as DraftDifficulty;
        const questionCount = Math.min(Math.max(Number(body.questionCount || 1), 1), 5);

        if (!topic) {
            return NextResponse.json({ error: "Topic is required" }, { status: 400 });
        }

        const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

        if (!apiKey) {
            console.warn("No GEMINI_API_KEY found, returning mock draft.");
            await new Promise((resolve) => setTimeout(resolve, 800));
            return NextResponse.json({
                questions: buildMockQuestions(topic, purpose, requestedType, questionCount)
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
You are an expert professor designing classroom polling questions.

Create ${questionCount} question(s) about "${topic}".
Purpose: ${purpose}
Question type strategy: ${requestedType}
Difficulty level: ${difficulty}

Supported question types are only:
- "multiple_choice"
- "short_text"
- "rating"

Rules:
- If the strategy is "multiple_choice", every question must be multiple choice.
- If the strategy is "short_text", every question must be open ended.
- If the strategy is "rating", every question must be a confidence or sentiment rating prompt.
- If the strategy is "auto", choose the best supported type for each question.
- If the strategy is "mixed", use a thoughtful mix of supported types.
- For assessment questions, prefer multiple choice, include 3-5 options, include "correctAnswers", and include a concise explanation.
- For non-assessment questions, "correctAnswers" must be an empty array and "explanation" must be an empty string.
- Use Markdown only when it improves clarity.
- Return only valid JSON.

Return this exact JSON shape:
{
  "questions": [
    {
      "text": "Question prompt",
      "type": "multiple_choice | short_text | rating",
      "options": ["Option A", "Option B"],
      "purpose": "${purpose}",
      "correctAnswers": ["Correct option text"],
      "explanation": "Why the answer is correct",
      "revealMode": "${purpose === "assessment" ? "after_submission" : "never"}"
    }
  ]
}
`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!text) {
            throw new Error("No response from AI");
        }

        const parsed = parseModelJson(text);
        const rawQuestions = Array.isArray(parsed.questions)
            ? parsed.questions
            : Array.isArray(parsed)
                ? parsed
                : [];

        if (!rawQuestions.length) {
            throw new Error("AI returned no questions");
        }

        return NextResponse.json({
            questions: normalizeQuestions(rawQuestions, purpose, requestedType)
        });
    } catch (error) {
        console.error("AI Draft Error:", error);
        return NextResponse.json({ error: "Failed to generate draft" }, { status: 500 });
    }
}
