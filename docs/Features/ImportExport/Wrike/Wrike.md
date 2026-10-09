# Wrike

WeKan imports boards from [Wrike](https://www.wrike.com) and exports boards to
it in two files:

- **Wrike Excel**: the tasks, in the layout of Wrike's Excel import template.
- **Wrike workflow**: the board's lists as a Wrike workflow, a set of custom
  statuses. A card's list in the Excel file is one of those statuses.

Wrike does not document the columns of its own Excel export, only those of its
Excel import. WeKan reads and writes that documented import layout, and also
reads Wrike's export, which uses the same column names.

## How to import

### Tasks, from Wrike's Excel export

1. In Wrike, open the folder, project or space and switch to **Table** view.
2. Click the **three-dot menu** in the toolbar and choose **Export project to
   Excel**. Pick **Projects, folders and all tasks**, click **Export**, and
   open the link that appears to download the `.xlsx` file.
   (*Export this table to Excel* also works, but writes only the table's
   columns.)
3. In WeKan, go to **All Boards → New → Import → Wrike**.
4. Choose the `.xlsx` file and click **Import**.
5. Read the loss report on the import page. It is also kept in **Admin Panel →
   Problems → Recovery**.

A file in Wrike's import template, filled in by hand or from another tool,
imports the same way. A `.xls` file must first be saved as `.xlsx`.

### The workflow, from Wrike's API

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

## How to import many boards at once

1. On the import page (**All Boards → New → Import → Wrike**), under **Import
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

## How to export

### 1. The workflow

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

### 2. The tasks

1. In WeKan, **Board Settings → Export → Wrike** downloads the board as an
   `.xlsx` file.
2. In Wrike, open the folder, project or space to import into, click the
   **three-dot menu** under the space's name, hover over **Import** and choose
   **Excel**, then choose the file.

## How to export all boards at once

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

## Format details

### Wrike (tasks)

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

### Wrike workflow

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

## What is kept

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

### Which status group a list gets

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

## What is not kept

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

## REST API

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

## How it is built and tested

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

## Sources

- [Formatting XLS Files for Import to Wrike](https://help.wrike.com/hc/en-us/articles/1500005220102-Formatting-XLS-Files-for-Import-to-Wrike):
  the columns, the custom status columns, and the import steps
- [Exporting and Printing Table View](https://help.wrike.com/hc/en-us/articles/1500005225022-Exporting-and-Printing-Table-View):
  the export steps
- [Wrike API v4: Workflows](https://developers.wrike.com/api/v4/workflows/):
  the workflow JSON
- [Default vs Custom Workflows](https://help.wrike.com/hc/en-us/articles/1500005219382):
  creating a workflow and its status groups

See also the [format coverage table](../Format-Coverage.md) and
[Rules import and export](../../Automation/Rules/Rules.md#wrike-workflows).
