export type ProductKey =
  | "sales_cloud"
  | "service_cloud"
  | "experience_cloud"
  | "field_service"
  | "cpq_revenue"
  | "data_cloud"
  | "agentforce_einstein";

export type RecommendationLevel = "recommended" | "optional" | "not_needed";

export interface ClarificationAnswers {
  users?: number;
  primaryTeams?: string;
  externalSystemsCount?: number;
  aiAutomationIntent?: boolean;
  needsSelfServicePortal?: boolean;
  fieldOps?: boolean;
}

export interface Signals {
  rawText: string;
  users: number;
  userCountBand: "1-49" | "50-199" | "200+";
  wantsSales: boolean;
  wantsService: boolean;
  portalNeed: boolean;
  explicitNoPortal: boolean;
  wantsFieldService: boolean;
  wantsCPQ: boolean;
  externalSystemsCount: number;
  systemsDetected: string[];
  needsSingleCustomerView: boolean;
  needsRealtimeCustomerData: boolean;
  crossCloudAnalytics: boolean;
  aiAutomationIntent: boolean;
  highCaseVolume: boolean;
  deflectionIntent: boolean;
  salesCopilotIntent: boolean;
  complexityLevel: "Low" | "Medium" | "High";
}

export interface ProductDecision {
  key: ProductKey;
  name: string;
  level: RecommendationLevel;
  reasons: string[];
  triggers: string[];
}

export interface OOTBRow {
  area: string;
  ootbFit: "High" | "Medium" | "Low";
  customizationLevel: "Low" | "Medium" | "High";
  risk: "Low" | "Medium" | "High";
  notes: string;
}

export interface BlueprintResult {
  executiveSnapshot: {
    primaryFocus: string;
    usersDetected: number;
    userCountBand: Signals["userCountBand"];
    complexityLevel: Signals["complexityLevel"];
    confidenceScore: number;
  };
  products: ProductDecision[];
  whyMapping: Array<{ need: string; product: string; why: string }>;
  ootbVsCustom: OOTBRow[];
  objectsAndAutomations: string[];
  integrationMap: Array<{ system: string; pattern: "API" | "Batch" | "Event" }>;
  analyticsPack: string[];
  costEstimate: {
    license: {
      breakdown: Array<{
        product: string;
        users: number;
        annualLow: number;
        annualHigh: number;
        assumedEdition: string;
      }>;
      totalLow: number;
      totalHigh: number;
    };
    implementation: {
      low: number;
      high: number;
      rationale: string;
    };
    yearOneTotal: {
      low: number;
      high: number;
    };
    assumptions: string[];
    disclaimer: string;
  };
  roadmap: Array<{ phase: string; outcomes: string[] }>;
  documentChecklist: string[];
  risks: string[];
  confidenceScore: number;
}
