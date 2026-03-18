import assert from "node:assert/strict";
import { generateBlueprint } from "../src/rules";

const cases: [string, number][] = [
  // Single role groups
  ["50 sales reps need pipeline management", 50],
  ["120 managers across 3 regions", 120],
  ["we have 30 support agents handling cases", 30],
  ["200 account executives using spreadsheets", 200],
  ["15 field engineers need mobile access", 15],
  ["75-person company with sales and service teams", 75],
  ["team of 40 consultants", 40],
  ["our 500 employees need a CRM", 500],
  ["60 salespeople and service staff", 60],
  ["managing 25 users currently", 25],
  ["5 sales reps currently but growing fast", 5],
  ["B2B company with 80 inside sales representatives", 80],

  // Multi-group summing
  ["we have 50 sales reps and 30 support agents", 80],
  ["50 sales reps, 200 account executives", 250],
  ["50 sales reps, 200 account executives, 80 inside sales reps", 330],
  ["120 managers and 45 analysts need Salesforce", 165],
  ["30 service agents, 20 field technicians, and 10 admins", 60],

  // Summary number should NOT be double-counted
  ["we have total 100 users", 100],
];

let passed = 0;
for (const [text, expected] of cases) {
  const result = generateBlueprint(text, {});
  const got = result.executiveSnapshot.usersDetected;
  const ok = got === expected;
  if (ok) passed++;
  console.log(`${ok ? "✓" : "✗"} ${String(got).padStart(4)} (expected ${expected}) | ${text}`);
}

console.log(`\n${passed}/${cases.length} passed`);
if (passed < cases.length) process.exit(1);
