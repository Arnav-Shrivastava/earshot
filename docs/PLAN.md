# Earshot Implementation Plan

Scope: MVP rows of `docs/FEATURES.md`. "Later" features are in the backlog at the end.
Each task is at most about 2 hours and independently testable. Task IDs are used in commit messages, e.g. `feat(ingest): CSV upload [P2-T3]`.
Each phase lives on its own branch (`phase-0-setup`, `phase-1-schema`, ...). Ask the owner before merging a finished phase to `main`.

Legend per task: **Goal** · **Files** · **Done when** · **Tests**.

---

## Phase 0: Repo setup (branch `phase-0-setup`)

- [x] **P0-T1 Workspace root**
  - Goal: pnpm monorepo with shared TypeScript config.
  - Files: `package.json`, `pnpm-workspace.yaml`, `tsconfig.base.json`, `.nvmrc` (22), `.editorconfig`.
  - Done when: `pnpm install` succeeds and `pnpm -r typecheck` runs across empty packages.
  - Tests: none (config only); verified by running `pnpm -r typecheck`.

- [x] **P0-T2 Lint, format, commit hooks**
  - Goal: ESLint (flat config, typescript-eslint), Prettier, husky, lint-staged, commitlint (Conventional Commits).
  - Files: `eslint.config.mjs`, `.prettierrc`, `.prettierignore`, `commitlint.config.mjs`, `.husky/*`, root scripts `lint`, `format`, `format:check`.
  - Done when: `pnpm lint` and `pnpm format:check` pass; a bad commit message is rejected by the hook.
  - Tests: run commitlint against one valid and one invalid message.

- [x] **P0-T3 Package skeletons with Vitest**
  - Goal: `packages/core`, `packages/db`, `packages/widget` as empty buildable TS packages, each with a trivial passing test.
  - Files: `packages/*/package.json`, `tsconfig.json`, `src/index.ts`, `vitest.config.ts`, root `vitest.workspace.ts`.
  - Done when: `pnpm test` runs all three and passes; packages import each other through workspace names.
  - Tests: one smoke test per package; one test proving `apps/*` can import `@earshot/core`.

- [x] **P0-T4 Web app skeleton**
  - Goal: Next.js App Router + Tailwind + shadcn/ui configured with design tokens from `docs/DESIGN.md`.
  - Files: `apps/web/*`, `globals.css`, `tailwind.config.ts`, `components.json`, Inter and Space Grotesk via `next/font`, a placeholder home page.
  - Done when: `pnpm --filter web dev` serves a page using the Earshot ground color and fonts; `pnpm --filter web build` passes.
  - Tests: Vitest render test of the placeholder page; a test asserting the tokens exist in `globals.css`.

- [x] **P0-T5 Worker skeleton**
  - Goal: Node/TS worker process that starts, logs, and shuts down gracefully (pg-boss wired in P1).
  - Files: `apps/worker/package.json`, `src/index.ts`, `src/shutdown.ts`.
  - Done when: `pnpm --filter worker dev` starts and exits cleanly on SIGINT/SIGTERM.
  - Tests: unit test for the shutdown handler.

- [x] **P0-T6 Env validation and logging**
  - Goal: zod-validated environment shared by web and worker; pino logger factory.
  - Files: `packages/core/src/env.ts`, `packages/core/src/logger.ts`, `.env.example`.
  - Done when: starting either app with a missing required variable fails with a clear message; secrets are redacted from logs.
  - Tests: env parsing (valid, missing, malformed); logger redaction test.

- [x] **P0-T7 Docker and compose**
  - Goal: `docker compose up` starts Postgres 16 + pgvector, web and worker.
  - Files: `docker-compose.yml`, `apps/web/Dockerfile`, `apps/worker/Dockerfile`, `.dockerignore`, healthchecks.
  - Done when: `docker compose up --build` brings all three services up healthy and the web placeholder loads on `localhost:3000`.
  - Tests: manual smoke documented in the README; `docker compose config` validated in CI.

- [x] **P0-T8 CI**
  - Goal: GitHub Actions workflow running install, lint, format check, typecheck, test, build.
  - Files: `.github/workflows/ci.yml`, pnpm and Playwright caches.
  - Done when: workflow file validates and the same commands pass locally.
  - Tests: run `pnpm lint && pnpm typecheck && pnpm test && pnpm build` locally as the CI dry-run.

- [x] **P0-T9 Repo docs skeleton**
  - Goal: README skeleton, MIT LICENSE, CONTRIBUTING (`docs/DECISIONS.md` and `CLAUDE.md` already exist).
  - Files: `README.md`, `LICENSE`, `CONTRIBUTING.md`.
  - Done when: README explains what Earshot is, the quick start, the repo layout and current status.
  - Tests: none; links checked manually.

---

## Phase 1: Database schema, migrations, seed (branch `phase-1-schema`)

- [ ] **P1-T1 DB package and migration runner**
  - Goal: Drizzle config, connection factory, migration runner, pgvector extension migration.
  - Files: `packages/db/drizzle.config.ts`, `src/client.ts`, `src/migrate.ts`, `drizzle/0000_extensions.sql`.
  - Done when: `pnpm db:migrate` creates the `vector` extension on a fresh Postgres.
  - Tests: integration test using a real Postgres 16 + pgvector container (Testcontainers) running migrations twice (idempotent).

- [ ] **P1-T2 Sources and feedback tables**
  - Goal: `sources` (type, config, sync cursor, status) and `feedback_items` (raw text, normalized fields, content hash, classification columns, `embedding vector(512)`).
  - Files: `packages/db/src/schema/sources.ts`, `feedback.ts`, migration.
  - Done when: migration applies; unique constraint on `(source_id, external_id)` and index on content hash exist.
  - Tests: insert and duplicate-rejection tests; vector column round-trip.

- [ ] **P1-T3 Issues tables**
  - Goal: `issues` (title, summary, status, priority, assignee, score and score breakdown JSON, centroid embedding), `issue_feedback` join, `issue_events` activity log, `notes`.
  - Files: `packages/db/src/schema/issues.ts`, migration.
  - Done when: status enum covers Triage, Planned, In progress, Shipped; HNSW index on centroid.
  - Tests: constraint tests; nearest-neighbour query test on seeded vectors.

- [ ] **P1-T4 Settings, usage, drafts, auth, API keys tables**
  - Goal: `settings` (single row, encrypted key column), `llm_usage`, `reply_drafts`, `api_keys` (hashed), better-auth tables.
  - Files: `packages/db/src/schema/settings.ts`, `usage.ts`, `drafts.ts`, `auth.ts`.
  - Done when: all migrations apply from scratch and `drizzle-kit check` reports no drift.
  - Tests: migration-drift check in CI; basic insert tests.

- [ ] **P1-T5 pg-boss wiring**
  - Goal: worker connects to pg-boss, registers a no-op `health.ping` job, and web can enqueue to it.
  - Files: `packages/core/src/queue.ts`, `apps/worker/src/index.ts`.
  - Done when: enqueuing `health.ping` from a script results in the worker logging it.
  - Tests: integration test enqueue, process, complete against the test container.

- [ ] **P1-T6 Typed repositories**
  - Goal: small repository functions (feedback, issues, settings) used by core, no raw SQL in apps.
  - Files: `packages/db/src/repos/*.ts`.
  - Done when: repositories cover create/list/update used by Phases 2 to 5.
  - Tests: integration tests per repository.

- [ ] **P1-T7 Seed data**
  - Goal: `pnpm db:seed` creates a realistic demo dataset (indie game: sources, ~150 feedback items in several languages, issues, assignments, 8 weeks of history).
  - Files: `packages/db/src/seed/*.ts`, `seed-data/*.json`.
  - Done when: seeding is idempotent and the dataset is deterministic.
  - Tests: seed twice yields identical row counts; snapshot of counts by status.

---

## Phase 2: Ingest (branch `phase-2-ingest`)

- [ ] **P2-T1 Owner auth**
  - Goal: better-auth with a single owner account created on first run; later sign-ups disabled.
  - Files: `apps/web/src/lib/auth.ts`, `app/api/auth/[...all]/route.ts`, sign-in and first-run pages.
  - Done when: first visitor creates the owner; second sign-up attempt is refused; protected routes redirect.
  - Tests: integration tests for first-run, repeat sign-up refusal, unauthenticated redirect.

- [ ] **P2-T2 Ingest service and dedupe**
  - Goal: core `ingestFeedback()` that validates, normalizes, dedupes by content hash and external id, stores, and enqueues classification.
  - Files: `packages/core/src/ingest/*.ts`, zod schemas.
  - Done when: duplicates are skipped and counted; text length is capped; HTML is stripped.
  - Tests: unit tests (normalization, hashing) and integration test (dedupe, enqueue).

- [ ] **P2-T3 CSV upload**
  - Goal: upload a CSV, map columns (text, author, date, external id, paying flag), preview, import.
  - Files: `packages/core/src/ingest/csv.ts`, `apps/web/src/app/(app)/sources/csv/*`.
  - Done when: a 5,000-row CSV imports without loading it all in memory; bad rows are reported, not fatal.
  - Tests: parser tests (quotes, BOM, UTF-8, malformed rows); route test with a fixture file.

- [ ] **P2-T4 API key management**
  - Goal: create and revoke API keys (shown once, stored hashed) for the ingest API and widget.
  - Files: `packages/core/src/apikeys.ts`, settings UI stub, route handlers.
  - Done when: key verification is constant-time; revoked keys fail.
  - Tests: unit tests (hash, verify, revoke); route auth tests.

- [ ] **P2-T5 Webhook / REST ingest endpoint**
  - Goal: `POST /api/v1/feedback` (single and batch) authenticated by API key, with rate limiting.
  - Files: `apps/web/src/app/api/v1/feedback/route.ts`, `packages/core/src/ratelimit.ts`.
  - Done when: valid payloads return 202 with ids; invalid return structured 422 errors.
  - Tests: route tests for success, auth failure, validation, rate limit, batch limit.

- [ ] **P2-T6 OpenAPI spec**
  - Goal: generate `/api/v1/openapi.json` from the zod schemas.
  - Files: `packages/core/src/openapi.ts`, route, `pnpm openapi:generate`.
  - Done when: the spec validates against the OpenAPI 3.1 schema and is checked into `docs/openapi.json` with a CI drift check.
  - Tests: spec validation test; drift test.

- [ ] **P2-T7 Source sync framework**
  - Goal: generic connector interface (`poll(cursor) -> items, nextCursor`), scheduled by pg-boss with per-source state and error backoff.
  - Files: `packages/core/src/connectors/types.ts`, `apps/worker/src/jobs/sync-source.ts`.
  - Done when: a fake connector can be scheduled, advances its cursor, and records failures.
  - Tests: unit tests with a fake connector; integration test of cursor persistence.

- [ ] **P2-T8 Email (IMAP) connector**
  - Goal: poll a mailbox folder with imapflow, ingest new messages (subject plus text body, quoted replies trimmed).
  - Files: `packages/core/src/connectors/imap.ts`, `src/connectors/imap.test.ts`, fixtures.
  - Done when: connector uses UID cursor, handles UIDVALIDITY change, and has a `testConnection()`.
  - Tests: parsing tests with sample RFC 822 fixtures; connector logic tested against a mocked imapflow client.

---

## Phase 3: AI pipeline (branch `phase-3-pipeline`)

- [ ] **P3-T1 `EarshotLLM` interface and fake provider**
  - Goal: interface for `classify`, `embed`, `compare`, `draftReply`; deterministic fake provider for tests and CI.
  - Files: `packages/core/src/llm/types.ts`, `fake.ts`.
  - Done when: fake returns stable output from a keyword and hash scheme and consistent vectors.
  - Tests: determinism tests; similar texts give closer fake vectors than unrelated texts.

- [ ] **P3-T2 OpenAI provider**
  - Goal: implementation with the `openai` SDK, zod structured outputs, model names read from settings, retries with backoff, token usage recorded.
  - Files: `packages/core/src/llm/openai.ts`, `usage.ts`.
  - Done when: every call writes an `llm_usage` row; no model string literal exists in code.
  - Tests: MSW-mocked OpenAI responses (success, 429, malformed JSON, refusal); a lint-style test that greps for hardcoded model names.

- [ ] **P3-T3 Prompt-injection-safe prompt builder**
  - Goal: feedback text always placed in delimited data blocks with system instructions to treat it as data; output limited to schema; no tool or URL following.
  - Files: `packages/core/src/llm/prompts.ts`.
  - Done when: a corpus of injection strings ("ignore previous instructions...") never alters the structured output schema or leaks into other fields.
  - Tests: injection corpus run through the fake and recorded OpenAI fixtures; delimiter-escape tests.

- [ ] **P3-T4 Batch classification**
  - Goal: classify feedback in batches (type, severity, sentiment, language, English summary) and store results.
  - Files: `packages/core/src/pipeline/classify.ts`, worker job `pipeline.classify`.
  - Done when: batch size is configurable; partial failures retry only failed items; invalid output marks the item for retry, not garbage.
  - Tests: unit tests with fake LLM; integration test for retry of a single failing item.

- [ ] **P3-T5 Embedding step**
  - Goal: embed the English summary at 512 dims and store.
  - Files: `packages/core/src/pipeline/embed.ts`, job `pipeline.embed`.
  - Done when: already-embedded items are skipped; dimension mismatch throws.
  - Tests: unit and integration tests with fake embeddings.

- [ ] **P3-T6 Clustering by similarity**
  - Goal: assign each item to the nearest issue above a high threshold, create a new issue below a low threshold, flag the band between as borderline.
  - Files: `packages/core/src/pipeline/cluster.ts`, thresholds in settings with defaults.
  - Done when: centroid updates incrementally; item-to-issue membership is stored with similarity.
  - Tests: integration tests on seeded vectors covering join, create and borderline.

- [ ] **P3-T7 LLM check for borderline cases**
  - Goal: ask the LLM "same issue?" for borderline pairs and join or create accordingly; generate issue title and summary for new issues.
  - Files: `packages/core/src/pipeline/borderline.ts`.
  - Done when: borderline decisions and reasons are stored in the activity log.
  - Tests: fake LLM yes/no paths; recorded OpenAI fixture test.

- [ ] **P3-T8 Scoring with explanation**
  - Goal: score = weighted mentions, recency decay, severity, paying users, trend velocity; store the per-factor breakdown and a one-line "why".
  - Files: `packages/core/src/pipeline/score.ts`, weights in settings.
  - Done when: score is a pure function; breakdown sums to the score.
  - Tests: table-driven unit tests; property test (more mentions never lowers score, all else equal).

- [ ] **P3-T9 Pipeline orchestration**
  - Goal: ingest → classify → embed → cluster → score chained via pg-boss, with idempotency and a manual "reprocess" job.
  - Files: `apps/worker/src/jobs/pipeline.ts`.
  - Done when: ingesting 50 items end to end with the fake LLM yields issues with scores.
  - Tests: end-to-end integration test (fake LLM, real Postgres).

- [ ] **P3-T10 Cost tracking and budget hook**
  - Goal: estimate cost per call from a pricing table in settings; a `BudgetGuard` interface the pipeline checks before each LLM call (cap UI comes in P8).
  - Files: `packages/core/src/llm/budget.ts`.
  - Done when: exceeding the cap pauses pipeline jobs and records why.
  - Tests: unit tests for cost estimate and guard decisions.

---

## Phase 4: Eval harness (branch `phase-4-eval`)

- [ ] **P4-T1 Dataset format and fetch tool**
  - Goal: JSONL label format and a script that fetches public Steam reviews for chosen app ids.
  - Files: `packages/core/src/eval/dataset.ts`, `scripts/eval/fetch-steam.ts`, `docs/EVAL.md`.
  - Done when: a fetch writes a deduped JSONL with review text, language and id; respects Steam rate limits.
  - Tests: MSW-mocked Steam response; schema validation tests.

- [ ] **P4-T2 Labeling tool and labeled set**
  - Goal: a small CLI (or local page) to label type, severity, sentiment and a cluster id; produce ~200 labeled reviews committed under `eval/data/`.
  - Files: `scripts/eval/label.ts`, `eval/data/steam-labeled.jsonl`.
  - Done when: file validates; every label has a cluster id. The owner does the hand-labeling; Claude can pre-label drafts for review.
  - Tests: validator test for the label schema.

- [ ] **P4-T3 Metrics**
  - Goal: classification accuracy per field, clustering precision/recall (pairwise), duplicate rate (issues that should have merged).
  - Files: `packages/core/src/eval/metrics.ts`.
  - Done when: metrics are pure and documented.
  - Tests: unit tests on hand-computed tiny examples.

- [ ] **P4-T4 `pnpm eval` runner**
  - Goal: runs the real pipeline on the labeled set with the configured provider and prints a table plus JSON report.
  - Files: `scripts/eval/run.ts`, root script `eval`, `eval/reports/.gitkeep`.
  - Done when: `pnpm eval --provider fake` works offline; `--provider openai` uses the owner's key.
  - Tests: runner test with the fake provider on a 10-item subset.

- [ ] **P4-T5 Eval in CI**
  - Goal: CI runs `pnpm eval --provider fake --subset` as a smoke test and fails on crashes (not on score).
  - Files: `.github/workflows/ci.yml`.
  - Done when: CI job is green; README shows how to run the real eval and records the first baseline in `docs/EVAL.md`.
  - Tests: the CI step itself.

---

## Phase 5: UI (branch `phase-5-ui`)

- [ ] **P5-T1 App shell**
  - Goal: authenticated layout with quiet left sidebar, top bar, mobile drawer.
  - Files: `apps/web/src/app/(app)/layout.tsx`, `components/sidebar.tsx`, `topbar.tsx`.
  - Done when: navigation works at 360px and 1280px; focus order is logical.
  - Tests: component tests; axe accessibility check on the shell.

- [ ] **P5-T2 Core UI components**
  - Goal: KPI card, status badge, score chip, progress bar, empty state, quote block, properties panel, data table, built on shadcn.
  - Files: `apps/web/src/components/ui/*`, `components/earshot/*`.
  - Done when: all components follow `docs/DESIGN.md`; touch targets at least 44px.
  - Tests: render tests; axe checks; contrast test of token pairs.

- [ ] **P5-T3 Dashboard data layer**
  - Goal: typed queries for KPIs, top issues, spiking issues, assigned-to-me, source breakdown, weekly sentiment, type breakdown, latest feed.
  - Files: `packages/core/src/queries/dashboard.ts`.
  - Done when: each query returns correct results on the seed dataset.
  - Tests: integration tests against the seeded database.

- [ ] **P5-T4 Dashboard page, part 1**
  - Goal: KPI cards, ranked top issues table with "Assign to me", spiking card, assigned-to-you progress.
  - Files: `apps/web/src/app/(app)/page.tsx` and section components.
  - Done when: matches the design for desktop and phone; empty states teach next steps.
  - Tests: component tests; server action test for assign.

- [ ] **P5-T5 Dashboard page, part 2**
  - Goal: sources breakdown, 8-week sentiment chart, feedback by type, latest feed with original/translation toggle.
  - Files: dashboard section components; charts follow the `dataviz` skill.
  - Done when: charts have accessible text alternatives and a data table fallback.
  - Tests: component tests; translation toggle test.

- [ ] **P5-T6 Issues board**
  - Goal: kanban with four columns, compact cards, "Only mine" and other filters, drag and drop plus keyboard "Move to" menu.
  - Files: `apps/web/src/app/(app)/issues/page.tsx`, `components/board/*`.
  - Done when: moving a card persists status and writes an activity event.
  - Tests: server action tests; component test of the keyboard path.

- [ ] **P5-T7 Issue detail page**
  - Goal: summary (inline editable), properties panel, progress steps, quotes with source and translation, score breakdown, mentions/day chart.
  - Files: `apps/web/src/app/(app)/issues/[id]/page.tsx` and components.
  - Done when: edits persist; the score "why" is visible.
  - Tests: component tests; integration test of inline edit action.

- [ ] **P5-T8 Assignment, status, notes, activity**
  - Goal: assign to me / assignee, status changes, notes, activity timeline.
  - Files: server actions in `apps/web/src/app/(app)/issues/actions.ts`, `packages/core/src/issues/*.ts`.
  - Done when: every change creates an activity event with actor and timestamp.
  - Tests: unit tests of the issue service; integration tests of actions.

- [ ] **P5-T9 Responsive and accessibility pass**
  - Goal: audit all screens at 360, 768 and 1280px; keyboard-only run-through.
  - Files: fixes across `apps/web`.
  - Done when: no axe violations on the three screens; no horizontal page scroll at 360px.
  - Tests: Playwright + axe tests for the three screens at three widths.

---

## Phase 6: Connectors (branch `phase-6-connectors`)

- [ ] **P6-T1 GitHub Issues source**
  - Goal: poll issues and comments from a configured repo as feedback (PRs excluded), with ETag caching.
  - Files: `packages/core/src/connectors/github.ts`, fixtures.
  - Done when: honors rate limits; `testConnection()` validates token scope.
  - Tests: MSW recorded fixtures (success, 304, 403 rate limit, 404).

- [ ] **P6-T2 Steam reviews source**
  - Goal: poll `IUserReviewsService` for an app id with cursor, language, and playtime and purchase metadata.
  - Files: `packages/core/src/connectors/steam.ts`, fixtures.
  - Done when: cursor resumes correctly; "recommended" flag is stored as metadata.
  - Tests: MSW recorded fixtures including pagination and empty page.

- [ ] **P6-T3 Embeddable widget**
  - Goal: tiny vanilla-JS widget (button, form, optional email, success state) that posts to the ingest API with a public widget key.
  - Files: `packages/widget/src/*`, build output `widget.js` served by web.
  - Done when: under 10 KB gzipped; works in a plain HTML page; styles are isolated (shadow DOM).
  - Tests: Vitest + jsdom tests; Playwright test on a fixture page.

- [ ] **P6-T4 Widget security**
  - Goal: public widget keys are write-only, origin-allowlisted and rate limited; honeypot field.
  - Files: `packages/core/src/apikeys.ts`, `apps/web/src/app/api/v1/widget/route.ts`.
  - Done when: a request from a disallowed origin is rejected; key cannot read anything.
  - Tests: route tests for origin, rate limit, honeypot.

- [ ] **P6-T5 Source management UI**
  - Goal: add, edit, pause, delete sources; show last sync and errors; "Test connection" button.
  - Files: `apps/web/src/app/(app)/sources/*`.
  - Done when: each MVP connector can be configured from the UI.
  - Tests: component and server action tests.

---

## Phase 7: Close the loop (branch `phase-7-loop`)

- [ ] **P7-T1 GitHub client**
  - Goal: shared GitHub REST client (create issue, add comment, get issue) used by the connector and push.
  - Files: `packages/core/src/github/client.ts`.
  - Done when: typed, retry-aware, token never logged.
  - Tests: MSW tests for each call and error mapping.

- [ ] **P7-T2 Push issue to GitHub**
  - Goal: "Push to GitHub" on issue detail creates a GitHub issue with summary, quotes and a link back; stores the link.
  - Files: `packages/core/src/issues/push-github.ts`, UI button.
  - Done when: pushing twice is blocked (idempotent); link shows in the properties panel.
  - Tests: MSW integration test; idempotency test.

- [ ] **P7-T3 Mark shipped**
  - Goal: set status to Shipped with release note text and shipped date; record in the activity log; queue reply drafts.
  - Files: `packages/core/src/issues/ship.ts`, UI dialog.
  - Done when: shipping is only possible from In progress or Planned; drafts are generated for each unique feedback author.
  - Tests: unit tests of transitions; integration test queuing drafts.

- [ ] **P7-T4 Reply draft generation**
  - Goal: "You asked, we shipped" drafts in the language of the original feedback, using the injection-safe prompt builder.
  - Files: `packages/core/src/pipeline/drafts.ts`, job `drafts.generate`.
  - Done when: each draft stores language, text and source link; AI never sends anything.
  - Tests: fake LLM tests per language; injection corpus test; test proving no code path sends a reply.

- [ ] **P7-T5 Draft review UI**
  - Goal: view, edit, copy and mark drafts as sent manually; English reference shown.
  - Files: `apps/web/src/app/(app)/issues/[id]/drafts.tsx`.
  - Done when: edits persist and "marked sent" is recorded with a timestamp.
  - Tests: component and action tests.

---

## Phase 8: Setup wizard, settings, BYOK (branch `phase-8-settings`)

- [ ] **P8-T1 AES-256-GCM secret storage**
  - Goal: encrypt the OpenAI key and connector secrets with a key derived from `EARSHOT_SECRET`; random IV per value; versioned format.
  - Files: `packages/core/src/crypto.ts`, settings repository.
  - Done when: DB dumps never contain plaintext secrets; tampering is detected.
  - Tests: round-trip, wrong key, tampered ciphertext, IV uniqueness.

- [ ] **P8-T2 Settings page**
  - Goal: set API key (masked), model choices for classify/embed/draft, thresholds, scoring weights.
  - Files: `apps/web/src/app/(app)/settings/*`.
  - Done when: key is never sent back to the browser after save.
  - Tests: action tests; test asserting the key is absent from the rendered HTML.

- [ ] **P8-T3 Test connection**
  - Goal: "Test connection" for OpenAI, IMAP, GitHub and Steam returning a clear success or reason.
  - Files: `packages/core/src/connectors/*.testConnection`, UI button.
  - Done when: errors are human readable and never echo secrets.
  - Tests: MSW tests for success, auth failure, network failure.

- [ ] **P8-T4 Setup wizard**
  - Goal: first-run flow: owner account → OpenAI key → first source → import → first results.
  - Files: `apps/web/src/app/(setup)/*`.
  - Done when: a fresh install reaches a populated dashboard through the wizard with the fake provider.
  - Tests: Playwright wizard test with the fake provider.

- [ ] **P8-T5 Budget cap**
  - Goal: monthly USD cap in settings enforced by the `BudgetGuard`; warnings at 80%.
  - Files: `packages/core/src/llm/budget.ts`, settings UI.
  - Done when: hitting the cap pauses the pipeline and shows a banner; raising the cap resumes.
  - Tests: unit and integration tests around the threshold.

- [ ] **P8-T6 Usage page**
  - Goal: per-day and per-model tokens and estimated cost for the current month.
  - Files: `apps/web/src/app/(app)/usage/page.tsx`, `queries/usage.ts`.
  - Done when: numbers match `llm_usage` rows.
  - Tests: query integration test; component test.

---

## Phase 9: Hardening and release (branch `phase-9-release`)

- [ ] **P9-T1 E2E suite**
  - Goal: Playwright flows: setup, CSV import, pipeline completes, assign, move to Shipped, view drafts.
  - Files: `e2e/*.spec.ts`, CI job with compose stack and the fake provider.
  - Done when: suite is green in CI.
  - Tests: the suite itself.

- [ ] **P9-T2 Security review**
  - Goal: check auth on every route, SSRF in connectors, secret leakage, rate limits, injection corpus.
  - Files: fixes plus `docs/SECURITY.md`.
  - Done when: checklist complete and issues fixed or logged.
  - Tests: regression tests for each fix.

- [ ] **P9-T3 Demo seed and screenshots**
  - Goal: `pnpm demo` loads the demo dataset; capture screenshots for the README.
  - Files: `scripts/demo.ts`, `docs/images/*`.
  - Done when: a new clone reaches a full demo in two commands.
  - Tests: demo script run in CI.

- [ ] **P9-T4 Documentation**
  - Goal: complete README, `docs/ARCHITECTURE.md` (with diagram), `docs/API.md`, `docs/CONNECTORS.md`, `docs/EVAL.md` results.
  - Files: docs.
  - Done when: a stranger can install and ingest feedback from the docs alone.
  - Tests: link checker in CI.

- [ ] **P9-T5 Release v0.1**
  - Goal: changelog, version tags, published Docker images workflow, GitHub release notes.
  - Files: `CHANGELOG.md`, `.github/workflows/release.yml`.
  - Done when: `v0.1.0` tag builds images; fresh `docker compose up` works from the README.
  - Tests: clean-clone install test.

---

## Backlog (Later, not in v0.1)

- [ ] **L-1** Discord bot (discord.js in worker) as a source
- [ ] **L-2** Own-site scraper with CSS-selector config (Cheerio, Playwright for JS pages)
- [ ] **L-3** AI selector detection for the scraper
- [ ] **L-4** Spike alerts to a Discord webhook
- [ ] **L-5** Weekly digest
- [ ] **L-6** Cmd+K command palette
- [ ] **L-7** TypeScript SDK generated from the OpenAPI spec
- [ ] **L-8** Python SDK generated from the OpenAPI spec
- [ ] **L-9** Browser extension, Play Store and App Store sources
