# Design: Boards in Archive

## What it is

The **Archive** is where archived boards are kept until they are restored or,
by a Global Admin, deleted for good. Archiving a board hides it from every
board list without deleting anything; restoring it brings it back as it was.
It is a section of All Boards, `/allboards/archive`, with its own search and
pager, and a board can be dragged onto it to archive it.

## Read more

- [Archive](https://en.wikipedia.org/wiki/Archive) on Wikipedia
- [Pagination](https://en.wikipedia.org/wiki/Pagination) - the server-side pager
- [Archive and Delete](../Board-Sidebar/Archive/Archive-and-Delete.md),
  [All Boards](README.md) and [Home](Home.md) in these docs

## How to use it

**Open the Archive**

1. Open **All Boards** and click **Archive** in the left menu - or, from a
   board, the member menu, the board sidebar or the All Boards sidebar, click
   **Archive** / **Boards in Archive**.
2. Type in the search field to find a board by its title.

**Archive a board**

1. On All Boards, drag the board's icon onto **Archive** in the left menu.
2. Confirm.

Or select boards with Multi-Selection and click **Move Board to Archive** in
the right sidebar.

**Restore a board**

1. Open the Archive.
2. Click **Restore Board** - the restored board opens - or drag the board onto
   **Remaining** or a workspace. A workspace drop restores the board and files
   it in that workspace.

**Delete boards permanently** (Global Admin)

1. In **Admin Panel / Settings / Delete**, check **Enable permanent delete for
   Global Admin**.
2. Open the Archive and turn on **Multi-Selection**.
3. Select the boards (**Select All** / **Select None** work on the icons shown).
4. Click the red **Delete** in the right sidebar and confirm.

## How the numbers are calculated

- **Rows per page** of the standalone `/archive` page: `TABLE_PAGE_ROWS_PER_PAGE`,
  **10** ([models/lib/tablePage.js](../../../models/lib/tablePage.js)).
- **Boards shown at once** in the All Boards Archive section:
  `ARCHIVED_BOARDS_LIMIT`, **60**
  ([client/components/boards/boardsList.js](../../../client/components/boards/boardsList.js)).
  The publication's own default, when no limit is passed, is 30.
- **The count beside the Archive row** is `getArchivedBoardsCount('')`, asked of
  the server: the number of boards that are archived, are not templates
  (`template-container` / `template-board`), and in which you are an active
  board admin. The same selector (`archivedBoardsSelector()` in
  [server/publications/boards.js](../../../server/publications/boards.js))
  decides what the Archive lists, so the count and the list agree. A search
  term is matched against the title, ignoring case, with special characters
  escaped.
- **Order**: newest `archivedAt` first, then newest `modifiedAt`.
- **Permanent delete** takes 1 to **200** boards at a time, and refuses the
  whole request if any of them is not archived
  (`permanentlyDeleteArchivedBoards` in
  [server/models/boards.js](../../../server/models/boards.js)).

## How it works in WeKan

`/archive` is a **page**, named in the first top header bar (**Boards in
Archive**, `archive: 'archived-boards'` in `models/lib/pageTitles.js`) like
every other page.

It was a modal — `Modal.open('archivedBoards')`, from three different menus — so
the one place that lists every archived board, with its own search and its own
pager, was a box floating over whatever you happened to be looking at. It had no
address, so it could not be linked to a colleague or bookmarked or opened in a
second tab; there was nothing to come back to; and Escape closed it while you
were reading. "Restore the board I archived last month" is a task, not a glance.

### Where it is reached from


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

### What the page is

`archivedBoards`, in `client/components/boards/boardArchive.jade` — the same
template the modal used, minus its own `h2`. A modal has no header bar to be
named in, so it drew its own title; on a page that is the title printed twice.
The first header bar names it once, where every other page is named. (It was
`archivedBoardsHeaderBar`, a second header bar of its own, until the second
bars that held only a title were removed.)

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
  visible only to a Global Admin while Admin Panel → Settings → Delete →
  Enable permanent delete for Global Admin is checked, is drawn as a red **Delete** button, and confirms that the selected
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

### Related files

| File Path | File Type | Description |
| --- | --- | --- |
| `config/router.js` | `.js` routes | The `/archive` route. |
| `client/components/boards/boardArchive.jade` | `.jade` template | `archivedBoards`. |
| `client/components/boards/boardArchive.js` | `.js` Blaze template logic | The search, the pager, restore and delete. |
| `tests/archivePage.test.cjs` | `.cjs` Node test | That it is a page, that nothing opens it as a modal, that all four entry points reach it, and that the search and paging survived the move. |

### Related

- [All Boards](README.md) — one of the four places it is reached from
- [The Table page design](../Table.md) — the rows-per-page it shares

## Commits

 - [Archive selection drops highlight only Remaining and the workspaces](https://github.com/wekan/wekan/commit/9be167742074966d6987e1ed3ded71ddf04864ef)
 - [Select all visible archived boards](https://github.com/wekan/wekan/commit/4c0f3b9416c2eafde482adec0be249be68218492)
 - [Permanent delete of archived boards needs the Global Admin flag](https://github.com/wekan/wekan/commit/2eb3e0d4b86e8b5ceb2181c80cb2f6be8406c789)
 - [Fix archived board deletion](https://github.com/wekan/wekan/commit/0aad02722cc77b65f3879e86951b9ddf5094233c)
 - [Permanently delete selected archived boards](https://github.com/wekan/wekan/commit/d3034d81ed4dea524f432c4db89aac35d6fa697a)
 - [Every Archive menu entry opens the All Boards section, not the full-width page](https://github.com/wekan/wekan/commit/cdb611340120d0c9f56e890a85fa2f1c3da0e4f8)
 - [The Archive is board icons, and a board comes back by dragging it](https://github.com/wekan/wekan/commit/27cfc214b5bb175db25c4ec6319510334142066c)
 - [The left menu says Archive](https://github.com/wekan/wekan/commit/81542cfaed8893bc7aabddde15edc509bd2c60c3)
 - [getArchivedBoardsCount checks its argument before answering anyone](https://github.com/wekan/wekan/commit/880f8ced93c241d2747aa2efcab90aee87bff163)
 - [The archive is a section of All Boards](https://github.com/wekan/wekan/commit/a05c1ac08a53bc83ea75ee5f836deb5227506085)
 - [Boards in Archive belongs in the All Boards left menu](https://github.com/wekan/wekan/commit/6d50d9d66b43f648094cf7a294018814115e6267)
 - [The page is named in the first header bar, not a second bar of its own](https://github.com/wekan/wekan/commit/9f42cb1aaa2ce2c670c908cacc762503c9237257)
 - [Boards in Archive is a page, not a modal](https://github.com/wekan/wekan/commit/09003f0172033067e8150d863a4d37c9ed083495)
 - [Server-side pagination and search of archived boards](https://github.com/wekan/wekan/commit/e205f6b7ac8ed22cb6d48b4aac2ca80bd34bbb3a)
 - [Restore and Delete buttons follow the theme colours](https://github.com/wekan/wekan/commit/4dc09c62b9719cbb3dd126420239f7d9da5bea55)
 - [Archive and restore a board](https://github.com/wekan/wekan/commit/48ac8b026ffdf8b3823c573e5693dcf1765383e2)
