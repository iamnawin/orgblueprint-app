import { ProductDecision } from "@orgblueprint/core";

export interface AutomationItem {
  name: string;
  technology: string;
  description: string;
  trigger: string;
}

export interface IntegrationItem {
  name: string;
  method: string;
  description: string;
  direction: "inbound" | "outbound" | "bidirectional";
}

export interface TechnicalBlueprint {
  automations: AutomationItem[];
  integrations: IntegrationItem[];
  codeExample: {
    title: string;
    language: string;
    code: string;
  } | null;
  architectureNotes: string[];
}

export function generateTechnicalBlueprint(products: ProductDecision[]): TechnicalBlueprint {
  const keys = new Set(products.filter((p) => p.level !== "not_needed").map((p) => p.key));

  const automations: AutomationItem[] = [];
  const integrations: IntegrationItem[] = [];
  const architectureNotes: string[] = [];

  if (keys.has("sales_cloud")) {
    automations.push({
      name: "Lead Assignment",
      technology: "Record-Triggered Flow",
      description: "Assigns new leads to the correct sales rep based on territory or round-robin rules",
      trigger: "Lead Created",
    });
    automations.push({
      name: "Opportunity Stage Alerts",
      technology: "Flow + Email Action",
      description: "Notifies managers when deals reach key milestones or stagnate beyond 14 days",
      trigger: "Opportunity Updated",
    });
    automations.push({
      name: "Close Date Validation",
      technology: "Validation Rule",
      description: "Prevents past close dates on open opportunities — enforces data quality",
      trigger: "Before Save",
    });
    integrations.push({
      name: "Website Lead Capture",
      method: "Web-to-Lead",
      description: "Native Salesforce feature that captures website form submissions as Leads automatically",
      direction: "inbound",
    });
  }

  if (keys.has("service_cloud")) {
    automations.push({
      name: "Case Escalation",
      technology: "Entitlement + Escalation Rules",
      description: "Auto-escalates cases that breach SLA time thresholds to senior agents or managers",
      trigger: "SLA Milestone Breach",
    });
    automations.push({
      name: "Omni-Channel Case Routing",
      technology: "Omni-Channel + Skills-Based Routing",
      description: "Routes incoming cases to the best available agent based on skill, capacity, and priority",
      trigger: "Case Created / Reopened",
    });
    automations.push({
      name: "CSAT Survey",
      technology: "Flow + Survey",
      description: "Sends satisfaction survey automatically when a case is closed",
      trigger: "Case Closed",
    });
    integrations.push({
      name: "Support Email",
      method: "Email-to-Case",
      description: "Converts inbound support emails into Cases, preserving threading and attachments",
      direction: "inbound",
    });
  }

  if (keys.has("experience_cloud")) {
    automations.push({
      name: "Portal User Provisioning",
      technology: "Record-Triggered Flow",
      description: "Creates community user accounts when a Contact is marked as portal-eligible",
      trigger: "Contact Updated",
    });
    integrations.push({
      name: "Portal SSO",
      method: "SAML 2.0 / OAuth 2.0",
      description: "Single sign-on for Experience Cloud users via your existing identity provider",
      direction: "inbound",
    });
  }

  if (keys.has("field_service")) {
    automations.push({
      name: "Work Order Auto-Creation",
      technology: "Record-Triggered Flow",
      description: "Creates Work Orders automatically when high-priority Cases require onsite service",
      trigger: "Case Updated",
    });
    automations.push({
      name: "Technician Dispatch",
      technology: "Dispatcher Console + Scheduling Policy",
      description: "Optimises technician scheduling based on location, skills, and real-time availability",
      trigger: "Work Order Created",
    });
  }

  if (keys.has("cpq_revenue")) {
    automations.push({
      name: "Quote Approval Workflow",
      technology: "CPQ Approval Rules",
      description: "Routes quotes for multi-level approval when discounts exceed configured thresholds",
      trigger: "Quote Submitted for Approval",
    });
    automations.push({
      name: "Order Activation",
      technology: "CPQ Order Management Flow",
      description: "Automatically provisions subscriptions and notifies fulfilment when a quote is approved",
      trigger: "Quote Approved",
    });
  }

  if (keys.has("marketing_cloud")) {
    automations.push({
      name: "Welcome Journey",
      technology: "Journey Builder",
      description: "Multi-step onboarding email journey triggered when a new contact is created",
      trigger: "Contact Data Extension Insert",
    });
    automations.push({
      name: "Abandoned Cart Recovery",
      technology: "Journey Builder + Triggered Send",
      description: "Sends personalised re-engagement email series when a cart is abandoned",
      trigger: "Commerce Event",
    });
  }

  if (keys.has("pardot")) {
    automations.push({
      name: "Lead Scoring & Grading",
      technology: "Marketing Cloud Account Engagement Rules",
      description: "Scores prospects based on engagement activity and grades based on firmographic fit criteria",
      trigger: "Prospect Activity",
    });
    integrations.push({
      name: "Pardot ↔ Salesforce Sync",
      method: "Native Connector (v3 API)",
      description: "Bi-directional sync of leads, contacts, and campaign influence data",
      direction: "bidirectional",
    });
  }

  if (keys.has("mulesoft")) {
    integrations.push({
      name: "ERP Integration",
      method: "MuleSoft API-led Connectivity",
      description: "Three-layer architecture: System API (ERP adapter), Process API (transformation), Experience API (Salesforce-ready payloads)",
      direction: "bidirectional",
    });
    architectureNotes.push("Use MuleSoft Anypoint Platform to avoid point-to-point integration debt across all enterprise systems");
    architectureNotes.push("Define Named Credentials and External Credentials in Salesforce Setup for all outbound API calls");
  } else {
    integrations.push({
      name: "External System Sync",
      method: "Salesforce REST API + Connected App",
      description: "OAuth 2.0 Connected App for secure bi-directional data exchange with external systems",
      direction: "bidirectional",
    });
  }

  if (keys.has("data_cloud")) {
    integrations.push({
      name: "Data Ingestion Streams",
      method: "Data Cloud Data Streams",
      description: "Real-time ingestion from web, mobile, ERP, and marketing systems into unified customer profiles",
      direction: "inbound",
    });
    architectureNotes.push("Use Data Cloud Calculated Insights for real-time segmentation instead of batch SOQL reports");
    architectureNotes.push("Harmonise data using the Data Cloud Data Model — map source objects to standard Person, Account, and Engagement entities");
  }

  if (keys.has("salesforce_shield")) {
    architectureNotes.push("Enable Platform Encryption for sensitive fields (SSN, DOB, financial data) using Shield Key Management Service");
    architectureNotes.push("Configure Event Monitoring to audit login activity, report exports, and API calls — retain logs for 90+ days");
  }

  // General architecture notes
  architectureNotes.push("Prefer Record-Triggered Flows over Apex for standard automation — lower maintenance, built-in governor limit handling");
  architectureNotes.push("Use Named Credentials for all outbound HTTP callouts — never hardcode endpoint URLs or tokens");
  if (keys.size >= 3) {
    architectureNotes.push("Use Platform Events for decoupled cross-cloud communication — avoids tight coupling between automation layers");
  }
  architectureNotes.push("Follow the Config-First principle: exhaustively explore declarative options before writing Apex");

  // Code example
  let codeExample: TechnicalBlueprint["codeExample"] = null;

  if (keys.has("mulesoft") || integrations.some((i) => i.name.includes("ERP"))) {
    codeExample = {
      title: "Queueable Apex — Async ERP Sync",
      language: "apex",
      code: `public class ERPSyncQueueable implements Queueable, Database.AllowsCallouts {
    private List<Id> recordIds;

    public ERPSyncQueueable(List<Id> ids) {
        this.recordIds = ids;
    }

    public void execute(QueueableContext ctx) {
        List<Account> accounts = [
            SELECT Id, Name, ERP_Customer_ID__c
            FROM Account
            WHERE Id IN :recordIds
        ];

        HttpRequest req = new HttpRequest();
        req.setEndpoint('callout:ERP_System/api/customers');
        req.setMethod('POST');
        req.setHeader('Content-Type', 'application/json');
        req.setBody(JSON.serialize(accounts));

        HttpResponse res = new Http().send(req);
        if (res.getStatusCode() != 200) {
            // Log error to custom monitoring object
            insert new ERP_Sync_Log__c(
                Status__c = 'Error',
                Message__c = res.getBody(),
                Record_Ids__c = String.join(recordIds, ',')
            );
        }
    }
}`,
    };
  } else if (keys.has("service_cloud")) {
    codeExample = {
      title: "Platform Event — Case SLA Breach Notification",
      language: "apex",
      code: `// Trigger: publish a Platform Event when a Case is escalated
trigger CaseTrigger on Case (after update) {
    List<Case_SLA_Event__e> events = new List<Case_SLA_Event__e>();

    for (Case c : Trigger.new) {
        Case oldCase = Trigger.oldMap.get(c.Id);
        // Fire event when escalation status changes
        if (c.IsEscalated && !oldCase.IsEscalated) {
            events.add(new Case_SLA_Event__e(
                Case_Id__c    = c.Id,
                Case_Number__c = c.CaseNumber,
                Subject__c    = c.Subject,
                Breach_Time__c = DateTime.now()
            ));
        }
    }

    if (!events.isEmpty()) {
        EventBus.publish(events);
    }
}`,
    };
  } else if (keys.has("sales_cloud")) {
    codeExample = {
      title: "Record-Triggered Flow — Lead Round-Robin Assignment",
      language: "apex",
      code: `// Invocable Apex called from a Record-Triggered Flow
// Assigns the lead to the next rep in a round-robin queue
public class LeadRoundRobin {
    @InvocableMethod(label='Assign Lead Round Robin'
                     description='Assigns lead to next rep in rotation')
    public static List<Id> assign(List<Id> leadIds) {
        List<Id> repQueue = getRoundRobinQueue();
        List<Lead> leads = [SELECT Id FROM Lead WHERE Id IN :leadIds];
        List<Id> assignedReps = new List<Id>();

        Integer idx = getRoundRobinIndex();
        for (Lead l : leads) {
            l.OwnerId = repQueue[Math.mod(idx, repQueue.size())];
            assignedReps.add(l.OwnerId);
            idx++;
        }
        update leads;
        saveRoundRobinIndex(idx);
        return assignedReps;
    }

    // Implementation: store index in Custom Setting
    private static Integer getRoundRobinIndex() { /* ... */ return 0; }
    private static List<Id> getRoundRobinQueue() { /* ... */ return new List<Id>(); }
    private static void saveRoundRobinIndex(Integer i) { /* ... */ }
}`,
    };
  }

  return { automations, integrations, codeExample, architectureNotes };
}
