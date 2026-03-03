export type ProductKey =
  // Core CRM
  | "sales_cloud"
  | "service_cloud"
  | "experience_cloud"
  | "field_service"
  | "cpq_revenue"
  // Marketing
  | "marketing_cloud"
  | "pardot"
  | "loyalty_management"
  | "commerce_cloud"
  // Data & AI
  | "data_cloud"
  | "agentforce_einstein"
  | "tableau_analytics"
  // Platform
  | "mulesoft"
  | "slack_collab"
  | "salesforce_shield"
  // Industry
  | "health_cloud"
  | "financial_services_cloud"
  | "nonprofit_cloud"
  | "manufacturing_cloud"
  | "education_cloud"
  | "net_zero_cloud";

export type RecommendationLevel = "recommended" | "optional" | "not_needed";

export interface ClarificationAnswers {
  users?: number;
  primaryTeams?: string;
  externalSystemsCount?: number;
  aiAutomationIntent?: boolean;
  needsSelfServicePortal?: boolean;
  fieldOps?: boolean;
  industryVertical?: string;
  wantsMarketing?: boolean;
  wantsCommerce?: boolean;
  wantsCompliance?: boolean;
  wantsSustainability?: boolean;
}

export interface Signals {
  rawText: string;
  users: number;
  // Core CRM
  wantsSales: boolean;
  wantsService: boolean;
  wantsPortal: boolean;
  wantsFieldService: boolean;
  wantsCPQ: boolean;
  externalSystemsCount: number;
  needsSingleCustomerView: boolean;
  needsRealtimeSegmentation: boolean;
  crossCloudAnalytics: boolean;
  aiAutomationIntent: boolean;
  highCaseVolume: boolean;
  deflectionIntent: boolean;
  salesCopilotIntent: boolean;
  // Marketing
  wantsMarketing: boolean;
  wantsPardot: boolean;
  wantsLoyalty: boolean;
  wantsCommerce: boolean;
  // Data & AI
  wantsTableau: boolean;
  // Platform
  wantsMuleSoft: boolean;
  wantsSlack: boolean;
  wantsShield: boolean;
  // Industry
  wantsHealthCloud: boolean;
  wantsFinancialCloud: boolean;
  wantsNonprofit: boolean;
  wantsManufacturing: boolean;
  wantsEducation: boolean;
  wantsNetZero: boolean;
  isEnterprise: boolean;
}

export interface ProductDecision {
  key: ProductKey;
  name: string;
  level: RecommendationLevel;
  reasons: string[];
}

export interface OOTBRow {
  capability: string;
  approach: "OOTB" | "Config" | "Custom";
  notes: string;
}

// Pricing interfaces — directional estimates only, not official Salesforce pricing
export interface LicenseTier {
  tier: string;
  perUserPerMonth: number | null;
  flatMonthly: number | null;
  flatAnnual: number | null;
}

export interface ProductPricing {
  key: ProductKey;
  name: string;
  pricingModel: "per_user" | "flat_monthly" | "flat_annual";
  tiers: LicenseTier[];
}

export interface CostLineItem {
  productKey: ProductKey;
  productName: string;
  tier: string;
  users: number;
  perUserPerMonth: number | null;
  annualTotal: number;
}

export interface InteractiveCostData {
  userCount: number;
  lineItems: CostLineItem[];
  implementationCostEstimate: number;
  grandTotal: number;
  disclaimer: string;
}

export interface BlueprintResult {
  executiveSnapshot: string[];
  products: ProductDecision[];
  whyMapping: Array<{ need: string; product: string; why: string }>;
  ootbVsCustom: OOTBRow[];
  objectsAndAutomations: string[];
  integrationMap: string[];
  analyticsPack: string[];
  costSimulator: { range: string; assumptions: string[]; disclaimer: string };
  roadmap: Array<{ phase: string; outcomes: string[] }>;
  documentChecklist: string[];
  risks: string[];
  confidenceScore: number;
  perUserCostData?: InteractiveCostData;
}
