# CLAUDE.md: Earshot

Earshot is a self-hosted, open-source app for solo founders and indie devs. It collects scattered user feedback, uses AI to group it into issues, ranks what to work on next, tracks progress, and drafts "you asked, we shipped" replies. Users run `docker compose up` and bring their own OpenAI key (BYOK). It is a resume project: code quality, tests and docs matter as much as features.

Source of truth: `docs/STACK.md`, `docs/FEATURES.md`, `docs/DESIGN.md`, `docs/PLAN.md`, `docs/PROGRESS.md`, `docs/DECISIONS.md`.

## Start of EVERY session

1. Read `CLAUDE.md`, `docs/PLAN.md` and `docs/PROGRESS.md`.
2. Tell the owner the next unchecked task (ID and title) and any half-done work noted in PROGRESS.md.
3. **Wait for "go"** before changing anything.

## Working rules

- One task at a time, in PLAN.md order.
- After each task:
  1. Run lint, typecheck and tests (`pnpm lint && pnpm typecheck && pnpm test`); fix failures.
  2. Tick the box in `docs/PLAN.md`.
  3. Append a dated entry to `docs/PROGRESS.md`: what changed, decisions made, anything left half-done.
  4. Commit (see Git below).
- If a session ends mid-task, write the exact stopping point and the next step in PROGRESS.md.
- Any decision that changes stack, features or design goes in `docs/DECISIONS.md` (short ADR: context, decision, consequences) and the affected doc is updated.
- Do not add features or tasks that are not in PLAN.md without asking.
- Tests are required for every task as listed in its "Tests" line. Code without tests is not done.

## Security and AI rules (non-negotiable)

- Never hardcode model names or secrets. Model names come from settings. Never commit `.env*` (except `.env.example`); keep `.env.example` updated when adding variables.
- All feedback text is **untrusted data**. It is always passed to LLMs inside delimited data blocks, never as instructions, and LLM output is validated with zod before use.
- AI **never auto-sends replies**. Reply drafts are for the owner to review and send manually.
- Secrets (API keys, tokens) are encrypted at rest (AES-256-GCM), never logged, never returned to the browser.
- CI must never call OpenAI; use the fake LLM provider.

## Code conventions

- TypeScript strict, no `any` without a comment explaining why.
- Validate all external input with zod at the boundary.
- Business logic lives in `packages/core`; apps are thin. No raw SQL in apps (use `packages/db` repositories).
- UI follows `docs/DESIGN.md`: tokens only (no hardcoded colors), lucide icons, no emoji icons, real buttons and labels, 44px touch targets, WCAG AA.
- Orange is only for spikes and negatives.

## Git

- Conventional Commits: `feat:`, `fix:`, `chore:`, `docs:`, `test:`, `refactor:`.
- One commit per completed task, message references the task ID, e.g. `feat(ingest): CSV upload [P2-T3]`.
- One branch per phase: `phase-0-setup`, `phase-1-schema`, and so on. When a phase is complete and all checks pass, ask the owner before merging to `main`.
- Never force-push, never rewrite history, never push to a remote unless the owner asks.

## Commands (updated as the repo grows)

- `pnpm install`: install dependencies
- `pnpm lint`, `pnpm format:check`, `pnpm typecheck`, `pnpm test`, `pnpm build`
- `docker compose up --build`: run the full stack
