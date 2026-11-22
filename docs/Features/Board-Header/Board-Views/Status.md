# Board view: Statistics (Tilastot)

Status: **Implemented** · Owner: xet7 · Related:
`client/components/boards/statsView.jade` / `.js` / `.css`,
`client/components/boards/boardHeader.*` (view switcher),
`client/components/boards/boardBody.*` (view rendering),
`server/publications/boards.js` (`boardStatus` method).

## What it is

**Statistics** is a full-width board **view** — alongside Swimlanes, Lists, Calendar,
Gantt and Table in the board-view switcher (the caret menu in the board header). It
shows the board's status at a glance and renders full width like the other board
views (Finnish: **Tilastot**): how the board's cards are loaded, and how many
swimlanes, lists, cards, labels, members and custom fields it has. It replaced the
earlier Status popup.

## Read more

- [Descriptive statistics](https://en.wikipedia.org/wiki/Descriptive_statistics)
  at Wikipedia - counts that summarize a set of data.
- [Lazy loading](https://en.wikipedia.org/wiki/Lazy_loading) at Wikipedia - the
  card-loading mode the view reports.
- WeKan:
  [Admin Panel / Problems / Performance → card loading (automatic/adaptive)](../../Admin-Panel/Problems/Performance.md),
  [Problems](../../Admin-Panel/Problems/README.md),
  [Time view](Time-View.md) (the time spent summary),
  [Members and permissions](../../Board-Sidebar/Members/Members.md),
  [Swimlanes](../../Swimlanes/Swimlanes.md) · [Lists](../../Lists/Lists.md) ·
  [Cards](../../Cards/Cards.md) · [Custom fields](../../Cards/CustomFields/CustomFields.md).

## How to use it

1. Open a board.
2. Click the **Board View** button in the board header (it shows the current
   view's name and a caret) → **Statistics**, in the menu's **Overview** group.
3. The board's title is at the top, and under **Board status** a table of:
   - **Card loading** — the card-loading mode in effect for *this* board: `Lazy (only
     visible cards)` or `All cards`, and, when the instance uses the adaptive default,
     that it was chosen automatically (`(Automatic (lazy only for big boards))`). See
     [Problems / Performance](../../Admin-Panel/Problems/README.md) — big boards load
     lazily, small boards eagerly.
   - **Swimlanes / Lists / Cards / Archived cards / Labels / Members / Custom fields** —
     the board's current counts.
4. Select any value with the mouse (drag) or on touch (long-press) and copy it.

The **Time spent summary** (total time spent, cards with time spent, overtime
cards) that this view used to show is now in its own [Time](Time-View.md) board
view.

**Usability**

- Full width, like the other board views. Its text is **selectable** with the mouse
  (drag) and on touch (long-press), so any value (e.g. a count or the total hours) can
  be highlighted and copied — the view stops pointer/touch events from reaching the
  board canvas's drag-to-scroll so native selection works.
- Read-only: opening it never changes the board.
- A site admin can turn it off with "Overview views" in
  [Admin Panel → Settings → Features](../../Admin-Panel/Settings/Features.md).

## How the numbers are calculated

All from the `boardStatus(boardId)` method in
[server/publications/boards.js](../../../../server/publications/boards.js):

- **Cards** = the number of cards that are not archived on this board, plus on
  the board's subtasks board when you can see that board.
- **Archived cards** = the same, for archived cards.
- For a member whose role sees only the cards assigned to them, both counts are
  only the cards assigned to that member.
- **Swimlanes** and **Lists** = the board's swimlanes and lists that are not
  archived.
- **Labels** = all the board's labels.
- **Members** = the board's members that are active (`isActive` is not false).
- **Custom fields** = the custom fields attached to this board.
- **Card loading**: the instance's mode comes from the `cardsLoading` setting
  (`all`, `lazy`, or `auto`, the default). `lazy` is always lazy, `all` never;
  with `auto` the board is lazy when its **Cards** count is over the threshold:
  `cardsLoadingLazyThreshold`, default **500**
  ([models/lib/cardsLoading.js](../../../../models/lib/cardsLoading.js)
  `effectiveBoardCardsMode`). Operators set them with the `CARDS_LOADING` and
  `CARDS_LOADING_LAZY_THRESHOLD` environment variables.
- While the answer is loading, each value shows `…`.

The method still also returns the time summary the [Time view](Time-View.md)
shows: the sum of `spentTime` over the active cards that have any, how many such
cards there are, and how many are flagged overtime.

## How it works in WeKan

**Why the counts are computed on the server.** The counts come from a single
`boardStatus(boardId)` Meteor method, not from the browser's local data. This
matters because of adaptive card loading: on a big board in lazy mode the
client's minimongo only holds the **visible window** of cards, so counting
locally would be wrong. The method counts on the server with `countAsync()`
(and, for the time summary, fetches only cards that actually have
`spentTime > 0`, so it stays cheap even on a large board). Any member who can
see the board can open it: the method checks `board.isVisibleBy`.

- **View**:
  [client/components/boards/statsView.jade](../../../../client/components/boards/statsView.jade),
  [.js](../../../../client/components/boards/statsView.js) and
  [.css](../../../../client/components/boards/statsView.css). Its stylesheet is
  shared by the other text views (Time, Group by Assignee, Timeline).
- **Server**: `boardStatus` in
  [server/publications/boards.js](../../../../server/publications/boards.js),
  using `assignedOnlyCardScope` from
  [models/lib/boardCardScope.js](../../../../models/lib/boardCardScope.js).
- **Menu and feature switch**: `board-view-stats` in
  [models/lib/boardViewSettings.js](../../../../models/lib/boardViewSettings.js),
  feature `views-overview` in
  [models/lib/instanceFeatures.js](../../../../models/lib/instanceFeatures.js).
- **Tests**:
  [tests/boardViewFullWidth.test.cjs](../../../../tests/boardViewFullWidth.test.cjs),
  [tests/boardViewMenu.test.cjs](../../../../tests/boardViewMenu.test.cjs),
  [tests/cardsLoading.test.cjs](../../../../tests/cardsLoading.test.cjs).

## Commits

 - [Optional features: a site admin can turn the overview views off](https://github.com/wekan/wekan/commit/18d57b2b8f789b11409afbd485cff139adeb3095)
 - [Full available width for the shared board report views](https://github.com/wekan/wekan/commit/fda197bb00afe0daa345c2c61bdc9280628412f6)
 - [The Statistics view test follows the Time view split](https://github.com/wekan/wekan/commit/5abcb5f2f29f686a610b41fd66644640ff375f8d)
 - [The time spent summary moves to its own Time view](https://github.com/wekan/wekan/commit/876b0a2c12edffcff323900a2f50807816cfabf6)
 - [The font size setting scales the Statistics view too](https://github.com/wekan/wekan/commit/d5b69137cc3090e5b0ca503d1a516b6518d401c7)
 - [The Statistics board view replaces the Status popup](https://github.com/wekan/wekan/commit/3aefa94a66dd9542e690bccd5aedac73d8a50c11)
