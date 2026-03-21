import { Router, Request, Response } from "express";
import { invokeLLM } from "./_core/llm";
import * as cheerio from "cheerio";
import multer from "multer";
import { createRequire } from "module";
const _require = createRequire(import.meta.url);
const pdfParse: (buffer: Buffer) => Promise<{ text: string }> = _require("pdf-parse");
import mammoth from "mammoth";

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });

async function fetchUrlText(url: string): Promise<string> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; SessionBuilder/1.0)" },
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) return "";
    const html = await res.text();
    const $ = cheerio.load(html);
    $("script, style, noscript, nav, footer, header, aside, [role=navigation], [role=banner], [role=complementary]").remove();
    const text = $("article").first().text() || $("main").first().text() || $("body").text();
    return text.replace(/\s+/g, " ").trim().slice(0, 6000);
  } catch {
    return "";
  }
}

const router = Router();

const QUESTION_TYPES = ["Short Text", "Multiple Choice", "True / False", "Star Rating", "File Upload"] as const;
type QuestionType = typeof QUESTION_TYPES[number];

interface GenerateRequest {
  content: string;
  count: number;
  types: QuestionType[];
  urls?: string[];
  objectives?: string[];
}

interface GeneratedQuestion {
  type: QuestionType;
  text: string;
  options?: string[];
  correctAnswer?: string;
  modelAnswer?: string;
}

router.post("/api/generate-questions", async (req: Request, res: Response) => {
  const { content, count, types, urls, objectives } = req.body as GenerateRequest;

  if ((!content || content.trim().length === 0) && (!urls || urls.length === 0)) {
    return res.status(400).json({ error: "content or at least one URL is required" });
  }
  if (!count || typeof count !== "number" || count < 1 || count > 20) {
    return res.status(400).json({ error: "count must be between 1 and 20" });
  }
  if (!types || !Array.isArray(types) || types.length === 0) {
    return res.status(400).json({ error: "types array is required" });
  }

  // Fetch URL content server-side and merge with pasted content
  let combinedContent = (content || "").trim();
  if (urls && urls.length > 0) {
    const urlTexts = await Promise.all(urls.map(fetchUrlText));
    const urlContent = urlTexts.filter(Boolean).join("\n\n");
    if (urlContent) {
      combinedContent = combinedContent
        ? combinedContent + "\n\n" + urlContent
        : urlContent;
    }
  }

  if (!combinedContent) {
    return res.status(400).json({ error: "Could not extract any content from the provided sources" });
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

  const objectivesSection = objectives && objectives.length > 0
    ? `\n\nLEARNING OBJECTIVES (prioritise these — every question should help assess whether a student has met at least one objective):\n${objectives.map((o, i) => `${i + 1}. ${o}`).join("\n")}`
    : "";

  const systemPrompt = `You are an expert educator who creates precise, content-specific classroom questions.
Your job: read the provided source material${objectives && objectives.length > 0 ? " and the learning objectives" : ""} and extract ${count} specific knowledge atoms — concrete facts, definitions, relationships, or claims — then turn each into a question.${objectivesSection}

CRITICAL RULES:
- Every question MUST reference specific names, numbers, terms, or claims from the source material. Never write generic questions like "What was the main takeaway?" or "Summarize today's content."
- If learning objectives are provided, prioritise knowledge atoms that directly assess those objectives. Distribute questions across all objectives where possible.
- If the text mentions a specific person, date, formula, law, or term — use it in the question.
- Multiple Choice: the 3 wrong options must be plausible but clearly incorrect based on the text.
- True / False: write a direct declarative statement about the subject matter itself. NEVER say "The article mentions...", "According to the text...", or any meta-reference to a source. The statement must stand alone as a factual claim.
- Return ONLY a valid JSON array. No markdown, no explanation, no code fences.
- For Short Text questions, include a "modelAnswer" field with a concise ideal answer (1–3 sentences) grounded in the source material.

JSON schema for each item:
{ "type": "Short Text" | "Multiple Choice" | "True / False" | "Star Rating" | "File Upload", "text": "question text", "options": ["A","B","C","D"] (Multiple Choice only), "correctAnswer": "string" (Multiple Choice and True/False only), "modelAnswer": "string" (Short Text only) }`;

  const userPrompt = `Source material:
---
${combinedContent.slice(0, 8000)}
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

    // 1. Strip markdown code fences
    let cleaned = raw
      .replace(/^```[\w]*\n?/gm, "")
      .replace(/\n?```/gm, "")
      .trim();

    // 2. Extract the JSON array by finding the outermost [ … ]
    const arrayStart = cleaned.indexOf("[");
    const arrayEnd = cleaned.lastIndexOf("]");
    if (arrayStart !== -1 && arrayEnd !== -1 && arrayEnd > arrayStart) {
      cleaned = cleaned.slice(arrayStart, arrayEnd + 1);
    }

    // 3. Remove trailing commas before ] or } (common LLM mistake)
    cleaned = cleaned.replace(/,\s*([\]\}])/g, "$1");

    let parsed: GeneratedQuestion[];
    try {
      parsed = JSON.parse(cleaned);
    } catch (parseErr) {
      console.error("[generate-questions] JSON parse error, raw response:", raw.slice(0, 500));
      throw parseErr;
    }

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

// ── Transform a single question to a new type ─────────────────────────────
interface TransformRequest {
  text: string;
  fromType: QuestionType;
  toType: QuestionType;
  sourceContext?: string; // original source material for grounding
}

router.post("/api/transform-question", async (req: Request, res: Response) => {
  const { text, fromType, toType, sourceContext } = req.body as TransformRequest;

  if (!text || !toType) {
    return res.status(400).json({ error: "text and toType are required" });
  }

  const contextSection = sourceContext
    ? `\n\nOriginal source material for grounding:\n---\n${sourceContext.slice(0, 4000)}\n---`
    : "";

  let typeInstruction = "";
  if (toType === "Multiple Choice")
    typeInstruction = `Transform it into a Multiple Choice question. Provide exactly 4 answer options in an "options" array. Set "correctAnswer" to the exact text of the correct option.`;
  else if (toType === "True / False")
    typeInstruction = `Transform it into a True / False question. Write a direct declarative statement about the subject matter itself — NEVER phrase it as "The article mentions..." or "According to the text..." or any meta-reference to a source. The statement should be a standalone factual claim that is verifiably true or false based on the content. Set "correctAnswer" to exactly "True" or "False".`;
  else
    typeInstruction = `Transform it into an open-ended Short Text question. Include a "modelAnswer" field with a concise ideal answer (1–3 sentences).`;

  const systemPrompt = `You are an expert educator. You will be given a question and asked to transform it into a different question type while preserving the underlying knowledge atom being tested. Keep the core fact or concept identical — only change the question format.\n\nReturn ONLY a valid JSON object. No markdown, no explanation.\n\nJSON schema: { "text": "question text", "options": ["A","B","C","D"] (Multiple Choice only), "correctAnswer": "string" (Multiple Choice and True/False only), "modelAnswer": "string" (Short Text only) }`;

  const userPrompt = `Original question (${fromType}):\n"${text}"${contextSection}\n\n${typeInstruction}\n\nReturn ONLY the JSON object.`;

  try {
    const result = await invokeLLM({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      maxTokens: 600,
    });

    const raw: string = (result.choices?.[0]?.message?.content as string) ?? "";
    let cleaned = raw.replace(/^```[\w]*\n?/gm, "").replace(/\n?```/gm, "").trim();
    const objStart = cleaned.indexOf("{");
    const objEnd = cleaned.lastIndexOf("}");
    if (objStart !== -1 && objEnd !== -1) cleaned = cleaned.slice(objStart, objEnd + 1);
    cleaned = cleaned.replace(/,\s*([\]\}])/g, "$1");

    const parsed = JSON.parse(cleaned) as GeneratedQuestion;
    return res.json({ question: { ...parsed, type: toType } });
  } catch (err) {
    console.error("[transform-question] error:", err);
    return res.status(500).json({ error: "Transform failed", detail: String(err) });
  }
});

// ── Extract text from an uploaded file ──────────────────────────────────────
router.post("/api/extract-file", upload.single("file"), async (req: Request, res: Response) => {
  const file = (req as any).file as Express.Multer.File | undefined;
  if (!file) return res.status(400).json({ error: "No file uploaded" });

  const mime = file.mimetype;
  const name = file.originalname?.toLowerCase() ?? "";

  try {
    let text = "";

    if (mime === "application/pdf" || name.endsWith(".pdf")) {
      const result = await pdfParse(file.buffer);
      text = result.text;
    } else if (
      mime === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      name.endsWith(".docx")
    ) {
      const result = await mammoth.extractRawText({ buffer: file.buffer });
      text = result.value;
    } else if (mime.startsWith("text/") || name.endsWith(".txt") || name.endsWith(".md")) {
      text = file.buffer.toString("utf-8");
    } else {
      return res.status(400).json({ error: "Unsupported file type. Please upload a PDF, DOCX, or TXT file." });
    }

    // Clean up whitespace
    text = text.replace(/\r\n/g, "\n").replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();

    if (!text) return res.status(422).json({ error: "Could not extract any text from this file" });

    return res.json({ text, filename: file.originalname, size: file.size });
  } catch (err) {
    console.error("[extract-file] error:", err);
    return res.status(500).json({ error: "File extraction failed", detail: String(err) });
  }
});

export default router;
