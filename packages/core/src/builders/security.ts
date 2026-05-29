import { RequirementAnalysis, SalesforceRecommendation, SecurityRecommendation } from "../types";

export function buildSecurityModel(
  analysis: RequirementAnalysis,
  products: SalesforceRecommendation[]
): SecurityRecommendation {
  const hasExperience = products.some((product) => product.product === "Experience Cloud");

  return {
    profiles: ["System Administrator", "Standard User", ...analysis.personas.map((persona) => persona.name)],
    permissionSets: ["Blueprint Core Access", `${analysis.primaryProcess.replace(/_/g, " ")} Manager Access`],
    sharingModel: hasExperience ? "Private" : "Public Read Only",
    recordLevelAccess: hasExperience
      ? "Use private sharing with role hierarchy, sharing sets, and explicit portal access."
      : "Use role hierarchy and permission sets for internal record access.",
    communityAccess: hasExperience ? "External users should access only their related accounts, cases, and knowledge content." : undefined,
    mfaRecommended: true,
    notes: "Start restrictive and expand access through permission sets instead of broad profiles.",
  };
}
