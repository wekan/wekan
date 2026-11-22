# Suggested members

## What it is

The **Members** and **Assignees** popups of a card show, above the full member
list, up to three **Suggested** members: the people who usually handle cards
like this one on this board. "Like this one" means sharing labels, the list or
the swimlane with it. It is what other kanban tools sell as an AI-suggested
assignee, done here with plain points and no AI service.

## Read more

- Wikipedia: [Recommender system](https://en.wikipedia.org/wiki/Recommender_system)
  and [Kanban board](https://en.wikipedia.org/wiki/Kanban_board).
- In WeKan: [Board Settings / Card](../Board-Sidebar/Board-Settings/Card.md),
  [Admin Panel / Settings / Features](../Admin-Panel/Settings/Features.md) and
  the other [helpers that need no AI](../General/Assistants/Assistants.md).

## How to use it

1. Open a card.
2. Click **+** beside **Members** (or beside **Assignee**) to open its popup.
3. Above the board's member list, the **Suggested** heading lists up to three
   people. Click one to add them, as clicking them in the full list does.

A Worker sees no member list, and so no suggestions, in the Assignees popup.

**Hiding it:**

1. Board sidebar (hamburger menu) → **Board Settings** → **Card**.
2. Untick *Show on Card* in the row **Suggested members**.
3. A site admin hides it on every board from **Admin Panel / Settings /
   Features**, the **Card fields** ticks above the Features **Save**.

## How the numbers are calculated

Every other card of the board that is not archived gives points to its members
and assignees ([models/lib/memberSuggestions.js](../../../models/lib/memberSuggestions.js)):

| The other card shares with this one | Points |
| --- | --- |
| each label | 2 |
| the list | 1 |
| the swimlane | 1 |

- A person who is both a member and an assignee of the other card gets that
  card's points once.
- The three with the most points are suggested; equal points are ordered by
  user id.
- People already on the card (in the Members popup its members, in the
  Assignees popup its assignees) are skipped, and only active members of the
  board are ever offered.
- At most 1,000 of the board's open cards that the browser has are compared
  ([client/lib/suggestedMembers.js](../../../client/lib/suggestedMembers.js)).

## How it works in WeKan

- [models/lib/memberSuggestions.js](../../../models/lib/memberSuggestions.js) -
  pure, no Meteor: `suggestMembers(card, others, activeIds, { field, limit })`,
  with `LIMIT` 3 and `POINTS`.
- [client/lib/suggestedMembers.js](../../../client/lib/suggestedMembers.js) -
  `suggestedMembersFor(card, 'members' | 'assignees')`: reads the board's
  cards from the client cache (a linked card uses its real card), returns
  nothing when the board's `allowsSuggestedMembersOnCard` is `false`.
- Drawn by `cardMembersPopup` and `cardAssigneesPopup` in
  [client/components/cards/cardDetails.jade](../../../client/components/cards/cardDetails.jade),
  with the helpers in [cardDetails.js](../../../client/components/cards/cardDetails.js).
  Adding a suggestion uses the same `js-select-member` / `js-select-assignee`
  handlers, and so the same permission checks, as the full list.
- No server method of its own: the client only ever sees the cards the board
  publication already sent it.
- Tests: [tests/memberSuggestions.test.cjs](../../../tests/memberSuggestions.test.cjs)
  and [tests/cardFieldVisibility.test.cjs](../../../tests/cardFieldVisibility.test.cjs).

## Commits

 - [Suggested members in the Members and Assignees popups](https://github.com/wekan/wekan/commit/083c863fb7f96055fa52f0ed074ddab98494c81b)
