# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Install dependencies (from repo root)
npm install

# Start dev server (Next.js on http://localhost:3000)
npm run dev

# Build everything (core first, then web)
npm run build

# Build core package only
npm run build -w @orgblueprint/core

# Lint (web only)
npm run lint

# Type-check both packages
npm run typecheck

# Run regression tests for rules engine (no test runner needed)
npm run test:core

# Run user-detection tests
npx tsx packages/core/test/users.test.ts

# Run E2E tests (Playwright, requires dev server running or it starts one)
cd apps/web && npm run test:e2e              # headless
cd apps/web && npm run test:e2e:headed      # watch the browser
cd apps/web && npm run test:e2e:report      # open HTML report after a run

# Check environment and config health
npm run doctor

# Prisma: push schema to SQLite dev DB
cd apps/web && npx prisma db push

# Prisma: generate client after schema changes
cd apps/web && npx prisma generate

# Prisma: open DB browser
cd apps/web && npx prisma studio
```

`@orgblueprint/core` must be built before `@orgblueprint/web` because the web app imports from `dist/`. On Windows, `npx prisma generate` may fail due to file locks — run `npx next build` directly to test instead.

## Environment

`apps/web/.env.local` must exist with:
```
DATABASE_URL="file:./prisma/dev.db"        # local SQLite. Set to Neon Postgres URL on Vercel.
NEXTAUTH_SECRET="<any random string>"
NEXTAUTH_URL="http://localhost:3000"
ANTHROPIC_API_KEY="sk-ant-..."        # optional — enables AI mode (Claude Sonnet)
GEMINI_API_KEY="AIza..."              # optional — free alternative for AI mode (Gemini 2.0 Flash). Used when ANTHROPIC_API_KEY is empty.
NVIDIA_API_KEY="nvapi-..."            # optional — fallback chat model (MiniMax M2.5 via NVIDIA NIM)
UPSTASH_REDIS_REST_URL="..."          # optional — persistent AI quota tracking
UPSTASH_REDIS_REST_TOKEN="..."        # optional — persistent AI quota tracking
```

Without `UPSTASH_REDIS_*`, quota tracking falls back to an in-memory Map (resets on server restart).

## Architecture

npm workspaces monorepo:

**`packages/core`** — Pure TypeScript, zero dependencies. Compiled to `dist/` via `tsc`.
- `types.ts` — All shared interfaces: `Signals`, `ClarificationAnswers`, `BlueprintResult`, `ProductKey`, etc.
- `rules.ts` — Deterministic rules engine: `extractSignals()` → `decideProducts()` → `generateBlueprint()`. Keyword-heuristic only, no LLM.
- `templates.ts` — `enrichWithTemplates(result, signals)`: overlays polished narrative strings onto rules-engine output for demo mode. Covers: primaryFocus, whyMapping, objectsAndAutomations, analyticsPack, roadmap, documentChecklist, risks.
- `estimateLicenses.ts` / `estimateImplementation.ts` / `pricingAssumptions.ts` — cost estimation helpers.

**`apps/web`** — Next.js 14 App Router, React 18, Tailwind CSS, shadcn/ui, Prisma (SQLite), NextAuth v5.

## Three Operating Modes

**Demo mode** (default, no API key required):
- Rules engine (`generateBlueprint()`) + `enrichWithTemplates()` — instant, no external calls.
- Triggered when `mode: "demo"` in the `/api/blueprint` POST body.

**AI Enhanced mode** (requires `ANTHROPIC_API_KEY`):
- `/api/conversation` runs a Claude Sonnet conversation loop (max 5 clarifying questions).
- `/api/blueprint` calls `generateBlueprintFromLLM()` (Claude Sonnet, 4096 tokens).
- Per-IP quota enforced: 3 AI runs/day, 30s cooldown (`apps/web/src/lib/quota.ts`).
- Falls back to demo mode if LLM call fails.

**Chat / Ask AI** (floating widget on all pages, rendered via `AIAssistantWidget.tsx` in `layout.tsx`):
- `/api/chat` tries Anthropic (claude-haiku-4-5) → NVIDIA NIM (MiniMax M2.5) fallback.
- Receives `blueprintSummary` context string via `BlueprintContext` to ground answers in the current blueprint.
- There is **no Ask AI tab** in the dashboard — the floating widget handles all AI chat globally.

## AI Provider Fallback Chain

Blueprint generation (`/api/blueprint`): Anthropic Claude Sonnet → Gemini 2.0 Flash → Groq → deterministic rules engine.

Conversation questions (`/api/conversation`): Anthropic → Groq → deterministic clarification path (so the UI never hangs).

Chat widget (`/api/chat`): Anthropic claude-haiku-4-5 → NVIDIA NIM (MiniMax M2.5).

## Wizard Stages (ConversationChat.tsx)

The 6-stage wizard manages state via a `stage` discriminated union:
1. **describe** — user types need text, selects Demo or AI Enhanced mode
2. **conversation** — (AI mode only) up to 5 Claude clarifying questions
3. **confirm** — review input + answers before generating
4. **expand** — optional deep-dives: 5 checkboxes (architecture, OOTB vs custom, integrations, reporting, AI automation)
5. **generating** — spinner while `/api/blueprint` runs
6. **results** — renders `<BlueprintDashboard />` inline

## Dashboard Tabs (BlueprintDashboard.tsx)

6 tabs implemented as a custom dark scrollable nav (`bg-slate-900`), **not** shadcn TabsList. State via `useState<TabId>` + conditional rendering. The `TABS` array and `TabId` type are defined at the bottom of the file, just above the main component.

`Overview | Architecture | Data Model | Technical | Cost | Roadmap`

- **Overview**: analytics KPIs + `AnalyticsPackCards` (categorized card grid) + collapsible risks + expansion panel
- **Architecture**: OOTB vs Custom + integrations + AppExchange recommendations
- **Data Model**: business-friendly entity cards + relationship diagram + automations
- **Technical**: generated from `technicalBlueprint.ts`
- **Cost**: 3 KPI cards + interactive cost calculator + line-item estimate (disclaimer hardcoded)
- **Roadmap**: visual phases + implementation checklist + document checklist

## Pages and Routes

| Route | Description |
|---|---|
| `/` | Home — `<ConversationChat />` drives the full wizard |
| `/blueprints` | User's saved blueprints list (requires auth) |
| `/blueprint/[slug]` | View saved blueprint — `<BlueprintDashboard />` |
| `/blueprint/[slug]/share` | Public share page for a blueprint |
| `/blueprint/[slug]/print` | Print-friendly view |
| `/compare?a=[slug]&b=[slug]` | Side-by-side blueprint comparison (requires auth) |
| `/auth/signin` | Credentials sign-in form |
| `/auth/signup` | Registration form |
| `/api/blueprint` POST | Generate blueprint; saves to DB if authenticated |
| `/api/blueprint/[slug]` GET | Fetch saved blueprint by slug |
| `/api/blueprints` GET | List current user's blueprints |
| `/api/conversation` POST | Get next AI clarification question |
| `/api/recommend` POST | AI expansion endpoint for deep-dive topics |
| `/api/chat` POST | Blueprint Q&A chat (Anthropic → NVIDIA fallback) |
| `/api/nvidia-chat` POST | Direct NVIDIA NIM chat endpoint |
| `/api/auth/[...nextauth]` | NextAuth handler |
| `/api/auth/register` POST | User registration endpoint |

## Key Files

| File | Purpose |
|---|---|
| `packages/core/src/rules.ts` | Signal extraction + product decision engine |
| `packages/core/src/templates.ts` | Demo-mode narrative enrichment |
| `apps/web/src/lib/anthropic.ts` | `generateBlueprintFromLLM()` + `getNextQuestion()` + multi-provider fallback chain |
| `apps/web/src/lib/clarifications.ts` | Parses Orb answers into `ClarificationAnswers`; also runs `parseUsersFromText()` for AI-mode user-count extraction |
| `apps/web/src/lib/quota.ts` | Per-IP AI rate limiting (Upstash or in-memory) |
| `apps/web/src/lib/exportPdf.ts` | Client-side PDF export via jsPDF (dynamic import) |
| `apps/web/src/lib/technicalBlueprint.ts` | TechnicalBlueprint derived from product keys |
| `apps/web/src/lib/pricing.ts` / `productDetails.ts` | License cost data |
| `apps/web/src/lib/appExchange.ts` | AppExchange product recommendations |
| `apps/web/src/lib/implementationChecklist.ts` | Checklist items per product |
| `apps/web/src/components/ConversationChat.tsx` | Full 6-stage wizard |
| `apps/web/src/components/BlueprintDashboard.tsx` | 7-tab blueprint viewer |
| `apps/web/src/components/AIAssistantWidget.tsx` | Floating chat widget (rendered in layout.tsx) |
| `apps/web/src/components/BlueprintContext.tsx` | React context + `useBlueprintContext` hook — shares `blueprintSummary` string from dashboard to floating widget |
| `apps/web/src/hooks/useSpeechInput.ts` | Web Speech API hook for voice input |

## Auth

NextAuth v5 with `PrismaAdapter` and `CredentialsProvider`. Session strategy is JWT. The JWT callback stores `user.id` so API routes can call `auth()` and read `session.user.id`. Passwords hashed with bcrypt (cost 10).

## Database Schema (SQLite via Prisma)

`User` → `Blueprint[]`. `Blueprint` stores `needText`, `answers` (JSON string), `result` (JSON string), `slug` (nanoid(8)), `isPublic` flag. NextAuth adapter tables also present.

`result` and `answers` are stored as raw JSON strings and parsed at read time. **SQLite is ephemeral on Vercel** — swap to Neon Postgres for production persistence.

## User Count Detection (`parseUsers` in rules.ts, `parseUsersFromText` in clarifications.ts)

Both functions use `matchAll` on an explicit "N [role] noun" pattern and **sum all distinct role-group mentions** — so "50 sales reps, 200 account executives, 80 inside reps" correctly yields 330. A "total N users" mention (prefixed by "total/totaling/totalling") is excluded from the sum to avoid double-counting.

Recognised headcount nouns include: users, reps, agents, employees, staff, managers, executives, directors, analysts, consultants, engineers, technicians, specialists, advisors, representatives, and others. Role modifiers up to 2 words are allowed between the number and the noun (e.g. "200 account executives", "80 inside sales reps").

## Guardrails (enforced in both rules.ts and the LLM system prompt)

- **Data Cloud** only when `externalSystemsCount >= 2` or explicit single-customer-view/segmentation signals.
- **Agentforce/Einstein** never `recommended`; max `optional`, only for explicit AI automation intent.
- **Cost simulator** disclaimer is hardcoded: "Directional estimate only. This is not official Salesforce pricing or a quote."
- Prefer Config over Custom. Prefer standard objects unless "proprietary" or "unique compliance" keywords appear.

## E2E Tests (Playwright)

Test files live in `apps/web/tests/e2e/`. Config at `apps/web/playwright.config.ts`. Chromium only, reuses the existing dev server if running.

```
tests/e2e/
├── api.spec.ts           # API contract tests (no browser needed)
├── home.spec.ts          # Home page / wizard input
├── ai-widget.spec.ts     # Floating chat widget
├── auth/                 # Sign-in and sign-up forms
└── blueprint/
    ├── demo-mode.spec.ts       # Full wizard E2E in demo mode
    └── dashboard-tabs.spec.ts  # All 6 dashboard tabs
```

Page Object Models in `apps/web/tests/pages/`. Screenshots and artifacts written to `apps/web/artifacts/`.

## Agent Orchestration Workflow

When building features for this project, follow the stage-based agent pipeline:

1. **Discovery** — Understand requirements, define success metrics
2. **Architecture** — Design system structure, API shape, DB schema
3. **Implementation** — Build with frontend + backend agents in parallel
4. **Testing** — API tests, performance checks, reality check
5. **Deployment** — CI/CD, Vercel deploy, monitoring
6. **Optimization** — DB query tuning, LLM cost routing, caching

For each task: identify the stage → delegate to the appropriate agent → validate output → advance.

Priority order: maintainability > scalability > clarity.

## PM2 Services

| Port | Name | Type |
|------|------|------|
| 3000 | orgblueprint-3000 | Next.js |

**Terminal Commands:**
```bash
pm2 start ecosystem.config.cjs   # First time
pm2 start all                    # After first time
pm2 stop all / pm2 restart all
pm2 start orgblueprint-3000 / pm2 stop orgblueprint-3000
pm2 logs / pm2 status / pm2 monit
pm2 save                         # Save process list
pm2 resurrect                    # Restore saved list
```
