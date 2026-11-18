# Progress Log

Append a dated entry after every completed task. If a session ends mid-task, record the exact stopping point and next step.

## 2026-11-18: Project scaffolding and planning

- Confirmed the stack with the owner and wrote `docs/STACK.md` (MIT, ESLint + Prettier, all defaults accepted).
- Confirmed the feature list and the MVP/Later split in `docs/FEATURES.md`.
- Wrote `docs/DESIGN.md` with design tokens (CSS variables + Tailwind theme). No mockups in `docs/design/` yet.
- Wrote `docs/PLAN.md` (phases 0 to 9 plus a backlog); the owner approved it.
- Created `CLAUDE.md`, `docs/DECISIONS.md` (ADR-001 to ADR-003) and `.gitignore`.
- Decisions: orange text token added for AA contrast (ADR-003); Discord bot, scraper, alerts and digest moved to Later (ADR-002).
- Left half-done: nothing. Next task: P0-T1 (Workspace root).

## 2026-11-18: P0-T1

- Added root package.json (pnpm@12.18.0, Node >=22), pnpm-workspace.yaml, tsconfig.base.json (strict + noUncheckedIndexedAccess), .nvmrc, .editorconfig, .gitattributes (LF line endings).
- Verified: `pnpm install` and `pnpm -r typecheck` succeed (no packages yet).
- Left half-done: nothing. Next: P0-T2.

## 2026-11-18: P0-T2

- Added ESLint 10 flat config (typescript-eslint, no-explicit-any, consistent-type-imports), Prettier, husky (pre-commit lint-staged, commit-msg commitlint), commitlint with Conventional Commits.
- Decision: pinned TypeScript to 6.x because typescript-eslint does not support TS 7 yet (ADR-004).
- Verified: `pnpm lint` and `pnpm format:check` pass; commitlint rejects 'bad message' and accepts 'feat(ingest): CSV upload [P2-T1]'.
- Left half-done: nothing. Next: P0-T3.

## 2026-11-18: P0-T3

- Added @earshot/core, @earshot/db, @earshot/widget (source-level exports, tsc typecheck, Vitest 5) each with a smoke test; db imports core through the workspace.
- Deviation: no root vitest.workspace.ts (deprecated in Vitest 5); each package runs its own vitest and `pnpm -r test` fans out. The apps-import-core test moves to P0-T4/T5 when the apps exist.
- Verified: lint, typecheck and test all pass.
- Left half-done: nothing. Next: P0-T4.
