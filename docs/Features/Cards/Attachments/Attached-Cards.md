# Attached cards

## What it is

A card can have other cards attached to it, beside its files - what Trello
calls a card attachment ([#3257](https://github.com/wekan/wekan/issues/3257)).
The attached card is shown in the card's Attachments section with its title,
board and list, and one click opens it. It is a reference: attaching or
removing it never changes the other card.

## Read more

- [Trello](https://en.wikipedia.org/wiki/Trello) on Wikipedia, and Trello's
  own help on [adding attachments to cards](https://support.atlassian.com/trello/docs/adding-attachments-to-cards/),
  where a card can be attached to another card.
- [Hyperlink](https://en.wikipedia.org/wiki/Hyperlink) - an attached card is a
  link to another card that also shows where it is.
- In WeKan: [Attachments](README.md), [Linked cards](../Linked-Cards.md)
  (one card shown in a second place) and
  [Linked custom fields](../CustomFields/Linked-Custom-Fields.md).

## How to use it

**Attaching a card:**

1. Open the card and its **Attachments** section.
2. Click **+**, then **Attach card**.
3. Either type part of a card title on this board and pick the card, or paste a
   card link - **Copy card link to clipboard** in the other card's menu gives
   one - which may be a card on any board you can read.
4. Click **Attach card**.

The attached card is shown with its title, board and list, and opens that card
when clicked. The **x** beside it (**Remove attached card**) removes it; the
card itself is not changed.

## How the numbers are calculated

- A card can have at most **100** attached cards (`MAX_ATTACHED_CARDS` in
  [models/lib/attachedCards.js](../../../../models/lib/attachedCards.js)); the
  101st is refused with "Too many attached cards".
- Typing a title shows at most **8** matching cards of this board, sorted by
  title: cards that are not archived, not this card and not already attached
  ([client/components/cards/attachments.js](../../../../client/components/cards/attachments.js)).
  Text that starts with `http:`/`https:` or contains `/` is taken as a link,
  not searched.
- The stored list holds each id once; attaching a card that is already there
  changes nothing.

## How it works in WeKan

### Who can do what

- Attaching or removing an attached card needs the right to edit the card.
- Only a card you can read can be attached. A card on a board you are not a
  member of, or - when you are an assigned-only member - a card not assigned
  to you, is refused as "not found", the same as a card that does not exist.
- A card cannot be attached to itself.
- An attached card is shown only to someone who can read it. Anybody else sees
  that an attached card is there, without its title ("An attached card you
  cannot see").

### Import and export

- **Trello**: an attachment that links to a Trello card of the same export
  becomes an attached card. A link to a card of another board stays in the
  card's description under Links, as attached links always did.
- **WeKan JSON**: attached cards are exported with the card. An import keeps
  the ones that came in the same export, under their new ids, and drops the
  rest.

### For developers

- Data: `cards.attachedCardIds`, a list of card ids
  ([models/lib/attachedCards.js](../../../../models/lib/attachedCards.js), at
  most 100).
- Methods ([server/models/attachedCards.js](../../../../server/models/attachedCards.js)):
  `attachCardToCard(cardId, cardLinkOrId)`, `detachCardFromCard(cardId,
  attachedCardId)` and `attachedCardsInfo(cardId)`, which returns `{ cardId,
  title, boardId, boardTitle, listTitle, url, archived }` for a readable
  attached card and `{ cardId, unavailable: true }` for any other. Editing is
  checked with `canEditCardOrLinkedCard`, reading with `canReadBoard` and the
  assigned-only rule.
- UI: the `attachCard` popup and the attached-card rows in
  [client/components/cards/attachments.jade](../../../../client/components/cards/attachments.jade).
- Tests: `tests/attachedCards.test.cjs`, `server/lib/tests/attachedCards.tests.js`
  and `tests/playwright/specs/attached-cards.e2e.js`.

## Commits

 - [the Attach card popup gets its title, and attached cards are audited in the inventories](https://github.com/wekan/wekan/commit/821519119739c257e41ccbf364005c5bec661b05)
 - [attach a card to a card, as Trello's card attachments, and import them from Trello](https://github.com/wekan/wekan/commit/32fa89fdc3d695e97bc0c836528b234b02d44c6b)
