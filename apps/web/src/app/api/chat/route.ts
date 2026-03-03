import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY ?? "" });

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({
      reply:
        "AI chat requires an Anthropic API key. Please configure ANTHROPIC_API_KEY in your environment.",
    });
  }

  try {
    const body = await req.json() as {
      messages: { role: "user" | "assistant"; content: string }[];
      blueprintSummary: string;
    };

    const { messages, blueprintSummary } = body;

    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      system: `You are a senior Salesforce solution architect and implementation consultant with 15+ years of experience.
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
Keep responses concise (2-4 paragraphs max) unless the user asks for detail.`,
      messages: messages.slice(-10),
    });

    const reply = (response.content[0] as { text: string }).text;
    return NextResponse.json({ reply });
  } catch (err) {
    console.error("[Chat API] Error:", err);
    return NextResponse.json(
      { reply: "I couldn't process that request. Please try again." },
      { status: 500 }
    );
  }
}
