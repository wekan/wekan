# Similar cards

## What it is

WeKan points out cards that look like the one you are writing or reading, so a
second copy of the same task is noticed before it is made. While you type a
new card's title, the add-card form lists the closest cards of the board; an
opened card has a **Similar cards** section with the cards most like it. A
very close match is marked **Possible duplicate**. It needs no AI service: the
comparison is plain letter arithmetic, done on the server.

## Read more

- Wikipedia: [Sørensen–Dice coefficient](https://en.wikipedia.org/wiki/S%C3%B8rensen%E2%80%93Dice_coefficient),
  [Trigram](https://en.wikipedia.org/wiki/Trigram),
  [N-gram](https://en.wikipedia.org/wiki/N-gram),
  [Approximate string matching](https://en.wikipedia.org/wiki/Approximate_string_matching)
  and [Record linkage](https://en.wikipedia.org/wiki/Record_linkage) (finding
  duplicates).
- In WeKan: [Card fields](Card-Fields.md),
  [Board Settings / Card](../Board-Sidebar/Board-Settings/Card.md),
  [Admin Panel / Settings / Features](../Admin-Panel/Settings/Features.md) and
  the other [helpers that need no AI](../General/Assistants/Assistants.md).

## How to use it

**While adding a card:**

1. Click **Add Card** at the bottom of a list (or **+** in the list header,
   which adds to the top) to open the add-card form.
2. Type the title. After you stop typing for a moment, the form lists up to
   three cards of this board whose titles are close to what you typed, each
   with its list and its similarity in percent; one very close is marked
   **Possible duplicate**.
3. Click a card to open it; the card you were typing is kept.

**In an opened card:**

1. Open a card.
2. The **Similar cards** section lists up to five cards of the same board
   whose title and description are close to this one's, with the list each is
   in, and the heading shows how many there are. A card with no similar card
   has no such section ([Card fields](Card-Fields.md)).
3. Click a card to open it.

**Hiding it:**

1. Board sidebar (hamburger menu) → **Board Settings** → **Card**.
2. In the row **Similar cards**, untick *Show on Minicard* to hide the hint in
   the add-card form, or *Show on Card* to hide the section in the opened card.
3. A site admin hides both on every board from **Admin Panel / Settings /
   Features**, the **Card fields** ticks above the Features **Save**.

## How the numbers are calculated

Both texts are lower-cased, accents and punctuation are removed, and each is cut
into letter triples ("printer" → `pri`, `rin`, `int`, `nte`, `ter`; each word
is padded with a space at both ends, so a short word still has triples). The
similarity is the share of triples the two have in common (the Dice
coefficient, `2 × common / (triples of A + triples of B)`), from 0 to 100 %.
Letters and digits of every script count, so this works the same in Finnish,
Japanese or Arabic. Scripts written without spaces between words - Chinese,
Japanese, Thai and the like - are cut into letter pairs instead, since one
"word" there is a whole phrase.

| Similarity | Shown as |
| --- | --- |
| 80 % and over | Possible duplicate |
| 50 % to 80 % | Similar |
| under 50 % | not shown |

- **In the opened card** the title counts twice as much as the description:
  `(2 × title score + description score) / 3`, and only when both cards have
  a description; otherwise the title score alone.
- **Percent** shown is the score rounded to a whole number.
- **Order**: closest first; equal scores by title.
- **How many**: at most 3 in the add-card form, 5 in the opened card.
- **Limits** ([server/methods/similarCards.js](../../../server/methods/similarCards.js),
  [models/lib/similarCards.js](../../../models/lib/similarCards.js)): a title
  needs at least 3 characters; a typed title is cut at 500 characters and a
  description at 2,000; at most the 5,000 most recently modified cards of the
  board are compared; the form waits 400 ms after the last key before asking;
  the server answers one connection at most 30 times per 10 seconds.

Archived cards, template cards and linked boards are left out. A card you may
not see is never listed: the server applies the same checks as opening the
board, and an assigned-only member is shown only the cards assigned to them.

## How it works in WeKan

- [models/lib/similarCards.js](../../../models/lib/similarCards.js) - pure, no
  Meteor: `normalizeText`, `trigrams`, `dice` and `rankSimilarCards`, with the
  thresholds `SIMILAR` (0.5), `DUPLICATE` (0.8) and `TITLE_WEIGHT` (2).
- [server/methods/similarCards.js](../../../server/methods/similarCards.js) -
  the method `cards.similar(boardId, { title | cardId })`. It checks through
  `boardForCardHelper` ([server/lib/assistGate.js](../../../server/lib/assistGate.js))
  that the caller may read the board, that the board's flag
  (`allowsSimilarCardsOnMinicard` for the form, `allowsSimilarCardsOnCard` for
  the section) is not off and that the Admin Panel card field `similarCards`
  is on; it narrows the cards with `assignedOnlyCardScope`
  ([models/lib/boardCardScope.js](../../../models/lib/boardCardScope.js)) and
  returns `{ _id, title, listTitle, percent, duplicate }` rows.
- [client/components/cards/similarCards.js](../../../client/components/cards/similarCards.js)
  and [similarCards.jade](../../../client/components/cards/similarCards.jade) -
  `similarCardsHint` (the add-card form, used from
  [client/components/lists/listBody.jade](../../../client/components/lists/listBody.jade))
  and `cardSimilarCardsSection` (the opened card, asked again when its title or
  description changes).
- Tests: [tests/similarCards.test.cjs](../../../tests/similarCards.test.cjs)
  and [tests/playwright/specs/assist-similar-cards.e2e.js](../../../tests/playwright/specs/assist-similar-cards.e2e.js).

## Commits

 - [The section is shown only when there are similar cards, inside Card Settings' two panes](https://github.com/wekan/wekan/commit/2bd5d1180a24bde1fb30acfe75617bb4c68f864e)
 - [No empty Similar cards section on an opened card](https://github.com/wekan/wekan/commit/c4f528159bdece7824e1876fda1a30522ab821de)
 - [Similar cards and possible duplicates, in the add-card form and the opened card](https://github.com/wekan/wekan/commit/f8267d704edb96f1ec0da78ae8d44d5e8e0d88bd)
