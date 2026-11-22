# Card menu / Link to board

## What it is

Card menu (☰ in the opened card's header, **Card Actions**) → **Link to
board** puts a [linked card](Linked-Cards.md) of this card on another,
existing board ([#4281](https://github.com/wekan/wekan/issues/4281);
`linkCardToBoardPopup` in `client/components/cards/cardDetails.jade`). The card
then shows on both boards: the original stays where it is, and the link shows
its content where you put it.

## Read more

- [Transclusion](https://en.wikipedia.org/wiki/Transclusion) on Wikipedia - one
  piece of content shown in several places by reference, which is what a linked
  card is.
- In WeKan: [Linked cards](Linked-Cards.md), [Move Card](Move-Card.md) (its
  **Leave a link at the original location**),
  [Create board from this card](Create-Board-From-Card.md) (link a card to a NEW
  board).

## How to use it

1. Open the card and click ☰ in its header (**Card Actions**).
2. Under **Share and history**, click **Link to board**.
3. In the same destination picker as [Move Card](Move-Card.md), choose
   **Boards**, **Swimlanes**, **Lists**, and a card of **Cards** with **Above
   selected card** / **Below selected card**.
4. Click **Done**. When the destination list has no cards to choose, the linked
   card goes to the bottom of the list. The destination is remembered per board.

### Who sees it

Somebody who may change the card (`canModifyCard`) and is not a **Worker**.

### What it creates

A new card of type `cardType-linkedCard` whose `linkedId` points to the
original card (`link` in `models/cards.js`). Its labels are not copied, and
only custom-field values of fields that belong to the destination board are
kept. The original card is not changed. On a filtered board the new card is
added to the filter's exceptions.

The same link is what [Move Card](Move-Card.md)'s **Leave a link at the
original location** leaves behind.

## How the numbers are calculated

The feature has no numbers of its own. The linked card's place in the list is
worked out as for [Move Card](Move-Card.md): halfway between the chosen card and
its neighbour on the chosen side (`models/lib/relativePosition.js`), or one more
than the highest sort number of the list when it has no cards.

## How it works in WeKan

- **Client**: `Template.linkCardToBoardPopup` in
  [client/components/cards/cardDetails.js](../../../client/components/cards/cardDetails.js)
  calls `card.link(boardId, swimlaneId, listId)` and then `move()` to place it,
  and remembers the destination in `profile.moveAndCopyDialog`.
- **Model**: `link()` in [models/cards.js](../../../models/cards.js) copies the
  card's document, points `linkedId` at the original (or at the original's own
  source when this card already is a link), sets the new board, swimlane and
  list, drops `labelIds`, and keeps only the destination board's custom-field
  values (`customFieldsForBoard`).
- **Permissions**: the insert goes through the Cards allow/deny rules
  ([server/permissions/cards.js](../../../server/permissions/cards.js)): the
  destination board must let you write, and `denyUnauthorizedCardLink` refuses
  a linked card whose source is on a board you may not write on (recorded in
  Admin Panel → Problems as a linked-write denial).
- Tests: [tests/linkCardToBoard4281.test.cjs](../../../tests/linkCardToBoard4281.test.cjs),
  [tests/linkedWritePolicy.test.cjs](../../../tests/linkedWritePolicy.test.cjs)
  and the Playwright spec `74-linked-write-policy.e2e.js`.

## Commits

 - [Card menu grouped under headings, Link to board under Share and history](https://github.com/wekan/wekan/commit/0d8f8b8d96b868a6d75b803ef105e50aad450977)
 - [Destination picker lists the cards of a lazily loaded board](https://github.com/wekan/wekan/commit/e46d7a2376ebfa413cec15843d8b7fc374fe63e0)
 - [Card actions menu in the maintainer's order](https://github.com/wekan/wekan/commit/65621f44cc03db9b2b98276ffd2c7bed8590b2fd)
 - [Linking carries only the custom field values of the new board](https://github.com/wekan/wekan/commit/63ebdb9072b678e104da20f47321c07d54cf999f)
 - [Linked cards do not promote non-writing source roles](https://github.com/wekan/wekan/commit/26e9e70304211af0c697723e9b5aa94896c26f1c)
 - [Add Link to board to the card hamburger menu](https://github.com/wekan/wekan/commit/9b1a90239b5b2b10f1184a251888190ac89d2484)
