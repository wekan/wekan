# Evernote

## What it is

WeKan imports Evernote's `.enex` export as a board, and exports a board as
an `.enex` file that Evernote, Joplin and other note apps import. A note is a
card: its text the description, its to-do checkboxes a checklist, its tags
labels and its reminder the due date.

## Read more

- [Wikipedia: Evernote, the note-taking app](https://en.wikipedia.org/wiki/Evernote)
- [How Evernote's XML export format works](https://evernote.com/blog/how-evernotes-xml-export-format-works)
- [Evernote export DTD](http://xml.evernote.com/pub/evernote-export4.dtd)

## How to use it

Each task has its own steps below: importing one board, importing many
boards at once, exporting one board, exporting all boards at once, and the
same from a script through the REST API.

### How to import

1. In Evernote, select the notes or a notebook, choose **Export**, and save
   as `.enex`.
2. In WeKan, go to **All Boards → Add Board → Import → Import board → Evernote (.enex)**.
3. Choose the `.enex` file, or paste its text.
4. Click **Import**.

### How to import many boards at once

1. On the import page, choose **Evernote (.enex)**, then under **Import many boards**
   choose several files, or one `.zip` that holds them.
2. Each file becomes its own board. The boards are imported without member
   mapping; members can be mapped later.

Evernote is imported through the generalized importer
(`models/kanboardCreator.js`), so the page also has the checkbox **One board
per project**: each swimlane the import would create becomes its own board.

From a script:

```bash
python3 api.py importboardsfrom evernote FILE_OR_DIR ...
```

### How to export

1. Open the board, then **Board Settings → Export**, and choose **Evernote
   (.enex)**. The board downloads as `<board>.enex`.
2. Import it in Evernote (**File → Import → ENEX**) or Joplin (**File →
   Import → ENEX**).

Each card is a note: the description as text, each checklist as a heading and
to-do lines, the comments after a line, the labels and the list as tags, the
due date as the reminder (done when the due date is complete) and the creator
as the author.

### How to export all boards at once

1. In WeKan, go to **All Boards**, open the sidebar and choose **Export all
   boards**, then **Evernote (.enex)**.
2. One `.zip` downloads, with one `.enex` file per board you can export.

From a script:

```bash
python3 api.py exportallboards enex boards.zip
```

### REST API

- Import: `POST /api/boards/import/evernote` with the file's text, or a
  `.zip` as `{ "zipBase64": "..." }`, as for every source of the import page.
- Export: `GET /api/boards/:boardId/export/enex`.

## How the numbers are calculated

The limits and conversions of this format, from its own code:

- The Evernote file: at most 268,435,456 characters (256 MB of text).
  (`MAX_ENEX_LENGTH` in
  [models/lib/enexFormat.js](../../../../../../models/lib/enexFormat.js#L19))
- At most 50,000 notes. Anything past it is left out. (`MAX_ENEX_NOTES` in
  [models/lib/enexFormat.js](../../../../../../models/lib/enexFormat.js#L20))

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
[models/lib/enexFormat.js](../../../../../../models/lib/enexFormat.js),
[server/lib/enexImport.js](../../../../../../server/lib/enexImport.js).

The tests that pin it:
[tests/enexFormat.test.cjs](../../../../../../tests/enexFormat.test.cjs).

The details of the format, what is kept and how it is tested are below.

### Format details

ENEX is XML: `<en-export>` with `<note>`s, each with `title`, `content` (ENML,
XHTML in a CDATA section), `created`, `updated`, `tag`s, `note-attributes`
(`reminder-time`, `reminder-done-time`, `author`, `source-url`) and `resource`s.
The server parses it with htmlparser2 (`server/lib/enexImport.js`) and reads
the content's text, a line per block, each `<en-todo>` marked as a checklist
item; scripts, styles, media and encrypted parts are dropped. A note whose
reminder is done goes to **Done**, the others to **Notes**
(`models/lib/enexFormat.js`).

### What is kept

Title, text, to-dos and whether each is done, tags, created date, reminder and its done time, author, source URL.

### What is not kept

Images and attached files (counted), formatting, encrypted text, notebook stacks. What was left out is listed in the import's loss report, also in
**Admin Panel → Problems → Recovery**.

### How it is built and tested

`tests/enexFormat.test.cjs` reads notes with to-dos, tags, reminders, a script and a resource, refuses a file that is not ENEX, and exports a board - with a `]]>` in its text - and reads it back.

## Commits

 - [Ten more exports are written a page of cards at a time, their references read in a light first pass](https://github.com/wekan/wekan/commit/e2cbbe510457940b6db26c90b45307a6c539a0e7)
 - [WeKan and Trello .zip imports use the shared upload, limit and disk check; .mbox and .enex export a page at a time](https://github.com/wekan/wekan/commit/3b1c7ce7bb430834e024d7684734f7586a07b007)
 - [Import page uploads stream to the server's disk, checked against the free space and an Admin Panel limit](https://github.com/wekan/wekan/commit/32c24ed84e9d6c8080e89bdd4097f87a3b0b4b04)
 - [Import and export mail, calendars, chats and notes: mbox/.eml, iCalendar, Google Takeout, Slack, Mattermost, Telegram ](https://github.com/wekan/wekan/commit/ccfa6cf362e9b1eb812804d38e4d85653c5b0b0a)
