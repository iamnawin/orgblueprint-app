import { PRICING_ASSUMPTIONS } from "./pricingAssumptions";

export function estimateLicenseCost({
  userCount,
  recommendedProducts,
}: {
  userCount: number;
  recommendedProducts: string[];
}) {
  const products = new Set(recommendedProducts);
  const hasSales = products.has("Sales Cloud");
  const hasService = products.has("Service Cloud");

  const breakdown: Array<{
    product: string;
    users: number;
    annualLow: number;
    annualHigh: number;
    assumedEdition: string;
  }> = [];

  const userMap: Record<string, number> = {};

  if (hasSales && hasService) {
    const salesUsers = Math.round(userCount * 0.7);
    const serviceUsers = Math.max(0, userCount - salesUsers);
    userMap["Sales Cloud"] = salesUsers;
    userMap["Service Cloud"] = serviceUsers;
  } else if (hasSales) {
    userMap["Sales Cloud"] = userCount;
  } else if (hasService) {
    userMap["Service Cloud"] = userCount;
  }

  for (const assumption of PRICING_ASSUMPTIONS) {
    const users = userMap[assumption.product] ?? 0;
    if (users <= 0) continue;
    breakdown.push({
      product: assumption.product,
      users,
      annualLow: users * assumption.monthlyPerUserLow * 12,
      annualHigh: users * assumption.monthlyPerUserHigh * 12,
      assumedEdition: assumption.assumedEdition,
    });
  }

  const totalLow = breakdown.reduce((sum, row) => sum + row.annualLow, 0);
  const totalHigh = breakdown.reduce((sum, row) => sum + row.annualHigh, 0);

  return {
    breakdown,
    totalLow,
    totalHigh,
  };
}
