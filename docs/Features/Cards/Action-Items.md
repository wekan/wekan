# Action items

Meeting notes pasted into a comment or a description often end with who does
what. WeKan finds those lines and turns them into cards.

These lines are action items:

| Line | Card | Member |
| --- | --- | --- |
| `TODO: Book the venue` | Book the venue | - |
| `- [ ] Order the badges` | Order the badges | - |
| `@alice Send the agenda` | Send the agenda | alice |
| `TODO: @bob Check the budget` | Check the budget | bob |

A comment with action items gets **Create cards from action items** on its
line, beside **Reply**; a description with them gets the same entry in the
card's hamburger menu, for those who may edit the card. A preview lists the cards to be made, each with a tick, and **Create**
adds the ticked ones to the top of the card's own list, in its swimlane. Each
new card's description links back to the card the line came from.

A mention becomes a member only when that user is an active member of the
board; otherwise the name stays in the title.

## Hiding it

Board Settings / Card row **Action items** (*Show on Card*). A site admin hides
it on every board from Admin Panel / Settings / Visibility / Features / Card
fields.

## Implementation

`models/lib/actionItems.js` (pure: lines to `{ title, username }`), used by
`client/components/activities/comments.js` and
`client/components/cards/cardDetails.js`. Tests: `tests/actionItems.test.cjs`.
