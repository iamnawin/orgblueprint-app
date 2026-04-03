import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const BU_BASE = "https://api.browser-use.com/api/v3";

const bodySchema = z.object({
  products: z.array(z.string()).min(1),
  needText: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const key = process.env.BROWSER_USE_API_KEY;
  if (!key) {
    return NextResponse.json({ error: "BROWSER_USE_API_KEY not configured" }, { status: 503 });
  }

  const parsed = bodySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { products } = parsed.data;

  const productList = products
    .slice(0, 5) // cap at 5 products to keep session focused
    .map((p) => p.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()))
    .join(", ");

  const task = `You are researching Salesforce products for a CRM implementation consultant.

Products to research: ${productList}

For each product:
1. Visit https://appexchange.salesforce.com and search for the top-rated partner apps that extend this product
2. Note the app name, rating, number of reviews, and what it does in 1 sentence
3. Visit https://help.salesforce.com or https://trailhead.salesforce.com and find any notable recent features or implementation tips

Return a structured summary like this (plain text, no JSON needed):

=== [Product Name] ===
Top AppExchange Apps:
- [App Name] (4.9★, 1,200 reviews) — [one-line description]
- [App Name] (4.7★, 800 reviews) — [one-line description]
Key Implementation Notes:
- [Important tip or recent feature]
- [Another important consideration]

Repeat for each product. Keep it concise and practical for a Salesforce implementation consultant.`;

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
