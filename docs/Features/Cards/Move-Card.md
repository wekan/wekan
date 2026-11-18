# Card menu / Move Card

Card menu (☰ in the opened card's header, **Card Actions**) → **Move Card**
moves the card to another place on this board or to another board
(`moveCardPopup` in `client/components/cards/cardDetails.jade`).

## Who sees it

Only a **board admin**, and only when the menu's moving and copying entries
are offered at all (helper `cardMenuWrites`): to somebody who may change the
card, or to a member who is not **Read only** or **Read assigned only**.

## The popup

| Field | What it does |
| --- | --- |
| **Title** | the card's title; a changed title is saved after the move |
| **Move reason (optional)** | up to 1000 characters, passed with the move |
| **Boards** | the active boards you are an active member of, without your Templates board |
| **Swimlanes**, **Lists** | the destination swimlane and list on that board |
| **Cards**, **Above selected card** / **Below selected card** | where in the list the card goes; with no card chosen it goes to the bottom |
| **Leave a link at the original location** | off by default; when on, a [linked card](Linked-Cards.md) is left where the card was ([#2719](https://github.com/wekan/wekan/issues/2719)) |
| **Done** | moves; disabled until the destination's cards have loaded |

The destination you choose is remembered per board in your profile
(`profile.moveAndCopyDialog`) and offered next time. The same destination
picker (`cardDestinationPicker`) is used by
[Copy Card](Copy-Card.md),
[Copy Template to Many Cards](Copy-Template-To-Many-Cards.md) and
[Link to board](Link-To-Board.md).

## What moves along

A card moved to another board takes its comments, reactions, text note,
checklists and attachments along; see
[Moving a card to another board](Cards.md#moving-a-card-to-another-board).

A [list permission](../Lists/List-Permissions.md) that refuses your role in
the source or the destination list refuses the move. An error is shown in
the popup.
