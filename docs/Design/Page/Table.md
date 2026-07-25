# Design: the Table Page

One design, one implementation, for every paginated table in WeKan: a title, an
optional status line, a controls row (search + pagination) and a table of rows.

This page is the **single source** for everything those pages have in common.
A page-specific design doc describes only what is different about *that* page and
links back here — it must not restate the layout, the controls or the paging
rules, because they are defined once, here and in one template.

## Related files

Everything that makes a table page work. Paths are from the repository root.

| File Path | File Type | Description |
| --- | --- | --- |
| `client/components/settings/tablePage.jade` | `.jade` template | **The** table page: title, optional status row, controls, table. The row order is defined here, once. |
| `client/components/settings/tablePage.css` | `.css` stylesheet | The **layout**: full width, equal columns, wrapping cells, and the ≤ 800px stacking of menu and table. No button colours — see the next row. |
| `client/components/main/paginationControls.css` | `.css` stylesheet | The **colours** of every prev/next pager in WeKan, table pages included: the per-user theme accent, falling back to the WeKan default blue. |
| `client/components/forms/forms.css` | `.css` stylesheet | The global `button` rules the pager stylesheet has to out-specify. Read the note in `paginationControls.css` before touching either. |
| `models/lib/tablePage.js` | `.js` module, pure helpers | `pageInfo()`, `buildRows()`, `buildHeader()`, `columnWidthPercent()`. No DOM and no database, so they are unit-testable. |
| `client/components/settings/adminReports.js` | `.js` Blaze template logic | The column spec for each Admin Panel table, the paging state, the subscriptions, and the shared control handlers. |
| `client/components/settings/adminReports.jade` | `.jade` template | Admin Panel / Problems: the side menu, and which page it renders. |
| `client/components/settings/adminReports.css` | `.css` stylesheet | Only what is **not** shared: the CPU status card and the side-menu separator. |
| `client/features/settings.js` | `.js` import list | Registers the template, its stylesheet and the logic into the client bundle. A file that is never imported is simply not loaded. |
| `server/publications/attachments.js` | `.js` publication + method | Files Report: one page of attachments, and `getAttachmentsReportCount`. |
| `server/publications/rules.js` | `.js` publication + method | Rules Report: one page of rules, and `getRulesReportCount`. |
| `server/publications/boards.js` | `.js` publication + method | Boards Report: one page of boards, and `getBoardsReportCount`. |
| `server/publications/cards.js` | `.js` publication + method | Cards Report: one page of cards, and `getCardsReportCount`. |
| `server/publications/impersonationReport.js` | `.js` publication + method | Impersonation Report: one page of events, and `getImpersonationReportCount`. |
| `server/publications/recoveryReport.js` | `.js` publication + method | Recovery: one page of recovery events, and `getRecoveryReportCount`. |
| `models/eventLog.js` | `.js` model + methods | The Security / Speed / Tests / CPU usage streams: `eventLogPage`, `eventLogCount`, and the `{stream, at}` index that keeps them fast. |
| `tests/tablePage.test.cjs` | `.cjs` Node test | The **one** suite for all of the above: the pure helpers, the template, the layout rules this page promises, the themed pager, that paging stays server-side and index-backed, and the "one implementation" guarantee. It also checks that every path in this table still exists. |

## Pages that use this design

### Admin Panel

Menu path is what you click to reach the page.

| Table name | Menu path | Description |
| --- | --- | --- |
| Security | Admin Panel / Problems / Security | Security events from the event log: blocked uploads, rejected URL schemes, auth failures. One row per event, newest first. |
| Speed | Admin Panel / Problems / Speed | Slow-operation events — what took too long, where, and for how long. |
| Tests | Admin Panel / Problems / Tests | Test-run events recorded on the server. |
| CPU usage | Admin Panel / Problems / CPU usage | Past high-CPU periods. Adds a **status row**: the live CPU percent, core count and load average, because the table itself is history, not the current state. |
| Broken cards | Admin Panel / Problems / Broken cards | Cards whose board, swimlane or list no longer exists. Uses the shared search/paging of the global-search results list rather than a column spec. |
| Files Report | Admin Panel / Problems / Files Report | Every attachment: file name, size, MIME type, and the attachment / board / card ids. |
| Rules Report | Admin Panel / Problems / Rules Report | Every automation rule with its board, action type and trigger type. |
| Boards Report | Admin Panel / Problems / Boards Report | Every board with its id, permission, archived state, members, organizations and teams. |
| Cards Report | Admin Panel / Problems / Cards Report | Every card with its board, swimlane, list, members and assignees. |
| Impersonation Report | Admin Panel / Problems / Impersonation Report | Who impersonated whom, on which board, when and why. |
| Recovery | Admin Panel / Problems / Recovery | Database recovery events with severity, database and detail. |

### Card, board and member history

Designed, not yet implemented — see [History](../../Features/Reports/History/History.md).

| Table name | Menu path | Description |
| --- | --- | --- |
| Card history | Card / hamburger menu / History | Every change to this card, restorable. |
| Member history | Member settings / History | One user's changes, across the boards the caller can see. |
| Board history | Board Settings / History | Every change on the board and everything inside it. |
| Swimlane history | Swimlane menu / History | Changes to the swimlane and its lists and cards. |
| List history | List menu / History | Changes to the list and its cards. |

## Layout

Rows, top to bottom. This order is fixed, and is defined once in
`client/components/settings/tablePage.jade`:

1. **Title** — what the page is.
2. **Status** (optional) — live state that the table itself cannot show, e.g. the
   current CPU percent on the CPU usage page. Rendered from a named template
   passed in as `statusTemplate`; pages without one render no status row.
3. **Controls** — the search field on the start side, pagination
   (`‹  page X / N  ›`) pushed to the end side.
4. **Table** — header row plus one row per record.

Width behaviour:

- **Wide windows** — the left menu of the section keeps its width and the table
  sits beside it, filling the rest.
- **Narrow windows (≤ 800px)** — the left menu goes full width on top and the
  table sits **below** it. This deliberately overrides the older "always side by
  side" rule: side by side on a phone left the table a few dozen pixels wide with
  its right-hand columns unreachable.
- The table is `width: 100%` with `table-layout: fixed`, so **all columns get the
  same percentage of the width** and the table can never grow wider than the
  panel. That is what keeps the right-hand side of the table inside the browser
  window instead of off the right edge.
- Cell text wraps: `overflow-wrap: anywhere` breaks even a long unbroken id, URL
  or file name inside its column instead of widening it. A column can opt out
  with `nowrap` (used for the datetime columns).
- Only the table's own wrapper may scroll sideways, and only as a last resort;
  the page itself never does.

## Data loading

**A table page loads one page of rows, never the whole collection.**

- `pageInfo(total, page, perPage)` in `models/lib/tablePage.js` returns
  `{ page, totalPages, hasPrev, hasNext, skip, limit }`. The **same** call feeds
  the subscription and the "page X / N" counter, so what is fetched and what is
  displayed cannot drift apart.
- The publication applies `limit`/`skip` server-side and sends only that page, so
  only those rows reach minimongo. The client re-applies the publication's sort so
  the displayed order matches the server page; it must **not** re-slice an
  already-paginated set.
- The total row count comes from a separate count method, called when the page is
  opened or the search changes — **not** on every prev/next click. The total
  cannot change because you moved to the next page, and recounting there added a
  second round trip to every click.
- `perPage` is `TABLE_PAGE_ROWS_PER_PAGE` (25), one constant for every table.

## Columns

A page differs from another **only** in its column list:

```js
{ label | labelKey, value(doc), align: 'end', nowrap: true, cls, userId(doc), data(doc) }
```

- `label` is a literal, `labelKey` an i18n key.
- `value(doc)` returns the cell text. A missing field renders as an empty cell,
  never the string `undefined`.
- `userId(doc)`, when given, renders the cell as a link that opens the same
  "Edit user" popup as Admin Panel / People.
- `align: 'end'` right-aligns (sizes, counts); `nowrap` keeps a datetime on one
  line; `data(doc)` sets `data-sev`, which colours high/critical severities.

`buildHeader(columns)` and `buildRows(docs, columns)` turn that list into what the
template iterates. Both are pure functions in `models/lib/tablePage.js` with unit
tests, so a row can never end up with fewer cells than the header — which is how a
hand-written table gets its columns shifted by one.

## Controls

Three controls, one implementation, the same class names on every page:

- `.js-table-page-search` — type and press Enter. Searching resets to page 1 and
  recounts.
- `.js-table-page-prev` / `.js-table-page-next` — disabled at the ends via
  `hasPrev` / `hasNext`.
- `.js-table-page-edit-user` — a username cell, opening the Edit user popup.

Because the class names are shared, the handlers are shared too: the page being
acted on is identified by which report is open, not by a per-page class. Adding a
table page therefore adds **no** new event handler, no new markup and no new CSS.

## Theme

**A table page never invents a colour.** Its buttons and counter follow whatever
theme is in force:

- **Per-user theme** — Member Settings → Change color sets `--theme-accent` (and
  `--theme-accent-2`) on `:root`. Everything themed picks that up immediately, for
  that user only.
- **WeKan default** — with no custom colour chosen, `--theme-accent` is unset and
  every rule falls back to the WeKan blue `#01628c` through
  `var(--theme-accent, #01628c)`.

The prev/next buttons and the "3 / 42" counter are styled in **one** place for the
whole app — `client/components/main/paginationControls.css` — which the Admin
Panel tables, People / Organizations / Teams / Domains, All Boards, the board
Table view, Archived boards and the Cron settings tables all share. A table page
gets that look by using the shared class names (`.table-page-pagination`,
`.table-page-page-info`); it adds nothing of its own.

**Do not restate those colours in a page stylesheet.** That file spells out
`:hover`, `:focus`, `:active` *and* `:active:hover` deliberately, because the
global `button` rules in `client/components/forms/forms.css` set the same states
from `--theme-accent` with a **black / dark-grey fallback**, at equal or higher
specificity:

```css
button              { background: var(--theme-accent, #000) }
button:focus        { background: var(--theme-accent, #222) }
button:active       { background: var(--theme-accent, #111) }
button:active:hover { background: #e6e6e6 }
```

A partial copy — say only the base state and `:hover` — therefore looks right
until the button is *clicked*, and then loses to `button:focus` /
`button:active:hover` and leaves a black or grey button sitting on the page for as
long as it keeps focus. That is why the colours live in one file that covers every
state, and why `tablePage.css` carries layout only.

The rest of the page inherits: the title and cell text take the surrounding text
colour, and the counter uses `color: inherit` so it stays readable in both the
light and the dark theme rather than being pinned to a hard-coded grey.

## RTL and dates

- The layout is plain block order plus logical properties (`margin-inline-start`,
  `text-align: start`), so it mirrors under `dir=rtl` without duplicated markup.
- Datetime columns use the app's configured date format helper, so a table page
  matches the rest of the UI.

## Adding a table page

1. Add the column list.
2. Point it at a publication that honours `limit`/`skip` and a count method.
3. Add the menu item.

Nothing else: no template, no CSS, no handlers, no paging code.

The files are listed at the top of this page.
