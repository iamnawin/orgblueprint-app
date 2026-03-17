import { BlueprintResult, ClarificationAnswers, generateBlueprint } from "@orgblueprint/core";

type OrbAnswers = Record<string, string>;

const SYSTEM_KEYWORDS = [
  "sap",
  "netsuite",
  "workday",
  "hubspot",
  "marketo",
  "shopify",
  "magento",
  "quickbooks",
  "oracle",
  "stripe",
  "ehr",
  "emr",
  "erp",
  "billing",
  "warehouse",
  "api",
  "website",
  "portal",
];

function normalize(text: string): string {
  return text.toLowerCase().replace(/\s+/g, " ").trim();
}

function parsePositiveInteger(text: string): number | null {
  const match = text.match(/\b(\d[\d,]*)\b/);
  if (!match) return null;
  const value = Number(match[1].replace(/,/g, ""));
  return Number.isFinite(value) && value > 0 ? value : null;
}

function parseUsersFromText(text: string): number | null {
  const patterns = [
    /\b(\d[\d,]*)\s*(?:users?|reps?|agents?|employees?|staff|people|seats?|licenses?)\b/i,
    /\b(\d[\d,]*)-?person\b/i,
    /\bteam of\s+(\d[\d,]*)\b/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (!match) continue;
    const value = Number(match[1].replace(/,/g, ""));
    if (Number.isFinite(value) && value > 0) {
      return value;
    }
  }

  return null;
}

function detectIndustry(text: string): ClarificationAnswers["industryVertical"] | undefined {
  const value = normalize(text);
  if (/(health|healthcare|medical|clinic|hospital|pharma|patient)/.test(value)) return "healthcare";
  if (/(financial|bank|banking|insurance|wealth|finserv)/.test(value)) return "financial";
  if (/(nonprofit|non-profit|charity|ngo|donation|fundraising)/.test(value)) return "nonprofit";
  if (/(manufacturing|factory|production|dealer|distributor)/.test(value)) return "manufacturing";
  if (/(education|school|college|university|student|campus)/.test(value)) return "education";
  return undefined;
}

function countSystems(text: string): number | null {
  const explicit = text.match(/\b(\d[\d,]*)\s+(?:systems?|integrations?|apps?|platforms?)\b/i);
  if (explicit) {
    const value = Number(explicit[1].replace(/,/g, ""));
    if (Number.isFinite(value) && value > 0) return value;
  }

  const normalized = normalize(text);
  const detected = SYSTEM_KEYWORDS.filter((keyword) => normalized.includes(keyword));
  return detected.length > 0 ? new Set(detected).size : null;
}

function parseBoolean(text: string): boolean | undefined {
  const value = normalize(text);
  if (/\b(yes|yep|yeah|need|needed|required|must|have to|want|wanted)\b/.test(value)) return true;
  if (/\b(no|nope|none|not needed|don't need|do not need|without)\b/.test(value)) return false;
  return undefined;
}

export function buildBlueprintContext(input: string, answers: OrbAnswers): string {
  const clarifications = Object.entries(answers)
    .filter(([, answer]) => answer.trim())
    .map(([question, answer]) => `Question: ${question}\nAnswer: ${answer}`)
    .join("\n\n");

  return clarifications ? `${input}\n\nOrb clarifications:\n${clarifications}` : input;
}

export function inferClarificationAnswers(input: string, answers: OrbAnswers): ClarificationAnswers {
  const structured: ClarificationAnswers = {};
  const corpus = buildBlueprintContext(input, answers);

  for (const [question, answer] of Object.entries(answers)) {
    const q = normalize(question);
    const a = answer.trim();
    const booleanValue = parseBoolean(a);

    if (!a) continue;

    if (!structured.users && /(how many users|how many people|which teams|team.*use|users need access|teams will use)/.test(q)) {
      structured.users = parseUsersFromText(a) ?? parsePositiveInteger(a) ?? undefined;
      structured.primaryTeams = structured.primaryTeams ?? a;
    }

    if (!structured.industryVertical && /(industry|vertical|compliance|regulatory)/.test(q)) {
      structured.industryVertical = detectIndustry(a);
    }

    if (structured.wantsCompliance === undefined && /(compliance|regulatory)/.test(q)) {
      structured.wantsCompliance =
        booleanValue ??
        /\b(hipaa|gdpr|soc 2|sox|pci|regulated|audit|compliance|privacy)\b/i.test(a);
    }

    if (structured.needsSelfServicePortal === undefined && /(portal|self-service|customer access|partner access)/.test(q)) {
      structured.needsSelfServicePortal = booleanValue;
    }

    if (structured.externalSystemsCount === undefined && /(integrat|existing systems|other systems|erp|api)/.test(q)) {
      structured.externalSystemsCount = countSystems(a) ?? undefined;
    }
  }

  structured.users = structured.users ?? parseUsersFromText(corpus) ?? undefined;
  structured.industryVertical = structured.industryVertical ?? detectIndustry(corpus);
  structured.externalSystemsCount = structured.externalSystemsCount ?? countSystems(corpus) ?? undefined;

  if (structured.needsSelfServicePortal === undefined) {
    structured.needsSelfServicePortal = /\b(portal|self-service|customer login|partner login|community)\b/i.test(corpus)
      ? true
      : undefined;
  }

  if (structured.wantsCompliance === undefined) {
    structured.wantsCompliance = /\b(hipaa|gdpr|soc 2|sox|pci|regulated|audit trail|compliance)\b/i.test(corpus)
      ? true
      : undefined;
  }

  return structured;
}

export function normalizeBlueprintResult(
  result: BlueprintResult,
  contextInput: string,
  answers: ClarificationAnswers
): BlueprintResult {
  const baseline = generateBlueprint(contextInput, answers);

  return {
    ...result,
    executiveSnapshot: {
      primaryFocus: result.executiveSnapshot?.primaryFocus ?? baseline.executiveSnapshot.primaryFocus,
      usersDetected: baseline.executiveSnapshot.usersDetected,
      userCountBand: baseline.executiveSnapshot.userCountBand,
      complexityLevel: result.executiveSnapshot?.complexityLevel ?? baseline.executiveSnapshot.complexityLevel,
      confidenceScore: result.executiveSnapshot?.confidenceScore ?? baseline.executiveSnapshot.confidenceScore,
    },
    costEstimate: baseline.costEstimate,
    confidenceScore: result.confidenceScore ?? baseline.confidenceScore,
  };
}
