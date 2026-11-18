# Earshot Design Direction

No `docs/design/` mockups exist yet. If exported mockups are added later, they override this file where they differ.

## Inspiration (patterns only, no copied assets, logos or exact styles)

- **Notion:** calm, lots of whitespace, strong typography, quiet left sidebar, inline editing, Cmd+K command palette (Later, see FEATURES #28), empty states that teach.
- **Jira:** kanban board with columns and compact cards, issue detail with a right-hand properties panel (status, assignee, priority, linked ticket), activity timeline, filters such as "Only mine".

## Earshot's own look

- Warm light-grey ground, near-black ink, one blue accent.
- Orange is reserved for spikes and negatives. It never decorates.
- Inter for body, Space Grotesk for headings.
- Cards: 14px radius, 1px border, no shadows beyond a hairline, no gradients.
- Icons: lucide only. No emoji icons.

## Accessibility rules

- WCAG AA contrast for all text (4.5:1 normal, 3:1 large and UI graphics).
- Real `<button>`, `<a>`, `<label>` elements; never click handlers on `div`.
- Interactive targets are at least 44x44px.
- Visible focus ring on every interactive element.
- Layout works from 360px width up; sidebar collapses to a drawer on mobile, board columns scroll horizontally with snap.
- Status is never conveyed by color alone (always an icon or label).
- Respect `prefers-reduced-motion`.

## Contrast notes

Ratios are against the ground `#F6F6F3` unless stated.

| Pair                  | Ratio  | Use                                        |
| --------------------- | ------ | ------------------------------------------ |
| ink `#16181D`         | ~16:1  | body and headings                          |
| muted `#5B606B`       | ~5.8:1 | secondary text                             |
| accent `#3B5BDB`      | ~5.2:1 | links, primary actions                     |
| white on accent       | ~5.7:1 | primary button label                       |
| orange `#E8590C`      | ~3.3:1 | **graphics, icons, bars, large text only** |
| orange text `#B8470A` | ≥4.5:1 | small orange text (spike labels)           |

Orange `#E8590C` fails AA for small text, so small orange text uses the darker `--orange-text` token. This is a deliberate deviation from "orange #E8590C" and will be logged in `docs/DECISIONS.md`.

## Design tokens

### CSS variables (`apps/web/src/app/globals.css`)

```css
:root {
  /* surfaces */
  --ground: #f6f6f3;
  --surface: #ffffff;
  --surface-sunken: #efefea;
  --border: #e1e1da;
  --border-strong: #c9c9c0;

  /* text */
  --ink: #16181d;
  --ink-muted: #5b606b;
  --ink-on-accent: #ffffff;

  /* accent (one) */
  --accent: #3b5bdb;
  --accent-hover: #2f4bc0;
  --accent-soft: #e7ecfb;

  /* orange: spikes and negatives only */
  --orange: #e8590c;
  --orange-text: #b8470a;
  --orange-soft: #fdede3;

  /* semantic (non-orange, used sparingly) */
  --positive: #2b7a4b;
  --positive-soft: #e4f2ea;

  --focus-ring: #3b5bdb;
  --radius-card: 14px;
  --radius-control: 10px;
  --touch-target: 44px;

  --font-body: "Inter", system-ui, sans-serif;
  --font-heading: "Space Grotesk", "Inter", system-ui, sans-serif;
}
```

Dark mode is out of scope for v0.1.

### Tailwind theme (Tailwind v4, `@theme inline` in `apps/web/src/app/globals.css`)

Tailwind v4 is CSS-first, so there is no `tailwind.config.ts`. The theme maps the variables above to utilities
(`bg-ground`, `text-ink-muted`, `bg-accent`, `text-orange-text`, `rounded-card`, `font-heading`, `min-h-touch`, ...):

```css
@theme inline {
  --color-ground: var(--ground);
  --color-surface: var(--surface);
  --color-ink: var(--ink);
  --color-ink-muted: var(--ink-muted);
  --color-accent: var(--accent);
  --color-orange-text: var(--orange-text);
  --radius-card: var(--radius-card);
  --font-heading: var(--font-heading);
  --min-height-touch: var(--touch-target);
  /* ...full list in globals.css, including the shadcn/ui names */
}
```

shadcn/ui components are themed through these variables, not by editing component internals.

### Type scale

| Token     | Size / line height | Font          | Use              |
| --------- | ------------------ | ------------- | ---------------- |
| `display` | 28 / 36, 600       | Space Grotesk | page titles      |
| `h2`      | 20 / 28, 600       | Space Grotesk | section titles   |
| `h3`      | 16 / 24, 600       | Space Grotesk | card titles      |
| `body`    | 14 / 22, 400       | Inter         | default          |
| `small`   | 12 / 18, 500       | Inter         | metadata, badges |

### Spacing and layout

4px base grid. Page gutter 16px on phone, 32px on desktop. Sidebar 240px expanded. Content max width 1280px.

## Screens

### 1. Dashboard

- Row of KPI cards (new feedback this week, open issues, spiking issues, shipped this month).
- Ranked top issues table: rank, title, mentions, trend, score, "Assign to me" button.
- "Spiking since release" card (orange accent, with icon and text label).
- "Assigned to you" list with progress bars.
- Sources breakdown.
- 8-week sentiment chart (chart colors follow the `dataviz` skill; orange only for the negative series).
- Feedback by type.
- Latest feedback feed with original text and English translation toggle.
- Empty state: teaches how to add a first source.

### 2. Issues board (kanban)

- Columns: Triage, Planned, In progress, Shipped. Each header shows a count.
- Compact cards: title, score chip, mention count, source icons, assignee avatar.
- Filters: "Only mine", type, severity, source.
- Drag and drop with a keyboard-accessible "Move to" menu on each card.

### 3. Issue detail

- Main column: title and summary (inline editable), progress steps, user quotes (source, date, translation), score breakdown ("why it's ranked here"), mentions/day chart, activity timeline with notes, reply drafts.
- Right-hand properties panel: status, assignee, priority, linked GitHub issue, first/last seen.
- Reply drafts are shown in the user's language with an English reference and an explicit "Copy" action. Nothing is sent automatically.

## Components checklist

Sidebar, top bar, KPI card, data table, kanban column and card, status badge, score chip, progress steps, progress bar, quote block, activity item, properties panel, empty state, toast, dialog, command palette (Later).
