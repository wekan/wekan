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
| Search | `fa-search` | **A field, not a button** — see below. |
| Lists / Table | `fa-trello` / `fa-table` | The view menu — see below. |
| Multi-Selection | `fa-check-square-o` | Turns board multi-selection on, with its ✕ to turn it off, exactly as on a board. |

The order reads left to right as **what is shown**, then **what is selected**:
Sort, Search and the view menu decide what you are looking at; Multi-Selection
comes after them, and the actions on a selection come after it, because they are
what it turns on.

**Starred is not a control here.** It is a *section*, and the left menu already
lists it beside Templates and Remaining, counts it, and highlights it when it is
the one shown. A second way to reach one section, one click away from the first,
is a button whose only job is to be kept in step with the menu.

The **actions on a selection** follow them, to the right, and appear only while
something is selected — four buttons that would do nothing are worse than no
buttons:

| Action | Icon | What it does |
| --- | --- | --- |
| Move Board to Archive | `fa-archive` | Archives every selected board, after a confirm. |
| Duplicate Board | `fa-clipboard` | Copies every selected board, after a confirm. |
| Selected: ★ | `fa-star` | Stars every selected board that is not starred yet. Never un-stars. |
| Selected: ⌂ | `fa-home` | Makes the first selected board the Home board, opened after login. |

Star and home stay **icon-only**, under the "Selected:" label that names them,
because their names are sentences — "Set as Home board (opened after login)" —
that belong in a tooltip rather than on a button, and spelling them out pushes
the bar onto a second row. The label is a label: it takes neither
`.board-header-btn` nor any button behaviour.

**There is no bar above the boards at all.** The page used to carry its own row
of controls there — Multi-Selection with its archive and duplicate actions, the
sort button, the search box, the "Selected:" actions — inside
`.boards-path-header`. Two bars of controls on one page, one of them styled like
the board header and one not, is the thing this design removes: the header bar is
where a WeKan page puts its controls, and All Boards now agrees with every other
page about that.

Emptying that bar left a white strip above "+ Add Board" holding the current
section's Font Awesome icon, and nothing else. Two things already say which
section you are in — the left menu highlights it, and the header bar names the
page — so the strip is gone too, along with the `currentMenuPath` helper that
resolved a workspace path to an icon and a name for it, every
`.boards-path-header` rule, and the `pulse` animation whose only user was its
multi-selection hint. The board icons start at the top of the right column.

Because a Blaze event map only sees events inside its own template, the handlers
for the selection actions moved to `boardListHeaderBar` with their buttons, and
`hasBoardsSelected` is registered there as well as on `boardList`. The reverse
applies to the section switch: `js-select-menu` and `isSelectedMenu` belong to
`boardList`, where the left menu is, and the header bar's copies went with its
Starred button.

A control that moves between templates takes its **stylesheet** with it or stops
being styled at all, silently — `.boards-path-header .board-search` kept matching
nothing for two commits while the box rendered at the browser's default input
size. The rules are `.all-boards-controls …` now.

### Search is a field

Not a button that opens a search view. The header bar carries the search **input**
itself, with the magnifier beside it and a ✕ to clear, and it behaves exactly as
the old right-pane search did: it filters as you type, it searches across *all*
your boards — Starred, Templates, Remaining and every workspace — ignoring the
selected section while it has text in it, and Escape clears it.

That is a deliberate difference from the board header, whose Search is a button:
on a board, search opens a whole search view over cards; here it is a filter over
a list of boards, and a filter belongs in the bar it filters.

The box is **150px** wide — half the 300px it was first drawn at, which was
itself half of the 600px before that: it shares a bar with the other controls
now rather than having a card to itself. It is a white box on a themed bar, so
the text, the magnifier and the ✕ all set their own colour; inheriting the bar's
light-on-dark would put white text in a white box.

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
