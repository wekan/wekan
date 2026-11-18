# Card menu / Set color

Card menu (☰ in the opened card's header, **Card Actions**) → **Set color**
opens the card's colour popup (`setCardColorPopup` in
`client/components/cards/cardDetails.jade`).

## Who sees it

Somebody who may change the card (`canModifyCard`, which includes the
card's [list permission](../Lists/List-Permissions.md)), and who is not a
**Worker**.

## The popup

| Control | What it does |
| --- | --- |
| Palette | the named colours (`ALLOWED_COLORS`) except white; the current one has a check mark |
| Custom swatches | the custom `#rrggbb` colours already used by cards of this board |
| **Custom color** | the browser's colour wheel ([#5514](https://github.com/wekan/wekan/issues/5514)) |
| **Save** | saves the chosen colour on the card |
| **Remove** | removes the card's colour |

## Where it shows

- On the minicard and in the opened card's header, unless **Card color** is
  turned off for that place in
  [Board Settings / Card](../Board-Sidebar/Board-Settings/Card.md)
  (`allowsCardColorOnMinicard`, `allowsCardColorOnCard`).

A card without a colour of its own can be shown in its list's colour; see
[List menu / Set Color](../Lists/Set-Color.md). The card's own colour always
wins.

Several cards can be coloured at once from
[Multi-Selection](../General/Multi-Selection.md).
