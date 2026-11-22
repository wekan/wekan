# Board View settings

## What it is

Per board, choose which entries of the **Board View** menu (Swimlanes, Lists,
Table, Calendar, the Gantt views, the charts, …) are offered, and which one a
board opens in - separately for when the board is **public** and when it is
**private**. A public board that is a read-only roadmap for the world can
offer only Roadmap and Gantt and open in Roadmap, while the same board, made
private again, shows its members every view and opens in Swimlanes.

## Read more

- [Wikipedia: Kanban board](https://en.wikipedia.org/wiki/Kanban_board)
- [Wikipedia: Gantt chart](https://en.wikipedia.org/wiki/Gantt_chart)
- [Wikipedia: Burndown chart](https://en.wikipedia.org/wiki/Burndown_chart)
- [Wikipedia: Cumulative flow diagram](https://en.wikipedia.org/wiki/Cumulative_flow_diagram)
- [Card field display order](Card.md) - the Card Settings
  popup this one is modelled on.
- [Swimlanes](../../Swimlanes/Swimlanes.md), [Roadmap](../../Board-Header/Board-Views/Roadmap.md), [Bigboard](../../Board-Header/Board-Views/Bigboard.md),
  [Group by Assignee](../../Board-Header/Board-Views/Group-By-Assignee.md) - some of the views the menu offers.
- [REST-API.md, Board Settings: Board View](../../../API/REST-API.md#board-settings-board-view)

## How to use it

### Where to find it

**Board sidebar (hamburger menu) → Board Settings → Board View**, the first
entry of the second group of Board Settings, directly ABOVE **Swimlane**.
Board admins only - same restriction as Swimlane and List.

```
┌─ Sidebar ▾ ─────────────────┐
│ Board Settings               │
│  Rules                       │
│  ────────────────────────    │
│  Scrum settings              │
│  ────────────────────────    │
│  Change color                │
│  Change Background Image     │
│  Date                        │
│  ────────────────────────    │
│  ▸ Board View        <- here │
│  Swimlane                    │
│  List                        │
│  Card                        │
│  ────────────────────────    │
│  Export                      │
│  Import                      │
│  Notifications               │
│  Outgoing Webhooks           │
│  ────────────────────────    │
│  Archived items              │
│  Save as Template            │
│  Move Board to Archive       │
└──────────────────────────────┘
```

The diagram leaves out entries that are not about the board's views, such as
the Rules views, Board announcement, All Boards Settings, Original positions
and Summary; the whole menu is in [Board Settings](README.md).

### The popup

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
5. Calendar Mode (`board-view-calendar-mode`)
6. Multi Board Calendar (`board-view-multiboard-cal`)
7. Time (`board-view-time`)
8. Timeline (`board-view-timeline`)
9. Statistics (`board-view-stats`)
10. Group by Assignee (`board-view-group-by-assignee`)
11. Gantt (`board-view-gantt`)
12. Frappe Gantt (`board-view-gantt-frappe`)
13. DHTMLX Gantt (`board-view-gantt-dhtmlx`)
14. Product Backlog (`board-view-product-backlog`)
15. Sprints (`board-view-sprints`)
16. Sprint Report (`board-view-sprint-report`)
17. Velocity (`board-view-velocity`)
18. Roadmap (`board-view-roadmap`)
19. Dashboard (`board-view-dashboard`)
20. Bigboard (`board-view-bigboard`)
21. Burndown (`board-view-burndown`)
22. Burnup (`board-view-burnup`)
23. Cumulative Flow (`board-view-cumulative-flow`)
24. Control (`board-view-control-chart`)
25. Cycle Time (`board-view-cycle-time`)
26. Flow Efficiency (`board-view-flow-efficiency`)
27. Lead Time (`board-view-lead-time`)
28. Throughput Histogram (`board-view-throughput-histogram`)
29. WIP Run (`board-view-wip-run`)
30. Pulse (`board-view-pulse`)
31. Aging WIP (`board-view-aging-wip`)
32. Blocker Analysis (`board-view-blocker-analysis`)
33. Monte Carlo Forecasts (`board-view-monte-carlo`)
34. Process Behavior (XmR) (`board-view-process-behavior`)
35. Work Item Size vs. Cycle Time (`board-view-size-cycle-time`)
36. Map (`board-view-map`)
37. Email (`board-view-email`)
38. Chat (`board-view-chat`)
39. Version Control (`board-view-version-control`)
40. Column sets (`board-view-column-sets`)
41. Created vs. Resolved (`board-view-created-resolved`)
42. Net Flow (`board-view-net-flow`)
43. Time in List (`board-view-time-in-list`)
44. Average Age (`board-view-average-age`)
45. Throughput Run Chart (`board-view-throughput-run`)
46. Due Date Performance (`board-view-due-date-performance`)
47. Release Burndown (`board-view-release-burndown`)
48. Epic Progress (`board-view-epic-progress`)
49. Workload (`board-view-workload`)
50. Distribution (`board-view-distribution`)
51. Dependency Map (`board-view-dependency-map`)
52. Activity Heatmap (`board-view-activity-heatmap`)
53. Website (`board-view-website`)
54. Shop (`board-view-shop`)

The one list is `BOARD_VIEWS` in `models/lib/boardViewSettings.js`. Both the
popup and the Board View menu (`boardChangeViewPopup` in
`client/components/boards/boardHeader.jade`) render from it, so a view
exists in one exactly when it exists in the other;
`tests/boardViewMenu.test.cjs` pins the table to the required menu order and
`tests/boardViewSettings.test.cjs` pins the two templates to the table.

That order is not an accident of how the table is written: it is **the order
the Board View menu had before views became orderable** - the 25 static
entries of `boardChangeViewPopup` as of commit `525bcab1b`, the parent of the
Board Settings / Board View feature, with its six separators after Table,
Timeline, Statistics, Group by Assignee, DHTMLX Gantt and Bigboard. The model
keeps it as a literal list, `DEFAULT_BOARD_VIEW_ORDER`, and
`tests/boardViewSettings.test.cjs` pins that list and the separator positions
to the pre-feature template, so re-sorting `BOARD_VIEWS` cannot change what a
board with no stored order shows.

#### When public boards are hidden

When **Admin Panel → Settings → Appearance → All Boards: Hide → Public
boards** is ticked (the `tableVisibilityMode-allowPrivateOnly` setting, which
makes every board private-only), the two public columns - *Default on Public
Board* and *Show on Public Board* - are **not rendered**, and the popup is a
three-column table: *Default on Private Board*, *Show on Private Board*,
*Description*. The stored public values are kept, untouched, for the day the
setting is turned off again.

#### One default per visibility

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

#### Reordering the menu

Each row's place in the Board View menu is changed by **drag and drop**, like
Board Settings / Card: with drag handles on, drag the handle (the arrows icon,
*Drag to reorder*) in front of the name, in the Description column; with them
off, drag the row's icon and name. A row moves only within its own group. On a
focused handle or name, the **Up** and **Down** arrow keys move the row one
step. The **Board View menu lists its entries in that order** for everybody on
the board.

The default order is the menu's order above - the pre-feature menu order,
exactly as the menu was before it became orderable - and while the order is
the default one the menu draws its usual separators between the groups (after
Table, Timeline, Statistics, Group by Assignee, DHTMLX Gantt and Bigboard),
in the same places the old template drew them. A custom order has no groups,
so it has no separators.

The order is stored on the board as `boardViewOrder`, an array of view keys
first to last. A stored order is **made whole** before use
(`normalizeBoardViewOrder`): unknown keys are dropped, duplicates are
dropped, and every known view missing from it is appended after the stored
keys, in the default (pre-feature) order - so a menu never loses a view and
never shows one twice, whatever an old or hand-edited document holds, and a
view added to WeKan later appears at the end of an existing custom order.

## How the numbers are calculated

- **Views and groups**: the menu has 53 views in 6 groups (`BOARD_VIEWS` and
  `BOARD_VIEW_GROUPS` in
  [models/lib/boardViewSettings.js](../../../../models/lib/boardViewSettings.js)).
- **Defaults**: every view is shown on both sides, and both sides open in
  Swimlanes (`board-view-swimlanes`), until a board admin changes them.
- **Exactly one default per side**: a *Default* click sets that view and ticks
  its *Show* box; a *Show* click that would hide that side's default changes
  nothing.
- **The order** is made whole before use (`normalizeBoardViewOrder`): unknown
  and repeated keys are dropped, and every known view missing from it is
  appended in the default order, so the menu always shows each view once.

## How it works in WeKan

### Groups

The Board View menu and this popup show the views in six groups, each under its
heading (`BOARD_VIEW_GROUPS` in `models/lib/boardViewSettings.js`):

| Group | Views |
| --- | --- |
| Board | Swimlanes, Lists, Table, Column sets, Group by Assignee, Map, Bigboard |
| Calendar and time | Calendar, Calendar Mode, Multi Board Calendar, Time, Timeline, Gantt, Frappe Gantt, DHTMLX Gantt, Roadmap |
| Scrum | Product Backlog, Sprints, Sprint Report, Velocity, Burndown, Burnup, Release Burndown, Epic Progress |
| Kanban flow | Cumulative Flow, Control, Cycle Time, Lead Time, Flow Efficiency, Throughput Histogram, WIP Run, Aging WIP, Blocker Analysis, Monte Carlo, Process Behavior, Size vs. Cycle Time, Created vs. Resolved, Net Flow, Time in List, Average Age, Throughput Run Chart, Due Date Performance |
| Overview | Dashboard, Pulse, Statistics, Workload, Distribution, Dependency Map, Activity Heatmap |
| Communication and code | Email, Chat, Website, Shop, Version Control |

The order a board admin drags here decides inside each group; a view stays in
its own group. A group none of whose views is shown has no heading.

### How the settings apply

- **Who sees which side.** The *Public* columns are for **the public**: on a
  public board, a visitor who is not logged in, or who is logged in but not a
  member of the board, gets *Show on / Default on Public Board*. The board's
  own members get the *Private* columns, as on a private board
  (`boardViewAudience` in `models/lib/boardViewSettings.js`). So a public
  board can open read-only in, for example, **Version Control** or **Email**
  for the world and offer the world only those two views in its Board View
  menu, while its members keep every view. Any view can be the public
  default: Version Control, Email, Chat, Roadmap and the others. A visitor
  can not write: every view draws its controls for the person's rights,
  and the server refuses a write without them.
- **A website at the board's address.** With **Website** as the public
  default, a visitor of a public board sees the board as a website - its
  Published cards, Pages as the menu, the other cards as posts, the cards'
  attachments as their images and files - built from the board itself
  (`models/lib/websiteView.js`). A board imported from WordPress, Ghost,
  Blogger or a static site ([Website](Import-Export/Website/Website.md)) is
  laid out that way already; any board can be.
- **A shop at the board's address.** With **Shop** as the public default -
  ticked in Board Settings / Shop as *Show the Shop instead of the public
  board*, or chosen here - a visitor of a public board sees the products on
  its cards as a web shop and orders them
  ([Shop](../../Board-Header/Board-Views/Shop.md)). A public board opens in
  one view, so the Shop and the Website replace each other there.
- **The Board View menu** (`boardChangeViewPopup`) is rendered from the
  board: `boardViewMenuEntries` gives it the views whose *Show* box is ticked
  for the side that applies to the person looking (above), in the board's
  order, each with the `js-open-<view>-view` class
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

### Data model and setters

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

### REST API

The same settings over HTTP, for scripts and integrations:
`GET /api/boards/:boardId/boardViewSettings` (board access) answers
`boardViewSettings`, `defaultPublicBoardView`, `defaultPrivateBoardView`,
`boardViewOrder` and `keys` in the normalised shape the menu renders with, and
`PUT /api/boards/:boardId/boardViewSettings` (board admin) accepts any subset
of the first four, through the same pure modifiers the popup applies
(`boardViewSettingsRequest()` in `models/lib/boardViewSettings.js`): a default
is always shown, hiding a side's default is a `400`, an unknown view key is a
`400`, and the order is normalised. Both are documented with `curl` examples in
[REST-API.md, Board Settings: Board View](../../../API/REST-API.md#board-settings-board-view)
and in the generated OpenAPI spec (`get_board_view_settings`,
`update_board_view_settings`).

### Scrum support design

See the [source audit and Scrum implementation design](../../Board-Header/Board-Views/Scrum/Scrum-Design.md)
for existing capabilities, missing sprint features, menu placement, optional
fields and import/export/sync requirements. This is planned work, not a list of
features already shipped.

## Commits

 - [Twelve Board View reports: Created vs. Resolved, Net Flow, Time in List, Average Age, Throughput Run, Due Date ](https://github.com/wekan/wekan/commit/63b5e089f5113960f22fc3d72e3dce3ae86981e2)
 - [Board View menu and the Import and Export lists are grouped under headings](https://github.com/wekan/wekan/commit/257835733b0ec5d950fac6feb2e13c589219bb9d)
 - [A visitor's Scrum board view opens as chosen, not as Swimlanes](https://github.com/wekan/wekan/commit/a896f3ed8c0dc7741b158c3d6d58ff59ffbb6be2)
 - [Board View / Version Control, issue files and synced issue details](https://github.com/wekan/wekan/commit/326d9bbf619ed811e9db92896a67f0ea6fa60b24)
 - [Board views Email and Chat](https://github.com/wekan/wekan/commit/ddb33d21d05fb6ce47cd9a899407319a82fb6753)
 - [Add Calendar Mode to the Board View menu, below Calendar: Trello's calendar](https://github.com/wekan/wekan/commit/f133ddbba163dacb53077457a44428d3a8e81796)
 - [Remember the board view per board](https://github.com/wekan/wekan/commit/80fb317fda1b069562b76263dc135007d4104c6e)
 - [Reorder Board Settings / Card and Board View rows by drag and drop](https://github.com/wekan/wekan/commit/2d80e6e4ee4afec3dff380e53fa90f419af450f2)
 - [Add a Map board view: cards as markers on an uploaded image](https://github.com/wekan/wekan/commit/3d891ace09d88fa6723ef556c343fdcfeb72e87b)
 - [Board View: the default menu order is the order it had before views became orderable](https://github.com/wekan/wekan/commit/bbe8b40d903c516491c45c69d3b220415dfd2b32)
 - [Board Settings / Board View: reorder the Board View menu with up/down arrows](https://github.com/wekan/wekan/commit/82646e4bc0f891ed044bdc5c6cf910cd8dd4a4ea)
 - [Add REST API for Board Settings / Board View, and OpenAPI blocks for the card settings routes](https://github.com/wekan/wekan/commit/c64d3454ac625f8c16d267decad88a9113417659)
 - [Board Settings / Board View: which views a public or private board offers, and which one it opens in](https://github.com/wekan/wekan/commit/349c7490e72f93b4e692ff1ff22c7f0eda2431da)
 - [Add the Timeline board view (read-only history + restore to a past state)](https://github.com/wekan/wekan/commit/12cd826c37717682aac58e1bb98f062a000acb50)
 - [Add a Roadmap board view grouping cards by a custom field into timeline rows (#627)](https://github.com/wekan/wekan/commit/784a249331b98cc617bc7f00ca87ad2d28afd2c7)
 - [Add a "Pulse" board view charting daily board activity, GitHub-Pulse-style](https://github.com/wekan/wekan/commit/2d8fb6070af0229b398f2aeed71b204c7494eb32)
 - [Add a "Multi Board Calendar" board view (#2469)](https://github.com/wekan/wekan/commit/0c15b56f6e3db5b52e43ceaf238dfac30ab7fb6d)
 - [Register the Bigboard view's templates and add its regression test](https://github.com/wekan/wekan/commit/8c7345ace67d9bf7b3d8b6965bbc3e06d64d2719)
 - [Add a "Group by Assignee" board view for team-meeting-friendly overviews](https://github.com/wekan/wekan/commit/8dad0d0506f89e3c54ee98099c182bdec71acc5d)
 - [Give Frappe Gantt its own Board View page; add DHTMLX Gantt](https://github.com/wekan/wekan/commit/e5e4c97154f5ecf940958504c65f1159cf0b7165)
 - [Group the Board View menu with separators and mark unfinished views](https://github.com/wekan/wekan/commit/14136a5b0c6aaff80964bbe62d385c4e8925ab43)
 - [Reorder the Board View menu and add its not-yet-built views](https://github.com/wekan/wekan/commit/876b0a2c12edffcff323900a2f50807816cfabf6)
