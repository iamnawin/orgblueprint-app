import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { BlueprintResult } from "@orgblueprint/core";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Props {
  searchParams: { a?: string; b?: string };
}

const PRODUCT_ICONS: Record<string, string> = {
  sales_cloud: "📊", service_cloud: "🎧", experience_cloud: "🌐",
  field_service: "🔧", cpq_revenue: "💼", marketing_cloud: "📣",
  pardot: "🎯", loyalty_management: "⭐", commerce_cloud: "🛒",
  data_cloud: "☁️", agentforce_einstein: "🤖", tableau_analytics: "📈",
  mulesoft: "🔗", slack_collab: "💬", salesforce_shield: "🔒",
  health_cloud: "🏥", financial_services_cloud: "🏦", nonprofit_cloud: "❤️",
  manufacturing_cloud: "🏭", education_cloud: "🎓", net_zero_cloud: "🌿",
};

export default async function ComparePage({ searchParams }: Props) {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/signin");

  const { a, b } = searchParams;
  if (!a || !b) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4 text-center">
        <h1 className="text-2xl font-bold text-slate-900 mb-4">Compare Blueprints</h1>
        <p className="text-slate-500 mb-6">
          Select two blueprints from your library to compare them side by side.
        </p>
        <Link href="/blueprints">
          <Button>Go to My Blueprints</Button>
        </Link>
      </div>
    );
  }

  const [bpA, bpB] = await Promise.all([
    prisma.blueprint.findUnique({ where: { slug: a } }),
    prisma.blueprint.findUnique({ where: { slug: b } }),
  ]);

  if (!bpA || !bpB) notFound();

  // Access control: must own or blueprint must be public
  const userId = session.user.id;
  if (!bpA.isPublic && bpA.userId !== userId) redirect("/auth/signin");
  if (!bpB.isPublic && bpB.userId !== userId) redirect("/auth/signin");

  const resultA = JSON.parse(bpA.result) as BlueprintResult;
  const resultB = JSON.parse(bpB.result) as BlueprintResult;

  // Build product key sets for comparison
  const recA = new Set(resultA.products.filter((p) => p.level === "recommended").map((p) => p.key));
  const recB = new Set(resultB.products.filter((p) => p.level === "recommended").map((p) => p.key));
  const optA = new Set(resultA.products.filter((p) => p.level === "optional").map((p) => p.key));
  const optB = new Set(resultB.products.filter((p) => p.level === "optional").map((p) => p.key));

  // All product keys across both blueprints (active only)
  const allActiveA = new Set([...recA, ...optA]);
  const allActiveB = new Set([...recB, ...optB]);
  const allKeys = new Set([...allActiveA, ...allActiveB]);

  // Unique to each
  const onlyInA = [...allKeys].filter((k) => allActiveA.has(k) && !allActiveB.has(k));
  const onlyInB = [...allKeys].filter((k) => !allActiveA.has(k) && allActiveB.has(k));
  const inBoth = [...allKeys].filter((k) => allActiveA.has(k) && allActiveB.has(k));

  function getLevelBadge(level: string) {
    if (level === "recommended") return "bg-green-100 text-green-800 border-green-200";
    if (level === "optional") return "bg-amber-100 text-amber-800 border-amber-200";
    return "bg-slate-100 text-slate-400 border-slate-200";
  }

  function getProductLevel(result: BlueprintResult, key: string) {
    return result.products.find((p) => p.key === key)?.level ?? "not_needed";
  }

  function getProductName(result: BlueprintResult, key: string) {
    return result.products.find((p) => p.key === key)?.name ?? key;
  }

  const complexityConfig = (c: string) =>
    c === "Low" ? "text-green-700 bg-green-50 border-green-200" :
    c === "High" ? "text-red-700 bg-red-50 border-red-200" :
    "text-amber-700 bg-amber-50 border-amber-200";

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Blueprint Comparison</h1>
          <p className="text-sm text-slate-500 mt-1">Side-by-side analysis of two Salesforce scenarios</p>
        </div>
        <Link href="/blueprints">
          <Button variant="outline" size="sm" className="text-xs">← My Blueprints</Button>
        </Link>
      </div>

      {/* Blueprint titles */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <Card className="border-blue-200 bg-blue-50/50">
          <CardContent className="pt-4 pb-3">
            <Badge className="bg-blue-600 text-white text-xs mb-2">Scenario A</Badge>
            <p className="font-semibold text-slate-900 text-sm leading-snug">{bpA.title}</p>
            <p className="text-xs text-slate-500 mt-1">
              {new Date(bpA.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </p>
          </CardContent>
        </Card>
        <Card className="border-purple-200 bg-purple-50/50">
          <CardContent className="pt-4 pb-3">
            <Badge className="bg-purple-600 text-white text-xs mb-2">Scenario B</Badge>
            <p className="font-semibold text-slate-900 text-sm leading-snug">{bpB.title}</p>
            <p className="text-xs text-slate-500 mt-1">
              {new Date(bpB.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Executive Snapshot comparison */}
      <Card className="mb-6 border-slate-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Executive Snapshot</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: "Primary Focus", a: resultA.executiveSnapshot.primaryFocus, b: resultB.executiveSnapshot.primaryFocus },
              { label: "Users Detected", a: String(resultA.executiveSnapshot.usersDetected), b: String(resultB.executiveSnapshot.usersDetected) },
              {
                label: "Complexity",
                a: resultA.executiveSnapshot.complexityLevel,
                b: resultB.executiveSnapshot.complexityLevel,
                colorA: complexityConfig(resultA.executiveSnapshot.complexityLevel),
                colorB: complexityConfig(resultB.executiveSnapshot.complexityLevel),
              },
              { label: "Confidence", a: `${resultA.executiveSnapshot.confidenceScore}/100`, b: `${resultB.executiveSnapshot.confidenceScore}/100` },
            ].map((row) => (
              <div key={row.label} className="col-span-2 grid grid-cols-[140px_1fr_1fr] items-start gap-3 py-2 border-b border-slate-100 last:border-0">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide pt-0.5">{row.label}</p>
                <span className={`text-sm font-medium px-2 py-0.5 rounded-md inline-block ${row.colorA ?? "text-slate-800"}`}>{row.a}</span>
                <span className={`text-sm font-medium px-2 py-0.5 rounded-md inline-block ${row.colorB ?? "text-slate-800"}`}>{row.b}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Products: unique to A */}
      {onlyInA.length > 0 && (
        <Card className="mb-4 border-blue-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-blue-700">Only in Scenario A ({onlyInA.length} products)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {onlyInA.map((key) => {
                const level = getProductLevel(resultA, key);
                const name = getProductName(resultA, key);
                return (
                  <div key={key} className="flex items-center gap-2 p-2.5 rounded-lg bg-blue-50 border border-blue-200">
                    <span className="text-base">{PRODUCT_ICONS[key] ?? "📦"}</span>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-blue-900 truncate">{name}</p>
                      <span className={`text-xs px-1.5 py-0.5 rounded-full border font-medium ${getLevelBadge(level)}`}>
                        {level === "recommended" ? "✓ Rec." : "~ Opt."}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Products: unique to B */}
      {onlyInB.length > 0 && (
        <Card className="mb-4 border-purple-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-purple-700">Only in Scenario B ({onlyInB.length} products)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {onlyInB.map((key) => {
                const level = getProductLevel(resultB, key);
                const name = getProductName(resultB, key);
                return (
                  <div key={key} className="flex items-center gap-2 p-2.5 rounded-lg bg-purple-50 border border-purple-200">
                    <span className="text-base">{PRODUCT_ICONS[key] ?? "📦"}</span>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-purple-900 truncate">{name}</p>
                      <span className={`text-xs px-1.5 py-0.5 rounded-full border font-medium ${getLevelBadge(level)}`}>
                        {level === "recommended" ? "✓ Rec." : "~ Opt."}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Products: in both */}
      {inBoth.length > 0 && (
        <Card className="mb-6 border-slate-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-700">In Both Scenarios ({inBoth.length} products)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {inBoth.map((key) => {
                const levelA = getProductLevel(resultA, key);
                const levelB = getProductLevel(resultB, key);
                const name = getProductName(resultA, key) || getProductName(resultB, key);
                return (
                  <div key={key} className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                    <span className="text-base">{PRODUCT_ICONS[key] ?? "📦"}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-slate-800 truncate">{name}</p>
                      <div className="flex gap-1 mt-0.5">
                        <span className={`text-xs px-1.5 py-0.5 rounded-full border font-medium ${getLevelBadge(levelA)}`}>A: {levelA === "recommended" ? "Rec." : "Opt."}</span>
                        <span className={`text-xs px-1.5 py-0.5 rounded-full border font-medium ${getLevelBadge(levelB)}`}>B: {levelB === "recommended" ? "Rec." : "Opt."}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cost comparison */}
      <Card className="mb-6 border-slate-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Cost Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 p-4 text-white">
              <p className="text-xs opacity-70 mb-1">Scenario A — License Range</p>
              <p className="text-xl font-bold">
                ${resultA.costEstimate.license.totalLow.toLocaleString()} –{" "}
                ${resultA.costEstimate.license.totalHigh.toLocaleString()}
              </p>
              <p className="text-xs opacity-60 mt-1">
                Year-1: ${resultA.costEstimate.yearOneTotal.low.toLocaleString()} – ${resultA.costEstimate.yearOneTotal.high.toLocaleString()}
              </p>
            </div>
            <div className="rounded-xl bg-gradient-to-br from-purple-600 to-purple-700 p-4 text-white">
              <p className="text-xs opacity-70 mb-1">Scenario B — License Range</p>
              <p className="text-xl font-bold">
                ${resultB.costEstimate.license.totalLow.toLocaleString()} –{" "}
                ${resultB.costEstimate.license.totalHigh.toLocaleString()}
              </p>
              <p className="text-xs opacity-60 mt-1">
                Year-1: ${resultB.costEstimate.yearOneTotal.low.toLocaleString()} – ${resultB.costEstimate.yearOneTotal.high.toLocaleString()}
              </p>
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-3 text-center">
            ⚠️ Directional estimates only. Not official Salesforce pricing.
          </p>
        </CardContent>
      </Card>

      {/* Top risks side by side */}
      <Card className="mb-6 border-slate-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Top Risks</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-3">Scenario A</p>
              <ul className="space-y-2">
                {resultA.risks.slice(0, 4).map((risk, i) => (
                  <li key={i} className="flex gap-2 text-xs text-slate-600 leading-relaxed">
                    <span className="flex-shrink-0 text-blue-400 font-bold">{i + 1}.</span>
                    {risk}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold text-purple-600 uppercase tracking-wide mb-3">Scenario B</p>
              <ul className="space-y-2">
                {resultB.risks.slice(0, 4).map((risk, i) => (
                  <li key={i} className="flex gap-2 text-xs text-slate-600 leading-relaxed">
                    <span className="flex-shrink-0 text-purple-400 font-bold">{i + 1}.</span>
                    {risk}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Links back to full blueprints */}
      <div className="grid grid-cols-2 gap-4">
        <Link href={`/blueprint/${a}`}>
          <Button variant="outline" className="w-full text-xs border-blue-200 text-blue-700 hover:bg-blue-50">
            View Full Scenario A →
          </Button>
        </Link>
        <Link href={`/blueprint/${b}`}>
          <Button variant="outline" className="w-full text-xs border-purple-200 text-purple-700 hover:bg-purple-50">
            View Full Scenario B →
          </Button>
        </Link>
      </div>
    </div>
  );
}
