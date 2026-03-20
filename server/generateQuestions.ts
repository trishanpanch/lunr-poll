import { Router, Request, Response } from "express";
import { invokeLLM } from "./_core/llm";

const router = Router();

const QUESTION_TYPES = ["Short Text", "Multiple Choice", "True / False", "Star Rating", "File Upload"] as const;
type QuestionType = typeof QUESTION_TYPES[number];

interface GenerateRequest {
  content: string;
  count: number;
  types: QuestionType[];
}

interface GeneratedQuestion {
  type: QuestionType;
  text: string;
  options?: string[];
  correctAnswer?: string;
  modelAnswer?: string;
}

router.post("/api/generate-questions", async (req: Request, res: Response) => {
  const { content, count, types } = req.body as GenerateRequest;

  if (!content || typeof content !== "string" || content.trim().length === 0) {
    return res.status(400).json({ error: "content is required" });
  }
  if (!count || typeof count !== "number" || count < 1 || count > 20) {
    return res.status(400).json({ error: "count must be between 1 and 20" });
  }
  if (!types || !Array.isArray(types) || types.length === 0) {
    return res.status(400).json({ error: "types array is required" });
  }

  // Build a distribution plan — spread selected types evenly across the count
  const typePlan: QuestionType[] = [];
  for (let i = 0; i < count; i++) {
    typePlan.push(types[i % types.length]);
  }

  const typeInstructions = typePlan
    .map((t, i) => {
      if (t === "Multiple Choice")
        return `Question ${i + 1}: type "Multiple Choice" — provide exactly 4 answer options ("options" array), mark the correct one in "correctAnswer" (must match one option exactly)`;
      if (t === "True / False")
        return `Question ${i + 1}: type "True / False" — "correctAnswer" must be exactly "True" or "False"`;
      if (t === "Star Rating")
        return `Question ${i + 1}: type "Star Rating" — ask students to rate something specific from the content on a 1–5 scale`;
      if (t === "File Upload")
        return `Question ${i + 1}: type "File Upload" — ask students to upload something directly related to the content`;
      return `Question ${i + 1}: type "Short Text" — open-ended question requiring a written answer grounded in the content`;
    })
    .join("\n");

  const systemPrompt = `You are an expert educator who creates precise, content-specific classroom questions.
Your job: read the provided source material and extract ${count} specific knowledge atoms — concrete facts, definitions, relationships, or claims — then turn each into a question.

CRITICAL RULES:
- Every question MUST reference specific names, numbers, terms, or claims from the source material. Never write generic questions like "What was the main takeaway?" or "Summarize today's content."
- If the text mentions a specific person, date, formula, law, or term — use it in the question.
- Multiple Choice: the 3 wrong options must be plausible but clearly incorrect based on the text.
- True / False: the statement must be directly verifiable from the text (not opinion).
- Return ONLY a valid JSON array. No markdown, no explanation, no code fences.
- For Short Text questions, include a "modelAnswer" field with a concise ideal answer (1–3 sentences) grounded in the source material.

JSON schema for each item:
{ "type": "Short Text" | "Multiple Choice" | "True / False" | "Star Rating" | "File Upload", "text": "question text", "options": ["A","B","C","D"] (Multiple Choice only), "correctAnswer": "string" (Multiple Choice and True/False only), "modelAnswer": "string" (Short Text only) }`;

  const userPrompt = `Source material:
---
${content.slice(0, 8000)}
---

Generate exactly ${count} questions following this plan:
${typeInstructions}

Return ONLY the JSON array.`;

  try {
    const result = await invokeLLM({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      maxTokens: 2000,
    });

    const raw: string =
      (result.choices?.[0]?.message?.content as string) ?? "";

    // Strip any accidental markdown code fences
    const cleaned = raw
      .replace(/^```[\w]*\n?/m, "")
      .replace(/\n?```$/m, "")
      .trim();

    const parsed: GeneratedQuestion[] = JSON.parse(cleaned);

    if (!Array.isArray(parsed) || parsed.length === 0) {
      return res.status(500).json({ error: "No questions returned from model" });
    }

    return res.json({ questions: parsed });
  } catch (err) {
    console.error("[generate-questions] error:", err);
    return res
      .status(500)
      .json({ error: "Generation failed", detail: String(err) });
  }
});

export default router;
