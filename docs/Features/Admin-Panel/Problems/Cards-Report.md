# Admin Panel / Problems / Cards Report

## What it is

Every card on the instance, with where it is and who is on it. Address:
`/admin/problems/cards`. Site administrators only, over every board, whether or
not the administrator is a member. It answers *where is this card, and who
are its members and assignees* without opening the boards one by one.

## Read more

- [Kanban board](https://en.wikipedia.org/wiki/Kanban_board) on Wikipedia - the
  board, lists and cards this report lists.
- WeKan: [Broken Cards](Broken-Cards.md) - the cards that are missing a board,
  swimlane or list; [Boards Report](Boards-Report.md);
  [Table page](../../General/Table.md).

## How to use it

1. Open your member menu (your avatar at the top right) and click
   **Admin Panel**.
2. Click the **Problems** tab at the top.
3. In the left menu, under **Reports**, click **Cards Report**.
4. To find a card, type part of its title in the search box and press
   **Enter** (case-insensitive). The list starts again from page 1.
5. Use the previous / next buttons to page through the cards.

The pane is read-only.

| Column | Holds |
| --- | --- |
| Card Title | the title; longer than 30 characters is cut to 29 and `...` |
| Board, Swimlane, List | the titles of each, cut the same way |
| Members | user names of the card's members |
| Assignees | user names of the card's assignees |

## How the numbers are calculated

- **Rows per page**: 10 (`TABLE_PAGE_ROWS_PER_PAGE`).
- **Total**: `getCardsReportCount(search)` counts every card whose title matches
  (all cards when the search is empty), archived cards included; pages =
  `max(1, ceil(total / 10))`. The total is counted once when the pane opens or
  the search changes, not on every page.
- **Order**: by board, then newest first (`{ boardId: 1, createdAt: -1 }`),
  the existing index of `cards`, so one page is a bounded index scan instead of
  a sort of every card in memory.

## How it works in WeKan

- [server/publications/cards.js](../../../../server/publications/cards.js) -
  the `cardsReport` publication and the `getCardsReportCount` method, both
  admin-only. Only the six fields the table draws are sent (`title`, `boardId`,
  `listId`, `swimlaneId`, `members`, `assignees`), not whole card documents,
  with the titles of their boards, lists and swimlanes and the members' safe
  user fields (never the current user's, \#6919). The page is published
  manually (no live cursor, which hangs on FerretDB's oplog) and named with
  `publishReportPage`.
- [client/components/settings/adminProblems.js](../../../../client/components/settings/adminProblems.js) -
  the `report-cards` column spec in `REPORT_TABLES`, drawn by the shared
  [table page](../../General/Table.md).
- Tests: [tests/adminPageRows.test.cjs](../../../../tests/adminPageRows.test.cjs),
  [tests/paginationIndexes.test.cjs](../../../../tests/paginationIndexes.test.cjs)
  (the index-backed sort) and
  [tests/tablePage.test.cjs](../../../../tests/tablePage.test.cjs).

## Commits

 - [Tests for the card reports](https://github.com/wekan/wekan/commit/79c40407d105e6ded167eb7a84795ad7ebf62641)
 - [Members sent to the report never include the current user's partial profile](https://github.com/wekan/wekan/commit/b05972c4c88e108526c85ad3598867d781395e98)
 - [Paginate honestly: one page of ten, index-backed](https://github.com/wekan/wekan/commit/c1add5bc5e5537e3cc8f96076164ebdf4328b0e8)
 - [Faster loading and previous / next paging](https://github.com/wekan/wekan/commit/668802cd7f98fa9df514f4bbc98f12e7bc5e029b)
 - [Publish the page manually so it loads on FerretDB](https://github.com/wekan/wekan/commit/dded8ed47695092a698ab3e34a8abc5c6f567607)
 - [Load one page fast through an index-backed sort](https://github.com/wekan/wekan/commit/f7c4a916f0105b57b7a4212ad5a66f3d4e4f770f)
 - [Fix the Cards Report not working](https://github.com/wekan/wekan/commit/2b02e7712ee6a8ae8af5d416ce2d288a25386fdf)
 - [Add the Cards report](https://github.com/wekan/wekan/commit/661e80084c6fe29001313691183a0688d7b34e17)
