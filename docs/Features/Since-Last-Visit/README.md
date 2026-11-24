# Since your last visit

## What it is

Board hamburger menu → **Since your last visit** shows what other people changed
on this board since you last had it open: new cards, moves, comments, due date
changes, members added. It is the catch-up list other products write with AI,
read here from the board's own activities. The menu entry carries the count,
**Since your last visit (12)**, so it is visible without opening it.

## Read more

- [Activity stream](https://en.wikipedia.org/wiki/Activity_stream) on Wikipedia.
- WeKan pages: [Helpers that need no AI](../Assistants/README.md),
  [Summary](../Summary/README.md), [History](../History/README.md),
  [Admin Panel / Settings / Features](../Admin-Panel/Settings/Features.md#features).

## How to use it

1. Open a board. Opening it records this visit.
2. Open the board hamburger menu (the right sidebar). The entry reads
   **Since your last visit (N)** when there are changes, or just **Since your
   last visit** when there are none.
3. Click it. Changes are grouped by card, newest first, and each card opens
   from its row. Your own changes are not listed - you know about them.

**Hiding it.** Admin Panel / Settings / Features: **Since your last visit**. The
visit times are still kept while it is hidden, so turning it on again shows the
right changes.

## How the numbers are calculated

From [models/lib/sinceLastVisit.js](../../../models/lib/sinceLastVisit.js):

- **What "last visit" is.** When you open a board, WeKan remembers the time on
  your user document (`profile.boardVisits`, one time per board). What this view
  lists is everything after the time remembered BEFORE the current visit, so it
  stays the same while you are on the board, and the next time you come back it
  starts from now. The visit is recorded once per board per page load
  ([client/lib/boardVisits.js](../../../client/lib/boardVisits.js)), so
  switching between boards in the same tab does not reset it; reloading does.
- **A board you have never opened** shows its last seven days
  (`FIRST_VISIT_DAYS = 7`).
- **The count in the menu** is the number of changes (`changeCount()`: the sum
  of the changes of every listed card), not the number of cards.
- **What counts as a change**: the activities `createCard`, `moveCard`,
  `addComment`, `a-dueAt`, `joinMember`, `joinAssignee`, `archivedCard`,
  `addedLabel`, `a-changedTitle` and `a-changedDescription` (`KINDS`), by anybody
  but you, on a card you may see.
- **Order.** Cards by their newest change, newest first; changes inside a card
  newest first.
- **Limits.** At most 100 cards are listed (`MAX_CARDS`) and 5 000 activities
  read (`MAX_ROWS` in the server method); visit times are kept for at most 500
  boards (`MAX_VISITS`), the least recently visited forgotten first. Both
  methods are rate-limited to 20 calls per 10 seconds per connection.

## How it works in WeKan

- `models/lib/sinceLastVisit.js` is pure: which activities, grouped by card,
  and `boardVisitsModifier()` for the `$set` that remembers a visit.
- The methods `boards.markVisited` and `boards.sinceLastVisit` in
  [server/methods/sinceLastVisit.js](../../../server/methods/sinceLastVisit.js)
  read only a board the caller may read (`canReadBoard`); for an assigned-only
  member only their cards (`assignedOnlyCardScope`). `boards.sinceLastVisit`
  also checks the feature (`featureOnFor(userId, 'since-last-visit')`);
  `boards.markVisited` does not, which is why visits are kept while it is
  hidden.
- [client/components/boards/boardBody.js](../../../client/components/boards/boardBody.js)
  calls `markBoardVisited()` when a board opens; the count is loaded in
  [client/components/sidebar/sidebar.js](../../../client/components/sidebar/sidebar.js),
  and the list is drawn by `sinceLastVisitSidebar` in
  [client/components/sidebar/sidebarSinceLastVisit.jade](../../../client/components/sidebar/sidebarSinceLastVisit.jade).
- Tests: [tests/sinceLastVisit.test.cjs](../../../tests/sinceLastVisit.test.cjs)
  and [tests/playwright/specs/assist-since-last-visit.e2e.js](../../../tests/playwright/specs/assist-since-last-visit.e2e.js).

## Commits

 - [Summary, Since your last visit, At risk, Suggested members and Forecast](https://github.com/wekan/wekan/commit/083c863fb7f96055fa52f0ed074ddab98494c81b)
