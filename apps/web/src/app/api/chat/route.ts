import { NextRequest, NextResponse } from "next/server";

const BLUEPRINT_SYSTEM = (blueprintSummary: string) => `You are a senior Salesforce solution architect and implementation consultant with 15+ years of experience.
You are reviewing a specific Salesforce blueprint generated for a customer.

BLUEPRINT CONTEXT:
${blueprintSummary}

Your role: answer questions about this blueprint clearly, practically, and helpfully. You can:
- Explain why specific products were recommended or not recommended
- Estimate costs for different configurations or user counts
- Advise on implementation sequence and risks
- Suggest alternatives or additions
- Explain Salesforce product capabilities and differences

Always be direct and practical. Ground your answers in this specific blueprint's context — not generic advice.
Keep responses concise (2-4 paragraphs max) unless the user asks for detail.`;

async function callNvidia(
  messages: { role: "user" | "assistant"; content: string }[],
  system: string
) {
  const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY ?? "";
  if (!NVIDIA_API_KEY) throw new Error("No NVIDIA key");

  const res = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${NVIDIA_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "minimaxai/minimax-m2.5",
      messages: [{ role: "system", content: system }, ...messages.slice(-10)],
      temperature: 0.7,
      top_p: 0.95,
      max_tokens: 1024,
      stream: false,
    }),
  });
  if (!res.ok) throw new Error(`NVIDIA API ${res.status}`);
  const data = await res.json() as { choices?: { message?: { content?: string } }[] };
  return data.choices?.[0]?.message?.content ?? "No response.";
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      messages: { role: "user" | "assistant"; content: string }[];
      blueprintSummary: string;
    };
    const { messages, blueprintSummary } = body;
    const system = BLUEPRINT_SYSTEM(blueprintSummary);

    // Try Anthropic first if API key set
    if (process.env.ANTHROPIC_API_KEY) {
      try {
        const { default: Anthropic } = await import("@anthropic-ai/sdk");
        const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
        const response = await client.messages.create({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 1024,
          system,
          messages: messages.slice(-10),
        });
        const reply = (response.content[0] as { text: string }).text;
        return NextResponse.json({ reply });
      } catch (err) {
        console.error("[Chat API] Anthropic error, falling back to NVIDIA:", err);
      }
    }

    // Fall back to NVIDIA
    const reply = await callNvidia(messages, system);
    return NextResponse.json({ reply });
  } catch (err) {
    console.error("[Chat API] Error:", err);
    return NextResponse.json(
      { reply: "I couldn't process that request. Please try again." },
      { status: 500 }
    );
  }
}
