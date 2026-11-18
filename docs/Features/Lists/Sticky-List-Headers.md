# List menu / Sticky list headers

List menu (☰ in the list header) → **Sticky list headers** is a checkbox
([#3847](https://github.com/wekan/wekan/issues/3847)). It is in every list's
menu, but it is a **board-wide** setting: it applies to every list of the
board, for everybody.

## Who sees it

A board member who is not **Comment only**, **Read only** or **Read assigned
only**. Changing it calls the `setStickyListHeaders` server method
(`server/models/users.js`), which requires write access to the board; a
member without it is refused.

## What it changes

- On: `board.stickyListHeaders` is `true`, every list gets the
  `list-sticky-header` class, and the list header stays pinned at the top
  while the list's cards scroll under it (`client/components/lists/list.css`).
- Off (the default): the header is not pinned.

The header's content does not change. The menu closes after the click.
