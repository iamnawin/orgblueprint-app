"use client";

import { useState, useRef, useEffect } from "react";
import { BlueprintResult, ProductDecision } from "@orgblueprint/core";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { PRODUCT_PRICING, PRICING_DISCLAIMER, computeAnnualCost } from "@/lib/pricing";
import { PRODUCT_DETAILS } from "@/lib/productDetails";
import { APPEXCHANGE_APPS } from "@/lib/appExchange";
import { generateChecklist } from "@/lib/implementationChecklist";
import { generateTechnicalBlueprint } from "@/lib/technicalBlueprint";
import { downloadBlueprintPdf } from "@/lib/exportPdf";

interface Props {
  result: BlueprintResult;
  slug: string | null;
  isOwner: boolean;
  aiPowered?: boolean;
  needText?: string;
  savedAnswers?: Record<string, string>;
  onReset?: () => void;
}

// ─── Category config ──────────────────────────────────────────────────────────
const PRODUCT_CATEGORY: Record<string, { label: string; color: string; bg: string; border: string; dot: string; icon: string }> = {
  sales_cloud:              { label: "CRM",       color: "text-blue-700",    bg: "bg-blue-50",    border: "border-blue-200",  dot: "bg-blue-500",    icon: "📊" },
  service_cloud:            { label: "CRM",       color: "text-blue-700",    bg: "bg-blue-50",    border: "border-blue-200",  dot: "bg-blue-500",    icon: "🎧" },
  experience_cloud:         { label: "CRM",       color: "text-blue-700",    bg: "bg-blue-50",    border: "border-blue-200",  dot: "bg-blue-500",    icon: "🌐" },
  field_service:            { label: "CRM",       color: "text-blue-700",    bg: "bg-blue-50",    border: "border-blue-200",  dot: "bg-blue-500",    icon: "🔧" },
  cpq_revenue:              { label: "CRM",       color: "text-blue-700",    bg: "bg-blue-50",    border: "border-blue-200",  dot: "bg-blue-500",    icon: "💼" },
  marketing_cloud:          { label: "Marketing", color: "text-purple-700",  bg: "bg-purple-50",  border: "border-purple-200",dot: "bg-purple-500",  icon: "📣" },
  pardot:                   { label: "Marketing", color: "text-purple-700",  bg: "bg-purple-50",  border: "border-purple-200",dot: "bg-purple-500",  icon: "🎯" },
  loyalty_management:       { label: "Marketing", color: "text-purple-700",  bg: "bg-purple-50",  border: "border-purple-200",dot: "bg-purple-500",  icon: "⭐" },
  commerce_cloud:           { label: "Marketing", color: "text-purple-700",  bg: "bg-purple-50",  border: "border-purple-200",dot: "bg-purple-500",  icon: "🛒" },
  data_cloud:               { label: "Data & AI", color: "text-teal-700",    bg: "bg-teal-50",    border: "border-teal-200",  dot: "bg-teal-500",    icon: "☁️" },
  agentforce_einstein:      { label: "Data & AI", color: "text-teal-700",    bg: "bg-teal-50",    border: "border-teal-200",  dot: "bg-teal-500",    icon: "🤖" },
  tableau_analytics:        { label: "Data & AI", color: "text-teal-700",    bg: "bg-teal-50",    border: "border-teal-200",  dot: "bg-teal-500",    icon: "📈" },
  mulesoft:                 { label: "Platform",  color: "text-slate-700",   bg: "bg-slate-50",   border: "border-slate-200", dot: "bg-slate-500",   icon: "🔗" },
  slack_collab:             { label: "Platform",  color: "text-slate-700",   bg: "bg-slate-50",   border: "border-slate-200", dot: "bg-slate-500",   icon: "💬" },
  salesforce_shield:        { label: "Platform",  color: "text-slate-700",   bg: "bg-slate-50",   border: "border-slate-200", dot: "bg-slate-500",   icon: "🔒" },
  health_cloud:             { label: "Industry",  color: "text-orange-700",  bg: "bg-orange-50",  border: "border-orange-200",dot: "bg-orange-500",  icon: "🏥" },
  financial_services_cloud: { label: "Industry",  color: "text-orange-700",  bg: "bg-orange-50",  border: "border-orange-200",dot: "bg-orange-500",  icon: "🏦" },
  nonprofit_cloud:          { label: "Industry",  color: "text-orange-700",  bg: "bg-orange-50",  border: "border-orange-200",dot: "bg-orange-500",  icon: "❤️" },
  manufacturing_cloud:      { label: "Industry",  color: "text-orange-700",  bg: "bg-orange-50",  border: "border-orange-200",dot: "bg-orange-500",  icon: "🏭" },
  education_cloud:          { label: "Industry",  color: "text-orange-700",  bg: "bg-orange-50",  border: "border-orange-200",dot: "bg-orange-500",  icon: "🎓" },
  net_zero_cloud:           { label: "Industry",  color: "text-orange-700",  bg: "bg-orange-50",  border: "border-orange-200",dot: "bg-orange-500",  icon: "🌿" },
};

const PRODUCT_BUSINESS_NEED: Record<string, string> = {
  sales_cloud:              "Sales pipeline & opportunity management",
  service_cloud:            "Customer support & case management",
  experience_cloud:         "Self-service portal & community access",
  field_service:            "Field operations & technician dispatch",
  cpq_revenue:              "Complex pricing & quote configuration",
  marketing_cloud:          "B2C marketing automation & journeys",
  pardot:                   "B2B demand generation & lead nurture",
  loyalty_management:       "Customer loyalty & rewards program",
  commerce_cloud:           "Digital commerce & storefront",
  data_cloud:               "Unified customer data platform",
  agentforce_einstein:      "AI automation & agent assistance",
  tableau_analytics:        "Advanced analytics & BI dashboards",
  mulesoft:                 "Enterprise integration & API management",
  slack_collab:             "Team collaboration & internal comms",
  salesforce_shield:        "Security, compliance & data governance",
  health_cloud:             "Healthcare patient & provider management",
  financial_services_cloud: "Financial services client management",
  nonprofit_cloud:          "Nonprofit fundraising & constituent management",
  manufacturing_cloud:      "Manufacturing & dealer channel management",
  education_cloud:          "Student lifecycle & enrollment management",
  net_zero_cloud:           "Sustainability & carbon tracking (ESG)",
};

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

const PHASE_COLORS = ["bg-blue-600", "bg-indigo-600", "bg-violet-600", "bg-purple-600", "bg-fuchsia-600"];
const PHASE_BORDER_COLORS = ["border-blue-200", "border-indigo-200", "border-violet-200", "border-purple-200", "border-fuchsia-200"];
const PHASE_BG_COLORS = ["bg-blue-50", "bg-indigo-50", "bg-violet-50", "bg-purple-50", "bg-fuchsia-50"];

// ─── Simple Dialog ─────────────────────────────────────────────────────────────
function SimpleDialog({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {children}
      </div>
    </div>
  );
}

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
function InteractiveCostCalculator({ products, initialUsers = 50 }: { products: ProductDecision[]; initialUsers?: number }) {
  const activeProducts = products.filter((p) => p.level !== "not_needed");
  const [userCount, setUserCount] = useState(Math.max(10, initialUsers));
  const [tierSelections, setTierSelections] = useState<Record<string, number>>(
    Object.fromEntries(activeProducts.map((p) => [p.key, 0]))
  );
  const [budgetEnabled, setBudgetEnabled] = useState(false);
  const [budgetTarget, setBudgetTarget] = useState(0);

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
  const budgetPct = budgetTarget > 0 ? Math.min(150, Math.round((licenseTotal / budgetTarget) * 100)) : 0;
  const isOverBudget = budgetEnabled && budgetTarget > 0 && licenseTotal > budgetTarget;

  function autoOptimize() {
    // Downgrade optional products to lowest tier first
    const next = { ...tierSelections };
    for (const item of lineItems) {
      if (item.level === "optional") {
        next[item.key] = 0; // lowest tier
      }
    }
    setTierSelections(next);
  }

  return (
    <div className="space-y-5">
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
          type="range" min={10} max={5000} step={10} value={userCount}
          onChange={(e) => setUserCount(Number(e.target.value))}
          className="w-full h-2 rounded-lg appearance-none cursor-pointer accent-blue-600 bg-slate-200"
        />
        <div className="flex justify-between text-xs text-slate-400">
          <span>10</span><span>500</span><span>1,000</span><span>2,500</span><span>5,000</span>
        </div>
      </div>

      {/* Budget optimizer toggle */}
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-slate-700">Estimated Implementation Budget</p>
          <button
            onClick={() => setBudgetEnabled((v) => !v)}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${budgetEnabled ? "bg-blue-600" : "bg-slate-300"}`}
          >
            <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${budgetEnabled ? "translate-x-4.5" : "translate-x-0.5"}`} />
          </button>
        </div>
        {budgetEnabled && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-500">$</span>
              <input
                type="number"
                value={budgetTarget || ""}
                onChange={(e) => setBudgetTarget(Number(e.target.value))}
                placeholder="Enter annual budget (e.g. 200000)"
                className="flex-1 border border-slate-200 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 dark:bg-slate-800 dark:border-slate-600 dark:text-slate-200"
              />
            </div>
            {budgetTarget > 0 && (
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className={isOverBudget ? "text-red-600 font-semibold" : "text-green-600 font-semibold"}>
                    {isOverBudget
                      ? `Over budget by $${(licenseTotal - budgetTarget).toLocaleString()}`
                      : `Under budget by $${(budgetTarget - licenseTotal).toLocaleString()}`}
                  </span>
                  <span className="text-slate-500">{budgetPct}% of budget</span>
                </div>
                <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${budgetPct > 100 ? "bg-red-500" : budgetPct > 80 ? "bg-amber-400" : "bg-green-500"}`}
                    style={{ width: `${Math.min(100, budgetPct)}%` }}
                  />
                </div>
                {isOverBudget && (
                  <Button size="sm" variant="outline" onClick={autoOptimize} className="text-xs text-blue-700 border-blue-200 hover:bg-blue-50 mt-1">
                    ⚡ Auto-optimize (downgrade optional products)
                  </Button>
                )}
              </div>
            )}
          </div>
        )}
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
                    <td className="py-2.5 pr-3 font-medium text-slate-800 text-xs leading-tight">{item.name}</td>
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
                          onChange={(e) => setTierSelections((prev) => ({ ...prev, [item.key]: Number(e.target.value) }))}
                          className="border border-slate-200 dark:border-slate-600 rounded-md px-2 py-1 text-xs bg-white dark:bg-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-400 cursor-pointer"
                        >
                          {pricing.tiers.map((t, i) => <option key={i} value={i}>{t.tier}</option>)}
                        </select>
                      ) : (
                        <span className="text-xs text-slate-600">{item.tierLabel}</span>
                      )}
                    </td>
                    <td className="py-2.5 pr-3 text-xs text-right text-slate-600">
                      {item.pricingModel === "per_user" ? userCount.toLocaleString() : "—"}
                    </td>
                    <td className="py-2.5 pr-3 text-xs text-right text-slate-600">
                      {item.perUserPerMonth !== null ? `$${item.perUserPerMonth.toFixed(2)}` : "Flat"}
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
                <td colSpan={5} className="pt-3 text-xs font-semibold text-slate-600 text-right pr-3">License subtotal</td>
                <td className="pt-3 text-sm font-bold text-slate-900 text-right">${licenseTotal.toLocaleString()}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <Separator />

      {/* Cost summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 p-4 text-white">
          <p className="text-xs font-medium opacity-80 mb-1">License Cost (annual)</p>
          <p className="text-2xl font-bold tracking-tight">${licenseTotal.toLocaleString()}</p>
          <p className="text-xs opacity-70 mt-1">
            ${userCount > 0 ? Math.round(licenseTotal / userCount).toLocaleString() : "—"} / user / year
          </p>
        </div>
        <div className="rounded-xl bg-gradient-to-br from-slate-700 to-slate-900 p-4 text-white">
          <p className="text-xs font-medium opacity-80 mb-1">Implementation Cost</p>
          <p className="text-2xl font-bold tracking-tight">$80k – $200k</p>
          <p className="text-xs opacity-70 mt-1">depends on complexity &amp; scope</p>
        </div>
        <div className="rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 p-4 text-white">
          <p className="text-xs font-medium opacity-80 mb-1">Estimated Year-1 Budget</p>
          <p className="text-2xl font-bold tracking-tight">
            ${(licenseTotal + 80000).toLocaleString()} – ${(licenseTotal + 200000).toLocaleString()}
          </p>
          <p className="text-xs opacity-70 mt-1">license + implementation</p>
        </div>
      </div>

      <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800 leading-relaxed">
        ⚠️ <strong>Directional estimate only.</strong> This is not official Salesforce pricing or a quote. Salesforce SI partners typically charge $150–$350/hr. Engage a certified partner for a detailed scope and commercial quote.
      </div>
    </div>
  );
}

// ─── Executive Snapshot Cards ─────────────────────────────────────────────────
function ExecutiveSnapshotCards({ snapshot }: { snapshot: BlueprintResult["executiveSnapshot"] }) {
  const complexityConfig = {
    Low:    { color: "text-green-700",  bg: "bg-green-50",  border: "border-green-200",  bar: "bg-green-500",  pct: 33  },
    Medium: { color: "text-amber-700",  bg: "bg-amber-50",  border: "border-amber-200",  bar: "bg-amber-400",  pct: 66  },
    High:   { color: "text-red-700",    bg: "bg-red-50",    border: "border-red-200",    bar: "bg-red-500",    pct: 100 },
  }[snapshot.complexityLevel];

  const bandConfig = {
    "1-49":    { label: "1–49 users",   color: "bg-sky-100 text-sky-700 border-sky-200" },
    "50-199":  { label: "50–199 users", color: "bg-blue-100 text-blue-700 border-blue-200" },
    "200+":    { label: "200+ users",   color: "bg-indigo-100 text-indigo-700 border-indigo-200" },
  }[snapshot.userCountBand];

  const confidencePct = Math.min(100, Math.max(0, snapshot.confidenceScore));
  const confidenceColor = confidencePct >= 80 ? "bg-green-500" : confidencePct >= 60 ? "bg-amber-400" : "bg-red-400";

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <div className="rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50 to-white p-4 space-y-1.5">
        <div className="flex items-center gap-1.5"><span className="text-base">🎯</span><p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Primary Focus</p></div>
        <p className="text-sm font-bold text-slate-900 leading-snug">{snapshot.primaryFocus || "General CRM"}</p>
      </div>
      <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-4 space-y-1.5">
        <div className="flex items-center gap-1.5"><span className="text-base">👥</span><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Users Detected</p></div>
        <div className="flex items-end gap-2">
          <p className="text-2xl font-bold text-slate-900 tabular-nums leading-none">{snapshot.usersDetected}</p>
          <span className={`text-xs px-1.5 py-0.5 rounded-full border font-medium mb-0.5 ${bandConfig.color}`}>{bandConfig.label}</span>
        </div>
      </div>
      <div className={`rounded-xl border ${complexityConfig.border} ${complexityConfig.bg} p-4 space-y-1.5`}>
        <div className="flex items-center gap-1.5"><span className="text-base">⚡</span><p className={`text-xs font-semibold uppercase tracking-wide ${complexityConfig.color}`}>Complexity</p></div>
        <p className={`text-xl font-bold ${complexityConfig.color}`}>{snapshot.complexityLevel}</p>
        <div className="h-1.5 bg-white/60 rounded-full overflow-hidden">
          <div className={`h-full ${complexityConfig.bar} rounded-full transition-all duration-700`} style={{ width: `${complexityConfig.pct}%` }} />
        </div>
      </div>
      <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-4 space-y-1.5">
        <div className="flex items-center gap-1.5">
          <span className="text-base">📊</span>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Confidence</p>
          <div className="relative group ml-auto">
            <button className="flex items-center justify-center w-4 h-4 rounded-full bg-slate-200 text-slate-500 hover:bg-slate-300 text-xs font-bold leading-none">?</button>
            <div className="absolute bottom-full right-0 mb-2 w-56 bg-slate-800 text-white text-xs rounded-xl p-3 leading-relaxed hidden group-hover:block z-20 shadow-xl">
              <p className="font-semibold mb-1.5">How confidence is calculated</p>
              <ul className="space-y-1 text-slate-300">
                <li>• Clarity of your input description</li>
                <li>• Number of signals detected in your text</li>
                <li>• Completeness of your Q&amp;A answers</li>
              </ul>
              <p className="mt-2 text-slate-400">Higher scores mean the blueprint is more tailored to your specific needs.</p>
            </div>
          </div>
        </div>
        <div className="flex items-end gap-1">
          <p className="text-2xl font-bold text-slate-900 tabular-nums leading-none">{confidencePct}</p>
          <p className="text-sm text-slate-400 mb-0.5">/100</p>
        </div>
        <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
          <div className={`h-full ${confidenceColor} rounded-full transition-all duration-700`} style={{ width: `${confidencePct}%` }} />
        </div>
      </div>
    </div>
  );
}

// ─── Product Card (clickable for deep-dive) ───────────────────────────────────
function ProductCard({ product, muted = false, onDeepDive }: { product: ProductDecision; muted?: boolean; onDeepDive?: () => void }) {
  const cat = PRODUCT_CATEGORY[product.key];
  const [expanded, setExpanded] = useState(false);

  if (muted) {
    return (
      <div className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2.5 flex items-start gap-2">
        <span className="text-base opacity-40 mt-0.5">{cat?.icon ?? "📦"}</span>
        <div className="min-w-0">
          <p className="text-xs font-medium text-slate-400 truncate">{product.name}</p>
          <p className="text-xs text-slate-400 mt-0.5 leading-relaxed opacity-80">{product.reasons[0]}</p>
        </div>
      </div>
    );
  }

  const levelBadge = product.level === "recommended"
    ? "bg-green-100 text-green-800 border-green-200"
    : "bg-amber-100 text-amber-800 border-amber-200";

  const details = PRODUCT_DETAILS[product.key];

  return (
    <div className={`rounded-xl border ${cat?.border ?? "border-slate-200"} ${cat?.bg ?? "bg-slate-50"} p-3.5 space-y-2 hover:shadow-sm transition-shadow duration-150`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2 min-w-0">
          <span className="text-lg leading-none mt-0.5 flex-shrink-0">{cat?.icon ?? "📦"}</span>
          <div className="min-w-0">
            <p className={`text-sm font-semibold ${cat?.color ?? "text-slate-800"} leading-tight`}>{product.name}</p>
            <span className={`inline-block text-xs px-1.5 py-0.5 rounded-full border font-medium mt-0.5 ${cat?.color} bg-white/60 ${cat?.border}`}>
              {cat?.label ?? "Other"}
            </span>
          </div>
        </div>
        <span className={`flex-shrink-0 text-xs px-2 py-0.5 rounded-full border font-semibold ${levelBadge}`}>
          {product.level === "recommended" ? "✓ Rec." : "~ Opt."}
        </span>
      </div>

      <p className="text-xs text-slate-600 leading-relaxed">{product.reasons[0]}</p>

      <div className="flex items-center justify-between">
        {product.triggers && product.triggers.length > 0 && (
          <button
            onClick={() => setExpanded((v) => !v)}
            className="text-xs text-slate-400 hover:text-slate-600 underline decoration-dotted transition-colors"
          >
            {expanded ? "Hide signals ▲" : "View signals ▼"}
          </button>
        )}
        {details && onDeepDive && (
          <button
            onClick={onDeepDive}
            className="text-xs text-blue-500 hover:text-blue-700 font-medium ml-auto"
          >
            Deep-dive →
          </button>
        )}
      </div>

      {expanded && product.triggers && (
        <div className="flex flex-wrap gap-1">
          {product.triggers.map((t, i) => (
            <span key={i} className="text-xs bg-white/80 border border-slate-200 text-slate-500 px-1.5 py-0.5 rounded-md">{t}</span>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Product Deep-dive Dialog ─────────────────────────────────────────────────
function ProductDeepDiveDialog({
  product,
  open,
  onClose,
}: {
  product: ProductDecision | null;
  open: boolean;
  onClose: () => void;
}) {
  if (!product) return null;
  const cat = PRODUCT_CATEGORY[product.key];
  const details = PRODUCT_DETAILS[product.key];
  if (!details) return null;

  return (
    <SimpleDialog open={open} onClose={onClose}>
      <div className="p-6 space-y-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <span className="text-3xl">{cat?.icon ?? "📦"}</span>
            <div>
              <h2 className="text-xl font-bold text-slate-900">{product.name}</h2>
              <p className="text-sm text-slate-500 mt-0.5">{details.tagline}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 text-xl leading-none mt-0.5">✕</button>
        </div>

        <p className="text-sm text-slate-600 leading-relaxed">{details.description}</p>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">Key Features</h4>
            <ul className="space-y-1">
              {details.keyFeatures.map((f, i) => (
                <li key={i} className="text-xs text-slate-700 flex gap-2"><span className="text-green-500 flex-shrink-0">✓</span>{f}</li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">Best For</h4>
            <ul className="space-y-1">
              {details.bestFor.map((b, i) => (
                <li key={i} className="text-xs text-slate-700 flex gap-2"><span className="text-blue-400 flex-shrink-0">→</span>{b}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="flex gap-4">
          <div className="flex-1 rounded-lg bg-blue-50 border border-blue-200 p-3 text-center">
            <p className="text-xs text-blue-500 font-medium mb-1">Typical Implementation</p>
            <p className="text-lg font-bold text-blue-900">{details.implementationWeeks.min}–{details.implementationWeeks.max} wks</p>
          </div>
          <div className="flex-1 rounded-lg bg-slate-50 border border-slate-200 p-3">
            <p className="text-xs text-slate-500 font-medium mb-1.5">Key Certifications</p>
            <div className="flex flex-wrap gap-1">
              {details.certifications.map((c, i) => (
                <span key={i} className="text-xs bg-white border border-slate-200 text-slate-600 px-2 py-0.5 rounded-full">{c}</span>
              ))}
            </div>
          </div>
        </div>

        {details.relatedProducts.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">Often Paired With</h4>
            <div className="flex flex-wrap gap-2">
              {details.relatedProducts.map((key) => {
                const relCat = PRODUCT_CATEGORY[key];
                return (
                  <span key={key} className={`text-xs px-2 py-1 rounded-full border font-medium ${relCat?.bg ?? "bg-slate-50"} ${relCat?.color ?? "text-slate-600"} ${relCat?.border ?? "border-slate-200"}`}>
                    {relCat?.icon} {key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                  </span>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </SimpleDialog>
  );
}

// ─── Visual Roadmap ────────────────────────────────────────────────────────────
function VisualRoadmap({ roadmap }: { roadmap: BlueprintResult["roadmap"] }) {
  return (
    <div className="space-y-0">
      {roadmap.map((phase, i) => (
        <div key={i} className="flex gap-4 relative pb-6 last:pb-0">
          {/* Connector line */}
          {i < roadmap.length - 1 && (
            <div className="absolute left-5 top-11 bottom-0 w-0.5 bg-gradient-to-b from-slate-300 to-slate-100" />
          )}

          {/* Phase circle */}
          <div className={`flex-shrink-0 w-10 h-10 rounded-full ${PHASE_COLORS[i % PHASE_COLORS.length]} text-white flex items-center justify-center text-sm font-bold shadow-sm z-10`}>
            {i + 1}
          </div>

          {/* Phase card */}
          <div className={`flex-1 rounded-xl border ${PHASE_BORDER_COLORS[i % PHASE_BORDER_COLORS.length]} ${PHASE_BG_COLORS[i % PHASE_BG_COLORS.length]} p-4`}>
            <p className="font-semibold text-slate-800 text-sm mb-2">{phase.phase}</p>
            <ul className="space-y-1">
              {phase.outcomes.map((outcome, j) => (
                <li key={j} className="flex items-start gap-2 text-xs text-slate-600">
                  <span className="text-green-500 font-bold flex-shrink-0 mt-0.5">✓</span>
                  {outcome}
                </li>
              ))}
            </ul>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── AppExchange Tab ──────────────────────────────────────────────────────────
function AppExchangeTab({ products }: { products: ProductDecision[] }) {
  const activeKeys = products
    .filter((p) => p.level === "recommended" || p.level === "optional")
    .map((p) => p.key);

  const sections = activeKeys
    .map((key) => ({ key, product: products.find((p) => p.key === key)!, apps: APPEXCHANGE_APPS[key] ?? [] }))
    .filter((s) => s.apps.length > 0);

  if (sections.length === 0) {
    return (
      <div className="text-center py-12 text-slate-400">
        <p className="text-2xl mb-2">📦</p>
        <p className="text-sm">No AppExchange recommendations for this blueprint&apos;s product set.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {sections.map(({ key, product, apps }) => {
        const cat = PRODUCT_CATEGORY[key];
        return (
          <div key={key}>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">{cat?.icon ?? "📦"}</span>
              <h3 className="text-sm font-semibold text-slate-700">{product.name}</h3>
              <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${cat?.bg} ${cat?.color} ${cat?.border}`}>{apps.length} app{apps.length !== 1 ? "s" : ""}</span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {apps.map((app, i) => (
                <div key={i} className="rounded-xl border border-slate-200 bg-white p-4 hover:shadow-sm transition-shadow space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-bold text-slate-900">{app.name}</p>
                      <span className="text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-md font-medium">{app.category}</span>
                    </div>
                    <div className="flex items-center gap-0.5 flex-shrink-0">
                      {[1,2,3,4,5].map((star) => (
                        <span key={star} className={`text-xs ${star <= Math.round(app.rating) ? "text-amber-400" : "text-slate-200"}`}>★</span>
                      ))}
                      <span className="text-xs text-slate-400 ml-0.5">{app.rating}</span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">{app.description}</p>
                  <div className="flex items-center justify-between pt-1">
                    <p className="text-xs text-slate-400">{app.publisher}</p>
                    <p className="text-xs text-slate-500 font-medium">{app.pricingNote}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Implementation Checklist Tab ─────────────────────────────────────────────
function ChecklistTab({ products }: { products: ProductDecision[] }) {
  const phases = generateChecklist(products);
  const [checked, setChecked] = useState<Set<string>>(new Set());

  function toggle(id: string) {
    setChecked((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  const totalItems = phases.reduce((sum, p) => sum + p.items.length, 0);
  const completedCount = checked.size;
  const pct = totalItems > 0 ? Math.round((completedCount / totalItems) * 100) : 0;

  const effortColor = {
    Low: "bg-green-100 text-green-700 border-green-200",
    Medium: "bg-amber-100 text-amber-700 border-amber-200",
    High: "bg-red-100 text-red-700 border-red-200",
  };
  const categoryColor = {
    Discovery: "bg-sky-100 text-sky-700",
    Config: "bg-blue-100 text-blue-700",
    Integration: "bg-purple-100 text-purple-700",
    Testing: "bg-orange-100 text-orange-700",
    Training: "bg-teal-100 text-teal-700",
  };

  return (
    <div className="space-y-6">
      {/* Progress */}
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="font-semibold text-slate-700">Overall Progress</span>
          <span className="text-slate-500 tabular-nums">{completedCount} / {totalItems} tasks ({pct}%)</span>
        </div>
        <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
        </div>
      </div>

      {phases.map((phase) => (
        <div key={phase.phase}>
          <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-blue-500" />
            {phase.phase}
            <span className="text-xs text-slate-400 font-normal ml-1">({phase.items.length} tasks)</span>
          </h3>
          <div className="space-y-2">
            {phase.items.map((item, idx) => {
              const id = `${phase.phase}:${idx}`;
              const done = checked.has(id);
              return (
                <div key={id} className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${done ? "bg-slate-50 border-slate-100 opacity-60" : "bg-white border-slate-200"}`}>
                  <button
                    onClick={() => toggle(id)}
                    className={`flex-shrink-0 w-4.5 h-4.5 mt-0.5 rounded border-2 transition-colors flex items-center justify-center ${done ? "bg-green-500 border-green-500" : "border-slate-300 hover:border-blue-400"}`}
                    style={{ minWidth: 18, minHeight: 18 }}
                  >
                    {done && <span className="text-white text-xs leading-none">✓</span>}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm text-slate-800 leading-snug ${done ? "line-through text-slate-400" : ""}`}>{item.task}</p>
                    <div className="flex flex-wrap items-center gap-1.5 mt-1">
                      <span className="text-xs text-slate-400">{item.product}</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded-full border font-medium ${effortColor[item.effort]}`}>{item.effort} effort</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${categoryColor[item.category]}`}>{item.category}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── AI Chat Tab ──────────────────────────────────────────────────────────────
function AIChatTab({ result }: { result: BlueprintResult }) {
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([
    {
      role: "assistant",
      content: `Hi! I'm your Salesforce architect assistant. I've reviewed this blueprint and I'm ready to answer questions.\n\nYou can ask me things like:\n• "Why isn't CPQ recommended?"\n• "What would it cost for 500 users on Enterprise?"\n• "What's the implementation sequence?"\n• "What are the biggest risks with this setup?"`,
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Build a token-efficient blueprint summary for the system context
  const blueprintSummary = `
Products:
${result.products.filter((p) => p.level !== "not_needed").map((p) => `- ${p.name}: ${p.level}`).join("\n")}

Users: ${result.executiveSnapshot.usersDetected} (${result.executiveSnapshot.userCountBand})
Complexity: ${result.executiveSnapshot.complexityLevel}
Focus: ${result.executiveSnapshot.primaryFocus}
Cost range: $${result.costEstimate.license.totalLow.toLocaleString()} – $${result.costEstimate.license.totalHigh.toLocaleString()} / year
Top risks: ${result.risks.slice(0, 3).join("; ")}
Roadmap phases: ${result.roadmap.map((r) => r.phase).join(" → ")}
`.trim();

  async function send() {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg = { role: "user" as const, content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [...messages, userMsg], blueprintSummary }),
      });
      const data = await res.json() as { reply: string };
      setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "Sorry, something went wrong. Please try again." }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-[500px]">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-3 p-4 bg-slate-50 rounded-xl border border-slate-200 mb-3">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[85%] rounded-xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
              msg.role === "user"
                ? "bg-blue-600 text-white rounded-br-none"
                : "bg-white border border-slate-200 text-slate-800 rounded-bl-none shadow-sm"
            }`}>
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white border border-slate-200 rounded-xl rounded-bl-none px-4 py-3 shadow-sm">
              <div className="flex gap-1 items-center">
                {[0, 150, 300].map((d) => (
                  <span key={d} className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: `${d}ms` }} />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
          placeholder="Ask about this blueprint… (Enter to send)"
          className="flex-1 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 dark:bg-slate-800 dark:border-slate-600 dark:text-slate-200"
        />
        <Button onClick={send} disabled={loading || !input.trim()} className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-4">
          Send
        </Button>
      </div>
    </div>
  );
}

// ─── Refine Blueprint Panel ───────────────────────────────────────────────────
function RefineBlueprintPanel({
  slug,
  isOwner,
  initialNeedText,
  initialAnswers,
  onRegenerate,
  onClose,
}: {
  slug: string | null;
  isOwner: boolean;
  initialNeedText: string;
  initialAnswers: Record<string, string>;
  onRegenerate: (result: BlueprintResult) => void;
  onClose: () => void;
}) {
  const [needText, setNeedText] = useState(initialNeedText);
  const [answers, setAnswers] = useState<Record<string, string>>(initialAnswers);
  const [additionalContext, setAdditionalContext] = useState("");
  const [askingMore, setAskingMore] = useState(false);
  const [newQuestion, setNewQuestion] = useState<string | null>(null);
  const [newAnswer, setNewAnswer] = useState("");
  const [regenerating, setRegenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const existingQA = Object.entries(answers);
  const mergedText = needText.trim() + (additionalContext.trim() ? `\n\nAdditional context: ${additionalContext.trim()}` : "");

  async function askMore() {
    setAskingMore(true);
    setError(null);
    try {
      const res = await fetch("/api/conversation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ needText: mergedText, answered: answers }),
      });
      const data = await res.json() as { question?: string };
      setNewQuestion(data.question ?? null);
      if (!data.question) setError("AI has enough information — click Regenerate to update your blueprint.");
    } catch {
      setError("Failed to get question. Try regenerating directly.");
    } finally {
      setAskingMore(false);
    }
  }

  function submitAnswer() {
    if (!newQuestion || !newAnswer.trim()) return;
    setAnswers((prev) => ({ ...prev, [newQuestion]: newAnswer.trim() }));
    setNewAnswer("");
    setNewQuestion(null);
  }

  async function regenerate() {
    setRegenerating(true);
    setError(null);
    try {
      const res = await fetch("/api/blueprint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: mergedText, answers }),
      });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json() as { result: BlueprintResult };

      // Persist updated needText, answers, and result to DB
      if (slug && isOwner) {
        await fetch(`/api/blueprint/${slug}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ result: data.result, needText: mergedText, answers }),
        });
      }

      onRegenerate(data.result);
      setAdditionalContext("");
      onClose();
    } catch {
      setError("Regeneration failed. Please try again.");
    } finally {
      setRegenerating(false);
    }
  }

  return (
    <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-5 space-y-4 print:hidden">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-blue-900">✏️ Refine Requirements</p>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-lg leading-none">✕</button>
      </div>

      {/* Original requirement text */}
      <div>
        <label className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5 block">
          Original requirement
        </label>
        <Textarea
          value={needText}
          onChange={(e) => setNeedText(e.target.value)}
          className="text-sm min-h-24 resize-none bg-white"
        />
      </div>

      {/* Previous Q&A history */}
      {existingQA.length > 0 && (
        <div>
          <label className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2 block">
            Previous clarifications ({existingQA.length})
          </label>
          <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
            {existingQA.map(([q, a]) => (
              <div key={q} className="bg-white border border-slate-100 rounded-xl px-3 py-2.5 text-sm">
                <p className="text-xs text-slate-400 font-medium mb-0.5">{q}</p>
                <p className="text-slate-700">{a}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* New AI question */}
      {newQuestion && (
        <div className="bg-white border border-blue-200 rounded-xl p-4 space-y-3">
          <p className="text-sm text-blue-800 font-medium">🤖 {newQuestion}</p>
          <div className="flex gap-2">
            <input
              value={newAnswer}
              onChange={(e) => setNewAnswer(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submitAnswer()}
              placeholder="Your answer…"
              className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <Button size="sm" onClick={submitAnswer} disabled={!newAnswer.trim()}>Add</Button>
            <Button size="sm" variant="outline" onClick={() => setNewQuestion(null)}>Skip</Button>
          </div>
        </div>
      )}

      {/* Add new context */}
      <div>
        <label className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5 block">
          Add new requirements or context
        </label>
        <Textarea
          value={additionalContext}
          onChange={(e) => setAdditionalContext(e.target.value)}
          placeholder="E.g. We've decided we also need a patient portal. User count is now 500. We want to integrate with Workday."
          className="text-sm min-h-20 resize-none bg-white"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-2 flex-wrap">
        <Button
          onClick={regenerate}
          disabled={regenerating}
          className="bg-blue-600 hover:bg-blue-700 text-white flex-1 min-w-36"
        >
          {regenerating ? "Regenerating…" : "🔄 Regenerate Blueprint"}
        </Button>
        <Button
          variant="outline"
          onClick={askMore}
          disabled={askingMore || !!newQuestion || regenerating}
          className="text-sm"
        >
          {askingMore ? "Thinking…" : "🤖 Ask AI more"}
        </Button>
      </div>
    </div>
  );
}

// ─── Business Object Map ──────────────────────────────────────────────────────
const BUSINESS_OBJECT_MAP = [
  { businessName: "Customers",           sfObject: "Account",          icon: "🏢", description: "Stores company or organization information — your B2B accounts or consumer households." },
  { businessName: "Customer Contacts",   sfObject: "Contact",          icon: "👤", description: "People who work at the customer company — your primary points of contact." },
  { businessName: "Sales Deals",         sfObject: "Opportunity",      icon: "💰", description: "Tracks potential revenue and deal stages from initial interest to close." },
  { businessName: "Support Tickets",     sfObject: "Case",             icon: "🎫", description: "Tracks customer service issues from first contact through resolution." },
  { businessName: "Sales Prospects",     sfObject: "Lead",             icon: "🌱", description: "Unqualified prospects before they become contacts and opportunities." },
  { businessName: "Marketing Campaigns", sfObject: "Campaign",         icon: "📣", description: "Tracks marketing initiatives, their budget, and measurable ROI." },
  { businessName: "Customer Contracts",  sfObject: "Contract",         icon: "📋", description: "Legal agreements and terms with your customers, linked to accounts." },
  { businessName: "Customer Orders",     sfObject: "Order",            icon: "📦", description: "Tracks purchases and their fulfilment status post-sale." },
  { businessName: "Product Catalog",     sfObject: "Product (Product2)", icon: "🏷️", description: "Items or services available for sale, with descriptions and codes." },
  { businessName: "Pricing Lists",       sfObject: "Price Book (Pricebook2)", icon: "💲", description: "Collections of products with associated prices for different markets or segments." },
  { businessName: "Activity Tasks",      sfObject: "Task",             icon: "✅", description: "To-do items and follow-up activities linked to any record." },
  { businessName: "Calendar Events",     sfObject: "Event",            icon: "📅", description: "Meetings, calls, and appointments tied to accounts and contacts." },
];

// ─── Data Model Diagram ───────────────────────────────────────────────────────
function DataModelDiagram({ products }: { products: ProductDecision[] }) {
  const keys = new Set(products.filter((p) => p.level !== "not_needed").map((p) => p.key));

  const accountChildren: Array<{ name: string; icon: string; desc: string }> = [
    { name: "Contact", icon: "👤", desc: "People at the company" },
  ];
  if (keys.has("sales_cloud"))   accountChildren.push({ name: "Opportunity", icon: "💰", desc: "Sales deals in progress" });
  if (keys.has("service_cloud")) accountChildren.push({ name: "Case",        icon: "🎫", desc: "Support tickets" });
  if (keys.has("cpq_revenue"))   accountChildren.push({ name: "Quote",       icon: "📋", desc: "Configured price quotes" });
  if (keys.has("commerce_cloud")) accountChildren.push({ name: "Order",      icon: "📦", desc: "Customer orders" });
  if (keys.has("field_service")) accountChildren.push({ name: "Work Order",  icon: "🔧", desc: "Field service requests" });

  const roots = [{ name: "Account", icon: "🏢", children: accountChildren }];

  if (keys.has("sales_cloud") || keys.has("pardot")) {
    roots.push({
      name: "Lead",
      icon: "🌱",
      children: [
        { name: "Contact (converted)",     icon: "👤", desc: "On conversion" },
        { name: "Opportunity (converted)", icon: "💰", desc: "On conversion" },
        { name: "Account (converted)",     icon: "🏢", desc: "On conversion" },
      ],
    });
  }

  const mermaid = [
    "graph TD",
    "  Account --> Contact",
    keys.has("sales_cloud")    ? "  Account --> Opportunity" : "",
    keys.has("service_cloud")  ? "  Account --> Case" : "",
    keys.has("cpq_revenue")    ? "  Opportunity --> Quote" : "",
    keys.has("field_service")  ? "  Case --> WorkOrder[Work Order]" : "",
    keys.has("commerce_cloud") ? "  Quote --> Order" : "",
    keys.has("sales_cloud") || keys.has("pardot") ? "  Lead -->|converted| Contact\n  Lead -->|converted| Opportunity\n  Lead -->|converted| Account" : "",
  ].filter(Boolean).join("\n");

  return (
    <div className="space-y-5">
      <div className="rounded-lg bg-blue-50 border border-blue-100 p-3 text-xs text-blue-700 leading-relaxed">
        💡 Core Salesforce object relationships based on your recommended products. Account is always the central record.
      </div>

      {/* Visual tree */}
      {roots.map((root, ri) => (
        <div key={ri} className="space-y-2">
          <div className="inline-flex items-center gap-2 bg-slate-800 text-white rounded-xl px-3.5 py-2 text-sm font-bold shadow-sm">
            <span className="text-base">{root.icon}</span>
            <span>{root.name}</span>
            <span className="text-xs text-slate-400 font-normal ml-1">root object</span>
          </div>
          <div className="ml-5 pl-5 border-l-2 border-slate-200 space-y-2">
            {root.children.map((child, ci) => (
              <div key={ci} className="flex items-center gap-2">
                <div className="flex-shrink-0 w-4 h-px bg-slate-300" />
                <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 flex items-center gap-2 hover:shadow-sm transition-shadow">
                  <span className="text-sm">{child.icon}</span>
                  <div>
                    <p className="text-xs font-semibold text-slate-800">{child.name}</p>
                    <p className="text-xs text-slate-400">{child.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Mermaid-style text diagram */}
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Relationship Reference</p>
        <pre className="text-xs text-slate-600 leading-loose font-mono overflow-x-auto whitespace-pre-wrap">{mermaid}</pre>
      </div>
    </div>
  );
}

// ─── Technical Blueprint Tab ──────────────────────────────────────────────────
function TechnicalBlueprintTab({ products }: { products: ProductDecision[] }) {
  const blueprint = generateTechnicalBlueprint(products);
  const [expanded, setExpanded] = useState<string | null>("automations");

  const sections = [
    { id: "automations",       label: "Automation Strategy",   icon: "⚡", count: blueprint.automations.length },
    { id: "integrations",      label: "Integration Strategy",  icon: "🔗", count: blueprint.integrations.length },
    { id: "architecture",      label: "Architecture Notes",    icon: "🏗️", count: blueprint.architectureNotes.length },
    ...(blueprint.codeExample ? [{ id: "code", label: "Code Example", icon: "💻", count: 1 }] : []),
  ];

  const directionColors: Record<string, string> = {
    inbound:       "bg-green-100 text-green-700 border-green-200",
    outbound:      "bg-blue-100  text-blue-700  border-blue-200",
    bidirectional: "bg-purple-100 text-purple-700 border-purple-200",
  };
  const directionLabel: Record<string, string> = {
    inbound: "→ Inbound", outbound: "← Outbound", bidirectional: "↔ Bi-directional",
  };

  return (
    <div className="space-y-3">
      {sections.map((section) => (
        <div key={section.id} className="rounded-xl border border-slate-200 overflow-hidden">
          <button
            onClick={() => setExpanded((v) => (v === section.id ? null : section.id))}
            className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors text-left"
          >
            <div className="flex items-center gap-2">
              <span className="text-base">{section.icon}</span>
              <span className="text-sm font-semibold text-slate-800">{section.label}</span>
              <span className="text-xs text-slate-400 bg-slate-200 px-1.5 py-0.5 rounded-full">{section.count}</span>
            </div>
            <span className="text-slate-400 text-sm">{expanded === section.id ? "▲" : "▼"}</span>
          </button>

          {expanded === section.id && (
            <div className="p-4 space-y-3 bg-white">
              {section.id === "automations" && blueprint.automations.map((auto, i) => (
                <div key={i} className="rounded-lg border border-slate-100 bg-slate-50 p-3.5 space-y-1.5">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-slate-800">{auto.name}</p>
                    <div className="flex gap-1.5 flex-shrink-0">
                      <span className="text-xs bg-blue-100 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full font-medium">{auto.technology}</span>
                      <span className="text-xs bg-slate-100 text-slate-500 border border-slate-200 px-2 py-0.5 rounded-full">Trigger: {auto.trigger}</span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">{auto.description}</p>
                </div>
              ))}

              {section.id === "integrations" && blueprint.integrations.map((intg, i) => (
                <div key={i} className="rounded-lg border border-slate-100 bg-slate-50 p-3.5 space-y-1.5">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-slate-800">{intg.name}</p>
                    <div className="flex gap-1.5 flex-shrink-0">
                      <span className="text-xs bg-indigo-100 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded-full font-medium">{intg.method}</span>
                      <span className={`text-xs border px-2 py-0.5 rounded-full font-medium ${directionColors[intg.direction]}`}>{directionLabel[intg.direction]}</span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">{intg.description}</p>
                </div>
              ))}

              {section.id === "architecture" && (
                <ul className="space-y-2">
                  {blueprint.architectureNotes.map((note, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-slate-700 leading-relaxed">
                      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-slate-800 text-white text-xs flex items-center justify-center font-bold mt-0.5">{i + 1}</span>
                      {note}
                    </li>
                  ))}
                </ul>
              )}

              {section.id === "code" && blueprint.codeExample && (
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-slate-700">{blueprint.codeExample.title}</p>
                  <div className="rounded-xl bg-slate-900 p-4 overflow-x-auto">
                    <pre className="text-xs text-green-300 font-mono leading-relaxed whitespace-pre">{blueprint.codeExample.code}</pre>
                  </div>
                  <p className="text-xs text-slate-400">This is a reference implementation pattern. Adapt to your specific requirements.</p>
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Risks Section (collapsible, below tabs) ──────────────────────────────────
function RisksSection({ risks, onSave }: { risks: string[]; onSave: (u: string[]) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 print:hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 text-left"
      >
        <div className="flex items-center gap-2">
          <span className="text-base">⚠️</span>
          <span className="text-sm font-semibold text-amber-900">Key Risks &amp; Mitigations</span>
          <span className="text-xs text-amber-600 bg-amber-100 border border-amber-200 px-1.5 py-0.5 rounded-full">{risks.length}</span>
        </div>
        <span className="text-amber-600 text-sm">{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div className="px-4 pb-4">
          <EditableList items={risks} onSave={onSave} />
        </div>
      )}
    </div>
  );
}

// ─── Recommendation Expansion Panel ──────────────────────────────────────────
function RecommendationExpansionPanel({ result }: { result: BlueprintResult }) {
  const [selected, setSelected] = useState<string | null>(null);
  const [expansion, setExpansion] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const options = [
    { id: "architecture",  label: "🏗️ Improve Architecture",   desc: "Deeper architectural guidance" },
    { id: "ai",            label: "🤖 AI Automation Ideas",     desc: "Einstein & Agentforce use cases" },
    { id: "integrations",  label: "🔗 Integration Suggestions", desc: "API patterns and strategies" },
    { id: "reporting",     label: "📊 Reporting Strategy",      desc: "Dashboards, KPIs, analytics" },
  ];

  async function expand(optionId: string) {
    setSelected(optionId);
    setLoading(true);
    setExpansion(null);

    const blueprintSummary = `Products: ${result.products
      .filter((p) => p.level !== "not_needed")
      .map((p) => `${p.name} (${p.level})`)
      .join(", ")}
Focus: ${result.executiveSnapshot.primaryFocus}
Complexity: ${result.executiveSnapshot.complexityLevel}
Users: ${result.executiveSnapshot.usersDetected}`.trim();

    try {
      const res = await fetch("/api/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ option: optionId, blueprintSummary }),
      });
      const data = (await res.json()) as { content: string };
      setExpansion(data.content);
    } catch {
      setExpansion("Failed to load recommendations. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (dismissed) return null;

  return (
    <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-white print:hidden">
      <CardContent className="pt-4 space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-semibold text-blue-900">Would you like additional recommendations?</p>
            <p className="text-xs text-slate-500 mt-0.5">Select an area to expand with AI-powered guidance</p>
          </div>
          <button
            onClick={() => setDismissed(true)}
            className="text-slate-300 hover:text-slate-500 text-xl leading-none mt-0.5"
          >
            ✕
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {options.map((opt) => (
            <button
              key={opt.id}
              onClick={() => expand(opt.id)}
              disabled={loading}
              className={`rounded-xl border px-3 py-3 text-left transition-all duration-150 ${
                selected === opt.id
                  ? "border-blue-500 bg-blue-600 text-white shadow-md scale-[0.98]"
                  : "border-slate-200 bg-white hover:border-blue-300 hover:bg-blue-50 hover:shadow-sm text-slate-700"
              }`}
            >
              <div className="text-sm font-semibold mb-1">{opt.label}</div>
              <div className={`text-xs ${selected === opt.id ? "text-blue-100" : "text-slate-400"}`}>
                {opt.desc}
              </div>
            </button>
          ))}
        </div>

        {loading && (
          <div className="rounded-xl bg-white border border-slate-200 p-4 flex items-center gap-3">
            <div className="flex gap-1">
              {[0, 150, 300].map((d) => (
                <span key={d} className="h-2 w-2 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: `${d}ms` }} />
              ))}
            </div>
            <span className="text-sm text-slate-500">Generating recommendations…</span>
          </div>
        )}

        {expansion && !loading && (
          <div className="rounded-xl bg-white border border-blue-200 p-4 space-y-2">
            <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide">AI Recommendations</p>
            <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{expansion}</div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Main dashboard ───────────────────────────────────────────────────────────
export function BlueprintDashboard({ result: initial, slug, isOwner, aiPowered = false, needText: initialNeedText, savedAnswers: initialAnswers, onReset }: Props) {
  const [result, setResult] = useState<BlueprintResult>(initial);
  const [saving, setSaving] = useState(false);
  const [shareMsg, setShareMsg] = useState<string | null>(null);
  const [isPublic, setIsPublic] = useState(false);
  const [showNotNeeded, setShowNotNeeded] = useState(false);
  const [refineOpen, setRefineOpen] = useState(false);

  // Deep-dive dialog
  const [deepDiveProduct, setDeepDiveProduct] = useState<ProductDecision | null>(null);
  const [deepDiveOpen, setDeepDiveOpen] = useState(false);

  // Email dialog
  const [emailOpen, setEmailOpen] = useState(false);
  const [emailAddr, setEmailAddr] = useState("");

  // Export PDF dialog
  const [pdfOpen, setPdfOpen] = useState(false);
  const [companyName, setCompanyName] = useState("");

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
    const url = `${window.location.origin}/blueprint/${slug}/share`;
    await navigator.clipboard.writeText(url);
    setShareMsg("Share link copied!");
    setTimeout(() => setShareMsg(null), 3000);
  }

  function openDeepDive(product: ProductDecision) {
    setDeepDiveProduct(product);
    setDeepDiveOpen(true);
  }

  function sendEmail() {
    if (!emailAddr.trim()) return;
    const shareUrl = slug ? `${window.location.origin}/blueprint/${slug}/share` : window.location.href;
    const title = `Salesforce Blueprint — ${result.executiveSnapshot.primaryFocus}`;
    const body = [
      `Hi,`,
      ``,
      `I wanted to share a Salesforce implementation blueprint with you.`,
      ``,
      `KEY DETAILS:`,
      `• Focus: ${result.executiveSnapshot.primaryFocus}`,
      `• Users: ${result.executiveSnapshot.usersDetected}`,
      `• Complexity: ${result.executiveSnapshot.complexityLevel}`,
      ``,
      `RECOMMENDED PRODUCTS:`,
      result.products.filter((p) => p.level === "recommended").map((p) => `• ${p.name}`).join("\n"),
      ``,
      `ESTIMATED INVESTMENT:`,
      `$${result.costEstimate.license.totalLow.toLocaleString()} – $${result.costEstimate.license.totalHigh.toLocaleString()} / year (license)`,
      ``,
      `TOP RISKS:`,
      result.risks.slice(0, 3).map((r, i) => `${i + 1}. ${r}`).join("\n"),
      ``,
      `View full blueprint: ${shareUrl}`,
      ``,
      `Note: This is a directional estimate only and not official Salesforce pricing.`,
      `Generated by OrgBlueprint`,
    ].join("\n");

    const mailtoUrl = `mailto:${emailAddr}?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoUrl;
    setEmailOpen(false);
    setEmailAddr("");
  }

  function openPrintPreview() {
    const url = slug
      ? `/blueprint/${slug}/print${companyName ? `?company=${encodeURIComponent(companyName)}` : ""}`
      : undefined;
    if (url) window.open(url, "_blank");
    else window.print();
    setPdfOpen(false);
  }

  const [pdfDownloading, setPdfDownloading] = useState(false);

  async function handleDownloadPdf() {
    setPdfDownloading(true);
    try {
      await downloadBlueprintPdf(
        result,
        result.executiveSnapshot.primaryFocus || "Salesforce Blueprint",
        companyName || undefined
      );
    } finally {
      setPdfDownloading(false);
      setPdfOpen(false);
    }
  }


  const recommended = result.products.filter((p) => p.level === "recommended");
  const optional = result.products.filter((p) => p.level === "optional");
  const notNeeded = result.products.filter((p) => p.level === "not_needed");

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      {/* Deep-dive dialog */}
      <ProductDeepDiveDialog
        product={deepDiveProduct}
        open={deepDiveOpen}
        onClose={() => setDeepDiveOpen(false)}
      />

      {/* Email dialog */}
      <SimpleDialog open={emailOpen} onClose={() => setEmailOpen(false)}>
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">📧 Email this Blueprint</h2>
            <button onClick={() => setEmailOpen(false)} className="text-slate-400 hover:text-slate-700">✕</button>
          </div>
          <p className="text-sm text-slate-500">
            Enter a recipient email address. Your email client will open with a pre-filled summary.
          </p>
          <input
            type="email"
            value={emailAddr}
            onChange={(e) => setEmailAddr(e.target.value)}
            placeholder="colleague@company.com"
            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 dark:bg-slate-800 dark:border-slate-600 dark:text-slate-200"
          />
          <div className="flex gap-2">
            <Button onClick={sendEmail} className="bg-blue-600 hover:bg-blue-700 text-white flex-1">Open Email Client</Button>
            <Button variant="outline" onClick={() => setEmailOpen(false)} className="flex-1">Cancel</Button>
          </div>
        </div>
      </SimpleDialog>

      {/* PDF export dialog */}
      <SimpleDialog open={pdfOpen} onClose={() => setPdfOpen(false)}>
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">📤 Export as PDF</h2>
            <button onClick={() => setPdfOpen(false)} className="text-slate-400 hover:text-slate-700">✕</button>
          </div>
          <p className="text-sm text-slate-500">
            Optionally enter the client or company name to include on the cover page.
          </p>
          <input
            type="text"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="Client / Company name (optional)"
            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 dark:bg-slate-800 dark:border-slate-600 dark:text-slate-200"
          />
          <div className="flex flex-col gap-2">
            <Button
              onClick={handleDownloadPdf}
              disabled={pdfDownloading}
              className="bg-blue-600 hover:bg-blue-700 text-white w-full"
            >
              {pdfDownloading ? "Generating PDF…" : "⬇ Download PDF"}
            </Button>
            {slug && (
              <Button variant="outline" onClick={openPrintPreview} className="w-full text-sm">
                🖨 Open Print Preview (browser PDF)
              </Button>
            )}
            <Button variant="ghost" onClick={() => setPdfOpen(false)} className="w-full text-sm text-slate-500">
              Cancel
            </Button>
          </div>
        </div>
      </SimpleDialog>

      {/* ─── Toolbar ─── */}
      <div className="flex items-center justify-between flex-wrap gap-2 print:hidden">
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="text-xl font-bold text-slate-900">Salesforce Blueprint</h1>
          {aiPowered && <Badge className="bg-blue-100 text-blue-800 border-blue-200 text-xs">✦ AI-powered</Badge>}
        </div>
        <div className="flex gap-2 items-center flex-wrap">
          {saving && <span className="text-xs text-slate-400">Saving…</span>}
          {shareMsg && <span className="text-xs text-green-600 font-medium">{shareMsg}</span>}
          <Button
            variant="outline" size="sm"
            onClick={() => setRefineOpen((v) => !v)}
            className="text-xs border-blue-200 text-blue-700 hover:bg-blue-50"
          >
            ✏️ {refineOpen ? "Close editor" : "Edit & Regenerate"}
          </Button>
          <Button variant="outline" size="sm" onClick={() => setEmailOpen(true)} className="text-xs">
            📧 Email
          </Button>
          <Button variant="outline" size="sm" onClick={() => setPdfOpen(true)} className="text-xs">
            📤 Export PDF
          </Button>
          {slug && isOwner && (
            <Button
              variant="outline" size="sm"
              onClick={shareBlueprint}
              className={`text-xs ${isPublic ? "text-green-700 border-green-200" : ""}`}
            >
              {isPublic ? "🔗 Public" : "🔗 Share"}
            </Button>
          )}
          {onReset && (
            <Button
              variant="outline"
              size="sm"
              onClick={onReset}
              className="text-xs border-slate-300 text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            >
              🔄 Run Another Scenario
            </Button>
          )}
        </div>
      </div>

      {/* Refine & Regenerate panel */}
      {refineOpen && (
        <RefineBlueprintPanel
          slug={slug}
          isOwner={isOwner}
          initialNeedText={initialNeedText ?? ""}
          initialAnswers={initialAnswers ?? {}}
          onRegenerate={(updated) => { setResult(updated); }}
          onClose={() => setRefineOpen(false)}
        />
      )}

      {/* Executive Snapshot */}
      <Card className="border-slate-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Executive Snapshot</CardTitle>
        </CardHeader>
        <CardContent>
          <ExecutiveSnapshotCards snapshot={result.executiveSnapshot} />
        </CardContent>
      </Card>

      {/* Product Recommendations */}
      <Card className="border-slate-200">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="text-base">Product Recommendations</CardTitle>
            <div className="flex gap-3 text-xs text-slate-500">
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-green-500" />{recommended.length} recommended</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-amber-400" />{optional.length} optional</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-slate-300" />{notNeeded.length} not needed</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          {recommended.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-green-700 mb-2.5 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-green-500" />Recommended
              </p>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {recommended.map((p) => (
                  <ProductCard
                    key={p.key} product={p}
                    onDeepDive={PRODUCT_DETAILS[p.key] ? () => openDeepDive(p) : undefined}
                  />
                ))}
              </div>
            </div>
          )}
          {optional.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-amber-700 mb-2.5 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-amber-400" />Optional
              </p>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {optional.map((p) => (
                  <ProductCard
                    key={p.key} product={p}
                    onDeepDive={PRODUCT_DETAILS[p.key] ? () => openDeepDive(p) : undefined}
                  />
                ))}
              </div>
            </div>
          )}
          {notNeeded.length > 0 && (
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
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {notNeeded.map((p) => <ProductCard key={p.key} product={p} muted />)}
                </div>
              )}
              {!showNotNeeded && (
                <p className="text-xs text-slate-400 italic">{notNeeded.length} products not relevant — click show to expand</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Why mapping */}
      {result.whyMapping && result.whyMapping.length > 0 && (
        <Card className="border-slate-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Why these products?</CardTitle>
            <p className="text-xs text-slate-500 mt-0.5">How your business needs map to Salesforce products</p>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-lg border border-slate-100">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Business Need</th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Product</th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Rationale</th>
                  </tr>
                </thead>
                <tbody>
                  {result.whyMapping.map((row, i) => {
                    const matchedProduct = result.products.find((p) => p.name === row.product);
                    const specificNeed = matchedProduct ? (PRODUCT_BUSINESS_NEED[matchedProduct.key] ?? row.need) : row.need;
                    const cat = matchedProduct ? PRODUCT_CATEGORY[matchedProduct.key] : undefined;
                    return (
                      <tr key={i} className={`border-b border-slate-50 hover:bg-slate-50/70 transition-colors ${i % 2 === 0 ? "bg-white" : "bg-slate-50/40"}`}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {cat && <span className="text-sm flex-shrink-0">{cat.icon}</span>}
                            <span className="text-xs font-medium text-slate-700 leading-snug">{specificNeed}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2 py-1 rounded-full border ${cat ? `${cat.bg} ${cat.color} ${cat.border}` : "bg-slate-50 text-slate-600 border-slate-200"}`}>
                            {cat?.icon} {row.product}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-600 leading-relaxed max-w-xs">{row.why}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ─── Tabbed sections ─── */}
      <Tabs defaultValue="overview">
        {/* Primary tab strip */}
        <TabsList className="flex-wrap h-auto print:hidden gap-1 bg-slate-100/80 p-1.5 rounded-2xl shadow-inner">
          <TabsTrigger value="overview"    className="text-xs rounded-xl px-3.5 py-2 font-medium transition-all duration-150 hover:bg-white hover:shadow-sm data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-blue-700 data-[state=active]:font-semibold">Overview</TabsTrigger>
          <TabsTrigger value="architecture" className="text-xs rounded-xl px-3.5 py-2 font-medium transition-all duration-150 hover:bg-white hover:shadow-sm data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-blue-700 data-[state=active]:font-semibold">Architecture</TabsTrigger>
          <TabsTrigger value="data-model"  className="text-xs rounded-xl px-3.5 py-2 font-medium transition-all duration-150 hover:bg-white hover:shadow-sm data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-blue-700 data-[state=active]:font-semibold">Data Model</TabsTrigger>
          <TabsTrigger value="technical"   className="text-xs rounded-xl px-3.5 py-2 font-medium transition-all duration-150 hover:bg-white hover:shadow-sm data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-blue-700 data-[state=active]:font-semibold">Technical</TabsTrigger>
          <TabsTrigger value="cost"        className="text-xs rounded-xl px-3.5 py-2 font-medium transition-all duration-150 hover:bg-white hover:shadow-sm data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-blue-700 data-[state=active]:font-semibold">Cost</TabsTrigger>
          <TabsTrigger value="roadmap"     className="text-xs rounded-xl px-3.5 py-2 font-medium transition-all duration-150 hover:bg-white hover:shadow-sm data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-blue-700 data-[state=active]:font-semibold">Roadmap</TabsTrigger>
          <TabsTrigger value="ai-chat"     className="text-xs rounded-xl px-3.5 py-2 font-medium transition-all duration-150 hover:bg-white hover:shadow-sm data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-blue-700 data-[state=active]:font-semibold text-slate-400">🤖 Ask AI</TabsTrigger>
        </TabsList>

        {/* ── Overview: Products + Analytics + Risks ── */}
        <TabsContent value="overview">
          <div className="space-y-4">
            {/* Product grid is rendered above tabs via ProductGrid — show analytics & risks here */}
            <Card className="border-slate-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">📊 Analytics Pack</CardTitle>
                <p className="text-xs text-slate-500 mt-0.5">Recommended reports and dashboards for your product selection</p>
              </CardHeader>
              <CardContent className="pt-2">
                <EditableList items={result.analyticsPack} onSave={editList("analyticsPack")} />
              </CardContent>
            </Card>
            <RisksSection risks={result.risks} onSave={editList("risks")} />
            <RecommendationExpansionPanel result={result} />
          </div>
        </TabsContent>

        {/* ── Architecture: OOTB vs Custom + Integrations + AppExchange ── */}
        <TabsContent value="architecture">
          <div className="space-y-4">
            <Card className="border-slate-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">OOTB vs Custom Analysis</CardTitle>
                <p className="text-xs text-slate-500 mt-0.5">Out-of-the-box capability fit vs customization required</p>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="overflow-x-auto rounded-lg border border-slate-100">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200">
                        <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Area</th>
                        <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">OOTB Fit</th>
                        <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Customization</th>
                        <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Risk</th>
                        <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.ootbVsCustom.map((row, i) => {
                        const ootbColor = row.ootbFit === "High" ? "bg-green-100 text-green-700 border-green-200" : row.ootbFit === "Medium" ? "bg-amber-100 text-amber-700 border-amber-200" : "bg-red-100 text-red-700 border-red-200";
                        const custColor = row.customizationLevel === "Low" ? "bg-green-100 text-green-700 border-green-200" : row.customizationLevel === "Medium" ? "bg-amber-100 text-amber-700 border-amber-200" : "bg-red-100 text-red-700 border-red-200";
                        const riskColor = row.risk === "Low" ? "bg-green-100 text-green-700 border-green-200" : row.risk === "Medium" ? "bg-amber-100 text-amber-700 border-amber-200" : "bg-red-100 text-red-700 border-red-200";
                        return (
                          <tr key={i} className={`border-b border-slate-50 hover:bg-slate-50/70 transition-colors ${i % 2 === 0 ? "bg-white" : "bg-slate-50/40"}`}>
                            <td className="px-4 py-3 font-semibold text-slate-800 text-xs">{row.area}</td>
                            <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full border font-semibold ${ootbColor}`}>{row.ootbFit}</span></td>
                            <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full border font-semibold ${custColor}`}>{row.customizationLevel}</span></td>
                            <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full border font-semibold ${riskColor}`}>{row.risk}</span></td>
                            <td className="px-4 py-3 text-xs text-slate-600 leading-relaxed">{row.notes}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Integration Map</CardTitle>
                <p className="text-xs text-slate-500 mt-0.5">External systems and recommended integration patterns</p>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {result.integrationMap.map((item, i) => {
                    const patternConfig = {
                      API:   { color: "bg-blue-100 text-blue-700 border-blue-200",   icon: "⚡" },
                      Batch: { color: "bg-slate-100 text-slate-700 border-slate-200", icon: "📦" },
                      Event: { color: "bg-green-100 text-green-700 border-green-200", icon: "🔔" },
                    }[item.pattern] ?? { color: "bg-slate-100 text-slate-600 border-slate-200", icon: "🔗" };
                    return (
                      <div key={i} className="rounded-xl border border-slate-200 bg-white p-3.5 space-y-2 hover:shadow-sm transition-shadow">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-semibold text-slate-800">{item.system}</p>
                          <span className={`text-xs px-2 py-0.5 rounded-full border font-semibold ${patternConfig.color}`}>{patternConfig.icon} {item.pattern}</span>
                        </div>
                        <p className="text-xs text-slate-500">
                          {item.pattern === "API" && "Real-time synchronous integration via REST/SOAP API"}
                          {item.pattern === "Batch" && "Scheduled bulk data sync (nightly or periodic)"}
                          {item.pattern === "Event" && "Event-driven real-time data streaming"}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">📦 AppExchange Recommendations</CardTitle>
                <p className="text-xs text-slate-500 mt-0.5">Curated partner apps that extend your product selection</p>
              </CardHeader>
              <CardContent className="pt-4">
                <AppExchangeTab products={result.products} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── Data Model ── */}
        <TabsContent value="data-model">
          <Card className="border-slate-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Data Model</CardTitle>
              <p className="text-xs text-slate-500 mt-0.5">Business entities, Salesforce objects, and their relationships</p>
            </CardHeader>
            <CardContent className="pt-2 space-y-6">
              {/* Business Entity Cards — business-friendly names first */}
              <div>
                <h3 className="text-sm font-semibold text-slate-700 mb-1">Business Entities</h3>
                <p className="text-xs text-slate-500 mb-3">Your data in plain business language — mapped to the underlying Salesforce object</p>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {BUSINESS_OBJECT_MAP.map((obj) => (
                    <div key={obj.sfObject} className="rounded-xl border border-slate-200 bg-white p-3.5 hover:shadow-sm transition-shadow space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{obj.icon}</span>
                        <div>
                          {/* Business-friendly name is the primary label */}
                          <p className="text-sm font-bold text-slate-900">{obj.businessName}</p>
                          <span className="text-xs font-mono text-slate-400 bg-slate-50 border border-slate-100 px-1.5 py-0.5 rounded-md">
                            {obj.sfObject}
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">{obj.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Relationship Diagram */}
              <div>
                <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                  Object Relationship Diagram
                  <span className="text-xs font-normal text-slate-400">— based on your product selection</span>
                </h3>
                <DataModelDiagram products={result.products} />
              </div>

              {/* Automations detail list */}
              <div>
                <h3 className="text-sm font-semibold text-slate-700 mb-2">Objects &amp; Automations</h3>
                <EditableList items={result.objectsAndAutomations} onSave={editList("objectsAndAutomations")} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Technical Blueprint ── */}
        <TabsContent value="technical">
          <Card className="border-slate-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Technical Blueprint</CardTitle>
              <p className="text-xs text-slate-500 mt-0.5">Architecture guidance for admins, developers, and solution architects</p>
            </CardHeader>
            <CardContent className="pt-2">
              <TechnicalBlueprintTab products={result.products} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Cost Calculator ── */}
        <TabsContent value="cost">
          <Card className="border-slate-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Interactive Cost Calculator</CardTitle>
              <p className="text-xs text-slate-500 mt-0.5">Adjust users and tier to see real-time estimates</p>
            </CardHeader>
            <CardContent>
              <InteractiveCostCalculator products={result.products} initialUsers={result.executiveSnapshot.usersDetected} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Roadmap + Checklist + Docs ── */}
        <TabsContent value="roadmap">
          <div className="space-y-4">
            <Card className="border-slate-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Implementation Roadmap</CardTitle>
                <p className="text-xs text-slate-500 mt-0.5">Phased approach to Salesforce delivery</p>
              </CardHeader>
              <CardContent className="pt-4">
                <VisualRoadmap roadmap={result.roadmap} />
              </CardContent>
            </Card>

            <Card className="border-slate-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">✅ Implementation Checklist</CardTitle>
                <p className="text-xs text-slate-500 mt-0.5">Track tasks by phase — tailored to your product selection</p>
              </CardHeader>
              <CardContent className="pt-4">
                <ChecklistTab products={result.products} />
              </CardContent>
            </Card>

            <Card className="border-slate-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">📄 Document Checklist</CardTitle>
                <p className="text-xs text-slate-500 mt-0.5">Key deliverables and artefacts for your implementation</p>
              </CardHeader>
              <CardContent className="pt-4">
                <EditableList items={result.documentChecklist} onSave={editList("documentChecklist")} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── AI Chat ── */}
        <TabsContent value="ai-chat">
          <Card className="border-slate-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Ask the AI Architect</CardTitle>
              <p className="text-xs text-slate-500 mt-0.5">Ask questions about this specific blueprint — why products were chosen, costs, risks, and more</p>
            </CardHeader>
            <CardContent>
              <AIChatTab result={result} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
