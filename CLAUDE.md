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
```

There are no tests yet. `@orgblueprint/core` must be built before `@orgblueprint/web` because the web app imports from `dist/`.

## Architecture

This is an npm workspaces monorepo with two packages:

**`packages/core`** — Pure TypeScript, no dependencies. Compiled to `dist/` via `tsc`.
- `types.ts` — All shared interfaces: `Signals`, `ClarificationAnswers`, `BlueprintResult`, `ProductKey`, etc.
- `rules.ts` — The deterministic rules engine: `extractSignals()` parses raw text + clarification answers into a `Signals` object using keyword matching; `decideProducts()` maps signals to product recommendations; `generateBlueprint()` is the top-level function that returns a full `BlueprintResult`.
- No LLM calls. All logic is keyword-heuristic based.

**`apps/web`** — Next.js 14 App Router, React 18, Tailwind CSS.
- `app/api/blueprint/route.ts` — Single POST endpoint that calls `generateBlueprint(input, answers)` from core and returns JSON.
- `app/page.tsx` — Root page, renders `<BlueprintWizard />`.
- `components/BlueprintWizard.tsx` — The entire UI. Manages a 5-stage wizard flow: `landing → describe → questions → confirm → results`. Persists last session to `localStorage`.

## Data flow

1. User describes business needs (free text) → optionally answers up to 6 clarification questions
2. Frontend POSTs `{ input: string, answers: ClarificationAnswers }` to `/api/blueprint`
3. API calls `generateBlueprint()` → returns `BlueprintResult`
4. UI renders 11-section dashboard

## Guardrails (enforced in rules.ts)

- **Data Cloud** is only recommended when `externalSystemsCount >= 2` or explicit single-customer-view/segmentation signals are present.
- **Agentforce/Einstein** is never recommended; max level is `optional`, and only when `aiAutomationIntent` or high-volume deflection signals are detected.
- **Cost simulator** always includes a disclaimer that it is directional only, not official Salesforce pricing.
- Custom objects are only suggested when "proprietary" or "unique compliance" keywords appear; otherwise Config is used.
