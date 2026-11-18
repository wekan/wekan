# Board header / Sort Cards

The control after [Watch](Watch.md) in a board's header controls (`fa-sort`).
Its label and tooltip are **Sort Cards**, or **Sort is on** while a sort is
chosen; the button is then emphasised and an **X** beside it (**Remove
sort**) turns sorting off. See [the header](../Header-Bar/Header.md) for its
place in the bar.

Any signed-in user can use it. It changes only how the cards are shown to you:
it is stored in your browser (the `sortBy` Session value, saved to
`localStorage` as `wekan-cards-sortBy` so it survives a reload), not on the
board, and no card's position is changed.

## The popup

`cardsSortPopup` in `client/components/boards/boardHeader.jade`. Choosing an
entry sorts the cards inside each list and closes the popup.

| Entry | Order |
| --- | --- |
| Due Date | Earliest due date first (`dueAt: 1`). |
| Title (Alphabetically) | Title A to Z (`title: 1`). |
| Created At (Newest First) | Newest card first (`createdAt: -1`). |
| Created At (Oldest First) | Oldest card first (`createdAt: 1`). |
| Sort by votes | Highest vote score (positive minus negative) first. |
| Label order | By the board's label order: a card goes where its first label in that order goes, cards without a label last. |

The first four are passed to the card cursor as a sort, with the card `_id`
as a tie-breaker. **Sort by votes** and **Label order** are display orders
computed in `cardsWithLimit()` (`client/components/lists/listBody.js`) with
`models/lib/voteSortCards.js` and `models/lib/labelOrder.js`; cards with an
equal rank keep their manual order. The board's label order is changed by a
board admin with Move up / Move down when editing a label.

**Remove sort** clears the stored value, and the cards return to their manual
(dragged) order.

## Related

- [Filter](../Board-Sidebar/Filter/README.md)
- [Search](Search.md)
