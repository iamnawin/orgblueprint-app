import assert from "node:assert/strict";
import { generateBlueprint } from "../src/rules";
import { normalizeBlueprintResult } from "../src/normalizer";

const input =
  "We are an enterprise retail company with 500+ users… need real-time unified customer profiles, AI-driven service automation, and a self-service customer portal… complex pricing… ERP, ecommerce, marketing automation.";

const result = generateBlueprint(input, {});
const byName = Object.fromEntries(result.products.map((p) => [p.name, p.level]));

assert.ok(result.executiveSnapshot.usersDetected >= 500);
assert.equal(byName["Experience Cloud"], "recommended");
assert.equal(byName["Data Cloud"], "recommended");
assert.equal(byName["Revenue Cloud / CPQ"], "recommended");
assert.equal(byName["Field Service"], "not_needed");

console.log("Regression fixture passed");

const fieldService = generateBlueprint(
  "Home services company with 40 field technicians. We need work orders, dispatch scheduling, mobile service appointments, SLA tracking, and offline updates.",
  {}
);

assert.equal(fieldService.schemaVersion, "v2");
assert.equal(fieldService.analysis.primaryProcess, "field_service_execution");
assert.equal(
  fieldService.recommendations.find((r) => r.product === "Field Service")?.level,
  "recommended"
);
assert.ok(fieldService.analytics.some((item) => item.name.includes("Work Order")));
assert.ok(fieldService.roadmap.length >= 5);
assert.ok(fieldService.clarifyingQuestions.length >= 5);
assert.equal(fieldService.integrations.length, 0);

const sales = generateBlueprint(
  "B2B software sales team of 60 account executives needs lead routing, opportunity pipeline stages, forecast accuracy, quotes, and discount approvals.",
  {}
);

assert.equal(sales.analysis.primaryProcess, "sales_pipeline");
assert.equal(sales.recommendations.find((r) => r.product === "Sales Cloud")?.level, "recommended");
assert.notDeepEqual(
  fieldService.analytics.map((item) => item.name),
  sales.analytics.map((item) => item.name)
);
assert.ok(
  sales.whyMapping.some((row) => row.why.toLowerCase().includes("pipeline") || row.why.toLowerCase().includes("forecast")),
  "whyMapping should reference detected signals"
);

const employeeWorkflow = generateBlueprint(
  "Internal employee request app for HR approvals, IT helpdesk requests, leave approvals, and manager review workflows.",
  {}
);

assert.equal(employeeWorkflow.analysis.primaryProcess, "employee_request");
assert.equal(
  employeeWorkflow.recommendations.find((r) => r.product === "Salesforce Platform")?.level,
  "recommended"
);

const normalized = normalizeBlueprintResult({
  products: [
    {
      key: "sales_cloud",
      name: "Sales Cloud",
      level: "recommended",
      reasons: ["Lead and opportunity needs detected."],
      triggers: ["lead"],
    },
  ],
  whyMapping: [{ need: "Sales", product: "Sales Cloud", why: "Lead and opportunity needs detected." }],
  ootbVsCustom: [],
  objectsAndAutomations: ["Objects: Account, Contact", "Flow: Lead routing"],
  integrationMap: [],
  analyticsPack: ["Pipeline by stage"],
  costEstimate: {
    license: { breakdown: [], totalLow: 0, totalHigh: 0 },
    implementation: { low: 0, high: 0, rationale: "" },
    yearOneTotal: { low: 0, high: 0 },
    assumptions: [],
    disclaimer: "Directional estimate only. This is not official Salesforce pricing or a quote.",
  },
  roadmap: [{ phase: "Phase 1", outcomes: ["Discovery"] }],
  documentChecklist: [],
  risks: ["Data quality"],
  confidenceScore: 70,
});

assert.equal(normalized.schemaVersion, "v2");
assert.equal(normalized.objectModel.custom.length, 1);
assert.equal(normalized.automations.length, 1);
assert.equal(normalized.risks[0].severity, "medium");
assert.ok(normalized.roadmap.length >= 5);

console.log("V2 blueprint fixture passed");
