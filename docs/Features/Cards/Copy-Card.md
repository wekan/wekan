# Card menu / Copy Card

Card menu (☰ in the opened card's header, **Card Actions**) → **Copy Card**
makes a copy of the card on this board or another one (`copyCardPopup` in
`client/components/cards/cardDetails.jade`).

## Who sees it

A user to whom the menu offers its moving and copying entries (helper
`cardMenuWrites`: somebody who may change the card, or a member who is not
**Read only** or **Read assigned only**), and who is not a **Worker**.

## The popup

| Field | What it does |
| --- | --- |
| **Title** | the copy's title, prefilled with the card's; an empty title copies nothing |
| **Boards**, **Swimlanes**, **Lists** | the destination, as in [Move Card](Move-Card.md) |
| **Cards**, **Above selected card** / **Below selected card** | where the copy goes; with no card chosen it goes to the bottom |
| **Done** | copies |

The destination is remembered per board, as for Move Card. If the board is
filtered, the copy is added to the filter's exceptions so it does not vanish
at once ([#80](https://github.com/wekan/wekan/issues/80)).

## Server checks

The copy is made by the `copyCard` server method (`server/models/cards.js`).
It refuses when you are not signed in, not a member of the source board, an
assigned-only member copying a card not assigned to you, without write
access to the destination board, or when the destination list's
[permission](../Lists/List-Permissions.md) refuses your role. On another
board, labels are matched by name.

## Related

- [Copy Template to Many Cards](Copy-Template-To-Many-Cards.md)
- [Save as Template](../All-Boards/Templates.md)
