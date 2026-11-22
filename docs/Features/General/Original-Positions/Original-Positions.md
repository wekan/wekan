# Original positions

## What it is

Board hamburger menu → **Original positions** opens a right-sidebar view of
where each swimlane, list and card was put when it was made, and which have
moved since. It sits after **Archive** in the same menu and, like it, is open to
everyone who can see the board; what each reader is shown is decided on the
server.

It answers "where was this put when it was made, and has it moved?" - useful
after a big rearrangement, or to see the title a card was created with.

## Read more

- [Audit trail](https://en.wikipedia.org/wiki/Audit_trail) on Wikipedia - the
  general idea of keeping a record of what something was.
- WeKan pages: [History](../History/History.md),
  [Undo / Redo](../Undo/Undo.md), [Roles](../../Board-Sidebar/Members/Roles.md),
  and the [PositionHistoryBleed](https://wekan.fi/hall-of-fame/positionhistorybleed/)
  security fix of these methods.

## How to use it

1. Open a board.
2. Open the board hamburger menu (the right sidebar) and click **Original
   positions**, after **Archive**.
3. Read the three groups, **Swimlanes**, **Lists** and **Cards**.
4. Click **Refresh** to read the board's history again.

**What it shows.** Three groups - **Swimlanes**, **Lists** and **Cards** - and for each item:

- its name **now**;
- **Moved**, when it is no longer where it was put: a different position, or for a
  list a different swimlane, or for a card a different list or swimlane;
- where it was put, by the names those have now: *List: Doing · Swimlane:
  Default* for a card, the swimlane for a list;
- the **title** it was made with, when that is not its title now;
- when it was made.

**Refresh** reads the board's history again. Something made before positions
were recorded has no row; something that no longer exists is shown by the title
it was made with, never as moved.

## How the numbers are calculated

There are no counts. "Moved" is decided by `hasMoved()` in
[models/lib/originalPositions.js](../../../../models/lib/originalPositions.js):
an item has moved when both its first and current `sort` are numbers and
differ; or, for a list or card, when its first and current swimlane ids are both
set and differ; or, for a card, when its first and current list ids are both set
and differ. An item that no longer exists is never "moved". Groups with no items
are left out.

## How it works in WeKan

**Who sees what.** `positionHistory.getBoardHistory` returns rows only to someone who may read the
board, and for an assigned-only role only the swimlanes, the lists and the cards
assigned to them - the same rule as every other board view (see
[Roles](../../Board-Sidebar/Members/Roles.md)).

**How positions are recorded.** When a swimlane, list or card is made, the server stores one row in the
`PositionHistory` collection:

```javascript
{
  boardId: String,           // Board ID
  entityType: String,        // 'swimlane', 'list', or 'card'
  entityId: String,          // Entity ID
  originalPosition: Object,  // Original position data ({ sort, title })
  originalSwimlaneId: String, // Original swimlane (for lists/cards)
  originalListId: String,    // Original list (for cards)
  originalTitle: String,     // Original title
  createdAt: Date,          // When tracked
  updatedAt: Date           // Last updated
}
```

Only the first row of an item is kept, so later moves never overwrite it. The
hooks are in `server/models/swimlanes.js`, `server/models/lists.js` and
`server/models/cards.js` (`trackOriginalPosition()`).

**Server methods.** All of them check that the caller may read the board, and the card methods
that the caller may see that card:

| Method | Returns |
| --- | --- |
| `positionHistory.getBoardHistory(boardId)` | every row of the board the caller may see |
| `positionHistory.getBoardHistoryByType(boardId, type)` | the same, for `swimlane`, `list` or `card` |
| `positionHistory.get{Swimlane,List,Card}OriginalPosition(id)` | one item's row |
| `positionHistory.has{Swimlane,List,Card}Moved(id)` | whether it has moved |
| `positionHistory.track{Swimlane,List,Card}(id)` | records a row for an item made before tracking |

**Implementation.** `client/components/sidebar/sidebarOriginalPositions.jade`, `.js` and `.css`
(the `originalPositionsSidebar` view); `models/lib/originalPositions.js` (the
groups, names and "moved", tested without Meteor in
`tests/originalPositions.test.cjs`); `server/methods/positionHistory.js`;
`models/positionHistory.js`.

Until 2026-10-17 this was two templates nothing drew, with every string in
English and raw ids instead of names, and a set of client helpers nothing
called; they were replaced by the sidebar view.

Files: [models/lib/originalPositions.js](../../../../models/lib/originalPositions.js),
[server/methods/positionHistory.js](../../../../server/methods/positionHistory.js),
[models/positionHistory.js](../../../../models/positionHistory.js),
[client/components/sidebar/sidebarOriginalPositions.jade](../../../../client/components/sidebar/sidebarOriginalPositions.jade),
[tests/originalPositions.test.cjs](../../../../tests/originalPositions.test.cjs).

## Commits

 - [Original positions as a right-sidebar view from the board menu, in every language](https://github.com/wekan/wekan/commit/b9e28a8fbbd0f20ea3cc4d86f4e665fa00bc95be)
 - [Board role permissions apply to every board view and path to a card](https://github.com/wekan/wekan/commit/5b2ed17e6b31ff8416dbf26d8c178f0b979013f0)
 - [Assigned-only members see only their own cards on every read path](https://github.com/wekan/wekan/commit/1a218ead02d8a74bcaffd7b815ee93916d1672fd)
 - [Shared board read authorization](https://github.com/wekan/wekan/commit/e8c867b3383fd21eabdbd258a36e52365c013756)
 - [Security fix: PositionHistoryBleed](https://github.com/wekan/wekan/commit/55576ec17722db094835470b386162c9a662fb60)
 - [Show original positions of swimlanes, lists and cards](https://github.com/wekan/wekan/commit/2543df94252c2789fb484ae52b9a6ff298252ceb)
