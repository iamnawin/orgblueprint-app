import { IntegrationRecommendation, Signals } from "../types";

const systems: Array<{ system: string; keywords: string[]; pattern: IntegrationRecommendation["pattern"] }> = [
  { system: "SAP", keywords: ["sap", "erp"], pattern: "real-time API" },
  { system: "NetSuite", keywords: ["netsuite"], pattern: "batch sync" },
  { system: "Workday", keywords: ["workday"], pattern: "batch sync" },
  { system: "HubSpot", keywords: ["hubspot"], pattern: "real-time API" },
  { system: "Marketo", keywords: ["marketo"], pattern: "event-driven" },
  { system: "Shopify", keywords: ["shopify"], pattern: "event-driven" },
  { system: "Oracle", keywords: ["oracle"], pattern: "middleware" },
  { system: "Dynamics", keywords: ["dynamics"], pattern: "batch sync" },
  { system: "Snowflake", keywords: ["snowflake"], pattern: "batch sync" },
  { system: "Tableau", keywords: ["tableau"], pattern: "batch sync" },
  { system: "Slack", keywords: ["slack"], pattern: "event-driven" },
  { system: "MuleSoft", keywords: ["mulesoft"], pattern: "middleware" },
  { system: "Boomi", keywords: ["boomi"], pattern: "middleware" },
  { system: "Jira", keywords: ["jira"], pattern: "real-time API" },
  { system: "ServiceNow", keywords: ["servicenow", "service now"], pattern: "real-time API" },
];

function isIntegration(
  integration: IntegrationRecommendation | null
): integration is IntegrationRecommendation {
  return integration !== null;
}

export function buildIntegrationMap(signals: Signals): IntegrationRecommendation[] {
  const text = signals.rawText.toLowerCase();
  const detected = systems
    .map((entry): IntegrationRecommendation | null => {
      const detectedFrom = entry.keywords.find((keyword) => text.includes(keyword));
      if (!detectedFrom) return null;
      return {
        system: entry.system,
        type: "bidirectional" as const,
        pattern: entry.pattern,
        notes: `${entry.system} should be integrated only for the detected ${detectedFrom} requirement.`,
        detectedFrom,
      };
    });

  return detected.filter(isIntegration);
}
