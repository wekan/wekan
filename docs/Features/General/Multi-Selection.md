# Design: Multi-Selection

## What it is

Multi-Selection lets you tick several cards on a board, or several boards on
All Boards, and then do one thing to all of them at once: set a label or a
member, change the colour, move, copy or archive cards; star, set as Home,
archive, duplicate or export boards. The actions are rows of the right sidebar.

## Read more

- [Selection (user interface)](https://en.wikipedia.org/wiki/Selection_(user_interface))
  and [Checkbox](https://en.wikipedia.org/wiki/Checkbox) on Wikipedia.
- WeKan pages: [Search](../Board-Header/Search.md),
  [All Boards](../All-Boards/All-Boards.md),
  [Keyboard shortcuts](Keyboard-Shortcuts/Keyboard-Shortcuts.md) (number keys
  add or remove labels on the selection).

## How to use it

**On a board** (needs permission to change the board):

1. Click **Multi-Selection** in the board header. The right sidebar opens on
   **What do you want to do?**
2. Tick the cards' checkboxes. Or, with a filter on, click **Filter to
   selection** in the Filter sidebar to select the cards the filter shows.
3. Choose an action: **Set label for selection**, **Set member for selection**,
   **Selection Color**, **Move selection**, **Copy selection** or **Move
   selection to Archive**.
4. Click the ✕ beside the header button, **Turn Multi-Selection off**, to end.

**On All Boards:**

1. Open the right sidebar (the hamburger) and click **Multi-Selection**.
2. Tick boards, or click **Select All** / **Select None** above the board icons.
3. Choose a row: **Star** / **Unstar**, **Set as Home board (opened after
   login)**, **Move Board to Archive**, **Duplicate Board**, **Export selected
   boards**.
4. Click **Turn Multi-Selection off** to end.

## How the numbers are calculated

Multi-Selection has no numbers of its own. The star row follows a three-case
rule (none, some or all of the selection starred) in
[models/lib/selectedStars.js](../../../models/lib/selectedStars.js), described
below. **Set as Home board** needs exactly one selected board. The number keys
`1`-`9` act on the selection with the board's labels in their board order.

## How it works in WeKan

Multi-Selection turns on a mode in which you tick several things and then act
on all of them at once, from the right sidebar. On a board it is a **header-bar
toggle** that selects cards; on All Boards it is a row of the All Boards right
sidebar that selects boards. Either way the sidebar is where the things you can
do to a selection live.

### The control

An older version of this page said the two were the *same button*, one
`headerMultiSelectionButton` template included twice. That template no longer
exists: the board draws its own button, and All Boards turns the mode on from
its sidebar.

| | Board | All Boards |
| --- | --- | --- |
| Where | `boardHeaderButtons` in `client/components/boards/boardHeader.jade`, only when `canModifyBoard` | `allBoardsHomeSidebar` in `client/components/boards/allBoardsSidebar.jade`, only when `canMultiSelectBoards` |
| Class | `a.board-header-btn.js-multiselection-activate` | `a.js-all-boards-sidebar-multiselection` |
| Icon | `fa-check-square-o` | `fa-check-square-o` |
| Label | `multi-selection` (title `multi-selection-on` while it is on) | `multi-selection` |
| On state | `.emphasis` | the sidebar stays on its Multi-Selection view |
| Way out | nested ✕ `a.board-header-btn-close.js-multiselection-reset`, only while it is on | the sidebar row `js-multiselection-reset` |

The two pages select different things and so keep different selection objects:

| Page | Selection object | What is selected |
| --- | --- | --- |
| Board | `MultiSelection` (`client/lib/multiSelection.js`) | cards |
| All Boards | `BoardMultiSelection` (`client/lib/boardMultiSelection.js`) | boards |

The ✕ once said `filter-clear` ("Clear filter") on the board header, which is
what a different control does. It says `multi-selection-off` ("Turn
Multi-Selection off") now.

The nested ✕ must `stopPropagation()`: it sits *inside* the activate button, so
without it the click bubbles and immediately re-activates what it just turned
off.

### The All Boards multi-selection view

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
| Duplicate Board | `fa-clipboard` | Opens a popup to choose which parts to copy (all ticked by default), then copies every selected board. Shown only when the user may create boards. |
| Export selected boards | `fa-download` | Downloads the selected boards in one chosen format. |
| Turn Multi-Selection off | `fa-times-thin` | Ends the selection and closes the panel. |

The two that only *mark* a board come first, the two that change what boards
exist come after a rule. These were four icon-only buttons crowded into the
header bar; as sidebar rows each has its name written beside it, which is what
the board does with its own selection actions.

#### The star row is a toggle

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
> how it is themed is [All Boards](../All-Boards/All-Boards.md#where-it-sits): pinned below the
> header to the window bottom on a desktop, with the board icons moved left
> rather than covered; full width on a phone; and painted with a theme at both
> sizes, because a sidebar button is white text that needs a themed background
> under it.

### The board multi-selection view

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

### Related files

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

### Related

- [Search](../Board-Header/Search.md) — the other shared control
- [All Boards](../All-Boards/All-Boards.md)

## Commits

 - [Pickers show the name without a number in front](https://github.com/wekan/wekan/commit/bc5bf3c25edef7063f5bbf706611944719e06473)
 - [Import and export many boards at once](https://github.com/wekan/wekan/commit/7858d84e127c2c6cd92134166352b9a4245d4ec2)
 - [Fix archived board deletion and bulk card archiving](https://github.com/wekan/wekan/commit/0aad02722cc77b65f3879e86951b9ddf5094233c)
 - [Duplicating boards moved into the selection actions](https://github.com/wekan/wekan/commit/5dbb9167fd686fa54b9836ad16236bae64564f5c)
 - [Set a custom card colour on all selected cards](https://github.com/wekan/wekan/commit/fdfa94321278b7d46eacec54340c7845d7efbd1e)
 - [Mixed multi-selection moves and collapsed drop targets](https://github.com/wekan/wekan/commit/b0c8acc987ff84e197215cf079085887a6829f1c)
 - [Fix multi-selection label and member popup actions](https://github.com/wekan/wekan/commit/059c3311deddadd0607cd4d34cf13d36d0b810bd)
 - [Turn Multi-Selection off from the sidebar close button](https://github.com/wekan/wekan/commit/782200a0dad80907e417012dc27ab79ac1622579)
 - [The board's second header bar is gone](https://github.com/wekan/wekan/commit/0461de062fe111b930c1d39f159039464190ccc5)
 - [All Boards keeps its controls in its sidebar](https://github.com/wekan/wekan/commit/bce972e35f802b0abb82d54a31210e5f2999714e)
 - [The actions on a selection move into the header bar](https://github.com/wekan/wekan/commit/f56254e71fa5d5c9543ce70cc739bc6eb668b21a)
 - [Search and Multi-Selection become the header's controls](https://github.com/wekan/wekan/commit/fcfed1fd3721ae9cee271adf12d8a96d860f824c)
 - [The Selected star is a toggle, and every button is named](https://github.com/wekan/wekan/commit/2537a52ec2405e0a522426d47f8e246531832af3)
 - [Multi-Selection button looks the same as in Swimlanes View](https://github.com/wekan/wekan/commit/c6aa769bc0a8b01706e0f45a19b8ba8c66c77498)
