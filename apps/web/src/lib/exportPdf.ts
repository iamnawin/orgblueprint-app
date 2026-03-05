/**
 * Client-side PDF export using jsPDF.
 * Generates a structured PDF from a BlueprintResult without needing a server slug.
 */
import type { BlueprintResult } from "@orgblueprint/core";

type TextOptions = {
  maxWidth?: number;
  align?: "left" | "center" | "right";
};

export async function downloadBlueprintPdf(
  result: BlueprintResult,
  title: string,
  company?: string
): Promise<void> {
  // Dynamic import so jsPDF is only loaded when the user requests a PDF
  const { jsPDF } = await import("jspdf");

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  const W = 210; // A4 width mm
  const marginL = 18;
  const marginR = 18;
  const contentW = W - marginL - marginR;
  let y = 20;

  // ── Helpers ──────────────────────────────────────────────────────────────────
  function checkPage(needed = 12) {
    if (y + needed > 278) {
      doc.addPage();
      y = 20;
    }
  }

  function heading1(text: string) {
    checkPage(18);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(15, 23, 42); // slate-900
    doc.text(text, marginL, y);
    y += 10;
  }

  function heading2(text: string) {
    checkPage(14);
    y += 4;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(30, 41, 59); // slate-800
    doc.text(text, marginL, y);
    // underline
    const w = doc.getTextWidth(text);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.4);
    doc.line(marginL, y + 1.5, marginL + Math.min(w, contentW), y + 1.5);
    y += 7;
  }

  function bodyText(text: string, opts: TextOptions = {}) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(51, 65, 85); // slate-700
    const lines = doc.splitTextToSize(text, opts.maxWidth ?? contentW);
    for (const line of lines) {
      checkPage(6);
      doc.text(line, marginL, y, { align: opts.align ?? "left" });
      y += 5;
    }
  }

  function bullet(text: string) {
    checkPage(6);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(51, 65, 85);
    doc.text("•", marginL, y);
    const lines = doc.splitTextToSize(text, contentW - 6);
    for (let i = 0; i < lines.length; i++) {
      checkPage(6);
      doc.text(lines[i] as string, marginL + 5, y);
      if (i < lines.length - 1) y += 5;
    }
    y += 5.5;
  }

  function kv(label: string, value: string) {
    checkPage(6);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139); // slate-500
    doc.text(label + ":", marginL, y);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(30, 41, 59);
    const labelW = doc.getTextWidth(label + ": ");
    const lines = doc.splitTextToSize(value, contentW - labelW);
    doc.text(lines[0] as string, marginL + labelW, y);
    y += 5;
    for (let i = 1; i < lines.length; i++) {
      checkPage(6);
      doc.text(lines[i] as string, marginL + labelW, y);
      y += 5;
    }
  }

  // ── Cover ─────────────────────────────────────────────────────────────────
  // Dark gradient background (approximated with rect)
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, W, 297, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text("ORGBLUEPRINT", marginL, 28);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(148, 163, 184);
  doc.text("Salesforce Implementation Blueprint", marginL, 38);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(255, 255, 255);
  const titleLines = doc.splitTextToSize(title, contentW);
  doc.text(titleLines, marginL, 60);
  y = 60 + titleLines.length * 12;

  if (company) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    doc.setTextColor(203, 213, 225); // slate-300
    doc.text(`Prepared for: ${company}`, marginL, y + 4);
    y += 14;
  }

  // Stats row
  const stats = [
    { label: "Users", value: String(result.executiveSnapshot.usersDetected) },
    { label: "Complexity", value: result.executiveSnapshot.complexityLevel },
    { label: "Confidence", value: `${result.executiveSnapshot.confidenceScore}/100` },
    {
      label: "Products",
      value: `${result.products.filter((p) => p.level === "recommended").length} recommended`,
    },
  ];
  const statW = contentW / stats.length;
  y += 16;
  stats.forEach((s, i) => {
    const x = marginL + i * statW;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text(s.label.toUpperCase(), x, y);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(255, 255, 255);
    doc.text(s.value, x, y + 8);
  });

  // Footer
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  const dateStr = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  doc.text(`Generated: ${dateStr}`, marginL, 285);
  doc.text("Directional estimate only — not official Salesforce pricing", marginL, 290);

  // ── Content pages ─────────────────────────────────────────────────────────
  doc.addPage();
  y = 20;

  // Reset text color for content
  doc.setFillColor(255, 255, 255);

  heading1("Executive Snapshot");
  kv("Primary Focus", result.executiveSnapshot.primaryFocus);
  kv("Users", `${result.executiveSnapshot.usersDetected} (${result.executiveSnapshot.userCountBand})`);
  kv("Complexity", result.executiveSnapshot.complexityLevel);
  kv("Confidence Score", `${result.executiveSnapshot.confidenceScore}/100`);

  // Product Recommendations
  heading2("Product Recommendations");
  const recProducts = result.products.filter((p) => p.level === "recommended");
  const optProducts = result.products.filter((p) => p.level === "optional");

  if (recProducts.length > 0) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(22, 101, 52); // green
    checkPage(8);
    doc.text("Recommended", marginL, y);
    y += 6;
    recProducts.forEach((p) => {
      bullet(`${p.name} — ${p.reasons[0] ?? ""}`);
    });
  }

  if (optProducts.length > 0) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(133, 77, 14); // amber
    checkPage(8);
    doc.text("Optional", marginL, y);
    y += 6;
    optProducts.forEach((p) => {
      bullet(`${p.name} — ${p.reasons[0] ?? ""}`);
    });
  }

  // Objects & Automations
  heading2("Objects & Automations");
  result.objectsAndAutomations.forEach((s) => bullet(s));

  // Integration Map
  heading2("Integration Map");
  result.integrationMap.forEach((item) => {
    bullet(`${item.system} — ${item.pattern}`);
  });

  // Analytics Pack
  heading2("Analytics Pack");
  result.analyticsPack.forEach((s) => bullet(s));

  // Cost Estimate
  heading2("Cost Estimate");
  kv(
    "License (annual)",
    `$${result.costEstimate.license.totalLow.toLocaleString()} – $${result.costEstimate.license.totalHigh.toLocaleString()}`
  );
  kv(
    "Implementation",
    `$${result.costEstimate.implementation.low.toLocaleString()} – $${result.costEstimate.implementation.high.toLocaleString()}`
  );
  kv(
    "Year-1 Total",
    `$${result.costEstimate.yearOneTotal.low.toLocaleString()} – $${result.costEstimate.yearOneTotal.high.toLocaleString()}`
  );
  y += 3;
  doc.setFont("helvetica", "italic");
  doc.setFontSize(8);
  doc.setTextColor(146, 64, 14); // amber
  bodyText("⚠ Directional estimate only. Not official Salesforce pricing or a formal quote.");

  // Roadmap
  heading2("Implementation Roadmap");
  result.roadmap.forEach((phase, i) => {
    checkPage(10);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(30, 41, 59);
    doc.text(`${i + 1}. ${phase.phase}`, marginL, y);
    y += 5;
    phase.outcomes.forEach((o) => bullet(o));
    y += 1;
  });

  // Risks
  heading2("Key Risks");
  result.risks.forEach((s) => bullet(s));

  // Document Checklist
  heading2("Document Checklist");
  result.documentChecklist.forEach((s) => bullet(s));

  // Disclaimer footer on last page
  y += 6;
  checkPage(20);
  doc.setFillColor(255, 251, 235);
  doc.setDrawColor(253, 230, 138);
  doc.roundedRect(marginL, y, contentW, 18, 2, 2, "FD");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(146, 64, 14);
  doc.text("Generated by OrgBlueprint · " + dateStr, marginL + 3, y + 6);
  doc.text(
    "This document is a directional Salesforce implementation blueprint. Engage a certified",
    marginL + 3,
    y + 11
  );
  doc.text("Salesforce partner for a detailed scope and formal quote.", marginL + 3, y + 15.5);

  // Save
  const filename = `OrgBlueprint-${title.slice(0, 40).replace(/[^a-z0-9]/gi, "-")}.pdf`;
  doc.save(filename);
}
