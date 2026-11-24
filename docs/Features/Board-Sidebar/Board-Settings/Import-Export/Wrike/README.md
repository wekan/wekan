# Wrike

## What it is

WeKan imports boards from [Wrike](https://www.wrike.com) and exports boards to
it in two files:

- **Wrike Excel**: the tasks, in the layout of Wrike's Excel import template.
- **Wrike workflow**: the board's lists as a Wrike workflow, a set of custom
  statuses. A card's list in the Excel file is one of those statuses.

Wrike does not document the columns of its own Excel export, only those of its
Excel import. WeKan reads and writes that documented import layout, and also
reads Wrike's export, which uses the same column names.

## Read more

- [Wikipedia: Wrike, the project management app](https://en.wikipedia.org/wiki/Wrike)
- [Formatting XLS Files for Import to Wrike](https://help.wrike.com/hc/en-us/articles/1500005220102-Formatting-XLS-Files-for-Import-to-Wrike):
  the columns, the custom status columns, and the import steps
- [Exporting and Printing Table View](https://help.wrike.com/hc/en-us/articles/1500005225022-Exporting-and-Printing-Table-View):
  the export steps
- [Wrike API v4: Workflows](https://developers.wrike.com/api/v4/workflows/):
  the workflow JSON
- [Default vs Custom Workflows](https://help.wrike.com/hc/en-us/articles/1500005219382):
  creating a workflow and its status groups

See also the [format coverage table](../Format-Coverage.md) and
[Rules import and export](../../../../Rules/Rules/README.md#wrike-workflows).

## How to use it

Each task has its own steps below: importing one board, importing many
boards at once, exporting one board, exporting all boards at once, and the
same from a script through the REST API.

### How to import

#### Tasks, from Wrike's Excel export

1. In Wrike, open the folder, project or space and switch to **Table** view.
2. Click the **three-dot menu** in the toolbar and choose **Export project to
   Excel**. Pick **Projects, folders and all tasks**, click **Export**, and
   open the link that appears to download the `.xlsx` file.
   (*Export this table to Excel* also works, but writes only the table's
   columns.)
3. In WeKan, go to **All Boards → Add Board → Import → Import board → Wrike**.
4. Choose the `.xlsx` file and click **Import**.
5. Read the loss report on the import page. It is also kept in **Admin Panel →
   Problems → Recovery**.

A file in Wrike's import template, filled in by hand or from another tool,
imports the same way. A `.xls` file must first be saved as `.xlsx`.

#### The workflow, from Wrike's API

Wrike has no file export of workflows. Its API returns them:

1. In Wrike, create an API token (Apps & Integrations → API).
2. Save the workflows:
   `curl -H "Authorization: bearer TOKEN" https://www.wrike.com/api/v4/workflows > workflows.json`
3. In WeKan, open the board, then **Board Settings → Rules → Import / Export
   rules**.
4. Choose the target board under **Import target**, paste the JSON into the text
   box and click **Import Wrike workflow**.

WeKan reads the first workflow that is neither hidden nor Wrike's standard one.
Each status the board has no list for becomes a list, after the list of the
status before it, with the nearest WeKan color. Each status also gets a rule:

- a card moved into a **Completed** or **Cancelled** status is marked complete;
- a card moved into an **Active** or **Deferred** status is marked incomplete.

That is what Wrike's status groups do with a task. The rules show in the Rules
list, Workflow and Blocks views like any other rule. A list that already has a
complete or incomplete move rule keeps it, so importing again adds nothing.
Only board admins can import a workflow.

### How to import many boards at once

1. On the import page (**All Boards → Add Board → Import → Import board → Wrike**), under **Import
   many boards**, choose several `.xlsx` files, or one `.zip` that holds them.
   Each file becomes its own board, imported without member mapping (members
   can be mapped later).
2. Wrike files are imported through the generalized importer, so there is
   also a checkbox **One board per project**. It makes each swimlane the
   import would create its own board, named after that swimlane. For Wrike the
   swimlanes are the **folders and projects**: each folder or project row
   (Title `/A/B/`) becomes the board `A/B`, with the tasks under it. Tasks
   above the first folder row go to a board named **Default**.
3. Parent tasks and dependencies (Depends On) between tasks that end up on
   different boards are reported in the loss report rather than kept.

Workflows are imported one board at a time, in the Rules dialog.

From a script:

```bash
python3 api.py importboardsfrom wrike FILE_OR_DIR ...
```

It takes files, directories of files, or `.zip` files.

### How to export

#### 1. The workflow

1. In WeKan, **Board Settings → Export → Wrike workflow** downloads
   `<board>.json`. **Rules → Import / Export rules → Export Wrike workflow**
   downloads the same JSON as `wrike-workflow.json`.
2. In Wrike, an admin creates that workflow: **Account Management →
   Workflows → + New workflow**. Give it the board's title, then add each
   status of the JSON under its group (Active, Completed, Deferred,
   Cancelled), with the same name and color, in the same order, and click
   **Save**. With API access, `POST /workflows` and `PUT /workflows/{id}` take
   the same fields.

Names must match exactly, case included: Wrike's Excel import applies a custom
status only when the workflow and status named in the file exist. Otherwise it
uses a status of its default workflow.

#### 2. The tasks

1. In WeKan, **Board Settings → Export → Wrike** downloads the board as an
   `.xlsx` file.
2. In Wrike, open the folder, project or space to import into, click the
   **three-dot menu** under the space's name, hover over **Import** and choose
   **Excel**, then choose the file.

### How to export all boards at once

1. In WeKan, go to **All Boards**, open the sidebar and choose **Export all
   boards**, then **Wrike** (the tasks) or **Wrike workflow** (the
   workflows). This downloads one `.zip` with one file per board you can
   export: boards you are a member of, that are not archived and are not
   templates.
2. To export only some boards, choose **Multi-Selection** in the All Boards
   sidebar, select the boards, then **Export**.

From a script:

```bash
python3 api.py exportallboards wrike boards.zip
python3 api.py exportallboards wrikeworkflow workflows.zip
```

### REST API

```bash
python3 api.py importboardfrom wrike board.xlsx          # POST /api/boards/import/wrike
python3 api.py exportboardformat BOARDID wrike board.xlsx
python3 api.py exportboardformat BOARDID wrikeworkflow workflow.json
python3 api.py importboardsfrom wrike a.xlsx b.xlsx
python3 api.py exportallboards wrike boards.zip
python3 api.py exportallboards wrikeworkflow workflows.zip
```

- `POST /api/boards/import/wrike` imports one file.
- `GET /api/boards/:boardId/export/wrike?authToken=…` and
  `GET /api/boards/:boardId/export/wrikeworkflow?authToken=…` export one board.
- `GET /api/export-all-boards/wrike?authToken=…` and
  `GET /api/export-all-boards/wrikeworkflow?authToken=…` export all boards you
  can export; add `&boardIds=ID1,ID2` to export only those boards.

## How the numbers are calculated

The limits and conversions of this format, from its own code:

- At most 65,000 rows. More stops the import with an error. (`MAX_WRIKE_ROWS` in
  [models/lib/wrikeFormat.js](../../../../../../models/lib/wrikeFormat.js#L74))
- A Wrike `Key` must be a whole number from 1 to 999,999; any other key is
  reported. (`MAX_KEY` in
  [models/lib/wrikeFormat.js](../../../../../../models/lib/wrikeFormat.js#L76))
- A Wrike workflow or status name is at most 128 characters; a repeated name is
  cut to make room for its " (2)". (`MAX_WRIKE_NAME` in
  [models/lib/wrikeWorkflow.js](../../../../../../models/lib/wrikeWorkflow.js#L47))

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
[models/lib/wrikeFormat.js](../../../../../../models/lib/wrikeFormat.js),
[models/lib/wrikeWorkflow.js](../../../../../../models/lib/wrikeWorkflow.js),
[server/lib/wrikeWorkbook.js](../../../../../../server/lib/wrikeWorkbook.js),
[server/rulesButton.js](../../../../../../server/rulesButton.js).

The tests that pin it:
[tests/playwright/specs/20-rules.e2e.js](../../../../../../tests/playwright/specs/20-rules.e2e.js),
[tests/playwright/specs/import-export-format-audit.e2e.js](../../../../../../tests/playwright/specs/import-export-format-audit.e2e.js),
[tests/wrikeFormat.test.cjs](../../../../../../tests/wrikeFormat.test.cjs),
[tests/wrikeWorkflow.test.cjs](../../../../../../tests/wrikeWorkflow.test.cjs).

The details of the format, what is kept and how it is tested are below.

### Format details

#### Wrike (tasks)

WeKan reads and writes the Excel import template of
[Wrike](https://help.wrike.com/hc/en-us/articles/1500005220102-Formatting-XLS-Files-for-Import-to-Wrike)
and its official sample `excel_import_sample.xls` (sheet `Tasks`):

- **Columns:** `Key, Parent Task, Title, Status, Priority, Assigned To, Start
  Date, Duration, End Date, Depends On, Start Date Constraint, Description`,
  then custom fields. Headers are matched case-insensitively.
- **Folders and projects** are rows whose Title is a path such as
  `/Folder 2/Subfolder 1/`, with the tasks below them.
- Wrike does not document the columns of its own Excel export, so this
  documented template is what is read and written.

The import maps:

- folder and project rows to swimlanes (`A/B`);
- `Custom Status` (else Status, its status group) to the list;
- Workflow to the board's title, when every task names the same one;
- Key to the source reference, and Parent Task to the parent card (a folder's
  Key puts the task in that folder);
- Assigned To (`Name <email>`, comma-separated) to the owner and assignees, by
  name;
- Start Date and End Date (date cells or `YYYY-MM-DD`) to the start and due
  dates;
- Depends On (`13FS`, `2SS`) to is-blocked-by dependencies;
- Priority, Duration and every other column (Effort, Billing type, Budget,
  custom fields) to custom fields.

The import reports: Start Date Constraint; a folder or project's own status,
assignee and dates; a Default task or project workflow on a task row; a status
group the custom status's name does not imply (a list has no group; importing
the Wrike workflow in Rules adds the rule that keeps it); the SS, FF or SF kind
of a dependency; dependencies on folders; bad dates and keys; rows without a
Title; a task without a Key, which cannot be a parent or a dependency; and the
repeated rows of a task in several folders (imported once).

The export writes the template on a `Tasks` sheet:

- a `/<swimlane>/` folder row above each swimlane's cards, except Default's;
- sequential Keys, and Parent Task by Key;
- dates as date cells;
- the five workflow columns of the help article's custom-status table:
  `Default task workflow` on folder rows, and on task rows `Workflow` (the
  board's title), `Status` (the list's status group) and `Custom Status` (the
  list). Wrike then applies the custom status when a workflow of that name
  exists, which the Wrike workflow export below describes;
- Priority as High, Normal or Low.

The labels, comments, checklists, attachments and dependencies are not
written.

#### Wrike workflow

A Wrike workflow as its API's
[Query Workflows](https://developers.wrike.com/api/v4/workflows/)
(`GET /workflows`) returns it:

```
{ kind: "workflows", data: [ { name, standard, hidden,
  customStatuses: [ { name, standardName, color, standard, group, hidden } ] } ] }
```

`group` is one of Active, Completed, Deferred or Cancelled, and `color` one of
Wrike's fourteen StatusColor names. Wrike has no file import or export of
workflows, and its automation rules have no export, import or API at all, so
this JSON is the exchange format. It is read in **Rules → Import / Export
rules**, and written by the board export and by that dialog
(`models/lib/wrikeWorkflow.js`).

- **Import**, into the chosen board: the first workflow that is neither hidden
  nor Wrike's standard one. Each status the board has no list for becomes a
  list after the previous status's list, with the nearest WeKan color, and
  each status gets a rule: a card moved into a Completed or Cancelled status
  is marked complete, into an Active or Deferred one incomplete, unless that
  list already has such a rule. At most 200 statuses are read, and the JSON
  may be at most 1 MB. Reported as not read: the other workflows, hidden and
  nameless statuses, a second status of the same name, and an unknown group
  (Active is used).
- **Export:** one workflow named after the board, a custom status per list in
  board order with the nearest Wrike color. A list's group comes from its move
  rule (mark complete: Completed, or Cancelled when its name says so; mark
  incomplete: Active, or Deferred), else from its name (Wrike's group names,
  Done, Closed, On hold, Rejected ...), else Active. An Active and a Completed
  status are added when no list is one, as Wrike requires both. The same
  workflow and status names are what the Wrike Excel export writes.

### What is kept

| Wrike | WeKan |
| --- | --- |
| Folder or project row (Title `/A/B/`) | Swimlane `A/B` |
| Title, Description | Card title, description |
| Key | The card's source reference |
| Parent Task | Parent card (a folder's Key puts the task in that folder) |
| Custom Status, else Status | List |
| Workflow (when every task names the same one) | Board title |
| Assigned To (`Name <email>`, comma separated) | Owner, then assignees |
| Start Date, End Date | Start date, due date |
| Depends On (`13FS`) | Is-blocked-by dependency |
| Priority, Duration, Effort, Billing type, Budget, custom fields | Custom fields |
| Workflow status (name, group, color) | List and its color, plus a complete or incomplete rule |

The export writes these columns, in the order Wrike's help article gives:

`Key, Parent Task, Title, Default task workflow, Default project workflow,
Workflow, Status, Custom Status, Priority, Assigned To, Start Date, Duration,
End Date, Depends On, Start Date Constraint, Description`, then the board's
custom fields.

- A folder row `/<swimlane>/` comes above each swimlane's cards except
  Default's. It sets the workflow as its tasks' **Default task workflow**.
- Keys are numbered 1, 2, 3, and Parent Task refers to them.
- Dates are written as date cells.
- **Workflow** is the board's title, **Custom Status** the card's list, and
  **Status** that list's status group.
- Priority is written as High, Normal or Low.

#### Which status group a list gets

A list's group comes from the board's rules first:

- A rule "when a card is moved to this list → mark it complete" makes the list
  **Completed**, or **Cancelled** when its name says so (Rejected, Cancelled,
  Won't do).
- A rule "→ mark it incomplete" makes it **Active**, or **Deferred** when its
  name says so (On hold, Paused, Icebox).

Without such a rule the name decides: Wrike's own group names, Done, Closed or
Resolved are Completed, and so on; anything else is Active. Wrike needs an
Active and a Completed status in a workflow, so one is added when no list is
one.

### What is not kept

The import reports these on the loss report, rather than dropping them
silently:

- a Start Date Constraint;
- a folder or project's own status, assignee and dates;
- a Default task or project workflow on a task row;
- the SS, FF or SF kind of a dependency (it is kept as is-blocked-by), and
  dependencies on folders;
- a status group the status's name does not imply. A WeKan list has no group:
  import the workflow as above to add the rule that keeps it;
- bad Keys and dates, and rows without a Title;
- the repeated rows of a task that is in several folders (it is imported once).

The Wrike Excel export does not write labels, comments, checklists,
attachments or dependencies.

Wrike's own automation rules (WHEN–IF–THEN) have no export, import or API, so
they cannot be brought into WeKan. WeKan rules other than the move rules above
have no counterpart in Wrike.

### How it is built and tested

- `models/lib/wrikeFormat.js` reads and writes the Excel rows.
  `server/lib/wrikeWorkbook.js` opens and writes the workbook.
- `models/lib/wrikeWorkflow.js` holds the workflow, its status groups, colors
  and rules. The server method `rules.importWrikeWorkflow` in
  `server/rulesButton.js` applies a workflow to a board.
- `tests/wrikeFormat.test.cjs` and `tests/wrikeWorkflow.test.cjs` are the unit
  tests.
- The Playwright cases are in `tests/playwright/specs/import-export-format-audit.e2e.js`
  (both Wrike imports, and the workflow export) and
  `tests/playwright/specs/20-rules.e2e.js` (applying a workflow twice through
  the Rules dialog, and exporting it).

## Commits

 - [Asana, OpenProject, Obsidian and Wrike exports carry what each card waits for](https://github.com/wekan/wekan/commit/c9da13b63e6f1fea86cb30b604093a8a120bcf53)
 - [Monday.com, Businessmap and Wrike workbooks are streamed a page at a time too](https://github.com/wekan/wekan/commit/db9c06dc5eb5d5ff76867431f969da67eb3b0676)
 - [Defer ZIP and Excel initialization until first use](https://github.com/wekan/wekan/commit/3df146c164158d65901d0d29ba123282671d6080)
 - [Excel-based tool exports work again, and All Boards offers Export all boards in its bar](https://github.com/wekan/wekan/commit/8834cecea9c3db559ccc92da19bf7a0c20196ed4)
 - [Read every import source through one path and one file chooser, from one description of the sources](https://github.com/wekan/wekan/commit/c80a656901103bfd29b41843c7e255b4ed3bfa17)
 - [Import and export many boards at once for every format, and document each format in its own directory](https://github.com/wekan/wekan/commit/7858d84e127c2c6cd92134166352b9a4245d4ec2)
 - [Export Wrike Excel with Wrike's custom workflow statuses, and import and export Wrike workflows as lists and rules](https://github.com/wekan/wekan/commit/a78b4aa744b011fc385bbd462b83fb092b547efd)
 - [Import and export boards as Teamwork.com Excel task import templates](https://github.com/wekan/wekan/commit/7aa90f7a0056412e611e187debcc0ca54189297a)
 - [Import and export boards as Wrike Excel workbooks](https://github.com/wekan/wekan/commit/063365e8b919b5e3ad1974d52cbd2747f86c08f1)
 - [Give the Rules page the board's right sidebar instead of its own](https://github.com/wekan/wekan/commit/40a4d9b171d82c81df605d564c7d5e90fae9abda)
 - [Repair Galician attachment trigger agreement](https://github.com/wekan/wekan/commit/bc26fa89047e01642b07b27912900724fd7e74e7)
 - [Repair Basque trigger linking-verb composition](https://github.com/wekan/wekan/commit/afbff51dfb4caa54784eae2c08af01ee6af5972c)
 - [Keep full browser and database tests reliable](https://github.com/wekan/wekan/commit/3c35ecee4e6070b50d492ea923a0ed7fc697c93d)
 - [Isolate RuleBleed browser regression data](https://github.com/wekan/wekan/commit/6d50564c824f7d413cbb74eaf554f8dae567bc52)
 - [Block unauthorized cross-board rule actions](https://github.com/wekan/wekan/commit/dffe85cce428749908c46ef1cae25fe3fb6edd07)
 - [Keep private linked-card snapshots visible in tests](https://github.com/wekan/wekan/commit/b9d3b6bd8123dc7e35002bd34138079b5dbbf250)
 - [Keep action descriptions out of rule documents](https://github.com/wekan/wekan/commit/ea90023287d3c9bd0a2adbfad9669cac2bdb7f3e)
 - [Docs: implemented designs move to docs/Features, filed the way the menu is](https://github.com/wekan/wekan/commit/daaf5639107f19235c0142b9db1565706e622b8b)
 - [Fix the 19 tests my header and menu restructuring broke](https://github.com/wekan/wekan/commit/2790fe50920f2a55ae1c85efede1e2ccf1575bc2)
 - [More Import Export and Rules features](https://github.com/wekan/wekan/commit/f0bce67a3bf301c21ded3eb97e84a3be0010290f)
