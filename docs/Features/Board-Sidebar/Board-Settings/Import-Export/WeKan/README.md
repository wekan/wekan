# WeKan JSON and .zip

## What it is

WeKan's own export is the board as one JSON document, `wekan-board-1.0.0`. It
is the lossless format: it carries what a board has, and importing it makes the
same board again with new ids. It comes in four forms:

- **JSON**: the document, with attachment files as base64 inside it;
- **JSON (without attachments)**: the document without the attachment data;
- **JSON (without archived items)**: the document without the board's archive,
  that is without archived cards, lists or swimlanes, the cards on an archived
  list or swimlane, and their comments, checklists and attachments; for moving
  a board to another WeKan and starting clean there
  ([#6946](https://github.com/wekan/wekan/issues/6946));
- **.zip (Attachments)**: the same document as `wekan.json`, with each
  attachment as the file it is under `attachments/`.

On the import page this source is named after the instance's product name, for
example **WeKan**.

## Read more

- [Wikipedia: WeKan](https://en.wikipedia.org/wiki/Wekan)
- [Format coverage](../Format-Coverage.md): the canonical format and its field
  inventory
- `models/exporter.js`, `models/server/ExporterZip.js` and
  `models/importZip.js`: the document and the archive layout

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

## How to use it

Each task has its own steps below: importing one board, importing many
boards at once, exporting one board, exporting all boards at once, and the
same from a script through the REST API.

### How to import

#### A new board, from the import page

1. In the WeKan that has the board, export it as JSON (see How to export).
2. In this WeKan, go to **All Boards → Add Board → Import → Import board → WeKan**.
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

#### Into an existing board, swimlane, list or card

1. Open the board, then **Board Settings → Import**. Swimlanes, lists and
   cards have the same **Import** entry in their own menus.
2. Tick the parts to import, then choose a `.json` or `.zip` WeKan export.
   The content is added below that board, swimlane, list or card.

A `.zip` is sent to the server as a file (`POST /api/import/zip`) and its
attachments are streamed into the attachment storage one at a time, so a board
too large for one JSON document still imports.

For pasting a very large JSON on Linux, see
[From previous export](./From-Previous-Export.md).

### How to import many boards at once

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

### How to export

1. In WeKan, open the board, then **Board Settings → Export**. The same
   export is in the menus of a swimlane, a list and a card, for just that
   part.
2. Under **Select what to include:**, tick the parts to export.
3. Under **JSON**, choose one of:
   - **JSON**: one `.json` file, attachments inside as base64;
   - **JSON (without attachments)**: one `.json` file without attachment data,
     for very large boards;
   - **JSON (without archived items)**: one `.json` file without the board's
     archive, for moving the board to another WeKan;
   - **.zip (Attachments)**: a `.zip` with `wekan.json` and the attachment
     files. Use it when the attachments are too large for one JSON document.
4. Import the file into another WeKan as described above.

The Export entry is shown when the server runs with the API enabled
(`WITH_API=true`) and export is not turned off.

### How to export all boards at once

1. **All Boards → sidebar → Export all boards**, then choose **JSON**.
   This downloads one `.zip` with one WeKan JSON file per board you can
   export: boards you are a member of, that are not archived and are not
   templates. A board you may not export is left out and named in
   `skipped.txt` in the `.zip`.
2. To export only some boards, use **Multi-Selection** in the All Boards
   sidebar, select the boards, then **Export**.

From a script: `python3 api.py exportallboards wekan boards.zip`.

For a whole instance, a database backup is the complete copy; see
[Backup](../../../../../Backup/Backup.md).

### REST API

```bash
python3 api.py importboardfrom wekan board.json               # POST /api/boards/import/wekan
python3 api.py importboardsfrom wekan a.json b.zip dir/       # one board per file
python3 api.py exportallboards wekan boards.zip               # GET /api/export-all-boards/wekan?authToken=TOKEN
```

- `GET /api/boards/:boardId/export?authToken=TOKEN` exports the JSON.
  `&attachments=false` leaves out the attachment data, `&archived=false` the
  board's archive. `&fields=a,b,c`
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

## How the numbers are calculated

The limits and conversions of this format, from its own code:

- The board document read from a WeKan .zip: at most 256 MB.
  (`MAX_IMPORT_DOCUMENT_BYTES` in
  [models/importZip.js](../../../../../../models/importZip.js#L13))

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
[client/components/import/wekanMembersMapper.js](../../../../../../client/components/import/wekanMembersMapper.js),
[models/importZip.js](../../../../../../models/importZip.js),
[models/lib/wekanBoardFields.js](../../../../../../models/lib/wekanBoardFields.js),
[models/lib/wekanCardFields.js](../../../../../../models/lib/wekanCardFields.js),
[models/lib/wekanRecordFields.js](../../../../../../models/lib/wekanRecordFields.js),
[models/server/ExporterZip.js](../../../../../../models/server/ExporterZip.js),
[models/server/scopedImporter.js](../../../../../../models/server/scopedImporter.js),
[server/lib/importAttachmentStream.js](../../../../../../server/lib/importAttachmentStream.js).

The tests that pin it:
[tests/boardExportScope.test.cjs](../../../../../../tests/boardExportScope.test.cjs),
[tests/boardJsonStream.test.cjs](../../../../../../tests/boardJsonStream.test.cjs),
[tests/exportZipArchiverApi.test.cjs](../../../../../../tests/exportZipArchiverApi.test.cjs),
[tests/exporterBackpressure.test.cjs](../../../../../../tests/exporterBackpressure.test.cjs),
[tests/scopedImport.test.cjs](../../../../../../tests/scopedImport.test.cjs),
[tests/wekanCardFields.test.cjs](../../../../../../tests/wekanCardFields.test.cjs),
[tests/wekanCreator.import.test.js](../../../../../../tests/wekanCreator.import.test.js),
[tests/wekanCreator.inconsistent.test.js](../../../../../../tests/wekanCreator.inconsistent.test.js).

The details of the format, what is kept and how it is tested are below.

### Format details

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

### What is kept

| WeKan export | WeKan |
| --- | --- |
| Board fields, labels, members | The board, its labels and members (mapped or placeholder users) |
| Board Settings | Every one: what a card and a minicard show and in which order, the flow policies, the board views, column sets, WIP limit groups, date format, notification delivery, announcement (`models/lib/wekanBoardFields.js`) |
| `swimlanes`, `lists` | Swimlanes and lists, with order, archive and color; a swimlane's height; a list's WIP limit, flow policy, split into Doing and Done, and its role restrictions |
| `cards` | Cards with text, order, archive, dates and the due date's done tick, people, labels, custom fields, flow fields (Blocked, Class of service, MoSCoW, WSJF), votes and poker by who voted, stickers, locations, drawings, column-set columns, kind, map position, mail headers, recurrence, display settings and dependencies (`models/lib/wekanCardFields.js`) |
| `customFields` | Custom fields, with "admin only", "read only", the card kinds they apply to and the list sum |
| `checklists`, `checklistItems` | Checklists, with their hide settings and reset schedule (counted from the import), and items with their assignee |
| `subtaskItems`, parent links | Subtasks |
| `comments` | Comments, a reply under the comment it answers |
| `activities` | Activities |
| `rules`, `triggers`, `actions` | Rules |
| `attachments` (base64 in JSON, files in .zip) | Attachments, in the default storage. The original is the file; a thumbnail is made from it when it is first shown, so it is not exported |
| `type`: a template board, card, list or swimlane | It stays a template. A user's own Templates board comes as a template board (the importing user's own Templates board stays theirs), and is noted in the loss report |
| Scrum records | Sprints, releases and Scrum settings |
| Board background attachments | Board background |

### What is not kept

- **JSON (without attachments)** leaves out the attachment data, so its
  attachments have no files.
- Parts not ticked under **Select what to include:** are left out of the
  export, or out of the import.
- Ids are kept only as source references: the imported board, its cards and
  everything else get new ids. A user in a vote, a poker card or "blocked by"
  is the mapped user; one who is not on the new board is left out.
- What a file must not decide on its own is left to the new board's admin:
  who may open or edit the board (organizations, teams, email domains, "every
  signed-in user may edit"), whether the board accepts inbound email, and a
  list role exception that lets a role do more than the board's rule (one that
  lets it do less is kept).
- What belongs to the exporting WeKan: the trash, external sync bookkeeping,
  running Pomodoro and flow timers, linked cards and Gantt links to other
  boards, and default boards for subtasks and dates. The two lists, with the
  reason for each field, are `NOT_COPIED` in `models/lib/wekanBoardFields.js`
  and `models/lib/wekanCardFields.js`, and `notCopied` in
  `models/lib/wekanRecordFields.js` for the rest; `tests/wekanCardFields.test.cjs` fails
  when a field of the schema is in neither.
- A Board Settings value this WeKan's schema refuses - from an older or newer
  WeKan - is left at its default and listed in the import's loss report.

Older WeKan versions used other database schemas. For moving data from them,
see [Migrating from old WeKan manually](./Migrating-from-old-Wekan-manually.md)
and the [history of schema migration systems](./History-of-Schema-Migrations-Systems.md).

### How it is built and tested

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

## Commits

 - [Import: a .zip that becomes a new board, and a Trello API import, run as the importing user](https://github.com/wekan/wekan/commit/a7cd22f94ca17a5702fa7f0c81e439c2df03cebc)
 - [Telegram and Discord imports bring their message files: a zipped export folder's photos and files are attachments](https://github.com/wekan/wekan/commit/828ca63713b0a034c9e1c436341cd60435c01443)
 - [WeKan import keeps templates: a template board, card, list or swimlane stays a template](https://github.com/wekan/wekan/commit/a4359731b1bed397e1616dd8289b0d437f8e7243)
 - [WeKan JSON import keeps lists' WIP limits, policies and splits, checklist settings, custom field access, item assignees ](https://github.com/wekan/wekan/commit/24b6b9b0247bf1cda039faec6dba9298f9115116)
 - [WeKan JSON import keeps every board and card field: all Board Settings, flow fields, votes, poker, stickers, drawings](https://github.com/wekan/wekan/commit/c640c5c376526f6550873b757fa6b68511c63d42)
 - [Repeating tasks of other tools repeat in WeKan: daily, weekly and monthly as the card's recurrence](https://github.com/wekan/wekan/commit/24ac6b2bd2e55323fa1c6e52eb53ff3291fc80fb)
 - [Trello .zip export: the Trello board JSON with the cards' attachment files, imported back with them](https://github.com/wekan/wekan/commit/e8330fb090c885c9d8ea015ed896c34a9b6cf251)
 - [JSON exports whose cards are one array are written a page at a time: Trello, Jira, Asana, Zenkit, OpenProject, GitHub ](https://github.com/wekan/wekan/commit/f293ae4076092a387505b1909053cd66a62441c8)
 - [Uploaded JSON is parsed from the file a chunk at a time; a Mattermost export a line at a time](https://github.com/wekan/wekan/commit/640e4925935e3842e00a864057b083b6dc386031)
 - [WeKan and Trello .zip imports use the shared upload, limit and disk check; .mbox and .enex export a page at a time](https://github.com/wekan/wekan/commit/3b1c7ce7bb430834e024d7684734f7586a07b007)
 - [Ask for the columns of a CSV or Excel import, apply Owner, and import WeKan's own Excel export](https://github.com/wekan/wekan/commit/86652c8718abf6a91964d2676b711ef9093829cc)
 - [Import and export boards as Kanri JSON](https://github.com/wekan/wekan/commit/eec53eb322f6cee14b61f1fd1f9d1ca0ee26d74e)
 - [Import and export boards as Taskwarrior JSON](https://github.com/wekan/wekan/commit/f0323140f6f5325c7b2abf4ffb938f456c5d54d7)
 - [Fix ZipBombBleed and the zip import write check](https://github.com/wekan/wekan/commit/e7ed71ee2ec90558abe775a48f17923e449a4d45)
 - [Fix board JSON exports containing HTML card text](https://github.com/wekan/wekan/commit/49eaade957243ec6f83c3d138c044efda5de8747)
 - [Fix board export to .zip (with attachments) answering a bare 500 error](https://github.com/wekan/wekan/commit/f383fe9b3afd31e2ca2b0b0cc11f5057d91fb032)
 - [Add Legacy HTML4 WeKan ZIP imports](https://github.com/wekan/wekan/commit/034d3b92086bee655aed469733e72dd06dec868f)
 - [Stream a .zip import through an upload endpoint instead of the browser](https://github.com/wekan/wekan/commit/fe77b7461e6737a528e953b1080e91f206812b45)
 - [JSON and .zip export at every menu, streamed, from the one export popup](https://github.com/wekan/wekan/commit/b0ca22609905c45c35090d097f46d339fb4a748a)
 - [Stream board exports (JSON, CSV/TSV, Excel) with bounded memory](https://github.com/wekan/wekan/commit/41cd166358ea40a4517eddd02fe1913c22b7777b)
 - [Export big boards: optional JSON export without base64 attachments (#5870)](https://github.com/wekan/wekan/commit/c1752c5fbaf1f0b7640f9797c187fe6ba2dcc85f)
 - [Fix Board Export/Import error. Fix import/clone of inconsistent board JSON so the newest WeKan can import board exports ](https://github.com/wekan/wekan/commit/68e0032c6d3b23a195b4051e2853465965e073dc)
 - [Fix CloneBleed and other security issues. Added more security tests to test suite](https://github.com/wekan/wekan/commit/357de728c03113b787065bac2c5832ad77f1a117)
 - [Fix: Impersonate user can now export Excel/CSV/TSV/JSON. Impersonate user and export Excel/CSV/TSV/JSON is now logged ](https://github.com/wekan/wekan/commit/3908cd5413b775d1ee549f0a95304cf9998d3855)
 - [Included a new route to export (json) an attachment from a board](https://github.com/wekan/wekan/commit/6eb90238b1b1dec4f37a3727ed29ed82d2a43cc6)
 - [Fix Sandstorm export board from web. - Fix Error when logging in to Wekan REST API when using Sandstorm Wekan.   ](https://github.com/wekan/wekan/commit/32f896f19d31f92b5c2e540d0960d00fbf1bf9c3)
 - [Some fixes to Wekan import:   - isCommentOnly and isNoComments are now optional   - Turn off import error checking, so ](https://github.com/wekan/wekan/commit/4cf98134491b5870796de795418000c0a7c3a694)
 - [Fix Wekan import / Export for ChecklistItems](https://github.com/wekan/wekan/commit/30b17ff6c92df07922f875071e864cf688902293)
 - [Fix import wekan board with swimlanes](https://github.com/wekan/wekan/commit/ec0a8449ba98aea708e484d386e5a209e2be8fff)
