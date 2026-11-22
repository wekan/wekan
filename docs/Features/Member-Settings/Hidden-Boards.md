# Member Settings / Hidden boards

## What it is

**Hidden boards** lists the boards you left that WeKan still could have shown
you through a team, an organization or your e-mail domain, and lets you bring
them back ([#4265](https://github.com/wekan/wekan/issues/4265)). Leaving such a
board hides it for you only; your team or organization membership is not
changed. Every signed-in member sees this entry.

## Read more

There is no outside standard for this; it is WeKan's own way of leaving a board
that a group gives you. Related WeKan pages:

- [All Boards](../All-Boards/README.md)
- [Admin Panel / People / Teams](../Admin-Panel/People/Teams.md)
- [Admin Panel / People / Organizations](../Admin-Panel/People/Organizations.md)
- [Activity on all my boards](Activity-Feed.md)

## How to use it

**How a board becomes hidden**

Some boards are reached not only as a board member but also through one of your
teams, organizations or your e-mail domain. Leaving such a board with **Leave
Board** cannot take it out of All Boards by removing your member entry alone,
because the team, organization or domain would still show it. WeKan therefore
**hides** it for you: the board id goes into your own hidden list
(`profile.hiddenBoards`, at most 1000 boards). Your team or organization
membership is not changed.

A hidden board is left out of All Boards and out of
[Activity on all my boards](Activity-Feed.md).

**Restore a hidden board**

1. Click your username or avatar at the top right, then **Hidden boards**.
2. The popup shows one row per hidden board, with its title (or its id, when
   the board is not available in this browser), or *No hidden boards.* when
   the list is empty.
3. Click **Restore** beside a row. The board is back in All Boards. This only
   removes the board from your own hidden list; whether you may open the board
   is still decided by the board itself.

## How the numbers are calculated

- **At most 1000 hidden boards.** `hiddenBoardsAfter()` in
  [models/lib/boardInvites.js](../../../models/lib/boardInvites.js) first drops
  the board's id from the list (so each id is there once), then on hide adds it
  at the end and keeps the last 1000 (`slice(-1000)`): when a 1001st board is
  hidden, the one hidden longest ago drops off the list and shows again.
- **"Reaches the board otherwise"** (`reachesBoardOtherwise()`): true when the
  board lists one of your teams or organizations as an active entry
  (`isActive !== false`), or one of your e-mail domains.

## How it works in WeKan

- **Popup:** `hiddenBoardsPopup` in
  [client/components/users/userHeader.jade](../../../client/components/users/userHeader.jade)
  and [userHeader.js](../../../client/components/users/userHeader.js).
- **Methods** in [server/models/boards.js](../../../server/models/boards.js):
  leaving is `quitBoard`, restoring is `restoreHiddenBoard`.
- **Decisions** in [models/lib/boardInvites.js](../../../models/lib/boardInvites.js):
  `planQuitBoard()` says whether to remove the member entry, pull an invitation
  and hide the board; `reachesBoardOtherwise()` and `hiddenBoardsAfter()` as
  above.
- **Tests:** [tests/hiddenBoards.test.cjs](../../../tests/hiddenBoards.test.cjs)
  and [tests/boardInvites.test.cjs](../../../tests/boardInvites.test.cjs).

## Commits

 - [leaving a board that came through a team hides it, restorably](https://github.com/wekan/wekan/commit/1acc9f2b9f0dba0ec131c9fdd267a171e51fe691)
