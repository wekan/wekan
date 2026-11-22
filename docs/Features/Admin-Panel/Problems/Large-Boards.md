# Large boards: what is loaded, and sizing for 8 GB of RAM

## What it is

A board with thousands of cards opens, and its cards open and close, without
loading the whole board into the browser or into server memory. This page says
what is sent when, and what a server with 8 GB of RAM can expect.
[#6745](https://github.com/wekan/wekan/issues/6745) is where it was measured.

A board with more cards than the threshold is loaded lazily: each list sends
only the cards that are visible and more as it is scrolled, and the counts are
made on the server, so memory grows with what people look at, not with how big
the board is.

## Read more

- [Lazy loading](https://en.wikipedia.org/wiki/Lazy_loading) and
  [Infinite scrolling](https://en.wikipedia.org/wiki/Infinite_scrolling) - load
  only what is shown, and more on scroll.
- [HTTP range requests](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Range_requests) -
  how a download is streamed in parts with `206 Partial Content`.
- [#6745](https://github.com/wekan/wekan/issues/6745) - where it was measured.
- WeKan: [Performance](Performance.md), [RAM usage](RAM-usage.md),
  [CPU usage](CPU-usage.md).

## How to use it

**Pick the card loading mode**

1. Leave it at the default `auto`, or set `CARDS_LOADING` (Snap:
   `sudo snap set wekan cards-loading=...`) to `auto`, `lazy` or `all`.
2. Optionally set `CARDS_LOADING_LAZY_THRESHOLD` to another card count.
3. Restart WeKan, and reload open boards.

| Mode | What the board sends |
| --- | --- |
| `auto` | Up to `CARDS_LOADING_LAZY_THRESHOLD` (default 500) cards: the whole board, as `all` does. Above that: `lazy`. |
| `lazy` | No cards with the board. Each list in each swimlane sends its first window of 10 cards, and 10 more as it is scrolled. |
| `all` | Every card, comment, checklist and attachment record of the board. Only for small boards. |

**Size a server for 8 GB of RAM**

With lazy loading, server memory grows with the number of open board **views**
and the windows they have scrolled through, not with board size. 4 cores and
8 GB of RAM are enough for WeKan, FerretDB (SQLite) and the operating system,
with these settings:

1. Keep `cards-loading` at `auto`, or use `lazy` for every board.
2. Use the filesystem as attachment storage (Admin Panel → Attachments) and
   move existing attachments out of MongoDB or GridFS, so files are not in the
   database.
3. Swap usage that stays high (Admin Panel → Problems →
   [RAM usage](RAM-usage.md)) points at something other than board size. A
   **ferretdb** process using a full CPU core is shown under
   [CPU usage](CPU-usage.md).

## How the numbers are calculated

- **Threshold:** an `auto` board is lazy when its card count is MORE than
  `CARDS_LOADING_LAZY_THRESHOLD` (default 500); 500 cards or fewer load as
  `all`. `0` makes every `auto` board lazy; an invalid or negative value is the
  default (`effectiveBoardCardsMode` and `cardsLoadingLazyThreshold` in
  [models/lib/cardsLoading.js](../../../../models/lib/cardsLoading.js)).
- **Window:** 10 cards per list and swimlane at first, and 10 more each time
  the list is scrolled to its end while it has more cards
  (`InfiniteScrollIter` in
  [client/components/lists/listBody.js](../../../../client/components/lists/listBody.js)).
- **Counts** that cover more than the window, such as list totals, WIP limits
  and the board's Status, are counted on the server (the
  `boardListCardCount` publication, read by
  [client/lib/lazyCards.js](../../../../client/lib/lazyCards.js)).
- **Downloads:** a `Range` request gets `206 Partial Content` with only the
  bytes asked for.
- **The measurements** below are wall-clock times and sizes measured on one
  test board, before and after #6745.

## How it works in WeKan

**What a lazy board sends**

- **With the board:** lists, swimlanes, custom field definitions, members and
  integrations. No cards, comments, checklists, attachment records or comment
  reactions.
- **With each visible list window:** its cards, and what their minicards show:
  - checklists and checklist items
  - attachment records, for the badge and the cover; never file contents
  - the comments' author, time and card. The comment **text** is only sent when
    the board shows comments on minicards.
- **With an opened card:** all of its comments with their text, the reactions
  under them, its attachments, checklists and text notes. They are dropped again
  when the card closes.
- **Counts** that cover more than the window, such as list totals, WIP limits
  and the board's Status, are counted on the server.
- **Activities** are paged, newest first, both for the board sidebar and in a
  card.

On the server, each window only watches which cards belong in it and their sort
keys, plus every field of the cards that are on screen. It does not keep a copy
of every card in the list.

The board publication is
[server/publications/boards.js](../../../../server/publications/boards.js), the
windows are
[server/publications/cardsWindow.js](../../../../server/publications/cardsWindow.js),
and [server/cards-loading.js](../../../../server/cards-loading.js) passes the
mode to the browser as `Meteor.settings.public.cardsLoading`.

**Attachments are streamed**

- **Downloads** (`/cdn/storage/attachments/...`) stream from the filesystem,
  GridFS or S3/Azure/GCS. A `Range` request, such as seeking in a video or
  resuming a download, gets `206 Partial Content` with only the bytes asked for.
- **Moving files to cloud storage** writes the file to a temporary file on disk
  first, then uploads it as a stream. It is not held in memory.
- **Copying a file through the API** checks the API size limit before reading it.
- **Migrating legacy CollectionFS files** streams them.

Admin Panel → Attachments limits (`getAttachmentUploadMaxBytes`) still apply.

**Measured: a 4,000-card board**

The test board had 4 swimlanes, 12 lists, 12,000 comments, 20,000 checklist
items, 4,000 attachment records and 32,000 activities. The database was FerretDB
with SQLite, and the browser was Chromium. Numbers are before and after #6745.

| | Before | After |
| --- | --- | --- |
| Board open, first minicard | 2.0 s | 1.4 s |
| Board open, all windows loaded | 17.6 s | 6.2 s |
| Card open | 0.1 s | 0.1 s |
| Card close | 4.0 s | 0.1 s |
| Recomputations per card open | 7,700 | 976 |
| Sent to the browser on board open | 3.4 MB | 2.7 MB |
| FerretDB memory during board open | 724 MB | 280 MB |

The close took seconds because of how client-side caches were cleaned up when a
card's details were destroyed. The board open was slow because FerretDB read
and decoded whole collections for attachment lookups and for counts. Both are
fixed; see the CHANGELOGs of WeKan and of the FerretDB fork.

Tests: [tests/cardsLoading.test.cjs](../../../../tests/cardsLoading.test.cjs),
[tests/listCardWindow.test.cjs](../../../../tests/listCardWindow.test.cjs),
[tests/playwright/specs/large-board-lazy-loading.e2e.js](../../../../tests/playwright/specs/large-board-lazy-loading.e2e.js)
and [tests/playwright/specs/large-board-card-open.e2e.js](../../../../tests/playwright/specs/large-board-card-open.e2e.js).

## Commits

- [Destination pickers list the cards of a lazily loaded board](https://github.com/wekan/wekan/commit/e46d7a2376ebfa413cec15843d8b7fc374fe63e0)
 - [Large boards fast on 8 GB: load only what is visible, stream big attachments](https://github.com/wekan/wekan/commit/d56bb344904ccf00ab8cf2491fd2ef7cbfe2137b)
 - [Stop the unsaved-edits subscription when the card closes](https://github.com/wekan/wekan/commit/96dff057a1a5ba8de2beb0224ae80108cd78366e)
 - [Snap defaults cards-loading to auto](https://github.com/wekan/wekan/commit/2122214fb61bb557d1339411a6daa25ddff955cb)
 - [Set jQuery UI sortable options only when they changed](https://github.com/wekan/wekan/commit/a0f2550e5d3f9fe711e4a220a9cbb062a9e32d7b)
 - [Clear the popup card Session keys to null instead of deleting them](https://github.com/wekan/wekan/commit/ecbfe59e5067f4a28e788c403f30d3d3fd035658)
 - [Open and close a card by its address without re-creating the board](https://github.com/wekan/wekan/commit/43871850022b8cd9d06df62dc510ed7b2ad88b11)
 - [Read only the user fields each card and list needs](https://github.com/wekan/wekan/commit/6d5f24ee272c5f55c50c591953ec03241a18d72f)
 - [Refresh lazy card windows after card changes](https://github.com/wekan/wekan/commit/29fd503317763487b40c097b74ab19a3d2406a84)
 - [Snapshot lazy card windows on FerretDB](https://github.com/wekan/wekan/commit/35825c5401d4f357a94c82c41bcae73ed127871f)
 - [A filter no longer leaves a spinner over an empty list](https://github.com/wekan/wekan/commit/7d9a2e3037f8fc52b4c0d65b208900d5db5f6cfd)
 - [Adaptive card loading: lazy only for big boards](https://github.com/wekan/wekan/commit/96c7faa87254529cf2531ff2c6027efd136ee753)
 - [Accurate card counters and WIP limits with lazy loading](https://github.com/wekan/wekan/commit/7d5f29e11479be6a3b8393c8817b30620e99a068)
 - [Lazy card loading in the browser](https://github.com/wekan/wekan/commit/09805a8a9185c41c84b2596e2854f209aecf2ac0)
 - [Lazy card loading on the server: windowed publications](https://github.com/wekan/wekan/commit/6f7ad270d124bf961b811743d1b78abf24f8f7e5)
