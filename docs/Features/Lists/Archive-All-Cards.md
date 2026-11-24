# List menu / Archive all cards in this list

## What it is

List menu (☰ in the list header) → **Archive all cards in this list** moves
every card of the list to the Archive in one step
([#3383](https://github.com/wekan/wekan/issues/3383)). The list itself stays
on the board. It is for clearing a list (a finished sprint's Done list, say)
without opening Multi-Selection first; the cards can be restored later.

## Read more

- [Kanban board](https://en.wikipedia.org/wiki/Kanban_board) on Wikipedia -
  the board whose columns are WeKan's lists.
- [Select all cards in this list](Select-All-Cards.md) - picks the same cards
  without archiving them.
- [Multi-Selection](../Multi-Selection.md) - the same server method
  archives a selection there.
- [Archive and Delete](../Board-Sidebar/Archive/Archive-and-Delete.md) -
  where archived cards are restored.

## How to use it

Who sees it: a board member who is not **Comment only**, **Read only** or
**Read assigned only**, when the list has cards - and not in a list whose
[list permission](List-Permissions.md) exception refuses the viewer's role
(helper `mayWriteList`).

1. Click ☰ (**List Actions**) in the list header.
2. Under **Edit**, click **Archive all cards in this list**.
3. A confirmation popup says: *This will remove all the cards in this list
   from the board. To view cards in Archive and bring them back to the board,
   click "Menu" > "Archive".* Click its **Move to Archive** button to continue.
4. The cards are archived. To bring them back, open **Board Settings**
   (the board's hamburger menu) → **Archive**.

Which cards are archived is chosen like
[Select all cards in this list](Select-All-Cards.md): in the Swimlanes view
only the cards of the swimlane the list belongs to, otherwise the whole list.

## How the numbers are calculated

- The card ids are the list's non-archived cards (`list.allCards(swimlaneId)`
  in [client/components/lists/listHeader.js](../../../client/components/lists/listHeader.js)),
  scoped to the list's own `swimlaneId` only in the Swimlanes view. An empty
  selection sends nothing.
- The server removes duplicate ids and refuses a selection that is empty or
  has more than **5000** cards (`archiveSelectedCards` in
  [server/models/cards.js](../../../server/models/cards.js)).
- It answers `{ archived: n }`, where n is the number of distinct cards
  archived.

## How it works in WeKan

- The menu entry and its confirm popup (`listArchiveCardsPopup`) are in
  [client/components/lists/listHeader.jade](../../../client/components/lists/listHeader.jade);
  the click handler is `'click .js-archive-list-cards'` in
  [client/components/lists/listHeader.js](../../../client/components/lists/listHeader.js).
- The cards are archived by the `archiveSelectedCards` server method
  ([server/models/cards.js](../../../server/models/cards.js)), the same one
  Multi-Selection's archive uses. It validates the whole selection before it
  archives the first card, and archives in the order the ids were sent.

The method refuses the whole selection, before archiving the first card,
when:

- the caller may not write the board;
- a card is not on that board, or is already archived;
- the selection is empty or has more than 5000 cards;
- the caller is an assigned-only member and a card is not
  assigned to them (recorded in Admin Panel → Problems);
- a card's list refuses the caller's role (`assertListsWritable`).

A refusal is shown as an alert. Archived cards can be restored from the
[Archive](../Board-Sidebar/Archive/Archive-and-Delete.md).

Tests: [tests/listArchiveAllCards3383.test.cjs](../../../tests/listArchiveAllCards3383.test.cjs),
[server/lib/tests/archiveListCards.tests.js](../../../server/lib/tests/archiveListCards.tests.js).

## Commits

 - [a list whose role exception refuses the viewer does not offer it](https://github.com/wekan/wekan/commit/3202a1d7ac1027b41af5a5dfbe03893ccbc89c36)
 - [the archive selection asks every card's list role exception](https://github.com/wekan/wekan/commit/ba3d94390ba724344a2d5cfe50e9dee3cc6f8d89)
 - [an assigned-only member archives only cards assigned to them](https://github.com/wekan/wekan/commit/1513b2e98c0057d3eb2f2f3ef3fde2ea1841eefc)
 - [regression coverage for the menu entry](https://github.com/wekan/wekan/commit/c55af0e34ac41e5aaf27d1af77ab6f464eecc4c9)
 - [the menu entry and its confirm popup (in a combined commit)](https://github.com/wekan/wekan/commit/0c7524db05a492e04b047e7523b916ccfb9df0c6)
 - [one acknowledged server method archives a card selection](https://github.com/wekan/wekan/commit/0aad02722cc77b65f3879e86951b9ddf5094233c)
