# Nullboard

WeKan imports and exports a board as a [Nullboard](https://github.com/apankrat/nullboard)
board file (`.nbx`). Despite the extension, the file is plain JSON. Nullboard
has lists of notes and nothing more: a note is free text, so its first line
becomes the card title and the rest the description. A raw note gets the
label `raw`.

## How to import

1. In Nullboard, open the board, open the menu in the top right corner and
   choose **Export this board...**. With no board open, **Export all
   boards...** saves every board in one file.
2. In WeKan, go to **All Boards → New → Import → Nullboard**.
3. Open the `.nbx` file in a text editor, copy all of it and paste it into the
   text box.
4. Click **Import**.
5. Read the loss report on the import page. It is also kept in **Admin Panel →
   Problems → Recovery**.

A file with several boards imports its first board, and reports the others.
To import each of them, use **Import many boards** with one file per board.

## How to import many boards at once

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

## How to export

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

## How to export all boards at once

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

## Format details

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

## What is kept

| Nullboard | WeKan |
| --- | --- |
| Board `title` | Board title |
| List `title` | List |
| Note `text`, first non-blank line | Card title |
| Note `text`, the remaining lines | Card description |
| `raw: true` | Label `raw` |

## What is not kept

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

## REST API

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

## How it is built and tested

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

## Sources

- [Nullboard](https://github.com/apankrat/nullboard): the app
- [nullboard.html](https://github.com/apankrat/nullboard/blob/master/nullboard.html):
  the board format, its importer's checks (`checkImport`), and the menu items
  **Export this board...**, **Export all boards...** and **Import boards...**

See also: [format coverage](../Format-Coverage.md),
[all formats](../External-Tools.md).
