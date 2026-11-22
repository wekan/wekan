# Board header / Sort Cards

## What it is

Sort Cards changes the order the cards are shown in inside each list: by due
date, by title, by when they were created, by votes or by the board's label
order. It only changes what **you** see. No card is moved, and turning sorting
off puts the cards back in the order they were dragged into.

## Read more

- [Sorting algorithm](https://en.wikipedia.org/wiki/Sorting_algorithm) and
  [stable sort](https://en.wikipedia.org/wiki/Stable_sort) on Wikipedia - how a
  list is put in order, and why cards with an equal rank keep their manual
  order here.
- [Collation](https://en.wikipedia.org/wiki/Collation) on Wikipedia - the
  ordering of text, as in **Title (Alphabetically)**.
- [Filter](../Board-Sidebar/Filter/README.md) and [Search](Search.md) - the
  other ways to narrow or find cards.

## How to use it

The control after [Watch](Watch.md) in a board's header controls (`fa-sort`).
Its label and tooltip are **Sort Cards**, or **Sort is on** while a sort is
chosen; the button is then emphasised and an **X** beside it (**Remove
sort**) turns sorting off. See [the header](../Header-Bar/Header.md) for its
place in the bar.

**Sort the cards.**

1. Open a board.
2. Click **Sort Cards** in the header bar. The popup opens.
3. Click one of **Due Date**, **Title (Alphabetically)**, **Created At (Newest
   First)**, **Created At (Oldest First)**, **Sort by votes** or **Label
   order**.
4. The popup closes, the cards in each list are shown in that order, and the
   button says **Sort is on**.

**Turn sorting off.**

1. Click the **X** (**Remove sort**) beside **Sort is on**.
2. The cards return to their manual (dragged) order.

Any signed-in user can use it. It changes only how the cards are shown to you:
it is stored in your browser (the `sortBy` Session value, saved to
`localStorage` as `wekan-cards-sortBy` so it survives a reload), not on the
board, and no card's position is changed.

**Change the label order** (for **Label order**): a board admin edits a label
and uses **Move up** / **Move down**.

## How the numbers are calculated

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

- **Field sorts.** The first four are passed to the card cursor as a sort, with
  the card `_id` as a tie-breaker (`sortWithIdTiebreaker`, #6511), so two cards
  with the same value always come in the same order. A card with no due date
  has no `dueAt`, which MongoDB orders before every date.
- **Vote score** = number of positive votes minus number of negative votes
  (`voteScore` in [models/lib/voteSortCards.js](../../../models/lib/voteSortCards.js)).
  Cards are sorted by that score, highest first.
- **Label rank** = the smallest position, in the board's label list, of any of
  the card's labels; a card with none of the board's labels gets infinity and
  goes last (`labelRank` in [models/lib/labelOrder.js](../../../models/lib/labelOrder.js)).
- **Ties.** In both display orders cards with an equal score or rank keep their
  manual order, because the cards are first read in their manual `sort` order
  and then sorted stably.
- **Which cards.** The sort applies to the cards of a list that are loaded; on a
  board that loads cards lazily, that is the list's current window, which grows
  as you scroll (`cardsWithLimit()` in
  [client/components/lists/listBody.js](../../../client/components/lists/listBody.js)).

## How it works in WeKan

- The button, its **X** and the popup are in
  [client/components/boards/boardHeader.jade](../../../client/components/boards/boardHeader.jade)
  (`boardHeaderButtons`, `cardsSortPopup`); their handlers are in
  [client/components/boards/boardHeader.js](../../../client/components/boards/boardHeader.js).
  `setCardsSortBy()` writes the Session value and `localStorage`, and the
  `boardHeaderButtons` template restores it after a reload (#5886).
- **Sort by votes** and **Label order** are display orders computed in
  `cardsWithLimit()` (`client/components/lists/listBody.js`) with
  `models/lib/voteSortCards.js` and `models/lib/labelOrder.js`: the cards are
  read in their manual order and re-sorted in the browser, because a vote score
  is not a stored field (#3050, #2040).
- **Remove sort** clears the stored value, and the cards return to their manual
  (dragged) order.
- Tests: [tests/voteSortCards.test.cjs](../../../tests/voteSortCards.test.cjs),
  [tests/labelOrder.test.cjs](../../../tests/labelOrder.test.cjs),
  [tests/sortCardsByTitle.test.cjs](../../../tests/sortCardsByTitle.test.cjs),
  [tests/headerBars.test.cjs](../../../tests/headerBars.test.cjs) and the browser
  spec [tests/playwright/specs/36-fixed-bug-regressions.e2e.js](../../../tests/playwright/specs/36-fixed-bug-regressions.e2e.js)
  (the sort is remembered after a reload, #5886).

## Related

- [Filter](../Board-Sidebar/Filter/README.md)
- [Search](Search.md)

## Commits

 - [Sort a list by the board's label order](https://github.com/wekan/wekan/commit/cba618e2f94792ad011b66ef0f2e383c5b0cbf30)
 - [Sort by votes floats highly voted cards up](https://github.com/wekan/wekan/commit/fd935f7242addd8a15195b7ae7a0ce7afd95a213)
 - [The board's controls, Sort Cards among them, fold into one caret](https://github.com/wekan/wekan/commit/7d0396ebec899e0ade36d78cf6a19ad8f6fba4ff)
 - [The button shows its name where there is room](https://github.com/wekan/wekan/commit/dfaf196a83dcb015a1f23d34f2eedc5ffcfa5a39)
 - [The chosen sort is remembered across reloads](https://github.com/wekan/wekan/commit/6aad946bc6814702d8877b729fb0b801df43e545)
 - [A browser test that the sort survives a reload](https://github.com/wekan/wekan/commit/90c365787cfa92d1198834758312bdefdb398692)
 - [Sort cards in the mobile view too](https://github.com/wekan/wekan/commit/6f09987b0735bf6a52f2fd3fe9f2f24120f3833b)
 - [Fix the sort cards feature](https://github.com/wekan/wekan/commit/4aad9ca4983a359d28036a2e2be9431179ba9f96)
