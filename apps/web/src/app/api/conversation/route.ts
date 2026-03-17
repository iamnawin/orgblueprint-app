import { NextRequest, NextResponse } from "next/server";
import { getNextQuestion, getNextQuestionGemini, getNextQuestionGroq } from "@/lib/anthropic";

export async function POST(req: NextRequest) {
  const hasAnthropic = !!process.env.ANTHROPIC_API_KEY;
  const hasGemini = !!process.env.GEMINI_API_KEY;
  const hasGroq = !!process.env.GROQ_API_KEY;

  if (!hasAnthropic && !hasGemini && !hasGroq) {
    return NextResponse.json({ question: null, error: "no_api_key" });
  }

  try {
    const { needText, answered } = await req.json();
    let question: string | null;
    let provider: string;

    if (hasAnthropic) {
      question = await getNextQuestion(needText, answered ?? {});
      provider = "anthropic";
    } else if (hasGemini) {
      question = await getNextQuestionGemini(needText, answered ?? {});
      provider = "gemini";
    } else {
      question = await getNextQuestionGroq(needText, answered ?? {});
      provider = "groq";
    }

    return NextResponse.json({ question, provider });
  } catch (e) {
    console.error("Conversation error:", e);
    return NextResponse.json({ question: null, error: "llm_error" });
  }
}
