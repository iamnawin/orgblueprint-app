import { BusinessCapability, RequirementAnalysis } from "./types";

const capabilityRegistry: Record<string, { name: string; description: string }> = {
  pipeline_mgmt: { name: "Sales Pipeline Management", description: "Track leads, opportunities, stages, forecasts, and sales activity." },
  quote_to_cash: { name: "Quote-to-Cash", description: "Manage quotes, pricing approvals, and downstream revenue handoff." },
  case_triage: { name: "Case Triage & Resolution", description: "Capture, route, prioritize, and resolve customer support work." },
  sla_management: { name: "SLA & Escalation Management", description: "Control response commitments, queues, and escalation policies." },
  field_dispatch: { name: "Field Workforce Dispatch", description: "Schedule technicians and route work based on availability and skill." },
  work_order_mgmt: { name: "Work Order Management", description: "Plan, execute, and close field service work orders." },
  customer_portal: { name: "Customer Self-Service Portal", description: "Expose cases, knowledge, and status to external customers." },
  partner_portal: { name: "Partner/Dealer Portal", description: "Give partners limited access to shared workflow and records." },
  store_audit: { name: "Store Visit & Compliance Audit", description: "Plan store visits, capture findings, and score compliance." },
  planogram_check: { name: "Planogram Verification", description: "Validate shelf layout, merchandising, and retail execution gaps." },
  employee_workflow: { name: "Employee Request & Approval", description: "Route internal requests through manager and operations approvals." },
  vendor_mgmt: { name: "Vendor Lifecycle Management", description: "Onboard, approve, and manage supplier records and tasks." },
  contract_lifecycle: { name: "Contract Lifecycle Management", description: "Track legal review, document status, and approval workflows." },
  compliance_tracking: { name: "Compliance & Audit Tracking", description: "Record inspections, findings, controls, and corrective actions." },
  asset_lifecycle: { name: "Asset Lifecycle Management", description: "Track assets, maintenance, warranty, and inventory movement." },
  feedback_collection: { name: "Survey & Feedback Collection", description: "Collect survey responses and operationalize follow-up." },
  reporting_analytics: { name: "Reporting & Analytics", description: "Provide KPI dashboards and operational visibility." },
  data_sync: { name: "External System Integration", description: "Synchronize data with external systems and middleware." },
  ai_augmentation: { name: "AI/Agentforce Augmentation", description: "Add guided assistance, summarization, or conversational automation." },
};

function capability(id: string, sourcedFrom: string[], confidence: BusinessCapability["confidence"] = "high"): BusinessCapability {
  const base = capabilityRegistry[id];
  return {
    id,
    name: base.name,
    description: base.description,
    confidence,
    sourcedFrom,
  };
}

export function mapToCapabilities(analysis: RequirementAnalysis): BusinessCapability[] {
  const items: BusinessCapability[] = [];
  const source = [analysis.primaryProcess, ...analysis.detectedSignals];

  if (analysis.primaryProcess === "sales_pipeline") items.push(capability("pipeline_mgmt", source));
  if (analysis.primaryProcess === "sales_pipeline" && analysis.detectedSignals.some((s) => /quote|pricing/.test(s))) items.push(capability("quote_to_cash", source, "medium"));
  if (analysis.primaryProcess === "case_management") items.push(capability("case_triage", source), capability("sla_management", source));
  if (analysis.primaryProcess === "field_service_execution") items.push(capability("field_dispatch", source), capability("work_order_mgmt", source));
  if (analysis.primaryProcess === "portal_self_service") items.push(capability(analysis.detectedSignals.includes("partner") ? "partner_portal" : "customer_portal", source));
  if (analysis.primaryProcess === "retail_execution") items.push(capability("store_audit", source), capability("planogram_check", source, "medium"));
  if (analysis.primaryProcess === "employee_request") items.push(capability("employee_workflow", source));
  if (analysis.primaryProcess === "vendor_onboarding") items.push(capability("vendor_mgmt", source));
  if (analysis.primaryProcess === "contract_review") items.push(capability("contract_lifecycle", source));
  if (analysis.primaryProcess === "compliance_audit") items.push(capability("compliance_tracking", source));
  if (analysis.primaryProcess === "asset_tracking") items.push(capability("asset_lifecycle", source));
  if (analysis.primaryProcess === "survey_feedback") items.push(capability("feedback_collection", source));
  if (analysis.primaryProcess === "executive_reporting") items.push(capability("reporting_analytics", source));
  if (analysis.hasIntegrationSignals || analysis.primaryProcess === "data_integration") items.push(capability("data_sync", source, "medium"));
  if (analysis.hasAISignals) items.push(capability("ai_augmentation", source, "medium"));
  if (!items.some((item) => item.id === "reporting_analytics")) items.push(capability("reporting_analytics", source, "medium"));

  return items;
}
