import { BusinessCapability, ObjectRecommendation, ProcessType } from "../types";

const standardByProcess: Record<ProcessType, string[]> = {
  sales_pipeline: ["Lead", "Account", "Contact", "Opportunity", "Quote"],
  case_management: ["Account", "Contact", "Case", "Entitlement", "Knowledge Article"],
  field_service_execution: ["Account", "Contact", "Case", "Work Order", "Service Appointment", "Asset"],
  portal_self_service: ["Account", "Contact", "Case", "Knowledge Article"],
  retail_execution: ["Account", "Visit", "Task", "Asset"],
  employee_request: ["User", "Task", "Approval Request"],
  vendor_onboarding: ["Account", "Contact", "Task"],
  contract_review: ["Account", "Contact", "Contract", "Content Document"],
  compliance_audit: ["Account", "Task", "Content Document"],
  asset_tracking: ["Account", "Asset", "Product", "Work Order"],
  survey_feedback: ["Contact", "Survey", "Survey Response"],
  data_integration: ["Account", "Contact", "Data Stream"],
  executive_reporting: ["Report", "Dashboard"],
  custom_workflow: ["User", "Task", "Approval Request"],
};

export function buildObjectModel(
  processType: ProcessType,
  capabilities: BusinessCapability[]
): { standard: ObjectRecommendation[]; custom: ObjectRecommendation[] } {
  const standard = (standardByProcess[processType] ?? standardByProcess.custom_workflow).map((name) => ({
    name,
    type: "standard" as const,
    purpose: `${name} supports the ${processType.replace(/_/g, " ")} process.`,
    keyFields: ["Owner", "Status", "Priority"],
    relationships: name === "Contact" ? [{ to: "Account", type: "lookup" as const }] : [],
  }));

  const custom = capabilities
    .filter((capability) => !["pipeline_mgmt", "case_triage", "sla_management", "reporting_analytics"].includes(capability.id))
    .slice(0, 4)
    .map((capability) => ({
      name: `${capability.name.replace(/[^A-Za-z0-9 ]/g, "")} Record`,
      type: "custom" as const,
      purpose: capability.description,
      keyFields: ["Status", "Owner", "Requested Date", "Business Priority"],
      relationships: [{ to: "Account", type: "lookup" as const }],
    }));

  return { standard, custom };
}
