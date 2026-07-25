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
| `models/lib/leftMenu.js` | `.js` module, pure helpers | `buildMenuItems()` turns a plain item list plus the active id into what the template renders. `activeCount()` proves only one row is ever active. |
| `client/components/settings/settingBody.css` | `.css` stylesheet | The `.side-menu` look and width, and the flex row that places it beside `.main-body`. Shared by every Admin Panel page. |
| `client/components/settings/tablePage.css` | `.css` stylesheet | The ≤ 800px rule that stacks the menu above the content instead of squeezing both onto one row. |
| `client/components/settings/settingBody.jade` | `.jade` template | Admin Panel / Settings. |
| `client/components/settings/peopleBody.jade` | `.jade` template | Admin Panel / People (People, Organizations, Teams, Domains, Locked users, Roles, Templates). |
| `client/components/settings/adminFeatures.jade` | `.jade` template | Admin Panel / Features. |
| `client/components/settings/attachments.jade` | `.jade` template | Admin Panel / Attachments. |
| `client/components/settings/adminReports.jade` | `.jade` template | Admin Panel / Problems. |
| `client/components/settings/translationBody.jade` | `.jade` template | Admin Panel / Translation. |
| `client/components/settings/informationBody.jade` | `.jade` template | Admin Panel / Info. |
| `tests/leftMenu.test.cjs` | `.cjs` Node test | The one suite: the pure helpers, the template, the side placement and mirroring, and that no page re-implements the menu. |

## Pages that use this design

### Admin Panel

| Menu name | Menu path | Description |
| --- | --- | --- |
| Settings | Admin Panel / Settings | Registration, E-mail, Accounts, Table visibility mode, Announcement, Accessibility, Layout, Webhook. |
| People | Admin Panel / People | People, Organizations, Teams, Domains, Locked users, Roles, Shared templates. |
| Features | Admin Panel / Features | Performance, Security, Notifications. |
| Attachments | Admin Panel / Attachments | The storage backends and the attachment/avatar tools. |
| Problems | Admin Panel / Problems | Summary, Security, Speed, Tests, CPU usage, then the reports — see [Table](Table.md). |
| Translation | Admin Panel / Translation | The single Translation entry. |
| Info | Admin Panel / Info | The single Info entry. |

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

Most of the menu is deliberately **neutral**: the panel is a light grey card
(`#f7f7f7` on `#f0f0f0`) and the row you are on, or hover, lifts to white with a
soft shadow. That is the WeKan default look and it does not change with the theme
— a menu is chrome, and tinting the whole card would fight the content beside it.

The **themeable part is the active entry's label**:

```css
.side-menu ul li.active > a { color: var(--theme-accent, inherit); }
```

- **Per-user theme** — Member Settings → Change color sets `--theme-accent` on
  `:root`, and the entry you are on picks it up, for that user only.
- **WeKan default** — with no custom colour the fallback is `inherit`, so the
  label keeps the normal text colour and the menu looks exactly as it always has.

So: nothing in the menu is hard-coded to a *brand* colour, and the one part that
should follow a chosen theme does. If you add a themeable part, take the colour
from `var(--theme-accent, …)` with a fallback that reproduces today's look, and
never introduce a second accent variable.

The Font Awesome icons inherit their colour from the entry, so an active entry's
icon follows the accent with the label.

## Layout

- **Wide windows** — the menu keeps a fixed width beside the content, which fills
  the rest of the row.
- **Narrow windows (≤ 800px)** — the menu goes full width on top and the content
  sits **below** it, rather than the two being squeezed side by side. The rule
  lives in `tablePage.css` and applies to the whole `.content-body`, so both
  designs stack the same way.

## Entries

A page describes its menu as data, not as markup:

```js
{ id, icon, labelKey, cls }   // one entry
{ separator: true }           // a horizontal rule between groups
```

- `id` is what the page's click handler reads from `data-id`.
- `icon` is the Font Awesome class, `labelKey` an i18n key.
- `buildMenuItems(items, activeId, jsClass)` marks exactly **one** entry active,
  from the id the page passes in — so a menu cannot highlight two rows at once,
  which is what happens when each entry has its own `isXActive` helper.
- A conditional entry may be `null` (e.g. the E-mail entry is absent on
  Sandstorm); holes are dropped rather than rendered as an empty row.

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
3. Handle `click .js-left-menu-item` and switch on `data-id`.
