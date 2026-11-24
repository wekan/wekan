# Summary

## What it is

Board hamburger menu → **Summary** opens a right-sidebar view of what happened on
this board, person by person - a standup report that writes itself. It answers
"what did each of us do yesterday or this week, and what is overdue?" from the
board's own records, with no AI.

## Read more

- [Stand-up meeting](https://en.wikipedia.org/wiki/Stand-up_meeting) and
  [Activity stream](https://en.wikipedia.org/wiki/Activity_stream) on Wikipedia.
- WeKan pages: [Helpers that need no AI](../Assistants/README.md),
  [Since your last visit](../Since-Last-Visit/README.md),
  [History](../History/README.md),
  [Admin Panel / Settings / Features](../Admin-Panel/Settings/Features.md#features).

## How to use it

1. Open a board.
2. Open the board hamburger menu (the right sidebar) and click **Summary**.
3. Choose **Last day** (the last 24 hours) or **Last week** (the last seven
   days).
4. Read each member's groups; each card is a link that opens it.
5. Click **Copy as text** to copy the whole summary as Markdown, ready to paste
   into a chat or an email. The button says **Copied** when it is done.

For each member who did something, or has cards overdue, in order of how much
they did:

| Group | What counts |
| --- | --- |
| Done | cards they marked complete, gave an end date, archived, or moved into the board's last list (of each swimlane, where lists belong to one) |
| Moved | cards they moved to another list or swimlane, unless that move finished the card |
| Added | cards they created |
| Commented | cards they commented on |
| Overdue | cards they are a member or assignee of whose due date has passed and that are not done - now, whatever the period |

**Hiding it.** Admin Panel / Settings / Features: **Summary**.

## How the numbers are calculated

From [models/lib/boardSummary.js](../../../models/lib/boardSummary.js) and
[server/methods/boardSummary.js](../../../server/methods/boardSummary.js):

- **The period.** Last day is `now - 24 * 60 * 60 * 1000` ms, last week
  `now - 7 * 24 * 60 * 60 * 1000` ms (`PERIODS`, `sinceFor()`); a row counts when
  its `createdAt` is at or after that and not after now.
- **Done** comes from activities `archivedCard`, and `moveCard` whose target list
  is a last list, plus History rows that set `dueComplete` to `true` or set a
  non-empty `endAt`. The last list is the active list with the highest `sort`,
  per `swimlaneId` (`lastListIds()`).
- **Moved** is the other `moveCard` activities; a card in Done for that person
  is removed from Moved.
- **Added** is `createCard`, **Commented** is `addComment`.
- Each group counts a card once per person, however many times it happened; the
  number after a group name is the number of cards in it, and cards are sorted
  by title.
- **Overdue** is computed now, not in the period: cards with a `dueAt` before
  now that are not done (`dueComplete`, an `endAt` or archived means done), for
  every member and assignee of the card.
- **Order of people.** By their total of Done + Moved + Added + Commented
  (Overdue is not in the total), highest first; then by the number of overdue
  cards; then by username.
- **Limits.** At most 20 000 cards, activities and History rows are read
  (`MAX_ROWS`); the method is rate-limited to 10 calls per 10 seconds per
  connection. Only active board members are listed.

## How it works in WeKan

- `models/lib/boardSummary.js` is pure (activities and cards to the groups
  above), with `summaryMarkdown()` for Copy as text.
- The method `boards.summary` in `server/methods/boardSummary.js` checks the
  argument, the feature (`featureOnFor(userId, 'board-summary')` in
  [server/lib/assistGate.js](../../../server/lib/assistGate.js)) and that the
  caller can read the board (`canReadBoard`); for an assigned-only member it
  reads only the cards assigned to them (`assignedOnlyCardScope`). The summary
  is built from the board's activities, the same records the activity feed
  shows, so it shows nothing a member of the board could not see there, and
  cards the reader may not see are left out.
- Drawn by `boardSummarySidebar` in
  [client/components/sidebar/sidebarSummary.jade](../../../client/components/sidebar/sidebarSummary.jade)
  and [sidebarSummary.js](../../../client/components/sidebar/sidebarSummary.js);
  the menu entry is `js-open-board-summary` in
  [client/components/sidebar/sidebar.jade](../../../client/components/sidebar/sidebar.jade),
  shown only when `allowFeature 'board-summary'`.
- Tests: [tests/boardSummary.test.cjs](../../../tests/boardSummary.test.cjs)
  and [tests/playwright/specs/assist-board-summary.e2e.js](../../../tests/playwright/specs/assist-board-summary.e2e.js).

## Commits

 - [Summary, Since your last visit, At risk, Suggested members and Forecast](https://github.com/wekan/wekan/commit/083c863fb7f96055fa52f0ed074ddab98494c81b)
