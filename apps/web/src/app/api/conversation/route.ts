import { NextRequest, NextResponse } from "next/server";

function normalizeText(text: string): string {
  return text.toLowerCase().replace(/\s+/g, " ").trim();
}

function buildCorpus(needText: string, answered: Record<string, string>): string {
  return normalizeText(
    [
      needText,
      ...Object.entries(answered).flatMap(([question, answer]) => [question, answer]),
    ].join(" ")
  );
}

function hasIndustry(corpus: string): boolean {
  return /(health|healthcare|medical|clinic|hospital|pharma|finance|financial|bank|insurance|manufacturing|education|school|nonprofit|retail|saas|software|real estate|logistics|construction|consulting)/.test(
    corpus
  );
}

function hasUserShape(corpus: string): boolean {
  return /(user|users|rep|reps|agent|agents|team|teams|seat|seats|employee|employees|people|headcount)/.test(
    corpus
  );
}

function hasIntegrations(corpus: string): boolean {
  return /(integrat|erp|ehr|emr|sap|netsuite|workday|api|sync|database|data warehouse|billing system|website|portal)/.test(
    corpus
  );
}

function hasPainPoint(corpus: string): boolean {
  return /(manual|spreadsheet|excel|slow|bottleneck|pain|problem|issue|duplicate|visibility|forecast|report|reporting|approval|routing|handoff|follow-up)/.test(
    corpus
  );
}

function hasTimelineOrOutcome(corpus: string): boolean {
  return /(month|months|quarter|q[1-4]|timeline|go live|golive|deadline|target|outcome|goal|improve|reduce|increase|kpi|metric)/.test(
    corpus
  );
}

function nextDeterministicQuestion(
  needText: string,
  answered: Record<string, string>,
  asked: string[]
): string | null {
  if (asked.length >= 5) return null;

  const corpus = buildCorpus(needText, answered);
  const askedSet = new Set(asked.map(normalizeText));

  const candidates = [
    {
      when: !hasIndustry(corpus),
      question:
        "What industry are you in, and are there any compliance or regulatory requirements we should account for?",
    },
    {
      when: !hasUserShape(corpus),
      question:
        "Roughly how many users will need access, and which teams will use the system first?",
    },
    {
      when: !hasIntegrations(corpus),
      question:
        "What existing systems need to integrate with your CRM, and how critical is real-time sync versus scheduled updates?",
    },
    {
      when: !hasPainPoint(corpus),
      question:
        "What is the biggest manual process or reporting bottleneck you want Orb to eliminate first?",
    },
    {
      when: !hasTimelineOrOutcome(corpus),
      question:
        "What is the single most important business outcome you want this CRM implementation to improve in the first 6 months?",
    },
  ];

  for (const candidate of candidates) {
    const normalized = normalizeText(candidate.question);
    if (candidate.when && !askedSet.has(normalized)) {
      return candidate.question;
    }
  }

  const fallbackQuestion =
    "Is there anything business-critical we have not covered yet, such as approvals, portal access, quoting, service SLAs, or analytics?";

  return askedSet.has(normalizeText(fallbackQuestion)) ? null : fallbackQuestion;
}

export async function POST(req: NextRequest) {
  const body = await req
    .json()
    .catch(() => ({ needText: "", answered: {} as Record<string, string>, asked: [] as string[] }));
  const needText = body.needText ?? "";
  const answeredMap = body.answered ?? {};
  const askedQuestions = body.asked ?? [];

  const question = nextDeterministicQuestion(needText, answeredMap, askedQuestions);
  return NextResponse.json({ question, provider: "rules" });
}
