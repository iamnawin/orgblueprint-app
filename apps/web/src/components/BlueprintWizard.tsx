"use client";

import { BlueprintResult, ClarificationAnswers } from "@orgblueprint/core";
import { useMemo, useState } from "react";

type Stage = "landing" | "describe" | "questions" | "confirm" | "results";

const questionDefs = [
  { key: "users", label: "How many Salesforce users will be in phase 1?", type: "number" },
  { key: "primaryTeams", label: "Which team is highest priority (sales/service/both)?", type: "text" },
  { key: "externalSystemsCount", label: "How many external systems need integration?", type: "number" },
  { key: "needsSelfServicePortal", label: "Need a customer/partner self-service portal?", type: "boolean" },
  { key: "fieldOps", label: "Do you run field teams (technicians/dispatch)?", type: "boolean" },
  { key: "aiAutomationIntent", label: "Do you want AI-driven automation/copilot in this phase?", type: "boolean" },
] as const;

export function BlueprintWizard() {
  const [stage, setStage] = useState<Stage>("landing");
  const [needText, setNeedText] = useState("");
  const [answers, setAnswers] = useState<ClarificationAnswers>({});
  const [qIndex, setQIndex] = useState(0);
  const [result, setResult] = useState<BlueprintResult | null>(null);
  const [currentValue, setCurrentValue] = useState("");

  const currentQ = questionDefs[qIndex];

  const grouped = useMemo(() => {
    if (!result) return { recommended: [], optional: [], not_needed: [] };
    return {
      recommended: result.products.filter((p) => p.level === "recommended"),
      optional: result.products.filter((p) => p.level === "optional"),
      not_needed: result.products.filter((p) => p.level === "not_needed"),
    };
  }, [result]);

  const persistAnswer = () => {
    if (!currentQ || !currentValue) return;
    const value =
      currentQ.type === "number"
        ? Number(currentValue)
        : currentQ.type === "boolean"
          ? currentValue === "yes"
          : currentValue;
    setAnswers((prev) => ({ ...prev, [currentQ.key]: value }));
    setCurrentValue("");
  };

  const nextQuestion = (skip = false) => {
    if (!skip) persistAnswer();
    if (qIndex < questionDefs.length - 1) {
      setQIndex((v) => v + 1);
    } else {
      setStage("confirm");
    }
  };

  const generate = async () => {
    const res = await fetch("/api/blueprint", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ input: needText, answers }),
    });
    const data = (await res.json()) as BlueprintResult;
    setResult(data);
    localStorage.setItem("orgblueprint-last", JSON.stringify({ needText, answers, data }));
    setStage("results");
  };

  return (
    <main className="mx-auto max-w-5xl p-6">
      <h1 className="mb-4 text-3xl font-bold">OrgBlueprint MVP</h1>
      {stage === "landing" && (
        <section className="rounded-lg bg-white p-6 shadow">
          <p className="mb-4">Generate a structured Salesforce blueprint from your business needs.</p>
          <button className="rounded bg-blue-600 px-4 py-2 text-white" onClick={() => setStage("describe")}>Start</button>
        </section>
      )}

      {stage === "describe" && (
        <section className="rounded-lg bg-white p-6 shadow">
          <h2 className="mb-2 text-xl font-semibold">Describe your business needs</h2>
          <textarea
            className="min-h-40 w-full rounded border p-3"
            placeholder="Example: We need better lead management, faster support, and integrate with ERP..."
            value={needText}
            onChange={(e) => setNeedText(e.target.value)}
          />
          <button className="mt-4 rounded bg-blue-600 px-4 py-2 text-white" onClick={() => setStage("questions")} disabled={!needText.trim()}>
            Continue
          </button>
        </section>
      )}

      {stage === "questions" && currentQ && (
        <section className="rounded-lg bg-white p-6 shadow">
          <h2 className="mb-3 text-xl font-semibold">Clarifying question {qIndex + 1} / 6</h2>
          <p className="mb-4">{currentQ.label}</p>
          {currentQ.type === "boolean" ? (
            <select className="rounded border p-2" value={currentValue} onChange={(e) => setCurrentValue(e.target.value)}>
              <option value="">Select</option>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          ) : (
            <input
              className="rounded border p-2"
              type={currentQ.type}
              value={currentValue}
              onChange={(e) => setCurrentValue(e.target.value)}
            />
          )}
          <div className="mt-4 flex gap-2">
            <button className="rounded bg-blue-600 px-4 py-2 text-white" onClick={() => nextQuestion(false)}>Save & Next</button>
            <button className="rounded border px-4 py-2" onClick={() => nextQuestion(true)}>Skip</button>
          </div>
        </section>
      )}

      {stage === "confirm" && (
        <section className="rounded-lg bg-white p-6 shadow">
          <h2 className="mb-3 text-xl font-semibold">Confirm understanding</h2>
          <p className="mb-2"><strong>Need:</strong> {needText}</p>
          <pre className="mb-4 rounded bg-slate-100 p-3 text-sm">{JSON.stringify(answers, null, 2)}</pre>
          <button className="rounded bg-green-700 px-4 py-2 text-white" onClick={generate}>Generate Blueprint</button>
        </section>
      )}

      {stage === "results" && result && (
        <section className="space-y-4">
          <Card title="1) Executive Snapshot" items={result.executiveSnapshot} />
          <div className="grid gap-4 md:grid-cols-3">
            <Card title="2) Recommended" items={grouped.recommended.map((p) => `${p.name}: ${p.reasons[0]}`)} />
            <Card title="2) Optional" items={grouped.optional.map((p) => `${p.name}: ${p.reasons[0]}`)} />
            <Card title="2) Not needed" items={grouped.not_needed.map((p) => `${p.name}: ${p.reasons[0]}`)} />
          </div>
          <Card title="3) Why mapping" items={result.whyMapping.map((m) => `${m.need} -> ${m.product} (${m.why})`)} />
          <Card title="4) OOTB vs Custom" items={result.ootbVsCustom.map((r) => `${r.capability}: ${r.approach} — ${r.notes}`)} />
          <Card title="5) Objects + Automations" items={result.objectsAndAutomations} />
          <Card title="6) Integration map" items={result.integrationMap} />
          <Card title="7) Analytics pack" items={result.analyticsPack} />
          <section className="space-y-3 rounded-lg bg-amber-50 p-4 shadow">
            <h3 className="text-lg font-semibold">8) Cost simulator</h3>
            <div className="grid gap-3 md:grid-cols-3">
              <section className="rounded bg-white p-3">
                <h4 className="font-semibold">License Estimate</h4>
                <table className="mt-2 w-full text-left text-sm">
                  <thead>
                    <tr className="border-b">
                      <th>Product</th>
                      <th>Users</th>
                      <th>Annual Range</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.costEstimate.license.breakdown.map((row) => (
                      <tr key={row.product} className="border-b last:border-0">
                        <td>{row.product} ({row.assumedEdition})</td>
                        <td>{row.users}</td>
                        <td>${row.annualLow.toLocaleString()} - ${row.annualHigh.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="mt-2 text-sm font-medium">
                  Total: ${result.costEstimate.license.totalLow.toLocaleString()} - ${result.costEstimate.license.totalHigh.toLocaleString()}
                </p>
              </section>

              <section className="rounded bg-white p-3">
                <h4 className="font-semibold">Implementation Estimate</h4>
                <p className="mt-2 text-sm">
                  ${result.costEstimate.implementation.low.toLocaleString()} - ${result.costEstimate.implementation.high.toLocaleString()}
                </p>
                <p className="mt-2 text-xs text-slate-700">{result.costEstimate.implementation.rationale}</p>
              </section>

              <section className="rounded bg-white p-3">
                <h4 className="font-semibold">Estimated Year-1 Investment</h4>
                <p className="mt-2 text-lg font-bold text-slate-900">
                  ${result.costEstimate.yearOneTotal.low.toLocaleString()} - ${result.costEstimate.yearOneTotal.high.toLocaleString()}
                </p>
              </section>
            </div>

            <ul className="list-disc pl-6 text-sm">
              {result.costEstimate.assumptions.map((a) => (
                <li key={a}>{a}</li>
              ))}
            </ul>
            <p className="mt-2 rounded bg-amber-200 p-2 text-sm font-semibold">{result.costEstimate.disclaimer}</p>
          </section>
          <Card title="9) Roadmap phases" items={result.roadmap.map((p) => `${p.phase}: ${p.outcomes.join(", ")}`)} />
          <Card title="10) Document pack checklist" items={result.documentChecklist} />
          <Card title="11) Risks + confidence score" items={[...result.risks, `Confidence score: ${result.confidenceScore}/100`]} />
        </section>
      )}
    </main>
  );
}

function Card({ title, items }: { title: string; items: string[] }) {
  return (
    <section className="rounded-lg bg-white p-4 shadow">
      <h3 className="mb-2 text-lg font-semibold">{title}</h3>
      <ul className="list-disc space-y-1 pl-5 text-sm">
        {items.map((i) => (
          <li key={i}>{i}</li>
        ))}
      </ul>
    </section>
  );
}
