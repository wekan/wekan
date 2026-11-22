# Microsoft Lists

## What it is

WeKan imports a list from [Microsoft Lists](https://www.microsoft.com/microsoft-365/microsoft-lists)
(and SharePoint lists), and exports a board as a CSV file Lists makes a new list
from.

## Read more

- [Wikipedia: SharePoint, where Microsoft Lists keeps its lists](https://en.wikipedia.org/wiki/Microsoft_SharePoint)
- [Export to Excel from SharePoint or Lists](https://support.microsoft.com/office/export-to-excel-from-sharepoint-or-lists-bfb2ea48-6118-4fa9-abb6-cced9424e5d9)
- [Create a list based on a spreadsheet](https://support.microsoft.com/sharepoint/lists/data-and-lists/create-a-list-based-on-a-spreadsheet)
- [Create a list from CSV and export to CSV with schema](https://supersimple365.com/new-in-microsoft-lists-create-a-list-from-csv-and-export-to-csv/)

## How to use it

Each task has its own steps below: importing one board, importing many
boards at once, exporting one board, exporting all boards at once, and the
same from a script through the REST API.

### How to import

1. In Microsoft Lists, open the list, choose the view whose columns you want,
   and choose **Export → Export to CSV** (or **Export to CSV with schema**).
2. In WeKan, go to **All Boards → Add Board → Import → Import board → Microsoft Lists**.
3. Choose the `.csv` file, or paste its text.
4. Map the people to WeKan members, or leave them as they are.
5. Click **Import**.

### How to import many boards at once

1. On the import page, choose **Microsoft Lists**, then under **Import many boards**
   choose several files.
2. Each file becomes its own board. The boards are imported without member
   mapping; members can be mapped later.

Microsoft Lists is imported through the generalized importer
(`models/kanboardCreator.js`), so the page also has the checkbox **One board
per project**.

From a script:

```bash
python3 api.py importboardsfrom mslists FILE_OR_DIR ...
```

### How to export

1. Open the board, then **Board Settings → Export**, and choose **Microsoft
   Lists**. The board downloads as `<board>.csv`.
2. In Microsoft Lists, choose **New list → From CSV** and choose the file.
   Make **Status** a Choice column, and the list's board view groups the items
   by it - as the board's lists.

The columns are Title, Status (the card's list), Assigned to (the owner and
assignees), Start date and Due date (YYYY-MM-DD), Tags (the labels), Description
and a column per custom field of the board, its name without the characters
Lists does not allow in a column name.

### How to export all boards at once

1. In WeKan, go to **All Boards**, open the sidebar and choose **Export all
   boards**, then **Microsoft Lists**.
2. One `.zip` downloads, with one `.csv` per board you can export.

From a script:

```bash
python3 api.py exportallboards mslists boards.zip
```

### REST API

- Import: `POST /api/boards/import/mslists` with the CSV text.
- Export: `GET /api/boards/:boardId/export/mslists`.

## How the numbers are calculated

The limits and conversions of this format, from its own code:

- At most 100,000 rows. More stops the import with an error.
  (`MAX_MS_LISTS_ROWS` in
  [models/lib/msListsCsvFormat.js](../../../../../../models/lib/msListsCsvFormat.js#L37))

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
[models/lib/microsoftCsvDates.js](../../../../../../models/lib/microsoftCsvDates.js),
[models/lib/msListsCsvFormat.js](../../../../../../models/lib/msListsCsvFormat.js).

The tests that pin it:
[tests/msListsCsv.test.cjs](../../../../../../tests/msListsCsv.test.cjs).

The details of the format, what is kept and how it is tested are below.

### Format details

Export to CSV writes the view's columns by their display names, Title first in
most lists; a Person column is the display name (with schema: the address),
several people or choices are joined with `;` (older SharePoint `;#`), a Yes/No
column is TRUE or FALSE, and dates are in the user's regional format or, with
schema, ISO 8601 (`models/lib/msListsCsvFormat.js`,
`models/lib/microsoftCsvDates.js`). The board view of a list groups its items
by a Choice column; WeKan takes the first of Status, Progress, Stage, State,
Bucket or Board column as the lists.

### What is kept

Items as cards in the lists of their Status (or Progress, ...) column, Title,
Description (or Notes, Details, Comments), Assigned to (or Owner, Assignee) as
the owner and assignees, Created By as "requested by", the start, due, created
and completed dates, Tags (or Category, Labels) as labels, ID as the card's
reference, and every other column as a custom field (Yes/No as true or false).

### What is not kept

SharePoint's own columns - Modified, Modified By, Item Type, Path, Content
Type, Version, Attachments, Compliance Asset Id and the retention labels - are
reported. Attachments, comments and the list's formatting are not in the CSV.
On export: comments, checklists and attachments. What was left out is listed in the import's loss report, also in
**Admin Panel → Problems → Recovery**.

### How it is built and tested

`tests/msListsCsv.test.cjs` reads the Issue tracker template's export with
several people and dates, the Work progress tracker's Progress column with
`;#` people and a Yes/No column, writes a board with custom fields and reads it
back, and refuses a file without items.

## Commits

 - [Import and export Azure DevOps Boards, Microsoft Lists, Project, Outlook, Teams and OneNote](https://github.com/wekan/wekan/commit/01e88410cd7440b26c5f845d98ae058f93c16a85)
