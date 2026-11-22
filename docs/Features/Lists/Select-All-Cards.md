# List menu / Select all cards in this list

## What it is

List menu (☰ in the list header) → **Select all cards in this list** adds the
list's cards to the board's [Multi-Selection](../General/Multi-Selection.md)
and closes the menu. Whatever the Multi-Selection sidebar offers can then be
done to all of them at once. Selecting changes nothing on the board by itself.

## Read more

- [Selection (user interface)](https://en.wikipedia.org/wiki/Selection_(user_interface))
  on Wikipedia - selecting many items to act on them together.
- [Multi-Selection](../General/Multi-Selection.md) - what can be done to the
  selected cards.
- [List menu / Archive all cards in this list](Archive-All-Cards.md) - the
  same cards, archived in one step.

## How to use it

Who sees it: a board member who is not **Comment only**, **Read only** or
**Read assigned only**, and only when the list has cards.

1. Click ☰ (**List Actions**) in the list header.
2. Under **Edit**, click **Select all cards in this list**.
3. The Multi-Selection sidebar opens with the cards selected; choose what to
   do with them there.

## How the numbers are calculated

The selection is the list's non-archived cards (`list.allCards(swimlaneId)`):

- In the **Swimlanes** board view, a list that belongs to a swimlane selects
  only the cards of that swimlane
  ([#5623](https://github.com/wekan/wekan/issues/5623)). The swimlane is the
  list's own `swimlaneId`; a shared list with no swimlane of its own selects
  the whole list.
- In the other views, every card of the list is selected.

The ids are added to what is already selected (`MultiSelection.add`), so the
count in Multi-Selection is the earlier selection plus these cards.

## How it works in WeKan

- The entry is `a.js-select-cards` in
  [client/components/lists/listHeader.jade](../../../client/components/lists/listHeader.jade),
  shown when `cards.length` is non-zero; the handler
  `'click .js-select-cards'` is in
  [client/components/lists/listHeader.js](../../../client/components/lists/listHeader.js).
- The selection itself is
  [client/lib/multiSelection.js](../../../client/lib/multiSelection.js); it is
  client-side state, nothing is written to the database.
- Test: [tests/listArchiveAllCards3383.test.cjs](../../../tests/listArchiveAllCards3383.test.cjs)
  pins that Archive all cards scopes its cards exactly like this entry.

## Commits

 - [the #5623 unit test follows the doubled-cards fix](https://github.com/wekan/wekan/commit/50a7c8fe59c900036460ca778e222baeef7dcca1)
 - [select all in a list stays within its own swimlane (#5623)](https://github.com/wekan/wekan/commit/300a9751e6694d91b2be19b12762eca97d027629)
 - [the list menu gets its Select all cards entry](https://github.com/wekan/wekan/commit/691c3aff684e945add6a4c1a119094e77fa32e6c)
