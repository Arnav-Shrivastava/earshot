# Earshot Tech Stack

Status: confirmed by the project owner. Changes go through `docs/DECISIONS.md`.

## Runtime and layout
| Area | Choice |
| --- | --- |
| Language | TypeScript (strict), Node 22 LTS |
| Package manager | pnpm workspaces |
| Monorepo | `apps/web`, `apps/worker`, `packages/core`, `packages/db`, `packages/widget` |
| Deployment | `docker compose up` (web, worker, Postgres 16 + pgvector) |

## App
| Area | Choice |
| --- | --- |
| App + API | Next.js (App Router) |
| UI | Tailwind CSS + shadcn/ui, lucide icons |
| Auth | better-auth, single owner account, self-hosted |
| API | Versioned REST at `/api/v1`, OpenAPI spec generated with `@asteasolutions/zod-to-openapi` |
| Validation | zod everywhere, including env validation at startup |
| Logging | pino |

## Data and jobs
| Area | Choice |
| --- | --- |
| Database | Postgres 16 + pgvector |
| ORM / migrations | Drizzle |
| Job queue | pg-boss (no Redis) |
| Worker | Separate Node/TS process: polling connectors, AI pipeline, Discord bot |

## AI (BYOK)
- Official `openai` SDK only, wrapped by our own `EarshotLLM` interface.
- Structured outputs validated with zod.
- Embeddings: `text-embedding-3-small` at 512 dimensions.
- Model names come from settings, never hardcoded.
- API key stored encrypted with AES-256-GCM.
- A fake LLM provider implements `EarshotLLM` for tests and CI.

## Connectors
| Source | Library |
| --- | --- |
| Email | imapflow |
| Discord | discord.js |
| GitHub Issues | GitHub REST (plain `fetch`) |
| Steam reviews | Steam `IUserReviewsService` |
| Own-site scraper | Cheerio + Playwright |
| CSV / webhook / widget | Built in (`packages/widget` for the embeddable JS) |

## Testing
- Vitest (unit and integration)
- MSW with recorded API fixtures
- Playwright (E2E)
- Fake LLM provider so CI never calls OpenAI
- `pnpm eval` harness (see `docs/FEATURES.md`)

## Tooling and CI
- ESLint + Prettier
- husky + lint-staged + commitlint (Conventional Commits)
- GitHub Actions: lint, typecheck, test, build
- License: **MIT**
