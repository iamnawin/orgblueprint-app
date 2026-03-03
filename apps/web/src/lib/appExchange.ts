import { ProductKey } from "@orgblueprint/core";

export interface AppExchangeApp {
  name: string;
  category: string;
  description: string;
  publisher: string;
  rating: number;
  pricingNote: string;
}

export const APPEXCHANGE_APPS: Partial<Record<ProductKey, AppExchangeApp[]>> = {
  sales_cloud: [
    {
      name: "Conga Composer",
      category: "Document Generation",
      description:
        "Generate professional quotes, contracts, and proposals directly from Salesforce records. One of the most widely deployed document automation apps on AppExchange.",
      publisher: "Conga",
      rating: 4.6,
      pricingNote: "Paid — starts ~$25/user/month",
    },
    {
      name: "Dooly",
      category: "Sales Productivity",
      description:
        "Auto-sync notes and fields from calls directly to Salesforce. Reduces CRM data entry time by up to 70% for sales reps.",
      publisher: "Dooly",
      rating: 4.7,
      pricingNote: "Freemium — paid plans available",
    },
    {
      name: "Clari",
      category: "Revenue Operations",
      description:
        "AI-powered revenue platform for forecasting accuracy. Replaces manual forecast calls with data-driven insights from all revenue signals.",
      publisher: "Clari",
      rating: 4.5,
      pricingNote: "Paid — enterprise pricing",
    },
    {
      name: "OwnBackup (Own Data)",
      category: "Backup & Recovery",
      description:
        "Enterprise backup, recovery, and archiving for Salesforce. Automatic daily backups with granular restore to any point in time.",
      publisher: "Own (formerly OwnBackup)",
      rating: 4.8,
      pricingNote: "Paid — starts ~$3/user/month",
    },
  ],

  service_cloud: [
    {
      name: "Aircall",
      category: "CTI / Telephony",
      description:
        "Cloud phone system natively integrated with Salesforce. Auto-logs calls and shows screen pops with full customer context.",
      publisher: "Aircall",
      rating: 4.3,
      pricingNote: "Paid — starts ~$30/user/month",
    },
    {
      name: "Talkdesk for Salesforce",
      category: "Contact Center",
      description:
        "Enterprise contact center platform deeply integrated with Service Cloud. AI-powered agent assist, sentiment analysis, and workforce management.",
      publisher: "Talkdesk",
      rating: 4.4,
      pricingNote: "Paid — enterprise pricing",
    },
    {
      name: "Vonage Contact Center",
      category: "CTI / Telephony",
      description:
        "Cloud contact center that embeds natively inside Salesforce. Intelligent routing, real-time coaching, and built-in analytics.",
      publisher: "Vonage",
      rating: 4.2,
      pricingNote: "Paid — pricing on request",
    },
  ],

  cpq_revenue: [
    {
      name: "DocuSign eSignature",
      category: "eSignature",
      description:
        "The market-leading eSignature solution, natively integrated with Salesforce CPQ. Send quotes for signature directly from opportunity records.",
      publisher: "DocuSign",
      rating: 4.7,
      pricingNote: "Paid — starts ~$10/user/month",
    },
    {
      name: "Conga CPQ",
      category: "CPQ Enhancement",
      description:
        "Advanced configure-price-quote capabilities layered on Salesforce. Complex pricing rules, guided selling, and multi-language proposal generation.",
      publisher: "Conga",
      rating: 4.2,
      pricingNote: "Paid — enterprise pricing",
    },
    {
      name: "Nintex DocGen",
      category: "Document Automation",
      description:
        "Generate contracts and agreements automatically from Salesforce data. Deeply integrated with Salesforce CPQ for quote-to-contract workflows.",
      publisher: "Nintex",
      rating: 4.3,
      pricingNote: "Paid — pricing on request",
    },
  ],

  field_service: [
    {
      name: "Salesforce Maps",
      category: "Territory & Route Optimization",
      description:
        "Salesforce's native mapping solution for route optimization, territory alignment, and field activity visualization directly inside Salesforce.",
      publisher: "Salesforce",
      rating: 4.3,
      pricingNote: "Paid add-on to Field Service",
    },
    {
      name: "Geopointe",
      category: "Geolocation & Mapping",
      description:
        "Map and visualize Salesforce data geographically to optimize technician routes and territory planning across any record type.",
      publisher: "Geopointe",
      rating: 4.6,
      pricingNote: "Paid — starts ~$15/user/month",
    },
  ],

  marketing_cloud: [
    {
      name: "Litmus",
      category: "Email Testing & Analytics",
      description:
        "Test and preview emails across 90+ email clients before sending. Provides spam filter analysis, inbox placement, and detailed engagement analytics.",
      publisher: "Litmus",
      rating: 4.5,
      pricingNote: "Paid — starts ~$99/month",
    },
    {
      name: "Validity DemandTools",
      category: "Data Quality",
      description:
        "Clean, deduplicate, and standardize your Marketing Cloud subscriber lists to improve deliverability and engagement rates.",
      publisher: "Validity",
      rating: 4.4,
      pricingNote: "Paid — pricing on request",
    },
  ],

  pardot: [
    {
      name: "LinkedIn Lead Gen Forms for Pardot",
      category: "Lead Generation",
      description:
        "Sync LinkedIn Lead Gen Form submissions directly into Pardot for instant B2B lead capture from LinkedIn campaigns.",
      publisher: "LinkedIn",
      rating: 4.4,
      pricingNote: "Requires LinkedIn Campaign Manager subscription",
    },
    {
      name: "Terminus ABM Platform",
      category: "Account-Based Marketing",
      description:
        "Run full-funnel ABM campaigns across display, LinkedIn, and email, synced with Pardot and Salesforce for attribution.",
      publisher: "Terminus",
      rating: 4.1,
      pricingNote: "Paid — enterprise pricing",
    },
  ],

  data_cloud: [
    {
      name: "OwnBackup (Own Data)",
      category: "Backup & Recovery",
      description:
        "Enterprise-grade backup and archiving for all Salesforce products including Data Cloud. Automatic daily backups with granular point-in-time restore.",
      publisher: "Own (formerly OwnBackup)",
      rating: 4.8,
      pricingNote: "Paid — starts ~$3/user/month",
    },
  ],

  mulesoft: [
    {
      name: "MuleSoft Accelerators",
      category: "Pre-built Integration Templates",
      description:
        "Pre-built integration templates for Salesforce, SAP, Workday, ServiceNow, and more — dramatically reducing MuleSoft implementation time.",
      publisher: "Salesforce / MuleSoft",
      rating: 4.5,
      pricingNote: "Included with MuleSoft — configuration required",
    },
  ],

  tableau_analytics: [
    {
      name: "Tableau Accelerators",
      category: "Pre-built Dashboard Templates",
      description:
        "Pre-built Tableau dashboards for Sales Cloud, Service Cloud, and Marketing Cloud. Get analytics live in hours instead of weeks.",
      publisher: "Salesforce",
      rating: 4.4,
      pricingNote: "Included with Tableau — customization needed",
    },
  ],

  slack_collab: [
    {
      name: "Salesforce for Slack",
      category: "CRM Integration",
      description:
        "Native Salesforce app for Slack — search and share CRM records, create records, and receive deal and case notifications in Slack channels.",
      publisher: "Salesforce",
      rating: 4.5,
      pricingNote: "Included with Salesforce + Slack licenses",
    },
  ],

  salesforce_shield: [
    {
      name: "Compliance Quest",
      category: "Quality & Compliance",
      description:
        "Full EQMS and compliance management solution on Salesforce. Works alongside Shield for regulated manufacturing and pharma companies.",
      publisher: "Compliance Quest",
      rating: 4.3,
      pricingNote: "Paid — pricing on request",
    },
  ],

  health_cloud: [
    {
      name: "Apptera Care Plans",
      category: "Care Management",
      description:
        "Pre-built care plan templates and clinical workflow accelerators for Health Cloud. Reduces Health Cloud configuration time significantly.",
      publisher: "Apptera",
      rating: 4.3,
      pricingNote: "Paid — pricing on request",
    },
    {
      name: "PatientSafe Solutions",
      category: "Patient Engagement",
      description:
        "Secure clinical communication platform integrated with Health Cloud for care team collaboration and patient engagement.",
      publisher: "PatientSafe Solutions",
      rating: 4.2,
      pricingNote: "Paid — pricing on request",
    },
  ],

  nonprofit_cloud: [
    {
      name: "Nonprofit Success Pack (NPSP)",
      category: "Nonprofit Foundation Layer",
      description:
        "The standard data model and feature set for nonprofits on Salesforce. Free from Salesforce.org for qualifying nonprofits.",
      publisher: "Salesforce.org",
      rating: 4.7,
      pricingNote: "Free for qualifying 501(c)(3) nonprofits",
    },
    {
      name: "FormAssembly",
      category: "Forms & Data Collection",
      description:
        "Build donation forms, volunteer intake, and event registration forms that sync data directly into Salesforce.",
      publisher: "FormAssembly",
      rating: 4.6,
      pricingNote: "Paid — starts ~$83/month",
    },
    {
      name: "Fundraise Up",
      category: "Online Fundraising",
      description:
        "AI-powered online donation platform that integrates with Salesforce Nonprofit Cloud. Increases average gift size through intelligent upsell suggestions.",
      publisher: "Fundraise Up",
      rating: 4.5,
      pricingNote: "Platform fee + transaction fee model",
    },
  ],

  manufacturing_cloud: [
    {
      name: "Rootstock Manufacturing ERP",
      category: "ERP Integration",
      description:
        "Cloud ERP for manufacturers built natively on Salesforce. Deep integration with Manufacturing Cloud for unified sales and operations.",
      publisher: "Rootstock Software",
      rating: 4.4,
      pricingNote: "Paid — enterprise pricing",
    },
  ],

  commerce_cloud: [
    {
      name: "Stripe for Salesforce Commerce",
      category: "Payment Processing",
      description:
        "Connect Stripe payments directly to Salesforce Commerce Cloud. Supports global payments, subscriptions, and fraud prevention.",
      publisher: "Stripe",
      rating: 4.6,
      pricingNote: "Transaction-based pricing",
    },
    {
      name: "Yotpo Reviews & Loyalty",
      category: "Reviews & UGC",
      description:
        "Collect and display customer reviews, photos, and Q&A on your Commerce Cloud storefront to boost conversion rates.",
      publisher: "Yotpo",
      rating: 4.4,
      pricingNote: "Freemium — paid plans available",
    },
  ],

  loyalty_management: [
    {
      name: "Antavo Loyalty Programs",
      category: "Loyalty Enhancement",
      description:
        "Enterprise loyalty technology that extends Salesforce Loyalty Management with gamification, tiering, and partner integrations.",
      publisher: "Antavo",
      rating: 4.3,
      pricingNote: "Paid — enterprise pricing",
    },
  ],
};
