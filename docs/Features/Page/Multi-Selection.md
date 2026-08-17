# Design: Multi-Selection

Multi-Selection is a **header-bar toggle that opens the right sidebar**, and the
sidebar is where the things you can do to a selection live. That is true on a
board and on All Boards, and it is the *same button* in both — one template,
included twice.

## The control

| | |
| --- | --- |
| Template | `headerMultiSelectionButton` in `client/components/boards/boardHeader.jade` |
| Class | `a.board-header-btn.js-multiselection-activate` |
| Icon | `fa-check-square-o` |
| Label | `multi-selection`, or `multi-selection-on` while it is on |
| On state | `.emphasis` |
| Nested ✕ | `a.board-header-btn-close.js-multiselection-reset`, only while it is on |

`isActive` is **passed in**, because the two pages select different things and
so keep different selection objects:

| Page | Selection object | What is selected |
| --- | --- | --- |
| Board | `MultiSelection` (`client/lib/multiSelection.js`) | cards |
| All Boards | `BoardMultiSelection` (`client/lib/boardMultiSelection.js`) | boards |

Everything else — icon, label, on state, the nested ✕ — is one copy. It was two,
and they had already drifted: the ✕ said `filter-clear` ("Clear filter") on the
board header, which is what a different control does. It says
`multi-selection-off` in both now.

The nested ✕ must `stopPropagation()`: it sits *inside* the activate button, so
without it the click bubbles and immediately re-activates what it just turned
off.

## The All Boards multi-selection view

`allBoardsMultiSelectionSidebar`. Turning Multi-Selection on opens it; turning
it off closes it, because its only content is a panel of actions on a selection
that no longer exists. While the mode is on, the panel stays visible on its
Multi-Selection view: its close button, Escape, and the active header button
cannot hide it or replace it with another sidebar view.

The instruction (`multi-selection-active`, "Click checkboxes to select boards")
and every action available in the current section remain visible whether or not
a board is checked. Clicking a bulk action with an empty selection reports "You
did not select any boards" and performs no action. The way out is always
visible too.

Set as Home board is deliberately a single-board action. With zero or several
checked boards it reports "Please select only one board" and changes nothing,
because login can open only one Home board.
Dragging several selected boards onto Home follows the same rule and reports
the same message without clearing the selection or changing Home.

When a board or selection is dragged from Remaining, Starred and Archive join
the existing green targets. A Starred drop adds stars without removing the
boards from Remaining; an Archive drop uses the normal confirmation and moves
the boards into Archive.

In the Home section that action reads "Unset as Home board", because its one
visible board is already Home. Move Board to Archive and Duplicate Board are
not shown there; those actions remain available in the other live-board
sections.

While Multi-Selection is on, **Select All** and **Select None** sit above the
board icons in Remaining, Starred, Home, Templates and Archive. Select All uses
the exact section/search result being drawn, so it never checks a hidden board;
Select None clears the shared selection. Home uses the same controls even though
it contains at most one board, keeping Multi-Selection consistent across every
named board section.

| Row | Icon | What it does |
| --- | --- | --- |
| Star / Unstar | `fa-star` | A toggle over the whole selection — see below. |
| Set as Home board | `fa-home` | Makes the one selected board the Home board. |
| Move Board to Archive | `fa-archive` | Archives every selected board, after a confirm. |
| Duplicate Board | `fa-clipboard` | Copies every selected board, after a confirm. |
| Turn Multi-Selection off | `fa-times-thin` | Ends the selection and closes the panel. |

The two that only *mark* a board come first, the two that change what boards
exist come after a rule. These were four icon-only buttons crowded into the
header bar; as sidebar rows each has its name written beside it, which is what
the board does with its own selection actions.

### The star row is a toggle

It only ever *added* stars — it walked the selection and starred whatever was
not starred yet — so once every selected board was starred it did nothing at all
and there was no way to undo it.

| The selection | The click |
| --- | --- |
| none of them starred | stars all of them |
| some starred, some not | stars **the rest**, leaving the starred alone |
| all of them starred | **unstars** all of them |

So "star" is the action whenever there is anything left to star. The mixed case
deliberately does **not** flip each board independently: one click that starred
some boards and un-starred others is not something a button may do.

Only the boards that must *change* are called, because `toggleBoardStar` flips
one board — calling it for an already-starred board in the mixed case would
un-star it.

The row's label says which way it goes: `set-selected-starred` while any of them
is unstarred, `set-selected-unstarred` once they all are. Label and click read
**one** function, so they cannot disagree; the rule is
`models/lib/selectedStars.js`, which is pure and unit-tested.

> **The panel it opens in** is the All Boards sidebar, and where it sits and
> how it is themed is [All Boards](All-Boards.md#where-it-sits): pinned below the
> header to the window bottom on a desktop, with the board icons moved left
> rather than covered; full width on a phone; and painted with a theme at both
> sizes, because a sidebar button is white text that needs a themed background
> under it.

## The board multi-selection view

`multiselectionSidebar`, in `client/components/sidebar/sidebarFilters.jade` —
labels, members, and the board-admin actions (colour, copy, move, archive) for
the selected cards.

Archiving is one acknowledged server operation, not a fire-and-forget loop of
client collection updates. The client sends the current board ID and the ordered
selected card IDs to `archiveSelectedCards`, then waits. The server checks both
arguments before asynchronous work, requires write access, scopes every live
card to that board and validates the complete selection before archiving the
first card. Success closes Multi-Selection; failure shows the server error and
keeps the cards selected so the action can be retried.

## Related files

| File Path | File Type | Description |
| --- | --- | --- |
| `client/components/boards/allBoardsSidebar.jade` | `.jade` template | `allBoardsMultiSelectionSidebar`, the All Boards view. |
| `client/components/boards/allBoardsSidebar.js` | `.js` Blaze template logic | Its handlers: star, home, archive, duplicate, off. |
| `models/lib/selectedStars.js` | `.js` module, pure | Which way the star row goes and which boards it touches. No Meteor, so it is unit-testable. |
| `client/lib/boardMultiSelection.js` | `.js` module | The All Boards selection object. |
| `client/lib/multiSelection.js` | `.js` module | The board's selection object. |
| `client/components/sidebar/sidebarFilters.jade` | `.jade` template | The board's multi-selection view. |
| `server/models/cards.js` | `.js` methods | Validates and archives a selected card batch. |
| `tests/multiSelectionButton.test.cjs` | `.cjs` Node test | That the button is defined once and both bars include it, with their own `isActive`. |
| `tests/cardMultiSelectionArchive.test.cjs` | `.cjs` Node test | The acknowledged client action and server validation, including negative paths. |
| `tests/playwright/specs/03-cards-operations.e2e.js` | `.js` browser test | Selects a list, archives it and verifies two cards disappear. |
| `tests/selectedStars.test.cjs` | `.cjs` Node test | The star toggle's three cases, and that the click and the label ask one function. |

## Related

- [Search](Search.md) — the other shared control
- [All Boards](All-Boards.md)
