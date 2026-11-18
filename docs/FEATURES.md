# Earshot Features

Status: confirmed by the project owner. Changes go through `docs/DECISIONS.md`.

## Sources

| #   | Feature                                       | Release |
| --- | --------------------------------------------- | ------- |
| 1   | CSV upload                                    | MVP     |
| 2   | Generic webhook / REST ingest API             | MVP     |
| 3   | Email (IMAP)                                  | MVP     |
| 4   | Embeddable JS feedback widget                 | MVP     |
| 5   | GitHub Issues connector                       | MVP     |
| 6   | Steam reviews connector (IUserReviewsService) | MVP     |
| 7   | Discord bot                                   | Later   |
| 8   | Own-site scraper (CSS-selector config)        | Later   |
| 9   | Own-site scraper: AI selector detection       | Later   |
| 10  | Browser extension, Play Store, App Store      | Later   |

Out of scope: Reddit and X scraping.

## AI pipeline

| #   | Feature                                                                                                 | Release |
| --- | ------------------------------------------------------------------------------------------------------- | ------- |
| 11  | Classify in batches: type, severity, sentiment, language, English summary                               | MVP     |
| 12  | Embed the English summary (text-embedding-3-small, 512 dims)                                            | MVP     |
| 13  | Cluster into Issues: pgvector similarity + LLM check for borderline cases                               | MVP     |
| 14  | Score: mentions, recency, severity, paying users, trend velocity, with a visible "why it's ranked here" | MVP     |

## Product

| #   | Feature                                                                                           | Release |
| --- | ------------------------------------------------------------------------------------------------- | ------- |
| 15  | Dashboard: KPI cards, ranked top issues, sources, 8-week sentiment, feedback by type, latest feed | MVP     |
| 16  | Issues board: Triage → Planned → In progress → Shipped                                            | MVP     |
| 17  | Issue detail with right-hand properties panel                                                     | MVP     |
| 18  | Assign to me / assignee                                                                           | MVP     |
| 19  | Activity log and notes                                                                            | MVP     |
| 20  | Push issue to GitHub Issues                                                                       | MVP     |
| 21  | Mark shipped → reply drafts in the user's language (never auto-sent)                              | MVP     |
| 22  | Setup wizard with "Test connection"                                                               | MVP     |
| 23  | Settings: AES-256-GCM encrypted API key, model choice                                             | MVP     |
| 24  | Monthly budget cap and usage page                                                                 | MVP     |
| 25  | Multilingual support                                                                              | MVP     |
| 26  | Spike alerts (Discord webhook)                                                                    | Later   |
| 27  | Weekly digest                                                                                     | Later   |
| 28  | Cmd+K command palette                                                                             | Later   |

## Developer surface

| #   | Feature                                          | Release |
| --- | ------------------------------------------------ | ------- |
| 29  | Versioned REST API (`/api/v1`) with OpenAPI spec | MVP     |
| 30  | TypeScript SDK                                   | Later   |
| 31  | Python SDK                                       | Later   |

## Quality

| #   | Feature                                                                                                                               | Release |
| --- | ------------------------------------------------------------------------------------------------------------------------------------- | ------- |
| 32  | Eval harness (`pnpm eval`) on hand-labeled public Steam reviews: classification accuracy, clustering precision/recall, duplicate rate | MVP     |
| 33  | Demo seed data                                                                                                                        | MVP     |

## Non-negotiables

- Feedback text is untrusted data (prompt-injection safe).
- AI never auto-sends replies; every reply is a draft the owner approves.
- BYOK: no model name or secret is hardcoded.
