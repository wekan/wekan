# Linked cards

## What it is

A linked card is a mirror of an existing card. You can place it in another
list on the same board, or on another board you can edit. Labels and other
shared content come from the source; changing a label through either card
updates that shared content. The mirror keeps its own board/list position.

This also supports dashboards: link cards from several boards into one
board to see their current shared content together.

## Read more

- [Transclusion](https://en.wikipedia.org/wiki/Transclusion) on Wikipedia - the
  same content shown in several places by reference.
- The feature originated in [#1592](https://github.com/wekan/wekan/pull/1592).
  Same-board selection and label mirroring are covered by
  [#5683](https://github.com/wekan/wekan/issues/5683).
  See also [#5550](https://github.com/wekan/wekan/issues/5550).
- In WeKan: [Link to board](Link-To-Board.md) (the card menu's way to make one),
  [Move Card](Move-Card.md) (**Leave a link at the original location**),
  [Create board from this card](Create-Board-From-Card.md) (a linked board).

## How to use it

**Add a mirror from the destination list**

1. Open the add-card form in the destination list and choose **Link**.
2. Select the source board under **Boards**. The source board can be the
   current board.
3. Optionally narrow by **Swimlanes** / **Lists**.
4. Select the source card under **Cards**, and confirm with **Link**.

The picker omits sources already mirrored on the destination board. The
**Link** button beside **Boards** links the whole board instead of one card.

**Other ways**: the opened card's menu → **Link to board**
([Link to board](Link-To-Board.md)), and **Move Card** with **Leave a link at
the original location**.

**Rules**

The source must be a real card. Linking to another linked card, a linked
board or a template card is rejected to prevent broken link chains. Creating
a mirror requires write access to the source and destination boards. A
whole-board link cannot point back to its own board. An assigned-only member
links only cards assigned to them, and a destination list whose
[permission](../Lists/List-Permissions.md) refuses your role refuses the link.

## How the numbers are calculated

The feature has no numbers of its own. A linked card gets the destination
board's next card number (`getNextCardNumber`) and the sort number the Link
popup gives it; the counts, dates and spent time it shows are its source
card's.

## How it works in WeKan

- **Data**: a linked card is a card document with `type: 'cardType-linkedCard'`
  and `linkedId` = the source card's id. It owns only its placement (board,
  swimlane, list, sort); `getRealCard()` and `getRealId()` in
  [models/cards.js](../../../models/cards.js) make every displayed field and
  every edit go to the source. A whole-board link is `cardType-linkedBoard`.
- **Creating one**: the Link popup (`Template.linkCardPopup` in
  [client/components/lists/listBody.js](../../../client/components/lists/listBody.js))
  calls the `createLinkedCard` method, whose `createLinkedCardFor` in
  [server/models/cards.js](../../../server/models/cards.js) checks write access
  to both boards, the assigned-only scope and the list permission, and refuses
  a source that is archived, already a link, or a template. The card menu's
  Link to board uses `link()` in `models/cards.js`, guarded by
  `denyUnauthorizedCardLink` in
  [server/permissions/cards.js](../../../server/permissions/cards.js).
- **Editing**: [server/lib/linkedCardPermission.js](../../../server/lib/linkedCardPermission.js)
  (`canEditCardOrLinkedCard`) decides edits through a link, with the source's
  role as a ceiling ([models/lib/linkedWritePolicy.js](../../../models/lib/linkedWritePolicy.js)).
- **Deleting**: a card that a linked card points to cannot be deleted until the
  linked card is ([More](More.md)).
- Tests: [tests/createLinkedCardMethod.test.cjs](../../../tests/createLinkedCardMethod.test.cjs),
  [tests/linkedWritePolicy.test.cjs](../../../tests/linkedWritePolicy.test.cjs),
  [tests/linkedCardEditingParity.test.cjs](../../../tests/linkedCardEditingParity.test.cjs),
  [tests/linkedCardFieldParity.test.cjs](../../../tests/linkedCardFieldParity.test.cjs),
  [tests/linkedCardMembers.test.cjs](../../../tests/linkedCardMembers.test.cjs),
  [tests/linkedCardTitle.test.cjs](../../../tests/linkedCardTitle.test.cjs),
  [tests/linkCardPopup.test.js](../../../tests/linkCardPopup.test.js) and the
  Playwright specs `same-board-linked-cards.e2e.js`,
  `74-linked-write-policy.e2e.js` and `75-linked-card-same-tab.e2e.js`.

## Commits

 - [A linked card shows the fields its source card has](https://github.com/wekan/wekan/commit/1f5a7b8220488092ee3ace5ec2d2f5518bc955df)
 - [New issue and REST linked card: one created activity](https://github.com/wekan/wekan/commit/5f3b211b37b4152e923f616110274ce96b9b46e6)
 - [Copying or linking carries only the new board's custom field values](https://github.com/wekan/wekan/commit/63ebdb9072b678e104da20f47321c07d54cf999f)
 - [Linked cards over REST follow the Link popup's rule](https://github.com/wekan/wekan/commit/3da444db748f0711a232a19205e47740d9889b4e)
 - [Same-board linked cards, with the link and write guards](https://github.com/wekan/wekan/commit/3b3f7ebd7764668f97f5b895e67cd3ef0a6f8b48)
 - [Linked card URLs open in the current tab](https://github.com/wekan/wekan/commit/0741a7847515eeb0d6e2129e5bc9dec2b2183f53)
 - [Linked cards do not promote non-writing source roles](https://github.com/wekan/wekan/commit/26e9e70304211af0c697723e9b5aa94896c26f1c)
 - [Edit linked card content from either board](https://github.com/wekan/wekan/commit/49de60eb04616048803ba988cc97758091da65d2)
 - [Mirror every visible source field on linked cards](https://github.com/wekan/wekan/commit/8fac3ab89127cc0d7d2164664152dffc0fbc32df)
 - [Restore cross-board linked-card creation](https://github.com/wekan/wekan/commit/798390c6fcc7c905b12c1afda57606ec3328c5ba)
 - [Filter by title finds renamed linked cards](https://github.com/wekan/wekan/commit/14b4f5b5ed34a31d6e077114c42ab80a6a965091)
 - [Members can be added to a linked card](https://github.com/wekan/wekan/commit/cb9c8973092df5aa3112d3d59e3da4d8793c628b)
 - [Linking a card to another linked card no longer breaks both](https://github.com/wekan/wekan/commit/878a24f586d698307bc3af1e65c903147f87a59a)
 - [Fix and improve linked cards](https://github.com/wekan/wekan/commit/3e715bbcc9e2cf3aad043dc7ab0ed76b519e80eb)
 - [Imported cards renamed to linked cards](https://github.com/wekan/wekan/commit/6adfcb35138259c5969e63d20a68cd6f9e8c393c)
 - [Link a card or a whole board as a card, from the add-card form](https://github.com/wekan/wekan/commit/5644ef66af2fb6e2bfb629a499bb21130bfd5c73)
