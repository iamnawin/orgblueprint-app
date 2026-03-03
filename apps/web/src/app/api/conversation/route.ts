import { NextRequest, NextResponse } from "next/server";
import { getNextQuestion } from "@/lib/anthropic";

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ question: null, error: "no_api_key" });
  }

  try {
    const { needText, answered } = await req.json();
    const question = await getNextQuestion(needText, answered ?? {});
    return NextResponse.json({ question });
  } catch (e) {
    console.error("Conversation error:", e);
    return NextResponse.json({ question: null, error: "llm_error" });
  }
}
