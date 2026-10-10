# Attached cards

A card can have other cards attached to it, beside its files - what Trello
calls a card attachment ([#3257](https://github.com/wekan/wekan/issues/3257)).

## Attaching a card

1. Open the card and its **Attachments** section.
2. Click **+**, then **Attach card**.
3. Either type part of a card title on this board and pick the card, or paste a
   card link - **Copy card link** on the other card gives one - which may be a
   card on any board you can read.

The attached card is shown with its title, board and list, and opens that card
when clicked. The **x** beside it removes it; the card itself is not changed.

## Who can do what

- Attaching or removing an attached card needs the right to edit the card.
- Only a card you can read can be attached. A card on a board you are not a
  member of, or - when you are an assigned-only member - a card not assigned
  to you, is refused as "not found", the same as a card that does not exist.
- An attached card is shown only to someone who can read it. Anybody else sees
  that an attached card is there, without its title.

## Import and export

- **Trello**: an attachment that links to a Trello card of the same export
  becomes an attached card. A link to a card of another board stays in the
  card's description under Links, as attached links always did.
- **WeKan JSON**: attached cards are exported with the card. An import keeps
  the ones that came in the same export, under their new ids, and drops the
  rest.

## For developers

- Data: `cards.attachedCardIds`, a list of card ids
  (`models/lib/attachedCards.js`, at most 100).
- Methods (`server/models/attachedCards.js`): `attachCardToCard(cardId,
  cardLinkOrId)`, `detachCardFromCard(cardId, attachedCardId)` and
  `attachedCardsInfo(cardId)`, which returns `{ cardId, title, boardId,
  boardTitle, listTitle, url, archived }` for a readable attached card and
  `{ cardId, unavailable: true }` for any other.
- Tests: `tests/attachedCards.test.cjs`, `server/lib/tests/attachedCards.tests.js`
  and `tests/playwright/specs/attached-cards.e2e.js`.
