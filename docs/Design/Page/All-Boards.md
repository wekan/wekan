# Design: the All Boards page

All Boards (`/board`, and the Starred / Templates / Remaining sections with it) is
a left menu, a header bar of controls, and a view of the boards themselves.

Its **Table** view is a table page: everything about the table's layout, controls
and paging is defined once in [the Table page design](Table.md), and only what is
particular to it is described here.

## The controls live in the header bar

There is **one** row of controls, and it is the second top header bar — the same
bar that says "My Boards" or "Public" — laid out and styled exactly like the board
header of the Swimlanes view: `.board-header-btn`, the same Font Awesome glyphs,
the same emphasis state when a control is on.

| Control | Icon | What it does |
| --- | --- | --- |
| Sort | `fa-sort` | Opens the boards sort popup. Emphasised while a sort other than the custom order is active. |
| Search | `fa-search` | Opens the right sidebar on its search view — [Search](Search.md). |
| Lists / Table | `fa-trello` / `fa-table` | The view menu — see below. |
| Multi-Selection | `fa-check-square-o` | Turns board multi-selection on and opens the sidebar that holds what to do with a selection — [Multi-Selection](Multi-Selection.md). |

Then, in their own flex item and last in the source, a **divider and the sidebar
hamburger** — `.board-header-btns.board-header-sidebar-toggle` holding
`.separator` and `a.board-header-btn.js-toggle-all-boards-sidebar`, laid out
exactly as the board header has them. Last in the source is what lets the
hamburger stay in the top right of the bar on a phone, beside the title, while
the other buttons wrap to a second row.

The order reads left to right as **what is shown**, then **what is selected**:
Sort, Search and the view menu decide what you are looking at; Multi-Selection
comes after them, because the actions it turns on are in the sidebar it opens.

**Search and Multi-Selection are shared with the board header.** They are one
template each, `headerBarControls.jade`, included by this bar and by the board
header of the Swimlanes view, and they do the same kind of thing on both pages:
open the right sidebar on that view. Only the markup is shared — what a click
does is not, because a board searches and selects cards while this page searches
and selects boards. Their own designs are [Search](Search.md) and
[Multi-Selection](Multi-Selection.md); everything below is what is particular to
All Boards.

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
different control does. It says `multi-selection-off` now, in both header bars,
because there is only one of it.

## The right sidebar

All Boards has one, and it is not the board sidebar: that one is built around a
board — its members, labels, activities and settings — and this page has no
board. What it borrows is the **shell**, so the two look and behave alike: the
same `.board-sidebar.sidebar` classes, the same `.sidebar-actions` row with the
✕, the same `.sidebar-content` with a title and a back arrow above the view.

| View | Opened by | What it is |
| --- | --- | --- |
| `home` | the hamburger | The page's own menu: Search, Multi-Selection, Boards in Archive. The default, as `homeSidebar` is on a board. No title and no back arrow — there is nothing behind it. |
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
forget where you were: open the sidebar with the hamburger after searching and
you get the search you had. Clicking the button of the view already showing
closes the sidebar again, so the button that opened it also shuts it. Escape
closes it — the **key** only, because the click half of `EscapeActions` would
close it on every click, including clicks on its own contents.

The shell is `position: absolute`, so the page gives it something to position
against: `.wrapper.all-boards-wrapper` is `position: relative`. Without that it
anchors to the initial containing block and scrolls away from the page.

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
| `client/components/boards/headerBarControls.jade` | `.jade` template | `headerSearchButton` and `headerMultiSelectionButton`, shared with the board header. |
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

- [Search](Search.md) — the shared Search control and both search views
- [Multi-Selection](Multi-Selection.md) — the shared Multi-Selection control and both views
- [The Table page design](Table.md) — everything shared by table pages
- [Public Boards](Public.md) — the other board table, read-only
- [Left menu](Left-Menu.md)
