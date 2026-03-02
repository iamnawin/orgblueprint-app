# OrgBlueprint MVP Testing Guide

## 1) Install dependencies
```bash
npm install
```

## 2) Run quality checks
```bash
npm run lint
npm run typecheck
npm run build
```

## 3) Run app locally
```bash
npm run dev
```
Open http://localhost:3000

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

## 8) If output shows another project (e.g., `structra-ai`)
You are in the wrong local folder. Re-clone and run from:
`C:\Users\Naveen\OneDrive\Desktop\orgblueprint`

```powershell
git clone https://github.com/iamnawin/orgblueprint-app "C:\Users\Naveen\OneDrive\Desktop\orgblueprint"
cd "C:\Users\Naveen\OneDrive\Desktop\orgblueprint"
npm install
npm run doctor
```
