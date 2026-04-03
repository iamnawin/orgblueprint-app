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

    return NextResponse.json({
      status: session.status,
      done,
      output: session.output ?? null,
      liveUrl: session.live_url ?? null,
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch session" }, { status: 500 });
  }
}
