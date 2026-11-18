# Card menu / More

Card menu (☰ in the opened card's header, **Card Actions**) → **More**
opens a popup with the card's link, its parent cards and its creation date
(`cardMorePopup` in `client/components/cards/cardDetails.jade`).

## Who sees it

A user to whom the menu offers its moving and copying entries (helper
`cardMenuWrites`), who is not a **Worker**.

## What it shows

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
