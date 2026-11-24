# Rocket.Chat

## What it is

WeKan imports a Rocket.Chat export as a board for **Board View → Chat**, and
exports a board as the `.zip` Rocket.Chat's own CSV importer reads. A room is a
card and its messages are the card's comments.

## Read more

- [Wikipedia: Rocket.Chat, the chat app](https://en.wikipedia.org/wiki/Rocket.Chat)
- [Rocket.Chat data export source](https://github.com/RocketChat/Rocket.Chat/tree/develop/apps/meteor/server/lib/dataExport)
- [Rocket.Chat CSV importer source](https://github.com/RocketChat/Rocket.Chat/blob/develop/apps/meteor/server/lib/import/csv/CsvImporter.ts)

## How to use it

Each task has its own steps below: importing one board, importing many
boards at once, exporting one board, exporting all boards at once, and the
same from a script through the REST API.

### How to import

1. In Rocket.Chat, open your avatar → **Account → Preferences → My Data**, and
   choose **Export my data** with **Export as JSON**. Rocket.Chat e-mails a link
   to the `.zip`. (One room: the room's kebab menu → **Export messages** as a
   file in JSON gives that room's `.json`.)
2. In WeKan, go to **All Boards → Add Board → Import → Import board → Rocket.Chat**.
3. Choose the `.zip`, or one room's `.json`, or paste that file's text. The
   `.zip` Rocket.Chat's CSV importer reads (as WeKan exports it) is read too.
4. Map the authors to WeKan members, or leave them as they are.
5. Click **Import**.

### How to import many boards at once

1. On the import page, choose **Rocket.Chat**, then under **Import many boards**
   choose several files.
2. Each file becomes its own board. The boards are imported without member
   mapping; members can be mapped later.

Rocket.Chat is imported through the generalized importer
(`models/kanboardCreator.js`), so the page also has the checkbox **One board
per project**: each swimlane the import would create becomes its own board.

From a script:

```bash
python3 api.py importboardsfrom rocketchat FILE_OR_DIR ...
```

### How to export

1. Open the board, then **Board Settings → Export**, and choose
   **Rocket.Chat**. The board downloads as `<board>.zip`.
2. In Rocket.Chat, go to **Administration → Workspace → Import → Import new
   file**, choose **CSV**, and upload the `.zip`.

The zip holds `users.csv`, `channels.csv` and a `<channel>/messages.csv` per
card. A card is a public channel, named in the letters Rocket.Chat accepts by
default (`[0-9a-zA-Z-_.]`), and its description and comments are the channel's
messages, by their author at their time. Each author is a user with the address
`<username>@wekan.invalid`, so the import never joins them to existing accounts
by e-mail.

### How to export all boards at once

1. In WeKan, go to **All Boards**, open the sidebar and choose **Export all
   boards**, then **Rocket.Chat**.
2. One `.zip` downloads, with one Rocket.Chat `.zip` per board you can export.

From a script:

```bash
python3 api.py exportallboards rocketchat boards.zip
```

### REST API

- Import: `POST /api/boards/import/rocketchat` with one room's `.json` text, or
  a `.zip` as `{ "zipBase64": "..." }`.
- Export: `GET /api/boards/:boardId/export/rocketchat`.

## How the numbers are calculated

The limits and conversions of this format, from its own code:

- At most 200,000 messages. Anything past it is left out. (`MAX_CHAT_MESSAGES`
  in
  [models/lib/chatExportFormats.js](../../../../../../models/lib/chatExportFormats.js#L38))
- The chat export text: at most 134,217,728 characters (128 MB of text). More
  stops the import with an error. (`MAX_CHAT_TEXT_LENGTH` in
  [models/lib/chatExportFormats.js](../../../../../../models/lib/chatExportFormats.js#L39))
- The .zip file: at most 128 MB. More stops the import with an error.
  (`MAX_ZIP_BYTES` in
  [server/lib/chatArchives.js](../../../../../../server/lib/chatArchives.js#L17))
- At most 50,000 files in the archive. More stops the import with an error.
  (`MAX_ZIP_ENTRIES` in
  [server/lib/chatArchives.js](../../../../../../server/lib/chatArchives.js#L18))
- The unpacked .zip contents: at most 256 MB. (`MAX_INFLATED_BYTES` in
  [server/lib/chatArchives.js](../../../../../../server/lib/chatArchives.js#L19))
- One file inside the .zip: at most 128 MB. More stops the import with an error.
  (`MAX_ENTRY_BYTES` in
  [server/lib/chatArchives.js](../../../../../../server/lib/chatArchives.js#L20))

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
[models/lib/chatExportFormats.js](../../../../../../models/lib/chatExportFormats.js),
[server/lib/chatArchives.js](../../../../../../server/lib/chatArchives.js).

The tests that pin it:
[tests/chatExportFormats.test.cjs](../../../../../../tests/chatExportFormats.test.cjs).

The details of the format, what is kept and how it is tested are below.

### Format details

"Download my data" as JSON (`apps/meteor/server/lib/dataExport`):
`channels.json` has a `{ roomId, roomName, type }` line per room, and each room's
`<roomName>.json` beside it has a `{ msg, username, ts, attachments, type }` line
per message; the uploaded files are under `assets/<fileId>-<fileName>`. The CSV
importer's zip (`apps/meteor/server/lib/import/csv/CsvImporter.ts`) has no header
rows: `users.csv` is `username, email, name`, `channels.csv` is
`name, creator, public | private, members a;b`, a channel's folder holds
`username, ts (milliseconds), text`, and `directmessages/` holds
`username, other username, ts, text` (`models/lib/chatExportFormats.js`,
`server/lib/chatArchives.js`).

Rooms become cards: public channels in the list **Channels**, private groups in
**Groups**, direct messages in **Direct messages** (named by their people) and
omnichannel rooms in **Omnichannel**, all in the swimlane **Rocket.Chat**.

### What is kept

Rooms and their kind, messages with author, the user's name from `users.csv`,
and time; the files a message carries when the zip holds them, as the card's
attachments.

### What is not kept

System messages (joins, leaves, topic changes - counted), files the zip does not
hold (counted), threads and reactions, which the export does not write. On
export: a card's list, labels, checklists and attachments, which the CSV
importer has no place for. What was left out is listed in the import's loss
report, also in **Admin Panel → Problems → Recovery**.

### How it is built and tested

`tests/chatExportFormats.test.cjs` reads a "Download my data" zip with a
public, a private and a direct room, a system message and an attached file,
reads the CSV importer's zip with quoted multi-line messages and direct
messages, refuses what is not a Rocket.Chat export, and exports a board and
reads it back - with no header rows and no path outside a channel folder.

## Commits

 - [Import and export Rocket.Chat and Fizzy](https://github.com/wekan/wekan/commit/dffbafd30fd16978dbae49a4e0d576bb1ff017ec)
