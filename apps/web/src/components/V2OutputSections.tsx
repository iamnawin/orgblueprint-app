import type { BlueprintResult } from "@orgblueprint/core";
import type { ReactNode } from "react";

type BlueprintResultV2View = Extract<BlueprintResult, { schemaVersion: "v2" }>;

export function isV2Blueprint(result: BlueprintResult): result is BlueprintResultV2View {
  return result.schemaVersion === "v2";
}

const sectionStyle = {
  background: "#ffffff",
  border: "1px solid #e2e8f0",
  borderRadius: 10,
  padding: 20,
  marginBottom: 18,
} as const;

const titleStyle = {
  fontSize: 17,
  fontWeight: 700,
  color: "#1e293b",
  marginBottom: 12,
  paddingBottom: 8,
  borderBottom: "1px solid #e2e8f0",
} as const;

const gridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: 10,
} as const;

const itemStyle = {
  border: "1px solid #e2e8f0",
  borderRadius: 8,
  padding: 12,
  background: "#f8fafc",
} as const;

const labelStyle = {
  fontSize: 11,
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.04em",
  color: "#64748b",
  marginBottom: 4,
} as const;

function processLabel(result: BlueprintResultV2View) {
  return result.analysis.primaryProcess.replace(/_/g, " ");
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section style={sectionStyle}>
      <h2 style={titleStyle}>{title}</h2>
      {children}
    </section>
  );
}

function Item({ label, value, detail }: { label: string; value: string; detail?: string }) {
  return (
    <div style={itemStyle}>
      <div style={labelStyle}>{label}</div>
      <div style={{ fontSize: 14, fontWeight: 700, color: "#1e293b" }}>{value}</div>
      {detail && <p style={{ marginTop: 4, fontSize: 12, color: "#64748b" }}>{detail}</p>}
    </div>
  );
}

export function V2OutputSections({ result }: { result: BlueprintResult }) {
  if (!isV2Blueprint(result)) return null;

  const objects = [...result.objectModel.standard, ...result.objectModel.custom];
  const activeRecommendations = result.recommendations.filter((item) => item.level !== "not_needed");

  return (
    <div data-testid="v2-output-sections">
      <Section title="Process Analysis">
        <div style={gridStyle}>
          <Item label="Primary Process" value={processLabel(result)} detail={`Industry: ${result.analysis.industry}`} />
          <Item label="Blueprint Confidence" value={`${result.blueprintConfidence}%`} detail="Deterministic rules-engine confidence" />
          <Item label="Personas" value={result.analysis.personas.map((persona) => persona.name).join(", ") || "Not detected"} />
        </div>
      </Section>

      <Section title="Business Capabilities">
        <div style={gridStyle}>
          {result.capabilities.map((capability) => (
            <Item key={capability.id} label={capability.confidence} value={capability.name} detail={capability.description} />
          ))}
        </div>
      </Section>

      <Section title="Salesforce Recommendations">
        <div style={gridStyle}>
          {activeRecommendations.map((recommendation) => (
            <Item
              key={recommendation.product}
              label={`${recommendation.confidence}% ${recommendation.level}`}
              value={recommendation.product}
              detail={recommendation.reason}
            />
          ))}
        </div>
      </Section>

      <Section title="Object Model">
        <div style={gridStyle}>
          {objects.slice(0, 8).map((object) => (
            <Item key={`${object.type}-${object.name}`} label={object.type} value={object.name} detail={object.purpose} />
          ))}
        </div>
      </Section>

      <Section title="Automations">
        <div style={gridStyle}>
          {result.automations.map((automation) => (
            <Item key={automation.name} label={`${automation.type} / ${automation.complexity}`} value={automation.name} detail={automation.purpose} />
          ))}
        </div>
      </Section>

      <Section title="Integrations">
        {result.integrations.length === 0 ? (
          <p style={{ fontSize: 13, color: "#64748b" }}>No integration keywords detected in the input.</p>
        ) : (
          <div style={gridStyle}>
            {result.integrations.map((integration) => (
              <Item key={`${integration.system}-${integration.detectedFrom}`} label={`${integration.pattern} / ${integration.type}`} value={integration.system} detail={integration.notes} />
            ))}
          </div>
        )}
      </Section>

      <Section title="Analytics">
        <div style={gridStyle}>
          {result.analytics.map((item) => (
            <Item key={item.name} label={`${item.audience} / ${item.type}`} value={item.name} />
          ))}
        </div>
      </Section>

      <Section title="Security">
        <div style={gridStyle}>
          <Item label="Sharing Model" value={result.security.sharingModel} detail={result.security.recordLevelAccess} />
          <Item label="Permission Sets" value={result.security.permissionSets.join(", ")} />
        </div>
      </Section>

      <Section title="AI Readiness">
        <div style={gridStyle}>
          <Item label="Readiness Score" value={String(result.aiReadiness.score)} detail="Based on data, automation, and AI signals." />
          <Item label="Blockers" value={result.aiReadiness.blockers.join(", ")} />
        </div>
      </Section>

      <Section title="Risks & Assumptions">
        <div style={gridStyle}>
          {result.risks.slice(0, 3).map((risk) => (
            <Item key={risk.title} label={risk.severity} value={risk.title} detail={risk.mitigation} />
          ))}
          {result.assumptions.slice(0, 3).map((assumption) => (
            <Item key={assumption.id} label={assumption.category} value={assumption.text} />
          ))}
        </div>
      </Section>

      <Section title="User Stories">
        <div style={gridStyle}>
          {result.userStories.map((story) => (
            <Item key={`${story.persona}-${story.action}`} label={story.persona} value={`Can ${story.action}`} detail={`So ${story.outcome}.`} />
          ))}
        </div>
      </Section>
    </div>
  );
}

function compareValue(result: BlueprintResult, value: (v2: BlueprintResultV2View) => string) {
  return isV2Blueprint(result) ? value(result) : "Legacy blueprint";
}

export function V2CompareSummary({ resultA, resultB }: { resultA: BlueprintResult; resultB: BlueprintResult }) {
  if (!isV2Blueprint(resultA) && !isV2Blueprint(resultB)) return null;

  const rows = [
    {
      label: "Process Analysis",
      a: compareValue(resultA, processLabel),
      b: compareValue(resultB, processLabel),
    },
    {
      label: "Business Capabilities",
      a: compareValue(resultA, (result) => result.capabilities.map((item) => item.name).slice(0, 3).join(", ")),
      b: compareValue(resultB, (result) => result.capabilities.map((item) => item.name).slice(0, 3).join(", ")),
    },
    {
      label: "Salesforce Recommendations",
      a: compareValue(resultA, (result) => result.recommendations.filter((item) => item.level !== "not_needed").map((item) => item.product).slice(0, 3).join(", ")),
      b: compareValue(resultB, (result) => result.recommendations.filter((item) => item.level !== "not_needed").map((item) => item.product).slice(0, 3).join(", ")),
    },
    {
      label: "Object Model",
      a: compareValue(resultA, (result) => `${result.objectModel.standard.length} standard, ${result.objectModel.custom.length} custom`),
      b: compareValue(resultB, (result) => `${result.objectModel.standard.length} standard, ${result.objectModel.custom.length} custom`),
    },
    {
      label: "Automations",
      a: compareValue(resultA, (result) => result.automations.map((item) => item.name).slice(0, 3).join(", ")),
      b: compareValue(resultB, (result) => result.automations.map((item) => item.name).slice(0, 3).join(", ")),
    },
    {
      label: "Integrations",
      a: compareValue(resultA, (result) => result.integrations.map((item) => item.system).join(", ") || "No systems detected"),
      b: compareValue(resultB, (result) => result.integrations.map((item) => item.system).join(", ") || "No systems detected"),
    },
    {
      label: "Analytics",
      a: compareValue(resultA, (result) => result.analytics.map((item) => item.name).slice(0, 3).join(", ")),
      b: compareValue(resultB, (result) => result.analytics.map((item) => item.name).slice(0, 3).join(", ")),
    },
    {
      label: "Security",
      a: compareValue(resultA, (result) => result.security.sharingModel),
      b: compareValue(resultB, (result) => result.security.sharingModel),
    },
    {
      label: "AI Readiness",
      a: compareValue(resultA, (result) => `${result.aiReadiness.score}/100`),
      b: compareValue(resultB, (result) => `${result.aiReadiness.score}/100`),
    },
    {
      label: "Risks & Assumptions",
      a: compareValue(resultA, (result) => `${result.risks.length} risks, ${result.assumptions.length} assumptions`),
      b: compareValue(resultB, (result) => `${result.risks.length} risks, ${result.assumptions.length} assumptions`),
    },
    {
      label: "User Stories",
      a: compareValue(resultA, (result) => result.userStories.map((story) => story.persona).join(", ")),
      b: compareValue(resultB, (result) => result.userStories.map((story) => story.persona).join(", ")),
    },
  ];

  return (
    <section className="mb-6 rounded-lg border border-blue-200 bg-blue-50/40 p-4">
      <h2 className="mb-3 text-base font-semibold text-slate-900">V2 Blueprint Intelligence</h2>
      <div className="space-y-2">
        {rows.map((row) => (
          <div key={row.label} className="grid grid-cols-[150px_1fr_1fr] gap-3 border-b border-blue-100 pb-2 text-xs last:border-0 last:pb-0">
            <p className="font-semibold text-blue-700">{row.label}</p>
            <p className="text-slate-700">{row.a}</p>
            <p className="text-slate-700">{row.b}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
