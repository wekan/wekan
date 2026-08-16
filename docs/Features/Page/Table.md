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
| `client/components/settings/adminProblems.js` | `.js` Blaze template logic | The column spec for each Admin Panel table, the paging state, the subscriptions, and the shared control handlers. |
| `client/components/settings/adminProblems.jade` | `.jade` template | Admin Panel / Problems: the side menu, and which page it renders. |
| `client/components/settings/adminProblems.css` | `.css` stylesheet | Only what is **not** shared: the CPU status card and the side-menu separator. |
| `client/components/settings/translationBody.jade` | `.jade` template | Admin Panel / Settings / Translation: the pane, its interactive row and its "New" header. |
| `client/components/settings/translationBody.js` | `.js` Blaze template logic | The Translation column spec, its paging state and its share of the shared control handlers. |
| `server/publications/translation.js` | `.js` publication | Translation: one page of custom translation strings (`limit`/`skip`). |
| `client/features/settings.js` | `.js` import list | Registers the template, its stylesheet and the logic into the client bundle. A file that is never imported is simply not loaded. |
| `server/publications/attachments.js` | `.js` publication + method | Files Report: one page of attachments, and `getAttachmentsReportCount`. |
| `server/publications/rules.js` | `.js` publication + method | Rules Report: one page of rules, and `getRulesReportCount`. |
| `server/publications/boards.js` | `.js` publication + method | Boards Report: one page of boards, and `getBoardsReportCount`. |
| `server/publications/cards.js` | `.js` publication + method | Cards Report and Broken cards: one page of cards each, with `getCardsReportCount` / `getBrokenCardsReportCount`. |
| `server/publications/impersonationReport.js` | `.js` publication + method | Impersonation Report: one page of events, and `getImpersonationReportCount`. |
| `server/publications/recoveryReport.js` | `.js` publication + method | Recovery: one page of recovery events, and `getRecoveryReportCount`. |
| `models/eventLog.js` | `.js` model + methods | The Security / Speed / Tests / CPU usage streams: `eventLogPage`, `eventLogCount`, and the `{stream, at}` index that keeps them fast. |
| `tests/tablePage.test.cjs` | `.cjs` Node test | The **one** suite for all of the above: the pure helpers, the template, the layout rules this page promises, the themed pager, that paging stays server-side and index-backed, and the "one implementation" guarantee. It also checks that every path in this table still exists. |

## Pages that do not use this design

Pages with a paginated table that are **not** built from this design, and why.
Listed so nobody has to re-derive the answer by reading the code, and so the gap
is visible rather than forgotten.

| Table name | Menu path | Why it does not use this design |
| --- | --- | --- |
| People — its two remaining non-table panes | Admin Panel / People | Locked users and Shared templates are **not tables**: Locked users is a form of numeric lockout settings with a Save button, and Shared templates is a checkbox list of scopes. There is no set of rows to render, so this design does not apply to them and forcing it would only add a table around a form. All four of People's TABLE panes — Domains, Organizations, Teams and People — are converted and listed below, and Roles has since gained a table of its own (Roles Status), also listed below. |

People is fully converted: its four table panes render through this design, and its
search, filter dropdown, action buttons and total are the shared controls row. Its
separate Search button is gone — every table page searches on Enter.

## Pages that use this design

### Admin Panel

Menu path is what you click to reach the page.

| Table name | Menu path | Description |
| --- | --- | --- |
| People | Admin Panel / People / People | Every user with e-mail, admin flag, active state, lockout status and created date. Interactive rows (`rowTemplate`) and two template headers: the new-user row and the select-all checkbox. |
| Teams | Admin Panel / People / Teams | Every team with its details and per-team feature switches. Same shape as Organizations: a `rowTemplate` and three `headerTemplate` columns. |
| Organizations | Admin Panel / People / Organizations | Every organization with its details and per-organization feature switches. Interactive rows, so it supplies a `rowTemplate`; three of its headers carry a select-all pair, supplied as `headerTemplate`. |
| Domains | Admin Panel / People / Domains | Every e-mail domain in use with the number of users on it. The first People pane converted to this design. |
| Roles Status | Admin Panel / People / Roles | What each board role may do — which cards it sees, and whether it may comment, create and edit, or change the board's settings. **Read-only**: no `rowTemplate`, no actions, nothing editable, because a role's capabilities are a property of the code and not a setting. It sits BELOW the Save button of the checkbox list above it and follows that list's working copy, so an admin sees what a change means before saving it. Rendered from `models/lib/boardRoleCapabilities.js`, the same table the allow rules decide with — see [Board roles](../../Features/Members/Roles.md). |
| Security | Admin Panel / Problems / Security | Security events from the event log: blocked uploads, rejected URL schemes, auth failures. One row per event, newest first. |
| Speed | Admin Panel / Problems / Speed | Slow-operation events — what took too long, where, and for how long. |
| Tests | Admin Panel / Problems / Tests | Test-run events recorded on the server. |
| CPU usage | Admin Panel / Problems / CPU usage | Past high-CPU periods. Adds a **status row**: the live CPU percent, core count and load average, because the table itself is history, not the current state. |
| Broken cards | Admin Panel / Problems / Broken cards | Cards with no board, swimlane or list, or a type that is not a card type. A column spec like the reports beside it — it used to run on the global-search results list, which is why it was the one report here with a different set of controls. |
| Files Report | Admin Panel / Problems / Files Report | Every attachment: file name, size, MIME type, and the attachment / board / card ids. |
| Rules Report | Admin Panel / Problems / Rules Report | Every automation rule with its board, action type and trigger type. |
| Boards Report | Admin Panel / Problems / Boards Report | Every board with its id, permission, archived state, members, organizations and teams. |
| Cards Report | Admin Panel / Problems / Cards Report | Every card with its board, swimlane, list, members and assignees. |
| Impersonation Report | Admin Panel / Problems / Impersonation Report | Who impersonated whom, on which board, when and why. |
| Recovery | Admin Panel / Problems / Recovery | Database recovery events with severity, database and detail. |
| Translation | Admin Panel / Settings / Translation | The custom translation strings: language, source text, translation. Interactive rows (an Edit link and the ⋯ menu) and one template header, the "New" link. |

### Elsewhere in WeKan

| Table name | Menu path | Description |
| --- | --- | --- |
| All Boards (Table view) | `/board` → the view menu → Table | Every board of the selected section: **Edit**, board title and board description. EDITABLE, which is what separates it from Public Boards below - the Edit cell opens the same board-title popup the Swimlanes view opens. Its rows carry their board's colour. See [All-Boards](All-Boards.md). |
| Public Boards | `/public` | The boards anybody may open: title and description, ten per page. Read-only — a row's only action is to open its board — and the page is nothing but the table. Its rows carry their board's colour and background image, so a board is recognised here the way it is on All Boards. See [Public](Public.md). |

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

1. **Title** — what the page is. Rendered **only when the page supplies one**
   (`titleKey` or `title`). Inside the **Admin Panel it does not**: every pane
   there gets one heading from the **active left-menu entry**, rendered by the
   section around it — see [Left Menu](Left-Menu.md). A table page that printed a
   title of its own as well would show the same words twice, which is why People,
   Organizations, Teams, Domains, Translation and the Problems reports pass no
   title. The heading carries `.admin-pane-title` either way, so a table pane and a
   form pane have the same title at the same size.
2. **Status** (optional) — live state that the table itself cannot show, e.g. the
   current CPU percent on the CPU usage page. Rendered from a named template
   passed in as `statusTemplate`; pages without one render no status row.
3. **Controls** — the search field on the start side, pagination
   (`‹  page X / N  ›`) pushed to the end side.
4. **Table** — header row plus one row per record. It is **always rendered, empty
   or not**: several pages put controls in the header — the "New" link of
   Organizations, Teams, People and Translation, the select-all pairs — so hiding
   the table when there are no rows hid the only way to create the **first** row.
   An empty pane shows the header and the "no items" message **below** the table,
   not instead of it.

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
  or file name inside its column instead of widening it — so a long value wraps
  onto a second line rather than being cut off at the column edge. Like the width,
  the wrapping is `!important`: app-wide `table td { white-space: nowrap }` rules
  had been switching it off. A column can opt out with `nowrap` (used for the
  datetime columns), which is `!important` too so the opt-out still works.
- Only the table's own wrapper may scroll sideways, and only as a last resort;
  the page itself never does.
- **Nothing outside this design may force a width.** Two admin stylesheets used to
  set `min-width: 1200px !important; width: max-content !important` on a bare
  `table` selector — one of them (`peopleBody.css`) with no page in the selector at
  all, so it reached every table in WeKan and its `!important` beat this page's own
  layout. The result was the report this design exists to prevent: the right-hand
  columns off screen until you scrolled. Both are scoped away from
  `.table-page-table` now, and neither forces a floor on any admin table any more.
  The same rules also made a *short* table shrink: with `width: max-content` a
  two-column table sat at a third of the panel instead of filling it. `width`,
  `max-width` and `table-layout` on `.table-page-table` are therefore `!important`
  — a guarantee a stylesheet in another folder can silently override is not a
  guarantee.

The controls row shares one height (34px) and no margins, set in
`tablePage.css`: the search field, the filter, every action button and the
prev/next pair line up on the same top and bottom edge. The global `button` rule in
`forms.css` is `display: block; margin-bottom: 14px`, written for stacked form
buttons — a control that keeps that margin is centred higher than one that does
not, which is exactly how People's "Unlock all users" ended up lower than "Teams"
beside it.

## Data loading

**A table page loads one page of rows, never the whole collection.**

- `pageInfo(total, page, perPage)` in `models/lib/tablePage.js` returns
  `{ page, totalPages, hasPrev, hasNext, skip, limit }`. The **same** call feeds
  the subscription and the "page X / N" counter, so what is fetched and what is
  displayed cannot drift apart.
- The publication applies `limit`/`skip` server-side and sends only that page, so
  only those rows reach minimongo. The client renders **that page**; it must
  **not** re-slice an already-paginated set.
- The total row count comes from a separate count method, called when the page is
  opened or the search changes — **not** on every prev/next click. The total
  cannot change because you moved to the next page, and recounting there added a
  second round trip to every click.

### Rows per page — one number, `TABLE_PAGE_ROWS_PER_PAGE`, for the whole app

**Every paginated page in WeKan loads ten rows at a time.** The number lives once,
as `TABLE_PAGE_ROWS_PER_PAGE` in `models/lib/tablePage.js`, and every page reads it
from there — including the pages that are **not** built from this design and draw a
pager of their own. A page that writes its own number is a bug, whichever template
it uses:

| Where | Reads it as |
| --- | --- |
| Every table page (`pageInfo`'s default) | `TABLE_PAGE_ROWS_PER_PAGE` |
| Admin Panel / Problems — all reports and the event streams | `REPORTS_PER_PAGE`, `EVENTS_PER_PAGE` |
| Admin Panel / People — People, Organizations, Teams, Domains | `usersPerPage`, `orgsPerPage`, `teamsPerPage`, `domainsPerPage` |
| Admin Panel / Settings / Translation | `TABLE_PAGE_ROWS_PER_PAGE` |
| The search pages (`CardSearchPaged`: global search, due cards, broken cards) | `resultsPerPage` |
| Archived boards | `ARCHIVED_BOARDS_PER_PAGE` |

Two deliberate exceptions, both of which have no pager and are therefore not
paginated pages: the **activity feed**, which is infinite scroll and whose page size
is a live-cursor cost decision (see the note in
`client/components/activities/activities.js`), and `PER_PAGE_MAX` in
`models/lib/domainTablePage.js`, which is an upper bound on what a *client may ask
for*, not a page size. `PER_PAGE_DEFAULT` in that same module is the same ten,
written out rather than imported because a plain-node test `require()`s the file;
`tests/tablePage.test.cjs` pins the two together.

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

### Interactive rows and headers

Some panes cannot be expressed as text cells: their rows carry inline checkboxes
and edit links, and their headers carry controls. Two slots cover that without
every page reinventing the table:

- **`rowTemplate`** — a template name plus `docs`, an array of data contexts. The
  page owns its `<tr>` and is then responsible for matching the column count;
  the guarantee that a row can never be shorter than the header applies only to
  the `cells` form.
- **`headerTemplate` / `headerData`** on a column — the `<th>` still belongs to the
  shared template; only its contents come from the page.

Everything else — layout, paging, search, the themed pager, the total — is shared
either way. Prefer the column spec; reach for these only when the pane is genuinely
interactive.

## Controls

The controls row holds, in reading order: the search field, any **filters**, any
**actions**, the **total**, and the pagination pushed to the end side.

Filters, actions and the total are **on by default** — there is no flag to turn
them on. A page that supplies a filter or an action gets it rendered, and the
total is shown whenever the page knows one. They came from Admin Panel / People,
where they were hand-written into that page's own markup; they are general enough
for any table, so they live here.

```js
filters: buildFilters([{ id, labelKey, options: [{ value, labelKey|label }] }], current)
actions: buildActions([{ id, labelKey, icon, cls }])
total:   <number>          // shown when non-zero
totalLabelKey: 'people-number'   // optional label before it
```

- A **filter** is one `<select>`; the page reads `data-filter` and the selected
  value. The option matching `current` is selected, compared as strings so a
  numeric value still matches.
- An **action** is one button; the page reads `data-action` to know which was
  pressed. It is **filled with the theme accent** (an action, not navigation), and
  it brings **no geometry of its own** — a page that gave its action button a class
  with a margin and a height of its own put it at a different height from every
  other control in the row.
- The **total** counts the whole result set, not the page — it sits with the
  controls for that reason, and inherits its colour so it stays readable on a dark
  theme.

Three controls are always present, with the same class names on every page:

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

The prev/next buttons, the **action buttons** and the "3 / 42" counter are styled
in **one** place for the whole app —
`client/components/main/paginationControls.css` — which the Admin
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
