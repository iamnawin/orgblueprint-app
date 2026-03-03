import { ProductKey } from "@orgblueprint/core";

export interface ProductDetail {
  tagline: string;
  description: string;
  keyFeatures: string[];
  bestFor: string[];
  implementationWeeks: { min: number; max: number };
  certifications: string[];
  relatedProducts: ProductKey[];
}

export const PRODUCT_DETAILS: Partial<Record<ProductKey, ProductDetail>> = {
  sales_cloud: {
    tagline: "The world's #1 CRM for sales teams",
    description:
      "Sales Cloud is Salesforce's flagship CRM product, helping sales teams manage leads, opportunities, accounts, and forecasting. It provides a complete 360° view of every customer and streamlines the entire sales process from lead to close.",
    keyFeatures: [
      "Lead and opportunity management",
      "Sales forecasting and pipeline visibility",
      "Email integration (Outlook / Gmail)",
      "Mobile app for reps in the field",
      "Einstein Activity Capture (auto-log emails)",
      "Territory and quota management",
      "Collaborative forecasting",
    ],
    bestFor: [
      "B2B sales organizations",
      "Inside sales and field sales teams",
      "Companies with complex, multi-stage sales cycles",
      "Teams needing pipeline visibility and forecasting",
    ],
    implementationWeeks: { min: 6, max: 16 },
    certifications: ["Sales Cloud Consultant", "Salesforce Administrator"],
    relatedProducts: ["service_cloud", "pardot", "cpq_revenue"],
  },

  service_cloud: {
    tagline: "Deliver smarter service across every channel",
    description:
      "Service Cloud is Salesforce's customer service platform enabling support teams to manage cases, deliver omni-channel support, and resolve issues faster with AI-powered tools and a unified agent workspace.",
    keyFeatures: [
      "Case management and intelligent routing",
      "Omni-channel support (email, phone, chat, social)",
      "Knowledge base management",
      "Live Agent chat and chatbots",
      "Customer self-service portal",
      "Service analytics and SLA tracking",
      "Einstein Case Classification",
    ],
    bestFor: [
      "Customer support and contact center teams",
      "Businesses with high case volumes",
      "Companies needing omni-channel support",
      "Organizations with complex escalation workflows",
    ],
    implementationWeeks: { min: 8, max: 20 },
    certifications: ["Service Cloud Consultant", "Salesforce Administrator"],
    relatedProducts: ["experience_cloud", "field_service", "slack_collab"],
  },

  experience_cloud: {
    tagline: "Build digital experiences for customers, partners, and employees",
    description:
      "Experience Cloud (formerly Community Cloud) enables you to build branded digital experiences — customer portals, partner portals, employee intranets — all connected to your Salesforce data in real time.",
    keyFeatures: [
      "Pre-built portal and community templates",
      "Customer self-service community",
      "Partner relationship management portal",
      "Employee help desk and intranet",
      "Integrated knowledge base",
      "Custom branding and design builder",
      "Mobile-responsive out of the box",
    ],
    bestFor: [
      "Companies needing customer self-service portals",
      "Businesses with partner or dealer channels",
      "Organizations building employee intranets",
      "High-volume support deflection programs",
    ],
    implementationWeeks: { min: 8, max: 16 },
    certifications: ["Experience Cloud Consultant"],
    relatedProducts: ["service_cloud", "sales_cloud"],
  },

  cpq_revenue: {
    tagline: "Configure, price, quote — and close faster",
    description:
      "CPQ & Revenue Cloud automates the complex quoting process for businesses selling configurable products or subscription services. It enforces pricing rules, streamlines discount approvals, and manages the full contract lifecycle.",
    keyFeatures: [
      "Product configurator with rules engine",
      "Automated pricing and discount logic",
      "Professional quote generation and templates",
      "Approval workflows for discounts",
      "Contract lifecycle management",
      "Renewal and amendment management",
      "Revenue recognition",
    ],
    bestFor: [
      "Companies with complex product configurations",
      "Businesses with tiered or negotiated pricing",
      "Organizations with approval-heavy quoting",
      "SaaS and subscription businesses",
    ],
    implementationWeeks: { min: 12, max: 24 },
    certifications: ["CPQ Specialist"],
    relatedProducts: ["sales_cloud", "commerce_cloud"],
  },

  field_service: {
    tagline: "Intelligent field service on any device",
    description:
      "Field Service helps companies dispatch technicians, manage work orders, and optimize their mobile workforce with AI-powered scheduling, asset tracking, and a powerful mobile app for technicians.",
    keyFeatures: [
      "AI-powered scheduling optimization",
      "Work order management and SLA tracking",
      "Technician mobile app (iOS & Android)",
      "Asset and equipment tracking",
      "Parts and inventory management",
      "Customer appointment booking portal",
      "Real-time dispatcher console",
    ],
    bestFor: [
      "Field service and installation companies",
      "Utilities and energy providers",
      "Healthcare equipment maintenance",
      "Manufacturing after-sales service",
    ],
    implementationWeeks: { min: 10, max: 20 },
    certifications: ["Field Service Consultant"],
    relatedProducts: ["service_cloud", "experience_cloud"],
  },

  marketing_cloud: {
    tagline: "Reach every customer, everywhere — at scale",
    description:
      "Marketing Cloud is Salesforce's B2C marketing automation platform for enterprise brands. It delivers personalized customer journeys across email, mobile, social, and advertising channels at massive scale.",
    keyFeatures: [
      "Journey Builder — visual automation designer",
      "Email Studio for campaign management",
      "Mobile Studio for push/SMS",
      "Social Studio for social engagement",
      "Advertising Studio (paid media activation)",
      "Data extensions and audience segmentation",
      "Einstein AI personalization",
    ],
    bestFor: [
      "B2C enterprise brands",
      "Retail and e-commerce companies",
      "Media and publishing organizations",
      "Companies with large customer databases (100K+)",
    ],
    implementationWeeks: { min: 10, max: 20 },
    certifications: ["Marketing Cloud Email Specialist", "Marketing Cloud Consultant"],
    relatedProducts: ["commerce_cloud", "data_cloud", "loyalty_management"],
  },

  pardot: {
    tagline: "B2B marketing automation that aligns sales and marketing",
    description:
      "Marketing Cloud Account Engagement (Pardot) is Salesforce's B2B marketing automation tool. It aligns marketing and sales to drive more qualified pipeline through lead scoring, nurture programs, and ROI attribution.",
    keyFeatures: [
      "Lead scoring and behavioral grading",
      "Email nurture campaign automation",
      "Landing pages and form builder",
      "CRM-connected campaign management",
      "Engagement Studio automation canvas",
      "B2B marketing analytics and attribution",
      "Native Salesforce sync",
    ],
    bestFor: [
      "B2B companies with longer sales cycles",
      "Marketing teams focused on lead quality over volume",
      "Account-based marketing (ABM) programs",
      "Organizations already on Sales Cloud",
    ],
    implementationWeeks: { min: 6, max: 12 },
    certifications: ["Marketing Cloud Account Engagement Specialist"],
    relatedProducts: ["sales_cloud", "data_cloud"],
  },

  data_cloud: {
    tagline: "Unify all your customer data in real time",
    description:
      "Data Cloud is Salesforce's real-time customer data platform (CDP) that harmonizes data from any source into unified customer profiles, enabling hyper-personalization and AI at scale across every Salesforce product.",
    keyFeatures: [
      "Real-time data ingestion from any source",
      "Identity resolution and unified profiles",
      "Audience builder and segmentation",
      "Data harmonization with a standard data model",
      "Activation to any channel or product",
      "AI predictions built on unified data",
      "Zero-copy data sharing",
    ],
    bestFor: [
      "Enterprise brands with fragmented data silos",
      "Companies with 2+ external systems to unify",
      "Single customer view initiatives",
      "Real-time personalization at scale",
    ],
    implementationWeeks: { min: 12, max: 24 },
    certifications: ["Data Cloud Consultant"],
    relatedProducts: ["marketing_cloud", "sales_cloud", "agentforce_einstein"],
  },

  agentforce_einstein: {
    tagline: "AI that actually works — built on your CRM data",
    description:
      "Agentforce and Einstein AI bring autonomous AI agents and predictive intelligence to every Salesforce product. From Einstein Copilot to autonomous agents that take action, AI is woven throughout the platform.",
    keyFeatures: [
      "Einstein Copilot — conversational AI assistant",
      "Agentforce autonomous agents",
      "Einstein lead and opportunity scoring",
      "Next best action recommendations",
      "Predictive case deflection",
      "Einstein Bots for service automation",
      "Custom AI models with custom predictions",
    ],
    bestFor: [
      "Companies wanting to automate repetitive tasks",
      "Teams needing AI-assisted decision making",
      "High-volume service desks seeking deflection",
      "Sales teams wanting AI coaching and suggestions",
    ],
    implementationWeeks: { min: 8, max: 16 },
    certifications: ["AI Associate", "AI Specialist"],
    relatedProducts: ["sales_cloud", "service_cloud", "data_cloud"],
  },

  tableau_analytics: {
    tagline: "Make smarter decisions with powerful analytics",
    description:
      "Tableau is Salesforce's enterprise analytics and BI platform. It connects to virtually any data source and lets teams build stunning, interactive dashboards that help the whole organization become data-driven.",
    keyFeatures: [
      "Drag-and-drop dashboard builder",
      "Connects to 100+ data sources",
      "Self-service analytics for business users",
      "Embedded analytics directly in Salesforce",
      "Mobile-ready analytics",
      "AI insights: Ask Data, Explain Data",
      "Tableau Prep for data preparation",
    ],
    bestFor: [
      "Data-driven organizations with complex reporting",
      "Teams needing cross-platform BI dashboards",
      "Executive KPI tracking and reporting",
      "Companies replacing legacy BI tools",
    ],
    implementationWeeks: { min: 6, max: 14 },
    certifications: ["Tableau Desktop Specialist", "Tableau Data Analyst"],
    relatedProducts: ["sales_cloud", "service_cloud", "data_cloud"],
  },

  mulesoft: {
    tagline: "Connect anything — integrate everything",
    description:
      "MuleSoft Anypoint Platform is Salesforce's integration and API management platform. It connects disparate systems, automates business processes, and unlocks data from any source to create connected experiences.",
    keyFeatures: [
      "API-led connectivity architecture",
      "200+ pre-built connectors",
      "Real-time and batch data integration",
      "API design and governance",
      "DataWeave transformation language",
      "CloudHub and on-premise deployment",
      "API analytics and monitoring",
    ],
    bestFor: [
      "Enterprises with complex system landscapes",
      "Companies with 3+ integration points",
      "Organizations needing centralized API management",
      "Large-scale digital transformation programs",
    ],
    implementationWeeks: { min: 12, max: 28 },
    certifications: ["MuleSoft Certified Developer", "MuleSoft Certified Integration Architect"],
    relatedProducts: ["data_cloud", "sales_cloud"],
  },

  slack_collab: {
    tagline: "Where work happens — powered by Salesforce",
    description:
      "Slack is Salesforce's team collaboration platform, enabling real-time messaging, file sharing, and workflow automation. Slack for Sales and Service brings CRM context directly into team conversations.",
    keyFeatures: [
      "Channels and direct messaging",
      "Salesforce Records in Slack (search, share, act)",
      "Deal Room automation for sales",
      "Slack Canvas for collaborative documents",
      "Workflow Builder automation",
      "Video huddles and async clips",
      "700+ app integrations",
    ],
    bestFor: [
      "Remote and distributed teams",
      "Sales teams needing deal collaboration",
      "Customer escalation management",
      "Organizations replacing email with async comms",
    ],
    implementationWeeks: { min: 4, max: 10 },
    certifications: ["Slack Administration Accredited"],
    relatedProducts: ["sales_cloud", "service_cloud"],
  },

  salesforce_shield: {
    tagline: "Enterprise-grade security, compliance, and governance",
    description:
      "Salesforce Shield is an add-on security suite that helps enterprises protect sensitive data, meet regulatory requirements, and demonstrate governance with full audit trails and encryption.",
    keyFeatures: [
      "Platform Encryption for data at rest",
      "Event Monitoring for user behavior audit",
      "Field Audit Trail — extended data history",
      "Transaction Security policies",
      "Hyperforce compliance (GDPR, HIPAA, CCPA)",
      "Real-time threat detection alerts",
    ],
    bestFor: [
      "Regulated industries (healthcare, financial services)",
      "Companies with data sovereignty requirements",
      "Organizations needing HIPAA / PCI / GDPR compliance",
      "Enterprises with strict audit and governance needs",
    ],
    implementationWeeks: { min: 4, max: 10 },
    certifications: ["Salesforce Shield Accredited"],
    relatedProducts: ["health_cloud", "financial_services_cloud"],
  },

  health_cloud: {
    tagline: "The CRM platform for connected health experiences",
    description:
      "Health Cloud is Salesforce's HIPAA-ready CRM platform built for healthcare providers, payers, and life sciences. It delivers a complete patient/member/HCP view with care plan management and EHR integration accelerators.",
    keyFeatures: [
      "360° patient and member profile",
      "Care plan and care team management",
      "Utilization management and prior authorization",
      "Provider relationship management",
      "Health timeline and care gap analysis",
      "EHR integration accelerators",
      "HIPAA-compliant by design",
    ],
    bestFor: [
      "Hospitals and health systems",
      "Health insurance payers",
      "Life sciences and pharma companies",
      "Care management organizations",
    ],
    implementationWeeks: { min: 14, max: 28 },
    certifications: ["Health Cloud Consultant"],
    relatedProducts: ["service_cloud", "salesforce_shield"],
  },

  financial_services_cloud: {
    tagline: "The leading CRM built for financial services",
    description:
      "Financial Services Cloud is purpose-built for banks, insurance companies, wealth management firms, and mortgage lenders — with relationship intelligence, household data models, and compliance tools built in.",
    keyFeatures: [
      "Household and relationship data model",
      "Financial accounts management",
      "Policy and claims management",
      "Mortgage loan origination",
      "Referral and lead management",
      "Regulatory compliance features",
      "Next Best Action for advisors",
    ],
    bestFor: [
      "Retail and commercial banks",
      "Wealth management and financial advisory firms",
      "Insurance carriers and agencies",
      "Mortgage and consumer lending companies",
    ],
    implementationWeeks: { min: 14, max: 28 },
    certifications: ["Financial Services Cloud Accredited"],
    relatedProducts: ["service_cloud", "salesforce_shield"],
  },

  nonprofit_cloud: {
    tagline: "CRM purpose-built for nonprofit impact",
    description:
      "Nonprofit Cloud provides a unified CRM for nonprofits including fundraising, program management, volunteer tracking, and grant management — all built on the Salesforce platform.",
    keyFeatures: [
      "Constituent (donor) relationship management",
      "Donation and gift processing",
      "Grant lifecycle management",
      "Program and service delivery tracking",
      "Volunteer management",
      "Marketing outreach for fundraising campaigns",
      "Nonprofit Success Pack (NPSP) included",
    ],
    bestFor: [
      "Nonprofits and charitable organizations",
      "Foundations and grant-making bodies",
      "Social enterprises",
      "Member associations and clubs",
    ],
    implementationWeeks: { min: 8, max: 16 },
    certifications: ["Nonprofit Cloud Consultant"],
    relatedProducts: ["marketing_cloud", "experience_cloud"],
  },

  manufacturing_cloud: {
    tagline: "Bring sales and operations together for manufacturers",
    description:
      "Manufacturing Cloud enables manufacturers to unify sales and operations data, manage run-rate business with sales agreements, forecast accurately, and collaborate with dealer and distribution networks.",
    keyFeatures: [
      "Sales agreements for run-rate business",
      "Account-based forecasting",
      "Rebate management",
      "Partner and dealer portal",
      "Field service integration",
      "Warranty management",
      "Connected product data",
    ],
    bestFor: [
      "Discrete and process manufacturers",
      "Companies with dealer / distribution networks",
      "Businesses with run-rate service contracts",
      "Industrial equipment companies",
    ],
    implementationWeeks: { min: 12, max: 24 },
    certifications: ["Manufacturing Cloud Accredited"],
    relatedProducts: ["sales_cloud", "field_service", "experience_cloud"],
  },

  education_cloud: {
    tagline: "Student success from first inquiry to lifelong alumni",
    description:
      "Education Cloud is designed for higher education and K-12, providing a unified student lifecycle view from recruitment and admissions through graduation and alumni engagement.",
    keyFeatures: [
      "Student 360 — complete student profile",
      "Recruitment and admissions management",
      "Student success and early alert monitoring",
      "Advisor and counselor tools",
      "Financial aid management",
      "Alumni and fundraising engagement",
      "SIS and ERP integration accelerators",
    ],
    bestFor: [
      "Colleges and universities",
      "K-12 school districts",
      "EdTech companies",
      "Online and continuing education providers",
    ],
    implementationWeeks: { min: 12, max: 20 },
    certifications: ["Education Cloud Accredited"],
    relatedProducts: ["experience_cloud", "marketing_cloud"],
  },

  commerce_cloud: {
    tagline: "The #1 commerce platform for digital storefronts",
    description:
      "Salesforce Commerce Cloud (B2C and B2B Commerce) enables businesses to build feature-rich digital storefronts, manage product catalogs, and deliver personalized shopping experiences connected to CRM data.",
    keyFeatures: [
      "Storefront builder (headless-ready)",
      "Product catalog and inventory management",
      "Einstein-powered personalized merchandising",
      "B2B commerce with complex pricing rules",
      "Seamless checkout and payments",
      "Order management system (OMS)",
      "Connected to Salesforce CRM and Service Cloud",
    ],
    bestFor: [
      "Retailers and consumer brands selling online",
      "B2B companies needing digital ordering portals",
      "Businesses replacing legacy e-commerce platforms",
      "Companies wanting CRM-connected commerce",
    ],
    implementationWeeks: { min: 12, max: 24 },
    certifications: ["B2C Commerce Architect", "B2B Commerce Administrator"],
    relatedProducts: ["marketing_cloud", "service_cloud", "cpq_revenue"],
  },

  loyalty_management: {
    tagline: "Drive customer loyalty with flexible rewards programs",
    description:
      "Loyalty Management enables businesses to design and operate complex loyalty programs — points, tiers, rewards — natively in Salesforce, connected to customer profiles and marketing automation.",
    keyFeatures: [
      "Configurable loyalty program designer",
      "Points, tiers, and rewards engine",
      "Member portal and mobile app integration",
      "Partner ecosystem and co-brand management",
      "Campaign management for loyalty promotions",
      "Real-time loyalty data in the CRM",
      "Journey Builder integration for loyalty emails",
    ],
    bestFor: [
      "Retail and hospitality brands",
      "Airlines and travel companies",
      "Financial services loyalty programs",
      "Any company with a high-frequency customer base",
    ],
    implementationWeeks: { min: 10, max: 18 },
    certifications: ["Loyalty Management Accredited"],
    relatedProducts: ["marketing_cloud", "commerce_cloud", "data_cloud"],
  },

  net_zero_cloud: {
    tagline: "Track, analyze, and reduce your carbon footprint",
    description:
      "Net Zero Cloud is Salesforce's sustainability management platform that helps companies track GHG emissions (Scope 1, 2, 3), manage ESG reporting, and plan their path to net zero.",
    keyFeatures: [
      "GHG emissions tracking (Scope 1, 2, 3)",
      "Automated carbon accounting",
      "Supplier sustainability data collection",
      "ESG reporting dashboards",
      "Science-based targets tracking",
      "Energy consumption management",
      "Audit-ready disclosure reports",
    ],
    bestFor: [
      "Enterprises with sustainability mandates",
      "Public companies needing SEC climate disclosures",
      "Supply chain sustainability programs",
      "Companies targeting net zero commitments",
    ],
    implementationWeeks: { min: 8, max: 16 },
    certifications: ["Net Zero Cloud Accredited"],
    relatedProducts: ["tableau_analytics", "mulesoft"],
  },
};
