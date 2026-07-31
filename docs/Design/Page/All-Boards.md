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
| Starred | `fa-star` | Shows only the starred boards. On when the Starred section is selected. |
| Sort | `fa-sort` | Opens the boards sort popup. Emphasised while a sort other than the custom order is active. |
| Search | `fa-search` | **A field, not a button** — see below. |
| Multi-Selection | `fa-check-square-o` | Turns board multi-selection on, with its ✕ to turn it off, exactly as on a board. |
| Lists / Table | `fa-trello` / `fa-table` | The view menu — see below. |

**There is no second controls bar.** The page used to carry its own row of
controls above the board icons — Multi-Selection with its archive and duplicate
actions, the sort button, the search box, the "Selected:" actions — inside
`.boards-path-header`. Two bars of controls on one page, one of them styled like
the board header and one not, is the thing this design removes: the header bar is
where a WeKan page puts its controls, and All Boards now agrees with every other
page about that.

### Search is a field

Not a button that opens a search view. The header bar carries the search **input**
itself, with the magnifier beside it and a ✕ to clear, and it behaves exactly as
the old right-pane search did: it filters as you type, it searches across *all*
your boards — Starred, Templates, Remaining and every workspace — ignoring the
selected section while it has text in it, and Escape clears it.

That is a deliberate difference from the board header, whose Search is a button:
on a board, search opens a whole search view over cards; here it is a filter over
a list of boards, and a filter belongs in the bar it filters.

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
tree and the organization / team filters. Starred appears in *both* places on
purpose: in the menu it is a section beside the others, and in the header bar it
is the one-click way to get to it, the way the star sits in a board's header.

## Related files

Only what is particular to this page; everything shared by table pages is in
[Table.md's own list](Table.md#related-files).

| File Path | File Type | Description |
| --- | --- | --- |
| `client/components/boards/boardsList.jade` | `.jade` template | `boardList` (the page), `boardListHeaderBar` (the controls) and `allBoardsRow` (a Table row). |
| `client/components/boards/boardsList.js` | `.js` Blaze template logic | The controls' handlers, the view switch, the Table column spec. |
| `client/components/boards/boardsList.css` | `.css` stylesheet | The page's own layout. The header bar reuses the board header's styles rather than restating them. |
| `models/lib/allBoardsView.js` | `.js` module, pure | Which views exist, which is the default, and how an unrecognised stored value is treated. No Meteor, so it is unit-testable. |
| `client/lib/allBoardsView.js` | `.js` module | The Meteor and browser glue: the ReactiveVars the two templates share (they are separate Blaze instances) and the `localStorage` the view choice is kept in. |
| `client/components/boards/boardHeader.jade` | `.jade` template | `boardChangeTitlePopup`, shared with the Swimlanes view. |
| `tests/allBoardsPage.test.cjs` | `.cjs` Node test | The controls are in the header bar and nowhere else, the view menu's two entries and its default, the Table's columns, and that the Edit popup is the shared one. |

## Related

- [The Table page design](Table.md) — everything shared by table pages
- [Public Boards](Public.md) — the other board table, read-only
- [Left menu](Left-Menu.md)
