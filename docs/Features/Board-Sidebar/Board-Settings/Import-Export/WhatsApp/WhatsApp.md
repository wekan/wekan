# WhatsApp

## What it is

WeKan imports a WhatsApp chat export `.txt` as a board for **Board View →
Chat**: the chat is a card and its messages are the card's comments.

## Read more

- [Wikipedia: WhatsApp, the messaging app](https://en.wikipedia.org/wiki/WhatsApp)
- [WhatsApp Help: How to export your chat history](https://faq.whatsapp.com/1180414079177245)

## How to use it

Each task has its own steps below: importing one board, importing many
boards at once, exporting one board, exporting all boards at once, and the
same from a script through the REST API.

### How to import

1. In WhatsApp, open the chat, then **⋮ → More → Export chat** (iPhone:
   the chat's name → **Export Chat**), choose **Without media**, and save the
   `.txt` file.
2. In WeKan, go to **All Boards → Add Board → Import → Import board → WhatsApp**.
3. Choose the `.txt` file, or paste its text.
4. Map the senders to WeKan members, or leave them as they are.
5. Click **Import**.

### How to import many boards at once

1. On the import page, choose **WhatsApp**, then under **Import many boards**
   choose several files, or one `.zip` that holds them.
2. Each file becomes its own board. The boards are imported without member
   mapping; members can be mapped later.

WhatsApp is imported through the generalized importer
(`models/kanboardCreator.js`), so the page also has the checkbox **One board
per project**: each swimlane the import would create becomes its own board.

From a script:

```bash
python3 api.py importboardsfrom whatsapp FILE_OR_DIR ...
```

### How to export

WhatsApp has no import of its own for a file WeKan could write, so WeKan does not export to it. Export the board in another format, for example [WeKan JSON](../WeKan/WeKan.md).

### How to export all boards at once

WhatsApp has no import of its own for a file WeKan could write, so WeKan does not export to it. Export the board in another format, for example [WeKan JSON](../WeKan/WeKan.md).

### REST API

- Import: `POST /api/boards/import/whatsapp` with the file's text, or a
  `.zip` as `{ "zipBase64": "..." }`, as for every source of the import page.

## How the numbers are calculated

The limits and conversions of this format, from its own code:

- At most 200,000 messages. Anything past it is left out. (`MAX_CHAT_MESSAGES`
  in
  [models/lib/chatExportFormats.js](../../../../../../models/lib/chatExportFormats.js#L38))
- The chat export text: at most 134,217,728 characters (128 MB of text). More
  stops the import with an error. (`MAX_CHAT_TEXT_LENGTH` in
  [models/lib/chatExportFormats.js](../../../../../../models/lib/chatExportFormats.js#L39))

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

This format's own code:
[models/lib/chatExportFormats.js](../../../../../../models/lib/chatExportFormats.js).

The tests that pin it:
[tests/chatExportFormats.test.cjs](../../../../../../tests/chatExportFormats.test.cjs).

The details of the format, what is kept and how it is tested are below.

### Format details

One line per message in the phone's date format: Android
`16/11/2026, 10:00 - Name: text`, iPhone `[16/11/2026, 10:00:00] Name: text`,
with dots or slashes, 12- or 24-hour time, and Finnish `klo`
(`models/lib/chatExportFormats.js`). A line without a date continues the
message above it. Day and month are read day first unless a day number over 12
shows the month comes first. The times have no time zone in the file and are
read as UTC. A chat of more than two people goes to **Groups**.

### What is kept

Every message with its sender and time, multi-line messages.

### What is not kept

Media (`<Media omitted>`, attached files - counted), system lines such as the encryption notice. What was left out is listed in the import's loss report, also in
**Admin Panel → Problems → Recovery**.

### How it is built and tested

`tests/chatExportFormats.test.cjs` reads Android, US (AM/PM) and iPhone lines, multi-line messages, system lines and media, and refuses text with no dated line.

## Commits

 - [Import and export mail, calendars, chats and notes: mbox/.eml, iCalendar, Google Takeout, Slack, Mattermost, Telegram ](https://github.com/wekan/wekan/commit/ccfa6cf362e9b1eb812804d38e4d85653c5b0b0a)
