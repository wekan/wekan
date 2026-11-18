# Card menu / Move to Top, Move to Bottom

Card menu (☰ in the opened card's header, **Card Actions**) → **Move to
Top** and **Move to Bottom** move the card to the first or last place of its
own list, in its own swimlane.

## Who sees them

A user to whom the menu offers its moving and copying entries (helper
`cardMenuWrites`: somebody who may change the card, or a member who is not
**Read only** or **Read assigned only**). Workers see them too.

## What happens

- **Move to Top** gives the card a sort number one below the lowest of the
  non-archived cards in the same list and swimlane.
- **Move to Bottom** gives it one above the highest.
- The card stays on the same board, swimlane and list (`card.move`); only
  its order changes. The menu then goes back.

The server still decides whether the move is allowed, including a
[list permission](../Lists/List-Permissions.md) of the card's list.
