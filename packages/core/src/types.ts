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
  | "salesforce_platform"
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
  userCountBand: "1-49" | "50-199" | "200+";
  // Core CRM
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
  triggers: string[];
}

export interface OOTBRow {
  area: string;
  ootbFit: "High" | "Medium" | "Low";
  customizationLevel: "Low" | "Medium" | "High";
  risk: "Low" | "Medium" | "High";
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

export type ProcessType =
  | "sales_pipeline"
  | "case_management"
  | "field_service_execution"
  | "portal_self_service"
  | "retail_execution"
  | "employee_request"
  | "vendor_onboarding"
  | "contract_review"
  | "compliance_audit"
  | "asset_tracking"
  | "survey_feedback"
  | "data_integration"
  | "executive_reporting"
  | "custom_workflow";

export interface Persona {
  name: string;
  type: "internal" | "external" | "partner";
  accessLevel: "full" | "limited" | "self-service";
}

export interface RequirementAnalysis {
  primaryProcess: ProcessType;
  secondaryProcesses: ProcessType[];
  industry: string;
  personas: Persona[];
  hasExternalUsers: boolean;
  hasMobileRequirement: boolean;
  hasAISignals: boolean;
  hasIntegrationSignals: boolean;
  hasDataMigration: boolean;
  detectedSignals: string[];
  missingInfo: string[];
}

export interface BusinessCapability {
  id: string;
  name: string;
  description: string;
  confidence: "high" | "medium" | "low";
  sourcedFrom: string[];
}

export interface SalesforceRecommendation {
  product: string;
  level: RecommendationLevel;
  confidence: number;
  reason: string;
  capabilities: string[];
  edition?: string;
}

export interface ObjectRecommendation {
  name: string;
  type: "standard" | "custom";
  purpose: string;
  keyFields: string[];
  relationships: { to: string; type: "lookup" | "master-detail" | "many-to-many" }[];
}

export interface AutomationRecommendation {
  name: string;
  type:
    | "Record-Triggered Flow"
    | "Screen Flow"
    | "Scheduled Flow"
    | "Apex Trigger"
    | "Platform Event"
    | "OmniScript"
    | "Approval Process";
  trigger: string;
  purpose: string;
  complexity: "simple" | "medium" | "complex";
}

export interface IntegrationRecommendation {
  system: string;
  type: "bidirectional" | "inbound" | "outbound";
  pattern: "real-time API" | "batch sync" | "event-driven" | "middleware";
  notes: string;
  detectedFrom: string;
}

export interface AnalyticsRecommendation {
  name: string;
  type: "CRM Analytics Dashboard" | "Report" | "Einstein Discovery" | "Tableau";
  audience: string;
  description: string;
}

export interface SecurityRecommendation {
  profiles: string[];
  permissionSets: string[];
  sharingModel: "Public Read/Write" | "Public Read Only" | "Private" | "Controlled by Parent";
  recordLevelAccess: string;
  communityAccess?: string;
  mfaRecommended: boolean;
  notes: string;
}

export interface AIReadiness {
  score: number;
  readyFor: string[];
  blockers: string[];
  agentforceUseCases: string[];
}

export interface Assumption {
  id: string;
  text: string;
  category: "data" | "process" | "users" | "integration" | "scope" | "timeline";
}

export interface ClarifyingQuestion {
  id: string;
  question: string;
  why: string;
  category: "scope" | "users" | "data" | "integration" | "process" | "timeline";
}

export interface RiskItem {
  title: string;
  description: string;
  severity: "high" | "medium" | "low";
  mitigation: string;
  category: "data" | "technical" | "adoption" | "scope" | "integration" | "licensing";
}

export interface RoadmapPhase {
  phase: number | string;
  title: string;
  duration: string;
  deliverables: string[];
  outcomes: string[];
  sfProducts: string[];
  milestone: string;
}

export interface UserStory {
  persona: string;
  action: string;
  outcome: string;
  acceptanceCriteria: string[];
}

export interface BlueprintResultV1 {
  schemaVersion?: undefined | "v1";
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
  perUserCostData?: InteractiveCostData;
}

export interface BlueprintResultV2
  extends Omit<BlueprintResultV1, "schemaVersion" | "integrationMap" | "analyticsPack" | "roadmap" | "risks"> {
  schemaVersion: "v2";
  analysis: RequirementAnalysis;
  capabilities: BusinessCapability[];
  recommendations: SalesforceRecommendation[];
  objectModel: {
    standard: ObjectRecommendation[];
    custom: ObjectRecommendation[];
  };
  automations: AutomationRecommendation[];
  integrations: IntegrationRecommendation[];
  analytics: AnalyticsRecommendation[];
  security: SecurityRecommendation;
  aiReadiness: AIReadiness;
  assumptions: Assumption[];
  clarifyingQuestions: ClarifyingQuestion[];
  risks: RiskItem[];
  roadmap: RoadmapPhase[];
  userStories: UserStory[];
  blueprintConfidence: number;

  // Compatibility projections for the existing UI while it migrates to v2 sections.
  integrationMap: Array<{ system: string; pattern: "API" | "Batch" | "Event" }>;
  analyticsPack: string[];
  legacyRoadmap: BlueprintResultV1["roadmap"];
  legacyRisks: string[];
}

export type BlueprintResult = BlueprintResultV1 | BlueprintResultV2;
