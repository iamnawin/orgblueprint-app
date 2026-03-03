import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { notFound, redirect } from "next/navigation";
import { BlueprintResult } from "@orgblueprint/core";

interface Props {
  params: { slug: string };
}

export default async function PrintPage({ params }: Props) {
  const blueprint = await prisma.blueprint.findUnique({
    where: { slug: params.slug },
  });

  if (!blueprint) notFound();

  const session = await auth();
  const isOwner = session?.user?.id === blueprint.userId;
  if (!blueprint.isPublic && !isOwner) redirect("/auth/signin");

  const result = JSON.parse(blueprint.result) as BlueprintResult;

  return (
    <html>
      <head>
        <title>{blueprint.title} — OrgBlueprint</title>
        <style>{`
          body { font-family: system-ui, sans-serif; padding: 40px; color: #1e293b; max-width: 900px; margin: 0 auto; }
          h1 { font-size: 24px; font-weight: bold; margin-bottom: 4px; }
          h2 { font-size: 16px; font-weight: 600; margin: 20px 0 8px; padding-bottom: 4px; border-bottom: 1px solid #e2e8f0; }
          ul { padding-left: 20px; margin: 0; }
          li { margin: 4px 0; font-size: 14px; }
          p { font-size: 14px; margin: 4px 0; }
          table { width: 100%; border-collapse: collapse; font-size: 13px; margin-top: 8px; }
          th, td { text-align: left; padding: 6px 8px; border-bottom: 1px solid #e2e8f0; }
          th { font-weight: 600; color: #64748b; }
          .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: 600; }
          .recommended { background: #dcfce7; color: #166534; }
          .optional { background: #fef9c3; color: #854d0e; }
          .not_needed { background: #f1f5f9; color: #64748b; }
          .disclaimer { background: #fffbeb; border: 1px solid #fde68a; padding: 8px 12px; border-radius: 4px; font-size: 12px; color: #92400e; margin-top: 8px; }
          .confidence { font-size: 13px; color: #64748b; margin-bottom: 20px; }
          @media print { body { padding: 20px; } }
        `}</style>
        <script dangerouslySetInnerHTML={{ __html: "window.onload = () => window.print();" }} />
      </head>
      <body>
        <h1>Salesforce Blueprint</h1>
        <p className="confidence">Confidence score: {result.confidenceScore}/100</p>

        <h2>Executive Snapshot</h2>
        <p><strong>Focus:</strong> {result.executiveSnapshot.primaryFocus}</p>
        <p><strong>Users detected:</strong> {result.executiveSnapshot.usersDetected} ({result.executiveSnapshot.userCountBand})</p>
        <p><strong>Complexity:</strong> {result.executiveSnapshot.complexityLevel}</p>

        <h2>Product Recommendations</h2>
        <table>
          <thead><tr><th>Product</th><th>Recommendation</th><th>Reason</th></tr></thead>
          <tbody>
            {result.products.map((p) => (
              <tr key={p.key}>
                <td><strong>{p.name}</strong></td>
                <td><span className={`badge ${p.level}`}>{p.level.replace("_", " ")}</span></td>
                <td>{p.reasons[0]}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <h2>OOTB vs Custom</h2>
        <table>
          <thead><tr><th>Area</th><th>OOTB Fit</th><th>Customization</th><th>Risk</th><th>Notes</th></tr></thead>
          <tbody>
            {result.ootbVsCustom.map((r, i) => (
              <tr key={i}><td>{r.area}</td><td>{r.ootbFit}</td><td>{r.customizationLevel}</td><td>{r.risk}</td><td>{r.notes}</td></tr>
            ))}
          </tbody>
        </table>

        <h2>Objects & Automations</h2>
        <ul>{result.objectsAndAutomations.map((s, i) => <li key={i}>{s}</li>)}</ul>

        <h2>Integration Map</h2>
        <ul>{result.integrationMap.map((item, i) => <li key={i}>{item.system} — {item.pattern}</li>)}</ul>

        <h2>Analytics Pack</h2>
        <ul>{result.analyticsPack.map((s, i) => <li key={i}>{s}</li>)}</ul>

        <h2>Cost Estimate</h2>
        <p><strong>License:</strong> ${result.costEstimate.license.totalLow.toLocaleString()} – ${result.costEstimate.license.totalHigh.toLocaleString()} / year</p>
        <p><strong>Implementation:</strong> ${result.costEstimate.implementation.low.toLocaleString()} – ${result.costEstimate.implementation.high.toLocaleString()}</p>
        <p><strong>Year-1 Total:</strong> ${result.costEstimate.yearOneTotal.low.toLocaleString()} – ${result.costEstimate.yearOneTotal.high.toLocaleString()}</p>
        <ul>{result.costEstimate.assumptions.map((s, i) => <li key={i}>{s}</li>)}</ul>
        <div className="disclaimer">{result.costEstimate.disclaimer}</div>

        <h2>Roadmap</h2>
        {result.roadmap.map((phase, i) => (
          <div key={i} style={{ marginBottom: 8 }}>
            <strong>{phase.phase}:</strong> {phase.outcomes.join(" · ")}
          </div>
        ))}

        <h2>Document Checklist</h2>
        <ul>{result.documentChecklist.map((s, i) => <li key={i}>{s}</li>)}</ul>

        <h2>Risks</h2>
        <ul>{result.risks.map((s, i) => <li key={i}>{s}</li>)}</ul>
      </body>
    </html>
  );
}
