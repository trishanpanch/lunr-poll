import { NextResponse } from "next/server";
import { VertexAI } from "@google-cloud/vertexai";

export async function POST(req: Request) {
    try {
        const { question, responses } = await req.json();

        const project = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
        if (!project) throw new Error("Missing Project ID");

        const location = "us-central1";
        const vertexAI = new VertexAI({ project, location });
        const model = vertexAI.getGenerativeModel({
            model: "gemini-1.5-pro",
            generationConfig: {
                responseMimeType: "application/json"
            }
        });

        const prompt = `
      You are an expert pedagogical consultant for a Harvard graduate course. Analyze these student responses. Do not summarize; diagnose. Identify misconceptions, consensus, and outliers.
      
      Question: "${question}"
      Student Responses: ${JSON.stringify(responses)}
      
      Output JSON only matching this schema:
      {
        "consensus": "String (1 sentence)",
        "confusion_points": ["String", "String"],
        "outlier_insight": "String (Quote a unique perspective)",
        "recommended_action": "String (Specific 2-minute classroom intervention)"
      }
    `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!text) throw new Error("No response from AI");

        return NextResponse.json(JSON.parse(text));
    } catch (error: any) {
        console.error("AI Error:", error);
        return NextResponse.json({ error: error.message || "Failed to synthesize" }, { status: 500 });
    }
}
