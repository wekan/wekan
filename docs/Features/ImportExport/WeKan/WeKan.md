# WeKan JSON and .zip

WeKan's own export is the board as one JSON document, `wekan-board-1.0.0`. It
is the lossless format: it carries what a board has, and importing it makes the
same board again with new ids. It comes in three forms:

- **JSON**: the document, with attachment files as base64 inside it;
- **JSON (without attachments)**: the document without the attachment data;
- **.zip (Attachments)**: the same document as `wekan.json`, with each
  attachment as the file it is under `attachments/`.

On the import page this source is named after the instance's product name, for
example **WeKan**.

## How to import

### A new board, from the import page

1. In the WeKan that has the board, export it as JSON (see How to export).
2. In this WeKan, go to **All Boards → New → Import → WeKan**.
3. Choose the `.json` or `.zip` file under **Choose the export file, or paste its text below:**, or
   paste
   the JSON into the text box. Tick the parts to import.
4. Click **Import**. WeKan then asks you to map the board's members to WeKan
   users. Map them and click **Done**, or click **Import without mapping
   members (map later)**. Members left unmapped are brought in as placeholder
   users, so cards, comments and activities keep the original person.
5. Read the loss report on the import page, if there is one. It is also kept
   in **Admin Panel → Problems → Recovery**.

A `.zip` with attachment files is sent to the server as it is
(`POST /api/import/zip?newBoard=1`), which unpacks it and creates the board
from it. Each attachment file is streamed from the archive into the attachment
storage as the board is made - never held in memory - so its size is limited
only by the upload limit set in **Admin Panel → Attachments → Limits** (none,
when none is set). The upload itself is capped at 5 GB unless
`WEKAN_IMPORT_ZIP_MAX_BYTES` sets another cap. The `.zip` has no member mapping
step; **People in the file** chooses placeholder users or you.

An export that has no lists, swimlanes or cards (from a broken or very old
export) is refused with a request to export the board again, rather than
creating an empty board.

### Into an existing board, swimlane, list or card

1. Open the board, then **Board Settings → Import**. Swimlanes, lists and
   cards have the same **Import** entry in their own menus.
2. Tick the parts to import, then choose a `.json` or `.zip` WeKan export.
   The content is added below that board, swimlane, list or card.

A `.zip` is sent to the server as a file (`POST /api/import/zip`) and its
attachments are streamed into the attachment storage one at a time, so a board
too large for one JSON document still imports.

For pasting a very large JSON on Linux, see
[From previous export](./From-Previous-Export.md).

## How to import many boards at once

- On the import page, under **Import many boards**, choose several WeKan export
  files, or one `.zip` that holds them. Each file becomes its own board,
  imported without member mapping. Members can be mapped later. Click **Import**
  to import them.
- A WeKan `.zip` with attachments is itself one export of one board: to import
  several of them, choose several of those `.zip` files.
- The checkbox **One board per project** is not offered for WeKan exports: each
  WeKan export is already one board, with its own swimlanes.
- From a script:
  `python3 api.py importboardsfrom wekan FILE_OR_DIR ...` takes files,
  directories of files, or `.zip` files.

## How to export

1. In WeKan, open the board, then **Board Settings → Export**. The same
   export is in the menus of a swimlane, a list and a card, for just that
   part.
2. Under **Select what to include:**, tick the parts to export.
3. Under **JSON**, choose one of:
   - **JSON**: one `.json` file, attachments inside as base64;
   - **JSON (without attachments)**: one `.json` file without attachment data,
     for very large boards;
   - **.zip (Attachments)**: a `.zip` with `wekan.json` and the attachment
     files. Use it when the attachments are too large for one JSON document.
4. Import the file into another WeKan as described above.

The Export entry is shown when the server runs with the API enabled
(`WITH_API=true`) and export is not turned off.

## How to export all boards at once

1. **All Boards → sidebar → Export all boards**, then choose **JSON**.
   This downloads one `.zip` with one WeKan JSON file per board you can
   export: boards you are a member of, that are not archived and are not
   templates. A board you may not export is left out and named in
   `skipped.txt` in the `.zip`.
2. To export only some boards, use **Multi-Selection** in the All Boards
   sidebar, select the boards, then **Export**.

From a script: `python3 api.py exportallboards wekan boards.zip`.

For a whole instance, a database backup is the complete copy; see
[Backup](../../../Backup/Backup.md).

## Format details

From the [format coverage](../Format-Coverage.md) design:

- `wekan-board-1.0.0` JSON is the lossless canonical board format. Its ZIP
  form contains the same JSON plus attachment bytes and a manifest. The schema
  version is explicit; readers accept older additive documents, reject unknown
  incompatible major formats, preserve ids only as source references, and
  validate every object, array, date, URL, filename and size before writing.
- The canonical field inventory is board metadata and settings; swimlanes and
  lists with order, archive and color state; cards with text, order, archive,
  dates, people, labels, custom fields, votes, poker, locations and
  dependencies; checklists and items; subtasks and linked cards; comments and
  activities; rules; and attachments with metadata and bytes. Positive
  round-trip tests compare this inventory, while negative tests prove unknown
  executable input and unsafe paths, URLs, formulas and markup are refused or
  neutralized.

What the current code does:

- `models/exporter.js` writes the document: the board's own fields with
  `_format: "wekan-board-1.0.0"`, then `lists`, `cards`, `swimlanes`,
  `customFields`, `comments`, `activities`, `rules`, `triggers`, `actions`,
  `checklists`, `checklistItems`, `subtaskItems`, `attachments` and `users`.
  The Scrum records go with it when Scrum settings are selected.
- `models/server/ExporterZip.js` writes the `.zip`. Its `wekan.json` is the
  same document, byte for byte, as a `.json` export of the same scope, but
  without base64 file data; the attachments are files under `attachments/`.
  Both halves are streamed, so attachments are piped from the file store and
  not held in memory.
- `models/importZip.js` reads a `.zip` upload: the body is streamed to a
  temporary file, entries are opened one at a time, and each attachment is
  written to the default storage the Admin Panel configures. An entry's name
  is never used as a path. With `newBoard=1` (the import page, Import many
  boards, `api.py importboardfrom wekan FILE.zip`) the whole document goes to
  `models/wekanCreator.js`, which streams each attachment file from the
  archive into storage (`server/lib/importAttachmentStream.js`), held to the
  Admin Panel's upload limit.
- `models/wekanCreator.js` creates the board. Members are mapped or brought in
  as placeholder users; then the board and labels, lists, swimlanes, custom
  fields, cards, subtasks, card dependencies, Scrum data, checklists and
  items, activities, triggers, actions and rules, and board backgrounds are
  created in that order.

## What is kept

| WeKan export | WeKan |
| --- | --- |
| Board fields, labels, members, settings | The board, its labels and members (mapped or placeholder users) |
| `swimlanes`, `lists` | Swimlanes and lists, with order, archive and color |
| `cards` | Cards with text, order, archive, dates, people, labels, custom fields, votes, poker, locations and dependencies |
| `customFields` | Custom fields |
| `checklists`, `checklistItems` | Checklists and items |
| `subtaskItems`, parent links | Subtasks |
| `comments` | Comments |
| `activities` | Activities |
| `rules`, `triggers`, `actions` | Rules |
| `attachments` (base64 in JSON, files in .zip) | Attachments, in the default storage |
| Scrum records | Sprints, releases and Scrum settings |
| Board background attachments | Board background |

## What is not kept

- **JSON (without attachments)** leaves out the attachment data, so its
  attachments have no files.
- Parts not ticked under **Select what to include:** are left out of the
  export, or out of the import.
- Ids are kept only as source references: the imported board, its cards and
  everything else get new ids.

Older WeKan versions used other database schemas. For moving data from them,
see [Migrating from old WeKan manually](./Migrating-from-old-Wekan-manually.md)
and the [history of schema migration systems](./History-of-Schema-Migrations-Systems.md).

## REST API

```bash
python3 api.py importboardfrom wekan board.json               # POST /api/boards/import/wekan
python3 api.py importboardsfrom wekan a.json b.zip dir/       # one board per file
python3 api.py exportallboards wekan boards.zip               # GET /api/export-all-boards/wekan?authToken=TOKEN
```

- `GET /api/boards/:boardId/export?authToken=TOKEN` exports the JSON.
  `&attachments=false` leaves out the attachment data. `&fields=a,b,c`
  selects the parts, and `swimlaneId`, `listId`, `cardId` or `checklistId`
  export only that part of the board.
- `GET /api/boards/:boardId/exportZip?authToken=TOKEN` exports the `.zip`,
  with the same parameters.
- `POST /api/import/zip?authToken=TOKEN&boardId=BOARDID` imports a `.zip`
  into an existing board, with optional `fields`, `swimlaneId`, `listId`,
  `cardId` and `checklistId`.
- `GET /api/export-all-boards/wekan?authToken=TOKEN&boardIds=ID1,ID2` exports
  only the boards listed.

A public board can be exported without a token.

## How it is built and tested

- `models/exporter.js` and `models/server/ExporterZip.js` write the export;
  `models/export.js` serves the `export` and `exportZip` routes.
- `models/wekanCreator.js` creates a board from it;
  `client/components/import/wekanMembersMapper.js` lists the members to map;
  `models/importZip.js` imports a `.zip`; `models/server/scopedImporter.js`
  imports into an existing board, swimlane, list or card.
- `models/lib/exportFields.js` is the one list of parts the export and import
  selection offers.
- Unit tests: `tests/wekanCreator.import.test.js`,
  `tests/wekanCreator.inconsistent.test.js`, `tests/boardJsonStream.test.cjs`,
  `tests/exporterBackpressure.test.cjs`, `tests/exportZipArchiverApi.test.cjs`,
  `tests/boardExportScope.test.cjs` and `tests/scopedImport.test.cjs`.
- Playwright, in `tests/playwright/specs/`:
  `21-import-without-mapping.e2e.js` (importing without mapping, and a legacy
  Sandstorm export imports privately),
  `import-export-format-audit.e2e.js` (a WeKan JSON import keeps each card's
  creation date; a Trello import's JSON round trip),
  `scrum-native-export.e2e.js` and `scrum-native-import.e2e.js` (Scrum records
  through the native export and import).

## Sources

- [Format coverage](../Format-Coverage.md): the canonical format and its field
  inventory
- `models/exporter.js`, `models/server/ExporterZip.js` and
  `models/importZip.js`: the document and the archive layout

## More

- [From previous export](./From-Previous-Export.md): pasting a big JSON on
  Linux, exporting very large boards without attachments, and JSON to SQLite.
- [Migrating from old WeKan manually](./Migrating-from-old-Wekan-manually.md)
- [History of schema migration systems](./History-of-Schema-Migrations-Systems.md)
- [Delete a board](./Delete-Board.md): move it to the Archive, then delete it
  from All Boards → Archive.
- [example-input.txt](./example-input.txt) and the import page
  [screenshot](./wekan-import-board.png).

See also: [format coverage](../Format-Coverage.md),
[all formats](../External-Tools.md).
