# Since your last visit

Board hamburger menu → **Since your last visit** shows what other people changed
on this board since you last had it open: new cards, moves, comments, due date
changes, members added. The menu entry carries the count, **Since your last
visit (12)**, so it is visible without opening it.

Changes are grouped by card, newest first, and each card opens from its row.
Your own changes are not listed - you know about them.

## What "last visit" is

When you open a board, WeKan remembers the time on your user document
(`profile.boardVisits`, one time per board). What this view lists is everything
after the time remembered BEFORE the current visit, so it stays the same while
you are on the board, and the next time you come back it starts from now.
A board you have never opened shows its last seven days.

## Hiding it

Admin Panel / Settings / Visibility / Features: **Since your last visit**. The
visit times are still kept while it is hidden, so turning it on again shows the
right changes.

## Implementation

`models/lib/sinceLastVisit.js` (pure: which activities, grouped by card), the
methods `boards.markVisited` and `boards.sinceLastVisit` in
`server/methods/sinceLastVisit.js`, drawn by `sinceLastVisitSidebar` in
`client/components/sidebar/sidebarSinceLastVisit.jade`. Tests:
`tests/sinceLastVisit.test.cjs`.
