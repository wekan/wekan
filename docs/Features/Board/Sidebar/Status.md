# Board Settings → Status

Status: **Implemented** · Owner: xet7 · Related: `client/components/sidebar/sidebar.js`
(`boardStatusPopup`), `client/components/sidebar/sidebar.jade`,
`server/publications/boards.js` (`boardStatus` method).

A read-only **Status** popup for a board, reached from the **board right sidebar →
Board menu (cog) → Board status**. It gives a quick, at-a-glance summary of the board:
how it loads, how big it is, and how much time has been logged on it.

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

- The popup is intentionally **larger** than a normal WeKan pop-over and its text is
  **selectable** with the mouse, so any value (e.g. a count or the total hours) can be
  highlighted and copied.
- It is read-only: opening it never changes the board.

## Related

- [Admin Panel → Card loading (automatic/adaptive)](../../Admin-Panel/Admin-Panel.md)
- [Members and permissions](../../Members/Members.md)
- [Swimlanes](../../Swimlanes.md) · [Lists](../../Lists/Lists.md) ·
  [Cards](../../Cards/Cards.md) · [Custom fields](../../CustomFields/CustomFields.md)
