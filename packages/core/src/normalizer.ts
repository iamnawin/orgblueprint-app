import {
  AnalyticsRecommendation,
  AutomationRecommendation,
  BlueprintResult,
  BlueprintResultV1,
  BlueprintResultV2,
  ObjectRecommendation,
  RiskItem,
  RoadmapPhase,
} from "./types";

function emptyV2Fallback(result: BlueprintResultV1): Pick<
  BlueprintResultV2,
  "analysis" | "capabilities" | "recommendations" | "security" | "aiReadiness" | "assumptions" | "clarifyingQuestions" | "userStories" | "blueprintConfidence"
> {
  return {
    analysis: {
      primaryProcess: "custom_workflow",
      secondaryProcesses: [],
      industry: "unknown",
      personas: [{ name: "Business User", type: "internal", accessLevel: "full" }],
      hasExternalUsers: false,
      hasMobileRequirement: false,
      hasAISignals: false,
      hasIntegrationSignals: false,
      hasDataMigration: false,
      detectedSignals: [],
      missingInfo: ["not_available_for_older_blueprint"],
    },
    capabilities: [],
    recommendations: result.products.map((product) => ({
      product: product.name,
      level: product.level,
      confidence: product.level === "recommended" ? 70 : product.level === "optional" ? 55 : 20,
      reason: result.whyMapping.find((row) => row.product === product.name)?.why ?? product.reasons[0] ?? "Converted from older blueprint.",
      capabilities: [],
    })),
    security: {
      profiles: ["System Administrator", "Standard User"],
      permissionSets: ["Blueprint Core Access"],
      sharingModel: "Public Read Only",
      recordLevelAccess: "Older blueprint did not include a security model.",
      mfaRecommended: true,
      notes: "Generated fallback security model for older blueprint compatibility.",
    },
    aiReadiness: {
      score: 20,
      readyFor: [],
      blockers: ["Older blueprint did not include AI readiness analysis."],
      agentforceUseCases: [],
    },
    assumptions: [
      { id: "legacy-1", text: "This blueprint was created before structured assumptions were available.", category: "scope" },
      { id: "legacy-2", text: "Validate users, process scope, and integration requirements before implementation.", category: "process" },
      { id: "legacy-3", text: "Confirm data migration expectations during discovery.", category: "data" },
    ],
    clarifyingQuestions: [
      { id: "legacy-q1", question: "Which users and teams need access?", why: "Older blueprints did not capture structured personas.", category: "users" },
      { id: "legacy-q2", question: "Which systems must integrate with Salesforce?", why: "Integration scope changes implementation risk.", category: "integration" },
      { id: "legacy-q3", question: "What are the MVP process boundaries?", why: "Scope drives delivery phasing.", category: "scope" },
      { id: "legacy-q4", question: "What data must be migrated?", why: "Data quality affects readiness.", category: "data" },
      { id: "legacy-q5", question: "What timeline is required?", why: "Timeline changes staffing and roadmap assumptions.", category: "timeline" },
    ],
    userStories: [],
    blueprintConfidence: result.confidenceScore,
  };
}

function normalizeObjects(items: string[]): { custom: ObjectRecommendation[]; automations: AutomationRecommendation[] } {
  const custom: ObjectRecommendation[] = [];
  const automations: AutomationRecommendation[] = [];

  for (const item of items) {
    if (/(flow|apex|process|automation)/i.test(item)) {
      automations.push({
        name: item,
        type: item.toLowerCase().includes("apex") ? "Apex Trigger" : "Record-Triggered Flow",
        trigger: "Converted from older blueprint text",
        purpose: item,
        complexity: "medium",
      });
    } else {
      custom.push({
        name: item.replace(/^Objects?:\s*/i, ""),
        type: "custom",
        purpose: item,
        keyFields: [],
        relationships: [],
      });
    }
  }

  return { custom, automations };
}

function normalizeRisks(risks: string[]): RiskItem[] {
  return risks.map((risk) => ({
    title: risk,
    description: risk,
    severity: "medium",
    mitigation: "Validate during discovery and add an owner before delivery starts.",
    category: "technical",
  }));
}

function normalizeRoadmap(roadmap: BlueprintResultV1["roadmap"]): RoadmapPhase[] {
  const converted = roadmap.map((phase, index) => ({
    phase: index + 1,
    title: phase.phase,
    duration: "4-6 weeks",
    deliverables: phase.outcomes,
    outcomes: phase.outcomes,
    sfProducts: [],
    milestone: phase.outcomes[0] ?? "Phase complete",
  }));

  while (converted.length < 5) {
    const next = converted.length + 1;
    converted.push({
      phase: next,
      title: next === 4 ? "Reporting & Analytics" : "AI & Advanced Features",
      duration: "4-6 weeks",
      deliverables: next === 4 ? ["Dashboards", "Reports", "KPI validation"] : ["Enhancement backlog", "AI readiness review"],
      outcomes: next === 4 ? ["Dashboards", "Reports", "KPI validation"] : ["Enhancement backlog", "AI readiness review"],
      sfProducts: [],
      milestone: next === 4 ? "Reporting pack approved" : "Optimization roadmap approved",
    });
  }

  return converted;
}

function isStructuredRisk(risk: unknown): risk is RiskItem {
  return typeof risk === "object" && risk !== null && "severity" in risk && "mitigation" in risk;
}

function isStructuredRoadmapPhase(phase: unknown): phase is RoadmapPhase {
  return typeof phase === "object" && phase !== null && "title" in phase && "deliverables" in phase && "milestone" in phase;
}

export function normalizeBlueprintResult(result: BlueprintResult): BlueprintResultV2 {
  if ((result as BlueprintResultV2).schemaVersion === "v2") {
    const partial = result as Partial<BlueprintResultV2> & BlueprintResultV1;
    const legacyRoadmap = partial.legacyRoadmap ?? (
      (partial.roadmap ?? []).every(isStructuredRoadmapPhase) ? [] : partial.roadmap as BlueprintResultV1["roadmap"] ?? []
    );
    const legacyRisks = partial.legacyRisks ?? (
      (partial.risks ?? []).every(isStructuredRisk) ? [] : partial.risks as string[] ?? []
    );
    const legacy: BlueprintResultV1 = {
      schemaVersion: "v1",
      executiveSnapshot: partial.executiveSnapshot ?? {
        primaryFocus: "custom_workflow",
        usersDetected: 0,
        userCountBand: "1-49",
        complexityLevel: "Low",
        confidenceScore: partial.blueprintConfidence ?? partial.confidenceScore ?? 50,
      },
      products: partial.products ?? [],
      whyMapping: partial.whyMapping ?? [],
      ootbVsCustom: partial.ootbVsCustom ?? [],
      objectsAndAutomations: partial.objectsAndAutomations ?? [],
      integrationMap: partial.integrationMap ?? [],
      analyticsPack: partial.analyticsPack ?? [],
      costEstimate: partial.costEstimate ?? {
        license: { breakdown: [], totalLow: 0, totalHigh: 0 },
        implementation: { low: 0, high: 0, rationale: "" },
        yearOneTotal: { low: 0, high: 0 },
        assumptions: [],
        disclaimer: "Directional estimate only. This is not official Salesforce pricing or a quote.",
      },
      roadmap: legacyRoadmap,
      documentChecklist: partial.documentChecklist ?? [],
      risks: legacyRisks,
      confidenceScore: partial.confidenceScore ?? partial.blueprintConfidence ?? 50,
      perUserCostData: partial.perUserCostData,
    };
    const objectProjection = normalizeObjects(legacy.objectsAndAutomations);
    const fallback = emptyV2Fallback(legacy);

    return {
      ...legacy,
      ...partial,
      schemaVersion: "v2",
      analysis: partial.analysis ?? fallback.analysis,
      capabilities: partial.capabilities ?? fallback.capabilities,
      recommendations: partial.recommendations ?? fallback.recommendations,
      objectModel: partial.objectModel ?? { standard: [], custom: objectProjection.custom },
      automations: partial.automations ?? objectProjection.automations,
      integrations: partial.integrations ?? legacy.integrationMap.map((item) => ({
        system: item.system,
        type: "bidirectional" as const,
        pattern: item.pattern === "Event" ? "event-driven" as const : item.pattern === "Batch" ? "batch sync" as const : "real-time API" as const,
        notes: "Converted from compatibility projection.",
        detectedFrom: item.system,
      })),
      analytics: partial.analytics ?? legacy.analyticsPack.map((item) => ({
        name: item,
        type: "Report" as const,
        audience: "Manager",
        description: item,
      })),
      risks: partial.risks?.every(isStructuredRisk) ? partial.risks : normalizeRisks(legacy.risks),
      roadmap: partial.roadmap?.every(isStructuredRoadmapPhase) ? partial.roadmap : normalizeRoadmap(legacy.roadmap),
      assumptions: partial.assumptions ?? fallback.assumptions,
      clarifyingQuestions: partial.clarifyingQuestions ?? fallback.clarifyingQuestions,
      security: partial.security ?? fallback.security,
      aiReadiness: partial.aiReadiness ?? fallback.aiReadiness,
      userStories: partial.userStories ?? fallback.userStories,
      blueprintConfidence: partial.blueprintConfidence ?? partial.confidenceScore ?? fallback.blueprintConfidence,
      integrationMap: partial.integrationMap ?? legacy.integrationMap,
      analyticsPack: partial.analyticsPack ?? legacy.analyticsPack,
      legacyRoadmap,
      legacyRisks,
    };
  }

  const legacy = result as BlueprintResultV1;
  const objectProjection = normalizeObjects(legacy.objectsAndAutomations ?? []);
  const analytics: AnalyticsRecommendation[] = (legacy.analyticsPack ?? []).map((item) => ({
    name: item,
    type: "Report",
    audience: "Manager",
    description: item,
  }));
  const integrations = (legacy.integrationMap ?? []).map((item) => ({
    system: item.system,
    type: "bidirectional" as const,
    pattern: item.pattern === "Event" ? "event-driven" as const : item.pattern === "Batch" ? "batch sync" as const : "real-time API" as const,
    notes: "Converted from older integration map.",
    detectedFrom: item.system,
  }));
  const roadmap = normalizeRoadmap(legacy.roadmap ?? []);
  const fallback = emptyV2Fallback(legacy);

  return {
    ...legacy,
    ...fallback,
    schemaVersion: "v2",
    recommendations: fallback.recommendations,
    objectModel: { standard: [], custom: objectProjection.custom },
    automations: objectProjection.automations,
    integrations,
    analytics,
    risks: normalizeRisks(legacy.risks ?? []),
    roadmap,
    integrationMap: legacy.integrationMap ?? [],
    analyticsPack: legacy.analyticsPack ?? [],
    legacyRoadmap: legacy.roadmap ?? [],
    legacyRisks: legacy.risks ?? [],
  };
}
