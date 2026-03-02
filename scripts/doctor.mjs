#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const cwd = process.cwd();
const pkgPath = path.join(cwd, 'package.json');

function fail(message) {
  console.error(`❌ ${message}`);
  process.exitCode = 1;
}

function pass(message) {
  console.log(`✅ ${message}`);
}

if (!fs.existsSync(pkgPath)) {
  fail('No package.json found in current directory. Run from repository root.');
  process.exit();
}

const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

if (pkg.name !== 'orgblueprint-app') {
  fail(`Wrong project detected: package name is "${pkg.name}" (expected "orgblueprint-app").`);
  console.log('   You are likely in the wrong folder/repo.');
} else {
  pass('Correct project detected (orgblueprint-app).');
}

const requiredScripts = ['dev', 'lint', 'typecheck', 'build'];
for (const script of requiredScripts) {
  if (!pkg.scripts?.[script]) {
    fail(`Missing npm script: ${script}`);
  } else {
    pass(`Script present: npm run ${script}`);
  }
}

const expectedPaths = [
  'apps/web/package.json',
  'packages/core/package.json',
  'apps/web/src/app/page.tsx',
  'packages/core/src/rules.ts'
];
for (const rel of expectedPaths) {
  if (!fs.existsSync(path.join(cwd, rel))) {
    fail(`Missing expected path: ${rel}`);
  } else {
    pass(`Found: ${rel}`);
  }
}

const nodeModulesExists = fs.existsSync(path.join(cwd, 'node_modules'));
if (!nodeModulesExists) {
  fail('node_modules not found. Run: npm install');
} else {
  pass('node_modules exists (dependencies appear installed).');
}

if (!process.exitCode) {
  console.log('🎉 Environment looks good. You can run: npm run lint; npm run typecheck; npm run build');
}
