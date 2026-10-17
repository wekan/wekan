# Similar cards

WeKan points out cards that look like the one you are writing or reading, so a
second copy of the same task is noticed before it is made.

- **While adding a card**, after you stop typing for a moment, the add-card
  form lists up to three cards of this board whose titles are close to what
  you typed. One very close is marked **Possible duplicate**. Click a card to
  open it; the card you were typing is kept.
- **In an opened card**, the **Similar cards** section lists up to five cards
  of the same board whose title and description are close to this one's, with
  the list each is in.

## How close is close

Both texts are lower-cased, accents and punctuation are removed, and each is cut
into letter triples ("printer" → `pri`, `rin`, `int`, `nte`, `ter`). The
similarity is the share of triples the two have in common (the Dice
coefficient), from 0 to 100 %. Letters of every script count, so this works the
same in Finnish, Japanese or Arabic. Scripts written without spaces between
words - Chinese, Japanese, Thai and the like - are cut into letter pairs
instead, since one "word" there is a whole phrase.

| Similarity | Shown as |
| --- | --- |
| 80 % and over | Possible duplicate |
| 50 % to 80 % | Similar |
| under 50 % | not shown |

In the opened card the title counts twice as much as the description. Archived
cards are left out. A card you may not see is never listed: the server applies
the same checks as opening the board, and an assigned-only member is shown
only the cards assigned to them.

## Hiding it

Board Settings / Card row **Similar cards**: *Show on Minicard* is the hint in
the add-card form, *Show on Card* is the section in the opened card. A site
admin hides both on every board from Admin Panel / Settings / Visibility /
Features / Card fields.

## Implementation

`models/lib/similarCards.js` (pure: trigrams, Dice coefficient, ranking) and the
method `cards.similar` in `server/methods/similarCards.js`. Tests:
`tests/similarCards.test.cjs`.
