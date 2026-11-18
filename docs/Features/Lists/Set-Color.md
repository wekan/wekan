# List menu / Set Color

List menu (☰ in the list header) → **Set Color** opens **Choose a color**
(`setListColorPopup` in `client/components/lists/listHeader.jade`).

## Who sees it

The entry is shown to a board member who is not **Comment only**, **Read
only**, **Read assigned only** or **Worker**. The list menu itself is not
shown to the first three of those roles.

## The popup

| Control | What it does |
| --- | --- |
| Palette | picks one of the named colours (`LIST_COLORS`, `models/metadata/colors.js`); the current one has a check mark, and a list without a colour shows **white** as selected |
| **Custom color** | the browser's colour wheel; the chosen `#rrggbb` value is kept as a custom colour ([#5514](https://github.com/wekan/wekan/issues/5514)) |
| **Cards without a colour of their own use this colour** | a checkbox ([#4756](https://github.com/wekan/wekan/issues/4756)), see below |
| **Save** | saves the colour and the checkbox together |
| **Remove** | removes the list's colour |

## What it changes

- The colour is saved on the list (`list.color`, `setColor` in
  `models/lists.js`). A value that is neither a palette colour nor a valid hex
  colour is saved as no colour.
- The list header is drawn in that colour: a palette colour by its CSS class,
  a custom colour inline with a readable text colour.
- With the checkbox on (`list.cardsUseListColor`), a card that has no colour
  of its own is shown in the list's colour. Nothing is written to the card:
  dragging it to another list changes the colour it is shown in. A card's own
  colour always wins, and white counts as no colour
  (`models/lib/cardDisplayColor.js`).

Changing a list's colour is not one of the writes a
[list permission](List-Permissions.md) exception refuses.

## Related

- [Card menu / Set color](../Cards/Set-Color.md)
- [Swimlane menu / Select Color](../Swimlanes/Select-Color.md)
