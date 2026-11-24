# Teamwork.com

## What it is

WeKan imports boards from [Teamwork.com](https://www.teamwork.com) and exports
boards to it as an Excel file in the layout of Teamwork.com's **Excel task
import template**. Task lists become lists and tasks become cards; subtasks
become subtask cards.

Teamwork.com documents no export in this layout, and its task list reports
have no published columns. So WeKan reads and writes the documented import
template: you fill it in, or copy your tasks into it, and WeKan reads it.

## Read more

- [Wikipedia: Teamwork.com](https://en.wikipedia.org/wiki/Teamwork.com)
- [Teamwork.com: Importing tasks from Excel](https://support.teamwork.com/projects/tasks/excel-import):
  the ten columns, their value forms, the subtask prefixes and the import
  steps

See also: [format coverage](../Format-Coverage.md),
[all formats](../External-Tools.md).

## How to use it

Each task has its own steps below: importing one board, importing many
boards at once, exporting one board, exporting all boards at once, and the
same from a script through the REST API.

### How to import

1. In Teamwork.com, get the template: open a project, choose **List** or
   **Table** view, click the **⋮** menu at the top right of the view and
   choose **Import Tasks**. Pick a sample file and click **Download Sample**.
2. Fill in the template's ten columns: **Tasklist, Task, Description, Assign
   to, Start date, Due date, Priority, Estimated time, Tags, Status**. Put each
   task below its task list. A task that starts with `-`, `#` or `>` is a
   subtask of the task above it; `--`, `##` or `>>` is one level deeper.
3. Save the file as `.xlsx`. An old `.xls` file is refused: open it in a
   spreadsheet program and save it as `.xlsx` first.
4. In WeKan, go to **All Boards → Add Board → Import → Import board → Teamwork.com**.
5. Choose the `.xlsx` file and click **Import**. Members are not mapped on the
   way in; they can be mapped later.
6. Read the loss report on the import page. It is also kept in **Admin Panel →
   Problems → Recovery**.

### How to import many boards at once

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

### How to export

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

### How to export all boards at once

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

### REST API

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

## How the numbers are calculated

The limits and conversions of this format, from its own code:

- At most 20,000 rows. More stops the import with an error. (`MAX_TEAMWORK_ROWS`
  in
  [models/lib/teamworkFormat.js](../../../../../../models/lib/teamworkFormat.js#L54))

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
[models/lib/teamworkFormat.js](../../../../../../models/lib/teamworkFormat.js),
[server/lib/teamworkWorkbook.js](../../../../../../server/lib/teamworkWorkbook.js).

The tests that pin it:
[tests/playwright/specs/import-export-format-audit.e2e.js](../../../../../../tests/playwright/specs/import-export-format-audit.e2e.js),
[tests/teamworkFormat.test.cjs](../../../../../../tests/teamworkFormat.test.cjs).

The details of the format, what is kept and how it is tested are below.

### Format details

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

### What is kept

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

### What is not kept

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

### How it is built and tested

- `models/lib/teamworkFormat.js` reads and writes the template's rows.
  `server/lib/teamworkWorkbook.js` opens and writes the workbook.
- The parser is registered as `teamwork` in `models/lib/externalParsers.js`,
  and the formatter in `models/lib/externalExportFormatters.js`.
- `tests/teamworkFormat.test.cjs` is the unit test, for both directions.
- The Playwright case is in
  `tests/playwright/specs/import-export-format-audit.e2e.js`: *Teamwork.com:
  an import template imports with its task list, fields and subtask*.

## Commits

 - [Teamwork and Planner workbooks are written a page of cards at a time with ExcelJS's streaming writer](https://github.com/wekan/wekan/commit/a2257442a855ce930cc3ae3a4a5b9fdb16555aa8)
 - [Defer ZIP and Excel initialization until first use](https://github.com/wekan/wekan/commit/3df146c164158d65901d0d29ba123282671d6080)
 - [Excel-based tool exports work again, and All Boards offers Export all boards in its bar](https://github.com/wekan/wekan/commit/8834cecea9c3db559ccc92da19bf7a0c20196ed4)
 - [Read every import source through one path and one file chooser, from one description of the sources](https://github.com/wekan/wekan/commit/c80a656901103bfd29b41843c7e255b4ed3bfa17)
 - [Import and export many boards at once for every format, and document each format in its own directory](https://github.com/wekan/wekan/commit/7858d84e127c2c6cd92134166352b9a4245d4ec2)
 - [Import and export boards as Teamwork.com Excel task import templates](https://github.com/wekan/wekan/commit/7aa90f7a0056412e611e187debcc0ca54189297a)
