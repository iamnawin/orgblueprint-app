import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { generateBlueprint } from "@orgblueprint/core";

(globalThis as typeof globalThis & { React: typeof React }).React = React;

async function main() {
  const { BlueprintDashboard } = await import("../src/components/BlueprintDashboard");

  const result = generateBlueprint(
    "Home services company with 40 field technicians. We need work orders, dispatch scheduling, mobile service appointments, SLA tracking, offline updates, and SAP integration.",
    {}
  );

  const html = renderToStaticMarkup(
    <BlueprintDashboard
      result={result}
      slug={null}
      isOwner={false}
      needText={result.analysis.detectedSignals.join(" ")}
    />
  );

  [
    "Process Analysis",
    "Business Capabilities",
    "Salesforce Recommendations",
    "Field Service Execution",
    "Field Workforce Dispatch",
    "AI Readiness",
    "Assumptions",
  ].forEach((text) => {
    assert.ok(html.includes(text), `Expected dashboard markup to include "${text}"`);
  });

  console.log("V2 dashboard render fixture passed");
}

main();
