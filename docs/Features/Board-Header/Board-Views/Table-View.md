# Table view

Board header → **Board View** → **Table**. The board's cards as a table: one row
per card, sortable by every column. A board admin can hide the view in
[Board Settings / Board View](../../Board-Sidebar/Board-Settings/Board-View.md),
and a site admin can turn it off for the whole instance in Admin Panel /
Settings / Visibility / Features ("Table view").

## What it shows

Every card of the board that is not archived and not in an archived list or
swimlane, narrowed by the [sidebar Filter](../../Board-Sidebar/Filter/README.md).
25 rows per page.

| Column | Shown |
| --- | --- |
| Edit | always - opens the card over the table |
| Card, List, Swimlane | always |
| Assignees, Members, Labels | not on a small screen |
| Received, Start, Due, End | when the board shows that date at the card or at the minicard (Board Settings / Card), and not on a small screen |

On a lazily loaded large board the page is built on the server
(`boardTablePage` publication), sorted and paged there, and a linked card shows
its source card's dates.

## Controls

- **Sort**: click a column header. Clicking it again reverses the order; a new
  column starts ascending. Empty values always sort last, ties by title. The
  default is the card title, ascending.
- **Search**: matches title, list, swimlane and label names, ignoring case.
  Enter or the Search button runs it. It is not saved.
- **Previous / Next** and the page counter.
- **Wrap titles**: wrap long card titles or cut them with an ellipsis. Saved
  in this browser, per user.
- **Group by swimlane**: a header row per swimlane, rows ordered by swimlane,
  then by the chosen column. Saved in this browser, per user.

## Changing cards

Shown only to those who may change the board, and checked again by the server:

- **Drag a row onto another row** to move its card just before that card, into
  its list and swimlane (#864).
- **+** in an empty date cell sets that date; an existing date opens its editor.
- **Add Card** at the bottom: title, list and swimlane. The server
  (`tableViewAddCard`) checks the list's role rules, puts the card last in that
  cell and numbers it.

Role permissions apply here as in every view; see
[Roles](../../Board-Sidebar/Members/Roles.md).

## Implementation

`client/components/boards/tableView.jade`, `.js` and `.css`;
`models/lib/tableViewFilter.js`, `tableViewSort.js`, `tableViewGrouping.js`,
`tableViewTitleMode.js`, `tableViewDrop.js`; `server/tableViewCards.js`;
`server/publications/boardTablePage.js`. Tests: `tests/tableView*.test.cjs`,
`tests/integration/boardTablePage.test.cjs`,
`tests/playwright/specs/table-lazy-page.e2e.js`.
