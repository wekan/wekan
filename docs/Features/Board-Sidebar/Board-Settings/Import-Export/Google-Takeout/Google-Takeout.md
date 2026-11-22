# Google Takeout

## What it is

WeKan imports a [Google Takeout](https://takeout.google.com) `.zip` as one
board with a swimlane per Google product: **Mail** for Board View → Email,
**Tasks** and **Keep** as cards with their checklists, **Calendar** events and
tasks with their dates for Calendar and Gantt, and **Google Chat** spaces whose
messages are comments for Board View → Chat.

## Read more

- [Wikipedia: Google Takeout](https://en.wikipedia.org/wiki/Google_Takeout)
- [Google Takeout](https://takeout.google.com)
- [Google Tasks API task resource](https://developers.google.com/tasks/reference/rest/v1/tasks)

## How to use it

Each task has its own steps below: importing one board, importing many
boards at once, exporting one board, exporting all boards at once, and the
same from a script through the REST API.

### How to import

1. At [takeout.google.com](https://takeout.google.com), choose **Tasks**,
   **Keep**, **Mail**, **Calendar** and **Google Chat** (any of them), choose
   the `.zip` file type, create the export and download it.
2. In WeKan, go to **All Boards → Add Board → Import → Import board → Google Takeout**.
3. Choose the `.zip` file.
4. Map the people to WeKan members, or leave them as they are.
5. Click **Import**, and read the loss report: it lists the products in the
   zip that have no place on a board.

### How to import many boards at once

1. On the import page, choose **Google Takeout**, then under **Import many boards**
   choose several files, or one `.zip` that holds them.
2. Each file becomes its own board. The boards are imported without member
   mapping; members can be mapped later.

Google Takeout is imported through the generalized importer
(`models/kanboardCreator.js`), so the page also has the checkbox **One board
per project**: each swimlane the import would create becomes its own board.

From a script:

```bash
python3 api.py importboardsfrom googletakeout FILE_OR_DIR ...
```

### How to export

Google Takeout has no import of its own for a file WeKan could write, so WeKan does not export to it. Export the board in another format, for example [WeKan JSON](../WeKan/WeKan.md).

### How to export all boards at once

Google Takeout has no import of its own for a file WeKan could write, so WeKan does not export to it. Export the board in another format, for example [WeKan JSON](../WeKan/WeKan.md).

### REST API

- Import: `POST /api/boards/import/googletakeout` with the file's text, or a
  `.zip` as `{ "zipBase64": "..." }`, as for every source of the import page.

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

This format's own code:
[models/lib/chatExportFormats.js](../../../../../../models/lib/chatExportFormats.js),
[models/lib/googleTakeoutFormat.js](../../../../../../models/lib/googleTakeoutFormat.js),
[server/lib/chatArchives.js](../../../../../../server/lib/chatArchives.js).

The tests that pin it:
[tests/googleTakeoutFormat.test.cjs](../../../../../../tests/googleTakeoutFormat.test.cjs).

The details of the format, what is kept and how it is tested are below.

### Format details

The products are recognised by what a file is, not by its folder name,
which Takeout writes in the account's language (`server/lib/chatArchives.js`):

- a JSON file of `"kind": "tasks#taskLists"` - **Tasks**: task lists become
  lists, tasks cards, with notes, links, due date, completion (tagged `done`)
  and the parent of a subtask;
- a JSON file with `textContent` or `listContent` - a **Keep** note: in the
  list **Notes** or **Archived**, its checklist, labels, color, *pinned* as a
  label; notes in the trash are left out;
- `.mbox` - **Mail**, as [Mail](../Mail/Mail.md) reads it, in **Inbox**, the
  board's first list, which the Email view reads;
- `.ics` - **Calendar**, as [iCalendar](../iCalendar/iCalendar.md) reads it;
- `messages.json` and `group_info.json` of a folder - a **Google Chat** space
  or direct message (`models/lib/chatExportFormats.js`).

The mapping is `models/lib/googleTakeoutFormat.js`.

### What is kept

Everything the products above carry that a card has: titles, text, dates, checklists, labels, colors, the mail fields of the Email view and the messages of the Chat view.

### What is not kept

Other Google products (YouTube, Drive, Photos and the rest, listed in the loss report), attachments and images, Keep notes in the trash. The zip is read within bounds: at most 128 MB, 50,000 files and 256 MB unpacked. What was left out is listed in the import's loss report, also in
**Admin Panel → Problems → Recovery**.

### How it is built and tested

`tests/googleTakeoutFormat.test.cjs` builds a Takeout zip with Finnish folder names and every product, reads it with the server's zip reader and checks each swimlane, the Inbox being first, the trash and the skipped products; and refuses a zip with nothing for a board and a file that is not a zip.

## Commits

 - [Import and export mail, calendars, chats and notes: mbox/.eml, iCalendar, Google Takeout, Slack, Mattermost, Telegram ](https://github.com/wekan/wekan/commit/ccfa6cf362e9b1eb812804d38e4d85653c5b0b0a)
