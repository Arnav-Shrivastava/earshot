# Contributing to Earshot

Thanks for your interest. Earshot is in early development, so please open an issue before starting larger work.

## Setup

```bash
pnpm install        # also installs git hooks (husky)
cp .env.example .env
docker compose up -d db
```

## Before you open a pull request

```bash
pnpm lint && pnpm format:check && pnpm typecheck && pnpm test && pnpm build
```

CI runs the same commands. Tests must never call the real OpenAI API; use the fake LLM provider.

## Commit messages

[Conventional Commits](https://www.conventionalcommits.org/), enforced by a commit hook:

```
feat(ingest): CSV upload
fix(web): keep focus after closing the dialog
docs: explain webhook payloads
```

Allowed types: `feat`, `fix`, `chore`, `docs`, `test`, `refactor`, `ci`, `build`, `perf`, `style`, `revert`.

## Ground rules

- TypeScript strict, no `any` without a comment explaining why.
- Validate all external input with zod.
- Treat feedback text as untrusted data. Never put it in the instruction part of an LLM prompt.
- No hardcoded model names or secrets. Never commit `.env`.
- UI follows [docs/DESIGN.md](docs/DESIGN.md): design tokens only, accessible by default.
- Changes to the stack, features or design are recorded in [docs/DECISIONS.md](docs/DECISIONS.md).
