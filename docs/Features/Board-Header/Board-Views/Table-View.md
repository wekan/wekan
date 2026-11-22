# Table view

## What it is

The Table view shows the board's cards as a table: one row per card, sortable
by every column, searchable and paged. It is the board as a spreadsheet-like
list, for scanning many cards and their dates at once, and for adding and
moving cards without dragging them across lists. A board admin can hide the
view in [Board Settings / Board View](../../Board-Sidebar/Board-Settings/Board-View.md),
and a site admin can turn it off for the whole instance in Admin Panel /
Settings / Features ("Table view").

## Read more

- [Table (information)](https://en.wikipedia.org/wiki/Table_(information)) and
  [Pagination](https://en.wikipedia.org/wiki/Pagination) at Wikipedia.
- WeKan: [Filter](../../Board-Sidebar/Filter/README.md),
  [Roles](../../Board-Sidebar/Members/Roles.md),
  [Board Settings / Card](../../Board-Sidebar/Board-Settings/Card.md) (which
  dates are shown),
  [Board Settings / Board View](../../Board-Sidebar/Board-Settings/Board-View.md),
  [Admin Panel / Settings / Features](../../Admin-Panel/Settings/Features.md),
  [Large boards](../../Admin-Panel/Problems/Large-Boards.md).

## How to use it

**Open it.** Board header → **Board View** → **Table** (in the menu's **Board**
group).

**What it shows.** Every card of the board that is not archived and not in an
archived list or swimlane, narrowed by the
[sidebar Filter](../../Board-Sidebar/Filter/README.md). 25 rows per page.

| Column | Shown |
| --- | --- |
| Edit | always - opens the card over the table |
| Card, List, Swimlane | always |
| Assignees, Members, Labels | not on a small screen |
| Received, Start, Due, End | when the board shows that date at the card or at the minicard (Board Settings / Card), and not on a small screen |

On a lazily loaded large board the page is built on the server
(`boardTablePage` publication), sorted and paged there, and a linked card shows
its source card's dates.

**Controls**

- **Sort**: click a column header. Clicking it again reverses the order; a new
  column starts ascending. Empty values always sort last, ties by title. The
  default is the card title, ascending.
- **Search**: matches title, list, swimlane and label names, ignoring case.
  Enter or the **Search** button runs it. It is not saved.
- **Previous / Next** and the page counter.
- **Wrap titles**: wrap long card titles or cut them with an ellipsis. Saved
  in this browser, per user. The button's tooltip says which mode is on.
- **Group by swimlane**: a header row per swimlane, rows ordered by swimlane,
  then by the chosen column. Saved in this browser, per user.

**Changing cards.** Shown only to those who may change the board, and checked
again by the server:

1. **Drag a row onto another row** to move its card just before that card, into
   its list and swimlane (#864).
2. **+** in an empty date cell sets that date; an existing date opens its
   editor.
3. **Add Card** at the bottom: type the title, choose the list and the
   swimlane, and click **Add Card**. The server (`tableViewAddCard`) checks
   the list's role rules, puts the card last in that cell and numbers it.

Role permissions apply here as in every view; see
[Roles](../../Board-Sidebar/Members/Roles.md).

## How the numbers are calculated

- **Rows per page** = 25; **pages** = `max(1, ceil(rows / 25))`, where rows
  is the number of matching cards (on a lazy board, the total the server
  reports); the page shown is never past the last page
  ([client/components/boards/tableView.js](../../../../client/components/boards/tableView.js)).
- **Sorting** ([models/lib/tableViewSort.js](../../../../models/lib/tableViewSort.js)):
  text columns compare case-insensitively and number-aware (`localeCompare`
  with `numeric: true, sensitivity: 'base'`, so "Card 2" comes before
  "Card 10"); date columns compare by time; an empty value is last in both
  directions; equal values are ordered by title.
- **Date columns**: a date column is shown when the board has that date on the
  card or on the minicard; on a small screen the date columns are hidden.
- **Add Card**: the title has its runs of whitespace collapsed, is trimmed and
  cut to 1 000 characters; an empty title is refused. The new card's sort is
  the last card's sort in that list and swimlane plus 1 (0 in an empty cell),
  and its number is the board's next card number
  ([server/tableViewCards.js](../../../../server/tableViewCards.js)).

## How it works in WeKan

- **View**: `client/components/boards/tableView.jade`, `.js` and `.css`
  ([tableView.jade](../../../../client/components/boards/tableView.jade),
  [tableView.js](../../../../client/components/boards/tableView.js),
  [tableView.css](../../../../client/components/boards/tableView.css)).
- **Pure modules**: `models/lib/tableViewFilter.js` (the card selector, ANDed
  with the Filter), `tableViewSort.js`, `tableViewGrouping.js`,
  `tableViewTitleMode.js` (the two browser-saved toggles), `tableViewDrop.js`
  (where a dropped row goes) -
  [tableViewFilter.js](../../../../models/lib/tableViewFilter.js),
  [tableViewSort.js](../../../../models/lib/tableViewSort.js),
  [tableViewGrouping.js](../../../../models/lib/tableViewGrouping.js),
  [tableViewTitleMode.js](../../../../models/lib/tableViewTitleMode.js),
  [tableViewDrop.js](../../../../models/lib/tableViewDrop.js).
- **Server**: `server/tableViewCards.js` (`tableViewAddCard`, which checks
  `canWriteInList`) and `server/publications/boardTablePage.js` (the
  `boardTablePage` publication for lazy boards) -
  [server/tableViewCards.js](../../../../server/tableViewCards.js),
  [server/publications/boardTablePage.js](../../../../server/publications/boardTablePage.js).
- **Tests**: `tests/tableView*.test.cjs`,
  `tests/integration/boardTablePage.test.cjs`,
  `tests/playwright/specs/table-lazy-page.e2e.js`, for example
  [tests/tableViewSort.test.cjs](../../../../tests/tableViewSort.test.cjs),
  [tests/tableViewDrop.test.cjs](../../../../tests/tableViewDrop.test.cjs),
  [tests/tableViewGrouping.test.cjs](../../../../tests/tableViewGrouping.test.cjs),
  [tests/tableViewTitleMode.test.cjs](../../../../tests/tableViewTitleMode.test.cjs),
  [tests/integration/boardTablePage.test.cjs](../../../../tests/integration/boardTablePage.test.cjs),
  [tests/playwright/specs/table-lazy-page.e2e.js](../../../../tests/playwright/specs/table-lazy-page.e2e.js),
  [tests/playwright/specs/table-linked-dates.e2e.js](../../../../tests/playwright/specs/table-linked-dates.e2e.js).

## Commits

 - [Table view checked on phones, foldables, tablets and touchscreens](https://github.com/wekan/wekan/commit/e34a488617c8061f8d6ca43cb6a32f05105b96c9)
 - [Swimlane header rows span every column; the add-card error is translated](https://github.com/wekan/wekan/commit/0fff9d4828660666c1af0c9ffd48c7eea8aee1bd)
 - [Add cards, and drag a row onto another to move its card](https://github.com/wekan/wekan/commit/0a566dc9acff258ba71c9a896fe916638acb941a)
 - [Optional features: a site admin can turn the Table view off](https://github.com/wekan/wekan/commit/18d57b2b8f789b11409afbd485cff139adeb3095)
 - [Linked cards' authorized dates on lazy Table pages](https://github.com/wekan/wekan/commit/c273b12e233f66c06f4adad7055e8ea01050f6c7)
 - [Table pages built on the server in lazy card mode](https://github.com/wekan/wekan/commit/1c1b78d473f6b34ab578828d73d89cb73a8016d4)
 - [Security-aware title viewer for the table rows](https://github.com/wekan/wekan/commit/457614a2acd21dae9bfff49dfc955695a2bc4ebb)
 - [The toolbar's controls vertically centred](https://github.com/wekan/wekan/commit/663a5a1cc6dfa4f7b380798eb9da49fcea3fe7ab)
 - [Descriptive tooltips on the toggle buttons](https://github.com/wekan/wekan/commit/7b6b9d519a075eef6dd1126abab93fdda9369edd)
 - [Pagination buttons themed like the Search button](https://github.com/wekan/wekan/commit/2d89c086a174c4001883a455503ff17a45514755)
 - [Optional grouping by swimlane](https://github.com/wekan/wekan/commit/0847af8ec68f19b7dcd4e4a7fb44ebb1a06b7ce5)
 - [Column sorting restored](https://github.com/wekan/wekan/commit/828cb5e534251910c72cc0275d58ffe87ea93124)
 - [Responsive table, with title wrapping](https://github.com/wekan/wekan/commit/ad6a7b7c8cf5e82a89f420d20ab18c2dcb8ed821)
 - [The board Filter applies in the Table view](https://github.com/wekan/wekan/commit/bdec1744f49d3d5a4c7cc9835dcbf215155c5470)
 - [Clickable column-header sorting removed for a while](https://github.com/wekan/wekan/commit/6d3c550d8d462fa92984fd6dee644642706569b1)
 - [Columns for assignees, members, labels and all four dates](https://github.com/wekan/wekan/commit/2b9eab766726f3953c708878d2deba0f66df2edb)
 - [Markdown and emoji in the table cells](https://github.com/wekan/wekan/commit/5dfe6c3deb725d1a7143b84c8872725525f812af)
 - [The board Table view added](https://github.com/wekan/wekan/commit/e085e5bfeb7b1a00be6d39b413cec7078a20134b)
