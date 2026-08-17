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

All four go to **`/allboards/archive`** — the Archive **section** of All Boards,
the row in its left menu — built with `allBoardsPath(SECTION_ARCHIVE, [])` rather
than by spelling the path out in four places that can drift apart.

They used to go to `/archive`, the full-width page. That page is what the section
replaced: the same list of boards, but with no left menu beside it, so there was
no way across to Starred or Remaining without going back first, and the one row
in the menu that says "Archive" was not the row you had arrived at. A menu entry
should land you on the same Archive the menu itself offers.

`/archive` is still a route and still renders — a bookmark from before does not
break — but nothing in the UI points at it any more.

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
- **Restore** remains available without putting a destructive control on every
  board icon. There is no per-board trashcan, archive glyph or delete-looking
  hover control at the lower-left of an archived tile; its archived date
  remains plain text inside the tile.
- **Permanent delete** is a multi-selection action in the right sidebar. It is
  visible only to a Global Admin while Admin Panel → Problems → Delete is
  enabled, is drawn as a red **Delete** button, and confirms that the selected
  boards and their contents cannot be recovered. The server independently
  checks the administrator, setting, archived state and complete selection
  before removing anything. It validates the DDP argument before its first
  asynchronous lookup, as required by Meteor's argument auditor; malformed
  attempts are still recorded in Recovery after the actor lookup.
- Like Remaining, Starred and Templates, while Multi-Selection is active the
  Archive shows **Select All** and **Select None** in the right page above its
  board icons. They check or uncheck exactly the icons currently shown by the
  section and its search filter. Home has the same controls; Select All checks
  its one visible Home board when there is one.
- Dragging an archived multi-selection highlights only valid destinations in
  green: **Remaining** and every existing **Workspace**. Home is neither
  highlighted nor accepted, because an archived board cannot be the board
  opened after login. A Workspace drop restores each board and assigns it to
  that Workspace.

Restoring navigates to the restored board. A successful permanent delete clears
the selection; a refused one leaves it selected so the administrator can correct
the setting or selection and retry.

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
