import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

const OPTION_PROMPTS: Record<string, string> = {
  architecture: `You are a senior Salesforce Solution Architect. Based on the blueprint summary, provide 5-7 specific architectural improvement recommendations. Cover:
- Platform scalability and governor limit planning
- Data model and object relationship optimisations
- Security and governance best practices
- Technical debt prevention strategies
- Org design decisions (sandbox strategy, DevOps)

Format as a numbered list. Be concise and specific — each item should be actionable.`,

  ai: `You are a senior Salesforce AI specialist. Based on the blueprint summary, recommend 5-6 specific AI and automation use cases using Einstein and Agentforce. For each:
- Name the capability (e.g. Einstein Case Classification, Agentforce SDR Agent)
- State the business outcome
- Describe the implementation approach in 1-2 sentences

Format as a numbered list. Focus only on capabilities relevant to the products listed.`,

  integrations: `You are a senior Salesforce integration architect. Based on the blueprint summary, provide a detailed integration strategy. Include:
- Recommended integration patterns (REST, Batch, Event-driven, Streaming)
- API design principles and error handling
- Named Credentials and OAuth setup guidance
- Specific integration recommendations for the detected product set
- Monitoring and observability recommendations

Format as a numbered list.`,

  reporting: `You are a senior Salesforce analytics specialist. Based on the blueprint summary, recommend a complete reporting strategy. Include:
- Top 5 dashboards to build first, with specific KPIs per dashboard
- Reports by user persona (executive, manager, frontline)
- Einstein Analytics or Tableau recommendations if applicable
- Data quality metrics to track
- Report scheduling and distribution strategy

Format as a numbered list organised by persona/theme.`,
};

export async function POST(req: NextRequest) {
  try {
    const { option, blueprintSummary } = (await req.json()) as {
      option: string;
      blueprintSummary: string;
    };

    const systemPrompt = OPTION_PROMPTS[option];
    if (!systemPrompt) {
      return NextResponse.json({ error: "Invalid option" }, { status: 400 });
    }

    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 900,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: `Blueprint summary:\n${blueprintSummary}\n\nProvide your recommendations now.`,
        },
      ],
    });

    const content =
      response.content[0].type === "text" ? response.content[0].text : "";
    return NextResponse.json({ content });
  } catch {
    return NextResponse.json({
      content:
        "Unable to generate recommendations at this time. Please try again.",
    });
  }
}
