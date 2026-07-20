# Board view: Statistics (Tilastot)

Status: **Implemented** · Owner: xet7 · Related:
`client/components/boards/statsView.jade` / `.js` / `.css`,
`client/components/boards/boardHeader.*` (view switcher),
`client/components/boards/boardBody.*` (view rendering),
`server/publications/boards.js` (`boardStatus` method).

**Statistics** is a full-width board **view** — alongside Swimlanes, Lists, Calendar,
Gantt and Table in the board-view switcher (the caret menu in the board header). It
shows the board's status at a glance and renders full width like the other board
views (Finnish: **Tilastot**).

## What it shows

- **Card loading** — the card-loading mode in effect for *this* board: `Lazy (only
  visible cards)` or `All cards`, and, when the instance uses the adaptive default,
  that it was chosen automatically (`(Automatic …)`). See
  [Admin Panel](../../Admin-Panel/Admin-Panel.md) — big boards load lazily, small
  boards eagerly.
- **Swimlanes / Lists / Cards / Archived cards / Labels / Members / Custom fields** —
  the board's current counts.
- **Time spent summary** (in the style of the general task time reports):
  - **Total time spent** — the sum of every active card's `spentTime` (hours).
  - **Cards with time spent** — how many active cards have any time logged.
  - **Overtime cards** — how many active cards are flagged overtime.

## Why the counts are computed on the server

The counts come from a single `boardStatus(boardId)` Meteor method, not from the
browser's local data. This matters because of adaptive card loading: on a big board in
lazy mode the client's minimongo only holds the **visible window** of cards, so
counting locally would be wrong. The method counts on the server with `countAsync()`
(and, for the time summary, fetches only cards that actually have `spentTime > 0`, so
it stays cheap even on a large board). Any member who can see the board can open it.

## Usability

- Full width, like the other board views. Its text is **selectable** with the mouse
  (drag) and on touch (long-press), so any value (e.g. a count or the total hours) can
  be highlighted and copied — the view stops pointer/touch events from reaching the
  board canvas's drag-to-scroll so native selection works.
- Read-only: opening it never changes the board.

## Related

- [Admin Panel → Card loading (automatic/adaptive)](../../Admin-Panel/Admin-Panel.md)
- [Members and permissions](../../Members/Members.md)
- [Swimlanes](../Swimlanes.md) · [Lists](../../Lists/Lists.md) ·
  [Cards](../../Cards/Cards.md) · [Custom fields](../../Cards/CustomFields/CustomFields.md)
