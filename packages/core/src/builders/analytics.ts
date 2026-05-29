import { AnalyticsRecommendation, ProcessType, SalesforceRecommendation } from "../types";

const dashboards: Record<ProcessType | "default", string[]> = {
  sales_pipeline: ["Pipeline by Stage", "Forecast Accuracy", "Rep Performance", "Win Rate"],
  case_management: ["Case Volume Trend", "SLA Compliance", "Resolution Time", "Agent Performance"],
  field_service_execution: ["Work Order Completion", "First-Time Fix Rate", "Technician Utilization", "SLA Breach"],
  portal_self_service: ["Deflection Rate", "Self-Service Adoption", "Login Activity", "Knowledge Article Effectiveness"],
  retail_execution: ["Visit Compliance Rate", "Perfect Store Score", "Store Performance Ranking", "Gap Analysis"],
  employee_request: ["Request Volume by Type", "Approval Cycle Time", "SLA Adherence", "Open Requests"],
  vendor_onboarding: ["Vendor Onboarding Cycle Time", "Approval Backlog", "Supplier Risk", "Procurement SLA"],
  contract_review: ["Contract Cycle Time", "Legal Review Backlog", "Approval Aging", "Signature Status"],
  compliance_audit: ["Audit Pass Rate", "Findings by Category", "Trend by Region", "Corrective Actions"],
  asset_tracking: ["Asset Utilization", "Maintenance Due", "Warranty Exposure", "Inventory Aging"],
  survey_feedback: ["NPS Trend", "Feedback Volume", "Sentiment by Segment", "Follow-up Closure"],
  data_integration: ["Sync Health", "API Error Rate", "Data Latency", "Record Reconciliation"],
  executive_reporting: ["Executive Summary", "KPI Scorecard", "Forecast Accuracy", "Operational Health"],
  custom_workflow: ["Adoption Dashboard", "Record Activity", "Data Quality Health", "Executive Summary"],
  default: ["Adoption Dashboard", "Record Activity", "Data Quality Health", "Executive Summary"],
};

export function buildAnalyticsPack(
  processType: ProcessType,
  products: SalesforceRecommendation[]
): AnalyticsRecommendation[] {
  const audience = processType === "sales_pipeline" ? "Sales Manager" : processType === "field_service_execution" ? "Field Operations Manager" : "Executive";
  const hasTableau = products.some((product) => product.product.includes("Tableau"));

  return (dashboards[processType] ?? dashboards.default).map((name) => ({
    name,
    type: hasTableau ? "Tableau" : "Report",
    audience,
    description: `${name} view tailored to ${processType.replace(/_/g, " ")} operations.`,
  }));
}
