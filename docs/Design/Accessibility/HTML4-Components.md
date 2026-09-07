# Shared HTML4 and HTML5 component library

## Purpose

WeKan's Blaze/Jade interface and its server-rendered HTML4 representation are
two renderers of the same semantic components. They share names, translations,
state, authorization and operations. They do not share literal markup: a Jade
template needs reactive DOM elements, while an HTML4 response must already be a
complete document before any JavaScript runs.

The common component contract lives in `imports/lib/uiComponentLibrary.js`.
HTML5 renders its Font Awesome class and existing Jade structure. HTML4 renders
the component's ASCII fallback and a native form control. Page controllers
provide component data; they do not assemble icon markup themselves.

## Browser baseline

The baseline is the intersection supported by the target small browsers:

| Browser | Document baseline | Script assumption | Styling assumption |
| --- | --- | --- | --- |
| IBrowse 3 | HTML 4.01; UTF-8 maps to Windows-1252 | None | No CSS; use safe HTML attributes |
| NetSurf | Most HTML 4; forms and tables | None | CSS 2 subset; no reliance on outline, fixed positioning or table layout |
| Dillo | HTML 4.01 subset; forms, tables and GIF | None | CSS 2.1 subset |
| Modern browser with JavaScript disabled | HTML 4.01 | None | Optional CSS may enhance the same document |

Consequently, required state is visible without CSS, icons use printable ASCII,
images use GIF, actions use native submit controls, and layout uses one unnested
table. Frames, SVG, icon fonts, generated content, CSS-only disclosure, scripts,
cookies and browser storage are not baseline dependencies.

## ASCII icon vocabulary

Every glyph is printable 7-bit ASCII so IBrowse does not need a Unicode mapping.
The translated text remains in the control's value; a glyph never becomes the
accessible name by itself.

| Component name | HTML4 | Meaning | HTML5 rendering |
| --- | --- | --- | --- |
| `caret-down` | `v` | Expanded | `fa-caret-down` |
| `caret-right` | `>` | Collapsed or open destination | `fa-caret-right` |
| `move-up` | `^` | Move up | `fa-arrow-up` |
| `move-down` | `v` | Move down | `fa-arrow-down` |
| `move-left` | `<` | Move left | `fa-arrow-left` |
| `move-right` | `>` | Move right | `fa-arrow-right` |
| `add` | `+` | Add | `fa-plus` |
| `remove` | `-` | Remove | `fa-minus` |
| `menu` | `=` | Menu | `fa-bars` |
| `select-off` | `[ ]` | Not selected | native checkbox / `fa-square-o` |
| `select-on` | `[x]` | Selected | native checkbox / `fa-check-square-o` |
| `previous` | `<` | Previous page or item | `fa-chevron-left` |
| `next` | `>` | Next page or item | `fa-chevron-right` |

## Page and widget contracts

Each page uses one table with an adjacent `h1` and a matching table `summary`.
Because old NetSurf does not render `caption`, the heading cannot exist only in
the caption. No table uses `colgroup`, nested tables or merged content cells.
The login form may span the two columns solely as a form container; data rows
retain one cell per declared column. The authenticated identity/navigation row
has one row heading and one data cell spanning every remaining declared column,
so HTML4 auto-layout does not infer a false two-column grid for wider reports.

| Component | Required data | HTML4 renderer | HTML5/Jade renderer |
| --- | --- | --- | --- |
| Page | title, columns, rows, empty text | complete HTML 4.01 Transitional document | `defaultLayout` and page template |
| Page table | caption, scoped headers, rows | one unnested `table`, HTML attributes plus optional CSS | shared table templates |
| Navigation action | URL, label, session action | signed POST submit button | FlowRouter link/button |
| Public navigation | URL, label | ordinary link | ordinary link |
| Disclosure | state, label | `v Label` / `> Label` POST button | caret icon and reactive content |
| Kanban viewport | board, selected swimlane/list, cards | one selected swimlane and list, explicit navigation buttons | full reactive canvas |
| Card | title, color, destination, operations | colored row and textual buttons | minicard/card-details Jade templates |
| Checklist | title, progress, visibility settings, items, operations | ordered rows, `(done/total)`, `[x]`/`[ ]` and signed textual controls | card checklist templates and progress bar |
| Comment reaction | catalog item, selected state, count, member names | `[x] smile (2)` signed toggle and labelled catalog select | emoji toggle and reaction popup |
| Pager | previous/next availability | `< Previous` and `> Next` signed buttons | shared pager controls |
| Choice | name, value, label, selected | native radio/checkbox plus label | themed HTML5 choice control |
| Text field / fieldset | name, label, value, limits and bounded text/select inputs | associated `label`, native input/select and meaningful `legend` | existing form partial |
| Select field | name, label, selected value, bounded options | associated `label`, native `select` and submit button | native select in the existing Jade form |
| Card destination | title, board/swimlane/list/card insertion point, relative position | one labelled form in natural Tab order with native selects | shared card destination picker in the Jade popup |
| Scoped export | part selection, format, board/card/checklist identity | signed POST fieldset with native checkboxes and format select | shared reactive export popup and format catalogue |
| Scoped file import | part selection, accepted formats, destination identity | bounded multipart fieldset with native checkboxes and one file input | shared import-mode popup with JSON/ZIP picker |
| Attachment | safe name, detected type, byte size, content/route scope, cover state and available representations | text metadata, purpose-signed `Preview`/`Download`, labelled rename, image-only cover toggle and confirmed delete POST controls | attachment thumbnail, slideshow and the same shared rename, cover, download and delete operations |
| Status | severity and text | textual prefix and table row | themed status component |

## Color contract

The controller passes the stored WeKan palette name or six-digit RGB value. The
shared resolver converts only known palette names and `#rrggbb`; everything else
falls back to the document colors. HTML4 emits both `bgcolor` and a matching
optional CSS declaration. Foreground text uses black or white according to WCAG
relative luminance and is emitted with a `font color` fallback for IBrowse.
Meaning such as archived, selected or failed is also written as text.

## Keyboard and accessibility contract

- Source order is the Tab order. Never add a positive `tabindex`.
- A skip link precedes branding and targets the single `h1`/content region.
- Every input has a label; related inputs have `fieldset` and `legend`.
- Row and column headings use `th scope`; the page heading duplicates the table
  purpose for browsers that do not expose `caption`.
- Every icon is followed by translated text. Color and position are never the
  only state indicators.
- Enter submits single-line forms. Moving an item never requires a pointer,
  precision, dragging, JavaScript or a cookie.

## Delivery checklist

For each existing Jade page or reusable partial:

1. Name its semantic components in the shared registry.
2. Reuse the same translation keys and domain operation in both renderers.
3. Add the HTML4 read controller with the publication's authorization selector.
4. Add signed POST controls for every operation, calling the same server service.
5. Add positive, refusal, escaping, translation-key and route-inventory tests.
6. Capture HTML5 and forced-HTML4 screenshots at the same URL and compare content,
   order, labels, colors and available operations—not pixel identity.
7. Verify the HTML4 response with CSS/images disabled and in available NetSurf,
   Dillo and IBrowse installations or their closest reproducible environment.

The route inventory remains incomplete until each route is backed by a dedicated
controller. The generic explanatory page prevents a blank response but does not
count as feature parity.

## Implementation inventory

This table records dedicated controllers, rather than merely routes that receive
the generic baseline. It is updated with every implementation batch.

| URL family | Current HTML4 implementation |
| --- | --- |
| `/sign-in`, `/sign-up` | Complete cookieless account forms |
| `/allboards/...`, `/templates`, `/remaining`, `/archive`, `/public` | Dedicated readers with Starred, Remaining, Templates, Home, Archive and nested Workspace filtering. A shared labelled title/permission component creates ordinary boards and Template Containers; server policy forces Private when the corresponding Admin setting requires it. Signed per-board Star, Home, Restore, confirmed Archive and confirmed Duplicate controls call the same exact-scope operations as Meteor. Copy accepts only title, sort and the fixed board type, and forged scopes or protected fields are reported. Each live ordinary board has a native Workspace selector sharing the Jade assignment operation; it accepts only a visible board and a workspace in that user's tree, and Remaining explicitly removes the assignment. Global Admins see a two-POST permanent-delete control only for archived boards when the Admin setting is enabled; it shares the bulk Jade service and writes successful and failed Recovery audits |
| `/b/...` | Dedicated upper-left board and semantic card-detail readers including comments, checklists, subtasks, activities and attachments. Writable boards share authorized services with Meteor and provide signed create, ordering, list movement, exact numeric sort order, title, description, color, labels, Members, Assignees, Requested By, Assigned By, locations, stickers, dependencies, voting, Planning Poker, due completion, spent/overtime, Watch, parent-card assignment, all seven Custom Field types, four ISO 8601 date, archive and restore controls. Dependencies expose textual links and native add/edit/remove forms for the shared relation, icon and color catalogs. Voting exposes question/audience/privacy/deadline management, public names or private counts, desired-state participation and confirmed removal. Planning Poker exposes its audience/deadline, ten ASCII choices, private in-progress state, closed counts and names, administrator finish/replay/estimation and confirmed removal controls. Completion, time, Watch and parent assignment use desired-state or labelled native controls and linked-content-aware writes. The current parent is a readable cross-board link; a shared visibility and persisted-ancestor check rejects forged private parents and cycles before writing. Subtasks expose readable cross-board links plus native create, title, up/down ordering and confirmed archive controls. Their shared service binds every child to the route's real linked-content parent, validates active destination placement and requires board administration for archive. The newest 50 card activities use one plain-text translation descriptor in HTML4 and as each Jade activity's accessible name. They remain board-admin-only, obey the global hide setting, and repeat linked-content board visibility before querying. Jade people/identity/label/color/date/sort/location/sticker/dependency/vote/poker/completion/time/Watch/parent/subtask/Custom Field controls share strict operations; empty values clear text/color/dates/time/parent. Worker self-assignment remains available without granting general writes. Comment-capable members can add comments and replies; parent text is explicit, while authors and permitted admins can edit or confirm-delete them. Reactions use the shared safe catalog and authorized toggle service, with ASCII state, count and member names. Core checklist creation, rename, ordering, settings, item state, copy/move destination, item-to-card, scoped import/export and confirm-delete operations use the same authorized services and transfer formats as HTML5; HTML4 renders progress and state in text. Image attachments have server-stored GIF previews and every attachment has an original download through distinct purpose-signed POST controls. Attachment rename, image cover toggle and confirmed delete use the same exact-scope service as HTML5 and report forged scopes. Remaining card fields and paged document/media previews remain |
| `/accessibility`, `/support` | Dedicated settings-backed plain-text readers |
| `/shortcuts` | Dedicated reader sharing the HTML5 shortcut mapping |
| `/accessibility/components` | Shared component demonstration page |
| `/my-cards`, `/due-cards`, `/bookmarks` | Dedicated, authenticated card/bookmark readers |
| `/global-search` | Dedicated authenticated search using the same localized parser, all advanced operators, ranked text matching, My Cards/All Cards scope, bounded `limit:` and paged result service as Meteor. The empty view shares the operator help catalogue and lists the user's board, list and label suggestions. Native Previous/Next POST controls preserve the query and view; result links remain signed. Paired same-URL tests cover 26 results, a board/title/limit query, page movement and exclusion of another user's identically named private board |
| `/broken-cards` | Dedicated authenticated reader using the same broken-card query and guarded paging executor as HTML5. Each row identifies its card, board, swimlane, list and type, using translated Unknown text for missing context. Signed card and Previous/Next controls remain scoped to boards visible to the current user; paired same-URL tests exclude healthy cards and another user's broken private card |
| `/import`, `/import/:source` | Shared source picker and import-part toggles; bounded signed JSON/CSV text and streamed JSON, Excel, Trello ZIP and WeKan ZIP files call their common sanitized importers. WeKan ZIP attachments stream into Default Storage; member mapping, Trello workspace naming and Trello API import remain |
| Board rules | Dedicated list, workflow and localized trigger/action details use the same scoped documents as Jade. Signed List/Workflow controls preserve view state; workflow rows expose each When -> Action relationship without drag-and-drop. Active board/site admins receive labelled create, action replacement, rename and two-step delete controls backed by exact-board services shared with HTML5. JSON/CSV export uses the common portable serializer and distinct single-use board/format-purpose download POSTs. Bounded JSON/CSV, Trello Butler, n8n and Node-RED text import uses one prevalidated, sanitized server batch in HTML4 and HTML5. The staged parameterized builder renders the shared typed catalog for every modern trigger and action family, shows only relevant fields, and repeats exact source/resource/destination validation before its atomic tuple insert |
| Admin Panel pages and panes | All 20 `/admin/problems/*` panes have dedicated Global Admin-only controllers sharing the modern services, authorization and reporting boundaries. Summary retains status, acknowledgement and repair operations; Performance retains its Card-loading guidance; Security, Delete and Notifications retain their audited settings; and every report retains its modern columns, bounded search/paging, filters and relationship resolution. Files also retains purpose-bound preview/original controls and setting-gated audited permanent delete. A registry-derived source audit requires exactly 20/20 mappings, so no Problems pane can regress to the generic fallback. Settings / Version shares the modern statistics, manifest service and five table categories. Announcement and Accessibility share bounded content services and deny direct DDP writes. PWA shares all seven fields, semantic textarea groups, strict tag/JSON validators and both HTML/JSON sinks. Global Webhooks shares create/edit/disable/remove operations, DNS-aware SSRF validation and secret-safe readers. Same-URL no-JavaScript/modern browser tests and screenshot pairs cover every Problems pane and all five completed Settings panes. Anonymous and non-admin requests receive no report or system data; forged settings writes are Security-reported. The remaining Visibility and Translation Settings panes and Admin Panel People and Attachments panes still use the generic baseline and need dedicated controllers |
| Account preferences and information | Generic baseline; dedicated controllers remain |
