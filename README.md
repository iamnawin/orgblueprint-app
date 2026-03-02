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


## How pricing estimates are calculated (directional only)
- **License estimate**: Uses directional per-user monthly ranges for assumed editions (currently Sales Cloud and Service Cloud assumptions in `packages/core/src/pricingAssumptions.ts`).
- **User allocation**: If both Sales Cloud and Service Cloud are recommended, users are split 70/30; if only one is recommended, all users are assigned to that cloud.
- **Implementation estimate**: Uses an MVP complexity band (Low/Medium/High) and adds uplift when integrations exceed 2.
- **Year-1 total**: `license total + implementation total` shown as low/high range.
- **Disclaimer**: Estimates are directional and are **not official Salesforce pricing or a quote**.


## Troubleshooting (Windows logs you shared)
If `npm run` shows scripts from another app such as `structra-ai` (for example Vite scripts), you are in the wrong folder/repository.

1. Verify location and project name:
```powershell
pwd
git remote -v
npm run doctor
```
Expected doctor output should confirm package `orgblueprint-app`.

2. If commands like `'tsc' is not recognized` or `'vite' is not recognized` appear:
- You are either in the wrong repo, or
- Dependencies are not installed.

Run:
```powershell
npm install
npm run doctor
```

3. For older PowerShell (no `&&` support), use:
```powershell
npm run lint; npm run typecheck; npm run build
```


4. If `git remote -v` shows `Structra-AI-Architect-Studio` instead of `orgblueprint-app`, fix remote + branch:
```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\fix-orgblueprint-git.ps1 `
  -RepoPath "C:\Users\Naveen\OneDrive\Desktop\orgblueprint" `
  -RemoteUrl "https://github.com/iamnawin/orgblueprint-app.git" `
  -Branch "work"
```
This script sets/updates `origin`, creates/switches `work` if missing, then pushes with upstream.

## GitHub + local parallel save workflow
Use this repository URL for your local clone:
- `https://github.com/iamnawin/orgblueprint-app`

### First-time setup (Windows PowerShell)
```powershell
git clone https://github.com/iamnawin/orgblueprint-app "C:\Users\Naveen\OneDrive\Desktop\orgblueprint"
cd "C:\Users\Naveen\OneDrive\Desktop\orgblueprint"
npm install
```

### Parallel local + git sync
A ready-to-use PowerShell script is included at:
- `scripts/sync-local-git.ps1`

Example usage:
```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\sync-local-git.ps1 `
  -RepoPath "C:\Users\Naveen\OneDrive\Desktop\orgblueprint" `
  -BackupPath "C:\Users\Naveen\OneDrive\Desktop\orgblueprint-backup" `
  -CommitMessage "Sync local + git"
```
This mirrors the repo to a local backup folder, then pulls/rebases, commits, and pushes if changes exist.

Safety check included: the script verifies `-RepoPath` is the actual git root before staging, which prevents accidental `../../../` parent-folder scanning.

## Testing
See detailed testing steps in `docs/TESTING.md`.

### PowerShell note
If your PowerShell does not support `&&`, run commands separately or with semicolons:
```powershell
npm run lint; npm run typecheck; npm run build
```
