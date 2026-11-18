# Decisions

Short ADRs. Newest at the bottom. Format: context, decision, consequences.

## ADR-001: Stack confirmed (2026-11-18)
- Context: initial project setup.
- Decision: see `docs/STACK.md` (Next.js, Drizzle, Postgres + pgvector, pg-boss, openai SDK behind `EarshotLLM`, better-auth, pnpm monorepo, ESLint + Prettier, MIT license).
- Consequences: all changes to the stack are recorded here.

## ADR-002: MVP scope (2026-11-18)
- Context: solo project, resume-quality goal.
- Decision: v0.1 ships CSV, webhook API, IMAP, widget, GitHub and Steam sources. Discord bot, own-site scraper, spike alerts, weekly digest, Cmd+K and SDKs are Later (see `docs/FEATURES.md`).
- Consequences: Discord alerts and digest are not in v0.1; PLAN.md has a backlog section for them.

## ADR-003: Darker orange for small text (2026-11-18)
- Context: brand orange `#E8590C` has about 3.3:1 contrast on the `#F6F6F3` ground, which fails WCAG AA for small text.
- Decision: keep `#E8590C` for graphics, icons, bars and large text; add `--orange-text: #B8470A` for small orange text.
- Consequences: two orange tokens exist; orange remains reserved for spikes and negatives.
