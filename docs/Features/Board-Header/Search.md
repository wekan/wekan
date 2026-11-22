# Design: Search

## What it is

Search is a **header-bar button that opens the right sidebar** on its search
view. On a board it finds the cards and lists of that board whose text contains
what you typed, and shows each card found on the board itself. On All Boards it
narrows the list of your boards to those whose title contains the text. Both
pages use the same idea - a button in the first header bar that opens a search
field in the sidebar - so Search looks and behaves the same everywhere.

## Read more

- [Full-text search](https://en.wikipedia.org/wiki/Full-text_search) on
  Wikipedia - searching the text of documents, here cards.
- [Regular expression](https://en.wikipedia.org/wiki/Regular_expression) on
  Wikipedia - board search escapes every special character, so what you type is
  matched literally, never as a pattern.
- [Filter](../Board-Sidebar/Filter/README.md) - the other way to narrow a board.
- [All Boards](../All-Boards/All-Boards.md) and
  [Multi-Selection](../General/Multi-Selection.md) - the other control the board
  header and All Boards share.

## How to use it

**Search a board.**

1. Open a board.
2. Click **Search** (`fa-search`) in the header bar. The right sidebar opens on
   its search view.
3. Type in the field (its placeholder is *Write text you search and press
   Enter*) and press **Enter**.
4. The sidebar lists the matching **Lists** and **Cards**, and the first card
   found opens and is shown on the board. A line *1 of 5 - press Enter for the
   next* appears under the field.
5. Press **Enter** again for the next card, or **Shift+Enter** for the previous
   one; the arrows beside the count do the same. Stepping wraps round from the
   last card to the first.
6. Click a card or a list in the sidebar to show it on the board. On a phone a
   card opens as a popup instead.
7. Click **Search** again to close the sidebar.

**Search All Boards.**

1. Open All Boards.
2. Click **Search boards** in the header bar. The All Boards sidebar opens on
   its search view, with the cursor in the field.
3. Type. The board list behind the sidebar narrows as you type.
4. Press **Escape** to clear the field, or click **Clear filter**. Escape in an
   already empty field closes the sidebar.

## How the numbers are calculated

- **The count** in *N of M - press Enter for the next*: M is the number of cards
  `Board.searchCards()` returns for the term, N is the card you have stepped to
  (0 before the first step). The next step from N is
  `((N - 1 + direction + M) % M) + 1`, so it wraps round
  (`step()` in
  [client/components/sidebar/sidebarSearches.js](../../../client/components/sidebar/sidebarSearches.js)).
- **Order of the results**: newest card and newest list first
  (`sort: { createdAt: -1 }` in `searchCards` and `searchLists`,
  [models/boards.js](../../../models/boards.js)).
- **Limits**: the term is trimmed; an empty term searches nothing. The server
  search of comments, checklists and attachments
  ([server/publications/boardTextMatches.js](../../../server/publications/boardTextMatches.js))
  refuses a term longer than 512 characters and reads the board's cards in
  batches of 250 ([server/lib/boardTextSearch.js](../../../server/lib/boardTextSearch.js)).
- **A number** typed as the term (a comma accepted as the decimal separator)
  also matches number and currency custom fields by value, and a card key such
  as `KEY-7` matches the card with that number on a board whose key is `KEY`
  (`buildCardSearchOr` in
  [models/lib/cardSearch.js](../../../models/lib/cardSearch.js)).

## How it works in WeKan

### The control

| | Board | All Boards |
| --- | --- | --- |
| Template | `boardHeaderButtons` in `client/components/boards/boardHeader.jade` | `allBoardsHeaderButtons` in `client/components/boards/boardsList.jade` |
| Class | `a.board-header-btn.js-open-search-view` | `a.board-header-btn.js-all-boards-sidebar-search` |
| Icon | `fa-search` | `fa-search` |
| Label | `{{_ 'search'}}` (Search) | `{{_ 'search-boards'}}` (Search boards) |

Each page draws its own button. They were once one shared template
(`headerSearchButton`), included in both header bars; the board's button is now
part of the board's own controls and All Boards has its own, so each has its
own handler:

| Page | The click | What is searched |
| --- | --- | --- |
| Board (Swimlanes, Lists, …) | `toggleSidebarView('search', false)` in `boardHeader.js`: opens the sidebar on the search view, and closes it when it is already showing that view | the cards and lists of that board |
| All Boards | `openAllBoardsSidebar(SIDEBAR_SEARCH)` in `boardsList.js` | your boards |

Whether a click opens or closes is decided by the pure
`sidebarViewButtonAction()` in
[models/lib/sidebarViewButton.js](../../../models/lib/sidebarViewButton.js).
Search always toggles; Filter stays open while a filter is on.

### Why a button and not a field

All Boards carried the search **input** in the header bar for a while, on the
reasoning that a filter belongs in the bar it filters. The reasoning was fine;
the result was that the two pages had different controls with the same name in
the same place, and only one of them behaved like the rest of WeKan. The button
is the shared answer.

The field did not disappear — it is what the sidebar's search view *is*. What
changed is where it lives and how you get to it.

### The All Boards search view

`allBoardsSearchSidebar`, in `client/components/boards/allBoardsSidebar.jade`.
It is an autofocused text input and a Clear row, and it writes into
`allBoardsSearchVar` — the page's **own** search term, not a copy — so the board
list behind the sidebar narrows as you type, exactly as the header-bar field
did. The Lists view and the Table view both read that term, so both filter; the
Lists view keeps the boards whose title contains the term, ignoring case.

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
> how it is themed is [All Boards](../All-Boards/All-Boards.md#where-it-sits): pinned below the
> header to the window bottom on a desktop, with the board icons moved left
> rather than covered; full width on a phone; and painted with a theme at both
> sizes, because a sidebar button is white text that needs a themed background
> under it.

### The board search view

`searchSidebar`, in `client/components/sidebar/sidebarSearches.jade` and
`client/components/sidebar/sidebarSearches.js`. It searches
`currentBoard.searchCards` / `searchLists` and renders minicards and minilists.

- **Lists** match on title or description.
- **Cards** match on title, description, custom-field values (text, and
  numbers by value), the card's key, the text of its comments, and - through the
  `boardTextMatches` publication - its checklists, checklist items and the text
  inside its attachments. The attachment text is never sent to the browser:
  the server sends only the ids of the cards that match
  (`client/lib/boardTextFilter.js`).
- The term is matched literally and case-insensitively (`literalSearchRegex`,
  #6822), so `C++` or `(2026)` find themselves instead of breaking the search.
- On a templates board only template cards and lists that are not archived are
  searched; on any other board, template cards and lists are left out.
- Showing a card or a list on the board is `revealOnBoard()` in
  `client/lib/revealOnBoard.js` (#2171).

## Related files

| File Path | File Type | Description |
| --- | --- | --- |
| `client/components/boards/allBoardsSidebar.jade` | `.jade` template | `allBoardsSearchSidebar`, the All Boards search view. |
| `client/components/boards/allBoardsSidebar.js` | `.js` Blaze template logic | Its handlers; writes the page's search term. |
| `client/lib/allBoardsView.js` | `.js` module | `allBoardsSearchVar`, the term the page filters by. |
| `client/components/sidebar/sidebarSearches.jade` | `.jade` template | The board's search view. |
| `client/components/sidebar/sidebarSearches.js` | `.js` Blaze template logic | The board's search view: the term, the count and the steps. |
| `client/components/boards/boardHeader.js` | `.js` Blaze template logic | The board's click handler. |
| `client/components/boards/boardsList.js` | `.js` Blaze template logic | The All Boards click handler. |
| `models/lib/sidebarViewButton.js` | `.js` pure module | Whether a click opens or closes the sidebar. |
| `models/lib/cardSearch.js` | `.js` pure module | The card search query: literal text, numbers, card keys, comments. |
| `server/publications/boardTextMatches.js` | `.js` publication | Cards whose comments, checklists or attachments match. |
| `tests/allBoardsPage.test.cjs` | `.cjs` Node test | That All Boards has the Search button and not a field, and that the sidebar view writes the page's term. |
| `tests/headerBars.test.cjs` | `.cjs` Node test | That the board draws Search itself and that it toggles the sidebar. |
| `tests/templateRegistration.test.cjs` | `.cjs` Node test | That every template a header bar includes is imported and defined. |
| `tests/cardSearch.test.cjs` | `.cjs` Node test | The card search query. |
| `tests/revealOnBoard.test.cjs` | `.cjs` Node test | Stepping to the next card and showing it on the board. |
| `tests/boardTextPublication.test.cjs` | `.cjs` Node test | The server search of comments, checklists and attachments. |
| `tests/playwright/specs/04-search.e2e.js` | Playwright spec | Searching a board in a browser. |

## Related

- [Multi-Selection](../General/Multi-Selection.md) — the other shared control
- [All Boards](../All-Boards/All-Boards.md)

## Commits

 - [Attachment text is searched too](https://github.com/wekan/wekan/commit/b335c5df0718e10f064706de293237926de196d1)
 - [Match the typed text, not a regular expression](https://github.com/wekan/wekan/commit/dad16609c9f94eaab3083d06b9a255412c01544d)
 - [One result highlighted at a time](https://github.com/wekan/wekan/commit/6c2edd67524bbb28304f38e04a32f3a00740d45a)
 - [Step back too: Shift+Enter and the arrows beside the count](https://github.com/wekan/wekan/commit/7dd484f8c21323581a52399b08418faad3200a48)
 - [Each card found is shown on the board, and Enter steps on](https://github.com/wekan/wekan/commit/c239177cd8c5291b316838722c1f2c1a7671ad92)
 - [Search checklists and comments on the server](https://github.com/wekan/wekan/commit/0bf2dc27be05b2b60f4b928c106df0236ccc8276)
 - [Match text inside card comments](https://github.com/wekan/wekan/commit/475f14c4a14874ceafa668aa7d23312cdafc3f4c)
 - [The Search button closes the panel it opened](https://github.com/wekan/wekan/commit/574c72370f2aca08abfd5d73b7b1af571be7d9db)
 - [All Boards: Search and Multi-Selection become header controls](https://github.com/wekan/wekan/commit/fcfed1fd3721ae9cee271adf12d8a96d860f824c)
 - [Find numbers in number and currency custom fields](https://github.com/wekan/wekan/commit/001c258f967caa502bf1d1ebb147b8506596f4bf)
 - [On a phone, a card found opens as a popup](https://github.com/wekan/wekan/commit/ddc229dabe393c020c28a04c18250672e2cc0cd2)
 - [A card found opens as a popup](https://github.com/wekan/wekan/commit/4936e580fd997b8b1f6ab2854d2bd413f110f013)
