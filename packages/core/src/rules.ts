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
    answers.externalSystemsCount ??
    (has(text, ["erp", "billing", "marketing", "warehouse", "legacy", "sap", "oracle", "netsuite"]) ? 2 : 0);
  const industryVertical = answers.industryVertical?.toLowerCase() ?? "";

  return {
    rawText: input,
    users,
    // Core CRM
    wantsSales: has(text, ["lead", "opportunity", "pipeline", "forecast", "sales"]),
    wantsService: has(text, ["support", "case", "ticket", "sla", "service desk", "helpdesk"]),
    wantsPortal:
      answers.needsSelfServicePortal ?? has(text, ["portal", "community", "partner", "self-service"]),
    wantsFieldService:
      answers.fieldOps ?? has(text, ["technician", "dispatch", "field", "on-site", "work order"]),
    wantsCPQ: has(text, ["quote", "pricing", "proposal", "cpq", "contract", "configure price"]),
    externalSystemsCount,
    needsSingleCustomerView: has(text, ["single customer view", "360 view", "unified profile", "customer 360"]),
    needsRealtimeSegmentation: has(text, ["real-time segment", "personalization", "journey trigger", "audience"]),
    crossCloudAnalytics: has(text, ["cross-cloud", "combined analytics", "multi cloud analytics", "unified reporting"]),
    aiAutomationIntent:
      answers.aiAutomationIntent ??
      has(text, ["ai", "copilot", "assistant", "automate responses", "intelligent automation"]),
    highCaseVolume: has(text, ["high case volume", "thousands of tickets", "large support queue", "high volume"]),
    deflectionIntent: has(text, ["deflect", "self-service", "reduce ticket", "chatbot"]),
    salesCopilotIntent: has(text, ["sales copilot", "guided selling", "next best action", "deal intelligence"]),
    // Marketing
    wantsMarketing:
      answers.wantsMarketing ??
      has(text, [
        "email campaign",
        "marketing automation",
        "journey builder",
        "nurture",
        "drip campaign",
        "marketing cloud",
        "customer journeys",
        "email marketing",
        "send emails",
        "marketing",
      ]),
    wantsPardot: has(text, [
      "pardot",
      "b2b marketing",
      "account engagement",
      "mql",
      "lead scoring",
      "nurture b2b",
      "marketing qualified lead",
    ]),
    wantsLoyalty: has(text, [
      "loyalty",
      "rewards program",
      "loyalty points",
      "retention program",
      "member program",
      "points program",
    ]),
    wantsCommerce:
      answers.wantsCommerce ??
      has(text, [
        "ecommerce",
        "e-commerce",
        "online store",
        "b2b commerce",
        "storefront",
        "shopping cart",
        "order management",
        "product catalog",
        "digital commerce",
      ]),
    // Data & AI
    wantsTableau: has(text, [
      "tableau",
      "advanced analytics",
      "data visualization",
      "bi dashboard",
      "business intelligence",
      "embedded analytics",
      "data studio",
    ]),
    // Platform
    wantsMuleSoft: has(text, [
      "mulesoft",
      "api management",
      "integration platform",
      "api gateway",
      "middleware",
      "anypoint",
      "enterprise integration",
    ]),
    wantsSlack: has(text, [
      "slack",
      "team collaboration",
      "internal messaging",
      "channel-based",
      "dealsroom",
      "collaboration tool",
    ]),
    wantsShield:
      answers.wantsCompliance ??
      has(text, [
        "shield",
        "encryption",
        "field audit",
        "compliance",
        "hipaa",
        "gdpr",
        "data residency",
        "event monitoring",
        "regulatory",
        "audit trail",
        "data governance",
      ]),
    // Industry
    wantsHealthCloud:
      industryVertical === "healthcare" ||
      has(text, [
        "healthcare",
        "patient",
        "provider",
        "clinical",
        "ehr",
        "emr",
        "care management",
        "health plan",
        "payer",
        "pharma",
        "hospital",
        "clinic",
      ]),
    wantsFinancialCloud:
      industryVertical === "financial" ||
      has(text, [
        "financial services",
        "wealth management",
        "banking",
        "insurance",
        "financial advisor",
        "brokerage",
        "asset management",
        "fin services",
        "wealth",
        "bank",
      ]),
    wantsNonprofit:
      industryVertical === "nonprofit" ||
      has(text, [
        "nonprofit",
        "non-profit",
        "charity",
        "donation",
        "grant management",
        "fundraising",
        "npsp",
        "ngo",
        "foundation",
      ]),
    wantsManufacturing:
      industryVertical === "manufacturing" ||
      has(text, [
        "manufacturing",
        "dealer network",
        "distributor",
        "warranty",
        "supply chain",
        "product lifecycle",
        "channel sales",
        "factory",
        "production",
      ]),
    wantsEducation:
      industryVertical === "education" ||
      has(text, [
        "education",
        "university",
        "higher ed",
        "student",
        "enrollment",
        "alumni",
        "school",
        "academic",
        "campus",
      ]),
    wantsNetZero:
      answers.wantsSustainability ??
      has(text, [
        "sustainability",
        "carbon",
        "net zero",
        "emissions",
        "esg",
        "environmental",
        "climate",
        "scope 3",
        "carbon footprint",
        "green",
      ]),
    isEnterprise:
      users >= 500 ||
      has(text, ["enterprise", "global", "large scale", "fortune", "multinational", "enterprise-wide"]),
  };
}

const products: Record<ProductKey, string> = {
  // Core CRM
  sales_cloud: "Sales Cloud",
  service_cloud: "Service Cloud",
  experience_cloud: "Experience Cloud",
  field_service: "Field Service",
  cpq_revenue: "Revenue Cloud / CPQ",
  // Marketing
  marketing_cloud: "Marketing Cloud",
  pardot: "Marketing Cloud Account Engagement (Pardot)",
  loyalty_management: "Loyalty Management",
  commerce_cloud: "Commerce Cloud",
  // Data & AI
  data_cloud: "Data Cloud",
  agentforce_einstein: "Agentforce / Einstein",
  tableau_analytics: "Tableau Analytics",
  // Platform
  mulesoft: "MuleSoft",
  slack_collab: "Slack",
  salesforce_shield: "Salesforce Shield",
  // Industry
  health_cloud: "Health Cloud",
  financial_services_cloud: "Financial Services Cloud",
  nonprofit_cloud: "Nonprofit Cloud",
  manufacturing_cloud: "Manufacturing Cloud",
  education_cloud: "Education Cloud",
  net_zero_cloud: "Net Zero Cloud",
};

export function decideProducts(signals: Signals): ProductDecision[] {
  const decisions: ProductDecision[] = [];

  // --- Core CRM ---
  decisions.push({
    key: "sales_cloud",
    name: products.sales_cloud,
    level: signals.wantsSales ? "recommended" : "optional",
    reasons: signals.wantsSales
      ? ["Lead/opportunity and forecast needs detected."]
      : ["Can be added later if sales process matures."],
  });

  decisions.push({
    key: "service_cloud",
    name: products.service_cloud,
    level: signals.wantsService ? "recommended" : "optional",
    reasons: signals.wantsService
      ? ["Case/ticket workflow requested."]
      : ["Optional unless support operations are central."],
  });

  decisions.push({
    key: "experience_cloud",
    name: products.experience_cloud,
    level: signals.wantsPortal ? "recommended" : "not_needed",
    reasons: signals.wantsPortal
      ? ["Portal/community requirement detected."]
      : ["No external portal requirement detected."],
  });

  decisions.push({
    key: "field_service",
    name: products.field_service,
    level: signals.wantsFieldService ? "recommended" : "not_needed",
    reasons: signals.wantsFieldService
      ? ["Field dispatch/technician needs present."]
      : ["No field operations trigger found."],
  });

  decisions.push({
    key: "cpq_revenue",
    name: products.cpq_revenue,
    level: signals.wantsCPQ ? "recommended" : "optional",
    reasons: signals.wantsCPQ
      ? ["Complex quote/pricing process identified."]
      : ["Optional if quoting remains simple."],
  });

  // --- Marketing ---
  decisions.push({
    key: "marketing_cloud",
    name: products.marketing_cloud,
    level: signals.wantsMarketing ? "recommended" : "not_needed",
    reasons: signals.wantsMarketing
      ? ["B2C email/journey marketing automation needs detected."]
      : ["No B2C marketing automation signals present."],
  });

  decisions.push({
    key: "pardot",
    name: products.pardot,
    level: signals.wantsPardot ? "recommended" : "not_needed",
    reasons: signals.wantsPardot
      ? ["B2B marketing automation / lead nurture workflow requested."]
      : ["No B2B marketing automation signals."],
  });

  decisions.push({
    key: "loyalty_management",
    name: products.loyalty_management,
    level: signals.wantsLoyalty ? "recommended" : "not_needed",
    reasons: signals.wantsLoyalty
      ? ["Loyalty/rewards program requirement detected."]
      : ["No loyalty program signals present."],
  });

  decisions.push({
    key: "commerce_cloud",
    name: products.commerce_cloud,
    level: signals.wantsCommerce ? "recommended" : "not_needed",
    reasons: signals.wantsCommerce
      ? ["E-commerce or B2B storefront needs identified."]
      : ["No commerce/storefront signals present."],
  });

  // --- Data & AI ---
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
    signals.aiAutomationIntent ||
    (signals.highCaseVolume && signals.deflectionIntent) ||
    signals.salesCopilotIntent;

  decisions.push({
    key: "agentforce_einstein",
    name: products.agentforce_einstein,
    level: agentTriggers ? "optional" : "not_needed",
    reasons: agentTriggers
      ? ["AI automation or copilot trigger detected."]
      : ["Not recommended by default without explicit AI/automation intent."],
  });

  decisions.push({
    key: "tableau_analytics",
    name: products.tableau_analytics,
    level: signals.wantsTableau || signals.crossCloudAnalytics ? "optional" : "not_needed",
    reasons:
      signals.wantsTableau || signals.crossCloudAnalytics
        ? ["Advanced analytics or BI dashboard requirement detected."]
        : ["Standard CRM Analytics sufficient without explicit BI signals."],
  });

  // --- Platform ---
  const muleSoftTrigger = signals.wantsMuleSoft || signals.externalSystemsCount >= 3;
  decisions.push({
    key: "mulesoft",
    name: products.mulesoft,
    level: muleSoftTrigger ? "optional" : "not_needed",
    reasons: muleSoftTrigger
      ? ["High external system count or explicit API management requirement."]
      : ["No enterprise integration platform trigger found."],
  });

  decisions.push({
    key: "slack_collab",
    name: products.slack_collab,
    level: signals.wantsSlack ? "optional" : "not_needed",
    reasons: signals.wantsSlack
      ? ["Team collaboration/internal messaging needs detected."]
      : ["No collaboration platform signals present."],
  });

  const shieldTrigger = signals.wantsShield || signals.isEnterprise;
  decisions.push({
    key: "salesforce_shield",
    name: products.salesforce_shield,
    level: shieldTrigger ? "optional" : "not_needed",
    reasons: shieldTrigger
      ? ["Compliance, encryption, or enterprise audit trail requirements."]
      : ["No regulatory/compliance trigger found."],
  });

  // --- Industry Clouds ---
  decisions.push({
    key: "health_cloud",
    name: products.health_cloud,
    level: signals.wantsHealthCloud ? "recommended" : "not_needed",
    reasons: signals.wantsHealthCloud
      ? ["Healthcare/clinical domain signals present."]
      : ["No healthcare industry vertical detected."],
  });

  decisions.push({
    key: "financial_services_cloud",
    name: products.financial_services_cloud,
    level: signals.wantsFinancialCloud ? "recommended" : "not_needed",
    reasons: signals.wantsFinancialCloud
      ? ["Financial services vertical signals detected."]
      : ["No financial services vertical detected."],
  });

  decisions.push({
    key: "nonprofit_cloud",
    name: products.nonprofit_cloud,
    level: signals.wantsNonprofit ? "recommended" : "not_needed",
    reasons: signals.wantsNonprofit
      ? ["Nonprofit/fundraising domain signals present."]
      : ["No nonprofit vertical detected."],
  });

  decisions.push({
    key: "manufacturing_cloud",
    name: products.manufacturing_cloud,
    level: signals.wantsManufacturing ? "recommended" : "not_needed",
    reasons: signals.wantsManufacturing
      ? ["Manufacturing/dealer/distribution signals detected."]
      : ["No manufacturing vertical detected."],
  });

  decisions.push({
    key: "education_cloud",
    name: products.education_cloud,
    level: signals.wantsEducation ? "recommended" : "not_needed",
    reasons: signals.wantsEducation
      ? ["Higher education or student lifecycle signals present."]
      : ["No education vertical detected."],
  });

  decisions.push({
    key: "net_zero_cloud",
    name: products.net_zero_cloud,
    level: signals.wantsNetZero ? "optional" : "not_needed",
    reasons: signals.wantsNetZero
      ? ["Sustainability/ESG/carbon tracking signals detected."]
      : ["No sustainability requirement detected."],
  });

  return decisions;
}

export function scoreOOTB(signals: Signals): OOTBRow[] {
  return [
    {
      capability: "Lead and Opportunity Management",
      approach: "OOTB",
      notes: "Use standard Lead, Account, Contact, Opportunity.",
    },
    {
      capability: "Case Management",
      approach: signals.wantsService ? "OOTB" : "Config",
      notes: "Standard Case with queues and assignment rules.",
    },
    {
      capability: "Approval Workflows",
      approach: "Config",
      notes: "Flow-first approvals before Apex.",
    },
    {
      capability: "Industry-specific process",
      approach: has(signals.rawText.toLowerCase(), ["proprietary", "unique compliance"])
        ? "Custom"
        : "Config",
      notes: "Custom objects only when standard model cannot fit requirements.",
    },
  ];
}

export function generateBlueprint(
  input: string,
  answers: ClarificationAnswers = {}
): BlueprintResult {
  const signals = extractSignals(input, answers);
  const decisions = decideProducts(signals);
  const recommended = decisions.filter((p) => p.level === "recommended").map((p) => p.name);

  const focusParts = [
    signals.wantsSales ? "Sales" : null,
    signals.wantsService ? "Service" : null,
    signals.wantsMarketing ? "Marketing" : null,
    signals.wantsHealthCloud ? "Healthcare" : null,
    signals.wantsFinancialCloud ? "Financial Services" : null,
    signals.wantsNonprofit ? "Nonprofit" : null,
  ]
    .filter(Boolean)
    .join(" + ");

  return {
    executiveSnapshot: [
      `Primary focus detected: ${focusParts || "General CRM"}.`,
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
      "ERP/Billing → Salesforce via API layer",
      "Website forms → Lead ingestion",
      "Support inbox/chat → Case creation",
    ],
    analyticsPack: [
      "Pipeline by stage",
      "Win rate trend",
      "Case volume and SLA attainment",
      "Agent productivity",
    ],
    costSimulator: {
      range: signals.users < 100 ? "$25k – $90k year-1" : "$120k – $450k year-1",
      assumptions: [
        "Directional estimate includes licenses, implementation, and change enablement",
        "Assumes phased rollout and mostly configuration-led delivery",
      ],
      disclaimer:
        "Directional estimate only. This is not official Salesforce pricing or a quote.",
    },
    roadmap: [
      {
        phase: "Phase 1 (0–6 weeks)",
        outcomes: ["Discovery", "Core data model", "MVP automations"],
      },
      {
        phase: "Phase 2 (6–12 weeks)",
        outcomes: ["Dashboards", "Integrations", "User training"],
      },
      {
        phase: "Phase 3 (post go-live)",
        outcomes: ["Optimization", "Advanced automation", "Optional AI"],
      },
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
    confidenceScore: Math.max(
      55,
      Math.min(90, 60 + recommended.length * 3 + (signals.users > 200 ? 5 : 0))
    ),
  };
}
