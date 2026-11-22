# Notion

## What it is

WeKan imports a [Notion](https://www.notion.com) database as a board, from
Notion's **Markdown & CSV** export: the `.zip` file, or one database CSV from
it. Rows become cards, the Status column becomes the lists, and each row's
page text becomes the card description. WeKan exports a board as the CSV file
that Notion's own CSV import, and a database's **Merge with CSV**, read.

## Read more

- [Wikipedia: Notion, the productivity app](https://en.wikipedia.org/wiki/Notion_(productivity_software))
- [Export your content](https://www.notion.com/help/export-your-content):
  the Markdown & CSV export, its views, subpages and folders
- [Import data into Notion](https://www.notion.com/help/import-data-into-notion):
  the CSV import, Merge with CSV, the header row, UTF-8 and the date format

See also the [format coverage table](../Format-Coverage.md) and
[all formats](../External-Tools.md).

## How to use it

Each task has its own steps below: importing one board, importing many
boards at once, exporting one board, exporting all boards at once, and the
same from a script through the REST API.

### How to import

1. In Notion, open the database as a full page.
2. Click **•••** at the top right, choose **Export**, and pick
   **Markdown & CSV**. Turn on **Include subpages** to get the row pages, and
   click **Export**. Notion downloads a `.zip` file.
3. In WeKan, go to **All Boards → Add Board → Import → Import board → Notion**.
4. Choose the `.zip` file, or one database `.csv` file from it. You can also
   paste the text of one database CSV into the text box.
5. Click **Import**. Notion's people are not mapped to WeKan users here;
   members can be mapped later.
6. Read the loss report on the import page. It is also kept in **Admin Panel →
   Problems → Recovery**.

Notion exports only the database's current view or its default view, not all
views. On Windows, turning off **Create folders for subpages** keeps the file
paths short; WeKan reads both layouts.

### How to import many boards at once

On the import page, under **Import many boards**, choose several export
files, or one `.zip` that holds them. Each file becomes its own board,
imported without member mapping (members can be mapped later).

Notion's Markdown & CSV export `.zip` is itself one board, not a set of
boards: to import several databases as several boards, choose several of
those `.zip` files.

Notion is imported through the generalized importer, so there is also a
checkbox **One board per project**: each swimlane the import would create
becomes its own board, named after that swimlane. For Notion, the swimlanes
are:

- each database, when the export holds more than one (the swimlane is named
  after the database, without its page id);
- the values of a column named **Swimlane**, which is what WeKan's own Notion
  export writes when a board has several swimlanes.

A single database without a Swimlane column has one swimlane, so the option
makes no difference for it. Links (parent cards, dependencies) between cards
that end up on different boards are reported in the loss report rather than
kept.

From a script:

```bash
python3 api.py importboardsfrom notion FILE_OR_DIR ...
```

It takes files, directories of files, or `.zip` files.

### How to export

1. In WeKan, open the board and go to **Board Settings → Export**.
2. Choose what to include, then **Notion** in the JSON group of the export
   menu. It downloads the board as a `.csv` file.
3. In Notion, import the file as a new database: **Settings → Import → CSV**
   (or type `/csv` in a page), upload the file, choose where to put it, and
   map each CSV column to a Notion property.
4. Or add the rows to an existing database: open it as a full page, click
   **••** at the top and choose **Merge with CSV**. The CSV's column names must
   match the database's property names exactly.

Notion's CSV import adds rows; it does not update rows that are already
there. It limits the file size by plan (see Notion's documentation).

### How to export all boards at once

**All Boards → sidebar → Export all boards**, then choose **Notion**. This
downloads one `.zip` with one file per board you can export: boards you are a
member of that are not archived and are not templates.

To export only some boards: open **Multi-Selection** in the All Boards
sidebar, select the boards, then click **Export**.

From a script:

```bash
python3 api.py exportallboards notion boards.zip
```

### REST API

```bash
python3 api.py importboardfrom notion export.zip          # or one database .csv
python3 api.py importboardsfrom notion FILES...
python3 api.py exportboardformat BOARDID notion board.csv
python3 api.py exportallboards notion boards.zip
```

The HTTP routes are:

- `POST /api/boards/import/notion`
- `GET /api/boards/:boardId/export/notion?authToken=…`
- `GET /api/export-all-boards/notion?authToken=…`, with an optional
  `&boardIds=ID1,ID2` to export only those boards

## How the numbers are calculated

The limits and conversions of this format, from its own code:

- One Notion database CSV: at most 33,554,432 characters (32 MB of text). More
  stops the import with an error. (`MAX_NOTION_CSV_CHARS` in
  [models/lib/notionFormat.js](../../../../../../models/lib/notionFormat.js#L62))
- At most 50 databases. More stops the import with an error.
  (`MAX_NOTION_DATABASES` in
  [models/lib/notionFormat.js](../../../../../../models/lib/notionFormat.js#L63))
- The Notion .zip file: at most 64 MB. More stops the import with an error.
  (`MAX_NOTION_ZIP_BYTES` in
  [server/lib/notionArchive.js](../../../../../../server/lib/notionArchive.js#L26))
- One Notion database CSV: at most 32 MB. (`MAX_NOTION_CSV_BYTES` in
  [server/lib/notionArchive.js](../../../../../../server/lib/notionArchive.js#L27))
- One Notion page: at most 2 MB. (`MAX_NOTION_PAGE_BYTES` in
  [server/lib/notionArchive.js](../../../../../../server/lib/notionArchive.js#L28))
- The unpacked Notion .zip contents: at most 96 MB. (`MAX_NOTION_INFLATED_BYTES`
  in
  [server/lib/notionArchive.js](../../../../../../server/lib/notionArchive.js#L30))
- At most 20,000 files in the archive. More stops the import with an error.
  (`MAX_NOTION_ZIP_ENTRIES` in
  [server/lib/notionArchive.js](../../../../../../server/lib/notionArchive.js#L31))
- At most 20,000 pages. More stops the import with an error. (`MAX_NOTION_PAGES`
  in
  [server/lib/notionArchive.js](../../../../../../server/lib/notionArchive.js#L32))

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
[models/lib/notionFormat.js](../../../../../../models/lib/notionFormat.js),
[server/lib/notionArchive.js](../../../../../../server/lib/notionArchive.js).

The tests that pin it:
[tests/notionFormat.test.cjs](../../../../../../tests/notionFormat.test.cjs),
[tests/playwright/specs/import-export-format-audit.e2e.js](../../../../../../tests/playwright/specs/import-export-format-audit.e2e.js).

The details of the format, what is kept and how it is tested are below.

### Format details

#### What Notion's export is

Notion's Markdown & CSV export, as
[Export your content](https://www.notion.com/help/export-your-content)
describes it, is a `.zip` with:

- a CSV file for each full-page database;
- a Markdown file for each page;
- only the current or the default view of a database;
- nested folders, unless **Create folders for subpages** is turned off.

Instead of the `.zip`, one database CSV can be chosen or pasted.

#### What WeKan reads leniently

Notion does not document these. They are known from third-party converters
(low confidence), so WeKan reads them when they are there and never requires
them:

- Every exported file and folder name ends in a space and a 32-hex page id
  (`Tasks 1a2b...c6.csv`). WeKan removes it from database and page names.
- Some databases also have a `<name> <id>_all.csv` with every row, beside the
  view's CSV. WeKan uses the `_all.csv` when both are there.
- The first column is the title. Multi-select and person cells are joined
  with `, `.
- Dates look like `October 8, 2026`, with a time `October 8, 2026 3:04 PM`,
  and a range `A → B`. WeKan also reads `YYYY-MM-DD`, `MM/DD/YYYY` and a
  `(GMT+3)` style zone at the end. A time without a zone is taken as UTC.
- Checkboxes are `Yes` and `No`.
- Relations are the related page's title and its encoded path or URL. A
  related page that is one row of the export, in any of its databases, is a
  "related to" dependency between the two cards.
- A row's page file starts with `# Title`, a blank line, one
  `Property: value` line per non-empty property, a blank line, then the page
  body.

#### How the `.zip` is opened

The server opens the `.zip` (`server/lib/notionArchive.js`) with the same
guards as the Vikunja and Trello zip imports. Nothing is written to disk, no
entry name is used as a path, and images and other files are only counted,
never unpacked. The limits are:

| Limit | Value |
| --- | --- |
| The upload (the `.zip` itself) | 64 MB |
| Files in the `.zip` | 20,000 |
| Everything unpacked, together, nested parts included | 96 MB |
| One database CSV | 32 MB |
| One page file | 2 MB |
| Row pages | 20,000 |
| Databases | 50 |

A file over its limit is refused before or while it is unpacked. The file
must start like a `.zip`; otherwise it is refused as "not a .zip file".

How the files are found:

- Every `.csv` is a database.
- A database's row pages are the `.md` files directly in the folder named like
  its CSV (`Tasks <id>/`). Without such a folder, they are the `.md` files
  beside the CSV (**Create folders for subpages** turned off).
- `.md` files deeper in that folder are subpages. They are counted and
  reported.
- A `.zip` that holds only further `.zip` files (a large export comes in
  parts) is opened one level down, under the same limits. Parts without a
  database CSV are skipped.
- `__MACOSX/` folders and `._` files, which a Mac adds when a folder is
  zipped by hand, are ignored.
- A `.zip` without any database CSV is refused.

#### Which column becomes what

A board view in Notion is only a view, and which property it groups by is not
exported. So:

- A column named **Status** is the list.
- Without one, the first text column whose values look like a select (short,
  one value per cell, fewer distinct values than rows, at most 20) is the
  list. The import report says which column was chosen.
- Otherwise every card is in one list, **No Status**.

Lists are created in the order their values first appear.

The other columns are recognized by their name and their values:

- **Name**, **Title**, **Task**, **Task name** or **Page**, else the first
  column, is the card title.
- **Tags**, **Labels**, **Category**, **Categories** or **Multi-select** are
  labels, split on commas.
- **Assignee**, **Assignees**, **Assigned to**, **Owner**, **Person**,
  **People**, **Responsible** or **Members** is the owner (the first person),
  then further assignees. Only the first such column is used; others become
  text fields.
- **Created by** is **Requested by**.
- **Description** or **Notes**, then the row page's body after its property
  lines, is the description.
- Date columns are read by name: **Start** is the start date, **Created** the
  creation date, **Completed**, **Done** or **End date** the end date. Of the
  other date columns, the first whose name contains *due*, *deadline* or
  *date* is the due date, else the first one. A range `A → B` in the due
  column is the start date and the due date.
- **Swimlane** (what WeKan's export writes) is the swimlane.
- Columns of only `Yes` and `No` are checkbox custom fields.
- Columns of only numbers are number custom fields.
- Every other column is a text custom field.

Page ids are removed from database names. One database becomes a board named
after it. Several databases become swimlanes of one board named
**Imported Notion database**.

A row's page is matched to its row by the page's `# Title`, else by the file
name. Notion shortens long file names, so a file name of at least 20
characters that starts the title also matches.

#### The export

The export writes the CSV that Notion's CSV import reads, as
[Import data into Notion](https://www.notion.com/help/import-data-into-notion)
describes it: a header row, UTF-8, and dates as `MM/DD/YYYY`. Merge with CSV
reads the same file. The columns are:

`Name, Status, Assignee, Tags, Start, Due, Description`, then **Swimlane**
when the board has several swimlanes, then the board's custom fields in the
order they first appear.

- Checkbox fields are written as `Yes` or `No`.
- Commas inside a person's name or a label are replaced with spaces, since
  the cell is a comma-separated list.
- A card without a title is written as `Untitled`.
- Lines end with CRLF, and fields are quoted as RFC 4180 says.

Notion decides the property types when it imports the file.

### What is kept

| Notion | WeKan |
| --- | --- |
| Database (one) | Board, named after the database |
| Databases (several) | Swimlanes of one board |
| Row | Card |
| Name / Title column (else the first column) | Card title |
| Status column (else a select-like column) | List |
| Tags / Labels / Categories / Multi-select | Labels |
| Assignee / Owner / Person / People | Owner, then assignees |
| Created by | Requested by |
| Description / Notes, and the row page's body | Description |
| Start date | Start date |
| Created date | Creation date |
| Completed / Done / End date | End date |
| Due date (or the first other date; a range is start and due) | Due date (and start date) |
| Swimlane column | Swimlane |
| Yes/No column | Checkbox custom field |
| Number column | Number custom field |
| Any other column | Text custom field |

The export writes, per card:

| WeKan | Notion CSV column |
| --- | --- |
| Title | Name |
| List | Status |
| Owner, then assignees and members | Assignee |
| Labels | Tags |
| Start date | Start |
| Due date | Due |
| Description | Description |
| Swimlane (only when there are several) | Swimlane |
| Custom fields | One column each |

### What is not kept

The import reports these on the loss report, rather than dropping them
silently:

- a relation to a page that is not a row of the export, or to a title that
  two rows share (it is not guessed which one);
- a **Last edited time** column;
- date columns after the ones above; they are kept as text fields, and the
  report says which column was the due date;
- row page files that match no row;
- nested subpages;
- Markdown pages outside any database;
- images and other files in the export;
- links in a page body to files or pages inside the export (the links stay
  as text);
- the view CSV, when it was left out for the `_all.csv` of the same database;
- an empty database, and rows without a title;
- columns named `__proto__`, `constructor` or `prototype`.

The import report also says which column became the lists when there is no
Status column, or that there was none.

The Notion export does not write comments, checklists, attachments, the
creation or end date, Requested by, or dependencies.

### How it is built and tested

- `models/lib/notionFormat.js` reads a database CSV and its row pages
  (`parseNotionExport`) and writes the export CSV (`formatNotionCsv`).
- `server/lib/notionArchive.js` opens the export `.zip` on the server.
- `models/import.js` opens the `.zip`, parses it through `EXTERNAL_PARSERS`
  in `models/lib/externalParsers.js`, and builds the board with
  `models/kanboardCreator.js`.
- `models/lib/externalExportFormatters.js` registers the export.
- `tests/notionFormat.test.cjs` is the unit test: dates, ranges and page
  heads; a pasted CSV; the select-like list column; the `.zip` with
  `_all.csv`, page bodies, several databases, flat folders and zip parts;
  refused input, oversized uploads and too many files; the export and its
  round trip; and the wiring into the import page and export menu.
- The Playwright cases are in
  `tests/playwright/specs/import-export-format-audit.e2e.js`:
  - *Notion: an export .zip imports through the page with its status lists,
    page body, labels, date and checkbox* uploads a `.zip` with a view CSV,
    an `_all.csv` and a row page, and checks the board title, lists,
    description, due date, labels and checkbox field.
  - *Notion: a pasted database CSV imports, and a zip without a database is
    refused* pastes a CSV without a Status column and checks the lists, and
    checks that a `.zip` with only a page is refused.
  - The export menu case downloads every format, Notion included, and checks
    that another user's token is refused.

## Commits

 - [Notion relations between rows of an export become "related to" dependencies](https://github.com/wekan/wekan/commit/f546ff238345dd267e568d75ce1fe25bf4fdbbb7)
 - [The Markdown, Obsidian, OPML and Org mode outlines and the Notion CSV are written a page of cards at a time](https://github.com/wekan/wekan/commit/ce40b56abdf5b166f523dab98a14414907809b1f)
 - [Import page uploads stream to the server's disk, checked against the free space and an Admin Panel limit](https://github.com/wekan/wekan/commit/32c24ed84e9d6c8080e89bdd4097f87a3b0b4b04)
 - [Read every import source through one path and one file chooser, from one description of the sources](https://github.com/wekan/wekan/commit/c80a656901103bfd29b41843c7e255b4ed3bfa17)
 - [Import and export many boards at once for every format, and document each format in its own directory](https://github.com/wekan/wekan/commit/7858d84e127c2c6cd92134166352b9a4245d4ec2)
 - [Import boards from Plane issue exports](https://github.com/wekan/wekan/commit/d21a26339363181807908e26c2a5155e732b745e)
 - [Import and export boards as Notion Markdown & CSV exports](https://github.com/wekan/wekan/commit/b7d3274780989c8169549507e416c60316d70ccf)
