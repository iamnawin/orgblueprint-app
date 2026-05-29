import { Assumption, RequirementAnalysis, Signals } from "../types";

export function buildAssumptions(analysis: RequirementAnalysis, signals: Signals): Assumption[] {
  const assumptions: Assumption[] = [
    {
      id: "asm-process",
      text: `We assume the ${analysis.primaryProcess.replace(/_/g, " ")} process is the MVP scope for the first release.`,
      category: "scope",
    },
    {
      id: "asm-users",
      text: analysis.hasExternalUsers
        ? "We assume external users require limited self-service access rather than full internal Salesforce licenses."
        : "We assume all users are Salesforce-licensed employees with no guest or external access required.",
      category: "users",
    },
    {
      id: "asm-data",
      text: analysis.hasDataMigration
        ? "We assume legacy data migration will be handled as a parallel workstream before UAT."
        : "We assume existing data can be loaded through standard import templates without a major migration project.",
      category: "data",
    },
  ];

  if (signals.systemsDetected.length > 0) {
    assumptions.push({
      id: "asm-system-record",
      text: `We assume ${signals.systemsDetected[0]} remains the system of record for its current data domain.`,
      category: "integration",
    });
  }

  if (analysis.hasMobileRequirement) {
    assumptions.push({
      id: "asm-mobile",
      text: "We assume mobile access is required based on field or offline usage signals.",
      category: "users",
    });
  }

  return assumptions;
}
