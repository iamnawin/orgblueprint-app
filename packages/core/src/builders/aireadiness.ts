import { AIReadiness, RequirementAnalysis, SalesforceRecommendation, Signals } from "../types";

export function buildAIReadiness(
  signals: Signals,
  products: SalesforceRecommendation[],
  analysis: RequirementAnalysis
): AIReadiness {
  const score = analysis.hasAISignals ? 68 : signals.externalSystemsCount > 0 ? 48 : 35;
  const hasAgentforce = products.some((product) => product.product === "Agentforce");

  return {
    score,
    readyFor: [
      "Record summarization",
      analysis.primaryProcess === "case_management" ? "Case reply assistance" : "Guided next-best actions",
    ],
    blockers: [
      "Confirmed data quality rules",
      "Approved security and prompt grounding model",
      ...(hasAgentforce ? [] : ["No explicit Agentforce requirement detected"]),
    ],
    agentforceUseCases: hasAgentforce
      ? [`Automate ${analysis.primaryProcess.replace(/_/g, " ")} triage`, "Summarize records and recommend next actions"]
      : [],
  };
}
