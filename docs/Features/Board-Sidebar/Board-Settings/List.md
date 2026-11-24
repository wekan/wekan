# Board Settings / List

## What it is

The board-wide settings of lists, for a board administrator: whether lists may
be dragged, whether their width may be resized, whether all lists have the same
width, which Scrum field a list shows, and the board's Kanban flow policies -
list policies, lists split into Doing and Done, the commitment point and a WIP
limit per person.

## Read more

- [Wikipedia: Kanban (development)](https://en.wikipedia.org/wiki/Kanban_(development)),
  where explicit policies, the commitment point and WIP limits come from
- [Wikipedia: Kanban board](https://en.wikipedia.org/wiki/Kanban_board)
- [Lists](../../Lists/README.md): creation, multiline names, collapse state and
  list actions
- [Flow policies](../../Lists/Flow-Policies.md)

## How to use it

**Lock list widths, or give every list the same width:**

1. Open the board, its right sidebar, then **Board Settings → List** (board
   admins only).
2. Tick **Lock/unlock resizing list width between lists** and **Same width
   for all lists (whole board)** as needed. When resizing is permitted, drag
   the handle between lists. The same-width setting applies a common width to
   the board's lists.

These switches moved from header controls into this popup. The list menu no
longer has a **Set width** entry.

**Allow or forbid dragging lists:** the table at the top of the popup has a
**Draggable** checkbox for **List**.

**Show a list's Scrum workflow category:** under **Scrum settings**, tick
**Scrum workflow category**.

### Flow policies

Below the width switches, a board administrator turns on the Kanban flow
policies of the board's lists, each also a feature of Admin Panel / Settings /
Features (a row is not shown when the feature is turned off there):

- **Show list policies**: each list's policy (when a card may come in, and when
  it is done there) is written from the list menu and shown at its header.
- **Allow lists split into Doing and Done**: a list is then split from its menu.
- **Commitment point**: the list from which work is committed to.
- **WIP limit per person**: how many open cards one person may hold.

See [flow policies](../../Lists/Flow-Policies.md).

## How the numbers are calculated

- **List width** ([models/lib/listWidth.js](../../../../models/lib/listWidth.js)):
  every list is 220 pixels wide by default (`DEFAULT_LIST_WIDTH`), and a width
  set by resizing must be at least 200 pixels (`MIN_LIST_WIDTH`); an invalid
  stored width falls back to the default. With **Same width for all lists** on,
  every list uses the board's one value, `sameWidthForAllListsValue` (default
  220), which dragging any list's resize handle changes; otherwise a list uses
  its shared width, or the viewer's own width when personal list widths are on.
- **WIP limit per person**
  ([models/lib/boardFlowPolicies.js](../../../../models/lib/boardFlowPolicies.js)):
  a whole number from 1 to 99, or none. A person's count is the number of the
  board's open cards they hold: a card's assignees, or its members when nobody
  is assigned; a card counts as open when it is not archived, not marked done
  and not a template. The opened card warns about each of its people over the
  limit.
- **Commitment point**: a list is committed when it is at or after the
  commitment list in the lists' order.
- **A list policy** is at most 2,000 characters.

## How it works in WeKan

The popup is `boardListSettingsPopup` in
[client/components/sidebar/sidebar.jade](../../../../client/components/sidebar/sidebar.jade),
with the flow rows in `boardFlowListSettings`
([client/components/lists/listFlowPolicies.jade](../../../../client/components/lists/listFlowPolicies.jade)).
The switches call board methods in [models/boards.js](../../../../models/boards.js):
`setListWidthResizeLocked`, `setSameWidthForAllLists`,
`setAllowsListPolicies`, `setAllowsSplitLists`, `setCommitmentListId` and
`setPersonWipLimit`, stored as `listWidthResizeLocked`,
`sameWidthForAllLists`, `allowsListPolicies`, `allowsSplitLists`,
`commitmentListId` and `personWipLimit` (1-99) on the board. The board's update
rule allows these to a board admin; `sameWidthForAllListsValue` alone may be
changed by any member with write access, by dragging. The width is resolved by
`resolveListWidth` in
[models/lib/listWidth.js](../../../../models/lib/listWidth.js) and applied in
[client/components/lists/list.js](../../../../client/components/lists/list.js).
Tests: [tests/listWidthDefaults.test.cjs](../../../../tests/listWidthDefaults.test.cjs),
[tests/fixedListWidthShared.test.cjs](../../../../tests/fixedListWidthShared.test.cjs),
[tests/boardFlowPolicies.test.cjs](../../../../tests/boardFlowPolicies.test.cjs)
and [tests/boardDragging.test.cjs](../../../../tests/boardDragging.test.cjs).

## Commits

 - [Lists split into Doing and Done](https://github.com/wekan/wekan/commit/fd5c207006ac1c3ac605b4689860b47205a18d80)
 - [List policies, the commitment point, a WIP limit per person, and the Definition of Ready](https://github.com/wekan/wekan/commit/9ac7b916c08bb139f1090d4e87b8319aed08d324)
 - [Revert "Hardcode list width to 240px and remove the width/height set-value popups"](https://github.com/wekan/wekan/commit/59bed92f32165fab8fabe66529dd32e9fbc0115f)
 - [Hardcode list width to 240px and remove the width/height set-value popups](https://github.com/wekan/wekan/commit/8614949580a8824be8c189ab3c7e5869d36f6e9b)
 - [Rework list widths: single width, Shared/Personal board scope (#6409)](https://github.com/wekan/wekan/commit/b477b1383d5e8c9b5afd2b129bd1e7104315b9bb)
 - [At Public Board, drag resize list width and swimlane height. For logged in users, fix adding labels](https://github.com/wekan/wekan/commit/351433524708e9a7ccb4795d9ca31a78904943ea)
 - [Revert "Revert some scrollbar, sidebar and list width changes."](https://github.com/wekan/wekan/commit/a36e80099aab6fcc235714dfbf169adaa94c09d4)
 - [Revert some scrollbar, sidebar and list width changes](https://github.com/wekan/wekan/commit/096fe130f68e0d8d082d309901c75ed04285b7e2)
