# Action items

## What it is

Meeting notes pasted into a comment or a description often end with who does
what. WeKan finds those lines - by their shape, without AI - and turns them
into cards, each in the same list as the card the notes are on and linking
back to it.

These lines are action items:

| Line | Card | Member |
| --- | --- | --- |
| `TODO: Book the venue` | Book the venue | - |
| `- [ ] Order the badges` | Order the badges | - |
| `@alice Send the agenda` | Send the agenda | alice |
| `TODO: @bob Check the budget` | Check the budget | bob |

A mention becomes a member only when that user is an active member of the
board; otherwise the name stays in the title.

## Read more

- [Action item](https://en.wikipedia.org/wiki/Action_item) and
  [Minutes](https://en.wikipedia.org/wiki/Minutes) on Wikipedia - the "who
  does what" lines of meeting notes.
- [Task list items](https://github.github.com/gfm/#task-list-items-extension-)
  in the GitHub Flavored Markdown specification - the `- [ ]` lines.
- In WeKan: [Checklist or subtasks from the description](Checklist-From-Description.md),
  [Comment replies](Comment-Replies-And-Editing-Restriction.md) and
  [Helpers that need no AI](../Assistants/README.md).

## How to use it

**From a comment**

1. Post a comment with action items, for example pasted meeting notes.
2. The comment's line gets **Create cards from action items**, beside
   **Reply** (for board members).
3. Click it. The **Action items** popup lists the cards to be made, each with
   a tick, and the member a mention found.
4. Untick the lines you do not want and click **Create**.

**From the description**

1. Write the action items into the card's description.
2. Open the card's hamburger menu (**Card Actions**). Under **Appearance**,
   **Create cards from action items** is there for those who may edit the
   card.
3. Untick what you do not want and click **Create**.

The new cards go to the top of the card's own list, in its swimlane, in the
order the lines were written. Each new card's description is *From* and a
link to the card the line came from.

**Hide it**

1. Board Settings / **Card**, the **Comments** section's **Action items** row
   (*Show on Card*).
2. A site admin hides it on every board from Admin Panel / Settings /
   Features / **Card fields**.

## How the numbers are calculated

From [models/lib/actionItems.js](../../../models/lib/actionItems.js):

- At most **50** action items are taken from one text (`MAX_ITEMS`); the rest
  are ignored.
- A title is cut at **500** characters (`MAX_TITLE`); a line that is empty
  after its marker is skipped.
- Lines inside a fenced code block (```` ``` ```` or `~~~`) are never action
  items.
- New cards get `sort` values one below the list's current first card, then
  one below that, so they land above every existing card in the order written
  ([client/components/cards/fromText.js](../../../client/components/cards/fromText.js)).
  Each gets the board's next card number.

## How it works in WeKan

- [models/lib/actionItems.js](../../../models/lib/actionItems.js) is pure:
  `actionItems(text, usernames)` returns `[{ title, username }]`. A line is
  an action item when it starts (after an optional `-`, `*` or `+` bullet)
  with `TODO:` (any case), with an empty task box `[ ]`, or with an
  `@username`. A leading mention becomes the member only when the username
  is in `usernames`, the board's active members.
- [client/components/cards/fromText.js](../../../client/components/cards/fromText.js)
  and [fromText.jade](../../../client/components/cards/fromText.jade): the
  `actionItemsOf` helper (a comment, a card's description, or a menu's card;
  the real card of a linked card), the `actionItemsPopup` preview and its
  **Create**, which inserts each card with `Cards.insertAsync` through the
  same rules the card's own forms use.
- [client/components/activities/comments.jade](../../../client/components/activities/comments.jade) /
  [comments.js](../../../client/components/activities/comments.js) draw the
  comment's entry, and
  [client/components/cards/cardDetails.jade](../../../client/components/cards/cardDetails.jade) /
  [cardDetails.js](../../../client/components/cards/cardDetails.js) the card
  menu's.
- The board flag is `allowsActionItemsOnCard`, on by default
  ([models/lib/cardSettingsRows.js](../../../models/lib/cardSettingsRows.js),
  row `actionItems`), and the Admin Panel overlay is
  [models/lib/cardFieldVisibility.js](../../../models/lib/cardFieldVisibility.js).
- Tests: [tests/actionItems.test.cjs](../../../tests/actionItems.test.cjs).

## Commits

 - [Action items of a comment or a description become cards](https://github.com/wekan/wekan/commit/3cb089b8cab48c217da27195f5a489af13bcaff2)
