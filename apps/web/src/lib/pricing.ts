import { ProductKey, ProductPricing } from "@orgblueprint/core";

export const PRICING_DISCLAIMER =
  "IMPORTANT: All pricing shown is directional only and does not constitute an official Salesforce quote. " +
  "Actual pricing depends on your contract, edition, and negotiated terms. " +
  "Contact Salesforce or a certified partner for official pricing.";

export const PRODUCT_PRICING: Record<ProductKey, ProductPricing> = {
  sales_cloud: {
    key: "sales_cloud",
    name: "Sales Cloud",
    pricingModel: "per_user",
    tiers: [
      { tier: "Starter", perUserPerMonth: 25, flatMonthly: null, flatAnnual: null },
      { tier: "Pro", perUserPerMonth: 100, flatMonthly: null, flatAnnual: null },
      { tier: "Enterprise", perUserPerMonth: 175, flatMonthly: null, flatAnnual: null },
      { tier: "Unlimited", perUserPerMonth: 350, flatMonthly: null, flatAnnual: null },
      { tier: "Agentforce 1 Sales", perUserPerMonth: 550, flatMonthly: null, flatAnnual: null },
    ],
  },
  service_cloud: {
    key: "service_cloud",
    name: "Service Cloud",
    pricingModel: "per_user",
    tiers: [
      { tier: "Starter", perUserPerMonth: 25, flatMonthly: null, flatAnnual: null },
      { tier: "Pro", perUserPerMonth: 100, flatMonthly: null, flatAnnual: null },
      { tier: "Enterprise", perUserPerMonth: 175, flatMonthly: null, flatAnnual: null },
      { tier: "Unlimited", perUserPerMonth: 350, flatMonthly: null, flatAnnual: null },
      { tier: "Agentforce 1 Service", perUserPerMonth: 550, flatMonthly: null, flatAnnual: null },
    ],
  },
  experience_cloud: {
    key: "experience_cloud",
    name: "Experience Cloud",
    pricingModel: "per_user",
    tiers: [
      { tier: "Customer ($2/login)", perUserPerMonth: 2, flatMonthly: null, flatAnnual: null },
      { tier: "Partner ($35/user)", perUserPerMonth: 35, flatMonthly: null, flatAnnual: null },
    ],
  },
  field_service: {
    key: "field_service",
    name: "Field Service",
    pricingModel: "per_user",
    tiers: [
      { tier: "Dispatcher", perUserPerMonth: 150, flatMonthly: null, flatAnnual: null },
      { tier: "Technician", perUserPerMonth: 50, flatMonthly: null, flatAnnual: null },
    ],
  },
  cpq_revenue: {
    key: "cpq_revenue",
    name: "Revenue Cloud / CPQ",
    pricingModel: "per_user",
    tiers: [
      { tier: "Standard", perUserPerMonth: 75, flatMonthly: null, flatAnnual: null },
    ],
  },
  marketing_cloud: {
    key: "marketing_cloud",
    name: "Marketing Cloud",
    pricingModel: "flat_monthly",
    tiers: [
      { tier: "Base (up to 10k contacts)", perUserPerMonth: null, flatMonthly: 1250, flatAnnual: null },
      { tier: "Growth (up to 100k contacts)", perUserPerMonth: null, flatMonthly: 4200, flatAnnual: null },
    ],
  },
  pardot: {
    key: "pardot",
    name: "Marketing Cloud Account Engagement",
    pricingModel: "flat_monthly",
    tiers: [
      { tier: "Growth (up to 10k contacts)", perUserPerMonth: null, flatMonthly: 1250, flatAnnual: null },
      { tier: "Plus (up to 10k contacts)", perUserPerMonth: null, flatMonthly: 2500, flatAnnual: null },
    ],
  },
  loyalty_management: {
    key: "loyalty_management",
    name: "Loyalty Management",
    pricingModel: "flat_monthly",
    tiers: [
      { tier: "Directional estimate", perUserPerMonth: null, flatMonthly: 2000, flatAnnual: null },
    ],
  },
  commerce_cloud: {
    key: "commerce_cloud",
    name: "Commerce Cloud",
    pricingModel: "flat_monthly",
    tiers: [
      { tier: "Directional estimate", perUserPerMonth: null, flatMonthly: 2000, flatAnnual: null },
    ],
  },
  data_cloud: {
    key: "data_cloud",
    name: "Data Cloud",
    pricingModel: "flat_annual",
    tiers: [
      { tier: "Base", perUserPerMonth: null, flatMonthly: null, flatAnnual: 108000 },
    ],
  },
  agentforce_einstein: {
    key: "agentforce_einstein",
    name: "Agentforce / Einstein",
    pricingModel: "per_user",
    tiers: [
      { tier: "Einstein Add-on", perUserPerMonth: 75, flatMonthly: null, flatAnnual: null },
      { tier: "Agentforce 1 (bundled)", perUserPerMonth: 550, flatMonthly: null, flatAnnual: null },
    ],
  },
  tableau_analytics: {
    key: "tableau_analytics",
    name: "Tableau Analytics",
    pricingModel: "per_user",
    tiers: [
      { tier: "Viewer", perUserPerMonth: 15, flatMonthly: null, flatAnnual: null },
      { tier: "Explorer", perUserPerMonth: 42, flatMonthly: null, flatAnnual: null },
      { tier: "Creator", perUserPerMonth: 70, flatMonthly: null, flatAnnual: null },
    ],
  },
  mulesoft: {
    key: "mulesoft",
    name: "MuleSoft",
    pricingModel: "flat_annual",
    tiers: [
      { tier: "Directional estimate", perUserPerMonth: null, flatMonthly: null, flatAnnual: 140000 },
    ],
  },
  slack_collab: {
    key: "slack_collab",
    name: "Slack",
    pricingModel: "per_user",
    tiers: [
      { tier: "Pro", perUserPerMonth: 7.25, flatMonthly: null, flatAnnual: null },
      { tier: "Business+", perUserPerMonth: 12.5, flatMonthly: null, flatAnnual: null },
    ],
  },
  salesforce_shield: {
    key: "salesforce_shield",
    name: "Salesforce Shield",
    pricingModel: "per_user",
    tiers: [
      { tier: "Standard", perUserPerMonth: 30, flatMonthly: null, flatAnnual: null },
    ],
  },
  health_cloud: {
    key: "health_cloud",
    name: "Health Cloud",
    pricingModel: "per_user",
    tiers: [
      { tier: "Enterprise", perUserPerMonth: 300, flatMonthly: null, flatAnnual: null },
    ],
  },
  financial_services_cloud: {
    key: "financial_services_cloud",
    name: "Financial Services Cloud",
    pricingModel: "per_user",
    tiers: [
      { tier: "Enterprise", perUserPerMonth: 300, flatMonthly: null, flatAnnual: null },
    ],
  },
  nonprofit_cloud: {
    key: "nonprofit_cloud",
    name: "Nonprofit Cloud",
    pricingModel: "per_user",
    tiers: [
      { tier: "Standard (NPSP)", perUserPerMonth: 36, flatMonthly: null, flatAnnual: null },
    ],
  },
  manufacturing_cloud: {
    key: "manufacturing_cloud",
    name: "Manufacturing Cloud",
    pricingModel: "per_user",
    tiers: [
      { tier: "Enterprise", perUserPerMonth: 300, flatMonthly: null, flatAnnual: null },
    ],
  },
  education_cloud: {
    key: "education_cloud",
    name: "Education Cloud",
    pricingModel: "per_user",
    tiers: [
      { tier: "Standard", perUserPerMonth: 36, flatMonthly: null, flatAnnual: null },
    ],
  },
  net_zero_cloud: {
    key: "net_zero_cloud",
    name: "Net Zero Cloud",
    pricingModel: "flat_annual",
    tiers: [
      { tier: "Directional estimate", perUserPerMonth: null, flatMonthly: null, flatAnnual: 150000 },
    ],
  },
};

export function computeAnnualCost(
  pricing: ProductPricing,
  tierIndex: number,
  userCount: number
): number {
  const tier = pricing.tiers[tierIndex];
  if (!tier) return 0;
  if (pricing.pricingModel === "per_user" && tier.perUserPerMonth !== null) {
    return tier.perUserPerMonth * userCount * 12;
  }
  if (pricing.pricingModel === "flat_monthly" && tier.flatMonthly !== null) {
    return tier.flatMonthly * 12;
  }
  if (pricing.pricingModel === "flat_annual" && tier.flatAnnual !== null) {
    return tier.flatAnnual;
  }
  return 0;
}

export function estimateImplementationCost(
  licenseTotalAnnual: number,
  productCount: number
): number {
  const multiplier = Math.min(0.8, 0.4 + productCount * 0.04);
  return Math.round(licenseTotalAnnual * multiplier);
}
