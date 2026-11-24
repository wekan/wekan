# TickTick

## What it is

WeKan imports boards from [TickTick](https://ticktick.com) and exports boards
to it as TickTick's backup CSV file. Each TickTick list becomes a swimlane and
its kanban columns become lists. Tasks keep their tags, dates, checklist,
priority and subtasks. TickTick publishes no specification of this file, so
WeKan reads the layout real backups have.

## Read more

- [Wikipedia: to-do lists](https://en.wikipedia.org/wiki/Todo_list)
- [Vikunja's TickTick migrator](https://github.com/go-vikunja/vikunja/tree/main/pkg/modules/migration/ticktick):
  another reader of the same backup file, used to check the layout
- TickTick publishes no description of the backup file or of the **Backup &
  Import** page. The steps above are the ones WeKan's import page gives; check
  TickTick's [help center](https://help.ticktick.com) if your version differs.

See also the [format coverage](../Format-Coverage.md) and
[all formats](../External-Tools.md).

## How to use it

Each task has its own steps below: importing one board, importing many
boards at once, exporting one board, exporting all boards at once, and the
same from a script through the REST API.

### How to import

1. In TickTick's web version, open **Settings → Account → Backup & Import**
   and click **Generate backup**. A `.csv` file downloads. (TickTick's own
   help does not describe this file; see the note under Sources.)
2. Open the CSV file in a text editor and copy all of it.
3. In WeKan, go to **All Boards → Add Board → Import → Import board → TickTick**.
4. Paste the text into the box and click **Import**. A **Map members** step
   follows with nobody to map: click **Done**. (**Import without mapping
   members (map later)** skips that step.)
5. Read the loss report on the import page. It is also kept in **Admin Panel →
   Problems → Recovery**.

### How to import many boards at once

1. On the import page, choose **TickTick**, then under **Import many boards**
   choose several backup CSV files, or one `.zip` that holds them. Each file
   becomes its own board, imported without member mapping. Members can be
   mapped later.
2. TickTick is imported through the generalized importer, so there is also a
   checkbox **One board per project**: each swimlane the import would create
   becomes its own board, named after that swimlane. For TickTick the
   swimlanes are the **TickTick lists** (List Name), so one backup becomes one
   board per TickTick list, with that list's columns as its lists.

Links (parent cards, dependencies) between cards that end up on different
boards are reported in the loss report rather than kept. For TickTick this is
a subtask whose parent task is in another TickTick list.

From a script:

```bash
python3 api.py importboardsfrom ticktick FILE_OR_DIR ...
```

The arguments are files, directories of files, or `.zip` files.

### How to export

1. In WeKan, open the board, then **Board Settings → Export**.
2. Under **Select what to include**, choose what to export, then click
   **TickTick**. This downloads `<board>.csv`. The TickTick export is for a
   whole board; it is not offered for one swimlane or one list.
3. In TickTick's web version, open **Settings → Account → Backup & Import**
   and choose **Import backup**, then choose the CSV file. The board becomes
   one TickTick list named after the board, and the board's lists become that
   list's kanban columns.

### How to export all boards at once

In **All Boards**, open the sidebar and choose **Export all boards**, then
**TickTick**. This downloads one `.zip` with one `.csv` file per board you can
export: boards you are a member of, that are not archived and not templates.

To export only some boards, use **Multi-Selection** in the All Boards sidebar,
select the boards, then click **Export**.

From a script:

```bash
python3 api.py exportallboards ticktick boards.zip
```

### REST API

```bash
python3 api.py importboardfrom ticktick backup.csv
python3 api.py importboardsfrom ticktick backup1.csv backup2.csv
python3 api.py exportboardformat BOARDID ticktick backup.csv
python3 api.py exportallboards ticktick boards.zip
```

The HTTP routes:

- `POST /api/boards/import/ticktick`: the body is `{"board": "<CSV text>"}`.
- `GET /api/boards/:boardId/export/ticktick?authToken=…`
- `GET /api/export-all-boards/ticktick?authToken=…`, with
  `&boardIds=ID1,ID2` for selected boards only.

## How the numbers are calculated

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
[models/lib/ticktickCsvFormat.js](../../../../../../models/lib/ticktickCsvFormat.js).

The tests that pin it:
[tests/externalExportRoundTrip.test.cjs](../../../../../../tests/externalExportRoundTrip.test.cjs),
[tests/playwright/specs/import-export-format-audit.e2e.js](../../../../../../tests/playwright/specs/import-export-format-audit.e2e.js),
[tests/ticktickCsv.test.cjs](../../../../../../tests/ticktickCsv.test.cjs).

The details of the format, what is kept and how it is tested are below.

### Format details

What WeKan reads is TickTick's backup CSV (**Settings → Account → Backup &
Import → Generate backup**; **Import backup** reads it back). TickTick
publishes no specification: the layout is that of real backups (versions 7.1
and 7.2) and of
[Vikunja's TickTick migrator](https://github.com/go-vikunja/vikunja/tree/main/pkg/modules/migration/ticktick):
a quoted Date / Version / Status preamble, then the columns Folder Name, List
Name, Title, Kind, Tags, Content, Is Check list, Start Date, Due Date, Reminder,
Repeat, Priority, Status, Created Time, Completed Time, Order, Timezone, Is All
Day, Is Floating, Column Name, Column Order, View Mode, taskId, parentId (and
projectKind in 7.2), found by the header and read by name.

What the import covers:

- TickTick lists as swimlanes, and their kanban columns as lists;
- tasks as cards, with Content as the description and its `▫` / `▪` lines as
  the checklist;
- `, `-separated tags as labels;
- the start, due, created and completed dates (an all-day date is the day in
  the task's Timezone);
- Status 1 as completed, 2 as archived, -1 as the label **won't do**;
- Priority 1/3/5 and Folder Name as custom fields;
- taskId / parentId as subtasks.

Reported: reminders, repeat rules and unknown codes. The export writes a 7.2
backup for one TickTick list whose columns are the board's lists.

From the current code (`models/lib/ticktickCsvFormat.js`):

- The header row is the first row whose first cell is **Folder Name**. It must
  have **List Name** and **Title**.
- Dates are read in the backup's form, `2026-10-08T00:00:00+0000`. **Is All
  Day** applies to the start and due dates only: such a date becomes the
  calendar day it falls on in the task's Timezone. Created and completed
  times are always moments.
- Status 1 (completed) and 2 (archived) take Completed Time as the end date.
  Status 2 also archives the card. Status 0 or empty is open; any other status
  is reported and the task imported as open.
- Priority 1, 3 and 5 become the custom field **Priority** with **Low**,
  **Medium** and **High**. Priority 0 is no priority; any other value is
  reported.
- In Content, a line starting with `▫` is an open checklist item and one
  starting with `▪` a done item. The other lines are the description.
- A task in a list without columns goes to the list **Tasks**. A task without
  a List Name goes to the swimlane **Default**.
- The board is named **Imported TickTick backup**.
- Kind, Is Check list, Order, Is Floating, Column Order, View Mode and
  projectKind are read past and not kept.

The export writes:

- the preamble `Date: <today>+0000`, `Version: 7.2` and the Status legend;
- the 25 columns above, every field quoted;
- **List Name** is the board title for every row, and **Column Name** the
  card's list, with **Column Order** its position and **View Mode** `kanban`;
- the description and then the checklist items as `▫` / `▪` lines in Content,
  with Kind `CHECKLIST` and Is Check list `Y` when there are items;
- Status `-1` for a card with the label **won't do** (the label itself is not
  written), `1` for a card with an end date, else `0`;
- Priority 1, 3 or 5 from the custom field Priority, else 0, and **Folder
  Name** from the custom field Folder;
- dates as `YYYY-MM-DDTHH:MM:SS+0000`, Timezone `UTC`, and Is All Day `true`
  when the start and due dates are at midnight UTC;
- taskId as 1, 2, 3 …, and parentId as the parent card's number.

### What is kept

| TickTick | WeKan |
| --- | --- |
| List Name | Swimlane |
| Column Name | List |
| Title | Card title |
| Content (other lines) | Description |
| Content `▫` / `▪` lines | Checklist **Checklist**, `▪` items done |
| Tags (`a, b`) | Labels |
| Start Date | Start date |
| Due Date | Due date |
| Created Time | Creation date |
| Completed Time (Status 1 or 2) | End date |
| Status 2 | Archived card |
| Status -1 | Label **won't do** |
| Priority 1 / 3 / 5 | Custom field Priority: Low / Medium / High |
| Folder Name | Custom field Folder |
| taskId | The card's source reference |
| parentId | Parent card (when it is in the same import) |

### What is not kept

The import reports these on the loss report, rather than dropping them
silently:

- reminders;
- repeat rules: a repeating task is imported once;
- a priority other than 0, 1, 3 or 5;
- a status other than 0, 1, 2 or -1;
- a date that is not in the backup's format;
- a row without a title;
- a parent that is not in the same import, a taskId used twice, and a parent
  link that would form a cycle.

The export leaves out comments, attachments, people, swimlanes (the whole
board is one TickTick list), archived cards and custom fields other than
Priority and Folder.

### How it is built and tested

- `models/lib/ticktickCsvFormat.js` reads and writes the CSV, with the CSV
  reader of `models/lib/todoistCsvFormat.js`. `models/lib/externalParsers.js`
  lists it in `EXTERNAL_PARSERS`, and `models/kanboardCreator.js` creates the
  board.
- `models/lib/externalExportFormatters.js` and
  `models/lib/externalExporters.js` collect the board and write the export.
- `tests/ticktickCsv.test.cjs` is the unit test, and
  `tests/externalExportRoundTrip.test.cjs` runs the export back through the
  import.
- The Playwright case is in
  `tests/playwright/specs/import-export-format-audit.e2e.js`: *TickTick: a
  backup imports with its list, column, tags, due date and checklist*, and
  *every external export menu link returns text and refuses an unrelated
  user*.

## Commits

 - [Todoist and TickTick report a column they do not write, instead of dropping it](https://github.com/wekan/wekan/commit/c72a05d11a7527a0b0cb1855de8609de4217faa2)
 - [Repeating tasks of other tools repeat in WeKan: daily, weekly and monthly as the card's recurrence](https://github.com/wekan/wekan/commit/24ac6b2bd2e55323fa1c6e52eb53ff3291fc80fb)
 - [Ten more exports are written a page of cards at a time, their references read in a light first pass](https://github.com/wekan/wekan/commit/e2cbbe510457940b6db26c90b45307a6c539a0e7)
 - [Read every import source through one path and one file chooser, from one description of the sources](https://github.com/wekan/wekan/commit/c80a656901103bfd29b41843c7e255b4ed3bfa17)
 - [Import and export many boards at once for every format, and document each format in its own directory](https://github.com/wekan/wekan/commit/7858d84e127c2c6cd92134166352b9a4245d4ec2)
 - [Import and export boards as TickTick backup CSV](https://github.com/wekan/wekan/commit/46f026ddb6ca7ca230c29556cd5ca254056fc5dd)
