# Earshot

Hear what your users are asking for. Earshot is a self-hosted, open-source app for solo founders and indie developers (including indie game devs). It collects feedback scattered across many places, uses AI to group it into issues, ranks what to work on next, lets you assign and track progress, and drafts "you asked, we shipped" replies when something ships.

You install it with `docker compose up` and bring your own OpenAI API key. Your data stays on your machine.

> **Status: early development (Phase 0 of 9).** The repository skeleton, tooling, Docker stack and CI are in place. There are no product features yet. See [docs/PLAN.md](docs/PLAN.md) and [docs/PROGRESS.md](docs/PROGRESS.md).

## Planned features

- **Sources:** CSV upload, email (IMAP), webhook/REST ingest API, embeddable feedback widget, GitHub Issues, Steam reviews. Later: Discord bot, own-site scraper.
- **AI pipeline:** classify (type, severity, sentiment, language), embed, cluster into issues, score with a visible "why it's ranked here".
- **Product:** dashboard, issues board (Triage, Planned, In progress, Shipped), issue detail, assignment, activity log, push to GitHub Issues, reply drafts in the user's language (never auto-sent).
- **Quality:** an eval harness (`pnpm eval`) on hand-labeled public Steam reviews.

Full list with MVP/Later split: [docs/FEATURES.md](docs/FEATURES.md).

## Quick start (Docker)

Requirements: Docker with Compose v2.

```bash
git clone <this repo> earshot && cd earshot
cp .env.example .env
# Put a random secret in .env as EARSHOT_SECRET (at least 32 characters):
#   openssl rand -base64 32
docker compose up --build
```

Then open <http://localhost:3000>. The health endpoint is <http://localhost:3000/api/health>.

Postgres is published on `127.0.0.1:5433` (set `EARSHOT_DB_PORT` to change it).

## Local development

Requirements: Node 22, pnpm 12, Docker (for Postgres).

```bash
pnpm install
cp .env.example .env            # set EARSHOT_SECRET
docker compose up -d db         # Postgres 16 + pgvector on localhost:5433
pnpm --filter @earshot/web dev  # web on http://localhost:3000
pnpm --filter @earshot/worker dev
```

Checks (the same ones CI runs):

```bash
pnpm lint && pnpm format:check && pnpm typecheck && pnpm test && pnpm build
```

## Repository layout

| Path              | Purpose                                                |
| ----------------- | ------------------------------------------------------ |
| `apps/web`        | Next.js app (UI and `/api/v1`)                         |
| `apps/worker`     | Background worker (polling, AI pipeline, jobs)         |
| `packages/core`   | Business logic, env validation, logging, LLM interface |
| `packages/db`     | Drizzle schema, migrations, repositories               |
| `packages/widget` | Embeddable JavaScript feedback widget                  |
| `docs/`           | Stack, features, design, plan, progress log, decisions |

## Documentation

- [docs/STACK.md](docs/STACK.md): tech stack
- [docs/FEATURES.md](docs/FEATURES.md): features and release scope
- [docs/DESIGN.md](docs/DESIGN.md): design direction and tokens
- [docs/PLAN.md](docs/PLAN.md): implementation plan
- [docs/PROGRESS.md](docs/PROGRESS.md): progress log
- [docs/DECISIONS.md](docs/DECISIONS.md): architecture decisions

## Security notes

- Your OpenAI key and connector tokens are encrypted at rest with a key derived from `EARSHOT_SECRET`. Keep that value safe; losing it makes stored secrets unrecoverable.
- All feedback text is treated as untrusted data. AI never sends replies on its own.

## License

[MIT](LICENSE)
