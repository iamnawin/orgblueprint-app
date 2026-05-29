import { IntegrationRecommendation, ProcessType, RequirementAnalysis, RiskItem } from "../types";

export function buildRisks(
  processType: ProcessType,
  integrations: IntegrationRecommendation[],
  analysis: RequirementAnalysis
): RiskItem[] {
  const risks: RiskItem[] = [];

  if (analysis.hasDataMigration) {
    risks.push({
      title: "Data quality risk",
      description: "Legacy migration can expose duplicate, incomplete, or stale records.",
      severity: "medium",
      mitigation: "Run profiling and cleansing before UAT migration loads.",
      category: "data",
    });
  }

  if (analysis.hasExternalUsers) {
    risks.push({
      title: "External user adoption risk",
      description: "Portal users may need onboarding, SSO support, and clear self-service content.",
      severity: "medium",
      mitigation: "Pilot with a small external user group before broad rollout.",
      category: "adoption",
    });
  }

  const processRisk: Record<ProcessType, RiskItem> = {
    sales_pipeline: { title: "Pipeline discipline risk", description: "Forecast quality depends on consistent stage and close-date hygiene.", severity: "medium", mitigation: "Define mandatory stage-exit criteria and manager review reports.", category: "adoption" },
    case_management: { title: "SLA breach risk", description: "Poor queue design can hide urgent customer issues.", severity: "high", mitigation: "Model priority, entitlement, and escalation rules before go-live.", category: "technical" },
    field_service_execution: { title: "Scheduling complexity risk", description: "Skill, travel, and offline mobile needs can complicate dispatch design.", severity: "high", mitigation: "Prototype scheduling rules with real technician calendars.", category: "technical" },
    portal_self_service: { title: "Identity and SSO risk", description: "External access requires careful authentication and sharing design.", severity: "high", mitigation: "Confirm SSO and sharing model before portal build starts.", category: "technical" },
    retail_execution: { title: "Offline store execution risk", description: "Store visits may happen in low-connectivity environments.", severity: "medium", mitigation: "Validate mobile/offline behavior with field reps early.", category: "technical" },
    employee_request: { title: "Scope growth risk", description: "Internal request apps can accumulate unrelated departmental workflows.", severity: "medium", mitigation: "Set MVP request types and defer low-volume workflows.", category: "scope" },
    vendor_onboarding: { title: "Supplier data governance risk", description: "Vendor master data often spans procurement and finance ownership.", severity: "medium", mitigation: "Define system of record and approval authority.", category: "data" },
    contract_review: { title: "Legal process alignment risk", description: "Contract review automation fails if approval thresholds are unclear.", severity: "medium", mitigation: "Document redline, approval, and signature policies first.", category: "scope" },
    compliance_audit: { title: "Control evidence risk", description: "Audit workflows need reliable evidence capture and retention.", severity: "high", mitigation: "Define evidence fields, files, and retention rules.", category: "technical" },
    asset_tracking: { title: "Inventory accuracy risk", description: "Asset records drift if field updates are delayed.", severity: "medium", mitigation: "Use mobile updates and periodic reconciliation reports.", category: "data" },
    survey_feedback: { title: "Low response quality risk", description: "Feedback programs can generate sparse or biased data.", severity: "low", mitigation: "Segment audiences and track follow-up completion.", category: "adoption" },
    data_integration: { title: "Integration governance risk", description: "Multiple systems can introduce ownership and retry ambiguity.", severity: "high", mitigation: "Define source of truth, retry policy, and monitoring.", category: "integration" },
    executive_reporting: { title: "Metric definition risk", description: "Dashboards can lose trust if KPI definitions are inconsistent.", severity: "medium", mitigation: "Approve KPI formulas with business owners.", category: "data" },
    custom_workflow: { title: "Ambiguous workflow risk", description: "Generic workflow requests need precise ownership and status rules.", severity: "medium", mitigation: "Run a process-mapping workshop before configuration.", category: "scope" },
  };

  risks.push(processRisk[processType]);

  if (integrations.length > 0) {
    risks.push({
      title: "Integration governance risk",
      description: "Detected external systems require source-of-truth and monitoring decisions.",
      severity: "medium",
      mitigation: "Create an integration contract for each system.",
      category: "integration",
    });
  }

  if (analysis.hasAISignals) {
    risks.push({
      title: "AI readiness risk",
      description: "AI use cases depend on clean data, permissions, and approved knowledge sources.",
      severity: "medium",
      mitigation: "Pilot one constrained Agentforce use case before broad automation.",
      category: "technical",
    });
  }

  return risks;
}
