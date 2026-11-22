# Card menu / Move to Top, Move to Bottom

## What it is

Card menu (☰ in the opened card's header, **Card Actions**) → **Move to
Top** and **Move to Bottom** move the card to the first or last place of its
own list, in its own swimlane. It is the quick way to raise a card to the head
of the queue, or to put it last, without dragging it through a long list.

## Read more

- [Kanban board](https://en.wikipedia.org/wiki/Kanban_board) on Wikipedia - the
  order of the cards in a list is their priority.
- In WeKan: [Move Card](Move-Card.md) (to another place or board),
  [List permissions](../Lists/List-Permissions.md).

## How to use it

1. Open the card and click ☰ in its header (**Card Actions**).
2. Under **Move and copy**, click **Move to Top** or **Move to Bottom**.
3. The card moves at once, and the menu goes back.

### Who sees them

A user to whom the menu offers its moving and copying entries (helper
`cardMenuWrites`: somebody who may change the card, or a member who is not
**Read only** or **Read assigned only**). Workers see them too.

### What happens

- **Move to Top** gives the card a sort number one below the lowest of the
  non-archived cards in the same list and swimlane.
- **Move to Bottom** gives it one above the highest.
- The card stays on the same board, swimlane and list (`card.move`); only
  its order changes. The menu then goes back.

The server still decides whether the move is allowed, including a
[list permission](../Lists/List-Permissions.md) of the card's list.

## How the numbers are calculated

- **Move to Top**: new sort = (the lowest `sort` of the non-archived cards with
  the same `listId` and `swimlaneId`) - 1 (`getMinSort`).
- **Move to Bottom**: new sort = (the highest such `sort`) + 1 (`getMaxSort`).
- Both include the card itself; when nothing is found the lowest or highest is
  taken as 0. Both are read by `getSort` in
  [models/cards.js](../../../models/cards.js), sorted by `sort` ascending or
  descending.

## How it works in WeKan

- **Client**: the `click .js-move-card-to-top` and `click .js-move-card-to-bottom`
  events of `cardDetailsActionsPopup` in
  [client/components/cards/cardDetails.js](../../../client/components/cards/cardDetails.js).
- **Model**: `getMinSort`, `getMaxSort`, `getSort` and `move()` in
  [models/cards.js](../../../models/cards.js); `move()` writes only the `sort`,
  so the cross-board hooks do not run.
- Tests: [tests/cardActionsOrder.test.cjs](../../../tests/cardActionsOrder.test.cjs)
  (the entries' place in the menu) and
  [tests/cardMoveModifier.test.cjs](../../../tests/cardMoveModifier.test.cjs)
  (only the changed fields are written).

## Commits

 - [Card menu grouped under headings](https://github.com/wekan/wekan/commit/0d8f8b8d96b868a6d75b803ef105e50aad450977)
 - [Card actions menu in the maintainer's order](https://github.com/wekan/wekan/commit/65621f44cc03db9b2b98276ffd2c7bed8590b2fd)
 - [The menu entries follow the board permissions](https://github.com/wekan/wekan/commit/eabb6a239d20530f538d22f94d9cfbebeb847493)
 - [Move cards to the top or bottom from the card details](https://github.com/wekan/wekan/commit/cfbc8eed68e46a4ee8f28ff085242c200febe1d0)
