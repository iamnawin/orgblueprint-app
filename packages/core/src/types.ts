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

export interface BlueprintResult {
  executiveSnapshot: string[];
  products: ProductDecision[];
  whyMapping: Array<{ need: string; product: string; why: string }>;
  ootbVsCustom: OOTBRow[];
  objectsAndAutomations: string[];
  integrationMap: string[];
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
