# Design: the Public Boards page

`/public` lists the boards anybody may open. It is a **table page**: everything
about its layout, its controls and its paging is defined once in
[the Table page design](Table.md), and this page describes only what is different
about this one.

## What it is not

`/public` used to render `boardList`, the All Boards page, with its query swapped
for `{ permission: 'public' }`. That brought the whole of All Boards with it —
the Starred / Templates / Remaining menu, the workspaces tree, the org and team
filters, Multi-Selection with its archive and duplicate actions, the sort popup,
board dragging, the "Add board" tile — none of which means anything for a list of
somebody else's public boards. Multi-Selection offered to archive boards the user
has no rights to; "Add board" created a private board from a page about public
ones; the left menu's counts were of the user's own boards, next to a grid that
was not.

So the page is **only the table**. There is no left menu, no create action, no
selection, no drag, and nothing on it changes anything.

It supplies **no title** to the shared table page, because the route already
renders one: `boardListHeaderBar`'s `h1` says "Public" above it. The shared page
prints a title only when it is given one, for exactly this reason — the Admin
Panel panes supply none either, since their heading comes from the active left
menu entry.

## Read-only

The only thing a row does is **open its board**. There is no starring, no
archiving, no editing, and no per-row menu — a visitor to this page is looking at
boards that are not theirs.

It still supplies a `rowTemplate`, because a row is a link and carries its board's
colours (see below), which a text-cell column spec cannot express. "Read-only"
here is about what the page can CHANGE, not about whether its rows are plain text:
the row template renders one anchor and no control.

## The rows look like the board tiles

A board on All Boards is recognised by its colour or its background image before
its title is read, and that is worth keeping — it is the same board. So each row
carries the board's `colorClass` and, when it has one, its `backgroundImageURL`,
exactly as the All Boards tile does (#5157). The table's own borders and spacing
are unchanged; only the row's background comes from the board.

The colours themselves are **not** redefined here. `boardColors.css` already
holds one declaration per board colour, and `.public-board-row.board-color-…` was
added to each of those existing selector lists — the same declaration, one more
selector — so the rows follow the board colours and the theme without a single
hex value being repeated.

A board with **no** colour matches none of those rules, so the row needs a
default background of its own: without one it keeps the table's white background,
and with the light text on top that is white on white — only the row's emoji is
visible. The All Boards tile has the same problem and answers it the same way,
with a grey fallback under its white text.

## Columns

Two:

| Column | What it is |
| --- | --- |
| Board | The board title. It is the link: the row opens this board. |
| Description | The board description. |

A board with no description gets an empty cell, never the string `undefined` —
the shared table's rule.

The board tile on All Boards shows more than this — member avatars, each list
with its card count, a spent-time clock — and none of it is here. Two reasons,
and they point the same way. What a visitor needs of a board they do not belong
to is what it is called and what it is for; who is in it and how many cards are
in each list is the inside of a board they have not opened. And each of those
costs a query the page would otherwise not make: the avatars and list counts come
from a per-board tile-data method, and the clock answers by looking for cards,
which this page does not publish at all — it would read `false` for every board
on every instance.

## Paging, and how little is sent

Ten boards per page, which is the shared `TABLE_PAGE_ROWS_PER_PAGE`, and the
paging is server-side like every other table page: the `publicBoards` publication
sends one page and `getPublicBoardsCount` answers the total. The client never
holds the whole set.

And a page sends **six fields per board**, not a board. A board document carries
its members, its labels, its subtask and card settings, every `allows*` flag and
its whole background configuration; this page draws two columns. So the
publication names exactly what a row needs:

| Field | Why |
| --- | --- |
| `title` | the Board column |
| `description` | the Description column |
| `slug` | the link the row is |
| `color`, `backgroundImageURL` | the row's own colours (see above) |

`members` is the one worth naming as absent: it is the largest field on a busy
board, and this page shows no avatars.

The search box searches board **titles**, on Enter, like every table page.

## What the page may show

Only boards that are:

- `permission: 'public'`,
- not archived,
- `type: 'board'` — not a template container,
- and not an internal helper board (`^Subtasks^`), which
  `models/lib/helperBoards.js` excludes for every board list.

The publication resolves that itself. It does not take a selector from the
client, and it needs no login: a public board is public.

## Related files

Only what is specific to this page; everything shared is in
[Table.md's own list](Table.md#related-files).

| File Path | File Type | Description |
| --- | --- | --- |
| `client/components/boards/publicBoards.jade` | `.jade` template | The pane (it renders the shared table page) and its `publicBoardRow` row template. |
| `client/components/boards/publicBoards.js` | `.js` Blaze template logic | The column spec, the paging state, the subscription and the row-click handler. |
| `client/components/boards/publicBoards.css` | `.css` stylesheet | Only the row's board colouring and its background image. The table itself is styled by `tablePage.css`. |
| `server/publications/boards.js` | `.js` publication + method | `publicBoards` (one page) and `getPublicBoardsCount` (the total). |
| `config/router.js` | `.js` routes | `/public` renders this pane instead of `boardList`. |
| `tests/publicBoardsPage.test.cjs` | `.cjs` Node test | That the page is the shared table, is read-only, carries none of the All Boards chrome, pages ten at a time on the server, and shows only public non-helper boards. |

## Related

- [The Table page design](Table.md) — everything shared
- [Left menu](Left-Menu.md)
