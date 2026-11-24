# Timeline view

## What it is

The Timeline view shows the board as it was at an earlier moment. Click a point
on the line to see the cards, by list, as they were then; **Now** returns to the
present. A card can be put back to the state it had then, and that restore is
itself new history, so nothing is lost. A site admin can turn it off with "Time
views" in Admin Panel / Settings / Features.

## Read more

- [Undo](https://en.wikipedia.org/wiki/Undo) and
  [Audit trail](https://en.wikipedia.org/wiki/Audit_trail) at Wikipedia - the
  past is rebuilt by undoing the board's recorded activities.
- WeKan: [History](../../History/README.md) (the board's change
  history and its Restore), [Time view](Time-View.md),
  [Roles](../../Board-Sidebar/Members/Roles.md),
  [Admin Panel / Settings / Features](../../Admin-Panel/Settings/Features.md).

## How to use it

**See the board at a moment.**

1. Open a board.
2. Board header → **Board View** → **Timeline** (in the menu's **Calendar and
   time** group). The hint says "Click a point in time to see the board as it
   was then."
3. Click a date and time on the line. "Showing state as of:" tells which
   moment is shown.
4. For the chosen moment, each current card is shown as it was then: title,
   archived state, the start of its description, labels, members and due date,
   grouped by the list it was in.
5. Click **Now** to return to the present.

**Restore a card.**

1. Choose a moment, as above.
2. On the card, click **Restore to this state**.
3. Confirm: "This restores the card's title, description, list, labels,
   members and due date to the values shown. Nothing is deleted. Continue?"

**Restore to this state** sets the card's title, description, list, labels,
members and due date back to what is shown. It uses the card's own setters, so
every change is new history in the card's activity and nothing is deleted. The
button is shown only to those who may change that card, and a change the server
refuses is reported ("Your board role is not allowed to do that").

## How the numbers are calculated

- **Moments on the line**
  ([client/components/boards/timelineView.js](../../../../client/components/boards/timelineView.js)):
  **Now** and up to **50** moments taken from the board's activity. The
  distinct times of the board's activities are sorted; when there are more than
  50, every `(count / 50)`-th one is taken, from the oldest on, so the line
  stays 50 long and spans the whole history.
- **Description**: the first 160 characters of the description, then `…`.
- **The past is rebuilt** by undoing the board's activities from now back to
  that moment, newest first, for each card that is on the board now and not
  archived
  ([models/lib/boardTimeline.js](../../../../models/lib/boardTimeline.js)
  `reconstructBoardStateAt`): a card created after the moment is not shown;
  title and description changes, due date changes, moves between lists and
  swimlanes, archiving and restoring, members, assignees and labels are
  undone. Moves to another board and custom field values are not undone, and
  a card that was deleted for good is not shown.
- **Restore** writes only the fields that differ from the card now.

## How it works in WeKan

- **View**:
  [client/components/boards/timelineView.jade](../../../../client/components/boards/timelineView.jade),
  [.js](../../../../client/components/boards/timelineView.js) and
  [.css](../../../../client/components/boards/timelineView.css). It subscribes
  to the board's `activities` with a limit of 1 000 000, because the rebuild
  needs the whole history, not the recent page the sidebar shows, and it does
  so whatever the board's "show activities" setting is.
- **Pure module**:
  [models/lib/boardTimeline.js](../../../../models/lib/boardTimeline.js)
  (`reconstructBoardStateAt`). It never touches the database and never writes
  or deletes an activity.
- **Restore**: `restoreCardFromTimeline` calls the card's `setTitle`,
  `setDescription`, `move`, `addLabel`/`removeLabel`,
  `assignMember`/`unassignMember` and `setDue`; the button is shown when
  `Utils.canModifyCard(card)` allows it, and the server checks each write.
- **Titles** use the shared title viewer
  ([Board-view titles](Title-Rendering.md)).
- **Menu and feature switch**: `board-view-timeline` in
  [models/lib/boardViewSettings.js](../../../../models/lib/boardViewSettings.js),
  feature `views-time` in
  [models/lib/instanceFeatures.js](../../../../models/lib/instanceFeatures.js).
- **Tests**:
  [tests/boardTimeline.test.cjs](../../../../tests/boardTimeline.test.cjs),
  [tests/boardTimelineRestore.test.cjs](../../../../tests/boardTimelineRestore.test.cjs),
  [tests/boardViewTitleViewer.test.cjs](../../../../tests/boardViewTitleViewer.test.cjs).

## Commits

 - [Restore offered only to those who may change the card, and a refusal reported](https://github.com/wekan/wekan/commit/0fff9d4828660666c1af0c9ffd48c7eea8aee1bd)
 - [Optional features: a site admin can turn the time views off](https://github.com/wekan/wekan/commit/18d57b2b8f789b11409afbd485cff139adeb3095)
 - [Audited usability and accessibility fixes](https://github.com/wekan/wekan/commit/896f1222bd655cb4fe8c3411ab0e25922927d56c)
 - [Full available width for the timeline (shared stats view styles)](https://github.com/wekan/wekan/commit/fda197bb00afe0daa345c2c61bdc9280628412f6)
 - [Security-aware title viewer for the timeline lists and cards](https://github.com/wekan/wekan/commit/457614a2acd21dae9bfff49dfc955695a2bc4ebb)
 - [Dates in the member-selected calendar and format](https://github.com/wekan/wekan/commit/5057a0a2c1079780f6560369e989d0022c54e53a)
 - [The Restore button themed](https://github.com/wekan/wekan/commit/376790de5d9f34c1e6b367b0d89b18cf12124b61)
 - [Unscaled timeline font sizes fixed](https://github.com/wekan/wekan/commit/1deae2fcab62b3a0615f1a13054f7f1d233f8fb5)
 - [The Timeline board view: history and restore to a past state](https://github.com/wekan/wekan/commit/12cd826c37717682aac58e1bb98f062a000acb50)
 - [The board state rebuilt from the activities log](https://github.com/wekan/wekan/commit/f3616685738032de13442a9dd5dae6a23d553683)
