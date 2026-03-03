import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { notFound, redirect } from "next/navigation";
import { BlueprintResult } from "@orgblueprint/core";

interface Props {
  params: { slug: string };
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

const PHASE_COLORS = ["#3b82f6", "#6366f1", "#8b5cf6", "#a855f7", "#d946ef"];

export default async function SharePage({ params }: Props) {
  const blueprint = await prisma.blueprint.findUnique({ where: { slug: params.slug } });
  if (!blueprint) notFound();

  const session = await auth();
  const isOwner = session?.user?.id === blueprint.userId;
  if (!blueprint.isPublic && !isOwner) redirect("/auth/signin");

  const result = JSON.parse(blueprint.result) as BlueprintResult;
  const recommended = result.products.filter((p) => p.level === "recommended");
  const optional = result.products.filter((p) => p.level === "optional");
  const topRisks = result.risks.slice(0, 5);

  const complexityColor =
    result.executiveSnapshot.complexityLevel === "Low" ? "#22c55e" :
    result.executiveSnapshot.complexityLevel === "Medium" ? "#f59e0b" : "#ef4444";

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>{blueprint.title} — Salesforce Blueprint</title>
        <style>{`
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            background: #f8fafc;
            color: #1e293b;
            line-height: 1.6;
          }
          .header {
            background: linear-gradient(135deg, #1e3a5f 0%, #1d4ed8 50%, #7c3aed 100%);
            color: white;
            padding: 48px 24px;
            text-align: center;
          }
          .logo { font-size: 14px; font-weight: 600; opacity: 0.8; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 16px; }
          .main-title { font-size: 32px; font-weight: 800; line-height: 1.2; margin-bottom: 8px; }
          .sub-title { font-size: 16px; opacity: 0.75; }
          .container { max-width: 900px; margin: 0 auto; padding: 32px 24px 80px; }
          .section { background: white; border-radius: 12px; border: 1px solid #e2e8f0; padding: 28px; margin-bottom: 24px; }
          .section-title {
            font-size: 18px; font-weight: 700; color: #1e293b;
            margin-bottom: 20px; padding-bottom: 12px;
            border-bottom: 2px solid #e2e8f0;
            display: flex; align-items: center; gap: 10px;
          }
          .snapshot-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
          @media (min-width: 640px) { .snapshot-grid { grid-template-columns: repeat(4, 1fr); } }
          .snapshot-card {
            background: #f8fafc; border: 1px solid #e2e8f0;
            border-radius: 10px; padding: 16px;
          }
          .snapshot-label { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; margin-bottom: 4px; }
          .snapshot-value { font-size: 20px; font-weight: 800; color: #1e293b; }
          .product-grid { display: grid; grid-template-columns: 1fr; gap: 12px; }
          @media (min-width: 640px) { .product-grid { grid-template-columns: repeat(2, 1fr); } }
          @media (min-width: 900px) { .product-grid { grid-template-columns: repeat(3, 1fr); } }
          .product-card {
            border: 1px solid #e2e8f0; border-radius: 10px;
            padding: 16px; background: #f8fafc;
          }
          .product-icon { font-size: 24px; margin-bottom: 8px; display: block; }
          .product-name { font-size: 14px; font-weight: 700; color: #1e293b; margin-bottom: 4px; }
          .product-reason { font-size: 12px; color: #64748b; line-height: 1.5; }
          .badge {
            display: inline-block; font-size: 11px; font-weight: 600;
            padding: 2px 8px; border-radius: 99px; margin-bottom: 8px;
          }
          .badge-rec { background: #dcfce7; color: #166534; }
          .badge-opt { background: #fef9c3; color: #854d0e; }
          .why-table { width: 100%; border-collapse: collapse; font-size: 13px; }
          .why-table th { text-align: left; padding: 10px 12px; background: #f8fafc; font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 2px solid #e2e8f0; }
          .why-table td { padding: 12px; border-bottom: 1px solid #f1f5f9; vertical-align: top; }
          .why-table tr:last-child td { border-bottom: none; }
          .cost-display { text-align: center; padding: 24px; background: linear-gradient(135deg, #1d4ed8, #7c3aed); border-radius: 10px; color: white; }
          .cost-label { font-size: 13px; opacity: 0.8; margin-bottom: 6px; }
          .cost-value { font-size: 36px; font-weight: 800; }
          .cost-sub { font-size: 12px; opacity: 0.7; margin-top: 4px; }
          .cost-disclaimer { font-size: 11px; color: #92400e; background: #fffbeb; border: 1px solid #fde68a; border-radius: 6px; padding: 8px 12px; margin-top: 12px; }
          .roadmap { position: relative; }
          .roadmap-item { display: flex; gap: 20px; margin-bottom: 24px; position: relative; }
          .roadmap-item:not(:last-child)::after {
            content: ''; position: absolute; left: 19px; top: 44px;
            width: 2px; bottom: -8px; background: #e2e8f0;
          }
          .roadmap-circle {
            flex-shrink: 0; width: 40px; height: 40px; border-radius: 50%;
            display: flex; align-items: center; justify-content: center;
            font-weight: 800; font-size: 16px; color: white; z-index: 1;
          }
          .roadmap-content { flex: 1; }
          .roadmap-phase { font-size: 15px; font-weight: 700; color: #1e293b; margin-bottom: 8px; }
          .roadmap-outcomes { list-style: none; }
          .roadmap-outcomes li { font-size: 13px; color: #64748b; padding: 3px 0; display: flex; gap: 8px; }
          .roadmap-outcomes li::before { content: '✓'; color: #22c55e; font-weight: 700; flex-shrink: 0; }
          .risk-list { list-style: none; }
          .risk-item { display: flex; gap: 12px; padding: 12px 0; border-bottom: 1px solid #f1f5f9; font-size: 14px; color: #334155; }
          .risk-item:last-child { border-bottom: none; }
          .risk-num { flex-shrink: 0; width: 24px; height: 24px; border-radius: 50%; background: #fef2f2; border: 1px solid #fecaca; color: #dc2626; font-size: 12px; font-weight: 700; display: flex; align-items: center; justify-content: center; }
          .footer { text-align: center; padding: 48px 24px; background: #1e293b; color: #94a3b8; margin-top: 0; }
          .footer-cta { font-size: 18px; color: white; font-weight: 600; margin-bottom: 8px; }
          .footer-url { font-size: 14px; color: #60a5fa; }
          @media print {
            .header { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .section { break-inside: avoid; }
          }
        `}</style>
      </head>
      <body>
        {/* Header */}
        <div className="header">
          <div className="logo">OrgBlueprint</div>
          <div className="main-title">{blueprint.title}</div>
          <div className="sub-title">
            Salesforce Implementation Blueprint · Generated{" "}
            {new Date(blueprint.createdAt).toLocaleDateString("en-US", {
              year: "numeric", month: "long", day: "numeric",
            })}
          </div>
        </div>

        <div className="container">
          {/* Executive Snapshot */}
          <div className="section">
            <div className="section-title">📋 Executive Snapshot</div>
            <div className="snapshot-grid">
              <div className="snapshot-card">
                <div className="snapshot-label">Primary Focus</div>
                <div className="snapshot-value" style={{ fontSize: 16 }}>{result.executiveSnapshot.primaryFocus}</div>
              </div>
              <div className="snapshot-card">
                <div className="snapshot-label">Users Detected</div>
                <div className="snapshot-value">{result.executiveSnapshot.usersDetected}</div>
              </div>
              <div className="snapshot-card">
                <div className="snapshot-label">Complexity</div>
                <div className="snapshot-value" style={{ color: complexityColor }}>{result.executiveSnapshot.complexityLevel}</div>
              </div>
              <div className="snapshot-card">
                <div className="snapshot-label">Confidence Score</div>
                <div className="snapshot-value">{result.executiveSnapshot.confidenceScore}<span style={{ fontSize: 14, fontWeight: 400, color: "#94a3b8" }}>/100</span></div>
              </div>
            </div>
          </div>

          {/* Recommended Products */}
          {recommended.length > 0 && (
            <div className="section">
              <div className="section-title">✅ Recommended Products</div>
              <div className="product-grid">
                {recommended.map((p) => (
                  <div key={p.key} className="product-card">
                    <span className="product-icon">{PRODUCT_ICONS[p.key] ?? "📦"}</span>
                    <span className="badge badge-rec">✓ Recommended</span>
                    <div className="product-name">{p.name}</div>
                    <div className="product-reason">{p.reasons[0]}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Optional Products */}
          {optional.length > 0 && (
            <div className="section">
              <div className="section-title">~ Optional Additions</div>
              <div className="product-grid">
                {optional.map((p) => (
                  <div key={p.key} className="product-card">
                    <span className="product-icon">{PRODUCT_ICONS[p.key] ?? "📦"}</span>
                    <span className="badge badge-opt">~ Optional</span>
                    <div className="product-name">{p.name}</div>
                    <div className="product-reason">{p.reasons[0]}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Why These Products */}
          {result.whyMapping && result.whyMapping.length > 0 && (
            <div className="section">
              <div className="section-title">💡 Why These Products?</div>
              <table className="why-table">
                <thead>
                  <tr>
                    <th>Business Need</th>
                    <th>Product</th>
                    <th>Rationale</th>
                  </tr>
                </thead>
                <tbody>
                  {result.whyMapping.map((row, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight: 600, color: "#1e293b" }}>{row.need}</td>
                      <td style={{ color: "#3b82f6", fontWeight: 600 }}>{row.product}</td>
                      <td style={{ color: "#475569" }}>{row.why}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Cost Estimate */}
          <div className="section">
            <div className="section-title">💰 Investment Estimate</div>
            <div className="cost-display">
              <div className="cost-label">Estimated Annual License Range</div>
              <div className="cost-value">
                ${result.costEstimate.license.totalLow.toLocaleString()} –{" "}
                ${result.costEstimate.license.totalHigh.toLocaleString()}
              </div>
              <div className="cost-sub">
                Year-1 including implementation: ${result.costEstimate.yearOneTotal.low.toLocaleString()} –{" "}
                ${result.costEstimate.yearOneTotal.high.toLocaleString()}
              </div>
            </div>
            <div className="cost-disclaimer">
              ⚠️ {result.costEstimate.disclaimer}
            </div>
          </div>

          {/* Roadmap */}
          {result.roadmap && result.roadmap.length > 0 && (
            <div className="section">
              <div className="section-title">🗺️ Implementation Roadmap</div>
              <div className="roadmap">
                {result.roadmap.map((phase, i) => (
                  <div key={i} className="roadmap-item">
                    <div
                      className="roadmap-circle"
                      style={{ background: PHASE_COLORS[i % PHASE_COLORS.length] }}
                    >
                      {i + 1}
                    </div>
                    <div className="roadmap-content">
                      <div className="roadmap-phase">{phase.phase}</div>
                      <ul className="roadmap-outcomes">
                        {phase.outcomes.map((o, j) => <li key={j}>{o}</li>)}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Top Risks */}
          {topRisks.length > 0 && (
            <div className="section">
              <div className="section-title">⚠️ Key Risks to Manage</div>
              <ul className="risk-list">
                {topRisks.map((risk, i) => (
                  <li key={i} className="risk-item">
                    <span className="risk-num">{i + 1}</span>
                    <span>{risk}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="footer">
          <div className="footer-cta">Build your own Salesforce blueprint</div>
          <div className="footer-url">orgblueprint.com</div>
          <p style={{ fontSize: 12, marginTop: 16, opacity: 0.6 }}>
            Generated by OrgBlueprint · Directional estimates only · Not official Salesforce pricing
          </p>
        </div>
      </body>
    </html>
  );
}
