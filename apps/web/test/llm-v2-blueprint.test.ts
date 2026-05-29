import assert from "node:assert/strict";
import { buildBlueprintPrompt, parseBlueprintJson } from "../src/lib/anthropic";

const prompt = buildBlueprintPrompt(
  "B2B sales team needs pipeline management, quoting, ERP integration, executive dashboards, and secure approval workflows.",
  "Q: How many users?\nA: 75"
);

for (const required of [
  '"schemaVersion": "v2"',
  '"analysis"',
  '"capabilities"',
  '"recommendations"',
  '"objectModel"',
  '"automations"',
  '"integrations"',
  '"analytics"',
  '"risks"',
  '"roadmap"',
  '"assumptions"',
  '"clarifyingQuestions"',
  '"security"',
  '"aiReadiness"',
  '"userStories"',
  '"products"',
  '"whyMapping"',
  '"objectsAndAutomations"',
  '"analyticsPack"',
  '"integrationMap"',
]) {
  assert.ok(prompt.includes(required), `Prompt should require ${required}`);
}

const normalized = parseBlueprintJson(JSON.stringify({
  schemaVersion: "v2",
  executiveSnapshot: {
    primaryFocus: "sales_pipeline",
    usersDetected: 75,
    userCountBand: "50-199",
    complexityLevel: "Medium",
    confidenceScore: 78,
  },
  products: [
    {
      key: "sales_cloud",
      name: "Sales Cloud",
      level: "recommended",
      reasons: ["Pipeline management and forecasting are primary needs."],
      triggers: ["pipeline"],
    },
    {
      key: "made_up_cloud",
      name: "Made Up Cloud",
      level: "recommended",
      reasons: ["Invalid model output should be removed."],
      triggers: ["invalid"],
    },
  ],
  whyMapping: [{ need: "Pipeline", product: "Sales Cloud", why: "Sales Cloud supports opportunities and forecasting." }],
  ootbVsCustom: [],
  objectsAndAutomations: ["Objects: Account, Contact, Opportunity", "Flow: Discount approval"],
  integrationMap: [{ system: "ERP", pattern: "API" }],
  analyticsPack: ["Pipeline dashboard"],
  costEstimate: {
    license: { breakdown: [], totalLow: 0, totalHigh: 0 },
    implementation: { low: 0, high: 0, rationale: "Directional placeholder." },
    yearOneTotal: { low: 0, high: 0 },
    assumptions: ["75 users"],
    disclaimer: "Directional estimate only. This is not official Salesforce pricing or a quote.",
  },
  roadmap: [{ phase: "Phase 1", outcomes: ["Discovery"] }],
  documentChecklist: ["Data dictionary"],
  risks: [{ title: "ERP data quality", description: "ERP data quality may delay migration.", severity: "medium", mitigation: "Profile source data early.", category: "data" }],
  confidenceScore: 78,
  analysis: {
    primaryProcess: "sales_pipeline",
    secondaryProcesses: ["data_integration"],
    industry: "software",
    personas: [{ name: "Sales Rep", type: "internal", accessLevel: "full" }],
    hasExternalUsers: false,
    hasMobileRequirement: false,
    hasAISignals: false,
    hasIntegrationSignals: true,
    hasDataMigration: false,
    detectedSignals: ["pipeline", "ERP"],
    missingInfo: [],
  },
  capabilities: [{ id: "cap-sales", name: "Pipeline Management", description: "Manage opportunities.", confidence: "high", sourcedFrom: ["pipeline"] }],
  recommendations: [{ product: "Sales Cloud", level: "recommended", confidence: 86, reason: "Pipeline management is required.", capabilities: ["Pipeline Management"] }],
}));

assert.equal(normalized.schemaVersion, "v2");
assert.equal(normalized.products.length, 1);
assert.equal(normalized.products[0].key, "sales_cloud");
assert.ok(normalized.security.mfaRecommended);
assert.ok(normalized.aiReadiness.blockers.length >= 1);
assert.ok(normalized.assumptions.length >= 1);
assert.ok(normalized.clarifyingQuestions.length >= 1);
assert.ok(normalized.userStories.length >= 0);
assert.ok(normalized.automations.length >= 1);
assert.ok(normalized.analytics.length >= 1);
assert.ok(normalized.roadmap.length >= 5);
assert.equal(normalized.blueprintConfidence, 78);

console.log("LLM v2 blueprint prompt and parser fixture passed");
