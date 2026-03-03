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

# Lint (web only)
npm run lint

# Type-check both packages
npm run typecheck

# Prisma: push schema to SQLite dev DB
cd apps/web && npx prisma db push

# Prisma: generate client after schema changes
cd apps/web && npx prisma generate

# Prisma: open DB browser
cd apps/web && npx prisma studio
```

`@orgblueprint/core` must be built before `@orgblueprint/web` because the web app imports from `dist/`.

## Environment

`apps/web/.env.local` must exist with:
```
DATABASE_URL="file:./dev.db"
NEXTAUTH_SECRET="<any random string>"
NEXTAUTH_URL="http://localhost:3000"
ANTHROPIC_API_KEY="sk-ant-..."   # optional — app falls back to rules engine if missing
```

## Architecture

npm workspaces monorepo with two packages:

**`packages/core`** — Pure TypeScript, zero dependencies. Compiled to `dist/` via `tsc`.
- `types.ts` — All shared interfaces: `Signals`, `ClarificationAnswers`, `BlueprintResult`, `ProductKey`, etc.
- `rules.ts` — Deterministic rules engine: `extractSignals()` → `decideProducts()` → `generateBlueprint()`. Keyword-heuristic only, no LLM.

**`apps/web`** — Next.js 14 App Router, React 18, Tailwind CSS, shadcn/ui, Prisma (SQLite), NextAuth v5.

## Data flow — two modes

**AI mode** (when `ANTHROPIC_API_KEY` is set):
1. Home page renders `<ConversationChat />` which calls `POST /api/conversation` in a loop.
2. `/api/conversation` calls `getNextQuestion()` (Claude Sonnet) — returns the next most-important clarifying question, or `null` when enough info is gathered (max 5 questions).
3. When conversation ends, `ConversationChat` calls `POST /api/blueprint` with the need text + collected Q&A answers.
4. `/api/blueprint` calls `generateBlueprintFromLLM()` (Claude Sonnet, 4096 tokens), parses the returned JSON into `BlueprintResult`.

**Rules mode** (fallback / no API key):
- `/api/blueprint` calls `generateBlueprint()` from `@orgblueprint/core` directly.

After blueprint generation, if the user is authenticated, `/api/blueprint` saves the result to the DB via Prisma (`Blueprint` model with a nanoid `slug`) and returns the slug.

## Pages and routes

| Route | Description |
|---|---|
| `/` | Home — `<ConversationChat />` drives the full wizard |
| `/blueprints` | User's saved blueprints list (requires auth) |
| `/blueprint/[slug]` | View saved blueprint — `<BlueprintDashboard />` |
| `/blueprint/[slug]/print` | Print-friendly view |
| `/auth/signin` | Credentials sign-in form |
| `/auth/signup` | Registration form (hashes password with bcrypt) |
| `/api/blueprint` POST | Generate blueprint; saves to DB if authenticated |
| `/api/blueprint/[slug]` GET | Fetch a saved blueprint by slug |
| `/api/conversation` POST | Get next AI clarification question |
| `/api/auth/[...nextauth]` | NextAuth handler |
| `/api/auth/register` POST | User registration endpoint |

## Auth

NextAuth v5 with `PrismaAdapter` and `CredentialsProvider`. Session strategy is JWT. The JWT callback stores `user.id` into the token so API routes can call `auth()` and read `session.user.id`.

## Key components

- `ConversationChat.tsx` — Full wizard: collects need text, runs conversation loop to gather clarifications, submits to `/api/blueprint`, renders `<BlueprintDashboard />` inline.
- `BlueprintDashboard.tsx` — 11-section tabbed dashboard rendering all `BlueprintResult` fields.
- `Navbar.tsx` — Shows user session, links to `/blueprints`, sign-in/out.

## Database schema (SQLite via Prisma)

`User` → `Blueprint[]`. `Blueprint` stores `needText`, `answers` (JSON string), `result` (JSON string), `slug`, `isPublic` flag. NextAuth adapter tables (`Account`, `Session`, `VerificationToken`) are also present.

## Guardrails (enforced in both rules.ts and the LLM system prompt)

- **Data Cloud** only when `externalSystemsCount >= 2` or explicit single-customer-view/segmentation signals.
- **Agentforce/Einstein** never `recommended`; max `optional`, only for explicit AI automation intent.
- **Cost simulator** disclaimer is hardcoded: "Directional estimate only. This is not official Salesforce pricing or a quote."
- Prefer Config over Custom. Prefer standard objects unless "proprietary" or "unique compliance" keywords appear.
