# Card menu / Create board from this card

Turns the card into a link to a **new board**: WeKan creates a board, and the card
becomes a linked-board card that opens it. The card itself is converted, not
copied - its title stays, and nothing else on it changes.

## Using it

1. Open the card, then its hamburger menu.
2. **Create board from this card** opens a popup with the new board's **name**,
   filled in with the card's title.
3. Press **Create board from this card**. The new board is created with you as
   its admin and a default swimlane, and the card now opens that board.

If the server refuses, the reason is shown and nothing changes.

## Who sees it

The entry is drawn only when:

- board creation is allowed for you (Admin Panel / People / Login can let only
  admins create boards - [CreateBleed](https://wekan.fi/hall-of-fame/createbleed/)),
  and
- the menu's write section is shown to you and you are not a Worker.

In the current template the entry also sits under `unless canModifyCard`, so a
member who can edit the card does not see it - see TODO.md.

## What the server checks

`createBoardFromCard` (`server/models/cards.js`): the card exists, is not
archived and is not already a link or a template; you may write on its board; an
assigned-only member converts only a card assigned to them; the card's list does
not refuse your role ([List permissions](../Lists/List-Permissions.md)); and you
may create boards. The new board is private unless the source board is open, and
always private when the instance allows private boards only.

## Related

- [Link to board](Link-To-Board.md) - link a card to an EXISTING board.
- [Card menu](README.md)
