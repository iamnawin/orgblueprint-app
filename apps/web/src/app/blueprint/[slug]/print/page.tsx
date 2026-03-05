import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { notFound, redirect } from "next/navigation";
import { BlueprintResult } from "@orgblueprint/core";
import { generateTechnicalBlueprint } from "@/lib/technicalBlueprint";

const BUSINESS_OBJECT_MAP = [
  { businessName: "Customers",           sfObject: "Account",          description: "Company or organization records." },
  { businessName: "Customer Contacts",   sfObject: "Contact",          description: "People who work at customer companies." },
  { businessName: "Sales Deals",         sfObject: "Opportunity",      description: "Tracks potential revenue and deal stages." },
  { businessName: "Support Tickets",     sfObject: "Case",             description: "Customer service issues through to resolution." },
  { businessName: "Sales Prospects",     sfObject: "Lead",             description: "Unqualified prospects before conversion." },
  { businessName: "Marketing Campaigns", sfObject: "Campaign",         description: "Marketing initiatives and their ROI." },
];

interface Props {
  params: { slug: string };
  searchParams: { company?: string };
}

export default async function PrintPage({ params, searchParams }: Props) {
  const blueprint = await prisma.blueprint.findUnique({ where: { slug: params.slug } });
  if (!blueprint) notFound();

  const session = await auth();
  const isOwner = session?.user?.id === blueprint.userId;
  if (!blueprint.isPublic && !isOwner) redirect("/auth/signin");

  const result = JSON.parse(blueprint.result) as BlueprintResult;
  const company = searchParams.company ?? "";
  const technical = generateTechnicalBlueprint(result.products);
  const dateStr = new Date(blueprint.createdAt).toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric",
  });

  const recProducts = result.products.filter((p) => p.level === "recommended");
  const optProducts = result.products.filter((p) => p.level === "optional");

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>{blueprint.title} — OrgBlueprint</title>
        <style>{`
          * { box-sizing: border-box; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            padding: 0; margin: 0; color: #1e293b; background: white;
          }

          /* Cover Page */
          .cover {
            min-height: 100vh;
            background: linear-gradient(135deg, #0f172a 0%, #1e3a5f 40%, #1d4ed8 70%, #7c3aed 100%);
            display: flex; flex-direction: column; justify-content: space-between;
            padding: 60px 72px; color: white;
            page-break-after: always;
          }
          .cover-logo { font-size: 13px; font-weight: 700; letter-spacing: 3px; text-transform: uppercase; opacity: 0.7; }
          .cover-main { flex: 1; display: flex; flex-direction: column; justify-content: center; padding: 60px 0; }
          .cover-eyebrow { font-size: 13px; font-weight: 600; letter-spacing: 2px; text-transform: uppercase; opacity: 0.6; margin-bottom: 16px; }
          .cover-title { font-size: 42px; font-weight: 800; line-height: 1.15; margin-bottom: 24px; }
          .cover-company { font-size: 22px; font-weight: 600; opacity: 0.85; margin-bottom: 48px; }
          .cover-stats { display: flex; gap: 40px; flex-wrap: wrap; }
          .cover-stat label { display: block; font-size: 11px; font-weight: 600; letter-spacing: 1.5px; text-transform: uppercase; opacity: 0.6; margin-bottom: 4px; }
          .cover-stat-value { font-size: 24px; font-weight: 800; }
          .cover-footer { font-size: 13px; opacity: 0.5; }
          .cover-date { font-size: 14px; opacity: 0.7; }

          /* Content */
          .content { max-width: 900px; margin: 0 auto; padding: 48px 60px; }
          h2 {
            font-size: 16px; font-weight: 700; margin: 32px 0 10px;
            padding-bottom: 6px; border-bottom: 2px solid #e2e8f0;
            color: #1e293b;
            page-break-after: avoid;
          }
          h2:first-child { margin-top: 0; }
          h3 { font-size: 14px; font-weight: 600; margin: 16px 0 8px; }
          ul { padding-left: 20px; margin: 6px 0; }
          li { margin: 4px 0; font-size: 13px; line-height: 1.6; }
          p { font-size: 13px; margin: 4px 0; line-height: 1.6; }
          table { width: 100%; border-collapse: collapse; font-size: 12px; margin: 10px 0; }
          th, td { text-align: left; padding: 8px 10px; border-bottom: 1px solid #e2e8f0; }
          th { font-weight: 700; color: #64748b; background: #f8fafc; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; }
          tr:last-child td { border-bottom: none; }
          .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 700; }
          .recommended { background: #dcfce7; color: #166534; }
          .optional { background: #fef9c3; color: #854d0e; }
          .not_needed { background: #f1f5f9; color: #94a3b8; }
          .disclaimer { background: #fffbeb; border: 1px solid #fde68a; padding: 10px 14px; border-radius: 6px; font-size: 12px; color: #92400e; margin: 10px 0; }
          .section-break { page-break-before: always; }

          /* Roadmap visual */
          .roadmap-phase { display: flex; gap: 16px; margin-bottom: 16px; align-items: flex-start; }
          .roadmap-num { flex-shrink: 0; width: 32px; height: 32px; border-radius: 50%; background: #1d4ed8; color: white; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 14px; }
          .roadmap-content { flex: 1; }
          .roadmap-phase-name { font-weight: 700; font-size: 13px; margin-bottom: 4px; }

          @media print {
            .cover { -webkit-print-color-adjust: exact; print-color-adjust: exact; min-height: 100vh; }
            .section-break { page-break-before: always; }
            h2 { page-break-after: avoid; }
            table, .roadmap-phase { break-inside: avoid; }
          }
        `}</style>
        <script dangerouslySetInnerHTML={{ __html: "window.onload = () => window.print();" }} />
      </head>
      <body>

        {/* ── Cover Page ── */}
        <div className="cover">
          <div className="cover-logo">OrgBlueprint</div>

          <div className="cover-main">
            <div className="cover-eyebrow">Salesforce Implementation Blueprint</div>
            <div className="cover-title">{blueprint.title}</div>
            {company && <div className="cover-company">Prepared for: {company}</div>}
            <div className="cover-stats">
              <div className="cover-stat">
                <label>Users</label>
                <div className="cover-stat-value">{result.executiveSnapshot.usersDetected}</div>
              </div>
              <div className="cover-stat">
                <label>Complexity</label>
                <div className="cover-stat-value">{result.executiveSnapshot.complexityLevel}</div>
              </div>
              <div className="cover-stat">
                <label>Confidence</label>
                <div className="cover-stat-value">{result.executiveSnapshot.confidenceScore}/100</div>
              </div>
              <div className="cover-stat">
                <label>Products</label>
                <div className="cover-stat-value">{recProducts.length} rec. + {optProducts.length} opt.</div>
              </div>
            </div>
          </div>

          <div className="cover-footer">
            <div className="cover-date">Generated: {dateStr}</div>
            <div style={{ marginTop: 4, fontSize: 11 }}>Directional estimate only — not official Salesforce pricing</div>
          </div>
        </div>

        {/* ── Content ── */}
        <div className="content">

          <h2>Executive Snapshot</h2>
          <table>
            <tbody>
              <tr><td><strong>Primary Focus</strong></td><td>{result.executiveSnapshot.primaryFocus}</td></tr>
              <tr><td><strong>Users Detected</strong></td><td>{result.executiveSnapshot.usersDetected} ({result.executiveSnapshot.userCountBand})</td></tr>
              <tr><td><strong>Complexity</strong></td><td>{result.executiveSnapshot.complexityLevel}</td></tr>
              <tr><td><strong>Confidence Score</strong></td><td>{result.executiveSnapshot.confidenceScore}/100</td></tr>
            </tbody>
          </table>

          <h2>Product Recommendations</h2>

          {recProducts.length > 0 && (
            <>
              <h3 style={{ color: "#166534" }}>Recommended</h3>
              <table>
                <thead><tr><th>Product</th><th>Reason</th></tr></thead>
                <tbody>
                  {recProducts.map((p) => (
                    <tr key={p.key}>
                      <td><strong>{p.name}</strong> <span className="badge recommended">Recommended</span></td>
                      <td>{p.reasons[0]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}

          {optProducts.length > 0 && (
            <>
              <h3 style={{ color: "#854d0e" }}>Optional</h3>
              <table>
                <thead><tr><th>Product</th><th>Reason</th></tr></thead>
                <tbody>
                  {optProducts.map((p) => (
                    <tr key={p.key}>
                      <td><strong>{p.name}</strong> <span className="badge optional">Optional</span></td>
                      <td>{p.reasons[0]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}

          <h2 className="section-break">OOTB vs Custom</h2>
          <table>
            <thead><tr><th>Area</th><th>OOTB Fit</th><th>Customization</th><th>Risk</th><th>Notes</th></tr></thead>
            <tbody>
              {result.ootbVsCustom.map((r, i) => (
                <tr key={i}>
                  <td><strong>{r.area}</strong></td>
                  <td>{r.ootbFit}</td>
                  <td>{r.customizationLevel}</td>
                  <td>{r.risk}</td>
                  <td>{r.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <h2>Business Entities (Salesforce Objects)</h2>
          <table>
            <thead><tr><th>Business Name</th><th>Salesforce Object</th><th>Description</th></tr></thead>
            <tbody>
              {BUSINESS_OBJECT_MAP.map((obj, i) => (
                <tr key={i}>
                  <td><strong>{obj.businessName}</strong></td>
                  <td style={{ fontFamily: "monospace", fontSize: 11 }}>{obj.sfObject}</td>
                  <td>{obj.description}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <h2>Objects &amp; Automations</h2>
          <ul>{result.objectsAndAutomations.map((s, i) => <li key={i}>{s}</li>)}</ul>

          <h2>Integration Map</h2>
          <table>
            <thead><tr><th>System</th><th>Pattern</th></tr></thead>
            <tbody>
              {result.integrationMap.map((item, i) => (
                <tr key={i}><td><strong>{item.system}</strong></td><td>{item.pattern}</td></tr>
              ))}
            </tbody>
          </table>

          <h2 className="section-break">Analytics Pack</h2>
          <ul>{result.analyticsPack.map((s, i) => <li key={i}>{s}</li>)}</ul>

          <h2 className="section-break">Automation Strategy</h2>
          {technical.automations.length > 0 ? (
            <table>
              <thead><tr><th>Automation</th><th>Technology</th><th>Trigger</th><th>Description</th></tr></thead>
              <tbody>
                {technical.automations.map((a, i) => (
                  <tr key={i}>
                    <td><strong>{a.name}</strong></td>
                    <td>{a.technology}</td>
                    <td style={{ fontSize: 11, color: "#64748b" }}>{a.trigger}</td>
                    <td>{a.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <p>No automations generated.</p>}

          <h2>Integration Design</h2>
          {technical.integrations.length > 0 ? (
            <table>
              <thead><tr><th>Integration</th><th>Method</th><th>Direction</th><th>Description</th></tr></thead>
              <tbody>
                {technical.integrations.map((intg, i) => (
                  <tr key={i}>
                    <td><strong>{intg.name}</strong></td>
                    <td>{intg.method}</td>
                    <td style={{ textTransform: "capitalize" }}>{intg.direction}</td>
                    <td>{intg.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <p>No integrations generated.</p>}

          {technical.architectureNotes.length > 0 && (
            <>
              <h2>Architecture Principles</h2>
              <ul>{technical.architectureNotes.map((note, i) => <li key={i}>{note}</li>)}</ul>
            </>
          )}

          <h2>Cost Estimate</h2>
          <table>
            <thead><tr><th>Cost Component</th><th>Estimate</th><th>Notes</th></tr></thead>
            <tbody>
              <tr>
                <td><strong>License Cost (annual)</strong></td>
                <td>${result.costEstimate.license.totalLow.toLocaleString()} – ${result.costEstimate.license.totalHigh.toLocaleString()}</td>
                <td>Per user / month × {result.executiveSnapshot.usersDetected} users × 12</td>
              </tr>
              <tr>
                <td><strong>Implementation Cost</strong></td>
                <td>${result.costEstimate.implementation.low.toLocaleString()} – ${result.costEstimate.implementation.high.toLocaleString()}</td>
                <td>{result.costEstimate.implementation.rationale}</td>
              </tr>
              <tr style={{ backgroundColor: "#f8fafc" }}>
                <td><strong>Estimated Year-1 Budget</strong></td>
                <td><strong>${result.costEstimate.yearOneTotal.low.toLocaleString()} – ${result.costEstimate.yearOneTotal.high.toLocaleString()}</strong></td>
                <td>License + implementation combined</td>
              </tr>
            </tbody>
          </table>
          <div className="disclaimer">⚠️ <strong>Directional estimate only.</strong> {result.costEstimate.disclaimer}</div>

          <h2 className="section-break">Implementation Roadmap</h2>
          {result.roadmap.map((phase, i) => (
            <div key={i} className="roadmap-phase">
              <div className="roadmap-num">{i + 1}</div>
              <div className="roadmap-content">
                <div className="roadmap-phase-name">{phase.phase}</div>
                <ul style={{ marginTop: 4 }}>{phase.outcomes.map((o, j) => <li key={j}>{o}</li>)}</ul>
              </div>
            </div>
          ))}

          <h2>Document Checklist</h2>
          <ul>{result.documentChecklist.map((s, i) => <li key={i}>{s}</li>)}</ul>

          <h2>Key Risks</h2>
          <ul>{result.risks.map((s, i) => <li key={i}>{s}</li>)}</ul>

          <div className="disclaimer" style={{ marginTop: 32 }}>
            <strong>Generated by OrgBlueprint</strong> · {dateStr}
            {company && ` · Prepared for ${company}`}
            <br />
            This document is a directional Salesforce implementation blueprint. It is not a formal proposal or official Salesforce pricing. Engage a certified Salesforce partner for a detailed scope and quote.
          </div>
        </div>
      </body>
    </html>
  );
}
