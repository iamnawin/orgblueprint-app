import { NextRequest, NextResponse } from "next/server";
import { getNextQuestion, getNextQuestionGemini } from "@/lib/anthropic";

export async function POST(req: NextRequest) {
  const hasAnthropic = !!process.env.ANTHROPIC_API_KEY;
  const hasGemini = !!process.env.GEMINI_API_KEY;

  if (!hasAnthropic && !hasGemini) {
    return NextResponse.json({ question: null, error: "no_api_key" });
  }

  try {
    const { needText, answered } = await req.json();
    let question: string | null;
    let provider: string;

    if (hasAnthropic) {
      question = await getNextQuestion(needText, answered ?? {});
      provider = "anthropic";
    } else {
      question = await getNextQuestionGemini(needText, answered ?? {});
      provider = "gemini";
    }

    return NextResponse.json({ question, provider });
  } catch (e) {
    console.error("Conversation error:", e);
    return NextResponse.json({ question: null, error: "llm_error" });
  }
}
