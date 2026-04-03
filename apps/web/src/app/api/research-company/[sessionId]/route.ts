import { NextRequest, NextResponse } from "next/server";

const BU_BASE = "https://api.browser-use.com/api/v3";

interface BUSession {
  id: string;
  status: "running" | "idle" | "stopped" | "error";
  output?: string;
  live_url?: string;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  const key = process.env.BROWSER_USE_API_KEY;
  if (!key) {
    return NextResponse.json({ error: "BROWSER_USE_API_KEY not configured" }, { status: 503 });
  }

  try {
    const res = await fetch(`${BU_BASE}/sessions/${params.sessionId}`, {
      headers: { "X-Browser-Use-API-Key": key },
    });

    if (!res.ok) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const session = await res.json() as BUSession;
    const done = session.status === "idle" || session.status === "stopped" || session.status === "error";

    // Try to parse JSON from the output, fall back to raw string
    let parsed: Record<string, unknown> | null = null;
    if (done && session.output) {
      try {
        const match = session.output.match(/\{[\s\S]*\}/);
        if (match) parsed = JSON.parse(match[0]) as Record<string, unknown>;
      } catch {
        // non-JSON output — pass through as-is
      }
    }

    return NextResponse.json({
      status: session.status,
      done,
      output: session.output ?? null,
      parsed,
      liveUrl: session.live_url ?? null,
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch session" }, { status: 500 });
  }
}
