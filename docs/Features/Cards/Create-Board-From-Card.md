# Card menu / Create board from this card

## What it is

Turns the card into a link to a **new board**: WeKan creates a board, and the card
becomes a linked-board card that opens it. The card itself is converted, not
copied - its title stays, and nothing else on it changes. It is for a card that
has grown into a project of its own: the work moves to its own board, and the
card stays where it was as the way into it
([#4495](https://github.com/wekan/wekan/issues/4495)).

## Read more

- [Work breakdown structure](https://en.wikipedia.org/wiki/Work_breakdown_structure)
  and [Kanban board](https://en.wikipedia.org/wiki/Kanban_board) on Wikipedia.
- In WeKan: [Link to board](Link-To-Board.md),
  [Linked cards](Linked-Cards.md), [Card menu](README.md),
  [CreateBleed](https://wekan.fi/hall-of-fame/createbleed/).

## How to use it

1. Open the card, then its hamburger menu (☰, **Card Actions**).
2. Under **Archive**, click **Create board from this card**. A popup opens with
   the new board's **Name**, filled in with the card's title.
3. Press **Create board from this card**. The new board is created with you as
   its admin and a default swimlane, and the card now opens that board.

If the server refuses, the reason is shown and nothing changes.

### Who sees it

The entry is drawn only when:

- board creation is allowed for you (Admin Panel / People / Login can let only
  admins create boards - [CreateBleed](https://wekan.fi/hall-of-fame/createbleed/)),
  and
- the menu's write section is shown to you (`cardMenuWrites`: somebody who may
  change the card, or a member who is not **Read only** or **Read assigned
  only**) and you are not a Worker.

A member who can edit the card sees it. (The template used to draw the entry
under `unless canModifyCard`, which hid it from exactly those members; that was
fixed on 2026-11-20.)

## How the numbers are calculated

The feature has no numbers of its own. The new board gets one admin member
(you) and one swimlane, **Default** in your language. Its title is the name you
typed, trimmed, or the card's title when you leave it empty; with neither, it
is refused.

## How it works in WeKan

- **Client**: `Template.createBoardFromCardPopup` in
  [client/components/cards/cardDetails.js](../../../client/components/cards/cardDetails.js)
  calls `createBoardFromCard`, then refreshes the board subscriptions so the new
  board can be opened. The entry is drawn by `cardDetailsActionsPopup` in
  [client/components/cards/cardDetails.jade](../../../client/components/cards/cardDetails.jade)
  when `boardCreationAllowed`
  ([client/lib/boardCreationAllowed.js](../../../client/lib/boardCreationAllowed.js))
  says so.
- **Server**: `createBoardFromCard`
  ([server/models/cards.js](../../../server/models/cards.js)) checks that the
  card exists, is not archived and is not already a link or a template; you may
  write on its board; an assigned-only member converts only a card assigned to
  them (recorded in Admin Panel → Problems otherwise); the card's list does not
  refuse your role ([List permissions](../Lists/List-Permissions.md)); and you
  may create boards (`assertMayCreateBoard`,
  [server/lib/boardCreationGuard.js](../../../server/lib/boardCreationGuard.js)).
- **The new board** takes the source board's colour. It is private unless the
  source board is open, and always private when the instance allows private
  boards only (an inherited public visibility overridden this way is recorded
  in Admin Panel → Problems).
- **The card** gets `type: 'cardType-linkedBoard'` and `linkedId: <new board>`,
  the same two fields the Link popup sets when linking to a whole board.
- **Tests**: [tests/createBoardFromCardMethod.test.cjs](../../../tests/createBoardFromCardMethod.test.cjs),
  [tests/createBleed.test.cjs](../../../tests/createBleed.test.cjs),
  [tests/boardCreationAdminOnly.test.cjs](../../../tests/boardCreationAdminOnly.test.cjs),
  [tests/assignedCardMethods.test.cjs](../../../tests/assignedCardMethods.test.cjs),
  [tests/listLockBulkBleed.test.cjs](../../../tests/listLockBulkBleed.test.cjs)
  and the Playwright specs `create-board-from-card-menu.e2e.js`,
  `createbleed-board-creation-admin-only.e2e.js` and
  `67-private-only-board-policy.e2e.js`.

## Related

- [Link to board](Link-To-Board.md) - link a card to an EXISTING board.
- [Card menu](README.md)

## Commits

 - [Shown to members who can edit the card](https://github.com/wekan/wekan/commit/60c25690dfc2072509f0e1075e905984cb733f5f)
 - [Card menu grouped under headings](https://github.com/wekan/wekan/commit/0d8f8b8d96b868a6d75b803ef105e50aad450977)
 - [Converting the card asks the list's role exception](https://github.com/wekan/wekan/commit/ba3d94390ba724344a2d5cfe50e9dee3cc6f8d89)
 - [An assigned-only member converts only the cards assigned to them](https://github.com/wekan/wekan/commit/1513b2e98c0057d3eb2f2f3ef3fde2ea1841eefc)
 - [Only admins create boards on this path too (CreateBleed)](https://github.com/wekan/wekan/commit/5c1f6088f44c5c3e26a4808c20c4e5550a61f710)
 - [Create a board from a card and link the card to it, in one step](https://github.com/wekan/wekan/commit/a83a8a2cfa82a679573c253b1e09082b0d8eb66e)
