import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const BU_BASE = "https://api.browser-use.com/api/v3";

const bodySchema = z.object({
  url: z.string().url(),
});

export async function POST(req: NextRequest) {
  const key = process.env.BROWSER_USE_API_KEY;
  if (!key) {
    return NextResponse.json({ error: "BROWSER_USE_API_KEY not configured" }, { status: 503 });
  }

  const parsed = bodySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  const { url } = parsed.data;

  const task = `Visit this business website: ${url}

Your goal is to extract business context that would be useful for planning a Salesforce CRM implementation.

Browse the homepage and any "About", "Products", "Solutions", or "Services" pages you find. Then return ONLY a JSON object with no extra text:

{
  "company_name": "company name here",
  "industry": "industry/sector (e.g. B2B SaaS, Healthcare IT, Industrial Manufacturing)",
  "what_they_sell": "1-2 sentences describing their core product or service",
  "team_size_hint": "any clues about company or team size (e.g. 'startup', '50-200 employees', 'enterprise')",
  "existing_tools": ["any CRM, ERP, or software tools mentioned"],
  "key_processes": ["key business processes relevant to CRM: sales, support, field service, marketing, etc."],
  "description": "A 3-4 sentence natural language description of this company's business needs, written as if a Salesforce architect is summarizing them for a discovery workshop"
}`;

  try {
    const res = await fetch(`${BU_BASE}/sessions`, {
      method: "POST",
      headers: {
        "X-Browser-Use-API-Key": key,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ task }),
    });

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json({ error: `Browser Use error: ${text}` }, { status: res.status });
    }

    const session = await res.json() as { id: string; live_url: string };
    return NextResponse.json({ sessionId: session.id, liveUrl: session.live_url });
  } catch {
    return NextResponse.json({ error: "Failed to start browser session" }, { status: 500 });
  }
}
