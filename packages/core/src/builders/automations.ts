import { AutomationRecommendation, BusinessCapability, ProcessType } from "../types";

export function buildAutomations(
  processType: ProcessType,
  capabilities: BusinessCapability[]
): AutomationRecommendation[] {
  const base: AutomationRecommendation[] = [
    {
      name: `${processType.replace(/_/g, " ")} intake routing`,
      type: "Record-Triggered Flow",
      trigger: "New or updated request/case/work record",
      purpose: "Assign ownership, set priority, and route work to the right queue.",
      complexity: "medium",
    },
    {
      name: "Manager review screen flow",
      type: "Screen Flow",
      trigger: "User launches review action",
      purpose: "Guide approvers through required decisions and notes.",
      complexity: "simple",
    },
  ];

  if (capabilities.some((capability) => capability.id.includes("sla"))) {
    base.push({
      name: "SLA escalation flow",
      type: "Scheduled Flow",
      trigger: "Open records approaching target time",
      purpose: "Escalate records before service commitments are missed.",
      complexity: "medium",
    });
  }

  if (capabilities.some((capability) => capability.id === "quote_to_cash" || capability.id.includes("approval"))) {
    base.push({
      name: "Pricing approval process",
      type: "Approval Process",
      trigger: "Discount threshold exceeded",
      purpose: "Route pricing exceptions to finance or sales leadership.",
      complexity: "medium",
    });
  }

  return base;
}
