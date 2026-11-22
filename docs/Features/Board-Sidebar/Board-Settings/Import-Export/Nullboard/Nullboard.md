# Nullboard

## What it is

WeKan imports and exports a board as a [Nullboard](https://github.com/apankrat/nullboard)
board file (`.nbx`). Despite the extension, the file is plain JSON. Nullboard
has lists of notes and nothing more: a note is free text, so its first line
becomes the card title and the rest the description. A raw note gets the
label `raw`.

## Read more

- [Wikipedia: kanban boards](https://en.wikipedia.org/wiki/Kanban_board)
- [Nullboard](https://github.com/apankrat/nullboard): the app
- [nullboard.html](https://github.com/apankrat/nullboard/blob/master/nullboard.html):
  the board format, its importer's checks (`checkImport`), and the menu items
  **Export this board...**, **Export all boards...** and **Import boards...**

See also: [format coverage](../Format-Coverage.md),
[all formats](../External-Tools.md).

## How to use it

Each task has its own steps below: importing one board, importing many
boards at once, exporting one board, exporting all boards at once, and the
same from a script through the REST API.

### How to import

1. In Nullboard, open the board, open the menu in the top right corner and
   choose **Export this board...**. With no board open, **Export all
   boards...** saves every board in one file.
2. In WeKan, go to **All Boards → Add Board → Import → Import board → Nullboard**.
3. Open the `.nbx` file in a text editor, copy all of it and paste it into the
   text box.
4. Click **Import**.
5. Read the loss report on the import page. It is also kept in **Admin Panel →
   Problems → Recovery**.

A file with several boards imports its first board, and reports the others.
To import each of them, use **Import many boards** with one file per board.

### How to import many boards at once

1. On the import page, choose **Nullboard**, then under **Import many boards**
   choose several `.nbx` files, or one `.zip` that holds them.
2. Each file becomes its own board. The boards are imported without member
   mapping; members can be mapped later.

Nullboard is imported through the generalized importer
(`models/kanboardCreator.js` via `EXTERNAL_PARSERS` in
`models/lib/externalParsers.js`), so the page also has a checkbox **One board
per project**: each swimlane the import would create becomes its own board,
named after that swimlane. A Nullboard import puts every card in the swimlane
**Default**, so for Nullboard the option makes no difference. An **Export all
boards...** file still imports only its first board; the other boards are
reported, not made into swimlanes.

Links between cards that end up on different boards are reported in the loss
report rather than kept. Nullboard has no links between notes.

From a script:

```bash
python3 api.py importboardsfrom nullboard FILE_OR_DIR ...
```

Each argument is a file, a directory of files, or a `.zip` file.

### How to export

1. In WeKan, open the board, then **Board Settings → Export**.
2. Choose what to include, then under **JSON** choose **Nullboard**. The board
   downloads as `<board>.nbx`.
3. In Nullboard, open the menu in the top right corner and choose **Import
   boards...**, then choose the file.

The id of the exported board is the WeKan board's creation time, the way
Nullboard makes its own ids, so exporting the same board again is offered in
Nullboard as an overwrite of the earlier import.

The Nullboard entry is offered for a whole board only, not for a swimlane or a
list.

### How to export all boards at once

1. In WeKan, go to **All Boards**, open the sidebar and choose **Export all
   boards**, then **Nullboard**.
2. One `.zip` downloads, with one file per board you can export: boards you
   are a member of that are not archived and not templates.

To export only some boards, use **Multi-Selection** in the All Boards
sidebar, select the boards, then **Export**.

From a script:

```bash
python3 api.py exportallboards nullboard boards.zip
```

### REST API

```bash
python3 api.py importboardfrom nullboard board.nbx          # POST /api/boards/import/nullboard
python3 api.py importboardsfrom nullboard FILE_OR_DIR ...   # several boards
python3 api.py exportboardformat BOARDID nullboard board.nbx
python3 api.py exportallboards nullboard boards.zip
```

The HTTP routes:

- `POST /api/boards/import/nullboard` with the file's text as `board`;
- `GET /api/boards/:boardId/export/nullboard?authToken=…` returns the file as
  `application/json`;
- `GET /api/export-all-boards/nullboard?authToken=…` returns the `.zip`; add
  `&boardIds=ID1,ID2` for only those boards.

## How the numbers are calculated

The limits and conversions of this format, from its own code:

- Only Nullboard blob format 20190412 is read; another format is refused, and
  the export writes that format. (`NULLBOARD_FORMAT` in
  [models/lib/nullboardFormat.js](../../../../../../models/lib/nullboardFormat.js#L37))

The numbers every import has, this one included:

- **How long an import may take**: `WEKAN_IMPORT_TIMEOUT_MS` (default 120,000
  ms, two minutes; 0 turns the deadline off) plus 500 ms for each record of the
  file. A record is an item of a top-level array, a line of a text file, or the
  items of all top-level arrays of an object added together
  ([models/lib/importDeadline.js](../../../../../../models/lib/importDeadline.js),
  [models/import.js](../../../../../../models/import.js)).
- **Many boards at once**: at most 500 files and 200 MB together
  (`MAX_MANY_FILES`, `MAX_MANY_BYTES` in
  [models/lib/importManyFiles.js](../../../../../../models/lib/importManyFiles.js)).
- **One board per project**: at most 200 boards from one file
  (`MAX_SPLIT_BOARDS` in
  [models/lib/importSplit.js](../../../../../../models/lib/importSplit.js)).
- **The loss report** counts what was not imported and the warnings, and lists
  the first 20 of them, each cut to 200 characters, then "and N more"
  ([models/lib/importLossReport.js](../../../../../../models/lib/importLossReport.js)).
- **Every document** passes the one import and export boundary: at most 40
  levels deep, 4,000,000 values, 100,000 items in one array and 4 MB in one
  string
  ([models/lib/importExportBoundary.js](../../../../../../models/lib/importExportBoundary.js)).

## How it works in WeKan

An import is sent to the `importBoard` Meteor method in
[models/import.js](../../../../../../models/import.js). It checks the types of
every argument first, refuses a caller who is not logged in (and records that
attempt in Admin Panel → Problems), stops when Admin Panel has turned import off
([models/lib/importExportSecurity.js](../../../../../../models/lib/importExportSecurity.js)),
and asks
[server/lib/boardCreationGuard.js](../../../../../../server/lib/boardCreationGuard.js)
whether this user may create a board; an import into the current board replaces
it only for a board admin. The import sources and their file types are described
once, in
[models/lib/importSources.js](../../../../../../models/lib/importSources.js).

The file is read by this format's parser into one Kanboard-shaped board
(`EXTERNAL_PARSERS` in
[models/lib/externalParsers.js](../../../../../../models/lib/externalParsers.js)),
which [models/kanboardCreator.js](../../../../../../models/kanboardCreator.js)
writes as a WeKan board: the Boards, Swimlanes, Lists, Cards, Checklists,
ChecklistItems, CardComments and Attachments collections.

An export is a GET route of the REST API, the ones listed under REST API above:
a board's export is served by
[models/export.js](../../../../../../models/export.js)
(`/api/boards/:boardId/export/<format>` for the formats of other tools) or by
this format's own code below, and all boards at once by
`/api/export-all-boards/<format>`
([server/routes/exportAllBoards.js](../../../../../../server/routes/exportAllBoards.js)).
They stop first when Admin Panel has turned export off, need a logged-in user,
and export only a board that user may see; a member who sees only the cards
assigned to them gets no board-wide export
([models/lib/exportAccess.js](../../../../../../models/lib/exportAccess.js)).

This format's own code:
[models/lib/nullboardFormat.js](../../../../../../models/lib/nullboardFormat.js).

The tests that pin it:
[tests/boardExportScope.test.cjs](../../../../../../tests/boardExportScope.test.cjs),
[tests/importLossReport.test.cjs](../../../../../../tests/importLossReport.test.cjs),
[tests/nullboardFormat.test.cjs](../../../../../../tests/nullboardFormat.test.cjs),
[tests/playwright/specs/import-export-format-audit.e2e.js](../../../../../../tests/playwright/specs/import-export-format-audit.e2e.js).

The details of the format, what is kept and how it is tested are below.

### Format details

The format is a [Nullboard](https://github.com/apankrat/nullboard) board file
as **Export this board...** or **Export all boards...** writes it: plain JSON
despite the extension. It holds one board

`{format, id, revision, title, lists: [{title, notes: [{text, raw, min}]}]}`

or an array of them. As in Nullboard's own importer, every board needs those
five keys, a non-empty id and revision, and `format` 20190412; anything else
is refused.

What the import must cover:

- lists as lists: a repeated title gets a number, and an empty one is called
  "Untitled list";
- notes as cards: a note is free text, so its first non-blank line is the card
  title and the remaining lines the description;
- a raw note (drawn as a heading inside the list) gets the label `raw`;
- the board title as the board title.

Reported: collapsed notes (`min`, Nullboard's view state; they are imported
expanded), empty notes, and every board after the first in an array, since one
import creates one board.

The export writes one board that Nullboard imports (format 20190412, the
board's creation time as id, revision 1): the title and description as the
note text, each checklist after them as a title line and `[ ]` / `[x]` item
lines, and a card labelled `raw` as a raw note. Nullboard notes are text only,
so other labels, dates, members, comments, custom fields and attachments are
not exported, and checklists come back as description text.

What the current code does (`models/lib/nullboardFormat.js`) agrees with the
above. In addition:

- A repeated list title becomes `<title> (2)`, `<title> (3)` and so on, and
  that is reported.
- A note without text is reported and not imported.
- Without a board title, the board is called "Imported Nullboard".
- Every card goes to the swimlane Default.
- In the export, a blank line separates the description and each checklist
  in the note text. A card whose list is not exported goes to a list of its
  own list's name.
- Archived cards and archived lists are not exported.

### What is kept

| Nullboard | WeKan |
| --- | --- |
| Board `title` | Board title |
| List `title` | List |
| Note `text`, first non-blank line | Card title |
| Note `text`, the remaining lines | Card description |
| `raw: true` | Label `raw` |

### What is not kept

The import reports these on the loss report:

- collapsed notes (`min: true`): they are imported expanded, because a WeKan
  card has no collapsed state;
- empty notes and notes without text;
- a second list with the same title (it is imported under a numbered title);
- `notes` that is not an array;
- every board after the first in an **Export all boards...** file.

A file that fails Nullboard's own checks (missing keys, an empty id or
revision, or another `format`) is refused, and no board is created.

The Nullboard export writes no labels other than `raw`, and no dates,
members, comments, custom fields, swimlanes, card colors or attachments.
Checklists are written into the note text, so they come back as description
text when imported again.

### How it is built and tested

- `models/lib/nullboardFormat.js` reads and writes the board file.
  `models/import.js` sends the text to the parser, and
  `models/kanboardCreator.js` creates the board.
- `tests/nullboardFormat.test.cjs` is the unit test of the round trip.
  `tests/importLossReport.test.cjs` covers the loss report and
  `tests/boardExportScope.test.cjs` the export menu entry.
- The Playwright cases are in
  `tests/playwright/specs/import-export-format-audit.e2e.js`: "Nullboard: a
  .nbx board imports with its lists, notes and raw note", and the export menu
  link for every format.

## Commits

 - [TODO: Plane, Kanri, Obsidian Kanban and Nullboard checked against their current source; Pivotal Tracker is shut down](https://github.com/wekan/wekan/commit/85da7079fb2a2d9f1d8cf9ab8a0e157a217f41d7)
 - [Nullboard exports are written a page at a time, each list around its notes](https://github.com/wekan/wekan/commit/4666bb60f42acbc2b774c1657171636b7b900767)
 - [Read every import source through one path and one file chooser, from one description of the sources](https://github.com/wekan/wekan/commit/c80a656901103bfd29b41843c7e255b4ed3bfa17)
 - [Import and export many boards at once for every format, and document each format in its own directory](https://github.com/wekan/wekan/commit/7858d84e127c2c6cd92134166352b9a4245d4ec2)
 - [Import and export boards as Nullboard .nbx files](https://github.com/wekan/wekan/commit/2725f7a2aa61d8c661abf3a278756afa6e4f4ede)
