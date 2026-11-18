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

## 2026-11-18: P0-T4

- Added apps/web: Next.js 16 App Router, Tailwind v4 with Earshot tokens in globals.css (mapped onto the shadcn/ui variable contract), self-hosted Inter and Space Grotesk, lucide, a token-based Button, placeholder home page, standalone output for Docker.
- Decisions: Tailwind v4 CSS-first theme and fontsource fonts (ADR-005); DESIGN.md updated.
- Verified: lint, typecheck, 9 web tests, `next build` pass; `next dev` served the page with HTTP 200. The apps-import-core test is done here.
- Not done yet: shadcn CLI-generated components (only a hand-written Button so far); real shadcn components get added as the UI phase needs them.
- Left half-done: nothing. Next: P0-T5.

## 2026-11-18: P0-T5

- Added apps/worker: tsx dev, tsup build (bundles workspace TS packages), start script, and a tested registerShutdown helper (SIGINT/SIGTERM, ordered tasks, run-once, failure -> exit 1, timeout).
- Verified: lint, typecheck, 3 worker tests, `pnpm --filter @earshot/worker build`; built worker starts and prints ready.
- Note: real signal delivery cannot be tested from Git Bash on Windows; it is covered by unit tests and will be checked in Docker (P0-T7).
- Left half-done: nothing. Next: P0-T6.

## 2026-11-18: P0-T6

- Added zod-validated `loadEnv()` (DATABASE_URL, EARSHOT_SECRET >=32 chars, APP_URL, LOG_LEVEL; empty strings count as unset; reports all problems at once) and a pino `createLogger()` with secret redaction (top-level and nested keys, x-api-key header) to @earshot/core.
- Wired in: worker validates env at start and logs JSON via pino; web validates in instrumentation (Node-only file, skipped during `next build` so images build without secrets). Added .env.example.
- Decision: worker bundle includes all dependencies (tsup noExternal + createRequire banner) because workspace packages ship TS source. Revisit if a native add-on is added.
- Verified: lint, typecheck, tests pass; worker and the standalone web server both exit 1 with a readable message when env is missing; worker logs JSON when env is valid.
- Left half-done: nothing. Next: P0-T7.

## 2026-11-18: P0-T7

- Added docker-compose.yml (pgvector/pgvector:pg16 db with healthcheck, web, worker), multi-stage Dockerfiles for web (Next standalone, non-root, healthcheck on new /api/health route) and worker (tsup bundle, non-root), .dockerignore. Required EARSHOT_SECRET is enforced by compose.
- Decisions: db is published on 127.0.0.1:5433 by default (EARSHOT_DB_PORT) because 5432 clashed with a local Postgres here. Base image is a NODE_IMAGE build arg (default node:22-slim) so people behind TLS-intercepting proxies can supply their own. pnpm 12 fails installs on unapproved build scripts, so esbuild is allowed via allowBuilds in pnpm-workspace.yaml.
- Environment note: Norton Antivirus HTTPS scanning on this machine broke TLS inside containers. Fixed locally (not committed) with a local base image earshot-node-local that trusts the Norton root, selected through NODE_IMAGE in the gitignored .env. Certificate verification was not disabled.
- Verified end to end: `docker compose up --build -d` -> db, web healthy, worker running; /api/health returns ok, home page renders, pgvector 0.8.7 available, `docker compose stop worker` logs 'shutting down (SIGTERM)' and exits 0 (real signal handling confirmed). Stack stopped afterwards (volume kept).
- Left half-done: nothing. Next: P0-T8.
