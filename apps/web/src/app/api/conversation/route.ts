import { NextRequest, NextResponse } from "next/server";
import { getNextQuestion, getNextQuestionGemini, getNextQuestionGroq } from "@/lib/anthropic";

function buildFallbackQuestion(
  needText: string,
  answered: Record<string, string>
): string | null {
  const answeredCount = Object.keys(answered).length;
  if (answeredCount >= 5) return null;

  const text = needText.toLowerCase();

  if (!/(health|finance|bank|insurance|manufacturing|education|nonprofit|retail|saas|software)/.test(text)) {
    return "What industry are you in, and are there any compliance or regulatory requirements we should account for?";
  }

  if (!/(integrat|erp|ehr|sap|netsuite|workday|api|sync)/.test(text)) {
    return "What existing systems need to integrate with your CRM, and how critical is real-time sync versus scheduled updates?";
  }

  if (!/(user|rep|agent|team|seat|employee|people)/.test(text)) {
    return "Roughly how many users will need access, and which teams will use the system first?";
  }

  return "What is the single most important business outcome you want this CRM implementation to improve in the first 6 months?";
}

export async function POST(req: NextRequest) {
  const hasAnthropic = !!process.env.ANTHROPIC_API_KEY;
  const hasGemini = !!process.env.GEMINI_API_KEY;
  const hasGroq = !!process.env.GROQ_API_KEY;

  if (!hasAnthropic && !hasGemini && !hasGroq) {
    return NextResponse.json({ question: null, error: "no_api_key" });
  }

  const body = await req.json().catch(() => ({ needText: "", answered: {} as Record<string, string> }));
  const needText = body.needText ?? "";
  const answeredMap = body.answered ?? {};

  try {
    let question: string | null;
    let provider: string;

    if (hasAnthropic) {
      question = await getNextQuestion(needText, answeredMap);
      provider = "anthropic";
    } else if (hasGemini) {
      question = await getNextQuestionGemini(needText, answeredMap);
      provider = "gemini";
    } else {
      question = await getNextQuestionGroq(needText, answeredMap);
      provider = "groq";
    }

    if (!question) {
      const fallbackQuestion = buildFallbackQuestion(needText, answeredMap);
      if (fallbackQuestion) {
        return NextResponse.json({ question: fallbackQuestion, provider: "fallback" });
      }
    }

    return NextResponse.json({ question, provider });
  } catch (e) {
    console.error("Conversation error:", e);
    const fallbackQuestion = buildFallbackQuestion(needText, answeredMap);
    if (fallbackQuestion) {
      return NextResponse.json({ question: fallbackQuestion, provider: "fallback", error: "llm_error" });
    }
    return NextResponse.json({ question: null, error: "llm_error" });
  }
}
