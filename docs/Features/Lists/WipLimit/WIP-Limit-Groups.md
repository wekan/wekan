# WIP Limit Groups

## What it is

A **shared Work-In-Progress limit across two or more lists together**, on top
of each list's own [per-list WIP limit](README.md)
([#2489](https://github.com/wekan/wekan/issues/2489)). Useful when "in
progress" spans several lists (e.g. "Doing" + "Review" + "Testing") and you
want to cap the combined card count across all of them rather than each list
separately - or cap an entire swimlane at once
([#2380](https://github.com/wekan/wekan/issues/2380)).

## Read more

- [Kanban (development)](https://en.wikipedia.org/wiki/Kanban_(development))
  on Wikipedia - WIP limits, which Kanban also sets over several columns
  together.
- [The Kanban Guide](https://kanbanguides.org/english/) - *limit work in
  progress*.
- WeKan: [WIP Limits](README.md),
  [Board Settings / Swimlane](../../Board-Sidebar/Board-Settings/Swimlane.md).

## How to use it

**Board sidebar (hamburger menu) → Board Settings → Swimlane → WIP Limit
Groups.** It is a row of the Swimlane settings popup (board admins only),
since a group most often caps one swimlane's lists together.

```
┌─ Sidebar ▾ ─────────────────┐
│ Board Settings               │
│  Board View                  │
│  ▸ Swimlane          <- here │
│  List                        │
│  Card                        │
└──────────────────────────────┘

┌ Swimlane ───────────────────────────────────────┐
│ ☐ Lock swimlane height resize                   │
│ ▸ WIP Limit Groups                     <- here  │
└─────────────────────────────────────────────────┘

┌ WIP Limit Groups ──────────────────────────────┐
│ [ Group name.............. ]                    │
│ ☐ To Do  ☑ Doing  ☑ Review  ☑ Testing  ☐ Done   │
│ Limit: [ 5 ]  [Apply]                            │
│ ☑ Enable   🗑 Delete                              │
│ ------------------------------------------------ │
│ Add group:                                       │
│ Swimlane: [ pick a swimlane ▾ ] [Apply]          │
│ ☐ To Do  ☐ Doing  ☐ Review ...                   │
│ Limit: [ 1 ]  [Add]                               │
└────────────────────────────────────────────────────┘
```

**Add a group:**

1. Open a board, click the sidebar's hamburger menu, then **Board Settings →
   Swimlane → WIP Limit Groups**.
2. Under **Add WIP limit group**, check the lists it should cover (any two or
   more lists on the board) - or first pick a swimlane from the **Select
   swimlane** dropdown and click **Apply to swimlane** to check every list of
   that swimlane instead of ticking them one by one.
3. Enter the combined limit (an integer, 1-999) and click **Add WIP limit
   group**. The new group is enabled at once.

**Edit or remove a group:**

1. Give it a name in its *Group name (optional)* box, change its ticked lists
   or its limit, then click **Apply** on that group's own row.
2. Toggle **Enable WIP Limit** on the group: a disabled group is kept, with its
   lists and limit, but ignored.
3. Click **Delete** (the trash icon) to delete a group.

Prerequisites:

- The board needs at least two lists to form a group.
- A group's limit applies to the **combined** card count across every list
  in the group, in addition to (not instead of) each list's own WIP limit.

## How the numbers are calculated

From [models/lib/wipLimitGroupDecision.js](../../../../models/lib/wipLimitGroupDecision.js):

- **Combined count**: the sum of the card counts of the group's lists (each
  list's non-archived cards, the server's count with lazy loading); a list id
  that no longer exists counts as 0.
- **Exceeded**: `combined > limit`, the same "greater than" rule as a list's
  own limit. Every list of an exceeded, enabled group gets its title
  highlighted. A limit that is not a positive number is never exceeded.
- **Reached**: `combined >= limit` (`hasWipLimitGroupReachedLimit`). A group
  only highlights its lists; it does not hide the add-card buttons, which
  only a list's own hard limit does.
- **Swimlane quick-select**: the lists whose `swimlaneId` is that swimlane;
  a shared list with no swimlane of its own is not checked.
- **Limits**: the inputs take 1-999; a group needs at least two lists, all
  on the board and not archived, with no duplicates; a new group's default
  limit is 1 and it starts enabled.

## How it works in WeKan

- Stored on the board as `board.wipLimitGroups` (`_id`, `name`, `listIds`,
  `limit`, `enabled`) in [models/boards.js](../../../../models/boards.js),
  with `addWipLimitGroup`, `updateWipLimitGroup`, `removeWipLimitGroup` and
  `getWipLimitGroups`.
- Editing a saved group goes through the `updateWipLimitGroup` method in
  [server/methods/wipLimitGroups.js](../../../../server/methods/wipLimitGroups.js):
  a board admin or site admin only; it checks the limit and lists and refuses
  a concurrent change (`conflict`).
- The popup `wipLimitGroupsPopup` is in
  [client/components/sidebar/sidebar.jade](../../../../client/components/sidebar/sidebar.jade)
  and [sidebar.js](../../../../client/components/sidebar/sidebar.js); the list
  header highlight is `exceededWipLimitGroup` in
  [client/components/lists/listHeader.js](../../../../client/components/lists/listHeader.js).
- Tests: [tests/wipLimitGroupDecision.test.cjs](../../../../tests/wipLimitGroupDecision.test.cjs),
  [tests/swimlaneWipLimitGroup.test.cjs](../../../../tests/swimlaneWipLimitGroup.test.cjs),
  [tests/wipLimitGroupMethod.test.cjs](../../../../tests/wipLimitGroupMethod.test.cjs),
  [tests/wipGroupCheckboxVisibility.test.cjs](../../../../tests/wipGroupCheckboxVisibility.test.cjs),
  [tests/playwright/specs/wip-limit-group-selection.e2e.js](../../../../tests/playwright/specs/wip-limit-group-selection.e2e.js).

## Commits

 - [close #2489 as already implemented](https://github.com/wekan/wekan/commit/61ad1272bb68422f4b29f71a04f71e66a796ae3c)
 - [edits to saved groups are authorized and persisted](https://github.com/wekan/wekan/commit/783733623e3cf0a556d45c5c9a6af1124e01f77b)
 - [the group list checkboxes are visible and editable](https://github.com/wekan/wekan/commit/87d69358dca00d2a14662c350947de13044dcb33)
 - [WIP Limit Groups move into Board Settings / Swimlane](https://github.com/wekan/wekan/commit/921c7f301ccf85c94c5b463a361be2fea195eeed)
 - [the swimlane quick-select test as the #2380 reference](https://github.com/wekan/wekan/commit/35ad7bc92586b417ac92090f1262007c07870459)
 - [unit test for the swimlane-scoped group arithmetic](https://github.com/wekan/wekan/commit/52891ec016afe661b71ae75b8c9a08b6e19f32c3)
 - [a WIP limit shared across several lists together](https://github.com/wekan/wekan/commit/187a3df1ce3377aba2a522cad4977900460355f0)
