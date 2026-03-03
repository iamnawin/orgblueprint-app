import Anthropic from "@anthropic-ai/sdk";
import { BlueprintResult } from "@orgblueprint/core";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY ?? "" });

const ARCHITECT_SYSTEM = `You are a senior Salesforce solution architect with 15+ years of experience.
Your role is to help businesses understand which Salesforce products they need and how to implement them.
Always be practical, direct, and honest about what's needed vs what's nice-to-have.
Guardrails you must follow:
- Data Cloud is ONLY recommended when there are 2+ external system integrations, or explicit single-customer-view/segmentation needs.
- Agentforce/Einstein is NEVER "recommended" level — maximum "optional" — and only when AI automation intent is explicit.
- Never output official Salesforce pricing. Cost estimates are directional only and must include a disclaimer.
- Prefer standard objects over custom. Prefer configuration over code.`;

export async function getNextQuestion(
  needText: string,
  answered: Record<string, string>
): Promise<string | null> {
  const answeredCount = Object.keys(answered).length;
  if (answeredCount >= 5) return null;

  const answeredSummary = Object.entries(answered)
    .map(([q, a]) => `Q: ${q}\nA: ${a}`)
    .join("\n\n");

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 256,
    system: ARCHITECT_SYSTEM,
    messages: [
      {
        role: "user",
        content: `A customer described their business needs as:
"${needText}"

${answeredCount > 0 ? `We already have these answers:\n${answeredSummary}\n\n` : ""}Based on what you know, what is the SINGLE most important clarifying question you would ask to improve the Salesforce recommendation?

If you already have enough information to produce a solid blueprint (you have answered ${answeredCount} questions), respond with exactly: DONE

Otherwise respond with just the question text, nothing else.`,
      },
    ],
  });

  const text = (response.content[0] as { text: string }).text.trim();
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
    messages: [
      {
        role: "user",
        content: `Generate a complete Salesforce implementation blueprint for this customer.

Business needs: "${needText}"

${answeredSummary ? `Clarifications:\n${answeredSummary}` : ""}

Return ONLY valid JSON matching this exact TypeScript interface (no markdown, no explanation):

{
  "executiveSnapshot": string[],           // 3-5 bullet point summary
  "products": [                            // all 7 products must appear
    {
      "key": "sales_cloud" | "service_cloud" | "experience_cloud" | "field_service" | "cpq_revenue" | "data_cloud" | "agentforce_einstein",
      "name": string,
      "level": "recommended" | "optional" | "not_needed",
      "reasons": string[]                  // 1-3 reasons
    }
  ],
  "whyMapping": [{ "need": string, "product": string, "why": string }],
  "ootbVsCustom": [{ "capability": string, "approach": "OOTB" | "Config" | "Custom", "notes": string }],
  "objectsAndAutomations": string[],
  "integrationMap": string[],
  "analyticsPack": string[],
  "costSimulator": {
    "range": string,                       // e.g. "$40k - $150k year-1"
    "assumptions": string[],
    "disclaimer": "Directional estimate only. This is not official Salesforce pricing or a quote."
  },
  "roadmap": [{ "phase": string, "outcomes": string[] }],
  "documentChecklist": string[],
  "risks": string[],
  "confidenceScore": number                // 55-90
}`,
      },
    ],
  });

  const text = (response.content[0] as { text: string }).text.trim();
  // Strip markdown code fences if present
  const json = text.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
  return JSON.parse(json) as BlueprintResult;
}
