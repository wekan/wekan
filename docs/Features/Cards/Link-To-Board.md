# Card menu / Link to board

Card menu (☰ in the opened card's header, **Card Actions**) → **Link to
board** puts a [linked card](Linked-Cards.md) of this card on another,
existing board ([#4281](https://github.com/wekan/wekan/issues/4281);
`linkCardToBoardPopup` in `client/components/cards/cardDetails.jade`).

## Who sees it

Somebody who may change the card (`canModifyCard`) and is not a **Worker**.

## The popup

The same destination picker as [Move Card](Move-Card.md): **Boards**,
**Swimlanes**, **Lists**, **Cards** with **Above selected card** /
**Below selected card**, and **Done**. With no card chosen, the linked card
goes to the bottom of the list. The destination is remembered per board.

## What it creates

A new card of type `cardType-linkedCard` whose `linkedId` points to the
original card (`link` in `models/cards.js`). Its labels are not copied, and
only custom-field values of fields that belong to the destination board are
kept. The original card is not changed. On a filtered board the new card is
added to the filter's exceptions.

The same link is what [Move Card](Move-Card.md)'s **Leave a link at the
original location** leaves behind.
