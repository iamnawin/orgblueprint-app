import { ClarifyingQuestion, RequirementAnalysis } from "../types";

const processQuestions: Record<string, string[]> = {
  sales_pipeline: ["How many stages are in your sales process?", "Do you need CPQ or configured quote pricing?", "What are your lead sources?", "Do you need partner or channel sales?", "Who owns forecast review?"],
  case_management: ["What are your SLA targets by priority?", "Do you need omni-channel routing?", "Is there a knowledge base today?", "How are escalations handled?", "What channels create cases?"],
  field_service_execution: ["How many field technicians need mobile access?", "Is scheduling manual or optimized automatically?", "Do technicians need offline access?", "What information closes a work order?", "Are assets or warranties part of service delivery?"],
  portal_self_service: ["Who are the portal users?", "How many external users are expected?", "Is SSO required?", "What records should customers see?", "Do you need knowledge article deflection?"],
  retail_execution: ["How often do field reps visit stores?", "Do visits need offline access?", "What compliance scoring rules matter?", "Are planograms captured as photos or checklist items?", "Who reviews store gaps?"],
  employee_request: ["Which request types are in MVP?", "Who approves each request type?", "Do employees need mobile access?", "What SLA applies to internal requests?", "Would this workflow ever need external access?"],
};

export function buildClarifyingQuestions(analysis: RequirementAnalysis): ClarifyingQuestion[] {
  const questions = processQuestions[analysis.primaryProcess] ?? [
    "Which teams will use this workflow?",
    "What statuses define the process lifecycle?",
    "Who approves exceptions?",
    "Which data must be reported to leaders?",
    "Would external users ever need access?",
  ];

  const targeted = [...questions];
  if (analysis.missingInfo.includes("no_users_mentioned")) targeted.push("How many users need access in the first release?");
  if (analysis.missingInfo.includes("no_integrations_mentioned")) targeted.push("Which external systems must Salesforce integrate with?");

  return targeted.slice(0, Math.max(5, Math.min(targeted.length, 7))).map((question, index) => ({
    id: `q-${index + 1}`,
    question,
    why: "This changes product fit, license assumptions, implementation scope, or delivery risk.",
    category: question.toLowerCase().includes("integrat") || question.toLowerCase().includes("systems") ? "integration" : question.toLowerCase().includes("users") || question.toLowerCase().includes("technicians") ? "users" : "process",
  }));
}
