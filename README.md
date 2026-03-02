# OrgBlueprint MVP

OrgBlueprint is a conversational Salesforce product recommender and blueprint generator.

## MVP capabilities
- Text-only business need capture
- Up to 6 skippable clarification questions (one at a time)
- Deterministic rules engine (no LLM calls)
- Structured dashboard output:
  1. Executive Snapshot
  2. Product recommendations (Recommended / Optional / Not needed)
  3. Why mapping
  4. OOTB vs Custom
  5. Objects + Automations
  6. Integration map
  7. Analytics pack
  8. Cost simulator with visible disclaimer
  9. Roadmap phases
  10. Document checklist
  11. Risks + confidence score

## Architecture
- `apps/web`: Next.js App Router UI + API route handlers.
- `packages/core`: TypeScript rules engine and schemas.
- API route `POST /api/blueprint` calls `generateBlueprint()` from core.
- Sessions persisted in browser localStorage (MVP only).

## Guardrails implemented
- No official Salesforce pricing output. Cost simulator is directional with disclaimer.
- Data Cloud is only recommended when trigger conditions are present.
- Agentforce/Einstein is not recommended by default; only suggested when AI triggers are present.
- Standard objects are preferred; custom objects only when requirements indicate poor fit.

## Run locally
```bash
npm install
npm run dev
```
Open `http://localhost:3000`.

## Quality checks
```bash
npm run lint
npm run typecheck
npm run build
```
