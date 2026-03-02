import { estimateImplementation } from "./estimateImplementation";
import { estimateLicenseCost } from "./estimateLicenses";
import { BlueprintResult, ClarificationAnswers, OOTBRow, ProductDecision, ProductKey, Signals } from "./types";

const has = (text: string, needles: string[]) => needles.some((n) => text.includes(n));
const countMatches = (text: string, needles: string[]) => needles.filter((n) => text.includes(n)).length;

function parseUsers(text: string): number | null {
  const patterns = [
    /(\d+)\s*\+\s*users?/, /(\d+)\+/, /(\d+)\s*users?/, /more than\s+(\d+)/, /over\s+(\d+)/,
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m?.[1]) return Number(m[1]);
  }
  return null;
}

const systemsKeywords = [
  ["ERP", ["erp"]],
  ["Ecommerce", ["ecommerce", "e-commerce", "shopify", "magento"]],
  ["Marketing Automation", ["marketing automation", "marketo", "hubspot", "pardot"]],
  ["Billing", ["billing"]],
] as const;

export function extractSignals(input: string, answers: ClarificationAnswers = {}): Signals {
  const text = input.toLowerCase();
  const parsedUsers = parseUsers(text);
  let users = answers.users ?? parsedUsers ?? (has(text, ["enterprise", "global"]) ? 300 : 50);
  if (has(text, ["enterprise"]) && has(text, ["500+", "500 +", "more than 500", "over 500", "500 users", "500+ users"])) {
    users = Math.max(users, 500);
  }

  const explicitNoPortal = has(text, ["no portal", "without portal", "do not need portal"]);
  const portalNeed =
    !explicitNoPortal &&
    (answers.needsSelfServicePortal ??
      has(text, ["portal", "self-service", "self service", "customer portal", "partner portal", "login", "community"]));

  const wantsFieldService =
    answers.fieldOps ??
    has(text, ["technician", "dispatch", "schedule visits", "work orders", "onsite service", "field service", "service appointment"]);

  const systemsDetected = systemsKeywords
    .filter(([, keys]) => has(text, [...keys]))
    .map(([label]) => label as string);
  const explicitExternalCount = answers.externalSystemsCount ?? 0;
  const externalSystemsCount = Math.max(explicitExternalCount, systemsDetected.length);

  const wantsSales = has(text, ["lead", "opportunity", "pipeline", "forecast", "sales"]);
  const wantsService = has(text, ["support", "case", "ticket", "sla", "service"]);
  const wantsCPQ = has(text, ["complex pricing", "quoting", "approvals for pricing", "discount approvals", "cpq"]);

  const aiAutomationIntent = answers.aiAutomationIntent ?? has(text, ["ai-driven", "ai automation", "copilot", "agent assist", "generative", "auto-summarize", "deflection"]);

  const needsSingleCustomerView = has(text, ["unified customer profile", "single customer view"]);
  const needsRealtimeCustomerData = has(text, ["real-time"]) && has(text, ["customer data", "customer profile", "profiles"]);

  const complexityLevel: "Low" | "Medium" | "High" =
    externalSystemsCount >= 3 || wantsCPQ || needsSingleCustomerView ? "High" : wantsSales || wantsService || portalNeed ? "Medium" : "Low";

  const userCountBand: Signals["userCountBand"] = users >= 200 ? "200+" : users >= 50 ? "50-199" : "1-49";

  return {
    rawText: input,
    users,
    userCountBand,
    wantsSales,
    wantsService,
    portalNeed,
    explicitNoPortal,
    wantsFieldService,
    wantsCPQ,
    externalSystemsCount,
    systemsDetected,
    needsSingleCustomerView,
    needsRealtimeCustomerData,
    crossCloudAnalytics: has(text, ["cross-cloud analytics", "cross cloud analytics"]),
    aiAutomationIntent,
    highCaseVolume: has(text, ["high case volume", "thousands of tickets", "large support queue"]),
    deflectionIntent: has(text, ["deflection", "deflect"]),
    salesCopilotIntent: has(text, ["sales copilot", "guided selling"]),
    complexityLevel,
  };
}

const products: Record<ProductKey, string> = {
  sales_cloud: "Sales Cloud",
  service_cloud: "Service Cloud",
  experience_cloud: "Experience Cloud",
  field_service: "Field Service",
  cpq_revenue: "Revenue Cloud / CPQ",
  data_cloud: "Data Cloud",
  agentforce_einstein: "Agentforce / Einstein",
};

export function decideProducts(signals: Signals): ProductDecision[] {
  const dataCloudTriggers =
    signals.externalSystemsCount >= 2 ||
    signals.needsSingleCustomerView ||
    signals.needsRealtimeCustomerData ||
    signals.crossCloudAnalytics;
  const agentTriggers =
    signals.aiAutomationIntent || (signals.highCaseVolume && signals.deflectionIntent) || signals.salesCopilotIntent;

  return [
    {
      key: "sales_cloud",
      name: products.sales_cloud,
      level: signals.wantsSales ? "recommended" : "optional",
      reasons: [signals.wantsSales ? "Sales process management needs detected." : "Optional for future sales process maturity."],
      triggers: signals.wantsSales ? ["lead/opportunity/pipeline keywords"] : ["no explicit sales trigger"],
    },
    {
      key: "service_cloud",
      name: products.service_cloud,
      level: signals.wantsService ? "recommended" : "optional",
      reasons: [signals.wantsService ? "Support/case requirements detected." : "Optional unless service operations expand."],
      triggers: signals.wantsService ? ["support/case/ticket keywords"] : ["no explicit service trigger"],
    },
    {
      key: "experience_cloud",
      name: products.experience_cloud,
      level: signals.portalNeed ? "recommended" : signals.explicitNoPortal ? "not_needed" : "optional",
      reasons: [signals.portalNeed ? "Portal/self-service access requirement detected." : "No portal trigger detected."],
      triggers: signals.portalNeed ? ["portal/self-service/community keywords"] : ["no portal trigger"],
    },
    {
      key: "field_service",
      name: products.field_service,
      level: signals.wantsFieldService ? "recommended" : "not_needed",
      reasons: [signals.wantsFieldService ? "Explicit field operations keywords detected." : "No field service trigger keywords detected."],
      triggers: signals.wantsFieldService ? ["technician/dispatch/work orders keywords"] : ["no field service keywords"],
    },
    {
      key: "cpq_revenue",
      name: products.cpq_revenue,
      level: signals.wantsCPQ ? "recommended" : "optional",
      reasons: [signals.wantsCPQ ? "Complex pricing/quoting requirements detected." : "Optional unless pricing complexity increases."],
      triggers: signals.wantsCPQ ? ["complex pricing/quoting/discount approval keywords"] : ["no complex pricing trigger"],
    },
    {
      key: "data_cloud",
      name: products.data_cloud,
      level: dataCloudTriggers ? "recommended" : "not_needed",
      reasons: [dataCloudTriggers ? "Unified profile / multi-system / real-time customer data trigger detected." : "Not recommended without explicit data unification trigger."],
      triggers: dataCloudTriggers ? ["2+ systems or unified profile or real-time customer data"] : ["no data cloud trigger"],
    },
    {
      key: "agentforce_einstein",
      name: products.agentforce_einstein,
      level: agentTriggers ? (signals.wantsService ? "recommended" : "optional") : "not_needed",
      reasons: [agentTriggers ? "AI automation/copilot intent detected." : "Not recommended by default without explicit AI intent."],
      triggers: agentTriggers ? ["ai-driven/copilot/agent assist/deflection keywords"] : ["no ai trigger"],
    },
  ];
}

export function scoreOOTB(signals: Signals): OOTBRow[] {
  return [
    {
      area: "Lead & Opportunity Management",
      ootbFit: "High",
      customizationLevel: "Low",
      risk: "Low",
      notes: "Standard Lead, Account, Contact, Opportunity with flow automation.",
    },
    {
      area: "Case & Service Operations",
      ootbFit: signals.wantsService ? "High" : "Medium",
      customizationLevel: "Medium",
      risk: "Medium",
      notes: "Case routing and SLA policies can be config-led using Flow.",
    },
    {
      area: "Pricing & Approvals",
      ootbFit: signals.wantsCPQ ? "Medium" : "Low",
      customizationLevel: signals.wantsCPQ ? "High" : "Medium",
      risk: signals.wantsCPQ ? "High" : "Medium",
      notes: "Complex pricing and discount governance often require CPQ design.",
    },
  ];
}

export function generateBlueprint(input: string, answers: ClarificationAnswers = {}): BlueprintResult {
  const signals = extractSignals(input, answers);
  const decisions = decideProducts(signals);
  const recommendedNames = decisions.filter((d) => d.level === "recommended").map((d) => d.name);
  const license = estimateLicenseCost({ userCount: signals.users, recommendedProducts: recommendedNames });

  const enterpriseFloor = signals.users >= 200 ? 200 * 100 * 12 : 0;
  const licenseLow = Math.max(license.totalLow, enterpriseFloor);
  const implementationBand = estimateImplementation({ complexityLevel: signals.complexityLevel, integrationCount: signals.externalSystemsCount });
  const implLow = signals.complexityLevel === "High" ? Math.max(implementationBand.implLow, 150000) : implementationBand.implLow;

  const confidenceScore = Math.max(55, Math.min(94, 62 + countMatches(signals.rawText.toLowerCase(), ["users", "portal", "ai", "erp", "pricing"]) * 6));

  return {
    executiveSnapshot: {
      primaryFocus: signals.wantsSales && signals.wantsService ? "Sales + Service" : signals.wantsService ? "Service" : "Sales / CRM",
      usersDetected: signals.users,
      userCountBand: signals.userCountBand,
      complexityLevel: signals.complexityLevel,
      confidenceScore,
    },
    products: decisions,
    whyMapping: decisions.filter((d) => d.level !== "not_needed").map((d) => ({ need: "Captured business needs", product: d.name, why: d.reasons[0] })),
    ootbVsCustom: scoreOOTB(signals),
    objectsAndAutomations: [
      "Objects: Account, Contact, Lead, Opportunity, Case",
      "Flow-first automations: lead routing, case triage, discount approval orchestration",
      "Use custom objects only for non-standard domain entities",
    ],
    integrationMap: (signals.systemsDetected.length ? signals.systemsDetected : ["ERP", "Ecommerce", "Marketing Automation"]).map((system) => ({
      system,
      pattern: system === "Marketing Automation" ? "Event" : system === "ERP" ? "API" : "Batch",
    })),
    analyticsPack: ["Pipeline by stage", "Forecast attainment", "Case deflection trend", "SLA adherence", "Agent productivity"],
    costEstimate: {
      license: {
        ...license,
        totalLow: licenseLow,
      },
      implementation: {
        low: implLow,
        high: implementationBand.implHigh,
        rationale: implementationBand.rationale,
      },
      yearOneTotal: {
        low: licenseLow + implLow,
        high: license.totalHigh + implementationBand.implHigh,
      },
      assumptions: [
        "License estimate = users × monthly directional range × 12.",
        "When both Sales and Service are recommended, user allocation defaults to 70/30.",
        "Enterprise safeguard floor applied for 200+ users scenarios.",
        "Implementation band scales by complexity and integration volume.",
      ],
      disclaimer: "Directional estimates only. Not official Salesforce pricing or a quote.",
    },
    roadmap: [
      { phase: "Phase 1", outcomes: ["Discovery and data model", "Core clouds rollout", "MVP flows"] },
      { phase: "Phase 2", outcomes: ["Integrations and analytics", "Portal and automation tuning"] },
      { phase: "Phase 3", outcomes: ["Optimization", "Advanced AI and governance"] },
    ],
    documentChecklist: ["Solution blueprint", "Data dictionary", "Integration design", "Flow catalog", "UAT scripts", "Adoption plan"],
    risks: ["Legacy data quality", "Integration complexity", "Change adoption pacing"],
    confidenceScore,
  };
}
