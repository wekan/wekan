# Card menu / Move Card

## What it is

Card menu (☰ in the opened card's header, **Card Actions**) → **Move Card**
moves the card to another place on this board or to another board
(`moveCardPopup` in `client/components/cards/cardDetails.jade`). It does what
dragging a card does, also where dragging cannot reach: to another board, or to
an exact place in a long list.

## Read more

- [Kanban board](https://en.wikipedia.org/wiki/Kanban_board) and
  [Kanban (development)](https://en.wikipedia.org/wiki/Kanban_(development)) on
  Wikipedia - a card moves through the lists as its work moves on.
- In WeKan: [Copy Card](Copy-Card.md), [Link to board](Link-To-Board.md),
  [Move to Top, Move to Bottom](Move-To-Top-Bottom.md),
  [Linked cards](Linked-Cards.md),
  [List permissions](../Lists/List-Permissions.md),
  [Moving a card to another board](README.md#moving-a-card-to-another-board).

## How to use it

1. Open the card and click ☰ in its header (**Card Actions**). Under **Move and
   copy**, click **Move Card** - or press **Shift+M** on the opened card, or on
   the selected or hovered minicard.
2. Change the **Title** if you like, and write a **Move reason (optional)**.
3. Choose **Boards**, **Swimlanes** and **Lists**.
4. Choose a card under **Cards** and **Above selected card** (chosen when the
   popup opens) or **Below selected card**.
5. Tick **Leave a link at the original location** to leave a
   [linked card](Linked-Cards.md) where the card was.
6. Click **Done**. It is disabled until the destination's cards have loaded. If
   the move is refused, the error is shown in the popup.

| Field | What it does |
| --- | --- |
| **Title** | the card's title; a changed title is saved after the move |
| **Move reason (optional)** | up to 1000 characters, passed with the move |
| **Boards** | the active boards you are an active member of, without your Templates board |
| **Swimlanes**, **Lists** | the destination swimlane and list on that board; lists that belong to no swimlane are offered with every swimlane |
| **Cards**, **Above selected card** / **Below selected card** | where in the list the card goes; when the list has no cards, it goes to the bottom |
| **Leave a link at the original location** | off by default; when on, a [linked card](Linked-Cards.md) is left where the card was ([#2719](https://github.com/wekan/wekan/issues/2719)) |
| **Done** | moves; disabled until the destination's cards have loaded |

The destination you choose - board, swimlane, list and card - is remembered per
board in your profile (`profile.moveAndCopyDialog`) and offered next time
([#6901](https://github.com/wekan/wekan/issues/6901)); a remembered swimlane,
list or card that is gone falls back to the first one. The same destination
picker (`cardDestinationPicker`) is used by
[Copy Card](Copy-Card.md),
[Copy Template to Many Cards](Copy-Template-To-Many-Cards.md) and
[Link to board](Link-To-Board.md). Its **Cards** list is loaded for the chosen
list on its own, so it is filled also on a board whose cards load lazily
([#6917](https://github.com/wekan/wekan/issues/6917)).

### Who sees it

Only a **board admin**, and only when the menu's moving and copying entries
are offered at all (helper `cardMenuWrites`): to somebody who may change the
card, or to a member who is not **Read only** or **Read assigned only**.

### What moves along

A card moved to another board takes its comments, reactions, text note,
checklists and attachments along; see
[Moving a card to another board](README.md#moving-a-card-to-another-board).
Its labels are matched by name on the new board (a missing named label is
created when you are an admin there), it takes the new board's next card
number, members and watchers who are not active members of the new board are
taken off it, only its custom fields of the new board are kept, and its
dependencies are dropped, because they connect cards of one board only.

A [list permission](../Lists/List-Permissions.md) that refuses your role in
the source or the destination list refuses the move. An error is shown in
the popup.

## How the numbers are calculated

- **Place in the list** (`relativePosition` in
  [models/lib/relativePosition.js](../../../models/lib/relativePosition.js)):
  the card gets the number halfway between the chosen card and its neighbour on
  the chosen side. At the top or bottom of the list there is no neighbour, so it
  gets the chosen card's sort number minus 1 (above) or plus 1 (below). Only when
  two neighbours share one sort number (or the numbers are too close to split)
  are the tied cards spread out evenly between the nearest different numbers.
  With no cards in the list, the card gets the highest sort number plus 1, or 0.
- **Move reason**: at most 1000 characters (`maxlength` on the field, and
  trimmed and cut to 1000 in `move()`), stored as `lastMoveReason` when the card
  changes list or board.
- **Card number**: on another board, the board's next card number.

## How it works in WeKan

- **Client**: `Template.moveCardPopup` in
  [client/components/cards/cardDetails.js](../../../client/components/cards/cardDetails.js)
  works out the sort number (`relativeCardSort`,
  [client/lib/relativeCardPosition.js](../../../client/lib/relativeCardPosition.js)),
  calls `card.move(boardId, swimlaneId, listId, sort, reason)`, saves a changed
  title, and with the checkbox ticked calls `card.link()` at the original place.
  The dialog state is `BoardSwimlaneListCardDialog`
  ([client/lib/dialogWithBoardSwimlaneListCard.js](../../../client/lib/dialogWithBoardSwimlaneListCard.js),
  [client/lib/dialogWithBoardSwimlaneList.js](../../../client/lib/dialogWithBoardSwimlaneList.js));
  the destination's cards come from the `destinationCards` publication.
- **Model**: `move()` in [models/cards.js](../../../models/cards.js) writes only
  the fields that change (`models/lib/cardMoveModifier.js`), and on another
  board maps labels, custom fields, members and watchers. The server hooks in
  `server/models/cards.js` move the card's comments, checklists and attachments
  along and remove dependencies pointing at it from the old board.
- **Keyboard**: Shift+M is `openCardMenuActionOfOpenedCard('move')` in
  [client/lib/keyboard.js](../../../client/lib/keyboard.js).
- Tests: [tests/moveCopyRemembersDestination6901.test.cjs](../../../tests/moveCopyRemembersDestination6901.test.cjs),
  [tests/moveCardLeaveLinkAtOrigin2719.test.cjs](../../../tests/moveCardLeaveLinkAtOrigin2719.test.cjs),
  [tests/destinationCards6917.test.cjs](../../../tests/destinationCards6917.test.cjs),
  [tests/cardMoveModifier.test.cjs](../../../tests/cardMoveModifier.test.cjs),
  [tests/cardCustomFieldsMove.test.cjs](../../../tests/cardCustomFieldsMove.test.cjs),
  [tests/cardChildrenFollowMove.test.cjs](../../../tests/cardChildrenFollowMove.test.cjs)
  and the Playwright specs `move-copy-remembers-destination-6901.e2e.js`,
  `move-copy-keyboard-shortcut-6904.e2e.js`, `card-copy-destination.e2e.js` and
  `issue-6793-comments-follow-card-move.e2e.js`.

## Commits

 - [Card menu grouped under headings, Move Card under Move and copy](https://github.com/wekan/wekan/commit/0d8f8b8d96b868a6d75b803ef105e50aad450977)
 - [Card shortcuts open only their popup](https://github.com/wekan/wekan/commit/138f727ebbfc30d395fbcfa18ca244e58abe91d7)
 - [Destination picker lists the cards of a lazily loaded board](https://github.com/wekan/wekan/commit/e46d7a2376ebfa413cec15843d8b7fc374fe63e0)
 - [Shift+M opens Move Card](https://github.com/wekan/wekan/commit/8508c150159a160b13b45505065ff788171a777a)
 - [Remember the swimlane and list chosen last time, not only the board](https://github.com/wekan/wekan/commit/4b47ec81a72aab1ab8d04addb8fe41b7e0181841)
 - [Card actions menu in the maintainer's order](https://github.com/wekan/wekan/commit/65621f44cc03db9b2b98276ffd2c7bed8590b2fd)
 - [Record reversible move reasons](https://github.com/wekan/wekan/commit/6d99ad73c4361a44a0445cf396ddaaf697575833)
 - [Leave a linked card at the original spot](https://github.com/wekan/wekan/commit/79dfd596f190c88eea1225259dba13846f266068)
 - [Cross-board move destinations stay reactive](https://github.com/wekan/wekan/commit/04bd60dd3f192b84af008c000617eaa4ca8a72be)
 - [The destination picker is one shared template](https://github.com/wekan/wekan/commit/53c3123de5dc82f9c010792989adf55cc15bffb6)
 - [Moving a card to another board keeps its custom field ids](https://github.com/wekan/wekan/commit/fe27dc0b8eebda693e785f0b699aeb52ed363b14)
 - [Move and copy read the destination from the live selection, not the DOM](https://github.com/wekan/wekan/commit/7db02489202c560d227a476db24cd761c66a0a00)
 - [Fix the move and copy popup's duplicate view](https://github.com/wekan/wekan/commit/631c250f403172937b76ddd37bab54bc9b6dbb78)
