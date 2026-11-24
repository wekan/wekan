# Multiline titles and creating several items

## What it is

A title can have several lines. When you add a card, list, swimlane or board you
choose whether the lines stay one title with line breaks, or whether each line
becomes an item of its own - paste ten lines, get ten cards.

## Read more

- [Newline](https://en.wikipedia.org/wiki/Newline) on Wikipedia.
- WeKan pages: [Boards](../All-Boards/README.md),
  [Cards](../Cards/README.md), [Lists](../Lists/README.md),
  [Swimlanes](../Swimlanes/README.md).

## How to use it

Every new card, list, swimlane and board title field has an always-visible
**Add many lines as:** radio group directly below it, even before typing:

- **1 Card**, **1 List**, **1 Swimlane** or **1 Board** keeps the whole text as one title
  containing line breaks. This is the default.
- **Many Cards**, **Many Lists**, **Many Swimlanes** or **Many Boards** creates
  a separate item from each nonempty line.
  Blank lines are skipped and pasted order is preserved.

For example:

1. Paste:

   ```text
   Plan the work
   Build the feature
   Check the result
   ```

2. Choose **Many Cards** to create three cards, or **1 Card** to keep a
   three-line title. The same choice applies to lists, swimlanes and boards.
3. Use the form's Add/Save button to submit. Card creation keeps the selected
   labels, members and other creation options. Wait for creation to finish
   before submitting again.

List and swimlane rename fields also accept line breaks. Renaming always edits
the existing item; it does not split it into multiple items. Multiline names
are displayed in list/swimlane headers as well as on minicards.

Boards are created sequentially; the last board opens after the batch completes.
Each board uses the creation settings, including a selected workspace and the
existing default-template or starred-board flow.

## How the numbers are calculated

From [models/lib/multilineTitles.js](../../../models/lib/multilineTitles.js):

- **Lines.** The text is split at `\r\n`, `\r` or `\n`; each line is trimmed and
  empty lines are dropped (`splitTitleLines()`), so the number of items is the
  number of non-blank lines. With **1 ...** the whole text, with `\r\n` turned
  into `\n` and trimmed, is one title (`creationTitles()`).
- **Order.** `titleSortIndexes(previous, next, count)` gives the new items sort
  values between their neighbours: `0 .. count-1` on an empty list;
  `next - count + i` before the first item; `previous + i + 1` after the last;
  and between two items `previous + (next - previous) * (i + 1) / (count + 1)`,
  evenly spaced.

## How it works in WeKan

- The radio group is the `multilineTitleChoice` template in
  [client/components/forms/multilineTitleChoice.jade](../../../client/components/forms/multilineTitleChoice.jade)
  (`add-many-lines-as`, and `many-items` for "Many ..."), included by every
  new-item form.
- The forms create the items one after another with the sort values above.
- Tests: [tests/multilineTitles.test.cjs](../../../tests/multilineTitles.test.cjs).

## Commits

 - [Always show the one-or-many choice, and create boards in batches](https://github.com/wekan/wekan/commit/cdc0722b15cd954d0eaccd235fe01f6b42537c74)
 - [Create cards, lists and swimlanes from multiline titles](https://github.com/wekan/wekan/commit/552ac0855aa64d8b9a6a9292b6da286bb08c83bb)
