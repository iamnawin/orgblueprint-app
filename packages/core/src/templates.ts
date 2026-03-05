/**
 * Demo-mode narrative templates.
 * Produces polished, business-friendly text for each blueprint section
 * without making any external API calls.
 */
import { BlueprintResult, ProductDecision, Signals } from "./types";

type ProductKeys = Set<string>;

function keys(products: ProductDecision[]): ProductKeys {
  return new Set(products.filter((p) => p.level !== "not_needed").map((p) => p.key));
}

// ── Executive snapshot primaryFocus ──────────────────────────────────────────
export function buildPrimaryFocus(signals: Signals): string {
  const parts: string[] = [];
  if (signals.wantsSales) parts.push("pipeline management & sales automation");
  if (signals.wantsService) parts.push("customer support & case management");
  if (signals.portalNeed) parts.push("self-service customer portal");
  if (signals.wantsCPQ) parts.push("configure-price-quote & approvals");
  if (signals.wantsMarketing) parts.push("marketing automation & journeys");
  if (signals.wantsFieldService) parts.push("field service & dispatch");
  if (signals.wantsMuleSoft) parts.push("enterprise integration layer");
  if (signals.wantsHealthCloud) parts.push("healthcare CRM & care management");
  if (signals.wantsFinancialCloud) parts.push("financial services CRM");
  if (signals.wantsNonprofit) parts.push("nonprofit donor & programme management");
  if (parts.length === 0) return "CRM foundation & operational efficiency";
  return parts.slice(0, 3).join(", ");
}

// ── Objects & Automations ─────────────────────────────────────────────────────
export function buildObjectsAndAutomations(k: ProductKeys, signals: Signals): string[] {
  const items: string[] = [];

  if (k.has("sales_cloud")) {
    items.push("Lead object with territory-based assignment rules and duplicate detection");
    items.push("Opportunity stages gate-checked by validation rules; probability auto-updated via Flows");
    items.push("Account hierarchy for parent-child company structures");
    items.push("Contact Roles on Opportunities to capture multi-stakeholder deals");
    items.push("Record-Triggered Flow: auto-create follow-up task when Opportunity stagnates > 14 days");
    items.push("Forecast categories mapped to Opportunity stages; manager roll-up forecasts enabled");
  }

  if (k.has("service_cloud")) {
    items.push("Case object with auto-number, priority, and SLA entitlement tracking");
    items.push("Escalation rules: auto-escalate P1 cases unresolved within 2 hours");
    items.push("Omni-Channel presence routing: skills-based case assignment to available agents");
    items.push("Knowledge Base articles linked to Cases; deflection rate tracked on dashboards");
    items.push("CSAT survey Flow triggered on Case closure; survey score stored on Case");
    items.push("Macro library for agents: one-click responses for top 10 issue categories");
  }

  if (k.has("experience_cloud")) {
    items.push("Experience Cloud site with self-service Case logging and Knowledge search");
    items.push("Community user provisioning Flow: auto-creates portal account on Contact update");
    items.push("Branded login page with SSO (SAML 2.0 / OAuth 2.0) via existing IdP");
  }

  if (k.has("field_service")) {
    items.push("Work Order auto-created via Flow when high-priority Case requires onsite visit");
    items.push("Service Appointment scheduling optimised by FSL scheduling policy (proximity + skills)");
    items.push("Mobile app for technicians: job details, inventory, signature capture");
    items.push("Dispatcher Console: drag-and-drop Gantt view for daily technician scheduling");
  }

  if (k.has("cpq_revenue")) {
    items.push("Product Catalog with configurable bundles, option groups, and pricing rules");
    items.push("Quote Line Editor with discount guardrails and real-time margin calculation");
    items.push("Multi-level approval workflow: auto-routes on discount % thresholds");
    items.push("Contract auto-generated from approved Quote; e-signature via DocuSign integration");
    items.push("Renewal opportunity auto-created 90 days before contract end date");
  }

  if (k.has("marketing_cloud")) {
    items.push("Journey Builder welcome series: 5-step onboarding email sequence for new contacts");
    items.push("Audience segmentation using Data Extensions with real-time behavioural data");
    items.push("Transactional sends: order confirmations, shipping updates, appointment reminders");
    items.push("Content Builder dynamic content blocks — personalised by industry, region, lifecycle stage");
  }

  if (k.has("pardot")) {
    items.push("Prospect scoring model: +10 page visit, +20 form fill, +40 demo request");
    items.push("Grading model: profile match score based on company size, industry, job title");
    items.push("Engagement Studio nurture programmes: 6-step drip for MQL → SQL conversion");
    items.push("Salesforce Campaigns synced bidirectionally — campaign influence attribution");
  }

  if (k.has("data_cloud")) {
    items.push("Unified Individual profile: reconciles identity across CRM, web, mobile, ERP");
    items.push("Calculated Insights for real-time segments: high-value, churn-risk, product-interest");
    items.push("Activation targets: sync segments to Marketing Cloud, paid media, experience sites");
  }

  if (k.has("mulesoft")) {
    items.push("API-led connectivity: System API (ERP adapter), Process API (transformation), Experience API (Salesforce)");
    items.push("Anypoint Exchange as central API catalogue with versioning and SLA tiers");
    items.push("Error handling framework: dead-letter queue + alerting for failed integration messages");
  }

  if (k.has("salesforce_shield")) {
    items.push("Platform Encryption on sensitive fields: SSN, DOB, financial data, health records");
    items.push("Event Monitoring: login, report exports, API access — 90-day retention");
    items.push("Field Audit Trail: 10-year history on regulated field changes for compliance");
  }

  if (items.length === 0) {
    items.push("Account and Contact records as core CRM entities");
    items.push("Activity tracking: calls, emails, meetings logged against records");
    items.push("Reports and dashboards for operational visibility");
  }

  return items;
}

// ── Analytics Pack ────────────────────────────────────────────────────────────
export function buildAnalyticsPack(k: ProductKeys, signals: Signals): string[] {
  const items: string[] = [];

  if (k.has("sales_cloud")) {
    items.push("Pipeline by Stage dashboard: open value, avg close rate, deal age by rep and team");
    items.push("Win/Loss analysis report: lost reason breakdown, competitor mentions, deal size correlation");
    items.push("Forecast accuracy tracker: predicted vs actual close, rolling 90-day trend");
    items.push("Sales velocity board: average deal cycle, conversion from Lead to Won");
  }

  if (k.has("service_cloud")) {
    items.push("Case resolution dashboard: MTTR, first-contact resolution %, SLA compliance by tier");
    items.push("Agent performance report: handle time, CSAT score, cases resolved per day");
    items.push("Knowledge deflection report: self-service article views vs case volume trend");
    items.push("Backlog heatmap: case volume by channel, priority, and product area");
  }

  if (k.has("cpq_revenue")) {
    items.push("Quote-to-cash funnel: conversion % at each approval stage, avg approval time");
    items.push("Discount leakage report: discounts by product family and approver level");
    items.push("Revenue schedule report: monthly contracted ARR, renewal pipeline");
  }

  if (k.has("marketing_cloud") || k.has("pardot")) {
    items.push("Email performance dashboard: open rate, CTR, unsubscribe rate, revenue attribution");
    items.push("Lead source ROI: cost per MQL, pipeline influenced, closed-won by campaign");
    items.push("Journey funnel: entry → completion rate, drop-off analysis per step");
  }

  if (k.has("field_service")) {
    items.push("Technician utilisation report: scheduled vs available hours, travel time %, overtime");
    items.push("First-time fix rate by product category and technician skill set");
    items.push("SLA breach map: geographic view of breached work orders");
  }

  if (items.length < 3) {
    items.push("Activity report: calls, emails, and meetings by rep and period");
    items.push("Data quality dashboard: % complete on key fields, duplicate Account rate");
    items.push("User adoption report: login frequency, record creation rate, last activity per user");
  }

  return items;
}

// ── Roadmap ───────────────────────────────────────────────────────────────────
export function buildRoadmap(k: ProductKeys, signals: Signals): BlueprintResult["roadmap"] {
  const phases: BlueprintResult["roadmap"] = [];

  phases.push({
    phase: "Phase 1 — Foundation (Weeks 1–6)",
    outcomes: [
      "Org setup: sandbox strategy, release management, and DevOps tooling (Salesforce DX or Copado)",
      "Data model design: Account, Contact, and primary custom objects confirmed",
      "Security model: profiles, permission sets, and sharing rules defined and tested",
      "Admin and super-user training on core platform navigation",
      ...(k.has("sales_cloud")
        ? ["Sales Cloud configured: lead assignment, pipeline stages, and basic forecasting"]
        : []),
      ...(k.has("service_cloud") ? ["Service Cloud basics: Case routing, email-to-case, and SLA entitlements"] : []),
    ],
  });

  if (k.has("sales_cloud") || k.has("service_cloud")) {
    phases.push({
      phase: "Phase 2 — Core CRM Go-Live (Weeks 7–14)",
      outcomes: [
        "Data migration: cleanse and load historical Accounts, Contacts, and Opportunities from legacy system",
        "Integration layer: connected external systems with bi-directional sync tested",
        "Automation deployed: key Flows and validation rules in production",
        "Go-live readiness: UAT sign-off, support runbook, rollback plan documented",
        ...(k.has("cpq_revenue") ? ["CPQ product catalogue and approval workflow configured in sandbox"] : []),
      ],
    });
  }

  if (k.has("cpq_revenue") || k.has("experience_cloud") || k.has("marketing_cloud") || k.has("pardot")) {
    phases.push({
      phase: "Phase 3 — Advanced Capabilities (Weeks 15–22)",
      outcomes: [
        ...(k.has("cpq_revenue") ? ["CPQ: full product catalogue, pricing rules, and approval matrix deployed"] : []),
        ...(k.has("experience_cloud")
          ? ["Experience Cloud portal: design, SSO, and self-service features go live"]
          : []),
        ...(k.has("marketing_cloud") || k.has("pardot")
          ? ["Marketing: first campaign journeys launched; lead scoring model tuned"]
          : []),
        "Analytics: executive and operational dashboards published with 30-day data",
        "Expanded user training; power-user cohort identified for ongoing admin support",
      ],
    });
  }

  phases.push({
    phase: "Phase 4 — Optimise & Scale (Ongoing)",
    outcomes: [
      "Quarterly release cycles: adopt Salesforce seasonal updates; deprecate workarounds",
      "Continuous improvement backlog: user feedback sessions every 6 weeks",
      "Advanced automation: Einstein, Agentforce, or additional Flow-based AI features",
      "Governance review: permission set audit, field usage report, tech-debt cleanup",
      ...(k.has("data_cloud") ? ["Data Cloud: unified profiles activated; AI segments feeding personalisation"] : []),
    ],
  });

  return phases;
}

// ── Document Checklist ────────────────────────────────────────────────────────
export function buildDocumentChecklist(k: ProductKeys): string[] {
  return [
    "Business Requirements Document (BRD) — signed off by stakeholders",
    "Data Model diagram — object relationships, fields, record types",
    "Security model matrix — profiles, permission sets, sharing rules, OWD settings",
    "Data migration plan — source field mapping, transformation rules, mock-load results",
    "Integration design document — API contracts, auth model, error handling",
    ...(k.has("cpq_revenue") ? ["CPQ pricing rules workbook — product families, discount tiers, approval thresholds"] : []),
    ...(k.has("experience_cloud") ? ["Experience Cloud information architecture — page layout, navigation, permissions"] : []),
    "Test plan — unit, integration, UAT, and regression test cases with pass/fail criteria",
    "Training materials — role-based quick-start guides, video walkthroughs",
    "Go-live runbook — cutover steps, rollback procedure, hypercare contacts",
    "Governance charter — release cadence, change-request process, admin responsibilities",
  ];
}

// ── Risks ─────────────────────────────────────────────────────────────────────
export function buildRisks(k: ProductKeys, signals: Signals): string[] {
  const risks: string[] = [];

  risks.push(
    "Data quality: dirty or incomplete legacy data will inflate migration timelines — budget 15–20% of project effort for data cleansing"
  );

  if (signals.externalSystemsCount >= 2 || k.has("mulesoft")) {
    risks.push(
      "Integration complexity: each external system adds non-linear risk — define integration contracts before build starts"
    );
  }

  if (k.has("cpq_revenue")) {
    risks.push(
      "CPQ product catalogue scope creep: start with top 20% of SKUs that drive 80% of revenue; expand iteratively"
    );
  }

  if (k.has("experience_cloud")) {
    risks.push(
      "Portal adoption: without SSO and embedded in existing workflows, partner/customer adoption is typically < 30% — plan launch campaign"
    );
  }

  if (k.has("marketing_cloud")) {
    risks.push(
      "Marketing data sync latency: Marketing Cloud ↔ Sales Cloud sync is near-real-time but not instantaneous — design journeys to tolerate 15-minute lag"
    );
  }

  risks.push(
    "Change management: Salesforce rollouts with < 30% end-user training completion fail at 2× the rate — budget dedicated change management workstream"
  );
  risks.push(
    "Scope creep: requirements discovered during build add 30–40% to timelines — enforce change-request gate after BRD sign-off"
  );
  risks.push(
    "Governor limits: Apex and Flow execution limits can surface late in UAT — performance-test with production data volumes in staging"
  );

  if (signals.userCountBand === "200+") {
    risks.push(
      "Enterprise rollout risk: 200+ user orgs require phased rollout by region or team — a big-bang go-live increases support burden 3–5×"
    );
  }

  return risks;
}

// ── Why Mapping ───────────────────────────────────────────────────────────────
export function buildWhyMapping(
  products: ProductDecision[],
  signals: Signals
): BlueprintResult["whyMapping"] {
  const map: BlueprintResult["whyMapping"] = [];

  const needs: Array<{ condition: boolean; need: string; product: string; why: string }> = [
    {
      condition: signals.wantsSales,
      need: "Pipeline & opportunity management",
      product: "Sales Cloud",
      why: "Native lead-to-close tracking, forecasting, and territory management without custom code",
    },
    {
      condition: signals.wantsService,
      need: "Customer support & SLA management",
      product: "Service Cloud",
      why: "Omni-channel case routing, entitlement-based SLAs, and agent productivity tools out of the box",
    },
    {
      condition: signals.portalNeed,
      need: "Self-service portal for customers or partners",
      product: "Experience Cloud",
      why: "Branded community site with built-in access controls, Knowledge integration, and mobile responsiveness",
    },
    {
      condition: signals.wantsCPQ,
      need: "Complex product configuration and pricing",
      product: "Revenue Cloud / CPQ",
      why: "Rules-driven product bundles, discount controls, and automated approval workflows reduce quote errors",
    },
    {
      condition: signals.wantsMarketing,
      need: "Marketing automation & customer journeys",
      product: "Marketing Cloud",
      why: "Journey Builder and Einstein Send-Time Optimisation deliver personalised, data-driven campaigns at scale",
    },
    {
      condition: signals.wantsPardot,
      need: "B2B lead nurturing & scoring",
      product: "Marketing Cloud Account Engagement (Pardot)",
      why: "Prospect grading + engagement scoring pass only marketing-qualified leads to sales, improving conversion",
    },
    {
      condition: signals.wantsFieldService,
      need: "Field technician scheduling & dispatch",
      product: "Field Service",
      why: "AI-optimised scheduling reduces drive time and improves first-time-fix rate for onsite work orders",
    },
    {
      condition: signals.wantsMuleSoft,
      need: "Enterprise system integration",
      product: "MuleSoft Anypoint Platform",
      why: "API-led connectivity eliminates point-to-point integration debt across ERP, HCM, and marketing systems",
    },
    {
      condition: signals.externalSystemsCount >= 2 && !signals.wantsMuleSoft,
      need: "External system data sync",
      product: "Salesforce REST API",
      why: "Connected Apps with OAuth 2.0 provide secure, auditable API access without additional middleware licence cost",
    },
    {
      condition: signals.wantsShield,
      need: "Data security & compliance",
      product: "Salesforce Shield",
      why: "Platform Encryption, Event Monitoring, and Field Audit Trail satisfy HIPAA, GDPR, and SOX audit requirements",
    },
  ];

  needs
    .filter((n) => n.condition)
    .forEach(({ need, product, why }) => map.push({ need, product, why }));

  return map;
}

// ── Master enrichment function ────────────────────────────────────────────────
/**
 * Takes a BlueprintResult produced by the deterministic rules engine
 * and replaces the generic text sections with polished template narratives.
 */
export function enrichWithTemplates(
  result: BlueprintResult,
  signals: Signals
): BlueprintResult {
  const k = keys(result.products);

  return {
    ...result,
    executiveSnapshot: {
      ...result.executiveSnapshot,
      primaryFocus: buildPrimaryFocus(signals),
    },
    whyMapping: buildWhyMapping(result.products, signals),
    objectsAndAutomations: buildObjectsAndAutomations(k, signals),
    analyticsPack: buildAnalyticsPack(k, signals),
    roadmap: buildRoadmap(k, signals),
    documentChecklist: buildDocumentChecklist(k),
    risks: buildRisks(k, signals),
  };
}
