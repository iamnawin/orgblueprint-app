# OrgBlueprint MVP Testing Guide

## 1) Install dependencies
```bash
npm install
```

## 2) Run quality checks
```bash
npm run test:core
npm run test:web:v2-render
npm run lint
npm run typecheck
npm run build
```

`npm run build` requires `apps/web/.env.local` to include `DATABASE_URL` because
Next.js imports database-backed routes during build. The build script generates the
Prisma client but does not push schema changes.

To update the local or hosted database schema explicitly:

```bash
npm run db:push
```

If `DATABASE_URL` is missing, Prisma commands fail with `P1012: Environment variable not found: DATABASE_URL`.

## 3) Run app locally
```bash
npm run dev
```
Open http://localhost:3000

Local dev requires:

- `DATABASE_URL`: hosted PostgreSQL connection string used by Prisma, auth, and saved blueprints.
- `AUTH_SECRET`: auth/session signing secret.
- Optional AI keys: `ANTHROPIC_API_KEY`, `GEMINI_API_KEY`, `NVIDIA_API_KEY`, `GROQ_API_KEY`, `OPENROUTER_API_KEY`.

## 4) Manual UI workflow verification
1. Click **Start**.
2. Enter business needs text and click **Continue**.
3. Complete/skip 6 clarification questions.
4. Click **Generate Blueprint**.
5. Confirm all 11 result sections render.

## 5) API check
```bash
curl -X POST http://localhost:3000/api/blueprint \
  -H "Content-Type: application/json" \
  -d '{"input":"Need sales and support with ERP integration","answers":{"users":80,"externalSystemsCount":2}}'
```


## 6) PowerShell compatibility
On older Windows PowerShell versions, `&&` is not supported. Use:
```powershell
npm run lint; npm run typecheck; npm run build
```


## 7) Quick doctor check (recommended)
```powershell
npm run doctor
```
This confirms you are in the correct repository (`orgblueprint-app`), required scripts exist, core paths are present, and dependencies are installed.

## 8) Build and E2E database requirements

The web app uses Prisma for auth and saved blueprints. These commands require `DATABASE_URL`:

```bash
npm run build
npm run db:push
npm run test:e2e
npm run test:e2e:db
```

Use `npm run test:e2e:db` when the schema should be pushed before Playwright runs.
Use `npm run build:with-db -w @orgblueprint/web` when you intentionally want a schema
push followed by a web build.

## 9) If output shows another project (e.g., `structra-ai`)
You are in the wrong local folder. Re-clone and run from:
`C:\Users\Naveen\OneDrive\Desktop\orgblueprint`

```powershell
git clone https://github.com/iamnawin/orgblueprint-app "C:\Users\Naveen\OneDrive\Desktop\orgblueprint"
cd "C:\Users\Naveen\OneDrive\Desktop\orgblueprint"
npm install
npm run doctor
```


## 10) If git remote/branch is wrong
If `git remote -v` points to another repo (e.g., Structra) or `src refspec work does not match any`, run:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\fix-orgblueprint-git.ps1 `
  -RepoPath "C:\Users\Naveen\OneDrive\Desktop\orgblueprint" `
  -RemoteUrl "https://github.com/iamnawin/orgblueprint-app.git" `
  -Branch "work"
```

Manual equivalent:
```powershell
git remote set-url origin https://github.com/iamnawin/orgblueprint-app.git
git fetch origin
git switch -c work   # or: git switch work
git push -u origin work
```
