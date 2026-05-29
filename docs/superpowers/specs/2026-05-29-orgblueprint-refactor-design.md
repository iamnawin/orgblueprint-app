# OrgBlueprint Refactor — Design Spec
**Date:** 2026-05-29  
**Status:** Approved for Implementation  
**Selected Approach:** A — Rules Engine Overhaul

---

## 1. Problem Statement

OrgBlueprint is a Salesforce solution blueprint generator. The current implementation produces repetitive, generic output regardless of what the user types. The root causes are:

- `generateBlueprint()` in `packages/core/src/rules.ts` uses hardcoded static arrays for `objectsAndAutomations`, `analyticsPack`, `risks`, and `roadmap`
- Signal extraction maps keywords directly to SF cloud flags with no intermediate reasoning layer
- `whyMapping` always returns `"Captured business needs"` regardless of input
- `integrationMap` shows ERP/Ecommerce/Marketing Automation even when none were detected
- `analyticsPack` returns the same 5 items for every blueprint
- No structured assumptions, clarifying questions, security model, or AI readiness
- Cloud recommendations are limited to Sales/Service/FSL/Experience — does not handle workflow-platform use cases

**Goal:** Transform OrgBlueprint into a credible Salesforce discovery assistant that produces meaningfully different, specific output for different inputs. Target: good enough to demo to enterprise stakeholders.

---

## 2. Approaches Considered

### Approach A — Rules Engine Overhaul ✅ Selected

All intelligence lives in `packages/core`. Three new modules sit between signal extraction and blueprint generation:

```
Input → analyzer → capabilities → recommender → blueprint section builders → BlueprintResult
```

- New `analyzer.ts`: Enhanced signal extraction producing `RequirementAnalysis`
- New `capabilities.ts`: Maps signals → named business capabilities
- New `recommender.ts`: Maps capabilities → Salesforce cloud recommendations with specific reasoning
- Conditional section builders replace static arrays in `generateBlueprint()`

**Why selected:**
- Fixes the root problem (hardcoded statics) directly in the rules engine
- Works without LLM API keys — demos are safe even if API calls fail
- Deterministic, testable, produces differentiated output per input
- LLM path continues to produce richer output on top of the same structure

**Tradeoff:** More upfront work to model process types and conditional logic.

### Approach B — LLM Prompt Rewrite

Redesign the LLM prompt to return the new structured type format. Rules engine stays as dumb fallback.

**Rejected because:** Does not fix the fallback path. Demo output quality becomes API-dependent.

### Approach C — Hybrid Skeleton + LLM Enrichment

Rules engine produces structure; LLM enriches prose (descriptions, user stories, roadmap narrative).

**Not selected now:** Valid future direction once Approach A is stable. Two systems must both work for best output.

---

## 3. New Module Architecture

### 3.1 Package: `packages/core/src/`

| File | Role |
|------|------|
| `types.ts` | Updated: `BlueprintResultV1`, `BlueprintResultV2`, all new types, `normalizeBlueprintResult()` signature |
| `analyzer.ts` | **NEW** — Enhanced signal extraction → `RequirementAnalysis` |
| `capabilities.ts` | **NEW** — Maps `RequirementAnalysis` → `BusinessCapability[]` |
| `recommender.ts` | **NEW** — Maps `BusinessCapability[]` → `SalesforceRecommendation[]` with reasoning |
| `builders/objects.ts` | **NEW** — `buildObjectModel(processType, capabilities)` → `ObjectRecommendation[]` |
| `builders/automations.ts` | **NEW** — `buildAutomations(processType, capabilities)` → `AutomationRecommendation[]` |
| `builders/integrations.ts` | **NEW** — `buildIntegrationMap(signals)` → integrations only when keywords detected |
| `builders/analytics.ts` | **NEW** — `buildAnalyticsPack(processType, products)` → process-specific dashboards |
| `builders/security.ts` | **NEW** — `buildSecurityModel(personas, products)` → `SecurityRecommendation` |
| `builders/roadmap.ts` | **NEW** — `buildRoadmap(processType, capabilities)` → 5 contextual phases |
| `builders/risks.ts` | **NEW** — `buildRisks(processType, integrations)` → contextual risks |
| `builders/assumptions.ts` | **NEW** — `buildAssumptions(analysis)` → ≥3 specific assumptions |
| `builders/questions.ts` | **NEW** — `buildClarifyingQuestions(analysis)` → ≥5 targeted questions |
| `builders/aireadiness.ts` | **NEW** — `buildAIReadiness(signals, products)` → `AIReadiness` |
| `rules.ts` | **UPDATED** — `generateBlueprint()` calls new pipeline; returns `BlueprintResultV2` |
| `normalizer.ts` | **NEW** — `normalizeBlueprintResult(result)` adapter |

### 3.2 Processing Pipeline

```
Raw Input Text
       │
       ▼
  analyzer.ts
  ─────────────────────────────────────────────
  extractSignals()  (enhanced, keep existing)
  detectProcessType()
  detectPersonas()
  detectIndustry()
  detectMissingInfo()
       │
       ▼ RequirementAnalysis
       │
  capabilities.ts
  ─────────────────────────────────────────────
  mapToCapabilities(analysis)
       │
       ▼ BusinessCapability[]
       │
  recommender.ts
  ─────────────────────────────────────────────
  recommendClouds(capabilities, analysis)
       │
       ▼ SalesforceRecommendation[]
       │
  Section Builders (parallel, each takes analysis + capabilities + recommendations)
  ─────────────────────────────────────────────
  buildObjectModel()
  buildAutomations()
  buildIntegrationMap()
  buildAnalyticsPack()
  buildSecurityModel()
  buildRoadmap()
  buildRisks()
  buildAssumptions()
  buildClarifyingQuestions()
  buildAIReadiness()
       │
       ▼
  BlueprintResultV2
```

---

## 4. Process Classification System

The `ProcessType` is the most important classification. Everything else flows from it.

```typescript
type ProcessType =
  | 'sales_pipeline'           // B2B sales, pipeline, forecast, quotes
  | 'case_management'          // Support, helpdesk, tickets, escalation
  | 'field_service_execution'  // Field teams, work orders, scheduling, assets
  | 'portal_self_service'      // External users, customer portal, partner portal
  | 'retail_execution'         // Store visits, compliance checks, audits, planograms
  | 'employee_request'         // Internal requests, HR approvals, IT helpdesk
  | 'vendor_onboarding'        // Supplier management, vendor portal, procurement
  | 'contract_review'          // CLM, document approvals, negotiation workflows
  | 'compliance_audit'         // Regulatory, checklists, scoring, inspections
  | 'asset_tracking'           // Equipment, inventory, maintenance scheduling
  | 'survey_feedback'          // Customer/employee surveys, NPS, feedback loops
  | 'data_integration'         // Data sync, middleware, API hub, data migration
  | 'executive_reporting'      // Dashboards, KPIs, exec visibility, analytics
  | 'custom_workflow'          // Generic workflow/approval that doesn't fit above
```

Detection rules (keyword signals):
- `sales_pipeline`: pipeline, forecast, opportunity, quote, lead, account executive, deal, revenue
- `case_management`: ticket, case, escalation, support, helpdesk, SLA, resolution, customer service
- `field_service_execution`: work order, field tech, scheduling, dispatch, service appointment, mobile
- `portal_self_service`: portal, self-service, external users, community, partner, login
- `retail_execution`: store visit, planogram, compliance, shelf, retail audit, field rep, perfect store
- `employee_request`: employee, HR, IT request, onboarding, leave, internal approval
- `vendor_onboarding`: vendor, supplier, procurement, RFP, sourcing
- `contract_review`: contract, CLM, NDА, legal, approval, redline, signature
- `compliance_audit`: audit, compliance, regulatory, inspection, checklist, scoring
- `asset_tracking`: asset, equipment, inventory, serial number, warranty, maintenance
- `survey_feedback`: survey, NPS, feedback, satisfaction, response collection
- `data_integration`: data migration, sync, API, middleware, ETL, integration hub
- `executive_reporting`: dashboard, KPI, report, analytics, executive, forecast accuracy

---

## 5. Business Capability Mapping

Business capabilities are the intermediate layer between raw signals and Salesforce product recommendations. They describe what the business needs to do, not how Salesforce does it.

### Capability Registry

| Capability ID | Name | Triggers (process types) |
|---------------|------|--------------------------|
| `pipeline_mgmt` | Sales Pipeline Management | `sales_pipeline` |
| `quote_to_cash` | Quote-to-Cash | `sales_pipeline` + CPQ signals |
| `case_triage` | Case Triage & Resolution | `case_management` |
| `sla_management` | SLA & Escalation Management | `case_management` |
| `field_dispatch` | Field Workforce Dispatch | `field_service_execution` |
| `work_order_mgmt` | Work Order Management | `field_service_execution` |
| `customer_portal` | Customer Self-Service Portal | `portal_self_service` |
| `partner_portal` | Partner/Dealer Portal | `portal_self_service` + partner signals |
| `store_audit` | Store Visit & Compliance Audit | `retail_execution` |
| `planogram_check` | Planogram Verification | `retail_execution` + planogram signals |
| `employee_workflow` | Employee Request & Approval | `employee_request` |
| `vendor_mgmt` | Vendor Lifecycle Management | `vendor_onboarding` |
| `contract_lifecycle` | Contract Lifecycle Management | `contract_review` |
| `compliance_tracking` | Compliance & Audit Tracking | `compliance_audit` |
| `asset_lifecycle` | Asset Lifecycle Management | `asset_tracking` |
| `feedback_collection` | Survey & Feedback Collection | `survey_feedback` |
| `reporting_analytics` | Reporting & Analytics | any process + reporting signals |
| `data_sync` | External System Integration | any process + integration signals |
| `ai_augmentation` | AI/Agentforce Augmentation | any process + AI signals |

---

## 6. Salesforce Cloud Recommendation Rules

### Cloud → Capability Mapping

| Salesforce Cloud | Recommend When | Do NOT Recommend When |
|-----------------|----------------|----------------------|
| **Sales Cloud** | `pipeline_mgmt`, `quote_to_cash`, `lead` management signals present | No sales/revenue signals |
| **Service Cloud** | `case_triage`, `sla_management`, `helpdesk` signals present | No customer support signals |
| **Field Service** | `field_dispatch`, `work_order_mgmt`, mobile field tech signals | No field workforce signals |
| **Experience Cloud** | `customer_portal`, `partner_portal`, external user signals | All users are internal |
| **Revenue Cloud (CPQ)** | `quote_to_cash` + configured pricing, complex quoting signals | Simple product catalogue |
| **Marketing Cloud** | Lead nurture, campaigns, email journey signals | No marketing automation signals |
| **Agentforce** | AI signals, chatbot, automation of customer engagement | No AI/automation signals |
| **Salesforce Platform** | `employee_workflow`, `vendor_mgmt`, `compliance_tracking`, `asset_lifecycle`, `contract_lifecycle`, `custom_workflow` — process needs are clear but no named cloud fits | Clear Sales/Service/FSL signals exist |

### Confidence Scoring Rules
- **High (80-100%):** Multiple strong signals, well-defined process type, standard use case
- **Medium (50-79%):** Some signals present, process partially described, common but edge use case
- **Low (20-49%):** Weak signals, ambiguous description, unusual use case

### Why Mapping Rules (no more "Captured business needs")
Each recommendation must produce a specific reason. Examples:
- Sales Cloud: `"Detected pipeline management + forecasting signals: 'pipeline', 'forecast', 'deal stages'"`
- Service Cloud: `"Detected support case signals: 'tickets', 'escalation', 'SLA', 'resolution time'"`
- FSL: `"Detected field workforce signals: 'work orders', 'scheduling', 'field technicians'"`
- Salesforce Platform: `"Use case is workflow automation (employee requests + approvals) without customer-facing components — Salesforce Platform/custom app is the right fit"`

---

## 7. Versioned Type System

### 7.1 Schema Version Field

All `BlueprintResult` objects will carry a `schemaVersion` field:
- `"v1"` — old format (flat arrays, string-based fields)
- `"v2"` — new format (structured types, capability layer, full sections)

### 7.2 `BlueprintResultV1` (backward compat)

Represents the existing structure saved in the DB. No changes to this interface — it's a snapshot of the current `BlueprintResult`.

```typescript
interface BlueprintResultV1 {
  schemaVersion?: undefined | 'v1';
  products: ProductRecommendation[];        // { product, level, edition, notes }
  whyMapping: { product: string; reason: string }[];
  objectsAndAutomations: string[];          // flat string array
  integrationMap: IntegrationItem[];
  analyticsPack: AnalyticsItem[];
  ootbScore: OOTBRow[];
  confidenceScore: number;
  risks: string[];                          // flat string array
  roadmap: Phase[];                         // old 3-phase structure
  licenseEstimate?: LicenseEstimate;
  implementationEstimate?: ImplementationEstimate;
}
```

### 7.3 `BlueprintResultV2` (new format)

```typescript
interface BlueprintResultV2 {
  schemaVersion: 'v2';

  // Requirement analysis (new)
  analysis: RequirementAnalysis;

  // Capability layer (new)
  capabilities: BusinessCapability[];

  // Cloud recommendations (replaces products[])
  recommendations: SalesforceRecommendation[];

  // Object model (replaces objectsAndAutomations: string[])
  objectModel: {
    standard: ObjectRecommendation[];
    custom: ObjectRecommendation[];
  };

  // Automation (replaces objectsAndAutomations string entries for automations)
  automations: AutomationRecommendation[];

  // Integration (enhanced — conditional, not always shown)
  integrations: IntegrationRecommendation[];

  // Analytics (process-specific, replaces flat analyticsPack)
  analytics: AnalyticsRecommendation[];

  // Security model (new)
  security: SecurityRecommendation;

  // AI/Agentforce readiness (new)
  aiReadiness: AIReadiness;

  // Assumptions (new — ≥3, specific)
  assumptions: Assumption[];

  // Clarifying questions (new — ≥5, targeted)
  clarifyingQuestions: ClarifyingQuestion[];

  // Risks (replaces risks: string[] with structured type)
  risks: RiskItem[];

  // Roadmap (replaces old 3-phase with 5 contextual phases)
  roadmap: RoadmapPhase[];

  // User stories (new)
  userStories: UserStory[];

  // Scoring (enhanced)
  blueprintConfidence: number;           // 0-100, replaces confidenceScore
  ootbScore: OOTBRow[];

  // Estimates (unchanged)
  licenseEstimate?: LicenseEstimate;
  implementationEstimate?: ImplementationEstimate;
}
```

### 7.4 New Supporting Types

```typescript
interface RequirementAnalysis {
  primaryProcess: ProcessType;
  secondaryProcesses: ProcessType[];
  industry: string;                        // detected or 'unknown'
  personas: Persona[];
  hasExternalUsers: boolean;
  hasMobileRequirement: boolean;
  hasAISignals: boolean;
  hasIntegrationSignals: boolean;
  hasDataMigration: boolean;
  detectedSignals: string[];               // the actual keywords found
  missingInfo: string[];                   // what the analyzer couldn't determine
}

interface Persona {
  name: string;                            // 'Sales Rep', 'Field Technician', 'Customer'
  type: 'internal' | 'external' | 'partner';
  accessLevel: 'full' | 'limited' | 'self-service';
}

interface BusinessCapability {
  id: string;
  name: string;
  description: string;
  confidence: 'high' | 'medium' | 'low';
  sourcedFrom: string[];                   // which signals/process types triggered this
}

interface SalesforceRecommendation {
  product: string;
  level: 'recommended' | 'optional' | 'not_needed';
  confidence: number;                      // 0-100
  reason: string;                          // specific, references detected signals
  capabilities: string[];                  // capability IDs this addresses
  edition?: string;
}

interface ObjectRecommendation {
  name: string;
  type: 'standard' | 'custom';
  purpose: string;
  keyFields: string[];
  relationships: { to: string; type: 'lookup' | 'master-detail' | 'many-to-many' }[];
}

interface AutomationRecommendation {
  name: string;
  type: 'Record-Triggered Flow' | 'Screen Flow' | 'Scheduled Flow' | 'Apex Trigger'
      | 'Platform Event' | 'OmniScript' | 'Approval Process';
  trigger: string;
  purpose: string;
  complexity: 'simple' | 'medium' | 'complex';
}

interface IntegrationRecommendation {
  system: string;
  type: 'bidirectional' | 'inbound' | 'outbound';
  pattern: 'real-time API' | 'batch sync' | 'event-driven' | 'middleware';
  notes: string;
  detectedFrom: string;                    // the keyword that triggered this
}

interface AnalyticsRecommendation {
  name: string;
  type: 'CRM Analytics Dashboard' | 'Report' | 'Einstein Discovery' | 'Tableau';
  audience: string;                        // 'Sales Manager', 'Executive', 'Field Tech'
  description: string;
}

interface SecurityRecommendation {
  profiles: string[];
  permissionSets: string[];
  sharingModel: 'Public Read/Write' | 'Public Read Only' | 'Private' | 'Controlled by Parent';
  recordLevelAccess: string;
  communityAccess?: string;               // only if Experience Cloud present
  mfaRecommended: boolean;
  notes: string;
}

interface AIReadiness {
  score: number;                           // 0-100
  readyFor: string[];                      // things it can use right now
  blockers: string[];                      // what needs to be in place first
  agentforceUseCases: string[];           // specific Agentforce use cases for this process
}

interface Assumption {
  id: string;
  text: string;
  category: 'data' | 'process' | 'users' | 'integration' | 'scope' | 'timeline';
}

interface ClarifyingQuestion {
  id: string;
  question: string;
  why: string;                             // why this matters for the blueprint
  category: 'scope' | 'users' | 'data' | 'integration' | 'process' | 'timeline';
}

interface RiskItem {
  title: string;
  description: string;
  severity: 'high' | 'medium' | 'low';
  mitigation: string;
  category: 'data' | 'technical' | 'adoption' | 'scope' | 'integration' | 'licensing';
}

interface RoadmapPhase {
  phase: number;                           // 1-5
  title: string;
  duration: string;                        // e.g. "6-8 weeks"
  deliverables: string[];
  sfProducts: string[];                    // products configured in this phase
  milestone: string;
}

interface UserStory {
  persona: string;
  action: string;
  outcome: string;
  acceptanceCriteria: string[];
}
```

### 7.5 Union Type

```typescript
type BlueprintResult = BlueprintResultV1 | BlueprintResultV2;
```

### 7.6 `normalizeBlueprintResult()` Adapter

```typescript
function normalizeBlueprintResult(result: BlueprintResult): BlueprintResultV2
```

Rules:
1. If `schemaVersion === 'v2'`, return as-is
2. If `schemaVersion` is missing or `'v1'`, detect v1 structure and convert:
   - `products[]` → `recommendations[]` (map level, add generic reason from `whyMapping`)
   - `objectsAndAutomations: string[]` → split heuristically into `objectModel.custom[]` and `automations[]` (strings containing "Flow", "Apex", "Process" go to automations; the rest to custom objects)
   - `risks: string[]` → `risks: RiskItem[]` (category: 'technical', severity: 'medium', no mitigation)
   - `analyticsPack[]` → `analytics[]` (type: 'Report', audience: 'Manager')
   - `roadmap[]` → expand to 5 phases (first 3 from existing data, phases 4-5 from defaults)
   - All new fields (`assumptions`, `clarifyingQuestions`, `security`, `aiReadiness`, `userStories`, `capabilities`, `analysis`) → filled with safe fallback content indicating "not available for older blueprints"
3. Never throw — if conversion fails for a field, use safe empty defaults

---

## 8. Conditional Section Builders

### 8.1 Integration Builder Rules
- Only add an integration entry when a system keyword is detected in the input
- Known keywords: `sap`, `netsuite`, `workday`, `hubspot`, `marketo`, `shopify`, `oracle`, `dynamics`, `snowflake`, `tableau`, `slack`, `mulesoft`, `boomi`, `jira`, `servicenow`
- If no integration keywords found: return empty array `[]`
- Do NOT default to "ERP / Ecommerce / Marketing Automation" as fallback

### 8.2 Analytics Builder Rules
Process-specific dashboards (not the same 5 for everyone):
- `sales_pipeline`: Pipeline by Stage, Forecast Accuracy, Rep Performance, Win Rate
- `case_management`: Case Volume Trend, SLA Compliance, Resolution Time, Agent Performance
- `field_service_execution`: Work Order Completion, First-Time Fix Rate, Technician Utilization, SLA Breach
- `portal_self_service`: Deflection Rate, Self-Service Adoption, Login Activity, Knowledge Article Effectiveness
- `retail_execution`: Visit Compliance Rate, Perfect Store Score, Store Performance Ranking, Gap Analysis
- `employee_request`: Request Volume by Type, Approval Cycle Time, SLA Adherence, Open Requests
- `compliance_audit`: Audit Pass Rate, Findings by Category, Trend by Region, Corrective Actions
- Default (when process unclear): Adoption Dashboard, Record Activity, Data Quality Health, Executive Summary

### 8.3 Risk Builder Rules
Process-specific risks (not generic):
- Always include: Data quality risk (if data migration signals), User adoption risk (if external users detected)
- `sales_pipeline`: Forecast accuracy risk, pipeline discipline risk
- `case_management`: SLA breach risk, queue management risk
- `field_service_execution`: Offline data sync risk, scheduling complexity risk
- `portal_self_service`: Community license scaling risk, identity/SSO risk
- `retail_execution`: Device compatibility risk, offline sync in store risk
- Integration signals present: Add integration governance risk
- AI signals present: Add AI model accuracy and data readiness risk

### 8.4 Roadmap Builder Rules
5 phases — duration and deliverables vary by process type and detected capabilities.

Standard phase structure:
- Phase 1: Foundation (org setup, data model, security, profiles)
- Phase 2: Core Process (primary cloud configuration, standard objects, basic flows)
- Phase 3: Automation & Integration (flows, apex, external system connections)
- Phase 4: Reporting & Analytics (dashboards, reports, KPIs)
- Phase 5: AI/Advanced Features (Agentforce, Einstein, mobile, communities)

Duration scaling:
- Simple process (1 cloud, <5 custom objects): 4-6 weeks per phase
- Medium (2 clouds, 5-10 custom objects): 6-8 weeks per phase
- Complex (3+ clouds, integrations, 10+ custom objects): 8-12 weeks per phase

### 8.5 Assumptions Builder Rules
Always generate ≥3 assumptions. Specific, not generic. Examples:
- `"We assume all users are Salesforce-licensed employees (no guest/external access required)"` — only if no external user signals
- `"We assume data migration from [detected system] will be handled as a parallel workstream"` — only if migration signals
- `"We assume mobile access is required based on field team signals"` — only if mobile signals
- `"We assume [detected ERP] will remain the system of record for financial data"` — only if ERP keywords detected
- `"We assume sales process stages are defined and agreed upon before CRM configuration begins"` — for sales_pipeline

### 8.6 Clarifying Questions Builder Rules
Always generate ≥5 questions. Targeted, not generic. Each question has a `why` explanation.

Base questions per process type:
- `sales_pipeline`: How many stages in your sales process? Do you need CPQ or configure-price-quote? What is your lead source (web, event, SDR)? Do you need partner/channel sales?
- `case_management`: What are your SLA targets by priority? Do you need omni-channel routing? Is there a knowledge base today?
- `field_service_execution`: How many field technicians? What is the scheduling model (auto vs manual)? Do technicians need offline access?
- `portal_self_service`: Who are the portal users (customers, partners, or both)? How many external users expected? SSO required?

Always ask if missing info detected (e.g., if `missingInfo` includes `'no_users_mentioned'`, ask about user count and types).

---

## 9. Salesforce Platform as a Valid Recommendation

When `processType` is one of: `employee_request`, `vendor_onboarding`, `contract_review`, `compliance_audit`, `asset_tracking`, `survey_feedback`, `custom_workflow`

AND no strong Sales Cloud, Service Cloud, or FSL signals exist:

Recommend `Salesforce Platform` with:
- `level: 'recommended'`
- `reason`: Explains that the use case is workflow/data capture without a customer-facing component and does not require a named cloud license
- Note in `assumptions`: "We assume this does not require customer or partner-facing community access"
- Note in `clarifyingQuestions`: "Would this workflow ever need to be accessed by users outside your organization?"

Do not force everything into Sales/Service/FSL/Experience.

---

## 10. Demo Scenarios (4 required)

Each scenario produces meaningfully different output. These become the "Load Example" buttons.

| # | Label | Primary Process | Clouds | Key Differentiators |
|---|-------|----------------|--------|---------------------|
| 1 | Home Services Company | `field_service_execution` | FSL + Service Cloud | Work orders, scheduling, mobile, SLA, technician dispatch |
| 2 | B2B Software Sales | `sales_pipeline` | Sales Cloud (+ optional CPQ) | Pipeline stages, forecast, quotes, opportunity management |
| 3 | Customer Self-Service Portal | `portal_self_service` | Experience Cloud + Service Cloud | External users, knowledge base, case deflection, SSO |
| 4 | Field Team Retail Execution | `retail_execution` | Salesforce Platform (+ optional FSL) | Store visits, compliance scoring, planogram, offline |

Each demo scenario loads a pre-written input text that triggers distinctive signals for its process type.

---

## 11. LLM Path Updates

The LLM prompt in `apps/web/src/lib/anthropic.ts` must be updated to:
1. Return `BlueprintResultV2` structure (with `schemaVersion: "v2"`)
2. Include `analysis`, `capabilities`, and all new sections
3. System prompt must include process type definitions and capability list to guide structured output
4. JSON schema in prompt must match new type definitions exactly

The API route in `apps/web/src/app/api/blueprint/route.ts`:
- No changes to fallback behavior
- Response type changes from `BlueprintResult` (v1) to `BlueprintResultV2`
- Add `normalizeBlueprintResult()` call on retrieved DB records before returning

---

## 12. UI Rendering Strategy

The UI should always call `normalizeBlueprintResult()` before rendering. This ensures:
- Old v1 blueprints from DB render without crashing
- New v2 blueprints render with full structured sections
- Safe empty states when a v1 field can't be converted

UI section updates (to be designed after type system is stable):
- Replace `objectsAndAutomations` string list with two sections: Standard Objects table + Custom Objects table + Automations grouped by type
- Replace `risks: string[]` with structured risk cards (title, severity badge, mitigation)
- Replace `analyticsPack` flat list with audience-grouped analytics cards
- Add new sections: Assumptions, Clarifying Questions, Security Model, AI Readiness, Business Capabilities
- Blueprint Confidence Score displayed as a visual score badge at the top
- Detected signals shown as chips/tags
- Missing info shown as a warning section

---

## 13. Implementation Order

Per the user's directed sequence:

1. Update type system: `types.ts` → add `BlueprintResultV1`, `BlueprintResultV2`, all new types, union `BlueprintResult`
2. Create `normalizer.ts` with `normalizeBlueprintResult()` adapter
3. Create `analyzer.ts` — enhanced signal extraction producing `RequirementAnalysis`
4. Create `capabilities.ts` — process type → capability mapping
5. Create `recommender.ts` — capability → Salesforce recommendations with conditional reasoning and `whyMapping`
6. Create section builders: `builders/objects.ts`, `builders/automations.ts`, `builders/integrations.ts`, `builders/analytics.ts`, `builders/risks.ts`, `builders/roadmap.ts`, `builders/assumptions.ts`, `builders/questions.ts`, `builders/security.ts`, `builders/aireadiness.ts`
7. Update `rules.ts` — `generateBlueprint()` calls new pipeline, returns `BlueprintResultV2`
8. Update LLM prompt in `anthropic.ts` to output `BlueprintResultV2`
9. Update API route to use `normalizeBlueprintResult()` on retrieved records
10. Update UI components to render v2 sections (after data structure confirmed stable)

---

## 14. Out of Scope

- DB migration (runtime normalization is sufficient for now)
- Switching from Prisma ORM
- Changing the multi-LLM provider pattern
- New auth or session management
- Billing or usage metering
- Public-facing production deployment

---

## 15. Success Criteria

- Same input text produces the same output on every run (deterministic rules engine)
- Two different inputs from different process types (e.g., field service vs B2B sales) produce completely different blueprint sections
- `integrationMap` is empty when no integration keywords are in the input
- `analyticsPack` shows process-specific dashboards, not the same 5 items
- `roadmap` has 5 phases with content specific to the detected process
- `whyMapping` references actual detected signals, not "Captured business needs"
- `objectModel` separates standard and custom objects
- `automations` are typed (not string[])
- Old v1 blueprints load and render without crashing
- `normalizeBlueprintResult()` returns valid v2 shape for any v1 input
- All 4 demo scenarios produce visually and substantively different blueprints
