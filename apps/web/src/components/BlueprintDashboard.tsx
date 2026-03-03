"use client";

import { useState } from "react";
import { BlueprintResult, ProductDecision } from "@orgblueprint/core";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { PRODUCT_PRICING, PRICING_DISCLAIMER, computeAnnualCost } from "@/lib/pricing";

interface Props {
  result: BlueprintResult;
  slug: string | null;
  isOwner: boolean;
  aiPowered?: boolean;
  needText?: string;
  onReset?: () => void;
}

// ─── Category config ────────────────────────────────────────────────────────────
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
                          className="border border-slate-200 dark:border-slate-600 rounded-md px-2 py-1 text-xs bg-white dark:bg-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-400 cursor-pointer"
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

      {/* License total summary */}
      <div className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 p-4 text-white">
        <p className="text-xs font-medium opacity-80 mb-1">Annual license cost (estimate)</p>
        <p className="text-3xl font-bold tracking-tight">${licenseTotal.toLocaleString()}</p>
        <p className="text-xs opacity-70 mt-1">
          ≈ ${userCount > 0 ? Math.round(licenseTotal / userCount).toLocaleString() : "—"} per user / year · {userCount.toLocaleString()} users
        </p>
      </div>

      <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 text-xs text-slate-500 leading-relaxed">
        💡 <strong>Implementation costs vary by partner.</strong> Salesforce SI partners typically charge $150–$350/hr.
        Request quotes from Salesforce directly or certified partners for an accurate implementation estimate.
      </div>
    </div>
  );
}

// ─── Executive Snapshot Cards ────────────────────────────────────────────────
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
  const confidenceColor =
    confidencePct >= 80 ? "bg-green-500" :
    confidencePct >= 60 ? "bg-amber-400" :
    "bg-red-400";

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {/* Focus Area */}
      <div className="rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50 to-white p-4 space-y-1.5">
        <div className="flex items-center gap-1.5">
          <span className="text-base">🎯</span>
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Primary Focus</p>
        </div>
        <p className="text-sm font-bold text-slate-900 leading-snug">{snapshot.primaryFocus || "General CRM"}</p>
      </div>

      {/* User Count */}
      <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-4 space-y-1.5">
        <div className="flex items-center gap-1.5">
          <span className="text-base">👥</span>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Users Detected</p>
        </div>
        <div className="flex items-end gap-2">
          <p className="text-2xl font-bold text-slate-900 tabular-nums leading-none">{snapshot.usersDetected}</p>
          <span className={`text-xs px-1.5 py-0.5 rounded-full border font-medium mb-0.5 ${bandConfig.color}`}>
            {bandConfig.label}
          </span>
        </div>
      </div>

      {/* Complexity */}
      <div className={`rounded-xl border ${complexityConfig.border} ${complexityConfig.bg} p-4 space-y-1.5`}>
        <div className="flex items-center gap-1.5">
          <span className="text-base">⚡</span>
          <p className={`text-xs font-semibold uppercase tracking-wide ${complexityConfig.color}`}>Complexity</p>
        </div>
        <p className={`text-xl font-bold ${complexityConfig.color}`}>{snapshot.complexityLevel}</p>
        <div className="h-1.5 bg-white/60 rounded-full overflow-hidden">
          <div className={`h-full ${complexityConfig.bar} rounded-full transition-all duration-700`} style={{ width: `${complexityConfig.pct}%` }} />
        </div>
      </div>

      {/* Confidence Score */}
      <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-4 space-y-1.5">
        <div className="flex items-center gap-1.5">
          <span className="text-base">📊</span>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Confidence</p>
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

// ─── Product Card ─────────────────────────────────────────────────────────────
function ProductCard({ product, muted = false }: { product: ProductDecision; muted?: boolean }) {
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

  const levelBadge =
    product.level === "recommended"
      ? "bg-green-100 text-green-800 border-green-200"
      : "bg-amber-100 text-amber-800 border-amber-200";

  return (
    <div className={`rounded-xl border ${cat?.border ?? "border-slate-200"} ${cat?.bg ?? "bg-slate-50"} p-3.5 space-y-2 hover:shadow-sm transition-shadow duration-150`}>
      {/* Header */}
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

      {/* Reason */}
      <p className="text-xs text-slate-600 leading-relaxed">{product.reasons[0]}</p>

      {/* Triggers — expandable */}
      {product.triggers && product.triggers.length > 0 && (
        <div>
          <button
            onClick={() => setExpanded((v) => !v)}
            className="text-xs text-slate-400 hover:text-slate-600 underline decoration-dotted transition-colors"
          >
            {expanded ? "Hide signals ▲" : "View signals ▼"}
          </button>
          {expanded && (
            <div className="mt-1.5 flex flex-wrap gap-1">
              {product.triggers.map((t, i) => (
                <span key={i} className="text-xs bg-white/80 border border-slate-200 text-slate-500 px-1.5 py-0.5 rounded-md">
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main dashboard ────────────────────────────────────────────────────────────
export function BlueprintDashboard({ result: initial, slug, isOwner, aiPowered = false, needText: initialNeedText, onReset }: Props) {
  const [result, setResult] = useState<BlueprintResult>(initial);
  const [saving, setSaving] = useState(false);
  const [shareMsg, setShareMsg] = useState<string | null>(null);
  const [isPublic, setIsPublic] = useState(false);
  const [showNotNeeded, setShowNotNeeded] = useState(false);
  const [refineOpen, setRefineOpen] = useState(false);
  const [refineText, setRefineText] = useState(initialNeedText ?? "");
  const [regenerating, setRegenerating] = useState(false);
  const [regenError, setRegenError] = useState<string | null>(null);

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

  async function regenerateBlueprint() {
    if (!refineText.trim()) return;
    setRegenerating(true);
    setRegenError(null);
    try {
      const res = await fetch("/api/blueprint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: refineText }),
      });
      if (!res.ok) throw new Error("Failed to regenerate");
      const data = await res.json();
      setResult(data.result);
      setRefineOpen(false);
    } catch {
      setRegenError("Regeneration failed. Please try again.");
    } finally {
      setRegenerating(false);
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
        </div>
        <div className="flex gap-2 items-center flex-wrap">
          {saving && <span className="text-xs text-slate-400">Saving…</span>}
          {shareMsg && <span className="text-xs text-green-600 font-medium">{shareMsg}</span>}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setRefineOpen((v) => !v)}
            className="text-xs border-blue-200 text-blue-700 hover:bg-blue-50"
          >
            ✏️ {refineOpen ? "Close editor" : "Edit & Regenerate"}
          </Button>
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

      {/* Refine & Regenerate panel */}
      {refineOpen && (
        <div className="rounded-xl border border-blue-800 bg-blue-950/40 p-4 space-y-3 print:hidden">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-blue-300">Refine your requirements</p>
            <p className="text-xs text-blue-400">Edit below and regenerate a fresh blueprint</p>
          </div>
          <Textarea
            value={refineText}
            onChange={(e) => setRefineText(e.target.value)}
            placeholder="Describe your business needs, team size, integrations, goals…"
            className="min-h-28 text-sm bg-white dark:bg-slate-800 dark:text-slate-200 border-blue-200 dark:border-blue-800 focus:ring-blue-400 resize-none"
          />
          {regenError && <p className="text-xs text-red-600">{regenError}</p>}
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={regenerateBlueprint}
              disabled={regenerating || !refineText.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs"
            >
              {regenerating ? "Generating…" : "🔄 Regenerate Blueprint"}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setRefineOpen(false)} className="text-xs text-slate-500">
              Cancel
            </Button>
          </div>
        </div>
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
          {/* Recommended */}
          {recommended.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-green-700 mb-2.5 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-green-500" />Recommended
              </p>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {recommended.map((p) => <ProductCard key={p.key} product={p} />)}
              </div>
            </div>
          )}

          {/* Optional */}
          {optional.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-amber-700 mb-2.5 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-amber-400" />Optional
              </p>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {optional.map((p) => <ProductCard key={p.key} product={p} />)}
              </div>
            </div>
          )}

          {/* Not Needed */}
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
                <p className="text-xs text-slate-400 italic">
                  {notNeeded.length} products not relevant — click show to expand
                </p>
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
                    // Derive product key from product name to look up specific business need
                    const productEntry = Object.entries(PRODUCT_BUSINESS_NEED).find(
                      ([, _need]) => result.products.find((p) => p.name === row.product && PRODUCT_BUSINESS_NEED[p.key])
                    );
                    const matchedProduct = result.products.find((p) => p.name === row.product);
                    const specificNeed = matchedProduct ? (PRODUCT_BUSINESS_NEED[matchedProduct.key] ?? row.need) : row.need;
                    void productEntry;
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
              <CardTitle className="text-base">Interactive Cost Calculator</CardTitle>
              <p className="text-xs text-slate-500 mt-0.5">Adjust users and tier to see real-time estimates</p>
            </CardHeader>
            <CardContent>
              <InteractiveCostCalculator products={result.products} initialUsers={result.executiveSnapshot.usersDetected} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* OOTB vs Custom tab */}
        <TabsContent value="ootb">
          <Card className="border-slate-200">
            <CardContent className="pt-4">
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
                      const ootbColor =
                        row.ootbFit === "High" ? "bg-green-100 text-green-700 border-green-200" :
                        row.ootbFit === "Medium" ? "bg-amber-100 text-amber-700 border-amber-200" :
                        "bg-red-100 text-red-700 border-red-200";
                      const custColor =
                        row.customizationLevel === "Low" ? "bg-green-100 text-green-700 border-green-200" :
                        row.customizationLevel === "Medium" ? "bg-amber-100 text-amber-700 border-amber-200" :
                        "bg-red-100 text-red-700 border-red-200";
                      const riskColor =
                        row.risk === "Low" ? "bg-green-100 text-green-700 border-green-200" :
                        row.risk === "Medium" ? "bg-amber-100 text-amber-700 border-amber-200" :
                        "bg-red-100 text-red-700 border-red-200";
                      return (
                        <tr key={i} className={`border-b border-slate-50 hover:bg-slate-50/70 transition-colors ${i % 2 === 0 ? "bg-white" : "bg-slate-50/40"}`}>
                          <td className="px-4 py-3 font-semibold text-slate-800 text-xs">{row.area}</td>
                          <td className="px-4 py-3">
                            <span className={`text-xs px-2 py-0.5 rounded-full border font-semibold ${ootbColor}`}>{row.ootbFit}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`text-xs px-2 py-0.5 rounded-full border font-semibold ${custColor}`}>{row.customizationLevel}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`text-xs px-2 py-0.5 rounded-full border font-semibold ${riskColor}`}>{row.risk}</span>
                          </td>
                          <td className="px-4 py-3 text-xs text-slate-600 leading-relaxed">{row.notes}</td>
                        </tr>
                      );
                    })}
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

        {/* Integrations tab */}
        <TabsContent value="integrations">
          <Card className="border-slate-200">
            <CardContent className="pt-4">
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
                        <span className={`text-xs px-2 py-0.5 rounded-full border font-semibold ${patternConfig.color}`}>
                          {patternConfig.icon} {item.pattern}
                        </span>
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
