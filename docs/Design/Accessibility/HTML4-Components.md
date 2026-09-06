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
retain one cell per declared column.

| Component | Required data | HTML4 renderer | HTML5/Jade renderer |
| --- | --- | --- | --- |
| Page | title, columns, rows, empty text | complete HTML 4.01 Transitional document | `defaultLayout` and page template |
| Page table | caption, scoped headers, rows | one unnested `table`, HTML attributes plus optional CSS | shared table templates |
| Navigation action | URL, label, session action | signed POST submit button | FlowRouter link/button |
| Public navigation | URL, label | ordinary link | ordinary link |
| Disclosure | state, label | `v Label` / `> Label` POST button | caret icon and reactive content |
| Kanban viewport | board, selected swimlane/list, cards | one selected swimlane and list, explicit navigation buttons | full reactive canvas |
| Card | title, color, destination, operations | colored row and textual buttons | minicard/card-details Jade templates |
| Pager | previous/next availability | `< Previous` and `> Next` signed buttons | shared pager controls |
| Choice | name, value, label, selected | native radio/checkbox plus label | themed HTML5 choice control |
| Text field | name, label, value, limits | associated `label` and native input | existing form partial |
| Select field | name, label, selected value, bounded options | associated `label`, native `select` and submit button | native select in the existing Jade form |
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
| `/allboards/...`, `/templates`, `/remaining`, `/archive`, `/public` | Dedicated readers with Starred, Remaining, Templates, Home, Archive and nested Workspace filtering; mutations remain |
| `/b/...` | Dedicated upper-left board and semantic card-detail readers including comments, checklists and attachment metadata. Writable boards share authorized services with Meteor and provide signed create, ordering, list movement, title, description, archive and restore controls; remaining card fields, child mutations and attachment content remain |
| `/accessibility`, `/support` | Dedicated settings-backed plain-text readers |
| `/shortcuts` | Dedicated reader sharing the HTML5 shortcut mapping |
| `/accessibility/components` | Shared component demonstration page |
| `/my-cards`, `/due-cards`, `/bookmarks` | Dedicated, authenticated card/bookmark readers |
| `/global-search` | Dedicated authenticated title/description search; advanced operators remain |
| `/import`, `/import/:source` | Shared source picker and import-part toggles; bounded signed JSON/CSV text and streamed JSON, Excel, Trello ZIP and WeKan ZIP files call their common sanitized importers. WeKan ZIP attachments stream into Default Storage; member mapping, Trello workspace naming and Trello API import remain |
| Board rules | Generic baseline; dedicated controller remains |
| Admin Panel pages and panes | Generic baseline; dedicated controllers remain |
| Account preferences and information | Generic baseline; dedicated controllers remain |
