# Lists

## What it is

A list's header and its hamburger menu (`client/components/lists/listHeader.jade`).
Lists are the columns of a board; these pages describe each list feature and
each entry of the list menu.

- [Lists](README.md) — the list header, creating, collapsing and list width
- [List permissions](List-Permissions.md)
- [WIP limits](WipLimit/README.md) and [WIP limit groups](WipLimit/WIP-Limit-Groups.md)
- [Flow policies](Flow-Policies.md) — list policies, split lists, commitment point, WIP limit per person

## How to use it

Open the list menu (☰ in the list header, **List Actions**) and pick the
entry; each row below links to its guide. The entries are in menu order
(`listActionPopup`), grouped under the headings **Share and history**,
**Export and import**, **Add**, **Watch**, **Edit**, **Settings**, **Move and
copy** and **Archive**. Who sees which entry is on each page.

| Entry | Guide |
| --- | --- |
| Copy link to clipboard | [Board item links](../Board-Item-Links.md) |
| Star / Unstar | [Star](Star.md) |
| History | [History](../History/README.md) |
| Export, Import | [Scope, formats and limits](../Board-Sidebar/Board-Settings/Import-Export/Format-Coverage.md) |
| Add Card to Top of List, Add Card to Bottom of List | [Cards](../Cards/README.md) |
| Add List | [Lists](README.md) |
| Watch / Unwatch | [Activities and notifications](../Admin-Panel/Settings/Activities-and-Notifications.md) |
| Set Color | [Set Color](Set-Color.md) |
| Select all cards in this list | [Select all cards](Select-All-Cards.md) |
| Archive all cards in this list | [Archive all cards](Archive-All-Cards.md) |
| Set WIP Limit / Edit WIP Limit | [WIP limits](WipLimit/README.md) |
| List permissions | [List permissions](List-Permissions.md) |
| List policy, Split into Doing and Done | [Flow policies](Flow-Policies.md) |
| Sticky list headers | [Sticky list headers](Sticky-List-Headers.md) |
| Sync | [Sync](Sync.md) |
| Copy List, Move List | [Lists](README.md) |
| Move List to Archive | [Archive and Delete](../Board-Sidebar/Archive/Archive-and-Delete.md) |
| More | [More](More.md) |

See the pages above.

## Lists

### What it is

Lists are the columns that contain cards: on a Kanban board each list is a
stage of the work, and a card moves from list to list as the work goes on.
In Swimlanes view, a list can belong to a particular swimlane; legacy shared
lists can appear across swimlanes. A card has both a list and a swimlane.
Moving or copying a list lets you choose a destination rather than assuming
that every list is shared everywhere.

### Read more

- [Kanban board](https://en.wikipedia.org/wiki/Kanban_board) and
  [Kanban (development)](https://en.wikipedia.org/wiki/Kanban_(development))
  on Wikipedia - columns as the stages of a workflow.
- WeKan: [the list menu](README.md),
  [multiline creation](../Editor/Multiline.md),
  [Board Settings / List](../Board-Sidebar/Board-Settings/List.md),
  [Swimlanes](../Swimlanes/README.md),
  [Archive and Delete](../Board-Sidebar/Archive/Archive-and-Delete.md).

### How to use it

**Create lists:**

1. Click the **Add List** icon (a plus in a square) at the right end of a list
   header, or **Add List** in the list menu (☰ → **Add**). An empty board or
   swimlane has a **+** for its first list.
2. Type the name. **Add After List** chooses which list the new one comes
   after.
3. To create several, paste several lines into the name field. The
   **Add many lines as:** chooser defaults to **1 List** with a multiline
   name; choose **Many Lists** to create a list for each nonempty line, in
   pasted order. For example, `Todo`, `Doing` and `Done` on separate lines can
   become three lists.
4. Click **Save**.

**Rename a list:** click the list title, edit it and click **Save**; line
breaks are retained in the header. See
[multiline creation](../Editor/Multiline.md).

**Collapse a list:** click the caret at the top corner of its header
(**Collapse**); click it again (**Uncollapse**) to expand. The preference is
personal and survives a reload; in Swimlanes view each swimlane's row of a
list is collapsed on its own.

**Resize a list:** drag the resize handle between lists when resizing is
allowed. Board-wide resize locking and same-width controls are in
[Board Settings / List](../Board-Sidebar/Board-Settings/List.md).
There is no **Set width** row in the current list menu.

**Copy or move a list:** list menu → **Copy List** or **Move List** (under
**Move and copy**). Choose the board, the swimlane and a list, then
**Left of selected list** or **Right of selected list**, and click **Done**.
Move List is offered to board admins; Copy List to everybody who sees the
list menu except Workers.

**Archive and delete:** archive a list to put it away (list menu → **Move
List to Archive**), then use **Board Settings** (the board's hamburger menu) →
**Archive** to restore it. Permanent deletion has separate permissions and
confirmation; see [Archive and Delete](../Board-Sidebar/Archive/Archive-and-Delete.md).

The list menu also provides links/history, export/import, adding cards at the
top or bottom, watching, and the other entries listed in [the list
menu](README.md).

### How the numbers are calculated

From [client/components/lists/listHeader.js](../../../client/components/lists/listHeader.js):

- **Card count** in the header (*n Cards*, *1 Card*): the list's non-archived
  cards; in Swimlanes view only those of the swimlane row the header is drawn
  in. With lazy card loading the server's count for the same selector is used
  instead of the loaded cards
  ([client/lib/lazyCards.js](../../../client/lib/lazyCards.js)).
- **When the count is shown**: only when you set **Show cards count if list
  contains more than** in your member settings; it is shown when the list's
  whole card count is **at least** that number (`count >= limit`).
- **WIP limit** `(n/limit)` after the title: see [WIP limits](WipLimit/README.md).
- **∑ sum badge**: the sum of the board's number custom fields that have
  *show sum at top of list* on, over the same cards as the count; a text value
  is parsed as a number (a decimal comma is accepted) and values that are not
  numbers are skipped. Its tooltip adds `min–max, count/total`: the smallest
  and largest value, how many cards have a value and how many cards there
  are. A date field with the same setting shows the earliest–latest range
  instead ([models/lib/customFieldsSum.js](../../../models/lib/customFieldsSum.js)).
- **List width**: 220 px by default, 200 px at the least
  ([models/lib/listWidth.js](../../../models/lib/listWidth.js)).

### How it works in WeKan

- The list document is in [models/lists.js](../../../models/lists.js) (`title`,
  `boardId`, `swimlaneId`, `sort`, `color`, `wipLimit`, `archived`, ...); the
  server methods are in [server/models/lists.js](../../../server/models/lists.js).
- The header, its menu and popups are
  [client/components/lists/listHeader.jade](../../../client/components/lists/listHeader.jade)
  and [listHeader.js](../../../client/components/lists/listHeader.js); the
  list body is [listBody.js](../../../client/components/lists/listBody.js).
- Multiline titles: [models/lib/multilineTitles.js](../../../models/lib/multilineTitles.js)
  via [client/components/forms/multilineTitleChoice.jade](../../../client/components/forms/multilineTitleChoice.jade).
- Collapse state: `Utils.getListCollapseState` / `setListCollapseState` in
  [client/lib/utils.js](../../../client/lib/utils.js), saved per user by the
  `setListCollapsedState` method ([server/models/users.js](../../../server/models/users.js)).
- Tests: [tests/multilineTitles.test.cjs](../../../tests/multilineTitles.test.cjs),
  [tests/listCollapsePerSwimlane.test.cjs](../../../tests/listCollapsePerSwimlane.test.cjs),
  [tests/listCollapseCaretPosition.test.cjs](../../../tests/listCollapseCaretPosition.test.cjs),
  [tests/customFieldsSum.test.cjs](../../../tests/customFieldsSum.test.cjs),
  [tests/listWidthDefaults.test.cjs](../../../tests/listWidthDefaults.test.cjs),
  [tests/playwright/specs/76-list-collapse-refresh.e2e.js](../../../tests/playwright/specs/76-list-collapse-refresh.e2e.js).

Related:

- [Per-list WIP limits](WipLimit/README.md)
- [Shared WIP Limit Groups](WipLimit/WIP-Limit-Groups.md)
- [Swimlanes](../Swimlanes/README.md)

## Commits

 - [the list, card and swimlane menus are grouped under headings](https://github.com/wekan/wekan/commit/0d8f8b8d96b868a6d75b803ef105e50aad450977)
 - [docs/Features filed the way the WeKan menus are](https://github.com/wekan/wekan/commit/b7589737f5730ce1ba83244946e158519528a783)
 - [the list menu is grouped under headings](https://github.com/wekan/wekan/commit/0d8f8b8d96b868a6d75b803ef105e50aad450977)
 - [create lists from multiline titles](https://github.com/wekan/wekan/commit/552ac0855aa64d8b9a6a9292b6da286bb08c83bb)
 - [list width validation uses the 200 px minimum](https://github.com/wekan/wekan/commit/68d679c6c71f9668a7fc50f9271a03093e7b4e95)
 - [the custom-field sum badge gets min/max and a date range (#2075)](https://github.com/wekan/wekan/commit/453b309c72069ab6428b88f76a28d65fc306674f)
 - [Set width removed from the list menu](https://github.com/wekan/wekan/commit/4374502a4900e4922e5e451dae44e652fc42810f)
 - [list resize settings move into Board Settings](https://github.com/wekan/wekan/commit/2606ab56ba9441912aef588b7ce1ca599dd3472f)
 - [board-wide list-width resize lock (#6680)](https://github.com/wekan/wekan/commit/5c48be8e672e6cbd004396b1bb66b94181f5c6eb)
 - [an expanded list's collapse caret moves to the header's top corner](https://github.com/wekan/wekan/commit/0f56a3344b4a04b55adb74ca0bfa2f96bd8e63db)
 - [Copy List and Move List share one destination form](https://github.com/wekan/wekan/commit/53c3123de5dc82f9c010792989adf55cc15bffb6)
 - [mobile mode: Add List moves into the list header](https://github.com/wekan/wekan/commit/61979c0f6cdef909d1fad79c50cdd6f07b72b73e)
 - [Add List as a per-list header button with an inline composer (#6465)](https://github.com/wekan/wekan/commit/765d04bf7c678a9f28b663beadae7b07fd79f339)
 - [lazy card loading: accurate card counters](https://github.com/wekan/wekan/commit/7d5f29e11479be6a3b8393c8817b30620e99a068)
 - [collapse lists, swimlanes and the opened card](https://github.com/wekan/wekan/commit/58f4884ad603e4f8c68a8819dfb1440234da70b6)
