# Microsoft Outlook

## What it is

WeKan imports mail saved from [Microsoft Outlook](https://www.microsoft.com/microsoft-365/outlook)
as `.msg` files, and exports a board as `.eml` messages Outlook opens. The mail
shows in **Board View → Email**.

## Read more

- [Wikipedia: Microsoft Outlook](https://en.wikipedia.org/wiki/Microsoft_Outlook)
- [\[MS-CFB\]: Compound File Binary File Format](https://learn.microsoft.com/openspecs/windows_protocols/ms-cfb/53989ce4-7b05-4f8d-829b-d08d6148375b)
- [\[MS-OXMSG\]: Outlook Item (.msg) File Format](https://learn.microsoft.com/openspecs/exchange_server_protocols/ms-oxmsg/b046868c-9fbf-41ae-9ffb-8de2bd4eec82)
- [\[MS-OXPROPS\]: Exchange Server Protocols Master Property List](https://learn.microsoft.com/openspecs/exchange_server_protocols/ms-oxprops/f6ab1613-aefe-447d-a49c-18217230b148)

## How to use it

Each task has its own steps below: importing one board, importing many
boards at once, exporting one board, exporting all boards at once, and the
same from a script through the REST API.

### How to import

1. In Outlook (classic), drag a message to a folder on your computer, or choose
   **File → Save As** with the type **Outlook Message Format (\*.msg)**. Put
   several in a `.zip` to import them together; `.eml` files may be in the same
   `.zip`.
2. In WeKan, go to **All Boards → Add Board → Import → Import board → Microsoft Outlook (.msg)**.
3. Choose the `.msg` or the `.zip` file.
4. Map the people to WeKan members, or leave them as they are.
5. Click **Import**.

### How to import many boards at once

1. On the import page, choose **Microsoft Outlook**, then under **Import many boards**
   choose several files.
2. Each file becomes its own board. The boards are imported without member
   mapping; members can be mapped later.

Microsoft Outlook is imported through the generalized importer
(`models/kanboardCreator.js`), so the page also has the checkbox **One board
per project**.

From a script:

```bash
python3 api.py importboardsfrom outlook FILE_OR_DIR ...
```

### How to export

1. Open the board, then **Board Settings → Export**, and choose **Microsoft
   Outlook (.eml)**. The board downloads as `<board>.zip`.
2. Unpack it and open an `.eml` in Outlook, or drag the files into an Outlook
   folder.

A card is a message, and each of its comments a reply to it - the messages of
the **Mail (mbox)** export, one per file. A card that came from mail keeps its
sender, recipients and Message-ID.

### How to export all boards at once

1. In WeKan, go to **All Boards**, open the sidebar and choose **Export all
   boards**, then **Microsoft Outlook (.eml)**.
2. One `.zip` downloads, with one `.zip` per board you can export.

From a script:

```bash
python3 api.py exportallboards outlook boards.zip
```

### REST API

- Import: `POST /api/boards/import/outlook` with `{ "binaryBase64": "..." }` for a `.msg`, or `{ "zipBase64": "..." }` for a `.zip`.
- Export: `GET /api/boards/:boardId/export/outlook`.

## How the numbers are calculated

The limits and conversions of this format, from its own code:

- One .msg file: at most 64 MB. More stops the import with an error.
  (`MAX_MSG_BYTES` in
  [models/lib/outlookMsgFormat.js](../../../../../../models/lib/outlookMsgFormat.js#L30))
- One attachment of a .msg file: at most 32 MB. (`MAX_MSG_ATTACHMENT_BYTES` in
  [models/lib/outlookMsgFormat.js](../../../../../../models/lib/outlookMsgFormat.js#L31))
- The compound-file metadata of a .msg file: at most 64 MB. More stops the
  import with an error. (`MAX_CFB_METADATA_BYTES` in
  [models/lib/outlookMsgFormat.js](../../../../../../models/lib/outlookMsgFormat.js#L271))
- The compound file is read in pieces of up to 64 KB. (`RUN_BYTES` in
  [models/lib/outlookMsgFormat.js](../../../../../../models/lib/outlookMsgFormat.js#L272))
- A text property (subject, sender and so on) is read up to 1 MB. (`SMALL_PROP`
  in
  [models/lib/outlookMsgFormat.js](../../../../../../models/lib/outlookMsgFormat.js#L416))

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
[models/lib/mailFormat.js](../../../../../../models/lib/mailFormat.js),
[models/lib/outlookMsgFormat.js](../../../../../../models/lib/outlookMsgFormat.js).

The tests that pin it:
[tests/outlookMsg.test.cjs](../../../../../../tests/outlookMsg.test.cjs).

The details of the format, what is kept and how it is tested are below.

### Format details

A `.msg` is a Compound File Binary file (\[MS-CFB\]): storages and streams in
512- or 4096-byte sectors chained by a FAT, with small streams in a mini stream.
The message (\[MS-OXMSG\]) is its root storage: a stream per property
(`__substg1.0_PPPPTTTT`), the fixed-size properties with the send time, a
storage per recipient and per attachment. WeKan reads it without any library
(`models/lib/outlookMsgFormat.js`): subject, sender (its SMTP address), To and
Cc, the time it was sent, the Message-ID, In-Reply-To and References, the plain
body (or the HTML body as text) and the attachments. The messages then go
through the same mail import as an `.mbox` (`models/lib/mailFormat.js`), so a
reply joins its thread.

### What is kept

Each thread as a card in the list **Inbox**: the first message's subject,
sender, recipients, time and body, the replies as comments, and the messages'
attachments as the card's files.

### What is not kept

An attachment that is itself a message (an embedded `.msg`) and an attachment
larger than 32 MB (counted); the RTF body, categories, flags and reminders.
On export: labels, checklists and attachments. What was left out is listed in the import's loss report, also in
**Admin Panel → Problems → Recovery**.

### How it is built and tested

`tests/outlookMsg.test.cjs` writes `.msg` files with a small Compound File
writer - small streams in the mini stream, a large attachment in FAT sectors -
reads them, threads a reply, reads a `.zip` of `.msg` and `.eml` files, writes
a board as `.eml` files and reads them back, and refuses a file that is not a
Compound File and one whose sector chain loops. The reader was also checked
against `.msg` files saved by Outlook.

## Commits

 - [Attachment slideshow: Outlook .msg and OpenDocument are converted once, a piece at a time, into rows read a screen at a ](https://github.com/wekan/wekan/commit/cd74045a9f453527c6f6eea2ba36bd75c3f955ac)
 - [Attachment slideshow: Markdown, CSV, code, iCalendar, Outlook .msg, tar and OpenDocument](https://github.com/wekan/wekan/commit/6d842a5e2fe7242ade92ca19e2ce5a4f9081485d)
 - [Import and export Sandstorm grain backups](https://github.com/wekan/wekan/commit/6f3f6cc5a83df1b91a40d6afae261a74cf5b6507)
 - [Outlook and OneNote exports: the files are written after the export boundary](https://github.com/wekan/wekan/commit/20c67216fe627eedc72a02c3536aef8024aabb8c)
 - [Import and export Azure DevOps Boards, Microsoft Lists, Project, Outlook, Teams and OneNote](https://github.com/wekan/wekan/commit/01e88410cd7440b26c5f845d98ae058f93c16a85)
 - [The .mbox export carries the card labels as Gmail's; the round trip of every export checks labels and due dates](https://github.com/wekan/wekan/commit/c0b3d9013d68ae4ac787655183233935766c5997)
 - [Import and export mail, calendars, chats and notes: mbox/.eml, iCalendar, Google Takeout, Slack, Mattermost, Telegram ](https://github.com/wekan/wekan/commit/ccfa6cf362e9b1eb812804d38e4d85653c5b0b0a)
