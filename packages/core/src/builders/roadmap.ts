import { BusinessCapability, ProcessType, RoadmapPhase, SalesforceRecommendation } from "../types";

export function buildRoadmap(
  processType: ProcessType,
  capabilities: BusinessCapability[],
  products: SalesforceRecommendation[]
): RoadmapPhase[] {
  const duration = products.length >= 3 || capabilities.length >= 6 ? "8-12 weeks" : products.length >= 2 ? "6-8 weeks" : "4-6 weeks";
  const productNames = products.filter((product) => product.level !== "not_needed").map((product) => product.product);
  const processLabel = processType.replace(/_/g, " ");

  return [
    {
      phase: 1,
      title: "Foundation",
      duration,
      deliverables: ["Org setup", "Data model", "Profiles and permission sets", "Core security model"],
      outcomes: ["Org setup", "Data model", "Profiles and permission sets", "Core security model"],
      sfProducts: productNames,
      milestone: "Foundation signed off",
    },
    {
      phase: 2,
      title: "Core Process",
      duration,
      deliverables: [`Configure ${processLabel} records`, "Standard object setup", "MVP screen and record flows"],
      outcomes: [`Configure ${processLabel} records`, "Standard object setup", "MVP screen and record flows"],
      sfProducts: productNames,
      milestone: "Core users can execute the primary workflow",
    },
    {
      phase: 3,
      title: "Automation & Integration",
      duration,
      deliverables: ["Routing automation", "Approval flows", "Detected external integrations", "Error handling"],
      outcomes: ["Routing automation", "Approval flows", "Detected external integrations", "Error handling"],
      sfProducts: productNames,
      milestone: "Automated workflow and integration test complete",
    },
    {
      phase: 4,
      title: "Reporting & Analytics",
      duration,
      deliverables: ["Operational dashboards", "Executive KPI views", "Data quality reports"],
      outcomes: ["Operational dashboards", "Executive KPI views", "Data quality reports"],
      sfProducts: productNames,
      milestone: "Leadership reporting pack approved",
    },
    {
      phase: 5,
      title: "AI & Advanced Features",
      duration,
      deliverables: ["Agentforce readiness review", "Advanced automation candidates", "Mobile/portal hardening"],
      outcomes: ["Agentforce readiness review", "Advanced automation candidates", "Mobile/portal hardening"],
      sfProducts: productNames,
      milestone: "Enhancement roadmap prioritized",
    },
  ];
}
