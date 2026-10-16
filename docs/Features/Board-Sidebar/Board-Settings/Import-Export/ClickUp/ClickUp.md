# ClickUp

WeKan imports boards from [ClickUp](https://clickup.com) and exports boards to
it as a ClickUp task CSV file. WeKan reads both shapes ClickUp documents: its
workspace task export, and the columns of its Spreadsheets importer. Statuses
become lists, ClickUp lists become swimlanes, and tasks become cards with
their subtasks, assignees, tags, dates, priority and time.

## How to import

1. In ClickUp, export the tasks as CSV, in one of these ways:
   - the workspace: click your Workspace avatar and choose **Settings**, then
     in the sidebar **Imports / Exports**, click **Export Items**, choose the
     locations under **Select locations** and click **Start Export**;
   - one List or Table view: open the view, click **Customize** in the upper
     right and click **Export**, then export all columns as CSV.
2. Open the CSV file in a text editor and copy all of it.
3. In WeKan, go to **All Boards → New → Import → ClickUp**.
4. Paste the text into the box and click **Import**. A **Map members** step
   follows with nobody to map: click **Done**. (**Import without mapping
   members (map later)** skips that step.)
5. Read the loss report on the import page. It is also kept in **Admin Panel →
   Problems → Recovery**.

A CSV file with the columns of ClickUp's Spreadsheets importer imports the
same way.

## How to import many boards at once

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

## How to export

1. In WeKan, open the board, then **Board Settings → Export**.
2. Under **Select what to include**, choose what to export, then click
   **ClickUp**. This downloads `<board>.csv`. The ClickUp export is for a whole
   board; it is not offered for one swimlane or one list.
3. In ClickUp, open **Imports / Exports**, choose **Import items**, then
   **Spreadsheet** as the source. Choose the Space, Folder or List to import
   into, upload the CSV file, and map its columns to ClickUp's fields. See
   [Use the Spreadsheets importer](https://help.clickup.com/hc/en-us/articles/6310834724247-Use-the-Spreadsheets-importer)
   for the steps.

## How to export all boards at once

In **All Boards**, open the sidebar and choose **Export all boards**, then
**ClickUp**. This downloads one `.zip` with one `.csv` file per board you can
export: boards you are a member of, that are not archived and not templates.

To export only some boards, use **Multi-Selection** in the All Boards sidebar,
select the boards, then click **Export**.

From a script:

```bash
python3 api.py exportallboards clickup boards.zip
```

## Format details

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
**Rolled Up Time Text**, then **Checklist**:

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

## What is kept

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
| Priority | Custom field Priority |
| Task Type (other than task) | Custom field Task Type |
| Task Custom ID | Custom field Custom ID |
| Folder Name/Path | Custom field Folder |
| Time Estimated / Time Estimate | Custom field Time Estimate (hours) |
| Checklist (importer) | Checklist **Checklist** |

Assignees become card members only when those names are mapped to WeKan
users, through the REST API's `membersMapping`. The import page maps no one,
so there they are not kept.

## What is not kept

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

Other columns, such as Task Link, Rolled Up Time and the `Text` date columns,
are not read and not reported.

The export leaves out comments, attachments, done state of checklist items,
spent time, archived cards, and custom fields other than those named above.

## REST API

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

## How it is built and tested

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

## Sources

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
