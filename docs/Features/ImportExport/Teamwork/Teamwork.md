# Teamwork.com

WeKan imports boards from [Teamwork.com](https://www.teamwork.com) and exports
boards to it as an Excel file in the layout of Teamwork.com's **Excel task
import template**. Task lists become lists and tasks become cards; subtasks
become subtask cards.

Teamwork.com documents no export in this layout, and its task list reports
have no published columns. So WeKan reads and writes the documented import
template: you fill it in, or copy your tasks into it, and WeKan reads it.

## How to import

1. In Teamwork.com, get the template: open a project, choose **List** or
   **Table** view, click the **⋮** menu at the top right of the view and
   choose **Import Tasks**. Pick a sample file and click **Download Sample**.
2. Fill in the template's ten columns: **Tasklist, Task, Description, Assign
   to, Start date, Due date, Priority, Estimated time, Tags, Status**. Put each
   task below its task list. A task that starts with `-`, `#` or `>` is a
   subtask of the task above it; `--`, `##` or `>>` is one level deeper.
3. Save the file as `.xlsx`. An old `.xls` file is refused: open it in a
   spreadsheet program and save it as `.xlsx` first.
4. In WeKan, go to **All Boards → New → Import → Teamwork.com**.
5. Choose the `.xlsx` file and click **Import**. Members are not mapped on the
   way in; they can be mapped later.
6. Read the loss report on the import page. It is also kept in **Admin Panel →
   Problems → Recovery**.

## How to import many boards at once

1. On the import page, under **Import many boards**, choose several `.xlsx`
   files, or one `.zip` that holds them. Each file becomes its own board,
   imported without member mapping (members can be mapped later).
2. Teamwork.com files are imported through the generalized importer, so there
   is also a checkbox **One board per project**. It makes each swimlane the
   import would create its own board, named after that swimlane. A
   Teamwork.com file always imports into one swimlane, **Default**, so the
   option makes no difference for this source.

From a script:

```bash
python3 api.py importboardsfrom teamwork FILE_OR_DIR ...
```

It takes files, directories of files, or `.zip` files.

## How to export

1. In WeKan, open the board, then **Board Settings → Export**. Choose which
   fields to include, then click **Teamwork.com**. The board downloads as an
   `.xlsx` file. This format is offered for a whole board only.
2. In Teamwork.com, open the project to import into, choose **List** or
   **Table** view, click the **⋮** menu at the top right of the view and
   choose **Import Tasks**.
3. Click **Choose file**, choose the file and click **Import File**.
4. Review the tasks and uncheck any you do not want, review the import options
   (map to existing task lists, ignore duplicates), and click **Import Tasks**.

Teamwork.com matches **Assign to** against the e-mail addresses of users on
its site. WeKan writes usernames there, so people are only assigned when the
names match.

## How to export all boards at once

1. In WeKan, go to **All Boards**, open the sidebar and choose **Export all
   boards**, then **Teamwork.com**. This downloads one `.zip` with one file per
   board you can export: boards you are a member of, that are not archived and
   are not templates.
2. To export only some boards, choose **Multi-Selection** in the All Boards
   sidebar, select the boards, then **Export**.

From a script:

```bash
python3 api.py exportallboards teamwork boards.zip
```

## Format details

The file read and written is the Excel template of Teamwork.com's
[task import](https://support.teamwork.com/projects/tasks/excel-import)
(project → List or Table view → ⋮ → Import Tasks).

- **Columns.** The ten columns Tasklist, Task, Description, Assign to, Start
  date, Due date, Priority, Estimated time, Tags, Status. They are found by
  their header and read by name, so their order does not matter. The header
  row is the first row that has both a Tasklist and a Task column; it does not
  have to be row 1. Header names are matched without regard to case or spaces.
- **No export layout.** Teamwork.com documents no export in this layout (its
  task list reports publish no columns), so the template is read and written.
  A `.xls` file must be saved as `.xlsx` first.
- **Inferred, not documented** (medium confidence): a bare number of
  estimated time is minutes, as Teamwork.com keeps estimates in minutes; an
  empty Tasklist cell continues the task list of the row above; a subtask is in
  its parent's task list.
- **Values.** Assign to is comma-separated. Dates are date cells, ISO dates or
  the site's numeric format; the day/month order is decided once for the whole
  file. When the dates could be read either way, or mix both orders, they are
  read as month/day and the loss report says so. Priority is low, medium or
  high. Estimated time is one of `25`, `01:30`, `1h 15m`, `1h` or `2 hours`.
  Tags are comma-separated. Status is Active or Complete.
- **Board title.** The sheet's name, unless it is a generic name such as
  `Sheet1`; then the board is called *Imported Teamwork.com tasks*. A row
  without a task list goes to the list **Tasks**.
- **Limits.** At most 20,000 rows.

The export writes the template on one sheet named after the board:

- the ten columns, in the template's order, with a bold header row;
- Start date and Due date as date cells;
- Estimated time as `HH:MM`;
- Priority in lowercase (low, medium, high), and only those three values;
- Status **Complete** when the card has the Complete field set, a done due
  date or an end date, otherwise **Active**;
- a subtask right after its parent, with one `-` per level, when both are in
  the same list (a Teamwork.com subtask is in its parent's task list).
  Otherwise it is written as a task of its own list;
- a title's own leading `-`, `#` or `>` is dropped, because it would read as a
  subtask prefix and the template has no escape for it;
- commas inside a label are replaced by spaces, as Tags is comma-separated.

## What is kept

| Teamwork.com | WeKan |
| --- | --- |
| Tasklist | List, in the order task lists first appear |
| Task | Card title |
| `-`, `#` or `>` prefix (doubled per level) | Subtask card of the nearest shallower task above it |
| Description | Card description |
| Assign to (comma-separated) | Owner, then assignees |
| Start date, Due date | Start date, due date |
| Priority (low, medium, high) | Custom field Priority (Low, Medium, High) |
| Estimated time | Custom field Estimated time (hours) |
| Tags (comma-separated) | Labels |
| Status Complete | Checkbox custom field Complete, and the due date marked done |
| Sheet name | Board title |

## What is not kept

The import reports these on the loss report, rather than dropping them
silently:

- columns that are not in the template;
- priorities other than low, medium or high;
- statuses other than Active or Complete;
- estimates that are not one of the documented forms;
- dates that are not calendar dates, and dates whose day/month order had to
  be guessed;
- rows without a task name;
- a subtask without a task above it (it is imported as a task);
- a subtask that skips a level (it is imported one level below its parent);
- a subtask whose own Tasklist differs from its parent's (it stays in the
  parent's list).

The export has no column for swimlanes, custom fields other than Priority,
Estimated time and Complete, checklists, comments or attachments, so they are
not written.

## REST API

```bash
python3 api.py importboardfrom teamwork tasks.xlsx          # POST /api/boards/import/teamwork
python3 api.py importboardsfrom teamwork a.xlsx b.xlsx
python3 api.py exportboardformat BOARDID teamwork tasks.xlsx
python3 api.py exportallboards teamwork boards.zip
```

- `POST /api/boards/import/teamwork` imports one file.
- `GET /api/boards/:boardId/export/teamwork?authToken=…` exports one board.
- `GET /api/export-all-boards/teamwork?authToken=…` exports all boards you
  can export; add `&boardIds=ID1,ID2` to export only those boards.

## How it is built and tested

- `models/lib/teamworkFormat.js` reads and writes the template's rows.
  `server/lib/teamworkWorkbook.js` opens and writes the workbook.
- The parser is registered as `teamwork` in `models/lib/externalParsers.js`,
  and the formatter in `models/lib/externalExportFormatters.js`.
- `tests/teamworkFormat.test.cjs` is the unit test, for both directions.
- The Playwright case is in
  `tests/playwright/specs/import-export-format-audit.e2e.js`: *Teamwork.com:
  an import template imports with its task list, fields and subtask*.

## Sources

- [Teamwork.com: Importing tasks from Excel](https://support.teamwork.com/projects/tasks/excel-import):
  the ten columns, their value forms, the subtask prefixes and the import
  steps

See also: [format coverage](../Format-Coverage.md),
[all formats](../External-Tools.md).
