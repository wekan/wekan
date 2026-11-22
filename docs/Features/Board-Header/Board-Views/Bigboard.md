# Bigboard

## What it is

Bigboard stacks **every board you are a member of** on one scrollable page,
each as its own kanban section with its own lists and cards - the same
drag-and-drop, card popups and list editing as a normal single-board page,
just all your boards at once. It is WeKan's equivalent of Kanboard's
"BigBoard" plugin. See [#4223](https://github.com/wekan/wekan/issues/4223).

## Read more

- [Kanban board](https://en.wikipedia.org/wiki/Kanban_board) and
  [Dashboard (computing)](https://en.wikipedia.org/wiki/Dashboard_(computing))
  on Wikipedia - many boards seen at once work as an overview.
- [Kanboard](https://en.wikipedia.org/wiki/Kanboard) on Wikipedia, and its
  [BigBoard plugin](https://github.com/TimoStahl/kanboard_plugin_bigboard), which
  this view follows.
- [Multi Board Calendar](Multi-Board-Calendar.md) - the other view over several
  boards, and [All Boards](../../All-Boards/All-Boards.md).

## How to use it

**Board View menu (top bar) → Bigboard**, from inside any board you are a
member of.

```
┌─ Board View ▾ ──────┐
│ ...                 │
│ ▸ Bigboard          │  <- here
│ ...                 │
└───────────────────────┘

┌ Bigboard ──────────────────────────────────────────┐
│ ## Project Alpha                                    │
│  [Backlog]   [Doing]   [Done]                        │
│   card        card      card                         │
│   card                  card                          │
│                                                        │
│ ## Project Beta                                       │
│  [To Do]  [In Progress]  [Review]  [Done]              │
│   card       card                                     │
└────────────────────────────────────────────────────────┘
```

1. Open any board.
2. Click **Board View** (top bar) → **Bigboard**. It is in the **Board** group
   of the menu.
3. Every board you belong to is stacked in one page, each with its normal
   lists and cards. *Loading* is shown until every board's cards have arrived.
4. Drag cards between lists, open cards, or edit lists exactly as on a
   single board - each board section behaves like its own board page.
5. A card can also be dragged into a list of **another** board on the page; it
   moves to that board. Lists themselves are dragged only within their own
   board.
6. Click a board's title to open that board on its own page.

**Prerequisites.** You must be a member of at least one board; boards you are
not a member of never appear. With none, the page says *You did not select any
boards.* There is no separate setup - Bigboard reuses the same lists/cards data
as the regular board view.

## How the numbers are calculated

Bigboard has no numbers of its own. Which boards are shown, and in what order,
is `bigboardQuery()` in
[client/components/boards/bigboardView.js](../../../../client/components/boards/bigboardView.js):
boards that are not archived, of type `board` (no templates), whose
`members.userId` includes you, and whose title is not an internal helper
board's (`^Subtasks^` and the like, `notHelperBoardTitle()` in
[models/lib/helperBoards.js](../../../../models/lib/helperBoards.js)), sorted by
the boards' `sort` field. There is no limit on the number of boards.

## How it works in WeKan

- **Template**: `bigboardView` in
  [client/components/boards/bigboardView.jade](../../../../client/components/boards/bigboardView.jade),
  with [bigboardView.css](../../../../client/components/boards/bigboardView.css).
  Each board is a `.bigboard-board` section with a title link and the ordinary
  `listsGroup` template, so the existing list and card templates and their
  drag-and-drop work unmodified.
- **Data**: the board list comes from the app-wide `boards` subscription; for
  each board shown the view also subscribes to that board's own `board`
  composite publication, the one a single board page uses, and shows *Loading*
  until all are ready.
- **Cross-board drag**: the card drop handler in
  [client/components/lists/list.js](../../../../client/components/lists/list.js)
  takes the destination board from the list the card was dropped in, not from
  the board in the address bar. Lists are connected only within their own board
  (`connectWithSelector()` in
  [client/components/swimlanes/swimlanes.js](../../../../client/components/swimlanes/swimlanes.js)).
- **Permissions**: every board's own role permissions apply, as in every view
  ([Roles](../../Board-Sidebar/Members/Roles.md)).
- **Tests**: [tests/boardViewMenu.test.cjs](../../../../tests/boardViewMenu.test.cjs)
  (the menu entry and its templates),
  [tests/listCardCrossBoardMove.test.cjs](../../../../tests/listCardCrossBoardMove.test.cjs)
  (a card dropped onto another board's list moves to that board) and
  [tests/boardViewTitleViewer.test.cjs](../../../../tests/boardViewTitleViewer.test.cjs)
  (board titles use the shared viewer).

## Commits

 - [Board titles use the security-aware viewer](https://github.com/wekan/wekan/commit/457614a2acd21dae9bfff49dfc955695a2bc4ebb)
 - [Drag a card between two boards' lists](https://github.com/wekan/wekan/commit/ac7822aa26f4a78f6c056803039847c1516a7ef4)
 - [Register the view's templates and add its regression test](https://github.com/wekan/wekan/commit/8c7345ace67d9bf7b3d8b6965bbc3e06d64d2719)
 - [Add the Bigboard view listing every board at once](https://github.com/wekan/wekan/commit/5323fdbce67e2cdfe19a00f2d776c283d45bc2d9)
