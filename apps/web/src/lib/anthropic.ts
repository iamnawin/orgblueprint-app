import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";
import Groq from "groq-sdk";
import { BlueprintResult } from "@orgblueprint/core";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY ?? "" });

// ─── OpenRouter helpers ────────────────────────────────────────────────────────
const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1/chat/completions";
const OPENROUTER_MODEL = "meta-llama/llama-3.3-70b-instruct:free";

async function openrouterChat(
  messages: { role: "system" | "user" | "assistant"; content: string }[],
  maxTokens = 512
): Promise<string> {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) throw new Error("no_openrouter_key");

  const response = await fetch(OPENROUTER_BASE_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://orgblueprint.app",
      "X-Title": "OrgBlueprint",
    },
    body: JSON.stringify({
      model: OPENROUTER_MODEL,
      messages,
      max_tokens: maxTokens,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`openrouter_error_${response.status}: ${err}`);
  }

  const data = (await response.json()) as {
    choices?: { message?: { content?: string | null; reasoning?: string } }[];
  };
  const msg = data.choices?.[0]?.message;
  const content = msg?.content?.trim();
  if (content) return content;
  // Thinking models (like Step 3.5 Flash) sometimes return content:null when
  // they exhaust max_tokens during the reasoning phase. Fall back to the last
  // question found in the reasoning field.
  const reasoning = msg?.reasoning?.trim();
  if (reasoning) {
    const sentences = reasoning.split(/(?<=[.?!])\s+/);
    const lastQuestion = [...sentences].reverse().find((s) => s.includes("?"));
    if (lastQuestion) return lastQuestion.trim();
  }
  return "";
}
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
  const withoutThink = raw.replace(/<think>[\s\S]*?(<\/think>|$)/gi, " ");
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

  return null;
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

${answeredSummary ? `Clarifications already collected:\n${answeredSummary}\n\n` : ""}${askedSummary ? `Questions already asked — do NOT repeat or rephrase any of these:\n${askedSummary}\n\n` : ""}Your task: identify the SINGLE most important gap in the information above, then ask ONE concrete question to fill it.

Before choosing a question, mentally check what is ALREADY KNOWN from the description and answers above:
- Is the industry/vertical already mentioned? → do NOT ask about it again.
- Is team size or user count already mentioned? → do NOT ask about it again.
- Are existing systems or integrations already mentioned? → do NOT ask about it again.
- Is the primary pain point already clear? → do NOT ask about it again.

Only ask about something that is genuinely missing and would meaningfully change the Salesforce product recommendation.

Good question areas (pick the most relevant gap only):
- Industry-specific compliance (HIPAA, GDPR, SOX) if regulated industry is hinted but compliance needs are unclear
- Key teams or departments not yet mentioned (sales, service, marketing, partners)
- Existing tech stack or systems that need to integrate
- Whether customers/partners need a self-service portal
- Budget range or timeline if completely unknown and relevant
- Specific pain point driving this project

Rules:
- Ask only ONE short, concrete question — one sentence.
- Make the question clearly relevant to THIS specific customer's description, not generic.
- DO NOT output reasoning, chain-of-thought, or internal notes.
- DO NOT use <think> tags.
- Output only the final question text.

If you already have enough information across the description and ${askedCount} answers to produce a solid blueprint, respond with exactly: DONE

Otherwise respond with just the question, nothing else.`;
}

export async function getNextQuestion(
  needText: string,
  answered: Record<string, string>,
  askedQuestions: string[] = []
): Promise<string | null> {
  const askedCount = askedQuestions.length;
  if (askedCount >= 3) return null;

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
  if (askedCount >= 3) return null;
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
  if (askedCount >= 3) return null;
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
  if (askedCount >= 3) return null;
  const answeredSummary = Object.entries(answered)
    .map(([q, a]) => `Q: ${q}\nA: ${a}`)
    .join("\n\n");
  const prompt = buildQuestionPrompt(needText, askedCount, answeredSummary, askedQuestions);
  const text = sanitizeQuestionText(await groqGenerate(prompt, ARCHITECT_SYSTEM, 256));
  if (!text || text === "DONE" || text.toUpperCase().startsWith("DONE")) return null;
  return text;
}

// ─── Conversational question generation (OpenRouter primary) ──────────────────
// Passes full conversation history as proper messages so the model has real context.
export interface ConversationTurn {
  question: string;
  answer: string;
}

export async function getNextQuestionConversational(
  needText: string,
  history: ConversationTurn[]
): Promise<string | null> {
  if (history.length >= 3) return null;

  const systemPrompt = `You are a friendly, senior Salesforce solution architect doing a discovery call with a prospective client. Your job is to ask SHORT, NATURAL clarifying questions — like a real conversation, not a form.

Rules:
- Ask ONE question at a time. One sentence only.
- Sound human and curious, not robotic or formal.
- Base each question directly on what the client just said — reference their specific words when helpful.
- Never repeat or rephrase something already answered.
- If you have enough context to recommend Salesforce products confidently, respond with exactly: DONE
- Do NOT output reasoning, bullet points, or anything except the question itself.

Guardrails for the final blueprint (keep these in mind when deciding what to ask):
- Data Cloud: only if 2+ external integrations or explicit single-customer-view need.
- Agentforce/Einstein: only if explicit AI automation intent.
- Prefer standard config over custom code.`;

  // Build message history: user description → AI question → user answer → ...
  const messages: { role: "user" | "assistant"; content: string }[] = [
    { role: "user", content: `Here's what we're trying to do: ${needText}` },
  ];

  for (const turn of history) {
    messages.push({ role: "assistant", content: turn.question });
    messages.push({ role: "user", content: turn.answer || "(skipped)" });
  }

  // Try OpenRouter first
  if (process.env.OPENROUTER_API_KEY) {
    try {
      const raw = await openrouterChat(
        [{ role: "system", content: systemPrompt }, ...messages],
        1024
      );
      const text = sanitizeQuestionText(raw);
      if (!text || text.toUpperCase().startsWith("DONE")) return null;
      return text;
    } catch (e) {
      console.error("OpenRouter question failed:", e);
    }
  }

  // Fallback to Anthropic
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      const response = await client.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 256,
        system: systemPrompt,
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
      });
      const text = sanitizeQuestionText((response.content[0] as { text: string }).text.trim());
      if (!text || text.toUpperCase().startsWith("DONE")) return null;
      return text;
    } catch (e) {
      console.error("Anthropic question failed:", e);
    }
  }

  // Fallback to Gemini
  if (process.env.GEMINI_API_KEY) {
    try {
      const askedList = history.map((t) => t.question);
      const answeredMap = Object.fromEntries(history.map((t) => [t.question, t.answer]));
      const prompt = buildQuestionPrompt(needText, history.length, Object.entries(answeredMap).map(([q, a]) => `Q: ${q}\nA: ${a}`).join("\n\n"), askedList);
      const text = sanitizeQuestionText(await geminiGenerate(prompt, ARCHITECT_SYSTEM));
      if (!text || text.toUpperCase().startsWith("DONE")) return null;
      return text;
    } catch (e) {
      console.error("Gemini question failed:", e);
    }
  }

  return null; // all providers failed → UI falls back to deterministic
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
