# Suggested members

The **Members** and **Assignees** popups of a card show, above the full member
list, up to three **Suggested** members: the people who usually handle cards
like this one on this board.

## How they are chosen

Every other card of the board that is not archived gives points to its members
and assignees:

| The other card shares with this one | Points |
| --- | --- |
| each label | 2 |
| the list | 1 |
| the swimlane | 1 |

The three with the most points are suggested, people already on the card are
skipped, and only active members of the board are ever offered. Clicking a
suggestion adds the person, as clicking them in the full list does.

## Hiding it

Board Settings / Card row **Suggested members** (*Show on Card*). A site admin
hides it on every board from Admin Panel / Settings / Visibility / Features /
Card fields.

## Implementation

`models/lib/memberSuggestions.js` (pure: points and ranking), drawn by
`cardMembersPopup` and `cardAssigneesPopup` in
`client/components/cards/cardDetails.jade`. Tests:
`tests/memberSuggestions.test.cjs`.
