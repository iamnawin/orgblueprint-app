"use client";

import { useState } from "react";
import { BlueprintResult, ProductDecision } from "@orgblueprint/core";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { PRODUCT_PRICING, PRICING_DISCLAIMER, computeAnnualCost, estimateImplementationCost } from "@/lib/pricing";

interface Props {
  result: BlueprintResult;
  slug: string | null;
  isOwner: boolean;
  aiPowered?: boolean;
  onReset?: () => void;
}

const levelColors: Record<string, string> = {
  recommended: "bg-green-50 text-green-900 border-green-200",
  optional: "bg-amber-50 text-amber-900 border-amber-200",
  not_needed: "bg-slate-50 text-slate-400 border-slate-100",
};

const levelDot: Record<string, string> = {
  recommended: "bg-green-500",
  optional: "bg-amber-400",
  not_needed: "bg-slate-300",
};

// ─── Editable list ────────────────────────────────────────────────────────────
function EditableList({ items, onSave }: { items: string[]; onSave: (u: string[]) => void }) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(items.join("\n"));

  function save() {
    onSave(text.split("\n").filter(Boolean));
    setEditing(false);
  }

  if (editing) {
    return (
      <div className="space-y-2">
        <Textarea className="text-sm min-h-32" value={text} onChange={(e) => setText(e.target.value)} />
        <div className="flex gap-2">
          <Button size="sm" onClick={save}>Save</Button>
          <Button size="sm" variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <ul className="list-disc pl-5 space-y-1 text-sm text-slate-700">
        {items.map((item, i) => <li key={i}>{item}</li>)}
      </ul>
      <Button size="sm" variant="ghost" className="text-slate-400 hover:text-slate-700 mt-1 print:hidden" onClick={() => setEditing(true)}>
        ✏ Edit
      </Button>
    </div>
  );
}

// ─── Interactive Cost Calculator ──────────────────────────────────────────────
function InteractiveCostCalculator({ products }: { products: ProductDecision[] }) {
  const activeProducts = products.filter((p) => p.level !== "not_needed");
  const [userCount, setUserCount] = useState(50);
  const [tierSelections, setTierSelections] = useState<Record<string, number>>(
    Object.fromEntries(activeProducts.map((p) => [p.key, 0]))
  );

  const lineItems = activeProducts.map((p) => {
    const pricing = PRODUCT_PRICING[p.key];
    const tierIdx = tierSelections[p.key] ?? 0;
    const tier = pricing?.tiers[tierIdx];
    const annual = pricing ? computeAnnualCost(pricing, tierIdx, userCount) : 0;
    return {
      key: p.key,
      name: p.name,
      level: p.level,
      pricingModel: pricing?.pricingModel ?? "per_user",
      tierLabel: tier?.tier ?? "—",
      perUserPerMonth: tier?.perUserPerMonth ?? null,
      annual,
    };
  });

  const licenseTotal = lineItems.reduce((sum, l) => sum + l.annual, 0);
  const implCost = estimateImplementationCost(licenseTotal, activeProducts.length);
  const grandTotal = licenseTotal + implCost;
  const maxBar = grandTotal > 0 ? grandTotal : 1;

  return (
    <div className="space-y-5">
      {/* Disclaimer */}
      <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800 leading-relaxed">
        ⚠️ {PRICING_DISCLAIMER}
      </div>

      {/* User count slider */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-semibold text-slate-700">Number of users</label>
          <span className="text-2xl font-bold text-slate-900 tabular-nums">{userCount.toLocaleString()}</span>
        </div>
        <input
          type="range"
          min={10}
          max={5000}
          step={10}
          value={userCount}
          onChange={(e) => setUserCount(Number(e.target.value))}
          className="w-full h-2 rounded-lg appearance-none cursor-pointer accent-blue-600 bg-slate-200"
        />
        <div className="flex justify-between text-xs text-slate-400">
          <span>10</span>
          <span>500</span>
          <span>1,000</span>
          <span>2,500</span>
          <span>5,000</span>
        </div>
      </div>

      <Separator />

      {/* Per-product breakdown */}
      <div>
        <h4 className="text-sm font-semibold text-slate-700 mb-3">License breakdown</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="pb-2 pr-3 font-medium text-slate-500 text-xs">Product</th>
                <th className="pb-2 pr-3 font-medium text-slate-500 text-xs">Level</th>
                <th className="pb-2 pr-3 font-medium text-slate-500 text-xs">Edition / Tier</th>
                <th className="pb-2 pr-3 font-medium text-slate-500 text-xs text-right">Users</th>
                <th className="pb-2 pr-3 font-medium text-slate-500 text-xs text-right">Per user/mo</th>
                <th className="pb-2 font-medium text-slate-500 text-xs text-right">Annual (est.)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {lineItems.map((item) => {
                const pricing = PRODUCT_PRICING[item.key];
                return (
                  <tr key={item.key} className="hover:bg-slate-50/50">
                    <td className="py-2.5 pr-3 font-medium text-slate-800 text-xs leading-tight">
                      {item.name}
                    </td>
                    <td className="py-2.5 pr-3">
                      <span className={`inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-full border ${levelColors[item.level]}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${levelDot[item.level]}`} />
                        {item.level === "recommended" ? "Rec." : "Opt."}
                      </span>
                    </td>
                    <td className="py-2.5 pr-3">
                      {pricing && pricing.tiers.length > 1 ? (
                        <select
                          value={tierSelections[item.key] ?? 0}
                          onChange={(e) =>
                            setTierSelections((prev) => ({
                              ...prev,
                              [item.key]: Number(e.target.value),
                            }))
                          }
                          className="border border-slate-200 rounded-md px-2 py-1 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-blue-400 cursor-pointer"
                        >
                          {pricing.tiers.map((t, i) => (
                            <option key={i} value={i}>{t.tier}</option>
                          ))}
                        </select>
                      ) : (
                        <span className="text-xs text-slate-600">{item.tierLabel}</span>
                      )}
                    </td>
                    <td className="py-2.5 pr-3 text-xs text-right text-slate-600">
                      {item.pricingModel === "per_user" ? userCount.toLocaleString() : "—"}
                    </td>
                    <td className="py-2.5 pr-3 text-xs text-right text-slate-600">
                      {item.perUserPerMonth !== null
                        ? `$${item.perUserPerMonth.toFixed(2)}`
                        : "Flat"}
                    </td>
                    <td className="py-2.5 text-xs text-right font-semibold text-slate-800">
                      ${item.annual.toLocaleString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t border-slate-200">
                <td colSpan={5} className="pt-3 text-xs font-semibold text-slate-600 text-right pr-3">
                  License subtotal
                </td>
                <td className="pt-3 text-sm font-bold text-slate-900 text-right">
                  ${licenseTotal.toLocaleString()}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <Separator />

      {/* Cost summary bars */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-slate-700">Year-1 cost breakdown</h4>

        <div className="space-y-2.5">
          <div>
            <div className="flex justify-between text-xs text-slate-500 mb-1">
              <span>License (annual)</span>
              <span className="font-medium text-slate-700">${licenseTotal.toLocaleString()}</span>
            </div>
            <div className="h-5 bg-slate-100 rounded-lg overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-lg transition-all duration-500"
                style={{ width: `${Math.max(2, (licenseTotal / maxBar) * 100)}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs text-slate-500 mb-1">
              <span>Implementation & services (estimate)</span>
              <span className="font-medium text-slate-700">${implCost.toLocaleString()}</span>
            </div>
            <div className="h-5 bg-slate-100 rounded-lg overflow-hidden">
              <div
                className="h-full bg-indigo-400 rounded-lg transition-all duration-500"
                style={{ width: `${Math.max(2, (implCost / maxBar) * 100)}%` }}
              />
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 p-4 text-white mt-3">
          <p className="text-xs font-medium opacity-80 mb-1">Estimated year-1 total</p>
          <p className="text-3xl font-bold tracking-tight">${grandTotal.toLocaleString()}</p>
          <p className="text-xs opacity-70 mt-1">
            ≈ ${Math.round(grandTotal / userCount).toLocaleString()} per user · {userCount.toLocaleString()} users
          </p>
        </div>
      </div>

      <div className="flex gap-4 text-xs text-slate-400">
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-blue-500 inline-block" />Licenses</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-indigo-400 inline-block" />Implementation</span>
      </div>
    </div>
  );
}

// ─── Main dashboard ────────────────────────────────────────────────────────────
export function BlueprintDashboard({ result: initial, slug, isOwner, aiPowered = false, onReset }: Props) {
  const [result, setResult] = useState<BlueprintResult>(initial);
  const [saving, setSaving] = useState(false);
  const [shareMsg, setShareMsg] = useState<string | null>(null);
  const [isPublic, setIsPublic] = useState(false);
  const [showNotNeeded, setShowNotNeeded] = useState(false);

  function updateSection<K extends keyof BlueprintResult>(key: K, value: BlueprintResult[K]) {
    setResult((prev) => ({ ...prev, [key]: value }));
  }
  void updateSection; // referenced via editList

  async function persistResult(updated: BlueprintResult) {
    if (!slug || !isOwner) return;
    setSaving(true);
    try {
      await fetch(`/api/blueprint/${slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ result: updated }),
      });
    } finally {
      setSaving(false);
    }
  }

  function editList(key: keyof BlueprintResult) {
    return (updated: string[]) => {
      const next = { ...result, [key]: updated };
      setResult(next);
      persistResult(next);
    };
  }

  async function shareBlueprint() {
    if (!slug) return;
    await fetch(`/api/blueprint/${slug}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPublic: true }),
    });
    setIsPublic(true);
    const url = `${window.location.origin}/blueprint/${slug}`;
    await navigator.clipboard.writeText(url);
    setShareMsg("Link copied!");
    setTimeout(() => setShareMsg(null), 3000);
  }

  function exportPDF() {
    if (slug) {
      window.open(`/blueprint/${slug}/print`, "_blank");
    } else {
      window.print();
    }
  }

  const recommended = result.products.filter((p) => p.level === "recommended");
  const optional = result.products.filter((p) => p.level === "optional");
  const notNeeded = result.products.filter((p) => p.level === "not_needed");

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between flex-wrap gap-2 print:hidden">
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="text-xl font-bold text-slate-900">Salesforce Blueprint</h1>
          {aiPowered && (
            <Badge className="bg-blue-100 text-blue-800 border-blue-200 text-xs">✦ AI-powered</Badge>
          )}
          <Badge className="bg-slate-100 text-slate-600 border-slate-200 text-xs">
            Confidence: {result.confidenceScore}/100
          </Badge>
        </div>
        <div className="flex gap-2 items-center flex-wrap">
          {saving && <span className="text-xs text-slate-400">Saving…</span>}
          {shareMsg && <span className="text-xs text-green-600 font-medium">{shareMsg}</span>}
          {slug && isOwner && !isPublic && (
            <Button variant="outline" size="sm" onClick={shareBlueprint} className="text-xs">
              Share link
            </Button>
          )}
          {isPublic && (
            <Badge className="bg-green-100 text-green-700 border-green-200 text-xs">Public</Badge>
          )}
          <Button variant="outline" size="sm" onClick={exportPDF} className="text-xs">
            Export PDF
          </Button>
          {onReset && (
            <Button variant="ghost" size="sm" onClick={onReset} className="text-xs">
              ← New blueprint
            </Button>
          )}
        </div>
      </div>

      {/* Executive snapshot */}
      <Card className="border-slate-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Executive Snapshot</CardTitle>
        </CardHeader>
        <CardContent>
          <EditableList items={result.executiveSnapshot} onSave={editList("executiveSnapshot")} />
        </CardContent>
      </Card>

      {/* Products — three columns */}
      <Card className="border-slate-200">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Product Recommendations</CardTitle>
            <div className="flex gap-3 text-xs text-slate-500">
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-green-500" />{recommended.length} recommended</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-amber-400" />{optional.length} optional</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-slate-300" />{notNeeded.length} not needed</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {/* Recommended */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-green-700 mb-2 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-green-500" />Recommended
              </p>
              <div className="space-y-2">
                {recommended.map((p) => (
                  <div key={p.key} className="rounded-lg border px-3 py-2.5 text-sm bg-green-50 border-green-200">
                    <p className="font-semibold text-green-900">{p.name}</p>
                    <p className="text-xs mt-0.5 text-green-700 opacity-90 leading-relaxed">{p.reasons[0]}</p>
                  </div>
                ))}
                {recommended.length === 0 && (
                  <p className="text-xs text-slate-400 italic">None</p>
                )}
              </div>
            </div>

            {/* Optional */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-amber-700 mb-2 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-amber-400" />Optional
              </p>
              <div className="space-y-2">
                {optional.map((p) => (
                  <div key={p.key} className="rounded-lg border px-3 py-2.5 text-sm bg-amber-50 border-amber-200">
                    <p className="font-semibold text-amber-900">{p.name}</p>
                    <p className="text-xs mt-0.5 text-amber-700 opacity-90 leading-relaxed">{p.reasons[0]}</p>
                  </div>
                ))}
                {optional.length === 0 && (
                  <p className="text-xs text-slate-400 italic">None</p>
                )}
              </div>
            </div>

            {/* Not Needed */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-slate-300" />Not Needed
                </p>
                <button
                  onClick={() => setShowNotNeeded((v) => !v)}
                  className="text-xs text-slate-400 hover:text-slate-600 underline print:hidden"
                >
                  {showNotNeeded ? "hide" : `show ${notNeeded.length}`}
                </button>
              </div>
              {showNotNeeded && (
                <div className="space-y-1.5">
                  {notNeeded.map((p) => (
                    <div key={p.key} className="rounded-lg border px-3 py-2 text-sm bg-slate-50 border-slate-100">
                      <p className="font-medium text-slate-400">{p.name}</p>
                      <p className="text-xs mt-0.5 text-slate-400 leading-relaxed">{p.reasons[0]}</p>
                    </div>
                  ))}
                </div>
              )}
              {!showNotNeeded && (
                <p className="text-xs text-slate-400 italic">
                  {notNeeded.length} products not relevant — click show to expand
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Why mapping */}
      {result.whyMapping && result.whyMapping.length > 0 && (
        <Card className="border-slate-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Why these products?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-2 pr-4 text-xs font-medium text-slate-500">Business Need</th>
                    <th className="pb-2 pr-4 text-xs font-medium text-slate-500">Product</th>
                    <th className="pb-2 text-xs font-medium text-slate-500">Rationale</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {result.whyMapping.map((row, i) => (
                    <tr key={i} className="hover:bg-slate-50/50">
                      <td className="py-2 pr-4 text-slate-700 text-xs">{row.need}</td>
                      <td className="py-2 pr-4 font-medium text-slate-800 text-xs whitespace-nowrap">{row.product}</td>
                      <td className="py-2 text-slate-600 text-xs leading-relaxed">{row.why}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabbed sections */}
      <Tabs defaultValue="cost">
        <TabsList className="flex-wrap h-auto print:hidden gap-1">
          <TabsTrigger value="cost" className="text-xs">💰 Cost Calculator</TabsTrigger>
          <TabsTrigger value="ootb" className="text-xs">OOTB vs Custom</TabsTrigger>
          <TabsTrigger value="roadmap" className="text-xs">Roadmap</TabsTrigger>
          <TabsTrigger value="objects" className="text-xs">Objects & Automations</TabsTrigger>
          <TabsTrigger value="integrations" className="text-xs">Integrations</TabsTrigger>
          <TabsTrigger value="analytics" className="text-xs">Analytics</TabsTrigger>
          <TabsTrigger value="docs" className="text-xs">Document Checklist</TabsTrigger>
          <TabsTrigger value="risks" className="text-xs">Risks</TabsTrigger>
        </TabsList>

        {/* Cost Calculator tab */}
        <TabsContent value="cost">
          <Card className="border-slate-200">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-base">Interactive Cost Calculator</CardTitle>
                  <p className="text-xs text-slate-500 mt-0.5">Adjust users and tier to see real-time estimates</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-400">LLM estimate</p>
                  <p className="text-lg font-bold text-slate-700">{result.costSimulator.range}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <InteractiveCostCalculator products={result.products} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* OOTB vs Custom tab */}
        <TabsContent value="ootb">
          <Card className="border-slate-200">
            <CardContent className="pt-4">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-slate-500">
                      <th className="pb-2 pr-4 font-medium text-xs">Capability</th>
                      <th className="pb-2 pr-4 font-medium text-xs">Approach</th>
                      <th className="pb-2 font-medium text-xs">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {result.ootbVsCustom.map((row, i) => (
                      <tr key={i} className="hover:bg-slate-50/50">
                        <td className="py-2 pr-4 font-medium text-slate-800 text-xs">{row.capability}</td>
                        <td className="py-2 pr-4">
                          <Badge
                            variant="outline"
                            className={
                              row.approach === "OOTB"
                                ? "border-green-300 text-green-700 text-xs"
                                : row.approach === "Config"
                                ? "border-blue-300 text-blue-700 text-xs"
                                : "border-orange-300 text-orange-700 text-xs"
                            }
                          >
                            {row.approach}
                          </Badge>
                        </td>
                        <td className="py-2 text-slate-600 text-xs leading-relaxed">{row.notes}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Roadmap tab */}
        <TabsContent value="roadmap">
          <Card className="border-slate-200">
            <CardContent className="pt-4 space-y-4">
              {result.roadmap.map((phase, i) => (
                <div key={i} className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-bold">
                    {i + 1}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800 text-sm">{phase.phase}</p>
                    <ul className="list-disc pl-4 text-xs text-slate-600 mt-1 space-y-0.5">
                      {phase.outcomes.map((o, j) => <li key={j}>{o}</li>)}
                    </ul>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="objects">
          <Card className="border-slate-200">
            <CardContent className="pt-4">
              <EditableList items={result.objectsAndAutomations} onSave={editList("objectsAndAutomations")} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations">
          <Card className="border-slate-200">
            <CardContent className="pt-4">
              <EditableList items={result.integrationMap} onSave={editList("integrationMap")} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <Card className="border-slate-200">
            <CardContent className="pt-4">
              <EditableList items={result.analyticsPack} onSave={editList("analyticsPack")} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="docs">
          <Card className="border-slate-200">
            <CardContent className="pt-4">
              <EditableList items={result.documentChecklist} onSave={editList("documentChecklist")} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="risks">
          <Card className="border-slate-200">
            <CardContent className="pt-4">
              <EditableList items={result.risks} onSave={editList("risks")} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
