# Delete a board

## What it is

Deleting a board removes it and everything on it for good: its swimlanes,
lists, cards, comments, rules, activities and attachments. There is no undo. A
board is first moved to the Archive, and only an archived board can be
deleted.

## Read more

- [Wikipedia: Data erasure](https://en.wikipedia.org/wiki/Data_erasure)
- [Archive and Delete](../../../Archive/Archive-and-Delete.md)
- [Backup](../../../../../Backup/Backup.md): take one first

## How to use it

### 1) Move board to Archive

<img src="https://wekan.fi/boards/delete-board-part1.png" width="60%" alt="Move board to Archive" />

Open the board, its right sidebar, then **Board Settings → Move Board to
Archive** (board admins).

### 2) All Boards => Archive => Delete Board

<img src="https://wekan.fi/boards/delete-board-part2.png" width="60%" alt="Delete Board from Archive" />

The picture shows the older trashcan beside each archived board. Today:

1. A Global Admin checks **Admin Panel → Settings → Delete → Enable permanent
   delete for Global Admin**.
2. In **All Boards → Archive**, the Global Admin turns on **Multi-Selection**,
   selects the archived boards and clicks the red **Delete** in the sidebar,
   then confirms.

Without that setting, or for anyone but a Global Admin, the sidebar only says
where the setting is.

## How the numbers are calculated

One selection deletes at most 200 boards, and every selected board must be
archived, or nothing is deleted (`permanentlyDeleteArchivedBoards` in
[server/models/boards.js](../../../../../../server/models/boards.js)).

## How it works in WeKan

The **Delete** button is drawn by `allBoardsMultiSelectionSidebar` in
[client/components/boards/allBoardsSidebar.jade](../../../../../../client/components/boards/allBoardsSidebar.jade)
only when `canPermanentlyDeleteArchivedBoards` (a Global Admin, the Archive
section, and `enablePermanentDelete` on). The server method
`permanentlyDeleteArchivedBoards` checks the same gates again, removes each
board with everything on it (`boardRemover`: cards, lists, swimlanes,
integrations, rules, triggers, actions, activities and every attachment with
its stored file), and records each deletion in Admin Panel → Problems.

## Commits

 - [Permanently delete selected archived boards](https://github.com/wekan/wekan/commit/d3034d81ed4dea524f432c4db89aac35d6fa697a)
 - [Add the docs from the wekan.wiki, this page among them](https://github.com/wekan/wekan/commit/73ae73d4c38640e9daedbe8ef9e5b25b877ee804)
