# If a board does not open and keeps loading

## What it is

Sometimes one board shows only the wait spinner and never opens, for example
because some of its data is broken. The workaround is to duplicate the board,
check that the copy opens and has everything, and then archive (and, when no
longer needed, permanently delete) the original - all from the All Boards page,
so the broken board never has to open.

## Read more

There is no outside page about this; it is a WeKan procedure. Related WeKan
pages: [Wait Spinners](Wait-Spinners.md),
[Multi-Selection](../Multi-Selection.md),
[Boards in Archive](../All-Boards/Archive.md),
[Logs](Logs.md), and [Repair MongoDB](../../Backup/Repair-MongoDB.md).

## How to use it

The old version of this page said to click `Clone Board` and `Archive` "on top
of board" at All Boards; those buttons are no longer drawn on a board tile.
The same actions are now in the All Boards right sidebar, on a selection:

1. As WeKan Admin user, open the **All Boards** page.
2. Open the right sidebar (the hamburger) and click **Multi-Selection**.
3. Select the board that does not open.
4. Click **Duplicate Board**. In the popup, keep everything ticked (**Select
   All**), then click **Duplicate Board**.
5. If the duplicated board does open correctly, check does it have any data
   missing.
6. Turn Multi-Selection on again, select the ORIGINAL board, and click **Move
   Board to Archive**, then confirm.
7. In the All Boards sidebar click **Boards in Archive**.
8. If you don't need that original board anymore, select it there and click the
   red **Delete** to delete it permanently. This is shown only to a Global Admin
   while Admin Panel → Problems → Delete is enabled; otherwise the sidebar says
   that permanent delete is disabled.

## How the numbers are calculated

There are no numbers. The copy takes the same parts the popup lists
(swimlanes, lists, labels, custom fields, rules, outgoing webhooks, cards,
checklists, comments, attachments, scrum settings), all ticked by default; a
part whose parent is not copied is not copied either (cards need lists, lists
need swimlanes) - `BOARD_COPY_FIELDS` and `normalizeBoardCopyOptions()` in
[models/lib/boardCopyOptions.js](../../../models/lib/boardCopyOptions.js).

## How it works in WeKan

- The sidebar and its selection actions are
  [client/components/boards/allBoardsSidebar.jade](../../../client/components/boards/allBoardsSidebar.jade)
  and [allBoardsSidebar.js](../../../client/components/boards/allBoardsSidebar.js):
  **Duplicate Board** opens `duplicateSelectedBoardsPopup`, which calls the
  `copyBoard` method once per selected board; **Move Board to Archive** calls
  `archiveBoard` for each.
- The archive with its permanent delete is
  [client/components/boards/boardArchive.js](../../../client/components/boards/boardArchive.js);
  the server checks the administrator, the setting, the archived state and the
  whole selection before removing anything (see
  [Boards in Archive](../All-Boards/Archive.md)).
- Tests: [tests/boardCopyOptions.test.cjs](../../../tests/boardCopyOptions.test.cjs),
  [tests/boardCopyDefaults.test.cjs](../../../tests/boardCopyDefaults.test.cjs),
  [tests/cloneBoardWithoutCards.test.cjs](../../../tests/cloneBoardWithoutCards.test.cjs).

## Commits

 - [Duplicating boards moved into the selection actions, with a choice of parts](https://github.com/wekan/wekan/commit/5dbb9167fd686fa54b9836ad16236bae64564f5c)
 - [Permanently delete selected archived boards](https://github.com/wekan/wekan/commit/d3034d81ed4dea524f432c4db89aac35d6fa697a)
 - [Tests for cloning a board without cards](https://github.com/wekan/wekan/commit/a033ed28aa533b5bea37bc3c99d7d28fcec9ecfa)
 - [Fix Duplicate Board](https://github.com/wekan/wekan/commit/e7a11c57338a15a8fc1e1b74a2446ffd7d4743a7)
