# Mail

## What it is

WeKan imports mail as a board for **Board View → Email**, and exports a
board as an `.mbox` file. The import reads an **mbox** (RFC 4155) - the file
Thunderbird, Apple Mail, mutt and Gmail through Google Takeout write - or a
single **.eml** message (RFC 5322 / MIME). Each conversation becomes one card
in the list **Inbox**, with its sender, recipients and subject, so it is mail in
the Email view; the replies become the card's comments.

## Read more

- [Wikipedia: mbox, the mailbox file format](https://en.wikipedia.org/wiki/Mbox)
- [Wikipedia: email](https://en.wikipedia.org/wiki/Email)
- [RFC 4155 - the application/mbox media type](https://www.rfc-editor.org/rfc/rfc4155)
- [RFC 5322 - Internet Message Format](https://www.rfc-editor.org/rfc/rfc5322)
- [mailparser](https://nodemailer.com/extras/mailparser)

## How to use it

Each task has its own steps below: importing one board, importing many
boards at once, exporting one board, exporting all boards at once, and the
same from a script through the REST API.

### How to import

1. Get the file: in Thunderbird, save the folder with an add-on such as
   ImportExportTools NG as `.mbox`, or save one message as `.eml`; in Apple
   Mail, **Mailbox → Export Mailbox**; from Gmail, use
   [Google Takeout](../Google-Takeout/README.md) (**Mail**) and take the
   `.mbox` from the zip; mutt and other Unix mail programs keep mbox files
   already.
2. In WeKan, go to **All Boards → Add Board → Import → Import board → Mail (mbox, .eml)**.
3. Choose the `.mbox` or `.eml` file, or paste its text.
4. Map the senders to WeKan members, or leave them as they are: a sender who
   is not mapped is named at the start of the comment.
5. Click **Import**, and read the loss report.

### How to import many boards at once

1. On the import page, choose **Mail (mbox, .eml)**, then under **Import many boards**
   choose several files, or one `.zip` that holds them.
2. Each file becomes its own board. The boards are imported without member
   mapping; members can be mapped later.

Mail is imported through the generalized importer
(`models/kanboardCreator.js`), so the page also has the checkbox **One board
per project**: each swimlane the import would create becomes its own board.

From a script:

```bash
python3 api.py importboardsfrom mail FILE_OR_DIR ...
```

### How to export

1. Open the board, then **Board Settings → Export**.
2. Under the tools, choose **Mail (mbox)**. The board downloads as
   `<board>.mbox`.
3. Open it in Thunderbird (ImportExportTools NG), Apple Mail (**File → Import
   Mailboxes**) or mutt.

Each card is a message from its creator, with the title as the subject and the
description as the text; its comments follow as replies (`In-Reply-To`). A card
that came from mail keeps its sender, recipients and Message-ID - unless Admin
Panel anonymizes exports, which leaves them out because they name people.

### How to export all boards at once

1. In WeKan, go to **All Boards**, open the sidebar and choose **Export all
   boards**, then **Mail (mbox)**.
2. One `.zip` downloads, with one `.mbox` file per board you can export.

From a script:

```bash
python3 api.py exportallboards mbox boards.zip
```

### REST API

- Import: `POST /api/boards/import/mail` with the file's text, or a
  `.zip` as `{ "zipBase64": "..." }`, as for every source of the import page.
- Export: `GET /api/boards/:boardId/export/mbox`.

## How the numbers are calculated

The limits and conversions of this format, from its own code:

- The mbox file: at most 268,435,456 characters (256 MB of text). More stops the
  import with an error. (`MAX_MBOX_LENGTH` in
  [models/lib/mboxSplit.js](../../../../../../models/lib/mboxSplit.js#L5))
- At most 20,000 messages. Anything past it is left out. (`MAX_MAIL_MESSAGES` in
  [models/lib/mboxSplit.js](../../../../../../models/lib/mboxSplit.js#L6))
- One mail message: at most 32 MB. Anything past it is left out.
  (`MAX_MESSAGE_BYTES` in
  [server/lib/mailImport.js](../../../../../../server/lib/mailImport.js#L12))
- One message's text is cut to 100,000 characters (its HTML is read up to ten
  times that). (`MAX_TEXT` in
  [server/lib/mailImport.js](../../../../../../server/lib/mailImport.js#L13))

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
[models/lib/mailFormat.js](../../../../../../models/lib/mailFormat.js),
[models/lib/mboxSplit.js](../../../../../../models/lib/mboxSplit.js),
[server/lib/mailImport.js](../../../../../../server/lib/mailImport.js).

The tests that pin it:
[tests/mailFormat.test.cjs](../../../../../../tests/mailFormat.test.cjs).

The details of the format, what is kept and how it is tested are below.

### Format details

- **mbox**: messages separated by a `From ` line; a body line starting `From `
  is escaped as `>From ` (mboxrd) and unescaped when read
  (`models/lib/mboxSplit.js`).
- **MIME** is decoded on the server with mailparser
  (`server/lib/mailImport.js`): encoded words, quoted-printable, base64,
  multipart. An HTML-only message is read as its text with htmlparser2;
  scripts and styles are dropped and no markup is kept.
- **Threads** join by `Message-ID`, `In-Reply-To` and `References`
  (`models/lib/mailFormat.js`). The first message is the card, the later ones
  its comments, oldest first.
- **Gmail labels** (`X-Gmail-Labels`) become labels; Inbox, Unread, Opened,
  Important, Starred, Sent, Spam, Trash and the categories are mail state, not
  labels. A conversation labelled **Sent** is outgoing mail, in the Email view's
  Sent folder.

### What is kept

Subject, text, sender, To and Cc, date (the received date), Message-IDs of the thread (so a later reply sent to the board joins it), Gmail labels, replies as comments by their sender.

### What is not kept

Attachments (counted in the loss report), Bcc, HTML formatting, and mail headers other than the ones above. At most 20,000 messages are read from one file. What was left out is listed in the import's loss report, also in
**Admin Panel → Problems → Recovery**.

### How it is built and tested

`tests/mailFormat.test.cjs` decodes an mbox with a thread, an encoded subject, Gmail labels and an HTML-only message with mailparser, checks that a malformed sender or a header injection does not become mail, sends the result through the import sanitizer, and exports a board to `.mbox` and reads it back.

## Commits

 - [Import and export Azure DevOps Boards, Microsoft Lists, Project, Outlook, Teams and OneNote](https://github.com/wekan/wekan/commit/01e88410cd7440b26c5f845d98ae058f93c16a85)
 - [The .mbox export carries the card labels as Gmail's; the round trip of every export checks labels and due dates](https://github.com/wekan/wekan/commit/c0b3d9013d68ae4ac787655183233935766c5997)
 - [WeKan and Trello .zip imports use the shared upload, limit and disk check; .mbox and .enex export a page at a time](https://github.com/wekan/wekan/commit/3b1c7ce7bb430834e024d7684734f7586a07b007)
 - [Import page uploads stream to the server's disk, checked against the free space and an Admin Panel limit](https://github.com/wekan/wekan/commit/32c24ed84e9d6c8080e89bdd4097f87a3b0b4b04)
 - [Import and export mail, calendars, chats and notes: mbox/.eml, iCalendar, Google Takeout, Slack, Mattermost, Telegram ](https://github.com/wekan/wekan/commit/ccfa6cf362e9b1eb812804d38e4d85653c5b0b0a)
