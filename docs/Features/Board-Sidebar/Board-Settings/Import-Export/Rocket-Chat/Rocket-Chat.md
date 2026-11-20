# Rocket.Chat

WeKan imports a Rocket.Chat export as a board for **Board View → Chat**, and
exports a board as the `.zip` Rocket.Chat's own CSV importer reads. A room is a
card and its messages are the card's comments.

## How to import

1. In Rocket.Chat, open your avatar → **Account → Preferences → My Data**, and
   choose **Export my data** with **Export as JSON**. Rocket.Chat e-mails a link
   to the `.zip`. (One room: the room's kebab menu → **Export messages** as a
   file in JSON gives that room's `.json`.)
2. In WeKan, go to **All Boards → New → Import → Rocket.Chat**.
3. Choose the `.zip`, or one room's `.json`, or paste that file's text. The
   `.zip` Rocket.Chat's CSV importer reads (as WeKan exports it) is read too.
4. Map the authors to WeKan members, or leave them as they are.
5. Click **Import**.

## How to import many boards at once

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

## How to export

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

## How to export all boards at once

1. In WeKan, go to **All Boards**, open the sidebar and choose **Export all
   boards**, then **Rocket.Chat**.
2. One `.zip` downloads, with one Rocket.Chat `.zip` per board you can export.

From a script:

```bash
python3 api.py exportallboards rocketchat boards.zip
```

## Format details

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

## What is kept

Rooms and their kind, messages with author, the user's name from `users.csv`,
and time; the files a message carries when the zip holds them, as the card's
attachments.

## What is not kept

System messages (joins, leaves, topic changes - counted), files the zip does not
hold (counted), threads and reactions, which the export does not write. On
export: a card's list, labels, checklists and attachments, which the CSV
importer has no place for. What was left out is listed in the import's loss
report, also in **Admin Panel → Problems → Recovery**.

## REST API

- Import: `POST /api/boards/import/rocketchat` with one room's `.json` text, or
  a `.zip` as `{ "zipBase64": "..." }`.
- Export: `GET /api/boards/:boardId/export/rocketchat`.

## How it is built and tested

`tests/chatExportFormats.test.cjs` reads a "Download my data" zip with a
public, a private and a direct room, a system message and an attached file,
reads the CSV importer's zip with quoted multi-line messages and direct
messages, refuses what is not a Rocket.Chat export, and exports a board and
reads it back - with no header rows and no path outside a channel folder.

## Sources

- [Rocket.Chat data export source](https://github.com/RocketChat/Rocket.Chat/tree/develop/apps/meteor/server/lib/dataExport)
- [Rocket.Chat CSV importer source](https://github.com/RocketChat/Rocket.Chat/blob/develop/apps/meteor/server/lib/import/csv/CsvImporter.ts)
