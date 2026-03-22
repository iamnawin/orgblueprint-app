import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export interface CodeStep {
  number: number;
  title: string;
  description: string;
  language: string;
  code: string;
}

async function generateCodeSteps(
  products: string[],
  automations: { name: string; technology: string; description: string }[],
  context: string
): Promise<CodeStep[]> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("no_gemini_key");

  const g = new GoogleGenerativeAI(key);
  const model = g.getGenerativeModel({
    model: "gemini-2.0-flash",
    systemInstruction: `You are a senior Salesforce developer. Generate concise, production-quality Salesforce implementation code snippets.
Always output valid Apex, Flow metadata XML, or SOQL. Keep each snippet focused and under 40 lines.
Format: Return exactly valid JSON, no markdown fences.`,
  });

  const automationSummary = automations
    .slice(0, 4)
    .map((a) => `- ${a.name} (${a.technology}): ${a.description}`)
    .join("\n");

  const prompt = `Generate 3 implementation steps for a Salesforce org with these products: ${products.join(", ")}.

Key automations to implement:
${automationSummary}

Business context: ${context}

Return ONLY a JSON array (no markdown) with exactly 3 objects:
[
  {
    "number": 1,
    "title": "short step title",
    "description": "1-2 sentence explanation of what this step does and why",
    "language": "apex" | "xml" | "soql",
    "code": "the actual code"
  },
  ...
]

Make each step logically sequential — step 1 foundational, step 2 builds on it, step 3 adds automation/integration.
Use real Salesforce APIs, object names, and best practices.`;

  const result = await model.generateContent(prompt);
  const raw = result.response.text().trim()
    .replace(/^```(?:json)?\n?/, "")
    .replace(/\n?```$/, "");

  return JSON.parse(raw) as CodeStep[];
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const products: string[] = body.products ?? [];
  const automations = body.automations ?? [];
  const context: string = body.context ?? "";

  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json({ error: "no_ai_key" }, { status: 503 });
  }

  try {
    const steps = await generateCodeSteps(products, automations, context);
    return NextResponse.json({ steps });
  } catch (e) {
    console.error("codegen failed:", e);
    return NextResponse.json({ error: "generation_failed" }, { status: 500 });
  }
}
