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
| `client/components/settings/adminReports.jade` | `.jade` template | Admin Panel / Problems. |
| `client/components/settings/translationBody.jade` | `.jade` template | The Translation pane of Admin Panel / Settings — a pane, not a page: the menu beside it is the Settings one. |
| `client/components/settings/informationBody.jade` | `.jade` template | The Version pane of Admin Panel / Settings — likewise a pane, rendered by `settingBody.jade`. |
| `tests/leftMenu.test.cjs` | `.cjs` Node test | The one suite: the pure helpers, the template, the side placement and mirroring, and that no page re-implements the menu. |

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

## Theme

**The menu carries the theme colour, and the row you are on is the white one.**

It used to be the other way round: a light grey card (`#f7f7f7` on `#f0f0f0`)
with one row filled in the theme colour. That made the filled row the only part
of the page answering to the theme, so the menu read as a plain grey column with
a coloured stripe in it rather than as a **side of the app** — and the menu is
one of the two things always on screen, next to the header bar it sits under.

Inverting it also makes the selection **easier to find**, not harder: the eye
goes to whatever differs from its surroundings, and one white row in a coloured
column differs more than one coloured row in a white one.

```css
.side-menu                         { background-color: var(--theme-accent, #2980b9); }
.side-menu ul li > a,
.side-menu ul li > a i             { color: #fff; }

.side-menu ul li.active,
.side-menu ul li.active:hover      { background: #fff; }
.side-menu ul li.active > a,
.side-menu ul li.active > a i      { color: #4d4d4d; }

.side-menu ul li:hover             { background: rgba(255, 255, 255, 0.18); }
```

The All Boards menu (`.boards-left-menu`) is styled the same way, rule for rule.
WeKan has one kind of left menu and it should look like one kind of left menu.

- **The menu is the colour of the first header bar above it.** They are the two
  pieces of chrome that are always on screen, and they are now one surface
  turning a corner rather than a coloured bar over a grey column.
- **Per-user theme** — Member Settings → Change color sets `--theme-accent` on
  `:root`, and the panel picks it up, for that user only.
- **WeKan default** — the fallback is the WeKan header blue, so with no chosen
  colour the menu matches the bar exactly.
- **A theme whose bar is a colour *slide*** — clearblue and the other `clear*`
  themes — paints the panel with the same gradient, from `boardColors.css`: a
  gradient is not a colour and cannot live in `--theme-accent`. Every theme's
  own `#header` rule names **both menus**, so a menu is never flat beside a bar
  that slides. Before this only six of the themes named the All Boards menu at
  all, so most of them coloured one menu and left the other one plain.
- **No theme rule may name the selected row any more.** It would paint that row
  the same colour as the menu behind it and leave nothing to show which row is
  selected. A guard checks that.
- **`:hover` is in the active selector list on purpose** — `li:hover` sets a
  background at the same specificity and comes later in the file, so without it
  the white would vanish as soon as the pointer crossed the selected entry.
- **Hover on an unselected entry is a wash**, `rgba(255,255,255,0.18)`, not
  solid white — solid white would be indistinguishable from the selected row.
- **The dividers and group headings went light** for the same reason the labels
  did: a dark grey rule on a coloured panel is a rule nobody can see.
- **The counts swap with the rows.** A light pill with white text on the
  coloured menu; the grey pill that reads on white for the selected row.

The label colours are not `inherit` in either direction. `inherit` is what made
the selected entry exactly the same grey as every unselected one when the fill
was dark, and it would now leave it the same white as the entries around it, on
a background that is white — the same mistake in a mirror.

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
