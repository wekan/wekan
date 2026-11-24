# Admin Panel / Problems / Boards Report

## What it is

Every board on the instance, with its visibility, members, organizations and
teams. Address: `/admin/problems/boards`. Site administrators only, and over
the whole instance, not only the boards the administrator is a member of. It is
for answering *which boards exist, who can see each one, and who is on it*
without opening every board.

## Read more

- [Kanban board](https://en.wikipedia.org/wiki/Kanban_board) and
  [Kanban (development)](https://en.wikipedia.org/wiki/Kanban_(development)) on
  Wikipedia - what a board is.
- WeKan: [Organizations](../People/Organizations.md),
  [Teams](../People/Teams.md), [Cards Report](Cards-Report.md),
  [Table page](../../Table.md) (the shared table this pane uses).

## How to use it

1. Open your member menu (your avatar at the top right) and click
   **Admin Panel**.
2. Click the **Problems** tab at the top.
3. In the left menu, under **Reports**, click **Boards Report**.
4. To find a board by name, type part of its title in the search box and press
   **Enter**. The search matches the title, case-insensitively, and starts again
   from page 1.
5. To see only boards of one visibility, choose it in **Permission**: All,
   Public, Signed-in users or Private. The list starts again from page 1.
6. Use the previous / next buttons to page through the boards.

The pane is read-only.

| Column | Holds |
| --- | --- |
| Title | the board title; a title longer than 30 characters is cut to 29 and `...` |
| Id | the board id, cut the same way |
| Permission | `public`, `instance` (shown in the filter as Signed-in users) or `private` |
| Archived? | Yes or No |
| Members | user names of the active members; a removed member is not listed ([#5122](https://github.com/wekan/wekan/issues/5122)) |
| Organizations | the display names of the organizations the board is shared with |
| Teams | the display names of the teams the board is shared with |

## How the numbers are calculated

- **Rows per page**: 10 (`TABLE_PAGE_ROWS_PER_PAGE` in
  [models/lib/tablePage.js](../../../../models/lib/tablePage.js)).
- **Total and pages**: the total is `getBoardsReportCount(search, permission)`,
  a count of the same query the page uses; pages =
  `max(1, ceil(total / 10))`. The total is counted again only when the search
  or the filter changes, not on every page; a page past the end after rows were
  removed is moved back to the last page.
- **Order**: the boards' default sort order (`sort: { sort: 1 }`).
- **Archived boards** are included and marked Yes.

## How it works in WeKan

The shared [table page](../../Table.md) renders it, fetched one page at a
time from the server:

- [server/publications/boards.js](../../../../server/publications/boards.js) -
  the `boardsReport` publication and the `getBoardsReportCount` method. Both
  refuse anybody who is not a site administrator (`isAdmin`); the publication
  returns nothing and the method throws `not-authorized`. The query is
  `boardsReportQuery`: an escaped, case-insensitive title regex and, unless the
  filter is All, `permission`. The page is published manually (fetch, `added`,
  `ready`) rather than as a live cursor, because a sorted and limited live
  observe hangs on FerretDB's oplog. With the boards it publishes the members'
  safe user fields (never the current user's, \#6919), and the boards'
  organizations and teams.
- [client/components/settings/adminProblems.js](../../../../client/components/settings/adminProblems.js) -
  the `report-boards` column spec in `REPORT_TABLES`, `memberNames` (which skips
  members with `isActive: false`), the Permission filter and the paging.
- Collections: `boards` (`title`, `permission`, `archived`, `members`, `orgs`,
  `teams`, `sort`), `users`, `org`, `team`.
- Tests: [tests/boardsReportFilter.test.cjs](../../../../tests/boardsReportFilter.test.cjs)
  pins the Permission filter,
  [tests/adminPageRows.test.cjs](../../../../tests/adminPageRows.test.cjs) the
  page of ten, and [tests/tablePage.test.cjs](../../../../tests/tablePage.test.cjs)
  the shared table and the `report-boards` menu entry.

## Commits

 - [Members, organizations and teams sent to the report never include the current user's partial profile](https://github.com/wekan/wekan/commit/b05972c4c88e108526c85ad3598867d781395e98)
 - [Add the Permission filter](https://github.com/wekan/wekan/commit/cde94d0b14885959dcb84f71a68c5d972f2f9577)
 - [Show every board of the instance, not only the admin's own](https://github.com/wekan/wekan/commit/6c1d62cde058522f442ec8f24116e2cd986f45bd)
 - [Paginate honestly: one page of ten, index-backed](https://github.com/wekan/wekan/commit/c1add5bc5e5537e3cc8f96076164ebdf4328b0e8)
 - [Publish the page manually so it loads on FerretDB](https://github.com/wekan/wekan/commit/dded8ed47695092a698ab3e34a8abc5c6f567607)
 - [Admin Panel Problems page replaces the Reports button](https://github.com/wekan/wekan/commit/0085f7fbfa81e820ce0736dd28b2b0786ac6e41c)
 - [List only active members (#5122)](https://github.com/wekan/wekan/commit/0f45c0e392ae90aaec5013d58b85c19f6f585e2a)
 - [Check board access when listing boards](https://github.com/wekan/wekan/commit/42610d96427959d2e009e21df0f2dfba4d1334b8)
 - [Add the Boards Report to Admin Reports](https://github.com/wekan/wekan/commit/d9c290deda124504f0b3360ba5d485dc3bd68023)
