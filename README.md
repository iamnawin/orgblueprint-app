<div align="center">

# 🏗️ OrgBlueprint

**Turn a rough business description into a structured Salesforce implementation blueprint — in seconds.**

[![Next.js](https://img.shields.io/badge/Next.js_14-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React_18-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://vercel.com/)

[![Anthropic](https://img.shields.io/badge/Claude_Sonnet-D97757?style=for-the-badge&logo=anthropic&logoColor=white)](https://anthropic.com/)
[![Gemini](https://img.shields.io/badge/Gemini_2.0_Flash-4285F4?style=for-the-badge&logo=googlegemini&logoColor=white)](https://deepmind.google/gemini/)
[![NVIDIA](https://img.shields.io/badge/NVIDIA_NIM-76B900?style=for-the-badge&logo=nvidia&logoColor=white)](https://developer.nvidia.com/nim)
[![Playwright](https://img.shields.io/badge/Playwright-2EAD33?style=for-the-badge&logo=playwright&logoColor=white)](https://playwright.dev/)

*AI-assisted CRM planning for founders, RevOps teams, admins, consultants, and solution architects.*

</div>

---

## ✨ What it produces

A single generation run outputs a full delivery package:

| Section | What's inside |
|---|---|
| 📊 **Executive Snapshot** | Confidence score, complexity level, user count band, primary focus |
| 📦 **Product Recommendations** | Recommended vs optional Salesforce products with rationale |
| 🏛️ **Architecture** | OOTB vs custom guidance, integration map, AppExchange picks |
| 🗄️ **Data Model** | Business-friendly entity cards, relationship diagram, automations |
| ⚙️ **Technical Blueprint** | Platform-specific technical guidance derived from product selection |
| 💰 **Cost Estimate** | Directional year-one range — license + implementation (not a quote) |
| 🗺️ **Roadmap** | Phased delivery plan with implementation checklist |
| 📋 **Document Checklist** | BRD, data model, security model, test plan, and more |

---

## ⚡ Two generation modes

### 🎯 Demo mode — instant, no API key needed
Rules engine (`extractSignals` → `decideProducts` → `generateBlueprint`) plus template enrichment. Zero external calls, sub-second output.

### 🤖 AI Enhanced mode — powered by Orb
Orb (your built-in CRM architect assistant) asks up to 5 clarifying questions, then generates a richer narrative blueprint using LLM. Falls back to demo mode gracefully if all providers are unavailable.

**AI provider fallback chain:**
```
Anthropic Claude Sonnet → Gemini 2.0 Flash → Groq → deterministic rules engine
```

---

## 🛠️ Tech stack

<table>
<tr>
<td valign="top" width="50%">

**Frontend & Framework**

![Next.js](https://img.shields.io/badge/Next.js_14-000?logo=nextdotjs&logoColor=white&style=flat-square)
![React](https://img.shields.io/badge/React_18-61DAFB?logo=react&logoColor=black&style=flat-square)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white&style=flat-square)
![Tailwind](https://img.shields.io/badge/Tailwind_CSS-06B6D4?logo=tailwindcss&logoColor=white&style=flat-square)
![shadcn/ui](https://img.shields.io/badge/shadcn%2Fui-000?logo=shadcnui&logoColor=white&style=flat-square)

**Backend & Data**

![Prisma](https://img.shields.io/badge/Prisma-2D3748?logo=prisma&logoColor=white&style=flat-square)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?logo=postgresql&logoColor=white&style=flat-square)
![SQLite](https://img.shields.io/badge/SQLite_(local)-003B57?logo=sqlite&logoColor=white&style=flat-square)
![NextAuth](https://img.shields.io/badge/NextAuth_v5-000?logo=nextdotjs&logoColor=white&style=flat-square)

</td>
<td valign="top" width="50%">

**AI Providers**

![Anthropic](https://img.shields.io/badge/Anthropic_Claude-D97757?logo=anthropic&logoColor=white&style=flat-square)
![Gemini](https://img.shields.io/badge/Google_Gemini-4285F4?logo=googlegemini&logoColor=white&style=flat-square)
![Groq](https://img.shields.io/badge/Groq-F55036?logo=groq&logoColor=white&style=flat-square)
![NVIDIA](https://img.shields.io/badge/NVIDIA_NIM-76B900?logo=nvidia&logoColor=white&style=flat-square)

**Export & Infrastructure**

![Vercel](https://img.shields.io/badge/Vercel-000?logo=vercel&logoColor=white&style=flat-square)
![Upstash](https://img.shields.io/badge/Upstash_Redis-00E9A3?logo=upstash&logoColor=black&style=flat-square)
![jsPDF](https://img.shields.io/badge/jsPDF-FF0000?logo=adobeacrobatreader&logoColor=white&style=flat-square)
![Playwright](https://img.shields.io/badge/Playwright-2EAD33?logo=playwright&logoColor=white&style=flat-square)

</td>
</tr>
</table>

---

## 📁 Monorepo structure

```
orgblueprint-app/
├── apps/
│   └── web/                    Next.js app — UI, API routes, auth, Prisma
│       ├── src/
│       │   ├── app/            App Router pages and API routes
│       │   ├── components/     ConversationChat, BlueprintDashboard, AIAssistantWidget
│       │   ├── lib/            anthropic.ts, clarifications.ts, quota.ts, pricing.ts
│       │   └── hooks/          useSpeechInput
│       ├── prisma/             Schema and migrations
│       └── tests/              Playwright E2E suite
├── packages/
│   └── core/                   Pure TypeScript — zero runtime dependencies
│       ├── src/
│       │   ├── rules.ts        Signal extraction + product decision engine
│       │   ├── templates.ts    Demo-mode narrative enrichment
│       │   ├── types.ts        All shared interfaces and schemas
│       │   └── estimateLicenses / estimateImplementation / pricingAssumptions
│       └── test/               Regression and user-detection tests
├── docs/
│   └── TESTING.md
├── scripts/
│   └── doctor.mjs              Repo and workspace health check
├── CLAUDE.md                   AI assistant guidance for this repo
└── ecosystem.config.cjs        PM2 service config
```

---

## 🚀 Quick start

### 1. Install

```bash
npm install
```

### 2. Environment

Create `apps/web/.env.local`:

```env
# Required
DATABASE_URL="file:./prisma/dev.db"      # SQLite locally; Neon Postgres URL on Vercel
NEXTAUTH_SECRET="any-random-string"
NEXTAUTH_URL="http://localhost:3000"

# AI providers — at least one needed for AI Enhanced mode
ANTHROPIC_API_KEY="sk-ant-..."
GEMINI_API_KEY="AIza..."
NVIDIA_API_KEY="nvapi-..."

# Optional — persistent quota tracking (falls back to in-memory)
UPSTASH_REDIS_REST_URL="..."
UPSTASH_REDIS_REST_TOKEN="..."
```

> Demo mode works with **no API keys** at all.

### 3. Database

```bash
cd apps/web && npx prisma db push
```

### 4. Run

```bash
npm run dev       # http://localhost:3000
```

---

## 📜 Scripts

Run from the repo root:

```bash
npm run dev           # Start Next.js dev server
npm run build         # Build core → web
npm run typecheck     # Type-check both packages
npm run lint          # ESLint (web)
npm run test:core     # Rules engine regression test
npm run test:e2e      # Playwright E2E suite (from apps/web)
npm run doctor        # Repo and environment health check
```

---

## 🗺️ Pages and routes

| Route | Description |
|---|---|
| `/` | Conversational wizard — describe needs, pick mode, generate |
| `/blueprints` | Saved blueprint library (auth required) |
| `/blueprint/[slug]` | Full 6-tab blueprint dashboard |
| `/blueprint/[slug]/share` | Public share view |
| `/blueprint/[slug]/print` | Print-friendly layout |
| `/compare` | Side-by-side blueprint comparison |

| API Route | Description |
|---|---|
| `POST /api/blueprint` | Generate blueprint (saves to DB if authenticated) |
| `POST /api/conversation` | Next Orb clarifying question (deterministic, client-safe) |
| `POST /api/chat` | Blueprint Q&A — Anthropic → NVIDIA fallback |
| `POST /api/recommend` | AI expansion for deep-dive topics |
| `GET /api/blueprints` | List user's saved blueprints |

---

## 🛡️ Guardrails

OrgBlueprint is deliberately opinionated to avoid low-quality recommendations:

- 🚫 **No official pricing** — all cost output is labelled "Directional estimate only. Not a Salesforce quote."
- ☁️ **Data Cloud** — only recommended when `externalSystemsCount ≥ 2` or explicit data-unification signals
- 🤖 **Agentforce / Einstein** — never `recommended`; max `optional`, only with explicit AI automation intent
- ⚙️ **Config over custom** — standard objects and Flow preferred unless "proprietary" or "unique compliance" signals appear
- ⏱️ **AI quota** — 3 AI Enhanced runs/day per IP, 30s cooldown (Upstash Redis or in-memory fallback)

---

## 🚢 Deployment

Deploys to Vercel out of the box.

```
Vercel project → connect repo → set env vars → deploy
```

Switch `DATABASE_URL` to a [Neon](https://neon.tech) Postgres connection string for persistent storage (SQLite is ephemeral on Vercel's serverless runtime).

---

## 🧪 Testing

```bash
# Rules engine regression
npm run test:core

# User-count detection
npx tsx packages/core/test/users.test.ts

# E2E (Playwright — requires dev server)
cd apps/web && npm run test:e2e
cd apps/web && npm run test:e2e:headed    # watch mode
cd apps/web && npm run test:e2e:report    # HTML report
```

E2E coverage: API contracts · home wizard · auth forms · demo mode full-flow · all 6 dashboard tabs · floating AI widget.
