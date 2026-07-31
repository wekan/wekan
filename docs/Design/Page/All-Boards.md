# Design: the All Boards page

All Boards (`/board`, and the Starred / Templates / Remaining sections with it) is
a left menu, a header bar of controls, and a view of the boards themselves.

Its **Table** view is a table page: everything about the table's layout, controls
and paging is defined once in [the Table page design](Table.md), and only what is
particular to it is described here.

## The controls live in the header bar

There is **one** row of controls, and it is the **first** top header bar — the
one that is always on screen and says `All Boards / Starred`. They sit to the
**left of the notification bell**, which is exactly where a board's own controls
sit, styled the same way: `.board-header-btn`, the same Font Awesome glyphs, the
same emphasis state when a control is on.

| Control | Icon | What it does |
| --- | --- | --- |
| Sort | `fa-sort` | Opens the boards sort popup. Emphasised while a sort other than the custom order is active. |
| Search | `fa-search` | Opens the right sidebar on its search view — [Search](Search.md). |
| Multi-Selection | `fa-check-square-o` | Turns board multi-selection on and opens the sidebar that holds what to do with a selection — [Multi-Selection](Multi-Selection.md). |
| Lists / Table | `fa-trello` / `fa-table` | The view menu — see below. |

Each names itself beside its icon where the bar has room for it, and loses the
label below 1100px with every other one — see [the header](Header.md).

**Boards in Archive is not one of them.** The three above act on the boards in
front of you; Boards in Archive is a *place* you go instead, so it is a row of
the **left menu**, below the Workspaces section, with the other places. It closes
the sidebar on the way — leaving the panel open over the page it navigates to is
not what clicking a place should do.

The left menu is three kinds of thing in one column — the three board lists, the
workspaces tree, and the archive — so the Workspaces section has a rule above and
below it. Without them the tree ran into its neighbours as if it were more of the
same list. They are one hairline in the same grey as the menu's own right edge,
not a default `hr`, which is a beveled 2px ridge that reads heavier than the
border beside it.

They have been in three places. They were a row of the page's own body, then a
second top header bar, then rows of the right sidebar's home view — and that
last one meant opening a panel *over the boards* to reach the thing you came
for. They are one click now, and nothing covers the page.

**There is no hamburger on this page, and no divider before one.** The
hamburger's only destination was that home view, which listed these same four
things; a menu to reach what is already one click away is a step with nothing in
it. The sidebar is still opened — by Search and by Multi-Selection, straight
into their own view. `NO_HAMBURGER_ROUTES` in `models/lib/pageSidebar.js` is
what says so, and a board is deliberately not in it: what a board's sidebar
holds — members, labels, activities, settings — is not in the bar and has
nowhere else to be opened from.

**A Blaze event map only sees events inside its own template.** These buttons
and the sidebar's home rows are the same markup in two places, so each has its
own map; a copy with markup but no map is a button that silently does nothing,
which is what happened to Boards in Archive once already.

**Starred is not a control here.** It is a *section*, and the left menu already
lists it beside Templates and Remaining, counts it, and highlights it when it is
the one shown. A second way to reach one section, one click away from the first,
is a button whose only job is to be kept in step with the menu.

**The actions on a selection are in the sidebar**, not in this bar. They were
four icon-only buttons crowded in beside the controls; the sidebar gives each
one its name, and it is where a board keeps them too. See
[Multi-Selection](Multi-Selection.md).

### Every button names itself in a tooltip

The controls are icons, so the tooltip is the only place a name can be — a
button without one is an unlabelled picture. Every `.board-header-btn` in the
bar carries a `title`, and every title comes out of a translation key rather
than being literal English.

The ✕ that turns Multi-Selection off used to say "Clear filter", which is what a
different control does. It says `multi-selection-off` now, because there is only
one of it.

## The right sidebar

All Boards has one, and it is not the board sidebar: that one is built around a
board — its members, labels, activities and settings — and this page has no
board. What it borrows is the **shell**, so the two look and behave alike: the
same `.board-sidebar.sidebar` classes, the same `.sidebar-actions` row with the
✕, the same `.sidebar-content` with a title and a back arrow above the view.

| View | Opened by | What it is |
| --- | --- | --- |
| `home` | the back arrow of another view | The page's own menu: Search, Multi-Selection, and [Boards in Archive](Archive.md) — which is a page, so that row leaves the sidebar rather than opening in it. The default, as `homeSidebar` is on a board. No title and no back arrow — there is nothing behind it. Nothing *opens* the sidebar here any more, since those four are in the header bar; it is what you land on going back. |
| `search` | the Search button | [Search](Search.md) |
| `multiselection` | the Multi-Selection button | [Multi-Selection](Multi-Selection.md) |

Which views exist, and the template each one draws, is
`models/lib/allBoardsSidebar.js` — pure, so a guard can check that every view
resolves to a template that exists. The template names are a **map**, not
derived from the view name: deriving them produced
`allBoardsMultiselectionSidebar` for a template called
`allBoardsMultiSelectionSidebar`, and a name one letter wrong renders nothing at
all.

Open/closed and which view are two separate variables, so closing does not
forget where you were: press Search again after closing and you get the search
you had. Clicking the button of the view already showing
closes the sidebar again, so the button that opened it also shuts it. Escape
closes it — the **key** only, because the click half of `EscapeActions` would
close it on every click, including clicks on its own contents.

### Where it sits

On a **desktop** it is pinned to the viewport: `top` is
`var(--wekan-header-height)` — the height the header MEASURES itself to be,
kept current by a ResizeObserver in `client/lib/utils.js`, because the header is
not one fixed height (its buttons wrap to one, two or three rows depending on
language and window width) — and `bottom` is the window. So it is full height,
starting below the header, exactly like the board's.

It first inherited the board sidebar's `position: absolute`, which resolves
against the nearest positioned ancestor. On a board that ancestor is the board
container, which already starts below the header and runs to the bottom of the
window. This page has no such container, so the panel floated in the middle of
the page, **over** the board icons, and ended as soon as its content did.

And the boards move **left** rather than being covered:
`.all-boards-wrapper.sidebar-open .boards-layout` gives the panel its 420px
back, so the icons reflow into what is left between the menu and the panel and
every one of them stays visible.

On a **phone** neither applies: `.board-sidebar.sidebar` in the board sidebar's
own stylesheet already pins this element — it carries that class — to the full
screen width below the header, which is what a phone should do. There is nothing
to move aside from a full-width panel.

### It carries a theme

`.sidebar .sidebar-content .sidebar-btn` is a light grey box whose text is
**white**. What makes that readable on a board is a `.board-color-*` ancestor
replacing the grey with a themed colour — and this page has no board, so without
one every button is white on light grey, invisible. The theme is
`board-color-belize`, the established default for a themed thing outside a board
(`globalSearch.js` falls back to the same one).

**On an ancestor, never on the sidebar itself.** Every themed sidebar rule is a
*descendant* selector:

```css
.board-color-belize .sidebar .sidebar-content .sidebar-btn { … }
```

so a class on the `.sidebar` element matches **nothing**. The first version put
it there and the buttons stayed white on light grey; `.all-boards-sidebar-theme`
is a wrapper that *contains* the sidebar, the way a board's container contains
its own. It wraps only the sidebar, so the theme cannot bleed into the board
icons behind it, and it is out of flow — the sidebar inside is `fixed` — so it
costs no layout.

The theme is a class in the markup, so it is the **same at every width**; only
the geometry above is desktop-only.

## The view menu

The button shows the **name of the current view**, not the word "Board View" — the
same as the board header, which says "Swimlanes" or "Lists" rather than naming the
menu. It offers two:

| View | Icon | What it is |
| --- | --- | --- |
| **Lists** | `fa-trello` | The board icons. **The default.** |
| **Table** | `fa-table` | The table page below. |

"Lists" is the default and is what an account that has never chosen sees.

The choice is remembered per browser (`localStorage`), not on the user document:
it is a view preference for this page, it changes nothing anybody else can see,
and it is not worth a profile field or a round trip. This is the one place All
Boards deliberately differs from a board, whose view IS on the profile because it
follows the user between devices.

## The Table view

A table page, editable — which is the difference from
[Public Boards](Public.md), the other board table, which is read-only.

| Column | What it is |
| --- | --- |
| Edit | A pencil that opens the **Edit board title** popup — the same `boardChangeTitlePopup` the Swimlanes view opens from its board menu, with the same title and description fields and the same Rename button. |
| Board title | The board's title. The link: it opens the board. |
| Board description | The board's description. |

The Edit popup is the *same* popup, not a copy of it. It took one change to make
that true: its submit handler read `Utils.getCurrentBoard()`, which is the board
you are looking at — and on All Boards you are not looking at one. It now takes
the board from its own data context when it has one and falls back to the current
board, so the board header keeps working exactly as before and a table row can
open it for the board of that row.

Rows are ten per page, the shared `TABLE_PAGE_ROWS_PER_PAGE`, and the table shows
the boards of the section the left menu has selected, filtered by the search
field — the same set the Lists view would draw.

## What stays on the left

The left menu keeps its sections (Starred, Templates, Remaining), the workspaces
tree and the organization / team filters. Starred is *only* here now: the header
bar had a Starred button beside it, and two ways to reach one section, one click
apart, is a control that has to be kept in step with the menu for no gain.

## Related files

Only what is particular to this page; everything shared by table pages is in
[Table.md's own list](Table.md#related-files), and the two shared header-bar
controls have their own lists in [Search](Search.md) and
[Multi-Selection](Multi-Selection.md).

| File Path | File Type | Description |
| --- | --- | --- |
| `client/components/boards/boardsList.jade` | `.jade` template | `boardList` (the page), `boardListHeaderBar` (the controls) and `allBoardsRow` (a Table row). |
| `client/components/boards/boardsList.js` | `.js` Blaze template logic | The controls' handlers, the view switch, the Table column spec. |
| `client/components/boards/boardsList.css` | `.css` stylesheet | The page's own layout. The header bar and the sidebar reuse the board header's and board sidebar's styles rather than restating them. |
| `client/components/boards/allBoardsSidebar.jade` | `.jade` template | The sidebar shell and its three views. |
| `client/components/boards/allBoardsSidebar.js` | `.js` Blaze template logic | The views' helpers and handlers. |
| `models/lib/allBoardsSidebar.js` | `.js` module, pure | Which sidebar views exist, their titles and the template each one draws. No Meteor, so it is unit-testable. |
| `client/lib/allBoardsSidebar.js` | `.js` module | Whether the sidebar is open and on which view, and the Escape action that closes it. |
| `models/lib/allBoardsView.js` | `.js` module, pure | Which board views exist, which is the default, and how an unrecognised stored value is treated. |
| `client/lib/allBoardsView.js` | `.js` module | The Meteor and browser glue: the ReactiveVars the templates share (they are separate Blaze instances) and the `localStorage` the view choice is kept in. |
| `client/components/boards/boardHeader.jade` | `.jade` template | `boardChangeTitlePopup`, shared with the Swimlanes view. |
| `client/features/boards.js` | `.js` import list | Every `.jade` above has to be imported here, or its templates do not exist at runtime. |
| `tests/allBoardsPage.test.cjs` | `.cjs` Node test | The controls are in the header bar and nowhere else, the sidebar's shell and views, the view menu's two entries and its default, the Table's columns, and that the Edit popup is the shared one. |
| `tests/templateRegistration.test.cjs` | `.cjs` Node test | Every `.jade` is imported, and every `+template` it includes exists. |

## Related

- [Boards in Archive](Archive.md) — the page the sidebar's Archive row opens
- [The All Boards URLs](All-Boards-URLs.md) — a URL per left-menu entry, workspaces included
- [Search](Search.md) — the shared Search control and both search views
- [Multi-Selection](Multi-Selection.md) — the shared Multi-Selection control and both views
- [The Table page design](Table.md) — everything shared by table pages
- [Public Boards](Public.md) — the other board table, read-only
- [Left menu](Left-Menu.md)
