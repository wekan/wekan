# Board View settings

Per board, choose which entries of the **Board View** menu (Swimlanes, Lists,
Table, Calendar, the Gantt views, the charts, …) are offered, and which one a
board opens in - separately for when the board is **public** and when it is
**private**. A public board that is a read-only roadmap for the world can
offer only Roadmap and Gantt and open in Roadmap, while the same board, made
private again, shows its members every view and opens in Swimlanes.

## Where to find it

**Board sidebar (hamburger menu) → Board Settings → Board View**, the first
entry of the Board Settings group, directly ABOVE **Swimlane**. Board admins
only - same restriction as Swimlane and List.

```
┌─ Sidebar ▾ ─────────────────┐
│ Board Settings               │
│  ▸ Board View        <- here │
│  Swimlane                    │
│  List                        │
│  WIP Limit Groups            │
│  Card                        │
└──────────────────────────────┘
```

## The popup

Same table pattern as **Card Settings** (one row per thing, one checkbox per
column, the description last). Five columns, left to right:

| Column | Meaning |
| --- | --- |
| Default on Public Board | the view a **public** board opens in |
| Show on Public Board | the view is in the Board View menu of a **public** board |
| Default on Private Board | the view a **private** board opens in |
| Show on Private Board | the view is in the Board View menu of a **private** board |
| Description | the view's name - the same translated label the Board View menu shows |

```
┌ Board View ────────────────────────────────────────────────────────────────┐
│ Default on   Show on      Default on    Show on       Description          │
│ Public Board Public Board Private Board Private Board                      │
│    [x]          [x]          [x]           [x]        Swimlanes            │
│    [ ]          [x]          [ ]           [x]        Lists                │
│    [ ]          [x]          [ ]           [x]        Table                │
│    [ ]          [ ]          [ ]           [x]        Calendar             │
│    ...                                                                     │
└────────────────────────────────────────────────────────────────────────────┘
```

The Description column lists **every view of the Board View menu, in the
menu's own order**, with the same translation keys the menu uses:

1. Swimlanes (`swimlanes`)
2. Lists (`board-view-lists`)
3. Table (`board-view-table`)
4. Calendar (`board-view-cal`)
5. Multi-board Calendar (`board-view-multiboard-cal`)
6. Time (`board-view-time`)
7. Timeline (`board-view-timeline`)
8. Statistics (`board-view-stats`)
9. Group by Assignee (`board-view-group-by-assignee`)
10. Gantt (`board-view-gantt`)
11. Frappe Gantt (`board-view-gantt-frappe`)
12. DHTMLX Gantt (`board-view-gantt-dhtmlx`)
13. Roadmap (`board-view-roadmap`)
14. Dashboard (`board-view-dashboard`)
15. Bigboard (`board-view-bigboard`)
16. Burndown (`board-view-burndown`)
17. Burnup (`board-view-burnup`)
18. Cumulative Flow (`board-view-cumulative-flow`)
19. Control Chart (`board-view-control-chart`)
20. Cycle Time (`board-view-cycle-time`)
21. Flow Efficiency (`board-view-flow-efficiency`)
22. Lead Time (`board-view-lead-time`)
23. Throughput Histogram (`board-view-throughput-histogram`)
24. WIP Run (`board-view-wip-run`)
25. Pulse (`board-view-pulse`)

The one list is `BOARD_VIEWS` in `models/lib/boardViewSettings.js`. Both the
popup and the Board View menu (`boardChangeViewPopup` in
`client/components/boards/boardHeader.jade`) render from it, so a view
exists in one exactly when it exists in the other;
`tests/boardViewMenu.test.cjs` pins the table to the required menu order and
`tests/boardViewSettings.test.cjs` pins the two templates to the table.

### When public boards are hidden

When **Admin Panel → Settings → Visibility → All Boards: Hide → Public
boards** is ticked (the `tableVisibilityMode-allowPrivateOnly` setting, which
makes every board private-only), the two public columns - *Default on Public
Board* and *Show on Public Board* - are **not rendered**, and the popup is a
three-column table: *Default on Private Board*, *Show on Private Board*,
*Description*. The stored public values are kept, untouched, for the day the
setting is turned off again.

### One default per visibility

*Default on Public Board* and *Default on Private Board* are each a
**radio group drawn as checkboxes**: exactly one view is ticked in each
column. Ticking another view moves the tick there and un-ticks the previous
default; clicking the already-ticked default does nothing (a board always has
a default view - it cannot be un-set).

A default view is always shown: making a view the default also ticks its
*Show* box in the same column, and the *Show* box of the current default
cannot be un-ticked (the click does nothing). To hide the current default,
pick another default first.

Every setting is on by default: a board that has never opened this popup
shows every view on both public and private, and opens in **Swimlanes**
(`board-view-swimlanes`) for both, which is what WeKan has always done.

### Reordering the menu

Each row carries an **up** and a **down** arrow in front of its name, in the
Description column - the same arrows as Card Settings' *Card field order*,
with the same *Move up* / *Move down* titles (`card-field-order-move-up`,
`card-field-order-move-down`; no new keys). They are real links, so the
keyboard reaches them with Tab and presses them with Enter. Clicking one
moves the row one step, and the **Board View menu lists its entries in that
order** for everybody on the board. The first row's up arrow and the last
row's down arrow do nothing and are drawn disabled.

The default order is the menu's order above, and while the order is the
default one the menu draws its usual separators between the groups (after
Table, Timeline, Statistics, Group by Assignee, DHTMLX Gantt and Bigboard).
A custom order has no groups, so it has no separators.

The order is stored on the board as `boardViewOrder`, an array of view keys
first to last. A stored order is **made whole** before use
(`normalizeBoardViewOrder`): unknown keys are dropped, duplicates are
dropped, and every known view missing from it is appended in its default
position - so a menu never loses a view and never shows one twice, whatever
an old or hand-edited document holds, and a view added to WeKan later
appears at the end of an existing custom order.

## How the settings apply

- **The Board View menu** (`boardChangeViewPopup`) is rendered from the
  board: `boardViewMenuEntries` gives it the views whose *Show* box is ticked
  for the board's current visibility (`board.permission` is `public` or
  `private`), in the board's order, each with the `js-open-<view>-view` class
  its click handler listens for. A view hidden here is also not opened by the
  keyboard or by an old link: the view WeKan renders is always resolved
  through the board's settings (below).
- **The default view.** A user's chosen view is still stored where it was -
  `profile.boardView` for a logged-in user, `localStorage.boardView` for a
  visitor. What changes is how the view to RENDER is chosen
  (`Utils.boardView()` in `client/lib/utils.js`): the stored choice is used
  when the board shows it; when there is no stored choice, or the stored one
  is hidden on this board, the board's default for its visibility is used
  instead. Nobody can get stuck looking at a view the menu no longer offers.
- **A board's visibility changes** (Private ⇄ Public in the board header): the
  other column set takes over immediately, since both are read from the board
  document reactively.

## Data model and setters

Three fields on the board (`models/boards.js`):

| Field | Type | Meaning |
| --- | --- | --- |
| `boardViewSettings` | object | `{ '<view>': { showOnPublic: Boolean, showOnPrivate: Boolean } }`. A view with no entry, or an entry with no value for that side, is **shown**. |
| `defaultPublicBoardView` | string | the view a public board opens in; default `board-view-swimlanes` |
| `defaultPrivateBoardView` | string | the view a private board opens in; default `board-view-swimlanes` |
| `boardViewOrder` | array of strings | the Board View menu's order, first to last; missing = the default order |

The decision logic is a pure CommonJS module, `models/lib/boardViewSettings.js`,
so it is testable without Meteor and shared by the client, the server and the
tests:

| Function | What it does |
| --- | --- |
| `BOARD_VIEWS` | the ordered list of `{ view, labelKey }` above |
| `DEFAULT_BOARD_VIEW` | `'board-view-swimlanes'` |
| `isBoardViewShown(board, view, visibility)` | reads `boardViewSettings`; missing means shown |
| `defaultBoardView(board, visibility)` | `defaultPublicBoardView` / `defaultPrivateBoardView`, falling back to `DEFAULT_BOARD_VIEW` |
| `DEFAULT_BOARD_VIEW_ORDER` | the view keys of `BOARD_VIEWS`, in menu order |
| `normalizeBoardViewOrder(storedOrder)` | the stored order made whole: unknown and duplicate keys dropped, missing views appended in default order |
| `isDefaultBoardViewOrder(order)` | whether the (normalized) order is the default one |
| `orderedBoardViews(board)` | `BOARD_VIEWS` in the board's order |
| `moveBoardView(order, view, direction)` | a new normalized order with `view` moved one step `'up'` or `'down'`; unchanged for an unknown view, the first view up or the last view down |
| `visibleBoardViews(board, visibility)` | `orderedBoardViews` filtered by `isBoardViewShown` |
| `boardViewMenuEntries(board, currentView)` | what the menu renders: the visible views in order, each with `jsClass`, `isCurrent` and `separatorAfter` (default order only, after the views in `SEPARATOR_AFTER`) |
| `resolveBoardView(board, requestedView)` | the view to render: `requestedView` if the board shows it for `board.permission`, else that side's default, else `DEFAULT_BOARD_VIEW` |
| `showBoardViewModifier(board, view, visibility, shown)` | the `$set` for a *Show* click; returns `null` when it would hide that side's default |
| `defaultBoardViewModifier(board, view, visibility)` | the `$set` for a *Default* click: sets the default AND that side's `showOn…` to `true`; returns `null` for an unknown view |

`visibility` is `'public'` or `'private'`; anything else is treated as
`'private'`.

The board has three instance methods that apply those decisions -
`board.setBoardViewShown(view, visibility, shown)`,
`board.setDefaultBoardView(view, visibility)` and
`board.moveBoardView(view, direction)` (which re-reads the board's current
order on every click, so two quick clicks each move from where the previous
one left it, and writes nothing for a no-op) - and the popup calls them
directly, the way Swimlane Settings calls `setSwimlaneHeightResizeLocked`.
Who may persist them is decided where it is for every other board setting:
`Boards.allow`'s update rule in `server/permissions/boards.js`, which requires
a **board admin** (or a site admin). A non-admin does not see the menu entry
and could not write the fields if they did.

## Related

- [Card field display order](Card-Field-Display-Order.md) - the Card Settings
  popup this one is modelled on.
- [Swimlanes](Swimlanes.md), [Roadmap](Roadmap.md), [Bigboard](Bigboard.md),
  [Group by Assignee](Group-By-Assignee.md) - some of the views the menu offers.
