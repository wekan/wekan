# List menu / Archive all cards in this list

List menu (☰ in the list header) → **Archive all cards in this list** moves
every card of the list to the Archive in one step
([#3383](https://github.com/wekan/wekan/issues/3383)). The list itself stays
on the board.

## Who sees it

A board member who is not **Comment only**, **Read only** or **Read assigned
only**, when the list has cards - and not in a list whose
[list permission](List-Permissions.md) exception refuses the viewer's role
(helper `mayWriteList`).

## What happens

1. A confirmation popup says: *This will remove all the cards in this list
   from the board. To view cards in Archive and bring them back to the board,
   click "Menu" > "Archive".* Its **Archive** button continues.
2. The cards are chosen like
   [Select all cards in this list](Select-All-Cards.md): in the Swimlanes view
   only the cards of the swimlane the list is shown in, otherwise the whole
   list.
3. They are archived by the `archiveSelectedCards` server method
   (`server/models/cards.js`), the same one Multi-Selection's archive uses.

## Server checks

The method refuses the whole selection, before archiving the first card,
when:

- the caller may not write the board;
- a card is not on that board, or is already archived;
- the selection is empty or has more than 5000 cards;
- the caller is an assigned-only member and a card is not
  assigned to them;
- a card's list refuses the caller's role.

A refusal is shown as an alert. Archived cards can be restored from the
[Archive](../Board-Sidebar/Archive/Archive-and-Delete.md).
