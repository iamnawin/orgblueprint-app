import assert from "node:assert/strict";
import { generateBlueprint } from "../src/rules";

const input =
  "We are an enterprise retail company with 500+ users… need real-time unified customer profiles, AI-driven service automation, and a self-service customer portal… complex pricing… ERP, ecommerce, marketing automation.";

const result = generateBlueprint(input, {});
const byName = Object.fromEntries(result.products.map((p) => [p.name, p.level]));

assert.ok(result.executiveSnapshot.usersDetected >= 500);
assert.equal(byName["Experience Cloud"], "recommended");
assert.equal(byName["Data Cloud"], "recommended");
assert.equal(byName["Revenue Cloud / CPQ"], "recommended");
assert.equal(byName["Field Service"], "not_needed");

console.log("Regression fixture passed");
