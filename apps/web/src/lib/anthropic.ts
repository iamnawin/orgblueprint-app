import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { BlueprintResult } from "@orgblueprint/core";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY ?? "" });

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

function buildQuestionPrompt(needText: string, answeredCount: number, answeredSummary: string): string {
  return `A customer described their business needs as:
"${needText}"

${answeredCount > 0 ? `We already have these answers:\n${answeredSummary}\n\n` : ""}Based on what you know, what is the SINGLE most important clarifying question you would ask to significantly improve the Salesforce product recommendation?

Focus on questions that reveal: industry vertical, team size, existing systems, specific pain points, or whether they need marketing/commerce/collaboration capabilities.

If you already have enough information to produce a solid blueprint (you have ${answeredCount} answers already), respond with exactly: DONE

Otherwise respond with just the question text, nothing else.`;
}

export async function getNextQuestion(
  needText: string,
  answered: Record<string, string>
): Promise<string | null> {
  const answeredCount = Object.keys(answered).length;
  if (answeredCount >= 5) return null;

  const answeredSummary = Object.entries(answered)
    .map(([q, a]) => `Q: ${q}\nA: ${a}`)
    .join("\n\n");

  const prompt = buildQuestionPrompt(needText, answeredCount, answeredSummary);

  // Try Anthropic first
  if (process.env.ANTHROPIC_API_KEY) {
    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 256,
      system: ARCHITECT_SYSTEM,
      messages: [{ role: "user", content: prompt }],
    });
    const text = (response.content[0] as { text: string }).text.trim();
    if (text === "DONE" || text.toUpperCase().startsWith("DONE")) return null;
    return text;
  }

  // Fallback to Gemini
  const text = await geminiGenerate(prompt, ARCHITECT_SYSTEM);
  if (text === "DONE" || text.toUpperCase().startsWith("DONE")) return null;
  return text;
}

export async function getNextQuestionGemini(
  needText: string,
  answered: Record<string, string>
): Promise<string | null> {
  const answeredCount = Object.keys(answered).length;
  if (answeredCount >= 5) return null;
  const answeredSummary = Object.entries(answered)
    .map(([q, a]) => `Q: ${q}\nA: ${a}`)
    .join("\n\n");
  const prompt = buildQuestionPrompt(needText, answeredCount, answeredSummary);
  const text = await geminiGenerate(prompt, ARCHITECT_SYSTEM);
  if (text === "DONE" || text.toUpperCase().startsWith("DONE")) return null;
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
