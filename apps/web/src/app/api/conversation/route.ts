import { NextRequest, NextResponse } from "next/server";
import {
  getNextQuestion,
  getNextQuestionGemini,
  getNextQuestionGroq,
  getNextQuestionNvidia,
} from "@/lib/anthropic";

const QUESTION_TIMEOUT_MS = 12000;

function normalizeText(text: string): string {
  return text.toLowerCase().replace(/\s+/g, " ").trim();
}

async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return await Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`timeout_${ms}`)), ms)
    ),
  ]);
}

function buildFallbackQuestion(
  needText: string,
  answered: Record<string, string>,
  asked: string[]
): string | null {
  const questionCount = asked.length;
  if (questionCount >= 5) return null;

  const askedQuestions = asked.map(normalizeText);
  const corpus = normalizeText(
    [
      needText,
      ...Object.entries(answered).flatMap(([question, answer]) => [question, answer]),
    ].join(" ")
  );

  if (!/(health|healthcare|medical|clinic|hospital|pharma|finance|financial|bank|insurance|manufacturing|education|nonprofit|retail|saas|software)/.test(corpus)) {
    return "What industry are you in, and are there any compliance or regulatory requirements we should account for?";
  }

  if (!/(integrat|erp|ehr|sap|netsuite|workday|api|sync)/.test(corpus)) {
    return "What existing systems need to integrate with your CRM, and how critical is real-time sync versus scheduled updates?";
  }

  if (!/(user|rep|agent|team|seat|employee|people)/.test(corpus)) {
    return "Roughly how many users will need access, and which teams will use the system first?";
  }

  const outcomeQuestion =
    "What is the single most important business outcome you want this CRM implementation to improve in the first 6 months?";
  if (!askedQuestions.includes(normalizeText(outcomeQuestion))) {
    return outcomeQuestion;
  }

  return "What is the biggest manual process or reporting bottleneck you want Orb to eliminate first?";
}

export async function POST(req: NextRequest) {
  const hasAnthropic = !!process.env.ANTHROPIC_API_KEY;
  const hasNvidia = !!process.env.NVIDIA_API_KEY;
  const hasGemini = !!process.env.GEMINI_API_KEY;
  const hasGroq = !!process.env.GROQ_API_KEY;

  if (!hasAnthropic && !hasNvidia && !hasGemini && !hasGroq) {
    return NextResponse.json({ question: null, error: "no_api_key" });
  }

  const body = await req
    .json()
    .catch(() => ({ needText: "", answered: {} as Record<string, string>, asked: [] as string[] }));
  const needText = body.needText ?? "";
  const answeredMap = body.answered ?? {};
  const askedQuestions = body.asked ?? [];

  try {
    let question: string | null;
    let provider: string;

    if (hasAnthropic) {
      question = await withTimeout(
        getNextQuestion(needText, answeredMap, askedQuestions),
        QUESTION_TIMEOUT_MS
      );
      provider = "anthropic";
    } else if (hasNvidia) {
      question = await withTimeout(
        getNextQuestionNvidia(needText, answeredMap, askedQuestions),
        QUESTION_TIMEOUT_MS
      );
      provider = "nvidia";
    } else if (hasGemini) {
      question = await withTimeout(
        getNextQuestionGemini(needText, answeredMap, askedQuestions),
        QUESTION_TIMEOUT_MS
      );
      provider = "gemini";
    } else {
      question = await withTimeout(
        getNextQuestionGroq(needText, answeredMap, askedQuestions),
        QUESTION_TIMEOUT_MS
      );
      provider = "groq";
    }

    const normalizedQuestion = question ? normalizeText(question) : null;
    const duplicateQuestion =
      normalizedQuestion &&
      askedQuestions.some((asked: string) => normalizeText(asked) === normalizedQuestion);

    if (duplicateQuestion) {
      question = null;
    }

    if (!question) {
      const fallbackQuestion = buildFallbackQuestion(needText, answeredMap, askedQuestions);
      if (fallbackQuestion) {
        return NextResponse.json({ question: fallbackQuestion, provider: "fallback" });
      }
    }

    return NextResponse.json({ question, provider });
  } catch (e) {
    console.error("Conversation error:", e);
    const fallbackQuestion = buildFallbackQuestion(needText, answeredMap, askedQuestions);
    if (fallbackQuestion) {
      return NextResponse.json({ question: fallbackQuestion, provider: "fallback", error: "llm_error" });
    }
    return NextResponse.json({ question: null, error: "llm_error" });
  }
}
