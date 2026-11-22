# Card menu / Copy Template to Many Cards

## What it is

Card menu (☰ in the opened card's header, **Card Actions**) → **Copy
Template to Many Cards** makes several copies of this card at once, each
with its own title and description (`copyManyCardsPopup` in
`client/components/cards/cardDetails.jade`). The card works as a template: its
checklists, attachments, labels and other fields go to every copy, and only the
title and the description differ.

## Read more

- [Template (word processing)](https://en.wikipedia.org/wiki/Template_(word_processing))
  and [Mail merge](https://en.wikipedia.org/wiki/Mail_merge) on Wikipedia - the
  same idea, one template filled in many times.
- [JSON](https://en.wikipedia.org/wiki/JSON) - the format of the list of titles
  and descriptions.
- In WeKan: [Copy Card](Copy-Card.md), [Move Card](Move-Card.md),
  [Save as Template](../All-Boards/Templates.md).

## How to use it

1. Open the card and click ☰ in its header (**Card Actions**). Under **Move and
   copy**, click **Copy Template to Many Cards**.
2. The text box, labelled **Destination Card Titles and Descriptions in this
   JSON format**, is prefilled with an example:

   ```json
   [ {"title": "First card title", "description":"First card description"},
     {"title":"Second card title","description":"Second card description"},
     {"title":"Last card title","description":"Last card description"} ]
   ```

   Replace it with one object per card to create.
3. Below it is the same destination picker as [Move Card](Move-Card.md):
   board, swimlane, list, a card and **Above selected card** / **Below selected
   card**.
4. Click **Done**.

### Who sees it

The same users as [Copy Card](Copy-Card.md): the menu offers its moving and
copying entries to them (`cardMenuWrites`), and they are not a **Worker**.

### What happens

- The text is parsed as JSON. Text that is not valid JSON creates nothing,
  and the error is shown in the popup.
- For each object, the `copyCard` server method copies this card with the
  object's `title` and `description` (with the same checks as Copy Card),
  then places it. With **Below selected card**, each copy goes below the
  previous one, so they keep the order of the text.
- When the destination list has no cards to choose, each copy goes to the
  bottom of the list.
- On a filtered board, each copy is added to the filter's exceptions.
- `title` and `description` must be text. Any other key in an object is
  refused by the server (`models/lib/cardCopyOverrides.js`), and the copies
  made before that object stay.

## How the numbers are calculated

- **How many cards**: one per object in the JSON array, in the order of the
  text. There is no limit of its own.
- **Place in the list**: the server first puts each copy at the bottom of the
  destination list (`copyCard` with `insertAtTop` false: one more than the
  highest sort number). The client then moves it beside the chosen card, halfway
  between that card and its neighbour (`models/lib/relativePosition.js`), or to
  one more than the highest sort number when the list is empty. With **Below
  selected card** the next copy is placed below the one just made.
- **Card number**: each copy takes the destination board's next card number.

## How it works in WeKan

- **Client**: `Template.copyManyCardsPopup` in
  [client/components/cards/cardDetails.js](../../../client/components/cards/cardDetails.js)
  parses the text with `JSON.parse`, then for each object calls `copyCard` and
  `card.move()` one after another.
- **Server**: the `copyCard` method in
  [server/models/cards.js](../../../server/models/cards.js) - the same checks as
  [Copy Card](Copy-Card.md); `cardWithCopyOverrides` in
  [models/lib/cardCopyOverrides.js](../../../models/lib/cardCopyOverrides.js)
  allows only `title` and `description`. The copy itself is `copy()` in
  [models/cards.js](../../../models/cards.js): attachments, checklists, comments
  and subtasks are copied too.
- **Tests**: [tests/cardCopyOverrides.test.cjs](../../../tests/cardCopyOverrides.test.cjs),
  [tests/authBleedCopyMethods.test.cjs](../../../tests/authBleedCopyMethods.test.cjs),
  [tests/sharedFormTemplates.test.cjs](../../../tests/sharedFormTemplates.test.cjs)
  (the shared destination picker) and
  [tests/cardActionsOrder.test.cjs](../../../tests/cardActionsOrder.test.cjs)
  (its place in the menu).

## Commits

 - [Card menu grouped under headings](https://github.com/wekan/wekan/commit/0d8f8b8d96b868a6d75b803ef105e50aad450977)
 - [Destination picker lists the cards of a lazily loaded board](https://github.com/wekan/wekan/commit/e46d7a2376ebfa413cec15843d8b7fc374fe63e0)
 - [Card actions menu in the maintainer's order](https://github.com/wekan/wekan/commit/65621f44cc03db9b2b98276ffd2c7bed8590b2fd)
 - [Copy overrides restricted to title and description](https://github.com/wekan/wekan/commit/1e44a1ffc174b4e7070c4421e4a67e0cd45f9f3f)
 - [The destination picker is one shared template](https://github.com/wekan/wekan/commit/53c3123de5dc82f9c010792989adf55cc15bffb6)
 - [The dialog reads the destination from the live selection, not the DOM](https://github.com/wekan/wekan/commit/7db02489202c560d227a476db24cd761c66a0a00)
 - [Copy many cards copies attachments](https://github.com/wekan/wekan/commit/43135ffc8d8b29a42f27e53ed58b2a6cf9e1b644)
 - [Copy checklists to many cards copies the whole card](https://github.com/wekan/wekan/commit/dc210dc53b3e54cf59aa271d4d6e86fc5df1065a)
