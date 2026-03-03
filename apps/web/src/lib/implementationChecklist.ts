import { ProductDecision } from "@orgblueprint/core";

export type ChecklistEffort = "Low" | "Medium" | "High";
export type ChecklistCategory = "Discovery" | "Config" | "Integration" | "Testing" | "Training";

export interface ChecklistItem {
  task: string;
  product: string;
  effort: ChecklistEffort;
  category: ChecklistCategory;
}

export interface ChecklistPhase {
  phase: string;
  items: ChecklistItem[];
}

const PRODUCT_TASKS: Partial<Record<string, ChecklistItem[]>> = {
  sales_cloud: [
    { task: "Document sales process stages and pipeline definitions", product: "Sales Cloud", effort: "Medium", category: "Discovery" },
    { task: "Configure opportunity stages and probability mappings", product: "Sales Cloud", effort: "Low", category: "Config" },
    { task: "Set up lead assignment rules and routing queues", product: "Sales Cloud", effort: "Medium", category: "Config" },
    { task: "Configure email integration (Outlook / Gmail)", product: "Sales Cloud", effort: "Low", category: "Config" },
    { task: "Build sales dashboards and forecasting views", product: "Sales Cloud", effort: "Medium", category: "Config" },
    { task: "Migrate historical opportunity and account data", product: "Sales Cloud", effort: "High", category: "Integration" },
    { task: "User acceptance testing with sales rep group", product: "Sales Cloud", effort: "Medium", category: "Testing" },
    { task: "Sales team Salesforce training (2-day workshop)", product: "Sales Cloud", effort: "Medium", category: "Training" },
  ],
  service_cloud: [
    { task: "Document case types, priorities, SLA tiers, and escalation paths", product: "Service Cloud", effort: "Medium", category: "Discovery" },
    { task: "Configure case queues and assignment rules", product: "Service Cloud", effort: "Medium", category: "Config" },
    { task: "Build omni-channel routing configuration", product: "Service Cloud", effort: "High", category: "Config" },
    { task: "Create email-to-case and case escalation automation", product: "Service Cloud", effort: "Low", category: "Config" },
    { task: "Build knowledge base article structure and template", product: "Service Cloud", effort: "High", category: "Config" },
    { task: "Configure customer satisfaction (CSAT) surveys", product: "Service Cloud", effort: "Low", category: "Config" },
    { task: "Load existing cases and migrate knowledge articles", product: "Service Cloud", effort: "High", category: "Integration" },
    { task: "Train support agents on case management workflows", product: "Service Cloud", effort: "Medium", category: "Training" },
  ],
  experience_cloud: [
    { task: "Define portal user personas and access permission requirements", product: "Experience Cloud", effort: "Medium", category: "Discovery" },
    { task: "Design portal branding, navigation, and page layout", product: "Experience Cloud", effort: "Medium", category: "Config" },
    { task: "Configure sharing rules and security for portal users", product: "Experience Cloud", effort: "High", category: "Config" },
    { task: "Set up self-registration or SSO / SAML for portal users", product: "Experience Cloud", effort: "Medium", category: "Config" },
    { task: "Build knowledge base and self-service content", product: "Experience Cloud", effort: "Medium", category: "Config" },
    { task: "Test portal across browsers and mobile devices", product: "Experience Cloud", effort: "Medium", category: "Testing" },
    { task: "Onboard portal administrators and community managers", product: "Experience Cloud", effort: "Low", category: "Training" },
  ],
  cpq_revenue: [
    { task: "Document all products, bundles, options, and pricing rules", product: "CPQ", effort: "High", category: "Discovery" },
    { task: "Configure product catalog and bundle structures", product: "CPQ", effort: "High", category: "Config" },
    { task: "Build pricing rules, discount schedules, and price books", product: "CPQ", effort: "High", category: "Config" },
    { task: "Configure approval workflows for discount thresholds", product: "CPQ", effort: "Medium", category: "Config" },
    { task: "Design and build quote document templates", product: "CPQ", effort: "Medium", category: "Config" },
    { task: "Integrate CPQ with billing / ERP / finance systems", product: "CPQ", effort: "High", category: "Integration" },
    { task: "Full end-to-end quote cycle UAT testing", product: "CPQ", effort: "High", category: "Testing" },
    { task: "Sales and sales ops CPQ configuration training", product: "CPQ", effort: "High", category: "Training" },
  ],
  field_service: [
    { task: "Map work order types, service territory structure, and SLAs", product: "Field Service", effort: "Medium", category: "Discovery" },
    { task: "Configure service territories, skills, and resource types", product: "Field Service", effort: "High", category: "Config" },
    { task: "Set up work order rules and appointment booking logic", product: "Field Service", effort: "High", category: "Config" },
    { task: "Configure and test technician mobile app", product: "Field Service", effort: "Medium", category: "Config" },
    { task: "Integrate with inventory / parts management system", product: "Field Service", effort: "High", category: "Integration" },
    { task: "Pilot with small technician group before full rollout", product: "Field Service", effort: "Medium", category: "Testing" },
    { task: "Dispatcher and field technician mobile training", product: "Field Service", effort: "Medium", category: "Training" },
  ],
  marketing_cloud: [
    { task: "Audit and clean email subscriber lists for deliverability", product: "Marketing Cloud", effort: "High", category: "Discovery" },
    { task: "Configure account, business units, and sendable data extensions", product: "Marketing Cloud", effort: "Medium", category: "Config" },
    { task: "Build core email templates with brand standards", product: "Marketing Cloud", effort: "Medium", category: "Config" },
    { task: "Configure Marketing Cloud Connect to Salesforce CRM", product: "Marketing Cloud", effort: "Medium", category: "Integration" },
    { task: "Build first Journey Builder automation flow", product: "Marketing Cloud", effort: "Medium", category: "Config" },
    { task: "Test email rendering across major email clients", product: "Marketing Cloud", effort: "Low", category: "Testing" },
    { task: "Marketing team platform training (Email Studio, Journey Builder)", product: "Marketing Cloud", effort: "Medium", category: "Training" },
  ],
  pardot: [
    { task: "Map buyer journey stages and define lead scoring criteria", product: "Pardot", effort: "Medium", category: "Discovery" },
    { task: "Configure Pardot account, business unit, and domain setup", product: "Pardot", effort: "Low", category: "Config" },
    { task: "Set up lead scoring and grading models", product: "Pardot", effort: "Medium", category: "Config" },
    { task: "Build landing pages, forms, and thank-you pages", product: "Pardot", effort: "Medium", category: "Config" },
    { task: "Sync Salesforce Campaigns with Pardot campaigns", product: "Pardot", effort: "Low", category: "Integration" },
    { task: "Test lead flow: form → Pardot → Salesforce assign", product: "Pardot", effort: "Low", category: "Testing" },
    { task: "Marketing team Pardot feature training", product: "Pardot", effort: "Medium", category: "Training" },
  ],
  data_cloud: [
    { task: "Inventory all data sources and document data models", product: "Data Cloud", effort: "High", category: "Discovery" },
    { task: "Design unified customer data model and identity resolution strategy", product: "Data Cloud", effort: "High", category: "Discovery" },
    { task: "Configure Data Cloud tenant and data streams", product: "Data Cloud", effort: "High", category: "Config" },
    { task: "Implement identity resolution rules and test unification", product: "Data Cloud", effort: "High", category: "Config" },
    { task: "Build first audience segments for activation", product: "Data Cloud", effort: "Medium", category: "Config" },
    { task: "Connect all external data sources via ingestion connectors", product: "Data Cloud", effort: "High", category: "Integration" },
    { task: "Validate data quality and unified profile accuracy", product: "Data Cloud", effort: "High", category: "Testing" },
    { task: "Data engineering team platform training", product: "Data Cloud", effort: "High", category: "Training" },
  ],
  agentforce_einstein: [
    { task: "Identify top automation use cases and AI scoring opportunities", product: "Agentforce / Einstein", effort: "Medium", category: "Discovery" },
    { task: "Configure Einstein Lead Scoring and Opportunity Insights", product: "Agentforce / Einstein", effort: "Low", category: "Config" },
    { task: "Build Einstein Bot or Agentforce agent for service deflection", product: "Agentforce / Einstein", effort: "High", category: "Config" },
    { task: "Define Agentforce agent actions, topics, and guardrails", product: "Agentforce / Einstein", effort: "High", category: "Config" },
    { task: "Test AI predictions against historical data for accuracy", product: "Agentforce / Einstein", effort: "Medium", category: "Testing" },
    { task: "Train team on AI feature adoption and trust layer", product: "Agentforce / Einstein", effort: "Medium", category: "Training" },
  ],
  mulesoft: [
    { task: "Document all integration requirements, data flows, and APIs", product: "MuleSoft", effort: "High", category: "Discovery" },
    { task: "Design API-led connectivity architecture (System / Process / Experience APIs)", product: "MuleSoft", effort: "High", category: "Discovery" },
    { task: "Set up Anypoint Platform environments (dev, QA, prod)", product: "MuleSoft", effort: "Medium", category: "Config" },
    { task: "Build System APIs for each source system", product: "MuleSoft", effort: "High", category: "Integration" },
    { task: "Build Process and Experience API orchestrations", product: "MuleSoft", effort: "High", category: "Integration" },
    { task: "Integration end-to-end testing and error handling", product: "MuleSoft", effort: "High", category: "Testing" },
    { task: "MuleSoft developer team certification and training", product: "MuleSoft", effort: "High", category: "Training" },
  ],
  tableau_analytics: [
    { task: "Identify key reports, KPIs, and dashboard requirements", product: "Tableau", effort: "Medium", category: "Discovery" },
    { task: "Configure Tableau Server or Cloud environment", product: "Tableau", effort: "Medium", category: "Config" },
    { task: "Connect to Salesforce and other data sources", product: "Tableau", effort: "Low", category: "Integration" },
    { task: "Build executive dashboard pack and operational reports", product: "Tableau", effort: "High", category: "Config" },
    { task: "Embed Tableau dashboards in Salesforce (Lightning)", product: "Tableau", effort: "Medium", category: "Config" },
    { task: "Validate data accuracy against existing reports", product: "Tableau", effort: "Medium", category: "Testing" },
    { task: "Train business users on self-service Tableau authoring", product: "Tableau", effort: "Medium", category: "Training" },
  ],
  slack_collab: [
    { task: "Define Slack workspace structure, channel taxonomy, and naming conventions", product: "Slack", effort: "Low", category: "Discovery" },
    { task: "Configure Slack workspace and connect to Salesforce", product: "Slack", effort: "Low", category: "Config" },
    { task: "Set up Salesforce for Slack app and record notifications", product: "Slack", effort: "Low", category: "Integration" },
    { task: "Build Slack notification automations from Salesforce records", product: "Slack", effort: "Medium", category: "Config" },
    { task: "Test Salesforce record sharing and actions in Slack", product: "Slack", effort: "Low", category: "Testing" },
    { task: "Onboard all employees to Slack with etiquette guide", product: "Slack", effort: "Medium", category: "Training" },
  ],
  salesforce_shield: [
    { task: "Document data sensitivity classification and encryption requirements", product: "Shield", effort: "High", category: "Discovery" },
    { task: "Configure Platform Encryption for sensitive fields", product: "Shield", effort: "High", category: "Config" },
    { task: "Set up Event Monitoring dashboards and alerts", product: "Shield", effort: "Medium", category: "Config" },
    { task: "Configure Transaction Security policies for high-risk actions", product: "Shield", effort: "Medium", category: "Config" },
    { task: "Regression test all integrations after encryption is enabled", product: "Shield", effort: "High", category: "Testing" },
    { task: "Security team training on Shield monitoring and incident response", product: "Shield", effort: "Medium", category: "Training" },
  ],
  health_cloud: [
    { task: "Document HIPAA data classification and PHI handling requirements", product: "Health Cloud", effort: "High", category: "Discovery" },
    { task: "Configure Health Cloud data model for patient / member / provider", product: "Health Cloud", effort: "High", category: "Config" },
    { task: "Set up care plan templates and care team workflows", product: "Health Cloud", effort: "High", category: "Config" },
    { task: "Integrate with EHR system (Epic, Cerner, or other)", product: "Health Cloud", effort: "High", category: "Integration" },
    { task: "HIPAA compliance testing and security review", product: "Health Cloud", effort: "High", category: "Testing" },
    { task: "Clinical staff and care manager platform training", product: "Health Cloud", effort: "High", category: "Training" },
  ],
  financial_services_cloud: [
    { task: "Document regulatory requirements and compliance constraints", product: "Financial Services Cloud", effort: "High", category: "Discovery" },
    { task: "Configure household and relationship data model", product: "Financial Services Cloud", effort: "High", category: "Config" },
    { task: "Set up financial account and policy management", product: "Financial Services Cloud", effort: "High", category: "Config" },
    { task: "Integrate with core banking or policy admin system", product: "Financial Services Cloud", effort: "High", category: "Integration" },
    { task: "Compliance and regulatory UAT testing", product: "Financial Services Cloud", effort: "High", category: "Testing" },
    { task: "Advisor and relationship manager platform training", product: "Financial Services Cloud", effort: "Medium", category: "Training" },
  ],
  nonprofit_cloud: [
    { task: "Map constituent, donor, and program data to NPSP objects", product: "Nonprofit Cloud", effort: "Medium", category: "Discovery" },
    { task: "Configure NPSP Households and donation management", product: "Nonprofit Cloud", effort: "Medium", category: "Config" },
    { task: "Set up grant lifecycle management workflows", product: "Nonprofit Cloud", effort: "Medium", category: "Config" },
    { task: "Migrate existing donor database into Salesforce", product: "Nonprofit Cloud", effort: "High", category: "Integration" },
    { task: "Test donation processing and acknowledgement emails", product: "Nonprofit Cloud", effort: "Medium", category: "Testing" },
    { task: "Staff training on NPSP and Nonprofit Cloud features", product: "Nonprofit Cloud", effort: "Medium", category: "Training" },
  ],
  manufacturing_cloud: [
    { task: "Document sales agreements, rebate structures, and dealer relationships", product: "Manufacturing Cloud", effort: "High", category: "Discovery" },
    { task: "Configure sales agreement templates and account forecasting", product: "Manufacturing Cloud", effort: "High", category: "Config" },
    { task: "Set up rebate management and accrual calculations", product: "Manufacturing Cloud", effort: "High", category: "Config" },
    { task: "Integrate with ERP for order and inventory data", product: "Manufacturing Cloud", effort: "High", category: "Integration" },
    { task: "UAT testing with sales and operations teams", product: "Manufacturing Cloud", effort: "Medium", category: "Testing" },
    { task: "Sales and operations team platform training", product: "Manufacturing Cloud", effort: "Medium", category: "Training" },
  ],
  education_cloud: [
    { task: "Map student lifecycle stages and engagement touchpoints", product: "Education Cloud", effort: "Medium", category: "Discovery" },
    { task: "Configure Student 360 data model and program affiliation", product: "Education Cloud", effort: "High", category: "Config" },
    { task: "Set up advisor and student success workflows", product: "Education Cloud", effort: "Medium", category: "Config" },
    { task: "Integrate with SIS (Banner, Ellucian, or other) and LMS", product: "Education Cloud", effort: "High", category: "Integration" },
    { task: "Test student journey from inquiry through enrollment", product: "Education Cloud", effort: "Medium", category: "Testing" },
    { task: "Advisor, recruiter, and admin staff training", product: "Education Cloud", effort: "Medium", category: "Training" },
  ],
};

const PHASE_MAPPING: { phase: string; categories: ChecklistCategory[] }[] = [
  { phase: "Phase 1 — Discovery & Architecture", categories: ["Discovery"] },
  { phase: "Phase 2 — Configuration & Build", categories: ["Config"] },
  { phase: "Phase 3 — Integrations & Data Migration", categories: ["Integration"] },
  { phase: "Phase 4 — Testing & UAT", categories: ["Testing"] },
  { phase: "Phase 5 — Training & Go-Live", categories: ["Training"] },
];

export function generateChecklist(products: ProductDecision[]): ChecklistPhase[] {
  const activeProducts = products.filter(
    (p) => p.level === "recommended" || p.level === "optional"
  );

  const allItems: ChecklistItem[] = [];

  // Universal tasks always included
  const universalItems: ChecklistItem[] = [
    { task: "Kick-off meeting and project charter sign-off", product: "Project Management", effort: "Low", category: "Discovery" },
    { task: "Document business requirements (BRD)", product: "Project Management", effort: "High", category: "Discovery" },
    { task: "Define change management and user adoption plan", product: "Project Management", effort: "Medium", category: "Discovery" },
    { task: "Configure Salesforce org settings, profiles, and permission sets", product: "Salesforce Org", effort: "Medium", category: "Config" },
    { task: "Set up sandbox environments (Dev, QA, UAT)", product: "Salesforce Org", effort: "Low", category: "Config" },
    { task: "Data cleansing, deduplication, and migration mapping", product: "Data Migration", effort: "High", category: "Integration" },
    { task: "System integration testing (SIT) across all components", product: "All Products", effort: "High", category: "Testing" },
    { task: "User acceptance testing (UAT) sign-off", product: "All Products", effort: "High", category: "Testing" },
    { task: "Salesforce administrator training", product: "All Products", effort: "Medium", category: "Training" },
    { task: "Go-live hypercare support plan (2 weeks post-launch)", product: "All Products", effort: "Medium", category: "Training" },
  ];

  allItems.push(...universalItems);

  for (const product of activeProducts) {
    const tasks = PRODUCT_TASKS[product.key];
    if (tasks) allItems.push(...tasks);
  }

  return PHASE_MAPPING.map(({ phase, categories }) => ({
    phase,
    items: allItems.filter((item) => categories.includes(item.category)),
  })).filter((p) => p.items.length > 0);
}
