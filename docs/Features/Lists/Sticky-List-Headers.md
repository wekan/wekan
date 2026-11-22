# List menu / Sticky list headers

## What it is

List menu (☰ in the list header) → **Sticky list headers** is a checkbox
([#3847](https://github.com/wekan/wekan/issues/3847)). It keeps each list's
header pinned at the top while the list's cards scroll under it, so you
always see which list you are in. It is in every list's menu, but it is a
**board-wide** setting: it applies to every list of the board, for everybody.

## Read more

- [CSS `position: sticky`](https://developer.mozilla.org/en-US/docs/Web/CSS/position)
  on MDN - how a sticky element stays in view while its container scrolls.
- WeKan: Board Settings → Swimlane → **One shared list header row** ([Board Settings / Swimlane](../Board-Sidebar/Board-Settings/Swimlane.md))
  is a related, separate board setting.

## How to use it

Who sees it: a board member who is not **Comment only**, **Read only** or
**Read assigned only**. Changing it requires write access to the board; a
member without it is refused.

1. Click ☰ (**List Actions**) in the list header.
2. Under **Settings**, click **Sticky list headers**. The menu closes after
   the click.
3. Click it again to turn it off.

What it changes:

- On: `board.stickyListHeaders` is `true`, every list gets the
  `list-sticky-header` class, and the list header stays pinned at the top
  while the list's cards scroll under it (`client/components/lists/list.css`).
- Off (the default): the header is not pinned.

The header's content does not change.

## How the numbers are calculated

This feature has no numbers of its own; its only value is the board's
`stickyListHeaders` true/false, `false` by default.

## How it works in WeKan

- The checkbox is `a.js-toggle-sticky-list-headers` in
  [client/components/lists/listHeader.jade](../../../client/components/lists/listHeader.jade);
  the click handler in [listHeader.js](../../../client/components/lists/listHeader.js)
  calls the `setStickyListHeaders` server method
  ([server/models/users.js](../../../server/models/users.js)), which checks
  `memberCan(board.members, userId, 'write')` and sets
  `board.stickyListHeaders`.
- The field is `stickyListHeaders` in [models/boards.js](../../../models/boards.js)
  (`getStickyListHeaders()`); the pinning is CSS in
  [client/components/lists/list.css](../../../client/components/lists/list.css).
- Tests: [tests/stickyListHeaders.test.cjs](../../../tests/stickyListHeaders.test.cjs),
  [tests/stickyListHeadersSwimlanesView.test.cjs](../../../tests/stickyListHeadersSwimlanesView.test.cjs).

## Commits

 - [the sticky list headers test follows the write-access rule](https://github.com/wekan/wekan/commit/5de71ba789d12c0d945da30102f6ed7b71c47762)
 - [sticky list headers stay pinned while scrolling in the Swimlanes view](https://github.com/wekan/wekan/commit/520b9f56fce6e74c4847d050b0b3de8921f68c13)
 - [regression coverage for the board-wide toggle](https://github.com/wekan/wekan/commit/d3e0c591ad9280494c22696dded01ac4625308b7)
 - [a board-wide sticky list headers toggle in the list menu](https://github.com/wekan/wekan/commit/5605e08dd9515a7a000d08a92bc848dfdd6bd934)
