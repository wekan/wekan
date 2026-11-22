# Board key: card numbers like DEV-7

## What it is

Every board has a **key**, and a card's number is shown with it: `DEV-7`
instead of `#7` (#2449, #2450). This is the way Jira and other trackers name
issues, so a card can be named in a chat, a commit message or an email
unambiguously.

## Read more

- [Jira (software)](https://en.wikipedia.org/wiki/Jira_(software)) on
  Wikipedia - the issue keys like `DEV-7` this follows.
- [Issue tracking system](https://en.wikipedia.org/wiki/Issue_tracking_system)
  - why every item gets a short, unique name.
- In WeKan: [the header](../Header.md), [Search](../../Board-Header/Search.md).

## How to use it

1. Open the board. As a board admin, click the board's title in the header bar;
   the rename popup opens.
2. Edit **Board key** (2 to 10 capital letters and digits, starting with a
   letter) and save. A key another board uses, or one that is not a key, is
   refused with the reason, and the popup stays open.
3. Name cards as `KEY-number`, e.g. `DEV-7`, in chats, commits and e-mails.
4. To find a card, type `DEV-7` (any case) in the board's search.

- **What a key is:** 2 to 10 capital letters and digits, starting with a letter,
  and used by no other board on the same WeKan.
- **New boards** get a key suggested from the title. A title of several words
  gives its initials ("Development Team" → `DT`); a single word gives its start
  ("Marketing" → `MARK`); a title without Latin letters gives `BOARD`. A number
  is added when the key is taken (`DT2`).
- **Existing boards** get a key the first time the server starts after the
  upgrade, in the background.
- **Changing it:** a board admin opens the board's title (the rename popup)
  and edits **Board key**. A key another board uses, or one that is not a key,
  is refused with the reason, and the popup stays open. A key change only
  changes how numbers are shown; the numbers themselves stay the same.
- **Finding a card:** typing `DEV-7` in the board's search finds that card.
  Lower case works too.

## How the numbers are calculated

All in [models/lib/boardKey.js](../../../../models/lib/boardKey.js):

- **A valid key** matches `^[A-Z][A-Z0-9]{1,9}$`: 2 to 10 characters.
- **A suggested key** is made from the title after removing accents and taking
  the Latin letters and digits in upper case: with two or more words starting
  with a letter, their initials, at most 6; with one word, its first 4
  characters; a base of one letter gets a `B` added; with no such word, `BOARD`.
- **A taken key** gets a number from 2 up (`DT2`, `DT3` ...), with the base cut
  short so that key and number stay within 10 characters. Many boards at once
  (`planBoardKeys`) remember the next number per base instead of counting up
  from 2 each time.
- **The card number** is the board's own counter, given out atomically; it is
  shown as `KEY-number`, or `#number` while a board has no valid key
  (`formatCardKey`).

## How it works in WeKan

Each board's card numbers are kept by the board itself (an atomic counter), so
they are safe with several servers. Keys are given out by one queue on each
server. With several servers starting new boards at the same moment, the same
key could in theory be suggested twice; a board admin then changes one of
them.

Code: `models/lib/boardKey.js`, `server/boardKeys.js`, `models/cards.js`
(`getCardKey`). Tests: `tests/boardKey.test.cjs` and the runtime suite
`server/lib/tests/boardKeys.tests.js`. The key field is in `boardChangeTitlePopup`
([client/components/boards/boardHeader.jade](../../../../client/components/boards/boardHeader.jade)).

## Commits

 - [The board key backfill uses the key index](https://github.com/wekan/wekan/commit/abc23a7eda42e32c7e7e59f8e59fc024806fb470)
 - [Give old boards their keys in one pass, not one query per board](https://github.com/wekan/wekan/commit/d0378f33c204410ffb2a1380310e21be7bfa2d70)
 - [Board keys and card numbers like DEV-7, with editing for everyone, per-list permissions and shared labels](https://github.com/wekan/wekan/commit/7595727917d436ea71969d6d74d166b42b38ed4e)
