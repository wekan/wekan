# Board key: card numbers like DEV-7

Every board has a **key**, and a card's number is shown with it: `DEV-7`
instead of `#7` (#2449, #2450). This is the way Jira and other trackers name
issues, so a card can be named in a chat, a commit message or an email
unambiguously.

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

Each board's card numbers are kept by the board itself (an atomic counter), so
they are safe with several servers. Keys are given out by one queue on each
server. With several servers starting new boards at the same moment, the same
key could in theory be suggested twice; a board admin then changes one of
them.

Code: `models/lib/boardKey.js`, `server/boardKeys.js`, `models/cards.js`
(`getCardKey`). Tests: `tests/boardKey.test.cjs` and the runtime suite
`server/lib/tests/boardKeys.tests.js`.
