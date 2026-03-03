"use client";

import { BlueprintResult, ClarificationAnswers } from "@orgblueprint/core";
import { BarChart3, Download, Layers, RefreshCw, ShieldAlert } from "lucide-react";
import { ReactNode, useMemo, useState } from "react";

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
    setStage("results");
  };

  return (
    <main className="mx-auto max-w-7xl p-6">
      <h1 className="mb-4 text-3xl font-bold text-slate-900">OrgBlueprint MVP</h1>
      {stage === "landing" && <SimpleCard><button className="rounded bg-blue-600 px-4 py-2 text-white" onClick={() => setStage("describe")}>Start</button></SimpleCard>}
      {stage === "describe" && (
        <SimpleCard>
          <textarea className="min-h-40 w-full rounded border p-3" value={needText} onChange={(e) => setNeedText(e.target.value)} />
          <button className="mt-4 rounded bg-blue-600 px-4 py-2 text-white" onClick={() => setStage("questions")} disabled={!needText.trim()}>Continue</button>
        </SimpleCard>
      )}
      {stage === "questions" && currentQ && (
        <SimpleCard>
          <h2 className="mb-3 text-xl font-semibold">Clarifying question {qIndex + 1} / 6</h2>
          <p className="mb-4">{currentQ.label}</p>
          {currentQ.type === "boolean" ? (
            <select className="rounded border p-2" value={currentValue} onChange={(e) => setCurrentValue(e.target.value)}>
              <option value="">Select</option><option value="yes">Yes</option><option value="no">No</option>
            </select>
          ) : <input className="rounded border p-2" type={currentQ.type} value={currentValue} onChange={(e) => setCurrentValue(e.target.value)} />}
          <div className="mt-4 flex gap-2"><button className="rounded bg-blue-600 px-4 py-2 text-white" onClick={() => nextQuestion(false)}>Save & Next</button><button className="rounded border px-4 py-2" onClick={() => nextQuestion(true)}>Skip</button></div>
        </SimpleCard>
      )}
      {stage === "confirm" && <SimpleCard><pre className="mb-4 rounded bg-slate-100 p-3 text-sm">{JSON.stringify({ needText, answers }, null, 2)}</pre><button className="rounded bg-green-700 px-4 py-2 text-white" onClick={generate}>Generate Blueprint</button></SimpleCard>}

      {stage === "results" && result && (
        <section className="space-y-6">
          <section className="grid gap-4 md:grid-cols-4">
            <Kpi title="Primary focus" value={result.executiveSnapshot.primaryFocus} />
            <Kpi title="Users detected" value={`${result.executiveSnapshot.usersDetected} (${result.executiveSnapshot.userCountBand})`} />
            <Kpi title="Complexity" value={result.executiveSnapshot.complexityLevel} />
            <section className="rounded-xl bg-white p-4 shadow">
              <p className="text-sm text-slate-500">Confidence</p>
              <p className="text-xl font-semibold">{result.executiveSnapshot.confidenceScore}%</p>
              <div className="mt-2 h-2 rounded bg-slate-100"><div className="h-2 rounded bg-blue-600" style={{ width: `${result.executiveSnapshot.confidenceScore}%` }} /></div>
            </section>
          </section>

          <section className="rounded-xl bg-white p-4 shadow">
            <div className="mb-3 flex items-center justify-between"><h3 className="text-lg font-semibold">Product Recommendations</h3><button className="rounded border px-3 py-1 text-sm">Why details</button></div>
            <div className="grid gap-4 md:grid-cols-3">
              {(["recommended", "optional", "not_needed"] as const).map((level) => (
                <div key={level} className="space-y-2">
                  <p className="font-semibold capitalize">{level.replace("_", " ")}</p>
                  {(grouped[level] as typeof result.products).map((p) => (
                    <div key={p.key} className="rounded-lg border p-3">
                      <p className="font-medium">{p.name} <span className="ml-1 rounded bg-slate-100 px-2 py-0.5 text-xs">{p.level}</span></p>
                      <p className="text-sm text-slate-600">{p.reasons[0]}</p>
                      <details className="mt-1 text-xs text-slate-500"><summary>Why</summary>{p.triggers.join(", ")}</details>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </section>

          <Card title="OOTB vs Custom"><table className="w-full text-sm"><thead><tr className="border-b"><th>Area</th><th>OOTB fit</th><th>Customization</th><th>Risk</th><th>Notes</th></tr></thead><tbody>{result.ootbVsCustom.map((r)=> <tr key={r.area} className="border-b"><td>{r.area}</td><td>{r.ootbFit}</td><td>{r.customizationLevel}</td><td>{r.risk}</td><td>{r.notes}</td></tr>)}</tbody></table></Card>

          <Card title="Architecture Quick Map"><div className="flex flex-wrap gap-2">{result.integrationMap.map((i)=><span key={i.system} className="rounded-full bg-slate-100 px-3 py-1 text-sm">{i.system} · {i.pattern}</span>)}</div></Card>
          <Card title="Analytics Pack"><div className="flex flex-wrap gap-2">{result.analyticsPack.map((d)=><span key={d} className="rounded-full bg-blue-50 px-3 py-1 text-sm text-blue-700">{d}</span>)}</div></Card>

          <section className="rounded-xl bg-amber-50 p-4 shadow">
            <h3 className="mb-3 text-lg font-semibold">Cost Estimator</h3>
            <div className="grid gap-3 md:grid-cols-3">
              <Card title="License Estimate"><table className="w-full text-sm"><thead><tr className="border-b"><th>Product</th><th>Users</th><th>Annual range</th></tr></thead><tbody>{result.costEstimate.license.breakdown.map((row)=><tr key={row.product} className="border-b"><td>{row.product}</td><td>{row.users}</td><td>${row.annualLow.toLocaleString()} - ${row.annualHigh.toLocaleString()}</td></tr>)}</tbody></table><p className="mt-2 font-medium">Total: ${result.costEstimate.license.totalLow.toLocaleString()} - ${result.costEstimate.license.totalHigh.toLocaleString()}</p></Card>
              <Card title="Implementation Estimate"><p>${result.costEstimate.implementation.low.toLocaleString()} - ${result.costEstimate.implementation.high.toLocaleString()}</p><p className="text-sm text-slate-600">{result.costEstimate.implementation.rationale}</p></Card>
              <Card title="Estimated Year-1 Investment"><p className="text-xl font-bold">${result.costEstimate.yearOneTotal.low.toLocaleString()} - ${result.costEstimate.yearOneTotal.high.toLocaleString()}</p></Card>
            </div>
            <ul className="mt-3 list-disc pl-6 text-sm">{result.costEstimate.assumptions.map((a)=><li key={a}>{a}</li>)}</ul>
            <p className="mt-3 rounded bg-amber-200 p-2 text-sm font-semibold">{result.costEstimate.disclaimer}</p>
          </section>

          <Card title="Roadmap"><div className="grid gap-3 md:grid-cols-3">{result.roadmap.map((phase)=><div key={phase.phase} className="rounded-lg border p-3"><p className="font-semibold">{phase.phase}</p><ul className="list-disc pl-5 text-sm">{phase.outcomes.map((o)=><li key={o}>{o}</li>)}</ul></div>)}</div></Card>

          <section className="grid gap-4 md:grid-cols-2">
            <Card title="Document Pack"><ul className="list-disc pl-5 text-sm">{result.documentChecklist.map((doc)=><li key={doc}>{doc}</li>)}</ul></Card>
            <Card title="Risks"><div className="space-y-2 text-sm">{result.risks.map((risk)=><p key={risk}>• {risk}</p>)}<p className="font-medium">Confidence explanation: based on explicit trigger density and ambiguity level.</p></div></Card>
          </section>

          <div className="flex flex-wrap gap-2">
            <button className="inline-flex items-center gap-2 rounded bg-slate-900 px-4 py-2 text-white"><Download size={16}/>Download report</button>
            <button className="inline-flex items-center gap-2 rounded border px-4 py-2" onClick={() => { setStage("describe"); setResult(null); setAnswers({}); setQIndex(0); }}><RefreshCw size={16}/>Run another scenario</button>
          </div>
        </section>
      )}
    </main>
  );
}

function Kpi({ title, value }: { title: string; value: string }) {
  return <section className="rounded-xl bg-white p-4 shadow"><p className="text-sm text-slate-500">{title}</p><p className="text-xl font-semibold">{value}</p></section>;
}

function SimpleCard({ children }: { children: ReactNode }) {
  return <section className="rounded-lg bg-white p-6 shadow">{children}</section>;
}

function Card({ title, children }: { title: string; children: ReactNode }) {
  const icon = title.includes("Architecture") ? <Layers size={16} /> : title.includes("Analytics") ? <BarChart3 size={16} /> : <ShieldAlert size={16} />;
  return <section className="rounded-xl bg-white p-4 shadow"><h3 className="mb-2 flex items-center gap-2 text-lg font-semibold">{icon}{title}</h3>{children}</section>;
}
