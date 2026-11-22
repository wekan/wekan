# ClickUp

## What it is

WeKan imports boards from [ClickUp](https://clickup.com) and exports boards to
it as a ClickUp task CSV file. WeKan reads both shapes ClickUp documents: its
workspace task export, and the columns of its Spreadsheets importer. Statuses
become lists, ClickUp lists become swimlanes, and tasks become cards with
their subtasks, assignees, tags, dates, priority and time.

## Read more

- [Wikipedia: ClickUp, the productivity app](https://en.wikipedia.org/wiki/ClickUp)
- [Export task data](https://help.clickup.com/hc/en-us/articles/6310551109527-Export-task-data):
  the workspace export, its steps and columns
- [Export List and Table views](https://help.clickup.com/hc/en-us/articles/6310174308631-Export-List-and-Table-views):
  exporting one view
- [Fields supported by the Spreadsheets importer](https://help.clickup.com/hc/en-us/articles/6310876671255-Fields-supported-by-the-Spreadsheets-importer):
  the importer's columns
- [Use the Spreadsheets importer](https://help.clickup.com/hc/en-us/articles/6310834724247-Use-the-Spreadsheets-importer):
  the import steps

See also the [format coverage](../Format-Coverage.md) and
[all formats](../External-Tools.md).

## How to use it

Each task has its own steps below: importing one board, importing many
boards at once, exporting one board, exporting all boards at once, and the
same from a script through the REST API.

### How to import

1. In ClickUp, export the tasks as CSV, in one of these ways:
   - the workspace: click your Workspace avatar and choose **Settings**, then
     in the sidebar **Imports / Exports**, click **Export Items**, choose the
     locations under **Select locations** and click **Start Export**;
   - one List or Table view: open the view, click **Customize** in the upper
     right and click **Export**, then export all columns as CSV.
2. Open the CSV file in a text editor and copy all of it.
3. In WeKan, go to **All Boards → Add Board → Import → Import board → ClickUp**.
4. Paste the text into the box and click **Import**. A **Map members** step
   follows with nobody to map: click **Done**. (**Import without mapping
   members (map later)** skips that step.)
5. Read the loss report on the import page. It is also kept in **Admin Panel →
   Problems → Recovery**.

A CSV file with the columns of ClickUp's Spreadsheets importer imports the
same way.

### How to import many boards at once

1. On the import page, choose **ClickUp**, then under **Import many boards**
   choose several CSV files, or one `.zip` that holds them. Each file becomes
   its own board, imported without member mapping. Members can be mapped
   later.
2. ClickUp is imported through the generalized importer, so there is also a
   checkbox **One board per project**: each swimlane the import would create
   becomes its own board, named after that swimlane. For ClickUp the swimlanes
   are the **ClickUp lists** (List Name, or List), so a workspace export
   becomes one board per ClickUp list. Tasks without a list are in the
   swimlane **Default**.

Links (parent cards, dependencies) between cards that end up on different
boards are reported in the loss report rather than kept. For ClickUp this is
a subtask in another ClickUp list than its parent.

From a script:

```bash
python3 api.py importboardsfrom clickup FILE_OR_DIR ...
```

The arguments are files, directories of files, or `.zip` files.

### How to export

1. In WeKan, open the board, then **Board Settings → Export**.
2. Under **Select what to include**, choose what to export, then click
   **ClickUp**. This downloads `<board>.csv`. The ClickUp export is for a whole
   board; it is not offered for one swimlane or one list.
3. In ClickUp, open **Imports / Exports**, choose **Import items**, then
   **Spreadsheet** as the source. Choose the Space, Folder or List to import
   into, upload the CSV file, and map its columns to ClickUp's fields. See
   [Use the Spreadsheets importer](https://help.clickup.com/hc/en-us/articles/6310834724247-Use-the-Spreadsheets-importer)
   for the steps.

### How to export all boards at once

In **All Boards**, open the sidebar and choose **Export all boards**, then
**ClickUp**. This downloads one `.zip` with one `.csv` file per board you can
export: boards you are a member of, that are not archived and not templates.

To export only some boards, use **Multi-Selection** in the All Boards sidebar,
select the boards, then click **Export**.

From a script:

```bash
python3 api.py exportallboards clickup boards.zip
```

### REST API

```bash
python3 api.py importboardfrom clickup tasks.csv
python3 api.py importboardsfrom clickup tasks1.csv tasks2.csv
python3 api.py exportboardformat BOARDID clickup tasks.csv
python3 api.py exportallboards clickup boards.zip
```

The HTTP routes:

- `POST /api/boards/import/clickup`: the body is `{"board": "<CSV text>"}`.
- `GET /api/boards/:boardId/export/clickup?authToken=…`
- `GET /api/export-all-boards/clickup?authToken=…`, with
  `&boardIds=ID1,ID2` for selected boards only.

## How the numbers are calculated

The limits and conversions of this format, from its own code:

- Time estimates and time spent are milliseconds in ClickUp's CSV; they are
  divided by one hour (3,600,000 ms) and rounded to two decimals to give hours.
  (`HOUR` in
  [models/lib/clickupCsvFormat.js](../../../../../../models/lib/clickupCsvFormat.js#L56))

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
[models/lib/clickupCsvFormat.js](../../../../../../models/lib/clickupCsvFormat.js).

The tests that pin it:
[tests/clickupCsv.test.cjs](../../../../../../tests/clickupCsv.test.cjs),
[tests/externalExportRoundTrip.test.cjs](../../../../../../tests/externalExportRoundTrip.test.cjs),
[tests/playwright/specs/import-export-format-audit.e2e.js](../../../../../../tests/playwright/specs/import-export-format-audit.e2e.js).

The details of the format, what is kept and how it is tested are below.

### Format details

What WeKan reads is ClickUp's task CSV in its two documented shapes, matched
by header name:

- the
  [workspace export](https://help.clickup.com/hc/en-us/articles/6310551109527-Export-task-data)
  (Task ID … Rolled Up Time Text);
- the
  [Spreadsheets importer](https://help.clickup.com/hc/en-us/articles/6310876671255-Fields-supported-by-the-Spreadsheets-importer)
  columns (Task Name, Status, Priority 1-4, Description content, List, Task
  assignee, Checklist, Subtask IDs, Time Estimate).

What the import covers:

- statuses as lists;
- ClickUp lists as swimlanes;
- the Space as the board title;
- tasks as cards, with Task ID / Parent ID / Subtask IDs as subtasks;
- Task Content as the description, plus its Attachments as links;
- `[A,B]` assignees and tags;
- the created, due and start dates (Unix milliseconds or ISO 8601);
- Time Spent as spent hours;
- Priority, Task Type, Custom ID, Folder and Time Estimate as custom fields;
- the importer's Checklist as a checklist.

Reported: the export's Checklists and Comments cells (no documented format),
and other dates. The export writes the workspace export columns plus the
importer's Checklist column.

From the current code (`models/lib/clickupCsvFormat.js`):

- The file needs the Task Name column. Where the two shapes name a column
  differently, either name is read: List Name or List, Task Content or
  Description content, Assignees or Task assignee, Task Type or Task type,
  Time Estimated or Time Estimate, Time Spent or Time Tracked.
- Priority is **urgent**, **high**, **normal** or **low**, or 1-4 (1 is
  Urgent). It becomes the custom field **Priority**.
- Task Type becomes a custom field only when it is not `task`.
- Time Estimated is in milliseconds; it becomes the custom field **Time
  Estimate (hours)**. Time Spent becomes the card's spent time, in hours.
- Attachments is a JSON list `[{title, url}]`. Each `http` or `https` link is
  added under the description as a Markdown link; the files themselves are not
  downloaded.
- A Subtask IDs list on a parent is the same link as a Parent ID on its child,
  so either one makes the parent card.
- The importer's Checklist is comma-separated; every item is imported as not
  done.
- A task without a status goes to the list **No status**. Without a Space
  Name, the board is named **Imported ClickUp tasks**.

The export writes the 31 workspace export columns, from **Task ID** to
**Rolled Up Time Text**, then **Checklist**, then one column per custom field
of the board that is not one of those named above:

- Task ID is the WeKan card id; Parent ID and Subtask IDs link the cards of
  the same board;
- Status is the list, **List Name** the swimlane (empty for **Default**) and
  **Space Name** the board title;
- dates are written twice: in milliseconds, and as ISO 8601 in the `Text`
  column;
- assignees (owner first) and tags as `[A,B]`;
- Priority, Task Type, Task Custom ID, Folder Name/Path and Time Estimated come
  from the custom fields Priority, Task Type, Custom ID, Folder and Time
  Estimate (hours); Task Type is **Task** without one;
- Attachments is `[]`;
- every checklist item, comma-separated, in **Checklist**.

### What is kept

| ClickUp | WeKan |
| --- | --- |
| Space Name (first row) | Board title |
| Status | List |
| List Name / List | Swimlane |
| Task Name | Card title |
| Task Content / Description content | Description |
| Attachments (links) | Links under the description |
| Task ID | The card's source reference |
| Parent ID, Subtask IDs | Parent card (when it is in the same import) |
| Assignees / Task assignee (`[A,B]`) | Card members, when mapped (see below) |
| Tags (`[a,b]`) | Labels |
| Date created | Creation date |
| Due date | Due date |
| Start date | Start date |
| Time Spent / Time Tracked | Spent time, in hours |
| Task Link | `Source: <link>` at the end of the description |
| Any other column (a workspace export writes each custom field as one) | A custom field of the column's name |
| Priority | Custom field Priority |
| Task Type (other than task) | Custom field Task Type |
| Task Custom ID | Custom field Custom ID |
| Folder Name/Path | Custom field Folder |
| Time Estimated / Time Estimate | Custom field Time Estimate (hours) |
| Checklist (importer) | Checklist **Checklist** |

Assignees become card members only when those names are mapped to WeKan
users, through the REST API's `membersMapping`. The import page maps no one,
so there they are not kept.

### What is not kept

The import reports these on the loss report, rather than dropping them
silently:

- the export's Checklists, Comments and Assigned Comments cells: ClickUp
  documents no format for them;
- Attachments that are not the documented JSON list;
- a priority that is not urgent, high, normal, low or 1-4;
- a date that is neither milliseconds nor ISO 8601;
- a row without a task name;
- a parent that is not in the same import, a Task ID used twice, and a parent
  link that would form a cycle.

ClickUp's own Rolled Up Time and `Text` date columns repeat other columns,
and are not read.

The export writes the spent hours as Time Spent (milliseconds). It leaves
out comments, attachments, done state of checklist items and archived cards.

### How it is built and tested

- `models/lib/clickupCsvFormat.js` reads and writes the CSV, with the CSV
  reader of `models/lib/todoistCsvFormat.js`. `models/lib/externalParsers.js`
  lists it in `EXTERNAL_PARSERS`, and `models/kanboardCreator.js` creates the
  board.
- `models/lib/externalExportFormatters.js` and
  `models/lib/externalExporters.js` collect the board and write the export.
- `tests/clickupCsv.test.cjs` is the unit test, and
  `tests/externalExportRoundTrip.test.cjs` runs the export back through the
  import.
- The Playwright case is in
  `tests/playwright/specs/import-export-format-audit.e2e.js`: *ClickUp: a task
  export imports with its status, list, tags, due date and subtask*, and
  *every external export menu link returns text and refuses an unrelated
  user*.

## Commits

 - [ClickUp: a workspace's custom field columns come across both ways, and the task link is kept](https://github.com/wekan/wekan/commit/60f569afe679ffcf6bdfe36f16d4d2bb42f07502)
 - [ClickUp and GitLab exports write spent time, which their imports read and a round trip lost](https://github.com/wekan/wekan/commit/14afc74adbb6659ee3a8f57ebe84999b439557c6)
 - [Ten more exports are written a page of cards at a time, their references read in a light first pass](https://github.com/wekan/wekan/commit/e2cbbe510457940b6db26c90b45307a6c539a0e7)
 - [Fix the code scanning and Dependabot alerts of 2026-10-10](https://github.com/wekan/wekan/commit/5ec6d9af18d99ab5514cd189fed6bf642e0bb3b2)
 - [Read every import source through one path and one file chooser, from one description of the sources](https://github.com/wekan/wekan/commit/c80a656901103bfd29b41843c7e255b4ed3bfa17)
 - [Import and export many boards at once for every format, and document each format in its own directory](https://github.com/wekan/wekan/commit/7858d84e127c2c6cd92134166352b9a4245d4ec2)
 - [Import and export boards as ClickUp task CSV](https://github.com/wekan/wekan/commit/1e7911a2d01e629c76c4d2422142c330857a74b0)
