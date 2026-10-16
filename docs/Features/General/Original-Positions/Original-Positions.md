# Original positions

Board hamburger menu → **Original positions** opens a right-sidebar view of
where each swimlane, list and card was put when it was made, and which have
moved since. It sits after **Archive** in the same menu and, like it, is open to
everyone who can see the board; what each reader is shown is decided on the
server.

## What it shows

Three groups - **Swimlanes**, **Lists** and **Cards** - and for each item:

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

## Who sees what

`positionHistory.getBoardHistory` returns rows only to someone who may read the
board, and for an assigned-only role only the swimlanes, the lists and the cards
assigned to them - the same rule as every other board view (see
[Roles](../../Board-Sidebar/Members/Roles.md)).

## How positions are recorded

When a swimlane, list or card is made, the server stores one row in the
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

## Server methods

All of them check that the caller may read the board, and the card methods
that the caller may see that card:

| Method | Returns |
| --- | --- |
| `positionHistory.getBoardHistory(boardId)` | every row of the board the caller may see |
| `positionHistory.getBoardHistoryByType(boardId, type)` | the same, for `swimlane`, `list` or `card` |
| `positionHistory.get{Swimlane,List,Card}OriginalPosition(id)` | one item's row |
| `positionHistory.has{Swimlane,List,Card}Moved(id)` | whether it has moved |
| `positionHistory.track{Swimlane,List,Card}(id)` | records a row for an item made before tracking |

## Implementation

`client/components/sidebar/sidebarOriginalPositions.jade`, `.js` and `.css`
(the `originalPositionsSidebar` view); `models/lib/originalPositions.js` (the
groups, names and "moved", tested without Meteor in
`tests/originalPositions.test.cjs`); `server/methods/positionHistory.js`;
`models/positionHistory.js`.

Until 2026-10-17 this was two templates nothing drew, with every string in
English and raw ids instead of names, and a set of client helpers nothing
called; they were replaced by the sidebar view.
