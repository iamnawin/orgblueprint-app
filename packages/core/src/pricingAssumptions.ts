export type CloudPricing = {
  product: string;
  assumedEdition: string;
  monthlyPerUserLow: number;
  monthlyPerUserHigh: number;
};

export const PRICING_ASSUMPTIONS: CloudPricing[] = [
  {
    product: "Sales Cloud",
    assumedEdition: "Enterprise",
    monthlyPerUserLow: 120,
    monthlyPerUserHigh: 180,
  },
  {
    product: "Service Cloud",
    assumedEdition: "Enterprise",
    monthlyPerUserLow: 120,
    monthlyPerUserHigh: 180,
  },
];
