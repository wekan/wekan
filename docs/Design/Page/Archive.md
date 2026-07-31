# Design: Boards in Archive

`/archive` is a **page**, with the same second top header bar as every other
page.

It was a modal — `Modal.open('archivedBoards')`, from three different menus — so
the one place that lists every archived board, with its own search and its own
pager, was a box floating over whatever you happened to be looking at. It had no
address, so it could not be linked to a colleague or bookmarked or opened in a
second tab; there was nothing to come back to; and Escape closed it while you
were reading. "Restore the board I archived last month" is a task, not a glance.

## Where it is reached from

| From | Control |
| --- | --- |
| The board menu | `js-open-archived-board` in `boardHeader.js` |
| The member menu | the same class, in `userHeader.js` |
| The board sidebar | the same class, in `sidebar.js` |
| The All Boards sidebar | the same class, in its home view |

All four `FlowRouter.go('archive')` — by route **name**, so the path is spelled
out once, in the router, rather than in four places that can drift apart.

The All Boards one had no handler at all. It was drawn, and clicking it did
nothing: the handler it relied on lived in the header bar's events map, and went
when that map was rewritten for the sidebar. A Blaze event map only sees events
inside its own template, and the button had moved out of it.

## What the page is

`archivedBoards`, in `client/components/boards/boardArchive.jade` — the same
template the modal used, minus its own `h2`. A modal has no header bar to be
named in, so it drew its own title; on a page that is the title printed twice.
`archivedBoardsHeaderBar` names it once, where every other page is named.

It keeps what made it worth having:

- **Search**, over every archived board, not just the page you can see.
- **Server-side paging** — the subscription publishes one page at a time
  (`archivedBoards`, with a search term, a limit and a skip), so an instance
  with a long archive stays fast. The page size is the app's one
  `TABLE_PAGE_ROWS_PER_PAGE`.
- **Restore** and **Delete** per board, delete behind a confirm.

Restoring navigates to the restored board; deleting the last one you were on
goes home.

## Related files

| File Path | File Type | Description |
| --- | --- | --- |
| `config/router.js` | `.js` routes | The `/archive` route. |
| `client/components/boards/boardArchive.jade` | `.jade` template | `archivedBoardsHeaderBar` and `archivedBoards`. |
| `client/components/boards/boardArchive.js` | `.js` Blaze template logic | The search, the pager, restore and delete. |
| `tests/archivePage.test.cjs` | `.cjs` Node test | That it is a page, that nothing opens it as a modal, that all four entry points reach it, and that the search and paging survived the move. |

## Related

- [All Boards](All-Boards.md) — one of the four places it is reached from
- [The Table page design](Table.md) — the rows-per-page it shares
