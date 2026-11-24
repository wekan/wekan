# Todoist

## What it is

WeKan imports boards from [Todoist](https://todoist.com) and exports boards to
it as a Todoist project CSV file: the file Todoist writes when it exports a
project as CSV, and reads when it imports one. Sections become lists, tasks
become cards, sub-tasks become a checklist and notes become comments.

## Read more

- [Wikipedia: Todoist](https://en.wikipedia.org/wiki/Todoist)
- [Import or export a project as a CSV file in Todoist](https://todoist.com/help/articles/360000748525):
  the columns, the export and import steps, and that completed tasks are not
  exported

See also the [format coverage](../Format-Coverage.md) and
[all formats](../External-Tools.md).

## How to use it

Each task has its own steps below: importing one board, importing many
boards at once, exporting one board, exporting all boards at once, and the
same from a script through the REST API.

### How to import

1. In Todoist, open the project, click the **three dots icon** at the top
   right, choose **Manage data** and then **Export as CSV**. Todoist saves the
   project as a CSV file. (Older Todoist versions called this *Export as a
   template*.)
2. Open the CSV file in a text editor and copy all of it.
3. In WeKan, go to **All Boards → Add Board → Import → Import board → Todoist**.
4. Paste the text into the box and click **Import**. A **Map members** step
   follows with nobody to map: click **Done**. (**Import without mapping
   members (map later)** skips that step.)
5. Read the loss report on the import page. It is also kept in **Admin Panel →
   Problems → Recovery**.

Todoist does not include completed tasks in this export, so they cannot be
imported from it.

### How to import many boards at once

1. On the import page, choose **Todoist**, then under **Import many boards**
   choose several CSV files, or one `.zip` that holds them. Each file becomes
   its own board, imported without member mapping. Members can be mapped
   later.
2. Todoist is imported through the generalized importer, so there is also a
   checkbox **One board per project**: each swimlane the import would create
   becomes its own board, named after that swimlane. A Todoist import puts
   every card in the swimlane **Default** (one file is one project), so for
   Todoist this option makes no difference.

Links (parent cards, dependencies) between cards that end up on different
boards are reported in the loss report rather than kept.

From a script:

```bash
python3 api.py importboardsfrom todoist FILE_OR_DIR ...
```

The arguments are files, directories of files, or `.zip` files.

### How to export

1. In WeKan, open the board, then **Board Settings → Export**.
2. Under **Select what to include**, choose what to export, then click
   **Todoist**. This downloads `<board>.csv`. The Todoist export is for a whole
   board; it is not offered for one swimlane or one list.
3. In Todoist, create a new project or open one, click the **three dots icon**
   at the top right, choose **Manage data** and then **Import from CSV**. Drag
   the CSV file to the upload window, or click **Upload from your computer**.

### How to export all boards at once

In **All Boards**, open the sidebar and choose **Export all boards**, then
**Todoist**. This downloads one `.zip` with one `.csv` file per board you can
export: boards you are a member of, that are not archived and not templates.

To export only some boards, use **Multi-Selection** in the All Boards sidebar,
select the boards, then click **Export**.

From a script:

```bash
python3 api.py exportallboards todoist boards.zip
```

### REST API

```bash
python3 api.py importboardfrom todoist project.csv
python3 api.py importboardsfrom todoist project1.csv project2.csv
python3 api.py exportboardformat BOARDID todoist project.csv
python3 api.py exportallboards todoist boards.zip
```

The HTTP routes:

- `POST /api/boards/import/todoist`: the body is `{"board": "<CSV text>"}`.
- `GET /api/boards/:boardId/export/todoist?authToken=…`
- `GET /api/export-all-boards/todoist?authToken=…`, with
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

The tests that pin it:
[tests/externalExportRoundTrip.test.cjs](../../../../../../tests/externalExportRoundTrip.test.cjs),
[tests/playwright/specs/import-export-format-audit.e2e.js](../../../../../../tests/playwright/specs/import-export-format-audit.e2e.js),
[tests/todoistCsv.test.cjs](../../../../../../tests/todoistCsv.test.cjs).

The details of the format, what is kept and how it is tested are below.

### Format details

What WeKan reads is a
[Todoist project template](https://todoist.com/help/articles/360000748525)
(CSV): the TYPE, CONTENT, DESCRIPTION, PRIORITY, INDENT, AUTHOR, RESPONSIBLE,
DATE ... DEADLINE_LANG columns that **Manage data → Export as CSV** writes and
**Manage data → Import from CSV** reads (they were *Export as a template* and
*Import from template* before).

What the import covers:

- sections as lists (tasks before the first section go to **No section**);
- tasks as cards;
- INDENT 2 and deeper as a **Sub-tasks** checklist;
- notes as comments on the task above;
- `@label` words as labels;
- PRIORITY 1-3 as labels p1-p3 (4 is Todoist's "no priority");
- RESPONSIBLE as the owner;
- DATE as the due date (or the start date, with DEADLINE as the due date).

Dates in words such as `every monday`, DURATION, orphan notes and sub-tasks,
and unknown row types are reported. The export writes the same columns with a
`view_style=board` meta row. Todoist exports no completed tasks, so finished
checklist items are left out.

From the current code (`models/lib/todoistCsvFormat.js`):

- The file needs the TYPE and CONTENT columns. Columns are found by their
  header name, in any case. Other columns, such as IS_COLLAPSED in Todoist's
  current file, are not read.
- A row's TYPE is `section`, `task`, `note` or `meta`. A `meta` row holds
  board settings such as `view_style`; it is read and not kept.
- The `@label` words are taken out of the title. Priority labels come first.
- AUTHOR and RESPONSIBLE are written as `Name (id)`: the number in brackets is
  dropped. A note keeps its AUTHOR as the comment's author.
- DATE and DEADLINE are read when they are a calendar date (`2026-10-10`) or a
  date and time (`2026-10-10 14:30`). A time is read only when TIMEZONE is
  UTC or empty; any other text is reported.
- A sub-task is always an open checklist item, because Todoist's file holds no
  completed tasks.
- The board is named **Imported Todoist**: the file does not carry the
  project's name.
- A file may hold at most 20,000 rows.

The export writes:

- the 14 columns `TYPE, CONTENT, DESCRIPTION, PRIORITY, INDENT, AUTHOR,
  RESPONSIBLE, DATE, DATE_LANG, TIMEZONE, DURATION, DURATION_UNIT, DEADLINE,
  DEADLINE_LANG`, then a `meta` row `view_style=board`;
- a `section` row per list, in the order lists first hold a card;
- a `task` row per card: the title followed by its labels as `@label` words
  (spaces in a label become `_`), PRIORITY 1-3 from a p1-p3 label and 4
  otherwise, the owner as RESPONSIBLE;
- the due date as DATE, or the start date as DATE and the due date as DEADLINE
  when the card has both, with `DATE_LANG` `en` and `TIMEZONE` `UTC`;
- each open checklist item as a `task` row with INDENT 2;
- each comment as a `note` row, with its author as AUTHOR.

### What is kept

| Todoist | WeKan |
| --- | --- |
| `section` row | List |
| `task` row, INDENT 1 | Card |
| `task` row, INDENT 2 or more | Item of the card's **Sub-tasks** checklist |
| `note` row | Comment on the task above, with its author |
| CONTENT | Card title |
| `@label` in CONTENT | Label |
| DESCRIPTION | Description |
| PRIORITY 1, 2, 3 | Label p1, p2, p3 |
| RESPONSIBLE | Card member, when mapped (see below) |
| DATE | Due date, or start date when there is a DEADLINE |
| DEADLINE | Due date |

RESPONSIBLE becomes a card member only when that name is mapped to a WeKan
user, through the REST API's `membersMapping`. The import page maps no one, so
there it is not kept. A comment whose author is not mapped is posted by the
importing user, with the author's name in front of the text.

### What is not kept

The import reports these on the loss report, rather than dropping them
silently:

- a DATE or DEADLINE that is not a calendar date, such as `every monday` or
  `tomorrow` (Todoist's own natural language, also used for repeating tasks);
- DURATION;
- a note with no task above it;
- a sub-task with no task above it;
- a row whose TYPE Todoist does not define.

The export leaves out completed checklist items, archived cards, lists and
swimlanes, swimlanes themselves, assignees other than the owner, dates other
than start and due, custom fields and attachments.

### How it is built and tested

- `models/lib/todoistCsvFormat.js` reads and writes the CSV. Its CSV reader is
  shared by the MeisterTask, Linear, TickTick, ClickUp and Pivotal Tracker
  formats. `models/lib/externalParsers.js` lists it in `EXTERNAL_PARSERS`, and
  `models/kanboardCreator.js` creates the board.
- `models/lib/externalExportFormatters.js` and
  `models/lib/externalExporters.js` collect the board and write the export.
- `tests/todoistCsv.test.cjs` is the unit test, and
  `tests/externalExportRoundTrip.test.cjs` runs the export back through the
  import.
- The Playwright case is in
  `tests/playwright/specs/import-export-format-audit.e2e.js`: *Todoist: a
  project template imports with its sections, labels, description, sub-tasks
  and notes*, and *every external export menu link returns text and refuses an
  unrelated user*.

## Commits

 - [Todoist and TickTick report a column they do not write, instead of dropping it](https://github.com/wekan/wekan/commit/c72a05d11a7527a0b0cb1855de8609de4217faa2)
 - [Read every import source through one path and one file chooser, from one description of the sources](https://github.com/wekan/wekan/commit/c80a656901103bfd29b41843c7e255b4ed3bfa17)
 - [Choose who an import's people become, for every import, and stream imported attachments](https://github.com/wekan/wekan/commit/73db241bd4628070ea95f10a83ace8d4c7cd2497)
 - [Import and export many boards at once for every format, and document each format in its own directory](https://github.com/wekan/wekan/commit/7858d84e127c2c6cd92134166352b9a4245d4ec2)
 - [Import and export boards as OPML outlines](https://github.com/wekan/wekan/commit/e6c8f85518a752b2b3f310907afc2485b11a948a)
 - [Import and export boards as Todoist project templates (CSV)](https://github.com/wekan/wekan/commit/1eabb367e7703234a97e48876165fd15e89fff1f)
