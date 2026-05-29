# OrgBlueprint v2 Refactor Demo Guide

This guide is for demoing the v2 blueprint refactor without improvising the story.
It explains what changed, what to run, and which sample prompts best show the new
rules-engine intelligence.

## What Changed

OrgBlueprint now produces a richer `schemaVersion: "v2"` blueprint instead of relying
only on the older compatibility projections. The deterministic rules engine and LLM
generation path both speak v2, while the old projection fields remain in place for
screens and exports that still need them.

The v2 output now includes:

- Process analysis
- Business capabilities
- Salesforce recommendations
- Object model
- Automations
- Integrations
- Analytics
- Security
- AI readiness
- Risks and assumptions
- Roadmap
- User stories

The main dashboard, print view, share view, compare view, wizard review screen, and
PDF export all expose the v2 sections.

## Why v2 Exists

The earlier blueprint shape was useful for a product recommender, but it flattened
implementation intelligence into lists such as `objectsAndAutomations`,
`analyticsPack`, and `integrationMap`.

The v2 schema separates discovery and implementation reasoning into structured sections:

- `analysis` identifies the business process, personas, industry, missing information,
  and detected signals.
- `capabilities` translates raw business needs into business capabilities.
- `recommendations` explains Salesforce products against those capabilities.
- `objectModel`, `automations`, `integrations`, and `analytics` make the output feel
  like an implementation blueprint, not just a recommendation list.
- `security`, `aiReadiness`, `risks`, `assumptions`, and `userStories` make the plan
  easier to review with stakeholders.

## How Generation Works

Demo mode uses the deterministic rules engine:

```text
input -> analyzer -> capabilities -> recommender -> section builders -> BlueprintResult v2
```

The rules engine is deterministic TypeScript. It does not call an LLM, so the same input
produces stable output.

AI Enhanced mode uses the LLM path:

```text
input + clarifications -> v2 prompt -> provider JSON -> parseBlueprintJson -> normalizeBlueprintResult
```

The prompt asks providers to return native `schemaVersion: "v2"` JSON directly. It also
asks for legacy projection fields so older compatibility paths continue to work.

## Normalizer Safety Layer

`normalizeBlueprintResult()` remains in place as a defensive safety layer.

It protects the app in three cases:

- Older v1 blueprints are loaded from storage.
- An LLM returns partial v2 JSON with missing optional sections.
- Compatibility projections need to be preserved for older UI paths.

The goal is not to use the normalizer as the main translator anymore. The rules engine
and LLM prompt both produce v2 natively, and the normalizer fills gaps only when needed.

## Demo Surfaces

Show the same v2 intelligence across multiple surfaces:

- Dashboard: main interactive result screen.
- Wizard review: immediate post-generation result view.
- Share view: public read-only version.
- Print view: print-friendly blueprint.
- Compare view: side-by-side v2 summary between two blueprints.
- PDF export: offline delivery artifact with v2 sections before legacy summaries.

## Local Demo Setup

From the repository root:

```bash
npm install
```

Create `apps/web/.env.local`:

```env
DATABASE_URL="postgresql://user:password@host:5432/postgres?sslmode=require"
AUTH_SECRET="replace-with-a-long-random-string"

# Optional for AI Enhanced mode
ANTHROPIC_API_KEY=""
GEMINI_API_KEY=""
NVIDIA_API_KEY=""
GROQ_API_KEY=""
OPENROUTER_API_KEY=""
```

Push the Prisma schema only when a valid `DATABASE_URL` is configured:

```bash
npm run db:push
```

Start the app:

```bash
npm run dev
```

Open `http://localhost:3000`.

## Pre-Demo Checks

Run these before a demo:

```bash
npm run test:web:v2-render
npm run test:core
npm run typecheck
npm run lint
npm run build
```

If `DATABASE_URL` is not configured, `npm run build`, `npm run dev`, `npm run db:push`,
and E2E tests may fail because database-backed routes import Prisma. That is an
environment setup issue, not a Prisma schema/provider issue.

## Sample Prompts

### Field Service and Service Operations

```text
We are a home services company with 120 dispatchers, field technicians, and service managers.
We need to manage work orders, schedule technicians by territory and skill, support mobile
updates from the field, track SLA breaches, and let customers request service from a portal.
We also need ERP integration for inventory and invoices, plus dashboards for first-time fix
rate, backlog, technician utilization, and customer satisfaction.
```

What to show:

- Process analysis should identify field service execution and service operations.
- Capabilities should include scheduling, work order management, portal self-service,
  service analytics, and integration.
- Recommendations should explain Field Service, Service Cloud, Experience Cloud, and
  integration needs.
- Object model should include service appointments, work orders, assets, cases, and
  related custom objects if needed.
- Automations should include dispatch, SLA escalation, status updates, and approvals.
- Analytics should focus on field performance and service backlog.

### Sales Pipeline and Revenue Operations

```text
We are a B2B SaaS company with 85 sales users across SDR, account executive, sales ops,
and finance teams. We need lead routing, opportunity stage governance, forecasting,
quote approval, discount controls, renewal visibility, and executive pipeline dashboards.
We also need integration with our billing platform and data warehouse.
```

What to show:

- Process analysis should identify sales pipeline and revenue operations.
- Capabilities should map to lead management, opportunity management, forecasting,
  quoting, approvals, and analytics.
- Recommendations should justify Sales Cloud, Revenue Cloud or CPQ, Tableau or analytics,
  and integration options.
- Automations should include lead routing, discount approval, renewal reminders, and
  forecast hygiene.
- Analytics should include pipeline coverage, forecast accuracy, win rate, and discount
  trend dashboards.

### Employee and Internal Request Management

```text
We need an internal employee request portal for HR, IT, facilities, and finance requests.
Employees should submit requests, managers should approve them, teams should route and
fulfill work from queues, and leaders need dashboards for request volume, SLA compliance,
aging, and bottlenecks. Some requests need document uploads and integration with identity
and ticketing systems.
```

What to show:

- Process analysis should identify employee request management or custom workflow.
- Capabilities should include intake, approvals, routing, fulfillment, document capture,
  and operational reporting.
- Recommendations should explain Salesforce Platform, Experience Cloud if self-service
  is externalized or portal-like, and Service Cloud if case management is central.
- Object model should include requests, approvals, tasks, departments, and attachments.
- Automations should include intake routing, approval flows, SLA reminders, and escalation.
- Security should show internal access, permission sets, sharing, and MFA guidance.

## Demo Talking Points

- Process analysis: "The system is no longer just matching keywords to products. It first
  classifies the operating process and the personas involved."
- Business capability mapping: "Business needs are translated into capabilities, which
  becomes the bridge between discovery language and implementation design."
- Salesforce recommendation reasoning: "Each product recommendation is tied to the
  detected capabilities and signals, not just generic Salesforce positioning."
- Object model: "The blueprint now proposes the data model needed to support the process."
- Automation: "The output includes Flow and approval candidates with trigger and complexity."
- Integrations: "Integrations are structured by system, direction, pattern, notes, and source
  signal."
- Analytics: "Dashboards and reports are process-specific, so field service and sales demos
  produce different analytics packs."
- AI readiness: "Agentforce and AI are assessed separately from core CRM fit, which keeps
  AI recommendations grounded."
- User stories: "The output can be reviewed with stakeholders in implementation language,
  not just product language."

## Known Limitations

- `DATABASE_URL` is required for local dev, database schema pushes, build paths that import
  database-backed routes, and E2E tests.
- LLM output is still normalized defensively because provider JSON can be partial or malformed.
- The v2 UI is functional and visible across surfaces, but it can be visually refined later.
- Legacy projection fields are still intentionally present until all consumers are migrated.
