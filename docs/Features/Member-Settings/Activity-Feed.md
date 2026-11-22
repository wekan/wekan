# Member Settings / Activity on all my boards

## What it is

One page that lists what happened on all of your boards, newest first: who did
what, on which card and on which board
([#2026](https://github.com/wekan/wekan/issues/2026),
[#1377](https://github.com/wekan/wekan/issues/1377)). It saves you opening every
board to see what changed. The entry is a link, not a popup: it opens the page
`/activity`. Every signed-in member sees it.

## Read more

- [Activity stream](https://en.wikipedia.org/wiki/Activity_stream) on Wikipedia.
- [Notifications](Notifications.md) - the same kinds of activity, delivered to
  you by e-mail, the tray, browser push or ntfy.
- [Hidden boards](Hidden-Boards.md) - boards that are left out of this page.
- [Admin Panel / Settings / Activities and notifications](../Admin-Panel/Settings/Activities-and-Notifications.md).

## How to use it

1. Click your username or avatar at the top right.
2. Click **Activity on all my boards**.
3. Read the list. Each entry shows:
   - the time, the user who did it, and the same sentence notifications use for
     that kind of activity;
   - the card's title, when the activity is about a card - click it, or press
     Enter or Space on it, to open the card;
   - the board's title.
4. Click **Show older** at the bottom to load the next 50 entries.

Card, list and board titles render their Markdown. With nothing to show, the
page says *Nothing has happened on your boards yet.*

**Which boards and activities.** The boards are the ones you see in All Boards:
as a member, or through a team, an organization or your e-mail domain. Archived
boards, public boards you are not a member of and boards in
[Hidden boards](Hidden-Boards.md) are left out. On a board where you see only
the cards assigned to you, only those cards' activities are listed.

**When the page stays empty.** The page stays empty when a site administrator
has

- turned on **Disable all activities** in
  [Admin Panel / Settings / Activities and notifications](../Admin-Panel/Settings/Activities-and-Notifications.md),
  or
- hidden **Board activities** in
  [Admin Panel / Settings / Appearance](../Admin-Panel/Settings/Appearance.md).

## How the numbers are calculated

- **Page size: 50.** The page asks for 50 entries at a time (`PAGE = 50` in
  [client/components/main/activityFeed.js](../../../client/components/main/activityFeed.js)).
  **Show older** asks for the next 50 created before the oldest one shown, and
  is offered only while a page came back full (exactly 50 entries).
- **Server limit: 1 to 100, default 50.** `cleanLimit()` in
  [models/lib/activityFeed.js](../../../models/lib/activityFeed.js) rounds the
  requested limit down and clamps it to 1..100; a missing or non-numeric limit
  becomes 50.
- **Three times as many read as shown.** The server reads `limit * 3` newest
  activities of your boards, drops the ones you may not see (cards not assigned
  to you on an assigned-only board), and returns the first `limit` of what is
  left ([server/activityFeed.js](../../../server/activityFeed.js)).
- **Rate limit: 20 calls per 10 seconds** per connection for the method
  `allBoardsActivityFeed` (`DDPRateLimiter` rule in `server/activityFeed.js`).

## How it works in WeKan

- **Page:** the template `activityFeed` in
  [client/components/main/activityFeed.jade](../../../client/components/main/activityFeed.jade),
  [activityFeed.js](../../../client/components/main/activityFeed.js) and
  [activityFeed.css](../../../client/components/main/activityFeed.css), routed
  as `activity-feed` (`/activity`) in [config/router.js](../../../config/router.js).
  The menu entry is in
  [client/components/users/userHeader.jade](../../../client/components/users/userHeader.jade).
- **Method:** `allBoardsActivityFeed({ limit, before })` in
  [server/activityFeed.js](../../../server/activityFeed.js). It refuses a caller
  who is not signed in, returns nothing when `disableActivities` or
  `hideBoardActivitiesOnAllBoards` is set, takes the boards from
  `visibleAllBoards()` (the same list as All Boards), and reads the
  `activities` collection sorted by `createdAt` descending. Only ids and
  renamed titles are read - never a field's value. Cards, lists, swimlanes,
  checklists, checklist items, comments and users are then looked up once per
  page to fill in the sentence.
- **Pure rules:** [models/lib/activityFeed.js](../../../models/lib/activityFeed.js)
  builds each entry (`feedEntry()`), its sentence (`activitySentenceKey()`,
  `feedParams()`), applies the assigned-only filter (`visibleActivities()`)
  and the limit (`cleanLimit()`). The assigned-only rule is
  `isAssignedOnlyMember()` of `models/lib/boardCardScope.js`: such a member
  sees activities only of cards that list them as an assignee.
- **Tests:** [tests/activityFeed.test.cjs](../../../tests/activityFeed.test.cjs)
  and the browser test
  [tests/playwright/specs/activity-feed-sentences.e2e.js](../../../tests/playwright/specs/activity-feed-sentences.e2e.js).

## Commits

 - [assigned-only members see only their assigned cards' activities in the feed too](https://github.com/wekan/wekan/commit/5b2ed17e6b31ff8416dbf26d8c178f0b979013f0)
 - [titles in the feed render as Markdown](https://github.com/wekan/wekan/commit/2cc6b93ed9e9b9bae03927acb627ac2f2e2b7d5d)
 - [every sentence of the feed names what it is about](https://github.com/wekan/wekan/commit/f12b718d81e04415b6020f2a701b63b4b4f35d48)
 - [the activity feed across all of a member's boards](https://github.com/wekan/wekan/commit/656af74b2cf843822109c1e27516a841cd7ef96e)
