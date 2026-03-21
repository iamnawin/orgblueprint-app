import { NextRequest, NextResponse } from "next/server";
import { getNextQuestionConversational, ConversationTurn } from "@/lib/anthropic";

// ── Deterministic fallback (used only when all AI providers fail) ──────────────
function normalizeText(text: string): string {
  return text.toLowerCase().replace(/\s+/g, " ").trim();
}

function buildCorpus(needText: string, history: ConversationTurn[]): string {
  return normalizeText(
    [
      needText,
      ...history.flatMap((t) => [t.question, t.answer]),
    ].join(" ")
  );
}

function nextDeterministicQuestion(
  needText: string,
  history: ConversationTurn[]
): string | null {
  if (history.length >= 5) return null;

  const corpus = buildCorpus(needText, history);
  const askedSet = new Set(history.map((t) => normalizeText(t.question)));

  const candidates = [
    {
      when: !/(health|healthcare|medical|finance|financial|bank|insurance|manufacturing|education|nonprofit|retail|saas|real estate|logistics|construction|consulting)/.test(corpus),
      question: "What industry are you in, and are there any compliance requirements we should know about?",
    },
    {
      when: !/(user|users|rep|reps|agent|agents|team|seat|employee|people|headcount)/.test(corpus),
      question: "Roughly how many people will use this system, and which teams will be on it first?",
    },
    {
      when: !/(integrat|erp|ehr|sap|netsuite|workday|api|sync|database|billing|portal)/.test(corpus),
      question: "Are there any existing systems this needs to connect to — like an ERP, billing platform, or data warehouse?",
    },
    {
      when: !/(manual|spreadsheet|excel|slow|bottleneck|pain|duplicate|visibility|forecast|approval|handoff|follow.up)/.test(corpus),
      question: "What's the biggest manual headache or bottleneck you're hoping to solve first?",
    },
    {
      when: !/(month|quarter|timeline|go.live|deadline|target|outcome|goal|improve|reduce|increase|kpi|metric)/.test(corpus),
      question: "What does success look like 6 months after go-live — what's the one metric you'd most want to see move?",
    },
  ];

  for (const c of candidates) {
    if (c.when && !askedSet.has(normalizeText(c.question))) {
      return c.question;
    }
  }

  const fallback = "Is there anything else critical we haven't covered — like approvals, partner portals, quoting, or service SLAs?";
  return askedSet.has(normalizeText(fallback)) ? null : fallback;
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({
    needText: "",
    history: [] as ConversationTurn[],
  }));

  const needText: string = body.needText ?? "";
  // Support both new `history` format and legacy `answered` + `asked` format
  let history: ConversationTurn[] = body.history ?? [];
  if (!history.length && body.asked?.length) {
    const answered: Record<string, string> = body.answered ?? {};
    history = (body.asked as string[]).map((q: string) => ({
      question: q,
      answer: answered[q] ?? "",
    }));
  }

  // Try AI-powered conversational question
  try {
    const question = await getNextQuestionConversational(needText, history);
    if (question !== undefined) {
      return NextResponse.json({ question, provider: "ai" });
    }
  } catch (e) {
    console.error("AI conversation error, falling back to deterministic:", e);
  }

  // Deterministic fallback
  const question = nextDeterministicQuestion(needText, history);
  return NextResponse.json({ question, provider: "rules" });
}
