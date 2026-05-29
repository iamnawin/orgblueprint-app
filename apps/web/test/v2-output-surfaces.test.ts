import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { generateBlueprint } from "@orgblueprint/core";
import { V2OutputSections } from "../src/components/V2OutputSections";

(globalThis as typeof globalThis & { React: typeof React }).React = React;

const root = process.cwd();

const componentSource = readFileSync(join(root, "src/components/V2OutputSections.tsx"), "utf8");

const requiredLabels = [
  "Process Analysis",
  "Business Capabilities",
  "Salesforce Recommendations",
  "Object Model",
  "Automations",
  "Integrations",
  "Analytics",
  "Security",
  "AI Readiness",
  "Risks & Assumptions",
  "User Stories",
];

for (const label of requiredLabels) {
  assert.ok(componentSource.includes(label), `V2OutputSections should expose "${label}"`);
}

const printSource = readFileSync(join(root, "src/app/blueprint/[slug]/print/page.tsx"), "utf8");
const shareSource = readFileSync(join(root, "src/app/blueprint/[slug]/share/page.tsx"), "utf8");
const compareSource = readFileSync(join(root, "src/app/compare/page.tsx"), "utf8");
const pdfSource = readFileSync(join(root, "src/lib/exportPdf.ts"), "utf8");
const wizardSource = readFileSync(join(root, "src/components/BlueprintWizard.tsx"), "utf8");

assert.ok(printSource.includes("V2OutputSections"), "print page should render shared v2 output sections");
assert.ok(shareSource.includes("V2OutputSections"), "share page should render shared v2 output sections");
assert.ok(wizardSource.includes("V2OutputSections"), "wizard results should render shared v2 output sections");
assert.ok(compareSource.includes("V2CompareSummary"), "compare page should render v2 comparison summary");
assert.ok(pdfSource.includes("addV2PdfSections"), "PDF export should add v2-specific sections");

const result = generateBlueprint(
  "Manufacturer needs dealer portal, order approvals, SAP integration, service cases, dashboards, and AI recommendations.",
  {}
);
const html = renderToStaticMarkup(React.createElement(V2OutputSections, { result })).replace(/&amp;/g, "&");

for (const label of requiredLabels) {
  assert.ok(html.includes(label), `Rendered v2 output sections should include "${label}"`);
}

console.log("V2 output surface coverage passed");
