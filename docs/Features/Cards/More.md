# Card menu / More

## What it is

Card menu (☰ in the opened card's header, **Card Actions**) → **More**
opens a popup with the card's link, its parent cards and its creation date
(`cardMorePopup` in `client/components/cards/cardDetails.jade`). It is where a
card is made a subtask of another card, and where a board admin deletes a card
for good.

## Read more

- [URL](https://en.wikipedia.org/wiki/URL),
  [Clipboard (computing)](https://en.wikipedia.org/wiki/Clipboard_(computing))
  and [Work breakdown structure](https://en.wikipedia.org/wiki/Work_breakdown_structure)
  (parent cards and subtasks) on Wikipedia.
- In WeKan: [Subtasks](Subtasks.md),
  [Board item links](../Board-Item-Links.md),
  [Archive and Delete](../Board-Sidebar/Archive/Archive-and-Delete.md).

## How to use it

1. Open the card and click ☰ in its header (**Card Actions**).
2. Under **Archive**, click **More**.
3. To share the card: **Copy card link to clipboard**.
4. To make it a subtask: under **Change card's parent**, choose the **Source
   board**, then the **Parent card**. Choose **(none)** as **Parent card** to make
   it a top-level card again.
5. To give it more parents: choose a card under **Add another parent card**;
   remove one with × beside it under **Also a subtask of**.
6. To delete it permanently (board admins): **Delete**, then confirm.

| Part | What it does |
| --- | --- |
| **Link to this card** | the board's visibility icon and a read-only box with the card's address |
| **Copy card link to clipboard** | copies that address; inside Sandstorm it opens Sandstorm's sharing instead ([#1188](https://github.com/wekan/wekan/issues/1188)) |
| **Change card's parent**: **Source board**, **Parent card** | makes the card a subtask of a card on one of your boards, or of none; this is the primary parent |
| **Also a subtask of** | the other parent cards, each with × to remove it ([#3626](https://github.com/wekan/wekan/issues/3626)) |
| **Add another parent card** | adds a further parent from the chosen board |
| **Added** | the date the card was created |
| **Delete** | board admins only; permanent, after a confirmation |

The parent-card list is filled once the chosen board's cards have loaded
([#3745](https://github.com/wekan/wekan/issues/3745),
[#6917](https://github.com/wekan/wekan/issues/6917)). See
[Subtasks](Subtasks.md).

**Delete** removes the card only when no linked card elsewhere points to it;
otherwise it says *You can not delete this card before first deleting linked
card that has* and the card stays. To keep a card restorable, use **Move
Card to Archive** instead
([Archive and Delete](../Board-Sidebar/Archive/Archive-and-Delete.md)).

### Who sees it

A user to whom the menu offers its moving and copying entries (helper
`cardMenuWrites`), who is not a **Worker**.

## How the numbers are calculated

The popup has no numbers of its own. **Added** is the card's `createdAt`, shown
in the long local date format (`LLL`).

## How it works in WeKan

- **Template and events**: `cardMorePopup` in
  [client/components/cards/cardDetails.jade](../../../client/components/cards/cardDetails.jade)
  and `Template.cardMorePopup` in
  [client/components/cards/cardDetails.js](../../../client/components/cards/cardDetails.js).
  The **Source board** list is the boards you are a member of that are not
  archived, without your Templates board.
- **Parents**: the primary parent is the card's `parentId`; further parents are
  kept in `parentIds` ([#3626](https://github.com/wekan/wekan/issues/3626)).
- **Delete**: checks on the client that no card has `linkedId` pointing at this
  one, then calls `Cards.remove`, which the server's remove rules allow or
  refuse; removing a card also removes its checklists, comments and attachments
  (`cardRemover` in `models/cards.js`), and the card's window is closed.
- **Copy card link**: the card's absolute address (`originRelativeUrl`); inside
  Sandstorm the Sandstorm sharing dialog.
- Tests: the Playwright spec `copy-link-browser-origin.e2e.js` (how the card's
  address is built) and
  [tests/destinationCards6917.test.cjs](../../../tests/destinationCards6917.test.cjs)
  (the parent-card list of a lazily loaded board).

## Commits

 - [Card menu grouped under headings, More under Archive](https://github.com/wekan/wekan/commit/0d8f8b8d96b868a6d75b803ef105e50aad450977)
 - [Card actions menu in the maintainer's order](https://github.com/wekan/wekan/commit/65621f44cc03db9b2b98276ffd2c7bed8590b2fd)
 - [Sandstorm: Copy card URL shares the card through Sandstorm](https://github.com/wekan/wekan/commit/d1d806de2c6b88265e7f6343b3734aa58cb8e628)
 - [More lists every board again for a user without a Templates board](https://github.com/wekan/wekan/commit/9ae7388a7e72de02a7327fcbbf14b28b64da35d2)
 - [A card can be a subtask of several parent cards](https://github.com/wekan/wekan/commit/a904ca8807348ca8ad7c11cb3329ab0ea136e5e5)
 - [The Copy link button is themed](https://github.com/wekan/wekan/commit/7a75779b2cba58de149b99f308360b9944a50dd3)
 - [The parent card list is filled on the first board choice](https://github.com/wekan/wekan/commit/f999b9e7496b17def2a19a92e3654e98c35126b0)
 - [A card cannot be set as its own parent](https://github.com/wekan/wekan/commit/97822f35fd6365e5631c5488e8ee595f76ab4e34)
 - [Change a card's parent](https://github.com/wekan/wekan/commit/b7d508e8c4cf858559e144053d119ceaebfa9697)
 - [Copy card link to clipboard](https://github.com/wekan/wekan/commit/84d40bd3e397165b879e15035823dcb92ad1e5ee)
