export function estimateImplementation({
  complexityLevel,
  integrationCount,
}: {
  complexityLevel: "Low" | "Medium" | "High";
  integrationCount: number;
}) {
  let implLow = 25000;
  let implHigh = 75000;

  if (complexityLevel === "Medium") {
    implLow = 75000;
    implHigh = 250000;
  }

  if (complexityLevel === "High") {
    implLow = 250000;
    implHigh = 500000;
  }

  if (integrationCount > 2) {
    implLow += 15000;
    implHigh += complexityLevel === "High" ? 100000 : 50000;
  }

  return {
    implLow,
    implHigh,
    rationale:
      integrationCount > 2
        ? `${complexityLevel} complexity baseline increased due to ${integrationCount} external integrations.`
        : `${complexityLevel} complexity baseline based on scope and delivery assumptions.`,
  };
}
