# Board Settings / Swimlane

## What it is

The board-wide settings of swimlanes, for a board administrator: whether
swimlanes may be dragged, whether their height may be resized, whether all
swimlanes share **One shared list header row**, which Scrum fields a swimlane
shows, and the **WIP Limit Groups** - work-in-progress limits shared by several
lists together.

## Read more

- [Wikipedia: Swim lane](https://en.wikipedia.org/wiki/Swim_lane)
- [Wikipedia: Kanban (development)](https://en.wikipedia.org/wiki/Kanban_(development)),
  where work-in-progress limits come from
- [WIP Limit Groups](../../Lists/WipLimit/WIP-Limit-Groups.md)
- [Swimlanes](../../Swimlanes/Swimlanes.md)

## How to use it

**Lock or unlock swimlane height resize:**

1. Open the board, its right sidebar, then **Board Settings → Swimlane** (board
   admins only).
2. Tick **Lock/unlock resizing swimlane height**. When unlocked, a swimlane's
   resize handle changes its height.

**Show one shared list header row:**

1. In the same popup, tick **One shared list header row**.

It shows the Swimlanes view as swimlanes were before each one had lists of its
own: every swimlane shows the same lists, all of the board's lists in their
order, under one row of list headers that stays at the top, and the swimlanes
scroll sideways together. Each list still holds the cards of the swimlane it is
shown in. Nothing is changed in the lists, so on a board whose swimlanes have
different lists, turning it off shows each swimlane's own lists again
([#2805](https://github.com/wekan/wekan/issues/2805),
[#6902](https://github.com/wekan/wekan/issues/6902)).

**Allow or forbid dragging swimlanes:** the table at the top of the popup has a
**Draggable** checkbox for **Swimlane**.

**Show Scrum fields on swimlanes:** under **Scrum settings**, tick **Sprint**,
**Release** and **Scrum swimlane purpose**.

**Add a WIP limit group:**

1. Click **WIP Limit Groups** at the bottom of the popup.
2. Under **Add WIP limit group**, tick the lists that should count together, or
   choose a swimlane and click **Apply to swimlane** to tick that swimlane's own
   lists; review the selection before saving.
3. Set the limit (**Set a limit for the maximum number of tasks in this list**)
   and click **Add WIP limit group**.

An existing group can be edited (**Apply**), enabled or disabled (**Enable WIP
Limit**), or removed (**Delete**).

## How the numbers are calculated

- **A WIP limit group's count** (`combinedWipLimitGroupCount` in
  [models/lib/wipLimitGroupDecision.js](../../../../models/lib/wipLimitGroupDecision.js))
  is the sum of the card counts of every list in the group; a list that was
  archived or deleted after joining counts as 0. The group is **over** its
  limit when that sum is greater than the limit, and **has reached** it when
  the sum is equal or greater. A limit that is not a positive number is no
  limit. A group's own limit is separate from each list's own WIP limit.
- **The limit** is a whole number from 1 to 999 in the form; a new group starts
  at 1.

## How it works in WeKan

The popup is `boardSwimlaneSettingsPopup` in
[client/components/sidebar/sidebar.jade](../../../../client/components/sidebar/sidebar.jade),
with its events in
[client/components/sidebar/sidebar.js](../../../../client/components/sidebar/sidebar.js).
The height lock is `board.setSwimlaneHeightResizeLocked()` and the shared
header row `board.setSharedListHeaders()` in
[models/boards.js](../../../../models/boards.js), stored as
`swimlaneHeightResizeLocked` and `sharedListHeaders` on the board; the board's
update rule allows them only to a board admin. The Draggable row is the shared
`boardDragSettings` table
([models/lib/boardDragging.js](../../../../models/lib/boardDragging.js),
`allowsSwimlaneDragging`, saved by `setBoardDragging`; a board that never set
it keeps dragging allowed). The Scrum rows are saved by `scrum.configure` into
the board's Scrum visibility. WIP limit groups are the board's `wipLimitGroups`
array (`name`, `listIds`, `limit`, `enabled`). Tests:
[tests/sharedListHeaders.test.cjs](../../../../tests/sharedListHeaders.test.cjs),
[tests/sharedListRow6902.test.cjs](../../../../tests/sharedListRow6902.test.cjs),
[tests/boardDragging.test.cjs](../../../../tests/boardDragging.test.cjs),
[tests/wipLimitGroupDecision.test.cjs](../../../../tests/wipLimitGroupDecision.test.cjs),
[tests/wipLimitGroupMethod.test.cjs](../../../../tests/wipLimitGroupMethod.test.cjs)
and [tests/swimlaneWipLimitGroup.test.cjs](../../../../tests/swimlaneWipLimitGroup.test.cjs).

## Commits

 - [One shared list header row shows the same lists in every swimlane, scrolling together](https://github.com/wekan/wekan/commit/67321dcb6c071e1d9572fb79eb344349178d274b)
 - [One shared, sticky list header row for all swimlanes, as a board setting](https://github.com/wekan/wekan/commit/9d95bda2455d835e604b658bb1ab06bc282179f9)
 - [Move WIP Limit Groups into Board Settings / Swimlane](https://github.com/wekan/wekan/commit/921c7f301ccf85c94c5b463a361be2fea195eeed)
 - [Note the swimlane WIP quick-select test as the #2380 closing reference](https://github.com/wekan/wekan/commit/35ad7bc92586b417ac92090f1262007c07870459)
 - [Add a unit test for the swimlane-scoped WIP limit group arithmetic](https://github.com/wekan/wekan/commit/52891ec016afe661b71ae75b8c9a08b6e19f32c3)
 - [Add a WIP limit shared across several lists together (WIP limit groups)](https://github.com/wekan/wekan/commit/187a3df1ce3377aba2a522cad4977900460355f0)
 - [Move swimlane/list resize settings and card settings into Board Settings](https://github.com/wekan/wekan/commit/2606ab56ba9441912aef588b7ce1ca599dd3472f)
 - [At Public Board, drag resize list width and swimlane height. For logged in users, fix adding labels](https://github.com/wekan/wekan/commit/351433524708e9a7ccb4795d9ca31a78904943ea)
 - [Resize height of swimlane by dragging. Font Awesome to Unicode icons](https://github.com/wekan/wekan/commit/09631d6b0c1b8e3bbc3bf45d4bb65449b46f1288)
