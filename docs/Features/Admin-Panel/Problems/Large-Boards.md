# Large boards: what is loaded, and sizing for 8 GB of RAM

A board with thousands of cards opens, and its cards open and close, without
loading the whole board into the browser or into server memory. This page says
what is sent when, and what a server with 8 GB of RAM can expect.
[#6745](https://github.com/wekan/wekan/issues/6745) is where it was measured.

## Card loading modes

`CARDS_LOADING` (Snap: `sudo snap set wekan cards-loading=...`) picks the mode.
The default is `auto`.

| Mode | What the board sends |
| --- | --- |
| `auto` | Up to `CARDS_LOADING_LAZY_THRESHOLD` (default 500) cards: the whole board, as `all` does. Above that: `lazy`. |
| `lazy` | No cards with the board. Each list in each swimlane sends its first window of 10 cards, and 10 more as it is scrolled. |
| `all` | Every card, comment, checklist and attachment record of the board. Only for small boards. |

## What a lazy board sends

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

## Attachments are streamed

- **Downloads** (`/cdn/storage/attachments/...`) stream from the filesystem,
  GridFS or S3/Azure/GCS. A `Range` request, such as seeking in a video or
  resuming a download, gets `206 Partial Content` with only the bytes asked for.
- **Moving files to cloud storage** writes the file to a temporary file on disk
  first, then uploads it as a stream. It is not held in memory.
- **Copying a file through the API** checks the API size limit before reading it.
- **Migrating legacy CollectionFS files** streams them.

Admin Panel → Attachments limits (`getAttachmentUploadMaxBytes`) still apply.

## Measured: a 4,000-card board

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

## Sizing for 8 GB of RAM

With lazy loading, server memory grows with the number of open board **views**
and the windows they have scrolled through, not with board size. 4 cores and
8 GB of RAM are enough for WeKan, FerretDB (SQLite) and the operating system,
with these settings:

- Keep `cards-loading` at `auto`, or use `lazy` for every board.
- Use the filesystem as attachment storage (Admin Panel → Attachments) and move
  existing attachments out of MongoDB or GridFS, so files are not in the
  database.
- Swap usage that stays high (Admin Panel → Problems → [RAM usage](RAM-usage.md))
  points at something other than board size. A **ferretdb** process using a full
  CPU core is shown under [CPU usage](CPU-usage.md).
