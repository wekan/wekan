# Group by Assignee

## What it is

A board view that lists every card grouped under the member it is assigned
to, instead of under the list/swimlane it lives in - a quick "who has what"
view without opening each list. It is meant for a team meeting: each person's
cards, their due dates and which of them are over time, on one page. See
[#4688](https://github.com/wekan/wekan/issues/4688).

## Read more

- [Kanban (development)](https://en.wikipedia.org/wiki/Kanban_(development))
  and [Kanban board](https://en.wikipedia.org/wiki/Kanban_board) at Wikipedia -
  the boards this view regroups.
- [Workload](https://en.wikipedia.org/wiki/Workload) at Wikipedia - what a
  per-person list of cards shows.
- WeKan: [Time view](Time-View.md) (hours by assignee),
  [Board report charts](Charts/Board-Report-Charts.md) (the Dashboard's cards
  by assignee), [Assigned By and Requested By](../../Cards/Requested-Assigned-By.md),
  [Roles](../../Board-Sidebar/Members/Roles.md).

## How to use it

**Where to find it.** **Board View menu (top bar) → Group by Assignee**, in the
menu's **Board** group.

```
┌─ Board View ▾ ──────────┐
│ Swimlanes  Lists  Table │
│ ...                     │
│ ▸ Group by Assignee     │  <- here
│ ...                     │
└──────────────────────────┘

┌ Group by Assignee ───────────────────────┐
│ Alice (3)                                 │
│  • Fix login bug          due 2026-09-12  │
│  • Update docs                            │
│  • Review PR #42          ⏰ overtime     │
│ Bob (1)                                   │
│  • Write tests                            │
│ No assignee (2)                           │
│  • Investigate flaky test                 │
│  • ...                                    │
└────────────────────────────────────────────┘
```

**Steps to use it:**

1. Open a board.
2. Click **Board View** (top bar) → **Group by Assignee**.
3. Cards are grouped into one section per assignee (plus a **No assignee**
   group), each showing the card title, its due date if set, and an
   overtime clock icon if the card is over time.
4. Click any card title to open that card.
5. The text can be selected and copied with the mouse or a long press.

**Prerequisites.** Cards need an **assignee** (the card's **Assignee** field,
not the same as "Members") for the grouping to be meaningful - cards with no
assignee fall into a single **No assignee** group. This view is read-only: it
does not support drag-and-drop reordering, only opening cards. It has no
export. A board without cards shows "No cards.".

A site admin can turn it off with "Overview views" in
[Admin Panel → Settings → Features](../../Admin-Panel/Settings/Features.md)
(together with Statistics, Roadmap, Dashboard and Bigboard), and a board admin
can hide it in
[Board Settings → Board View](../../Board-Sidebar/Board-Settings/Board-View.md).

## How the numbers are calculated

From `computeCardsByAssigneeGroup` in
[models/lib/chartCalculations.js](../../../../models/lib/chartCalculations.js):

- **Which cards**: every card of the board that is not archived.
- **Groups**: a card is listed under each of its assignees, so a card with two
  assignees is in two groups; a card with none is in **No assignee**.
- **The number after a name** is how many cards that group lists.
- **Order**: groups with the most cards first; **No assignee** is always last,
  whatever its count.
- **Name**: the assignee's full name, else the username.
- **Overtime** is the card's own overtime flag from
  [Time tracking](../../Cards/Time-Tracking.md); the due date is shown in the
  member's date format.

## How it works in WeKan

- **View**:
  [client/components/boards/groupByAssigneeView.jade](../../../../client/components/boards/groupByAssigneeView.jade)
  and [.js](../../../../client/components/boards/groupByAssigneeView.js). It
  calls the `boardChartData` method with chart key `groupByAssignee` and
  renders the groups it gets back; card titles use the shared title viewer
  ([Board-view titles](Title-Rendering.md)).
- **Server**: `boardChartData` in
  [server/publications/boards.js](../../../../server/publications/boards.js)
  loads the board's cards in
  [server/lib/boardChartData.js](../../../../server/lib/boardChartData.js)
  and groups them with the same fold the Dashboard and Time views use. It is
  computed on the server, so it is complete on a lazily loaded large board too.
- **Permissions**: the method follows the board-data export rule
  ([models/lib/exportAccess.js](../../../../models/lib/exportAccess.js)
  `canExportBoardData`): the board must be visible to you, and a member whose
  role sees only cards assigned to them gets no data, so for them the view
  stays at "Loading, please wait.".
- **Menu and feature switch**: `board-view-group-by-assignee` in
  [models/lib/boardViewSettings.js](../../../../models/lib/boardViewSettings.js),
  feature `views-overview` in
  [models/lib/instanceFeatures.js](../../../../models/lib/instanceFeatures.js).
- **Tests**:
  [tests/boardViewMenu.test.cjs](../../../../tests/boardViewMenu.test.cjs),
  [tests/boardViewTitleViewer.test.cjs](../../../../tests/boardViewTitleViewer.test.cjs),
  [tests/calendarDateDisplay.test.cjs](../../../../tests/calendarDateDisplay.test.cjs),
  [tests/chartCalculations.test.cjs](../../../../tests/chartCalculations.test.cjs)
  (the shared group folds and the "No assignee" label).

## Commits

 - [Optional features: a site admin can turn the overview views off](https://github.com/wekan/wekan/commit/18d57b2b8f789b11409afbd485cff139adeb3095)
 - [The assignee view's bundle dependency fixed](https://github.com/wekan/wekan/commit/6f6e78a9a0961ede38d53d0fd8fac4c4b8602cdf)
 - [Security-aware title viewer for the assignee card titles](https://github.com/wekan/wekan/commit/457614a2acd21dae9bfff49dfc955695a2bc4ebb)
 - [Due dates in the member-selected calendar and date format](https://github.com/wekan/wekan/commit/5057a0a2c1079780f6560369e989d0022c54e53a)
 - [The Group by Assignee board view added](https://github.com/wekan/wekan/commit/8dad0d0506f89e3c54ee98099c182bdec71acc5d)
