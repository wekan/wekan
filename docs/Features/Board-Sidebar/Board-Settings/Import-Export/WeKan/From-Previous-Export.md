# Import a board from a previous WeKan export

## What it is

A board exported from WeKan as JSON can be imported again, into the same or
another WeKan: the board comes back with its lists, cards and, unless they were
left out, its attachments. These notes cover pasting a very big JSON, exporting
a very large board without its attachments, and reading the JSON into SQLite.

## Read more

- [Wikipedia: JSON](https://en.wikipedia.org/wiki/JSON)
- [WeKan](WeKan.md): the WeKan JSON and .zip formats, import and export
- [xclip](https://github.com/astrand/xclip)
- [SQLite command line](https://sqlite.org/cli.html)

## How to use it

### Paste big JSON in Linux

1. Copy WeKan board JSON to clipboard

```
sudo apt install xclip

cat board.json | xclip -se c
```
2. At some Chromium-based browser, go to All Boards / Add Board / Import /
   Import board, and choose **WeKan**. (This used to be your username / All
   Boards / New Board / From Previous Export.)

3. At input field, right click / Paste as Text.

4. Click Import.

### Exporting very large boards (without attachments)

By default a board's JSON export includes its attachments as base64 data. For very
large boards this can overflow the JSON serializer, so there is an option to export
the board's **structure without the base64 attachment data**:

```
GET /api/boards/:boardId/export?attachments=false
```

The board export menu has a matching **Export / JSON - without attachments** entry.
The default export (no `attachments=false`) still includes the attachments.

### JSON to SQLite3

```
sqlite3 wekan.db

.mode json

.load wekan-export-board.json board
```

To be continued

## How the numbers are calculated

- **Attachments**: by default the JSON export carries every attachment as
  base64; `?attachments=false` (`json-no-attachments` in the export menu)
  leaves them out, so a very large board's structure can still be exported
  (#5870, [models/export.js](../../../../../../models/export.js)).
- **Import size**: a WeKan board document read from a `.zip` may be at most
  256 MB ([models/importZip.js](../../../../../../models/importZip.js)); the
  import's deadline is that of every import (see [WeKan](WeKan.md)).

## How it works in WeKan

The export is `GET /api/boards/:boardId/export` in
[models/export.js](../../../../../../models/export.js); the import page sends
the pasted JSON to the `importBoard` method in
[models/import.js](../../../../../../models/import.js), and
[models/wekanCreator.js](../../../../../../models/wekanCreator.js) creates the
board from it.

## Commits

 - [Export big boards: an optional JSON export without base64 attachments (#5870)](https://github.com/wekan/wekan/commit/c1752c5fbaf1f0b7640f9797c187fe6ba2dcc85f)
 - [Add the docs from the wekan.wiki, this page among them](https://github.com/wekan/wekan/commit/73ae73d4c38640e9daedbe8ef9e5b25b877ee804)
