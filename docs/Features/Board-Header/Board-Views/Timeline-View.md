# Timeline view

Board header → **Board View** → **Timeline**. The board as it was at an earlier
moment. Click a point on the line to see the cards, by list, as they were then;
**Now** returns to the present. A site admin can turn it off with "Time views"
in Admin Panel / Settings / Visibility / Features.

## What it shows

- A line with **Now** and up to 50 moments taken from the board's activity.
- For the chosen moment, each current card as it was then: title, archived
  state, the start of its description, labels, members and due date, grouped by
  the list it was in.

The past is rebuilt by undoing the board's activities from now back to that
moment. Moves to another board and custom field values are not undone, and a
card that was deleted for good is not shown.

## Restoring a card

**Restore to this state**, after a confirmation, sets the card's title,
description, list, labels, members and due date back to what is shown. It uses
the card's own setters, so every change is new history in the card's activity
and nothing is deleted. The button is shown only to those who may change that
card, and a change the server refuses is reported.

## Implementation

`client/components/boards/timelineView.jade`, `.js` and `.css`;
`models/lib/boardTimeline.js` (`reconstructBoardStateAt`). Tests:
`tests/boardTimeline.test.cjs`, `tests/boardTimelineRestore.test.cjs`.
