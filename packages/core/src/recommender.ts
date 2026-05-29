import { BusinessCapability, RequirementAnalysis, SalesforceRecommendation } from "./types";

function has(capabilities: BusinessCapability[], ids: string[]): boolean {
  return capabilities.some((capability) => ids.includes(capability.id));
}

function reason(prefix: string, analysis: RequirementAnalysis): string {
  const signals = analysis.detectedSignals.slice(0, 4).map((signal) => `'${signal}'`).join(", ");
  return signals ? `${prefix}: ${signals}` : prefix;
}

export function recommendClouds(
  capabilities: BusinessCapability[],
  analysis: RequirementAnalysis
): SalesforceRecommendation[] {
  const recommendations: SalesforceRecommendation[] = [];
  const push = (
    product: string,
    level: SalesforceRecommendation["level"],
    confidence: number,
    capabilityIds: string[],
    productReason: string,
    edition?: string
  ) => {
    recommendations.push({ product, level, confidence, capabilities: capabilityIds, reason: productReason, edition });
  };

  if (has(capabilities, ["pipeline_mgmt", "quote_to_cash"])) {
    push("Sales Cloud", "recommended", 88, ["pipeline_mgmt"], reason("Detected pipeline management and forecast signals", analysis), "Enterprise");
  }
  if (has(capabilities, ["quote_to_cash"])) {
    push("Revenue Cloud (CPQ)", "recommended", 76, ["quote_to_cash"], reason("Detected quote/pricing approval signals", analysis));
  }
  if (has(capabilities, ["case_triage", "sla_management"])) {
    push("Service Cloud", "recommended", 86, ["case_triage", "sla_management"], reason("Detected support case and SLA signals", analysis), "Enterprise");
  }
  if (has(capabilities, ["field_dispatch", "work_order_mgmt"])) {
    push("Field Service", "recommended", 90, ["field_dispatch", "work_order_mgmt"], reason("Detected field workforce and work order signals", analysis));
  }
  if (has(capabilities, ["customer_portal", "partner_portal"]) || analysis.hasExternalUsers) {
    push("Experience Cloud", "recommended", 82, ["customer_portal", "partner_portal"], reason("Detected external user or portal signals", analysis));
  }
  if (has(capabilities, ["data_sync"])) {
    push("MuleSoft", "optional", 62, ["data_sync"], reason("Detected integration or middleware signals", analysis));
  }
  if (has(capabilities, ["ai_augmentation"])) {
    push("Agentforce", "optional", 68, ["ai_augmentation"], reason("Detected AI or automation augmentation signals", analysis));
  }

  const platformProcesses = new Set([
    "employee_request",
    "vendor_onboarding",
    "contract_review",
    "compliance_audit",
    "asset_tracking",
    "survey_feedback",
    "custom_workflow",
    "retail_execution",
  ]);
  const hasNamedCloud = recommendations.some((item) =>
    ["Sales Cloud", "Service Cloud", "Field Service"].includes(item.product)
  );

  if (platformProcesses.has(analysis.primaryProcess) && !hasNamedCloud) {
    const ids = capabilities.map((capability) => capability.id);
    push(
      "Salesforce Platform",
      "recommended",
      84,
      ids,
      `Use case is ${analysis.primaryProcess.replace(/_/g, " ")} without strong Sales, Service, or Field Service signals; Salesforce Platform is the right workflow/data foundation.`
    );
  }

  return recommendations;
}
