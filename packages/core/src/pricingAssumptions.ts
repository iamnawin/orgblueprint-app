export type CloudPricing = {
  product: string;
  assumedEdition: string;
  monthlyPerUserLow: number;
  monthlyPerUserHigh: number;
};

export const PRICING_ASSUMPTIONS: CloudPricing[] = [
  {
    product: "Sales Cloud",
    assumedEdition: "Pro–Enterprise",
    monthlyPerUserLow: 100,
    monthlyPerUserHigh: 175,
  },
  {
    product: "Service Cloud",
    assumedEdition: "Pro–Enterprise",
    monthlyPerUserLow: 100,
    monthlyPerUserHigh: 175,
  },
];
