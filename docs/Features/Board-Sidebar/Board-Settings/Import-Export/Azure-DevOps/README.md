# Azure DevOps Boards

## What it is

WeKan imports the work items of an [Azure DevOps Boards](https://learn.microsoft.com/azure/devops/boards/)
query, and exports a board as the CSV file Azure DevOps' own **Import from CSV**
reads.

## Read more

- [Wikipedia: Azure DevOps and its Boards](https://en.wikipedia.org/wiki/Azure_DevOps_Server)
- [Import or update work items in bulk by using CSV files](https://learn.microsoft.com/azure/devops/boards/queries/import-work-items-from-csv)
- [Export a list of work items](https://learn.microsoft.com/azure/devops/boards/queries/view-run-query#export-a-query)
- [Default processes and work item types](https://learn.microsoft.com/azure/devops/boards/work-items/guidance/choose-process)

## How to use it

Each task has its own steps below: importing one board, importing many
boards at once, exporting one board, exporting all boards at once, and the
same from a script through the REST API.

### How to import

1. In Azure DevOps, open **Boards → Queries**, run a query that shows the
   columns you want (for example ID, Work Item Type, Title, Assigned To, State,
   Tags, Board Column, Description), and choose **⋯ → Export to CSV**. A tree
   query writes Title 1, Title 2, ... and keeps the parent and child items.
2. In WeKan, go to **All Boards → Add Board → Import → Import board → Azure DevOps Boards**.
3. Choose the `.csv` file, or paste its text.
4. Map the people to WeKan members, or leave them as they are.
5. Click **Import**.

### How to import many boards at once

1. On the import page, choose **Azure DevOps Boards**, then under **Import many boards**
   choose several files.
2. Each file becomes its own board. The boards are imported without member
   mapping; members can be mapped later.

Azure DevOps Boards is imported through the generalized importer
(`models/kanboardCreator.js`), so the page also has the checkbox **One board
per project**.

From a script:

```bash
python3 api.py importboardsfrom azuredevops FILE_OR_DIR ...
```

### How to export

1. Open the board, then **Board Settings → Export**, and choose **Azure DevOps
   Boards**. The board downloads as `<board>.csv`.
2. In Azure DevOps, open **Boards → Work items → Import from CSV** and choose
   the file.

Every row is a new work item (its ID is empty). Its type is the card's first
label named after a work item type of the built-in processes (Epic, Feature,
User Story, Product Backlog Item, Requirement, Bug, Task, Issue, ...), else
**Task**. Its State is the card's list when the list is named after a state of
those processes (New, Active, Resolved, Closed, To Do, Doing, Done, ...); a list
of another name is written as a tag and the work item starts in its type's
first state. Priority, Story Points, Effort, Area Path and the other fields are
written only when a card of the board has them, so a board that never came from
Azure DevOps gets no column its process may not have. The description is
written as the HTML the field holds; **Assigned To** is the card's owner, which
Azure DevOps has to find among its users.

### How to export all boards at once

1. In WeKan, go to **All Boards**, open the sidebar and choose **Export all
   boards**, then **Azure DevOps Boards**.
2. One `.zip` downloads, with one `.csv` per board you can export.

From a script:

```bash
python3 api.py exportallboards azuredevops boards.zip
```

### REST API

- Import: `POST /api/boards/import/azuredevops` with the CSV text.
- Export: `GET /api/boards/:boardId/export/azuredevops`.

## How the numbers are calculated

The limits and conversions of this format, from its own code:

- At most 100,000 rows. More stops the import with an error.
  (`MAX_AZURE_DEVOPS_ROWS` in
  [models/lib/azureDevOpsCsvFormat.js](../../../../../../models/lib/azureDevOpsCsvFormat.js#L43))

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
[models/lib/azureDevOpsCsvFormat.js](../../../../../../models/lib/azureDevOpsCsvFormat.js),
[models/lib/microsoftCsvDates.js](../../../../../../models/lib/microsoftCsvDates.js).

The tests that pin it:
[tests/azureDevOpsCsv.test.cjs](../../../../../../tests/azureDevOpsCsv.test.cjs).

The details of the format, what is kept and how it is tested are below.

### Format details

Export to CSV writes the query's columns by their display names; a person is
`Display Name <address>`, tags are joined with `; `, and a date is in the
exporting user's regional format (`11/20/2026 3:14:00 PM`, `20.11.2026 15.14`,
`20/11/2026 15:14`) - a file whose slash dates have a first part above 12 is
read day first (`models/lib/microsoftCsvDates.js`). **Board Column** (when the
query has it, else **State**) is the list and **Board Lane** the swimlane
(`models/lib/azureDevOpsCsvFormat.js`).

### What is kept

Work items as cards in their Board Column or State, Board Lane as swimlanes,
the work item type and tags as labels, the ID as the card's reference, the
parent (the Parent column, or the tree query's levels) as the parent card, the
title, the description with Acceptance Criteria and Repro Steps (HTML read as
text), Assigned To as the owner, Created By as "requested by", the created,
start, target and closed dates, Completed Work as spent time, and every other
column - Priority, Story Points, Area Path, Iteration Path, ... - as a custom
field.

### What is not kept

Changed Date, Changed By, Rev, History, Activated and Resolved dates and the
Board Column Done flag (reported); links other than the parent, attachments and
the discussion, which Export to CSV does not write. On export: the dates,
comments, checklists as items, and the parent of a card. What was left out is listed in the import's loss report, also in
**Admin Panel → Problems → Recovery**.

### How it is built and tested

`tests/azureDevOpsCsv.test.cjs` reads a query export with HTML descriptions,
regional dates, a parent and custom fields, a tree query's Title 1/2/3 levels,
day-first dates, writes a board and reads it back, writes the header once over
pages, and refuses a file without a Title.

## Commits

 - [Import and export Azure DevOps Boards, Microsoft Lists, Project, Outlook, Teams and OneNote](https://github.com/wekan/wekan/commit/01e88410cd7440b26c5f845d98ae058f93c16a85)
