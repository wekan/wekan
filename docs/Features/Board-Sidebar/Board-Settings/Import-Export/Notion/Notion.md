# Notion

WeKan imports a [Notion](https://www.notion.com) database as a board, from
Notion's **Markdown & CSV** export: the `.zip` file, or one database CSV from
it. Rows become cards, the Status column becomes the lists, and each row's
page text becomes the card description. WeKan exports a board as the CSV file
that Notion's own CSV import, and a database's **Merge with CSV**, read.

## How to import

1. In Notion, open the database as a full page.
2. Click **•••** at the top right, choose **Export**, and pick
   **Markdown & CSV**. Turn on **Include subpages** to get the row pages, and
   click **Export**. Notion downloads a `.zip` file.
3. In WeKan, go to **All Boards → New → Import → Notion**.
4. Choose the `.zip` file, or one database `.csv` file from it. You can also
   paste the text of one database CSV into the text box.
5. Click **Import**. Notion's people are not mapped to WeKan users here;
   members can be mapped later.
6. Read the loss report on the import page. It is also kept in **Admin Panel →
   Problems → Recovery**.

Notion exports only the database's current view or its default view, not all
views. On Windows, turning off **Create folders for subpages** keeps the file
paths short; WeKan reads both layouts.

## How to import many boards at once

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

## How to export

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

## How to export all boards at once

**All Boards → sidebar → Export all boards**, then choose **Notion**. This
downloads one `.zip` with one file per board you can export: boards you are a
member of that are not archived and are not templates.

To export only some boards: open **Multi-Selection** in the All Boards
sidebar, select the boards, then click **Export**.

From a script:

```bash
python3 api.py exportallboards notion boards.zip
```

## Format details

### What Notion's export is

Notion's Markdown & CSV export, as
[Export your content](https://www.notion.com/help/export-your-content)
describes it, is a `.zip` with:

- a CSV file for each full-page database;
- a Markdown file for each page;
- only the current or the default view of a database;
- nested folders, unless **Create folders for subpages** is turned off.

Instead of the `.zip`, one database CSV can be chosen or pasted.

### What WeKan reads leniently

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
- Relations are the related page's title and its encoded path or URL.
- A row's page file starts with `# Title`, a blank line, one
  `Property: value` line per non-empty property, a blank line, then the page
  body.

### How the `.zip` is opened

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

### Which column becomes what

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

### The export

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

## What is kept

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

## What is not kept

The import reports these on the loss report, rather than dropping them
silently:

- relation columns (links to other pages);
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

## REST API

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

## How it is built and tested

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

## Sources

- [Export your content](https://www.notion.com/help/export-your-content):
  the Markdown & CSV export, its views, subpages and folders
- [Import data into Notion](https://www.notion.com/help/import-data-into-notion):
  the CSV import, Merge with CSV, the header row, UTF-8 and the date format

See also the [format coverage table](../Format-Coverage.md) and
[all formats](../External-Tools.md).
