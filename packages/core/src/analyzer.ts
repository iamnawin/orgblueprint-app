import { ClarificationAnswers, Persona, ProcessType, RequirementAnalysis, Signals } from "./types";

const processKeywords: Record<ProcessType, string[]> = {
  sales_pipeline: ["pipeline", "forecast", "opportunity", "quote", "lead", "account executive", "deal", "revenue"],
  case_management: ["ticket", "case", "escalation", "support", "helpdesk", "help desk", "sla", "resolution", "customer service"],
  field_service_execution: ["work order", "work orders", "field tech", "field technician", "field technicians", "scheduling", "dispatch", "service appointment", "mobile"],
  portal_self_service: ["portal", "self-service", "self service", "external users", "community", "partner", "customer login", "partner login"],
  retail_execution: ["store visit", "planogram", "retail audit", "shelf", "field rep", "perfect store"],
  employee_request: ["employee", "hr", "it request", "leave", "internal approval", "manager review", "onboarding"],
  vendor_onboarding: ["vendor", "supplier", "procurement", "rfp", "sourcing"],
  contract_review: ["contract", "clm", "nda", "legal", "redline", "signature"],
  compliance_audit: ["audit", "compliance", "regulatory", "inspection", "checklist", "scoring"],
  asset_tracking: ["asset", "equipment", "inventory", "serial number", "warranty", "maintenance"],
  survey_feedback: ["survey", "nps", "feedback", "satisfaction", "response collection"],
  data_integration: ["data migration", "sync", "api", "middleware", "etl", "integration hub"],
  executive_reporting: ["dashboard", "kpi", "report", "analytics", "executive", "forecast accuracy"],
  custom_workflow: ["workflow", "approval", "request", "process"],
};

const integrationKeywords = [
  "sap",
  "netsuite",
  "workday",
  "hubspot",
  "marketo",
  "shopify",
  "oracle",
  "dynamics",
  "snowflake",
  "tableau",
  "slack",
  "mulesoft",
  "boomi",
  "jira",
  "servicenow",
  "erp",
];

function isPersona(persona: Persona | null): persona is Persona {
  return persona !== null;
}

function findSignals(text: string, keywords: string[]): string[] {
  return keywords.filter((keyword) => text.includes(keyword));
}

function rankProcesses(text: string): Array<{ process: ProcessType; signals: string[] }> {
  return (Object.entries(processKeywords) as Array<[ProcessType, string[]]>)
    .map(([process, keywords]) => ({ process, signals: findSignals(text, keywords) }))
    .filter((match) => match.signals.length > 0)
    .sort((a, b) => b.signals.length - a.signals.length);
}

function detectIndustry(text: string, answers: ClarificationAnswers): string {
  if (answers.industryVertical) return answers.industryVertical;
  if (/(healthcare|patient|clinic|hospital|pharma)/.test(text)) return "healthcare";
  if (/(financial services|banking|insurance|wealth)/.test(text)) return "financial_services";
  if (/(nonprofit|fundraising|donation)/.test(text)) return "nonprofit";
  if (/(manufacturing|factory|dealer|distributor)/.test(text)) return "manufacturing";
  if (/(retail|store|planogram|shelf)/.test(text)) return "retail";
  return "unknown";
}

export function analyzeRequirements(
  input: string,
  signals: Signals,
  answers: ClarificationAnswers = {}
): RequirementAnalysis {
  const text = input.toLowerCase();
  const ranked = rankProcesses(text);
  const primaryProcess = ranked[0]?.process ?? (signals.wantsSales ? "sales_pipeline" : signals.wantsService ? "case_management" : "custom_workflow");
  const detectedSignals = [...new Set(ranked.flatMap((match) => match.signals))];
  const hasExternalUsers = signals.portalNeed || /(external users|customer login|partner login|vendor portal)/.test(text);
  const hasMobileRequirement = signals.wantsFieldService || /(mobile|offline|technician|field)/.test(text);
  const hasIntegrationSignals = signals.externalSystemsCount > 0 || integrationKeywords.some((keyword) => text.includes(keyword));
  const personaCandidates: Array<Persona | null> = [
    primaryProcess === "sales_pipeline" ? { name: "Sales Rep", type: "internal" as const, accessLevel: "full" as const } : null,
    primaryProcess === "case_management" ? { name: "Support Agent", type: "internal" as const, accessLevel: "full" as const } : null,
    primaryProcess === "field_service_execution" ? { name: "Field Technician", type: "internal" as const, accessLevel: "limited" as const } : null,
    primaryProcess === "retail_execution" ? { name: "Field Retail Rep", type: "internal" as const, accessLevel: "limited" as const } : null,
    primaryProcess === "employee_request" ? { name: "Employee", type: "internal" as const, accessLevel: "limited" as const } : null,
    hasExternalUsers ? { name: text.includes("partner") ? "Partner User" : "Customer", type: text.includes("partner") ? "partner" as const : "external" as const, accessLevel: "self-service" as const } : null,
  ];
  const personas = personaCandidates.filter(isPersona);

  const missingInfo = [
    !/\b\d[\d,]*\s+(users?|employees?|technicians?|agents?|reps?|people)\b/.test(text) && !answers.users ? "no_users_mentioned" : null,
    !hasIntegrationSignals ? "no_integrations_mentioned" : null,
    detectedSignals.length < 2 ? "weak_process_detail" : null,
  ].filter(Boolean) as string[];

  return {
    primaryProcess,
    secondaryProcesses: ranked.slice(1, 4).map((match) => match.process),
    industry: detectIndustry(text, answers),
    personas: personas.length ? personas : [{ name: "Business User", type: "internal", accessLevel: "full" }],
    hasExternalUsers,
    hasMobileRequirement,
    hasAISignals: signals.aiAutomationIntent || /(ai|agentforce|einstein|chatbot|copilot|automation)/.test(text),
    hasIntegrationSignals,
    hasDataMigration: /(migration|migrate|legacy data|import)/.test(text),
    detectedSignals,
    missingInfo,
  };
}
