import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";
import Groq from "groq-sdk";
import { BlueprintResult } from "@orgblueprint/core";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY ?? "" });
const NVIDIA_BASE_URL = "https://integrate.api.nvidia.com/v1/chat/completions";
const NVIDIA_MODEL = "minimaxai/minimax-m2.5";

// ─── Gemini helpers ───────────────────────────────────────────────────────────
function geminiClient() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;
  return new GoogleGenerativeAI(key);
}

async function geminiGenerate(prompt: string, systemHint: string): Promise<string> {
  const g = geminiClient();
  if (!g) throw new Error("no_gemini_key");
  const model = g.getGenerativeModel({
    model: "gemini-2.0-flash",
    systemInstruction: systemHint,
  });
  const result = await model.generateContent(prompt);
  return result.response.text().trim();
}

// ─── Groq helpers ─────────────────────────────────────────────────────────────
async function groqGenerate(prompt: string, systemHint: string, maxTokens = 4096): Promise<string> {
  const key = process.env.GROQ_API_KEY;
  if (!key) throw new Error("no_groq_key");
  const groq = new Groq({ apiKey: key });
  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    max_tokens: maxTokens,
    messages: [
      { role: "system", content: systemHint },
      { role: "user", content: prompt },
    ],
  });
  return (completion.choices[0]?.message?.content ?? "").trim();
}

async function nvidiaGenerate(prompt: string, systemHint: string, maxTokens = 4096): Promise<string> {
  const key = process.env.NVIDIA_API_KEY;
  if (!key) throw new Error("no_nvidia_key");

  const response = await fetch(NVIDIA_BASE_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: NVIDIA_MODEL,
      messages: [
        { role: "system", content: systemHint },
        { role: "user", content: prompt },
      ],
      temperature: 0.2,
      top_p: 0.9,
      max_tokens: maxTokens,
      stream: false,
    }),
  });

  if (!response.ok) {
    throw new Error(`nvidia_error_${response.status}`);
  }

  const data = (await response.json()) as { choices?: { message?: { content?: string } }[] };
  return (data.choices?.[0]?.message?.content ?? "").trim();
}

const ARCHITECT_SYSTEM = `You are a senior Salesforce solution architect with 15+ years of experience.
Your role is to help businesses understand which Salesforce products they need and how to implement them.
Always be practical, direct, and honest about what's needed vs what's nice-to-have.

Guardrails you MUST follow:
- Data Cloud: ONLY recommended when there are 2+ external system integrations, OR explicit single-customer-view/segmentation needs.
- Agentforce/Einstein: NEVER "recommended" level — maximum "optional" — and only when AI automation intent is explicit.
- MuleSoft: NEVER "recommended" — maximum "optional". Only when 3+ external system integrations or explicit API management need.
- Net Zero Cloud: NEVER "recommended" — maximum "optional". Only when explicit sustainability/ESG mandate exists.
- Salesforce Shield: maximum "optional". Only for regulated industries or explicit compliance/encryption requirements.
- Industry Clouds (Health, Financial Services, Nonprofit, Manufacturing, Education): ONLY recommend the cloud matching the customer's industry vertical. Never recommend multiple industry clouds unless the customer explicitly operates in multiple verticals.
- Marketing Cloud (B2C) vs Marketing Cloud Account Engagement/Pardot (B2B): Marketing Cloud is for B2C consumer journeys. Pardot is for B2B lead nurture. Do not recommend both unless explicitly needed.
- Never output official Salesforce pricing. Cost estimates are directional only and must always include the disclaimer.
- Prefer standard objects over custom. Prefer configuration over code. Prefer Flows over Apex.`;

function sanitizeQuestionText(raw: string): string | null {
  const withoutThink = raw.replace(/<think>[\s\S]*?<\/think>/gi, " ");
  const normalized = withoutThink
    .replace(/^```(?:text|markdown)?/i, "")
    .replace(/```$/i, "")
    .replace(/\r/g, "")
    .trim();

  if (!normalized) return null;

  const lines = normalized
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.replace(/^(question|clarifying question)[:\-]\s*/i, ""));

  const questionLine = lines.find((line) => line.includes("?"));
  if (questionLine) {
    return questionLine;
  }

  return lines[0] ?? null;
}

function buildQuestionPrompt(
  needText: string,
  askedCount: number,
  answeredSummary: string,
  askedQuestions: string[]
): string {
  const askedSummary = askedQuestions.length
    ? askedQuestions.map((q, idx) => `${idx + 1}. ${q}`).join("\n")
    : "";

  return `A customer described their business needs as:
"${needText}"

${answeredSummary ? `We already have these answers:\n${answeredSummary}\n\n` : ""}${askedSummary ? `Questions already asked (do NOT repeat or paraphrase these):\n${askedSummary}\n\n` : ""}Based on what you know, what is the SINGLE most important clarifying question you would ask to significantly improve the Salesforce product recommendation?

Focus on questions that reveal: industry vertical, team size, existing systems, specific pain points, or whether they need marketing/commerce/collaboration capabilities.

Rules:
- NEVER repeat a question that has already been asked.
- If the user already answered industry, do not ask industry again.
- Ask only one short, concrete question.
- DO NOT reveal reasoning, analysis, chain-of-thought, or internal notes.
- DO NOT use <think> tags.
- Output only the final user-facing question.

If you already have enough information to produce a solid blueprint (you have ${askedCount} asked questions already), respond with exactly: DONE

Otherwise respond with just the question text, nothing else.`;
}

export async function getNextQuestion(
  needText: string,
  answered: Record<string, string>,
  askedQuestions: string[] = []
): Promise<string | null> {
  const askedCount = askedQuestions.length;
  if (askedCount >= 5) return null;

  const answeredSummary = Object.entries(answered)
    .map(([q, a]) => `Q: ${q}\nA: ${a}`)
    .join("\n\n");

  const prompt = buildQuestionPrompt(needText, askedCount, answeredSummary, askedQuestions);

  // Try Anthropic first
  if (process.env.ANTHROPIC_API_KEY) {
    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 256,
      system: ARCHITECT_SYSTEM,
      messages: [{ role: "user", content: prompt }],
    });
    const text = sanitizeQuestionText((response.content[0] as { text: string }).text.trim());
    if (!text || text === "DONE" || text.toUpperCase().startsWith("DONE")) return null;
    return text;
  }

  // Fallback to Gemini
  if (process.env.GEMINI_API_KEY) {
    const text = sanitizeQuestionText(await geminiGenerate(prompt, ARCHITECT_SYSTEM));
    if (!text || text === "DONE" || text.toUpperCase().startsWith("DONE")) return null;
    return text;
  }

  // Fallback to Groq
  const text = sanitizeQuestionText(await groqGenerate(prompt, ARCHITECT_SYSTEM, 256));
  if (!text || text === "DONE" || text.toUpperCase().startsWith("DONE")) return null;
  return text;
}

export async function getNextQuestionGemini(
  needText: string,
  answered: Record<string, string>,
  askedQuestions: string[] = []
): Promise<string | null> {
  const askedCount = askedQuestions.length;
  if (askedCount >= 5) return null;
  const answeredSummary = Object.entries(answered)
    .map(([q, a]) => `Q: ${q}\nA: ${a}`)
    .join("\n\n");
  const prompt = buildQuestionPrompt(needText, askedCount, answeredSummary, askedQuestions);
  const text = sanitizeQuestionText(await geminiGenerate(prompt, ARCHITECT_SYSTEM));
  if (!text || text === "DONE" || text.toUpperCase().startsWith("DONE")) return null;
  return text;
}

export async function getNextQuestionNvidia(
  needText: string,
  answered: Record<string, string>,
  askedQuestions: string[] = []
): Promise<string | null> {
  const askedCount = askedQuestions.length;
  if (askedCount >= 5) return null;
  const answeredSummary = Object.entries(answered)
    .map(([q, a]) => `Q: ${q}\nA: ${a}`)
    .join("\n\n");
  const prompt = buildQuestionPrompt(needText, askedCount, answeredSummary, askedQuestions);
  const text = sanitizeQuestionText(await nvidiaGenerate(prompt, ARCHITECT_SYSTEM, 256));
  if (!text || text === "DONE" || text.toUpperCase().startsWith("DONE")) return null;
  return text;
}

export async function generateBlueprintFromLLM(
  needText: string,
  answers: Record<string, string>
): Promise<BlueprintResult> {
  const answeredSummary = Object.entries(answers)
    .map(([q, a]) => `Q: ${q}\nA: ${a}`)
    .join("\n\n");

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4096,
    system: ARCHITECT_SYSTEM,
    messages: [{ role: "user", content: BLUEPRINT_PROMPT(needText, answeredSummary) }],
  });

  const text = (response.content[0] as { text: string }).text.trim();
  return parseBlueprintJson(text);
}

const BLUEPRINT_PROMPT = (needText: string, answeredSummary: string) => `Generate a complete Salesforce implementation blueprint for this customer.

Business needs: "${needText}"

${answeredSummary ? `Clarifications:\n${answeredSummary}` : ""}

Return ONLY valid JSON matching this exact TypeScript interface (no markdown, no explanation):

{
  "executiveSnapshot": string[],
  "products": [
    {
      "key": "sales_cloud" | "service_cloud" | "experience_cloud" | "field_service" | "cpq_revenue" |
             "marketing_cloud" | "pardot" | "loyalty_management" | "commerce_cloud" |
             "data_cloud" | "agentforce_einstein" | "tableau_analytics" |
             "mulesoft" | "slack_collab" | "salesforce_shield" |
             "health_cloud" | "financial_services_cloud" | "nonprofit_cloud" |
             "manufacturing_cloud" | "education_cloud" | "net_zero_cloud",
      "name": string,
      "level": "recommended" | "optional" | "not_needed",
      "reasons": string[]
    }
  ],
  "whyMapping": [{ "need": string, "product": string, "why": string }],
  "ootbVsCustom": [{ "capability": string, "approach": "OOTB" | "Config" | "Custom", "notes": string }],
  "objectsAndAutomations": string[],
  "integrationMap": string[],
  "analyticsPack": string[],
  "costSimulator": {
    "range": string,
    "assumptions": string[],
    "disclaimer": "Directional estimate only. This is not official Salesforce pricing or a quote."
  },
  "roadmap": [{ "phase": string, "outcomes": string[] }],
  "documentChecklist": string[],
  "risks": string[],
  "confidenceScore": number
}

Include recommended and optional products. Omit not_needed products for brevity. confidenceScore: 55-90.`;

function parseBlueprintJson(raw: string): BlueprintResult {
  const json = raw.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
  const parsed = JSON.parse(json) as BlueprintResult;
  const validKeys = new Set([
    "sales_cloud", "service_cloud", "experience_cloud", "field_service", "cpq_revenue",
    "marketing_cloud", "pardot", "loyalty_management", "commerce_cloud",
    "data_cloud", "agentforce_einstein", "tableau_analytics",
    "mulesoft", "slack_collab", "salesforce_shield",
    "health_cloud", "financial_services_cloud", "nonprofit_cloud",
    "manufacturing_cloud", "education_cloud", "net_zero_cloud",
  ]);
  parsed.products = parsed.products.filter((p) => validKeys.has(p.key));
  return parsed;
}

export async function generateBlueprintFromGemini(
  needText: string,
  answers: Record<string, string>
): Promise<BlueprintResult> {
  const answeredSummary = Object.entries(answers)
    .map(([q, a]) => `Q: ${q}\nA: ${a}`)
    .join("\n\n");
  const text = await geminiGenerate(BLUEPRINT_PROMPT(needText, answeredSummary), ARCHITECT_SYSTEM);
  return parseBlueprintJson(text);
}

export async function generateBlueprintFromNvidia(
  needText: string,
  answers: Record<string, string>
): Promise<BlueprintResult> {
  const answeredSummary = Object.entries(answers)
    .map(([q, a]) => `Q: ${q}\nA: ${a}`)
    .join("\n\n");
  const text = await nvidiaGenerate(BLUEPRINT_PROMPT(needText, answeredSummary), ARCHITECT_SYSTEM);
  return parseBlueprintJson(text);
}

export async function getNextQuestionGroq(
  needText: string,
  answered: Record<string, string>,
  askedQuestions: string[] = []
): Promise<string | null> {
  const askedCount = askedQuestions.length;
  if (askedCount >= 5) return null;
  const answeredSummary = Object.entries(answered)
    .map(([q, a]) => `Q: ${q}\nA: ${a}`)
    .join("\n\n");
  const prompt = buildQuestionPrompt(needText, askedCount, answeredSummary, askedQuestions);
  const text = sanitizeQuestionText(await groqGenerate(prompt, ARCHITECT_SYSTEM, 256));
  if (!text || text === "DONE" || text.toUpperCase().startsWith("DONE")) return null;
  return text;
}

export async function generateBlueprintFromGroq(
  needText: string,
  answers: Record<string, string>
): Promise<BlueprintResult> {
  const answeredSummary = Object.entries(answers)
    .map(([q, a]) => `Q: ${q}\nA: ${a}`)
    .join("\n\n");
  const text = await groqGenerate(BLUEPRINT_PROMPT(needText, answeredSummary), ARCHITECT_SYSTEM);
  return parseBlueprintJson(text);
}
