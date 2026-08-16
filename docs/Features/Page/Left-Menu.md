# Design: the Left Menu

One design, one implementation, for the menu beside the content on every Admin
Panel page: a list of entries, each an icon and a label, with the current one
highlighted.

This page is the **single source** for everything those menus have in common. A
page-specific design doc describes only what is different about *that* page and
links back here.

Pages that pair this menu with a paginated table also use
[Table](Table.md) — the two designs compose: menu on the reading-start side,
table beside it.

## Related files

| File Path | File Type | Description |
| --- | --- | --- |
| `client/components/settings/leftMenu.jade` | `.jade` template | **The** left menu: the `.side-menu` list, its entries and the active row. |
| `models/lib/leftMenu.js` | `.js` module, pure helpers | `buildMenuItems()` turns a plain item list plus the active id into what the template renders. `paneTitle()` picks the active entry's label for the pane heading. `activeCount()` proves only one row is ever active. |
| `client/components/settings/settingBody.css` | `.css` stylesheet | The `.side-menu` look and width, the flex row that places it beside `.main-body`, and `.admin-pane-title` — the ONE heading style every Admin Panel pane uses. Shared by every Admin Panel page. |
| `client/components/settings/tablePage.css` | `.css` stylesheet | The ≤ 800px rule that stacks the menu above the content instead of squeezing both onto one row. |
| `client/components/settings/settingBody.jade` | `.jade` template | Admin Panel / Settings. |
| `client/components/settings/peopleBody.jade` | `.jade` template | Admin Panel / People (People, Organizations, Teams, Domains, Locked users, Roles, Templates). |
| `client/components/settings/attachments.jade` | `.jade` template | Admin Panel / Attachments. |
| `client/components/settings/adminProblems.jade` | `.jade` template | Admin Panel / Problems. |
| `client/components/settings/translationBody.jade` | `.jade` template | The Translation pane of Admin Panel / Settings — a pane, not a page: the menu beside it is the Settings one. |
| `client/components/settings/informationBody.jade` | `.jade` template | The Version pane of Admin Panel / Settings — likewise a pane, rendered by `settingBody.jade`. |
| `client/components/settings/leftMenu.js` | `.js` client code | The caret's click handler and the global `isLeftMenuCollapsed` helper. Imported by `client/features/settings.js` — see [Collapsing it](#collapsing-it). |
| `client/lib/utils.js` | `.js` client code | `getLeftMenuCollapseState()` / `setLeftMenuCollapseState()` and `getLeftMenuWidth()` / `setLeftMenuWidth()`: the Session value, the user's profile field and the signed-out cookie behind the fold and the width. |
| `client/components/main/layouts.css` | `.css` stylesheet | The tablet and large-display **defaults** for the menu width — set on `--wekan-left-menu-width`, never on the menu's `width`. |
| `tests/leftMenu.test.cjs` | `.cjs` Node test | The one suite: the pure helpers, the template, the side placement and mirroring, and that no page re-implements the menu. |
| `tests/clientBundleImports.test.cjs` | `.cjs` Node test | Walks the import graph from `client/main.js` so a component that registers a template can never be left out of the bundle again. |

## Pages that use this design

### Admin Panel

| Menu name | Menu path | Description |
| --- | --- | --- |
| Settings | Admin Panel / Settings | **Version** (first, and the pane that opens with the Admin Panel), Visibility, Announcement, Accessibility, Translation, PWA, Global Webhooks. |
| People | Admin Panel / People | Login, E-mail, Domains, Organizations, Teams, People, Locked users, Roles, Shared templates. |
| Attachments | Admin Panel / Attachments | The storage backends and the attachment/avatar tools. |
| Problems | Admin Panel / Problems | Summary, Security, Speed, Tests, CPU usage, then the reports — see [Table](Table.md). |

Four pages, not seven: **Translation** and **Version** became panes of Settings, and
**Features** was removed (its three panes are in Problems). A page whose menu had a
single entry was a page in name only — the entry belongs in the menu of the section
it is part of, and the tab that led to it is one tab fewer in the bar above.

## Which side the menu is on

**The menu is on the side the language starts from.**

- **Left-to-right languages** (English, Finnish, German, …) — the menu is on the
  **left**, the content to its right.
- **Right-to-left languages** (Arabic, Hebrew, Persian, …) — the whole panel is
  mirrored: the menu is on the **right** and the content to its left. Inside each
  entry the contents mirror too — the icon sits on the right of its label, and the
  label reads from the right edge.

Nothing in the markup says "left". The mirroring comes from the document
direction (`dir=rtl` on `<html>`, set from the user's language) plus **logical**
CSS properties, so there is one stylesheet and one template for both directions:

- `text-align: start` rather than `left`, so a label aligns to the reading start.
- `margin-inline-*` / `padding-inline-*` rather than `margin-left` / `padding-left`,
  so an icon's gap flips with the direction.
- Ordinary flex order for the row, which reverses under `dir=rtl` on its own.

Never write `left`, `right`, `margin-left` or `padding-left` for this menu: a
physical property does not flip, and produces a right-hand menu whose entries are
still indented from the left.

## Collapsing it

A **caret at the top of the menu** folds it away. It is the control a **list**
has on a board (`listHeader.jade`): pointing **down** while the thing is open and
**right** once it is folded, with the same two words — Collapse / Uncollapse — in
its tooltip. It is the collapse gesture WeKan already has, so there is nothing
new to learn.

Folded, the menu is **gone**: no column, no strip, no narrow band of grey with a
glyph in it. A strip is still a column — it holds width, it keeps the page from
starting at the window edge, and a caret alone in it is a target that has to be
aimed at.

**The way back is the pane title.** Folded, the caret moves to the **inline start
of the heading** of the pane beside it, pointing right, and the caret and the
title are **one target**: clicking anywhere on it brings the menu back. So
nothing is lost by drawing nothing — the way back is the largest thing on the
page rather than the narrowest.

The heading is drawn **even when the pane has no title**. `paneTitle()` returns
`{}` when no menu entry is active, and an empty heading with a caret in it is
better than a folded menu with nothing left to unfold it.

It is **one caret template** (`leftMenuCollapse`), included in both places and on
both pages, so they cannot drift into different carets. Beside a title it is
handed the pane's own text as `paneTitleKey` / `paneLabel` — deliberately not the
`titleKey` / `label` that `paneTitle()` itself uses, so the caret at the top of
the menu, which inherits whatever data context the menu sits in, can never pick a
title up by accident. The caret is an anchor with no `href`, so it carries
`role="button"`, `tabindex="0"` and a `keydown` handler for Enter and Space:
without them the menu could be folded with a mouse and only with a mouse. Its
tooltip and `aria-label` are one string from the `collapseLabel` helper, which
names the pane as well beside a title — an `aria-label` replaces the text inside
the element, so the bare word would have silenced the heading.

**Which element takes the `collapsed` class differs by page, and that is the
point.** The Admin Panel marks its **menu** (`.side-menu`): it is a flex row, and
a hidden flex item closes the row up by itself. All Boards marks the **grid**
(`.boards-layout`): `display: none` takes an element out of a grid but the
**track** it was placed in remains, so hiding only the menu would have left the
boards in the `auto` column with an empty `1fr` one beside them. The grid drops
to a single column and hides the menu in the same rule — with `!important`,
because the phone rules set both tracks with an `!important` of their own
(#6488 / #6523) and a phone would otherwise be the one screen still holding an
empty column open.

Open, the width lives on the **menu**, not on the grid track
(`grid-template-columns: auto 1fr`), so the track is the menu's own width.

**One state for both pages.** They draw one menu, and a reader who folds it away
on one of them has said what they want on the other.

It is remembered in three layers, the same shape the list collapse uses:

- a **Session value**, set first, so the fold is instant and survives a
  re-render rather than waiting for a round trip;
- **`profile.leftMenuCollapsed`** on the user document, so it survives a reload
  and follows the reader to their other browser;
- a **cookie** (`wekan-left-menu-collapsed`) when nobody is signed in — a public
  board has this menu too — written through the same `readCookieMap` /
  `writeCookieMap` helpers the public list and swimlane collapse states use.

Open is the default. A menu that remembered itself collapsed for somebody who
has never collapsed one would be a page with no visible way to navigate.

The caret's code — the click that folds the menu and the `isLeftMenuCollapsed`
helper that says whether it is folded — lives in
`client/components/settings/leftMenu.js`, and that file has to be **imported by
`client/features/settings.js`**. `package.json` sets `meteor.mainModule`, so the
client is not eagerly loaded: a file nobody imports is not in the bundle at all.
Without that line the caret still rendered and clicking it did nothing, and an
unregistered Blaze helper is undefined, so nothing took the `collapsed` class
either. `tests/clientBundleImports.test.cjs` walks the import graph from
`client/main.js` and pins that every component file which registers something
with Blaze is reachable from it.

## Its width, and dragging it

The menu's **inner edge** — the right one while reading left to right, the left
one under a right-to-left language — carries a **grip**, and dragging it changes
the width. It is the same control the **right board sidebar** has on its own
inner edge (`sidebar.jade` / `sidebar.css`), with the same 6px strip, the same
`col-resize` cursor and the same `nodragscroll` so a drag on it resizes the menu
instead of panning the board page behind it.

**One number, on `<html>`.** The width is a CSS custom property,
`--wekan-left-menu-width`, and everything that needs it reads that: the Admin
Panel's `.side-menu`, the All Boards `.boards-left-menu` — whose grid track is
`auto`, so the track follows the menu — and the grip itself, which sits at
`calc(var(--wekan-left-menu-width) - 3px)` from the row's inline start. An inline
width on one element could not have done that: the menu is a different element in
a different template on each page.

The **default** is the number in the stylesheet (`:root`, 260px), and a
breakpoint that wants a different default — the tablet and large-display rules in
`layouts.css` — overrides **the variable**, never the menu's `width`. A rule
naming `.side-menu` would beat a dragged width, which arrives as an inline
property on `<html>`, at exactly that one screen size. For the same reason the
client removes the property rather than writing the default into it: the default
lives in one place.

The grip is positioned against the **row/grid around the menu**, not inside it.
The menu is its own scroll area, and a handle inside it would scroll away with
the entries. Being absolutely positioned it is neither a flex item nor a grid
item, so it adds no column and no gap — which is also why the Admin Panel's menu
template can carry it as a **second root** and every pane gets it without
naming it.

The drag is **clamped**: no narrower than 160px, no wider than
`min(600px, window − 240px)`. There is no drag on a phone (≤ 800px, where the
menu is full width above the content) and none while it is folded — there is no
edge to drag.

The width is remembered in the **same three layers as the fold**: a Session value
first, then `profile.leftMenuWidth` on the user document, then the
`wekan-left-menu-width` **cookie** when nobody is signed in — the same cookie
mechanism the fold uses, rather than the `localStorage` the right sidebar's width
uses, so one reader's menu is not remembered in two different places. It is saved
**once, when the drag ends**; while dragging, the property is written directly so
the edge follows the pointer without a database write per pixel. The server
method clamps again (120–1200px) and refuses `NaN`, which passes
`check(width, Number)` and would otherwise store a width no page could recover
from.

## Theme

Most of the menu is deliberately **neutral**: the panel is a light grey card
(`#f7f7f7` on `#f0f0f0`) and the row you are on, or hover, lifts to white with a
soft shadow. That is the WeKan default look and it does not change with the theme
— a menu is chrome, and tinting the whole card would fight the content beside it.

The **themeable part is the selected entry**, which is **filled with the theme
colour with a white label and icon** — the same treatment the selected tab gets in
the Admin Panel bar above it (`settingHeader.css`, `.setting-header-btn.active`).
One selected-thing look in both places, so the menu says at a glance which page is
showing on the right:

```css
.side-menu ul li.active,
.side-menu ul li.active:hover      { background: var(--theme-accent, #2980b9); }
.side-menu ul li.active > a,
.side-menu ul li.active > a i      { color: #fff; }
```

- **Per-user theme** — Member Settings → Change color sets `--theme-accent` on
  `:root`, and the entry you are on picks it up, for that user only.
- **WeKan default** — the fallback is the WeKan header blue, so with no chosen
  colour the menu matches the bar exactly.
- **`:hover` is in the selector list on purpose** — `li:hover` sets a white
  background at the same specificity and comes later in the file, so without it the
  fill would vanish as soon as the pointer crossed the selected entry.

The label used to be `var(--theme-accent, inherit)`, and that `inherit` made the
selected entry exactly the same grey as every unselected one.

So: nothing in the menu is hard-coded to a *brand* colour, and the one part that
should follow a chosen theme does. If you add a themeable part, take the colour
from `var(--theme-accent, …)` with a fallback that reproduces today's look, and
never introduce a second accent variable.

The Font Awesome icon of the selected entry is coloured with its label, in the same
rule, so the two can never drift apart.

## Layout

- **Wide windows** — the menu keeps a fixed width beside the content, which fills
  the rest of the row.
- **Narrow windows (≤ 800px)** — the menu goes full width on top and the content
  sits **below** it, rather than the two being squeezed side by side. The rule
  lives in `tablePage.css` and applies to the whole `.content-body`, so both
  designs stack the same way.

## The pane title

**Every Admin Panel pane opens with a heading, and the heading is the active menu
entry's own label.** The menu says which pane is open on the side you clicked; the
title says it on the side you are reading.

- `paneTitle(items, activeId)` in `models/lib/leftMenu.js` returns the active
  entry's `{ titleKey, label }` — the same two forms an entry has — or an empty
  object when nothing is active, so a page with no selection renders no heading
  rather than an empty one.
- The page renders `+paneTitle(paneTitleData)` as the first thing inside
  `.main-body`, above whatever pane is showing.
- One class, `.admin-pane-title` (`settingBody.css`), sets the size and weight. The
  shared table page puts that class on its own `h1` too
  ([Table](Table.md)), so a **table pane and a form pane have the same title**.

Deriving it from the menu is what keeps the panes identical: a pane cannot end up
with a title of a different size, in different words, or with none at all, and
renaming a menu entry renames its pane title with it. It is also why a table page
inside the Admin Panel passes **no** `titleKey` — the section already rendered the
heading, and the page would print the same words a second time.

**Inside a pane, a group of settings may have its own title** —
`.admin-pane-group-title`, deliberately **smaller** than the pane title, with a
`<hr>` above it where a group needs separating from the one before. Admin Panel /
Settings / Visibility is the example: All Boards, URL, Product name, Logo. The
page then reads as one heading with groups under it, rather than as several pages
stacked.

Before this, only the paginated table pages had a title at all: Domains showed
"Domains" while Login, Announcement, Accessibility, PWA, Version and the rest
opened with no heading.

**A pane must not repeat it.** Once the section renders the heading, a pane that
also prints its own name says the same word twice — which is what every Admin
Panel / Attachments pane did (`h3 Backup` under a title reading "Backup"), and
Roles, Shared templates and Broken cards with it. Those headings are gone. A
heading that says something the menu label does not — Limits' "Attachment And API
File Size Limits", Locked users' "Brute Force Protection Settings" — is not a
repeat and stays.

## Entries

A page describes its menu as data, not as markup:

```js
{ id, icon, labelKey, cls }   // one entry
{ separator: true }           // a horizontal rule between groups
{ heading: true, labelKey }   // a group title: text only, NOT clickable
```

- `id` is what the page's click handler reads from `data-id`.
- `icon` is the Font Awesome class, `labelKey` an i18n key.
- `buildMenuItems(items, activeId, jsClass)` marks exactly **one** entry active,
  from the id the page passes in — so a menu cannot highlight two rows at once,
  which is what happens when each entry has its own `isXActive` helper.
- A conditional entry may be `null` (e.g. the E-mail entry is absent on
  Sandstorm); holes are dropped rather than rendered as an empty row.
- A **heading** names the group below it — "Reports" above the report entries of
  Admin Panel / Problems. It carries no `id`, no icon and no handler class, so
  there is nothing to click, nothing for the page's click handler to read a
  `data-id` from, and it can never be the active row (or `paneTitle()` could pick a
  group name as a pane title). It renders smaller and quieter than an entry, and
  opts out of the hover highlight — a row that lights up under the pointer reads as
  one you can open. Use an existing i18n key: a heading is a label like any other.

## Clicks

Every entry carries the shared `js-left-menu-item` class **and**, optionally, the
page's own class, so a page keeps one handler:

```
'click .js-left-menu-item'(event, tmpl) { ...read data-id... }
```

Adding an entry is a line in the item list. It needs no markup, no CSS and no new
handler.

## Adding a page

1. Build the item list.
2. Render `+leftMenu(menuItems)` beside `.main-body` inside `.content-body`.
3. Render `+paneTitle(paneTitleData)` as the first thing inside `.main-body`, with
   a `paneTitleData()` helper that calls `paneTitle(items, activeId)`.
4. Handle `click .js-left-menu-item` and switch on `data-id`.
