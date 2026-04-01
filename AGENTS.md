# Repository Guidelines

## Project Structure & Module Organization
This repository is an npm workspace monorepo. Use `apps/web` for the Next.js app, including routes in `src/app`, shared UI in `src/components`, helpers in `src/lib`, hooks in `src/hooks`, and Prisma schema and migrations in `prisma/`. Keep reusable business logic in `packages/core/src`; its regression tests live in `packages/core/test`. End-to-end coverage lives in `apps/web/tests/e2e`, with page objects in `apps/web/tests/pages`. Use `docs/` for architecture and testing notes, and `scripts/` for repo utilities such as `doctor.mjs`.

## Build, Test, and Development Commands
Run commands from the repository root unless a section says otherwise.

- `npm install`: install workspace dependencies.
- `npm run dev`: start the web app locally at `http://localhost:3000`.
- `npm run build`: build `@orgblueprint/core` first, then the Next.js app.
- `npm run lint`: run Next.js ESLint checks for `apps/web`.
- `npm run typecheck`: run TypeScript checks for both workspaces.
- `npm run test:core`: run core regression checks in `packages/core/test`.
- `npm run test:e2e`: run Playwright tests in `apps/web/tests/e2e`.
- `npm run doctor`: verify repo structure, scripts, and install state.

## Coding Style & Naming Conventions
Write TypeScript with 2-space indentation, semicolons, and double quotes to match the existing codebase. Use PascalCase for React components (`BlueprintDashboard.tsx`), camelCase for utilities (`technicalBlueprint.ts`), and lowercase route folders under `src/app`. Prefer small, reusable helpers in `packages/core` or `apps/web/src/lib` before adding new abstractions. Use `npm run lint` as the formatting and style gate.

## Testing Guidelines
Add or update tests with every behavior change. Keep core tests in `packages/core/test/*.test.ts` and Playwright specs in `apps/web/tests/e2e/**/*.spec.ts`. Favor page objects and shared fixtures over duplicated selectors. Before opening a PR, run `npm run lint`, `npm run typecheck`, `npm run build`, `npm run test:core`, and `npm run test:e2e` when UI or API flows changed.

## Commit & Pull Request Guidelines
Recent history uses Conventional Commit prefixes such as `feat:`, `fix:`, and `refactor:`. Follow that subject style, and for substantive changes include the repo's Lore trailers in the commit body when possible (`Constraint:`, `Rejected:`, `Confidence:`, `Tested:`). Keep commits focused and reversible. PRs should explain the user-visible change, list verification commands run, link related issues, and include screenshots for UI updates.

## Security & Configuration Tips
Do not commit secrets, local databases, or generated artifacts outside approved paths. Review Prisma changes carefully, and treat `apps/web/prisma/dev.db` as local-only state. Prefer existing dependencies and patterns; avoid adding new packages unless the change clearly requires them.
