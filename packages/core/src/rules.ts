import {
  BlueprintResult,
  ClarificationAnswers,
  OOTBRow,
  ProductDecision,
  ProductKey,
  Signals,
} from "./types";

const has = (text: string, needles: string[]) => needles.some((n) => text.includes(n));

export function extractSignals(input: string, answers: ClarificationAnswers = {}): Signals {
  const text = input.toLowerCase();
  const users = answers.users ?? (has(text, ["enterprise", "global"]) ? 300 : 50);
  const externalSystemsCount =
    answers.externalSystemsCount ?? (has(text, ["erp", "billing", "marketing", "warehouse", "legacy"]) ? 2 : 0);

  return {
    rawText: input,
    users,
    wantsSales: has(text, ["lead", "opportunity", "pipeline", "forecast", "sales"]),
    wantsService: has(text, ["support", "case", "ticket", "sla", "service"]),
    wantsPortal: answers.needsSelfServicePortal ?? has(text, ["portal", "community", "partner"]),
    wantsFieldService: answers.fieldOps ?? has(text, ["technician", "dispatch", "field"]),
    wantsCPQ: has(text, ["quote", "pricing", "proposal", "cpq", "contract"]),
    externalSystemsCount,
    needsSingleCustomerView: has(text, ["single customer view", "360 view", "unified profile"]),
    needsRealtimeSegmentation: has(text, ["real-time segment", "personalization", "journey trigger"]),
    crossCloudAnalytics: has(text, ["cross-cloud", "combined analytics", "multi cloud analytics"]),
    aiAutomationIntent: answers.aiAutomationIntent ?? has(text, ["ai", "copilot", "assistant", "automate responses"]),
    highCaseVolume: has(text, ["high case volume", "thousands of tickets", "large support queue"]),
    deflectionIntent: has(text, ["deflect", "self-service", "reduce ticket"]),
    salesCopilotIntent: has(text, ["sales copilot", "guided selling", "next best action"]),
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
  const decisions: ProductDecision[] = [];

  decisions.push({
    key: "sales_cloud",
    name: products.sales_cloud,
    level: signals.wantsSales ? "recommended" : "optional",
    reasons: signals.wantsSales ? ["Lead/opportunity and forecast needs detected."] : ["Can be added later if sales process matures."],
  });

  decisions.push({
    key: "service_cloud",
    name: products.service_cloud,
    level: signals.wantsService ? "recommended" : "optional",
    reasons: signals.wantsService ? ["Case/ticket workflow requested."] : ["Optional unless support operations are central."],
  });

  decisions.push({
    key: "experience_cloud",
    name: products.experience_cloud,
    level: signals.wantsPortal ? "recommended" : "not_needed",
    reasons: signals.wantsPortal ? ["Portal/community requirement detected."] : ["No external portal requirement detected."],
  });

  decisions.push({
    key: "field_service",
    name: products.field_service,
    level: signals.wantsFieldService ? "recommended" : "not_needed",
    reasons: signals.wantsFieldService ? ["Field dispatch/technician needs present."] : ["No field operations trigger found."],
  });

  decisions.push({
    key: "cpq_revenue",
    name: products.cpq_revenue,
    level: signals.wantsCPQ ? "recommended" : "optional",
    reasons: signals.wantsCPQ ? ["Complex quote/pricing process identified."] : ["Optional if quoting remains simple."],
  });

  const dataCloudTriggers =
    signals.externalSystemsCount >= 2 ||
    signals.needsSingleCustomerView ||
    signals.needsRealtimeSegmentation ||
    signals.crossCloudAnalytics;

  decisions.push({
    key: "data_cloud",
    name: products.data_cloud,
    level: dataCloudTriggers ? "recommended" : "not_needed",
    reasons: dataCloudTriggers
      ? ["Triggered by integration/profile/segmentation analytics requirements."]
      : ["Not recommended by default without explicit triggers."],
  });

  const agentTriggers =
    signals.aiAutomationIntent || (signals.highCaseVolume && signals.deflectionIntent) || signals.salesCopilotIntent;

  decisions.push({
    key: "agentforce_einstein",
    name: products.agentforce_einstein,
    level: agentTriggers ? "optional" : "not_needed",
    reasons: agentTriggers
      ? ["AI automation or copilot trigger detected."]
      : ["Not recommended by default without explicit AI/automation intent."],
  });

  return decisions;
}

export function scoreOOTB(signals: Signals): OOTBRow[] {
  const rows: OOTBRow[] = [
    { capability: "Lead and Opportunity Management", approach: "OOTB", notes: "Use standard Lead, Account, Contact, Opportunity." },
    { capability: "Case Management", approach: signals.wantsService ? "OOTB" : "Config", notes: "Standard Case with queues and assignment rules." },
    { capability: "Approval Workflows", approach: "Config", notes: "Flow-first approvals before Apex." },
    {
      capability: "Industry-specific process",
      approach: has(signals.rawText.toLowerCase(), ["proprietary", "unique compliance"]) ? "Custom" : "Config",
      notes: "Custom objects only when standard model cannot fit requirements.",
    },
  ];
  return rows;
}

export function generateBlueprint(input: string, answers: ClarificationAnswers = {}): BlueprintResult {
  const signals = extractSignals(input, answers);
  const decisions = decideProducts(signals);
  const recommended = decisions.filter((p) => p.level === "recommended").map((p) => p.name);

  return {
    executiveSnapshot: [
      `Primary focus detected: ${signals.wantsSales ? "Sales" : "General CRM"}${signals.wantsService ? " + Service" : ""}.`,
      `Estimated initial user cohort: ~${signals.users}.`,
      `Recommendation confidence starts moderate due to heuristic parsing.`,
    ],
    products: decisions,
    whyMapping: decisions
      .filter((d) => d.level !== "not_needed")
      .map((d) => ({ need: "Captured business needs", product: d.name, why: d.reasons[0] })),
    ootbVsCustom: scoreOOTB(signals),
    objectsAndAutomations: [
      "Objects: Account, Contact, Lead, Opportunity, Case (as needed)",
      "Automation: Lead routing flow, opportunity stage alerts, case escalation flow",
      "Use record-triggered flows before Apex",
    ],
    integrationMap: [
      "ERP/Billing -> Salesforce via API layer",
      "Website forms -> Lead ingestion",
      "Support inbox/chat -> Case creation",
    ],
    analyticsPack: [
      "Pipeline by stage",
      "Win rate trend",
      "Case volume and SLA attainment",
      "Agent productivity",
    ],
    costSimulator: {
      range: signals.users < 100 ? "$25k - $90k year-1" : "$120k - $450k year-1",
      assumptions: [
        "Directional estimate includes licenses, implementation, and change enablement",
        "Assumes phased rollout and mostly configuration-led delivery",
      ],
      disclaimer: "Directional estimate only. This is not official Salesforce pricing or a quote.",
    },
    roadmap: [
      { phase: "Phase 1 (0-6 weeks)", outcomes: ["Discovery", "Core data model", "MVP automations"] },
      { phase: "Phase 2 (6-12 weeks)", outcomes: ["Dashboards", "Integrations", "User training"] },
      { phase: "Phase 3 (post go-live)", outcomes: ["Optimization", "Advanced automation", "Optional AI"] },
    ],
    documentChecklist: [
      "Solution blueprint",
      "Data model and field dictionary",
      "Integration specification",
      "Flow inventory",
      "UAT test scripts",
      "Adoption and training plan",
    ],
    risks: [
      "Integration complexity underestimated",
      "Data quality issues from legacy systems",
      "Scope growth beyond MVP",
    ],
    confidenceScore: Math.max(55, Math.min(90, 60 + recommended.length * 5 + (signals.users > 200 ? 5 : 0))),
  };
}
