import { estimateImplementation } from "./estimateImplementation";
import { estimateLicenseCost } from "./estimateLicenses";
import { BlueprintResult, ClarificationAnswers, OOTBRow, ProductDecision, ProductKey, Signals } from "./types";

const has = (text: string, needles: string[]) => needles.some((n) => text.includes(n));
const countMatches = (text: string, needles: string[]) => needles.filter((n) => text.includes(n)).length;

function parseUsers(text: string): number | null {
  const headcountNoun =
    "(?:users?|reps?|agents?|employees?|staff|people|seats?|team\\s+members?|licenses?" +
    "|managers?|executives?|salespeople|sales\\s+people|directors?|admins?|administrators?" +
    "|analysts?|consultants?|engineers?|associates?|professionals?|coordinators?" +
    "|specialists?|advisors?|representatives?|technicians?|operators?|supervisors?" +
    "|developers?|leaders?|partners?)";
  // Optional role-modifier words (not numeric multipliers like million/billion)
  const roleModifier = "(?:(?!million|billion|thousand|hundred|percent)\\w+\\s+){0,2}";

  // Step 1: find ALL "N [role] noun" mentions and sum them.
  // This handles "50 sales reps, 200 account executives, 80 inside sales reps" → 330.
  // Exclude mentions preceded by "total" (those are summary numbers, not additive groups).
  const sumPattern = new RegExp(
    `(?<!total\\s)(?<!totaling\\s)(?<!totalling\\s)(\\d[\\d,]*)\\s*\\+?\\s*${roleModifier}${headcountNoun}`,
    "g"
  );
  const allMatches = [...text.matchAll(sumPattern)];
  if (allMatches.length > 0) {
    const total = allMatches.reduce((sum, m) => {
      const n = Number(m[1].replace(/,/g, ""));
      return n > 0 && n < 1_000_000 ? sum + n : sum;
    }, 0);
    if (total > 0) return total;
  }

  // Step 2: fallback patterns (single-value, no summing)
  const fallbacks = [
    /team of\s+(\d[\d,]*)/,
    /(\d[\d,]*)-?person\b/,
    /(\d[\d,]*)-?member\b/,
    new RegExp(`(?:more than|over|around|about|for)\\s+(\\d[\\d,]*)\\s+${roleModifier}${headcountNoun}`),
    /(?:company|team|org|organisation?)\s*(?:of|:)?\s*(\d{1,4})\b/,
    /(\d{1,4})\s*(?:total\s+)?(?:concurrent\s+)?users?\b/,
  ];
  for (const p of fallbacks) {
    const m = text.match(p);
    if (m) {
      const n = Number((m[1] ?? m[0].replace(/\D/g, "")).replace(/,/g, ""));
      if (n > 0 && n < 1_000_000) return n;
    }
  }

  // Step 3: named size bands
  if (/\b(?:startup|micro|just (?:me|myself)|solo|founder|1-person)\b/.test(text)) return 5;
  if (/\b(?:small (?:team|company|business|org)|smb|sme|boutique)\b/.test(text)) return 15;
  if (/\b(?:mid-?market|growing (?:team|company)|scale-?up)\b/.test(text)) return 75;
  if (/\b(?:large (?:enterprise|company|org)|global (?:company|org))\b/.test(text)) return 500;
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
  // Default: use parsed value, then check broad size signals, then fall back to 25 (small team)
  let users = answers.users ?? parsedUsers ?? (has(text, ["enterprise"]) && has(text, ["500+", "500 +", "more than 500", "over 500"]) ? 500 : has(text, ["enterprise"]) ? 250 : has(text, ["global"]) ? 300 : 25);
  if (has(text, ["enterprise"]) && has(text, ["500+", "500 +", "more than 500", "over 500", "500 users", "500+ users"])) {
    users = Math.max(users, 500);
  }

  const industryVertical = answers.industryVertical?.toLowerCase() ?? "";

  const explicitNoPortal = has(text, ["no portal", "without portal", "do not need portal", "no external portal"]);
  const portalNeed =
    !explicitNoPortal &&
    (answers.needsSelfServicePortal ??
      has(text, [
        "portal",
        "self-service portal",
        "self service portal",
        "customer portal",
        "partner portal",
        "vendor portal",
        "dealer portal",
        "customer login",
        "partner login",
        "external users",
        "community",
        "experience site",
        "client access",
      ]));

  const wantsFieldService =
    answers.fieldOps ??
    has(text, ["technician", "dispatch", "schedule visits", "work orders", "onsite service", "field service", "service appointment"]);

  const systemsDetected = systemsKeywords
    .filter(([, keys]) => has(text, [...keys]))
    .map(([label]) => label as string);
  const explicitExternalCount = answers.externalSystemsCount ?? 0;
  const externalSystemsCount = Math.max(explicitExternalCount, systemsDetected.length);

  const wantsSales = has(text, ["lead", "opportunity", "pipeline", "forecast", "sales"]);
  // "service" alone is too broad (matches "financial services", "field service" etc.) — require more specific signals
  const wantsService = has(text, ["support", "case", "ticket", "sla", "customer service", "help desk", "service cloud", "service operations", "contact center"]);
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
    complexityLevel,
    // Core CRM
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
    crossCloudAnalytics: has(text, ["cross-cloud analytics", "cross cloud analytics", "combined analytics", "multi cloud analytics", "unified reporting"]),
    aiAutomationIntent,
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
    triggers: signals.wantsSales ? ["lead/opportunity/pipeline keywords"] : ["no explicit sales trigger"],
  });

  decisions.push({
    key: "service_cloud",
    name: products.service_cloud,
    level: signals.wantsService ? "recommended" : "optional",
    reasons: signals.wantsService
      ? ["Case/ticket workflow requested."]
      : ["Optional unless support operations are central."],
    triggers: signals.wantsService ? ["support/case/ticket keywords"] : ["no explicit service trigger"],
  });

  decisions.push({
    key: "experience_cloud",
    name: products.experience_cloud,
    level: signals.portalNeed ? "recommended" : signals.explicitNoPortal ? "not_needed" : "optional",
    reasons: signals.portalNeed
      ? ["Portal/community requirement detected."]
      : ["No external portal requirement detected."],
    triggers: signals.portalNeed ? ["portal/self-service/community keywords"] : ["no portal trigger"],
  });

  decisions.push({
    key: "field_service",
    name: products.field_service,
    level: signals.wantsFieldService ? "recommended" : "not_needed",
    reasons: signals.wantsFieldService
      ? ["Field dispatch/technician needs present."]
      : ["No field operations trigger found."],
    triggers: signals.wantsFieldService ? ["technician/dispatch/work orders keywords"] : ["no field service keywords"],
  });

  decisions.push({
    key: "cpq_revenue",
    name: products.cpq_revenue,
    level: signals.wantsCPQ ? "recommended" : "optional",
    reasons: signals.wantsCPQ
      ? ["Complex quote/pricing process identified."]
      : ["Optional if quoting remains simple."],
    triggers: signals.wantsCPQ ? ["complex pricing/quoting/discount approval keywords"] : ["no complex pricing trigger"],
  });

  // --- Marketing ---
  decisions.push({
    key: "marketing_cloud",
    name: products.marketing_cloud,
    level: signals.wantsMarketing ? "recommended" : "not_needed",
    reasons: signals.wantsMarketing
      ? ["B2C email/journey marketing automation needs detected."]
      : ["No B2C marketing automation signals present."],
    triggers: signals.wantsMarketing ? ["email campaign/marketing automation/journey keywords"] : ["no marketing trigger"],
  });

  decisions.push({
    key: "pardot",
    name: products.pardot,
    level: signals.wantsPardot ? "recommended" : "not_needed",
    reasons: signals.wantsPardot
      ? ["B2B marketing automation / lead nurture workflow requested."]
      : ["No B2B marketing automation signals."],
    triggers: signals.wantsPardot ? ["pardot/b2b marketing/mql/lead scoring keywords"] : ["no pardot trigger"],
  });

  decisions.push({
    key: "loyalty_management",
    name: products.loyalty_management,
    level: signals.wantsLoyalty ? "recommended" : "not_needed",
    reasons: signals.wantsLoyalty
      ? ["Loyalty/rewards program requirement detected."]
      : ["No loyalty program signals present."],
    triggers: signals.wantsLoyalty ? ["loyalty/rewards/points program keywords"] : ["no loyalty trigger"],
  });

  decisions.push({
    key: "commerce_cloud",
    name: products.commerce_cloud,
    level: signals.wantsCommerce ? "recommended" : "not_needed",
    reasons: signals.wantsCommerce
      ? ["E-commerce or B2B storefront needs identified."]
      : ["No commerce/storefront signals present."],
    triggers: signals.wantsCommerce ? ["ecommerce/storefront/order management keywords"] : ["no commerce trigger"],
  });

  // --- Data & AI ---
  const dataCloudTriggers =
    signals.externalSystemsCount >= 2 ||
    signals.needsSingleCustomerView ||
    signals.needsRealtimeCustomerData ||
    signals.crossCloudAnalytics;
  const agentTriggers =
    signals.aiAutomationIntent ||
    (signals.highCaseVolume && signals.deflectionIntent) ||
    signals.salesCopilotIntent;

  decisions.push({
    key: "data_cloud",
    name: products.data_cloud,
    level: dataCloudTriggers ? "recommended" : "not_needed",
    reasons: dataCloudTriggers
      ? ["Unified profile / multi-system / real-time customer data trigger detected."]
      : ["Not recommended without explicit data unification trigger."],
    triggers: dataCloudTriggers ? ["2+ systems or unified profile or real-time customer data"] : ["no data cloud trigger"],
  });

  decisions.push({
    key: "agentforce_einstein",
    name: products.agentforce_einstein,
    level: agentTriggers ? "optional" : "not_needed",
    reasons: agentTriggers
      ? ["AI automation or copilot trigger detected."]
      : ["Not recommended by default without explicit AI/automation intent."],
    triggers: agentTriggers ? ["ai-driven/copilot/agent assist/deflection keywords"] : ["no ai trigger"],
  });

  decisions.push({
    key: "tableau_analytics",
    name: products.tableau_analytics,
    level: signals.wantsTableau || signals.crossCloudAnalytics ? "optional" : "not_needed",
    reasons:
      signals.wantsTableau || signals.crossCloudAnalytics
        ? ["Advanced analytics or BI dashboard requirement detected."]
        : ["Standard CRM Analytics sufficient without explicit BI signals."],
    triggers: signals.wantsTableau ? ["tableau/bi dashboard/analytics keywords"] : ["no tableau trigger"],
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
    triggers: muleSoftTrigger ? ["3+ integrations or api management keywords"] : ["no mulesoft trigger"],
  });

  decisions.push({
    key: "slack_collab",
    name: products.slack_collab,
    level: signals.wantsSlack ? "optional" : "not_needed",
    reasons: signals.wantsSlack
      ? ["Team collaboration/internal messaging needs detected."]
      : ["No collaboration platform signals present."],
    triggers: signals.wantsSlack ? ["slack/collaboration keywords"] : ["no slack trigger"],
  });

  const shieldTrigger = signals.wantsShield || signals.isEnterprise;
  decisions.push({
    key: "salesforce_shield",
    name: products.salesforce_shield,
    level: shieldTrigger ? "optional" : "not_needed",
    reasons: shieldTrigger
      ? ["Compliance, encryption, or enterprise audit trail requirements."]
      : ["No regulatory/compliance trigger found."],
    triggers: shieldTrigger ? ["compliance/encryption/hipaa/gdpr keywords"] : ["no shield trigger"],
  });

  // --- Industry Clouds ---
  decisions.push({
    key: "health_cloud",
    name: products.health_cloud,
    level: signals.wantsHealthCloud ? "recommended" : "not_needed",
    reasons: signals.wantsHealthCloud
      ? ["Healthcare/clinical domain signals present."]
      : ["No healthcare industry vertical detected."],
    triggers: signals.wantsHealthCloud ? ["healthcare/patient/clinical keywords"] : ["no healthcare trigger"],
  });

  decisions.push({
    key: "financial_services_cloud",
    name: products.financial_services_cloud,
    level: signals.wantsFinancialCloud ? "recommended" : "not_needed",
    reasons: signals.wantsFinancialCloud
      ? ["Financial services vertical signals detected."]
      : ["No financial services vertical detected."],
    triggers: signals.wantsFinancialCloud ? ["financial/banking/wealth management keywords"] : ["no financial services trigger"],
  });

  decisions.push({
    key: "nonprofit_cloud",
    name: products.nonprofit_cloud,
    level: signals.wantsNonprofit ? "recommended" : "not_needed",
    reasons: signals.wantsNonprofit
      ? ["Nonprofit/fundraising domain signals present."]
      : ["No nonprofit vertical detected."],
    triggers: signals.wantsNonprofit ? ["nonprofit/donation/fundraising keywords"] : ["no nonprofit trigger"],
  });

  decisions.push({
    key: "manufacturing_cloud",
    name: products.manufacturing_cloud,
    level: signals.wantsManufacturing ? "recommended" : "not_needed",
    reasons: signals.wantsManufacturing
      ? ["Manufacturing/dealer/distribution signals detected."]
      : ["No manufacturing vertical detected."],
    triggers: signals.wantsManufacturing ? ["manufacturing/dealer/supply chain keywords"] : ["no manufacturing trigger"],
  });

  decisions.push({
    key: "education_cloud",
    name: products.education_cloud,
    level: signals.wantsEducation ? "recommended" : "not_needed",
    reasons: signals.wantsEducation
      ? ["Higher education or student lifecycle signals present."]
      : ["No education vertical detected."],
    triggers: signals.wantsEducation ? ["education/university/student keywords"] : ["no education trigger"],
  });

  decisions.push({
    key: "net_zero_cloud",
    name: products.net_zero_cloud,
    level: signals.wantsNetZero ? "optional" : "not_needed",
    reasons: signals.wantsNetZero
      ? ["Sustainability/ESG/carbon tracking signals detected."]
      : ["No sustainability requirement detected."],
    triggers: signals.wantsNetZero ? ["sustainability/carbon/esg keywords"] : ["no net zero trigger"],
  });

  return decisions;
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
    {
      area: "Industry-specific Process",
      ootbFit: has(signals.rawText.toLowerCase(), ["proprietary", "unique compliance"]) ? "Low" : "Medium",
      customizationLevel: has(signals.rawText.toLowerCase(), ["proprietary", "unique compliance"]) ? "High" : "Medium",
      risk: has(signals.rawText.toLowerCase(), ["proprietary", "unique compliance"]) ? "High" : "Medium",
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
  const recommendedNames = decisions.filter((d) => d.level === "recommended").map((d) => d.name);
  const license = estimateLicenseCost({ userCount: signals.users, recommendedProducts: recommendedNames });

  const enterpriseFloor = signals.users >= 200 ? 200 * 100 * 12 : 0;
  const licenseLow = Math.max(license.totalLow, enterpriseFloor);
  const implementationBand = estimateImplementation({ complexityLevel: signals.complexityLevel, integrationCount: signals.externalSystemsCount });
  const implLow = signals.complexityLevel === "High" ? Math.max(implementationBand.implLow, 150000) : implementationBand.implLow;

  const confidenceScore = Math.max(55, Math.min(94, 62 + countMatches(signals.rawText.toLowerCase(), ["users", "portal", "ai", "erp", "pricing"]) * 6));

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
    executiveSnapshot: {
      primaryFocus: focusParts || "General CRM",
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
      pattern: (system === "Marketing Automation" ? "Event" : system === "ERP" ? "API" : "Batch") as "API" | "Batch" | "Event",
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
      disclaimer: "Directional estimate only. This is not official Salesforce pricing or a quote.",
    },
    roadmap: [
      { phase: "Phase 1 (0–6 weeks)", outcomes: ["Discovery and data model", "Core clouds rollout", "MVP flows and automations"] },
      { phase: "Phase 2 (6–12 weeks)", outcomes: ["Integrations and analytics", "Portal and automation tuning", "User training"] },
      { phase: "Phase 3 (post go-live)", outcomes: ["Optimization", "Advanced AI and governance", "Optional AI/Agentforce rollout"] },
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
      "Change adoption pacing",
    ],
    confidenceScore,
  };
}
