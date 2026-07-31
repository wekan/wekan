# Design: Search

Search is a **header-bar button that opens the right sidebar** on its search
view. That is true on a board and on All Boards, and it is the *same button* in
both — one template, included twice.

## The control

| | |
| --- | --- |
| Template | `headerSearchButton` in `client/components/boards/boardHeader.jade` |
| Class | `a.board-header-btn.js-open-search-view` |
| Icon | `fa-search` |
| Label | `{{_ 'search'}}` |

It carries no handler of its own. A Blaze event map catches events from the
templates rendered inside it, so `Template.boardHeaderBar.events` sees the click
on the board's copy and `Template.boardListHeaderBar.events` sees the click on
the All Boards copy. That is what lets one piece of markup mean two things:

| Page | The click | What is searched |
| --- | --- | --- |
| Board (Swimlanes, Lists, …) | `Sidebar.setView('search')` | the cards and lists of that board |
| All Boards | `openAllBoardsSidebar(SIDEBAR_SEARCH)` | your boards |

## Why a button and not a field

All Boards carried the search **input** in the header bar for a while, on the
reasoning that a filter belongs in the bar it filters. The reasoning was fine;
the result was that the two pages had different controls with the same name in
the same place, and only one of them behaved like the rest of WeKan. The button
is the shared answer.

The field did not disappear — it is what the sidebar's search view *is*. What
changed is where it lives and how you get to it.

## The All Boards search view

`allBoardsSearchSidebar`, in `client/components/boards/allBoardsSidebar.jade`.
It is an autofocused text input and a Clear row, and it writes into
`allBoardsSearchVar` — the page's **own** search term, not a copy — so the board
list behind the sidebar narrows as you type, exactly as the header-bar field
did. The Lists view and the Table view both read that term, so both filter.

`Escape` in the field clears it when it has text, and only falls through to the
sidebar's own Escape when it is already empty: Escape on a search box means
"undo the search" before it means "close the panel".

The field is not styled by this page at all. `.sidebar .sidebar-content
input[type="text"]` in the board sidebar's stylesheet gives every sidebar input
its full-width look, and that stylesheet is loaded everywhere.

> A control that moves between templates takes its stylesheet with it or stops
> being styled at all, silently. `.boards-path-header .board-search` kept
> matching nothing for two commits while the box rendered at the browser's
> default input size.

> **The panel it opens in** is the All Boards sidebar, and where it sits and
> how it is themed is [All Boards](All-Boards.md#where-it-sits): pinned below the
> header to the window bottom on a desktop, with the board icons moved left
> rather than covered; full width on a phone; and painted with a theme at both
> sizes, because a sidebar button is white text that needs a themed background
> under it.

## The board search view

`searchSidebar`, in `client/components/sidebar/sidebarSearches.js` — unchanged.
It searches `currentBoard.searchCards` / `searchLists` and renders minicards and
minilists.

## Related files

| File Path | File Type | Description |
| --- | --- | --- |
| `client/components/boards/allBoardsSidebar.jade` | `.jade` template | `allBoardsSearchSidebar`, the All Boards search view. |
| `client/components/boards/allBoardsSidebar.js` | `.js` Blaze template logic | Its handlers; writes the page's search term. |
| `client/lib/allBoardsView.js` | `.js` module | `allBoardsSearchVar`, the term the page filters by. |
| `client/components/sidebar/sidebarSearches.js` | `.js` Blaze template logic | The board's search view. |
| `client/components/boards/boardHeader.js` | `.js` Blaze template logic | The board's click handler. |
| `client/components/boards/boardsList.js` | `.js` Blaze template logic | The All Boards click handler. |
| `tests/allBoardsPage.test.cjs` | `.cjs` Node test | That the bar has the button and not a field, and that the sidebar view writes the page's term. |
| `tests/templateRegistration.test.cjs` | `.cjs` Node test | That the shared template is imported and that both bars include it. |

## Related

- [Multi-Selection](Multi-Selection.md) — the other shared control
- [All Boards](All-Boards.md)
