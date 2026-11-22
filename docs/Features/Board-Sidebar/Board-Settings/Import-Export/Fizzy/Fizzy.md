# Fizzy

## What it is

WeKan imports a board from [Fizzy](https://github.com/basecamp/fizzy), the
kanban tool of 37signals, and exports a board as the account export Fizzy's own
account import reads.

## Read more

- [Wikipedia: kanban boards](https://en.wikipedia.org/wiki/Kanban_board)
- [Fizzy source](https://github.com/basecamp/fizzy)
- [Fizzy account data transfer](https://github.com/basecamp/fizzy/tree/main/app/models/account/data_transfer)
- [Fizzy card export](https://github.com/basecamp/fizzy/blob/main/app/models/card/exportable.rb)
- [Fizzy exports API](https://github.com/basecamp/fizzy/blob/main/docs/api/sections/exports.md)

## How to use it

Each task has its own steps below: importing one board, importing many
boards at once, exporting one board, exporting all boards at once, and the
same from a script through the REST API.

### How to import

1. In Fizzy, export either:
   - the whole account: **Account settings → Export** (admins and owners), or
   - your own cards: your profile → **Download my data**.
   Fizzy e-mails a link to the `.zip`.
2. In WeKan, go to **All Boards → Add Board → Import → Import board → Fizzy**.
3. Choose the `.zip`, or one card's `.json` from the personal export, or paste
   that file's text.
4. Map the people to WeKan members, or leave them as they are.
5. Click **Import**.

### How to import many boards at once

1. On the import page, choose **Fizzy**, then under **Import many boards**
   choose several files.
2. Each file becomes its own board. The boards are imported without member
   mapping; members can be mapped later.

Fizzy is imported through the generalized importer
(`models/kanboardCreator.js`), so the page also has the checkbox **One board
per project**: each Fizzy board becomes a WeKan board of its own.

From a script:

```bash
python3 api.py importboardsfrom fizzy FILE_OR_DIR ...
```

### How to export

1. Open the board, then **Board Settings → Export**, and choose **Fizzy**. The
   board downloads as `<board>.zip`.
2. In Fizzy, make a new account from the zip with its account import
   (**Import** when signing up an account, or `script/import-account` on a
   server you run).

Each swimlane is a Fizzy board (a board with one swimlane is one Fizzy board
named after it), each list a column in the board's order, and the lists named
**Maybe?**, **Not now** and **Done** are Fizzy's own places of the same names.
An archived card is closed (Done). The account is named after the board. The
people are users of the new account with no e-mail address, so the import never
joins them to existing accounts; every user can open every board.

### How to export all boards at once

1. In WeKan, go to **All Boards**, open the sidebar and choose **Export all
   boards**, then **Fizzy**.
2. One `.zip` downloads, with one Fizzy account export per board you can export.

From a script:

```bash
python3 api.py exportallboards fizzy boards.zip
```

### REST API

- Import: `POST /api/boards/import/fizzy` with one card's `.json` text, or a
  `.zip` as `{ "zipBase64": "..." }`.
- Export: `GET /api/boards/:boardId/export/fizzy`.

## How the numbers are calculated

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
[models/lib/fizzyFormat.js](../../../../../../models/lib/fizzyFormat.js),
[server/lib/fizzyArchive.js](../../../../../../server/lib/fizzyArchive.js).

The tests that pin it:
[tests/fizzyFormat.test.cjs](../../../../../../tests/fizzyFormat.test.cjs),
[tests/playwright/specs/export-import-round-trip.e2e.js](../../../../../../tests/playwright/specs/export-import-round-trip.e2e.js).

The details of the format, what is kept and how it is tested are below.

### Format details

The account export (`app/models/account/data_transfer/*` in Fizzy) holds a row
of each table as `data/<table>/<id>.json` with every column of
`db/schema.rb`, `data/account.json`, the users as `data/users/<id>.json`, rich
text as `data/action_text_rich_texts/<id>.json` and the uploaded files as
`storage/<blob key>`. Ids are UUIDv7 written in base36, 25 characters. The
personal data export (`Card::Exportable`) holds `<number>.json` per card -
number, title, board, status, creator, description (HTML), dates and comments -
and its files under `<number>/<blob key>_<filename>`
(`models/lib/fizzyFormat.js`, `server/lib/fizzyArchive.js`).

A Fizzy board becomes a swimlane; its columns become lists in their position
order, after **Maybe?** (cards not yet triaged into a column) and before
**Not now** (postponed) and **Done** (closed) - the status names Fizzy itself
exports.

### What is kept

Boards, columns, cards with title, description, created date and due date,
tags as labels, assignees as the card's members, the creator as "requested by",
steps as the checklist **Steps**, comments by their author at their time, a
golden card as the colour gold, and the files in a description or a comment
(and a card's image) as attachments.

### What is not kept

Drafts never published (counted), reactions, watchers and pins (counted), and
boosts, events, notifications, webhooks and column colours. On export: users'
e-mail addresses, attachments, and a card's other dates. What was left out is
listed in the import's loss report, also in **Admin Panel → Problems →
Recovery**.

### How it is built and tested

`tests/fizzyFormat.test.cjs` reads an account export with columns out of
order, a triaged, an untriaged, a closed, a postponed and a draft card, tags,
assignments, steps, a comment, an embedded file and a missing one; reads a
personal data export with its files; refuses what is not a Fizzy export and a
file path outside a card's folder; and exports a board, checks every row has
every column Fizzy's import requires, is named by its id and names only users
of the export, and reads it back. The Playwright round trip
(`tests/playwright/specs/export-import-round-trip.e2e.js`) sends it through the
server.

## Commits

 - [Import and export Sandstorm grain backups](https://github.com/wekan/wekan/commit/6f3f6cc5a83df1b91a40d6afae261a74cf5b6507)
 - [Import and export Azure DevOps Boards, Microsoft Lists, Project, Outlook, Teams and OneNote](https://github.com/wekan/wekan/commit/01e88410cd7440b26c5f845d98ae058f93c16a85)
 - [Import and export Rocket.Chat and Fizzy](https://github.com/wekan/wekan/commit/dffbafd30fd16978dbae49a4e0d576bb1ff017ec)
 - [Markdown: #tags, due dates and indented checkboxes are labels, due dates and checklists, both ways](https://github.com/wekan/wekan/commit/10caa20b094beae76ce941e609c7f130e6dd7d5f)
 - [OPML keeps created, category, links and an outliner's own attributes](https://github.com/wekan/wekan/commit/95b88095c45bf582a2fdc3056cf5030f0b61e57a)
 - [Vikunja export is streamed a page of cards at a time, and carries what each task waits for](https://github.com/wekan/wekan/commit/bd34f44460838cfacd10c678d6349f9cc5fd90a0)
 - [Asana, OpenProject, Obsidian and Wrike exports carry what each card waits for](https://github.com/wekan/wekan/commit/c9da13b63e6f1fea86cb30b604093a8a120bcf53)
 - [The .mbox export carries the card labels as Gmail's; the round trip of every export checks labels and due dates](https://github.com/wekan/wekan/commit/c0b3d9013d68ae4ac787655183233935766c5997)
 - [Jira and Taskwarrior exports carry the card dependencies; the round trip of every export checks them](https://github.com/wekan/wekan/commit/d613a00030a7827d4d6318c50d6feb5d80d008ce)
 - [Every export that WeKan also imports is round-tripped in one spec, each held to what its file keeps](https://github.com/wekan/wekan/commit/df92d8de63fa332d9d287c9c97e72ac5596c0f5c)
