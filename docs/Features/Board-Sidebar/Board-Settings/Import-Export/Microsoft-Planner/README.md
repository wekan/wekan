# Microsoft Planner

## What it is

WeKan imports boards from
[Microsoft Planner](https://www.microsoft.com/microsoft-365/planner) and
exports boards in Planner's layout, as the Excel workbook (`.xlsx`) that
Planner writes when it exports a plan. Buckets become lists and tasks become
cards, with their assignees, dates, labels, checklist and description.

WeKan works with this file only. It does not connect to Planner through the
[Microsoft Graph API](https://learn.microsoft.com/graph/api/resources/planner-overview),
so there is no live import or sync: the Graph API needs credentials, a
Microsoft Entra app registration and a signed-in Microsoft 365 user, which a
WeKan server does not have.

## Read more

- [Wikipedia: Microsoft Planner](https://en.wikipedia.org/wiki/Microsoft_Planner)
- [Export a plan to Excel](https://support.microsoft.com/office/4d850c6e-e548-4aab-83b4-b62b68662d2a):
  the export steps and what the workbook holds
- [plannr](https://github.com/program--/plannr): the real Planner export used
  as test data (`tests/fixtures/planner/`)
- [Planner API overview](https://learn.microsoft.com/graph/api/resources/planner-overview):
  the Microsoft Graph API, which needs credentials and is not used

See also the [format coverage](../Format-Coverage.md) and
[all formats](../External-Tools.md).

## How to use it

Each task has its own steps below: importing one board, importing many
boards at once, exporting one board, exporting all boards at once, and the
same from a script through the REST API.

### How to import

1. In Planner, open the plan, open the **...** menu next to the plan's name
   and choose **Export as Excel** (classic Planner calls it **Export plan to
   Excel**). The `.xlsx` file downloads to your Downloads folder.
2. In WeKan, go to **All Boards → Add Board → Import → Import board → Microsoft Planner**.
3. Choose the `.xlsx` file and click **Import**. Under **People in the file**, choose whether
   Planner's people become existing users you pick, placeholder users with
   their own names, or you.
4. Read the loss report on the import page. It is also kept in **Admin Panel →
   Problems → Recovery**.

### How to import many boards at once

1. On the import page, choose **Microsoft Planner**, then under **Import many
   boards** choose several `.xlsx` files, or one `.zip` that holds them. Each
   file becomes its own board, imported without member mapping. Members can be
   mapped later.
2. Planner is imported through the generalized importer, so there is also a
   checkbox **One board per project**: each swimlane the import would create
   becomes its own board, named after that swimlane. A Planner import puts
   every card in the swimlane **Default** (one workbook is one plan, and its
   buckets are lists), so for Planner this option makes no difference.

Links (parent cards, dependencies) between cards that end up on different
boards are reported in the loss report rather than kept.

From a script:

```bash
python3 api.py importboardsfrom planner FILE_OR_DIR ...
```

The arguments are files, directories of files, or `.zip` files.

### How to export

1. In WeKan, open the board, then **Board Settings → Export**.
2. Under **Select what to include**, choose what to export, then click
   **Microsoft Planner**. This downloads `<board>.xlsx`. The Planner export is
   for a whole board; it is not offered for one swimlane or one list.
3. Planner has no import of this workbook: Microsoft documents only the
   export. The file opens in Excel and other spreadsheet programs, and WeKan
   imports it back. Creating Planner tasks from it needs a tool outside
   Planner's own pages; see Microsoft's Planner documentation.

### How to export all boards at once

In **All Boards**, open the sidebar and choose **Export all boards**, then
**Microsoft Planner**. This downloads one `.zip` with one `.xlsx` file per
board you can export: boards you are a member of, that are not archived and
not templates.

To export only some boards, use **Multi-Selection** in the All Boards sidebar,
select the boards, then click **Export**.

From a script:

```bash
python3 api.py exportallboards planner boards.zip
```

### REST API

```bash
python3 api.py importboardfrom planner plan.xlsx
python3 api.py importboardsfrom planner plan1.xlsx plan2.xlsx
python3 api.py exportboardformat BOARDID planner plan.xlsx
python3 api.py exportallboards planner boards.zip
```

The HTTP routes:

- `POST /api/boards/import/planner`: the body is
  `{"board": {"excelBase64": "<the .xlsx file in base64>"}}`.
- `GET /api/boards/:boardId/export/planner?authToken=…`
- `GET /api/export-all-boards/planner?authToken=…`, with
  `&boardIds=ID1,ID2` for selected boards only.

## How the numbers are calculated

The limits and conversions of this format, from its own code:

- At most 20,000 rows. More stops the import with an error. (`MAX_PLANNER_ROWS`
  in
  [models/lib/plannerFormat.js](../../../../../../models/lib/plannerFormat.js#L48))

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
[models/lib/plannerFormat.js](../../../../../../models/lib/plannerFormat.js),
[server/lib/plannerWorkbook.js](../../../../../../server/lib/plannerWorkbook.js).

The tests that pin it:
[tests/externalExportRoundTrip.test.cjs](../../../../../../tests/externalExportRoundTrip.test.cjs),
[tests/plannerFormat.test.cjs](../../../../../../tests/plannerFormat.test.cjs),
[tests/plannerInstructionTranslations.test.cjs](../../../../../../tests/plannerInstructionTranslations.test.cjs),
[tests/playwright/specs/import-export-format-audit.e2e.js](../../../../../../tests/playwright/specs/import-export-format-audit.e2e.js).

The details of the format, what is kept and how it is tested are below.

### Format details

What WeKan reads is the workbook Planner's
[Export plan to Excel](https://support.microsoft.com/office/4d850c6e-e548-4aab-83b4-b62b68662d2a)
writes:

- sheet **Tasks**;
- **Plan name**, **Plan ID** and **Date of export** on rows 1-3;
- then the header Task ID, Task Name, Bucket Name, Progress, Priority, Assigned
  To, Created By, Created Date, Start Date, Due Date, (Is Recurring,) Late,
  Completed Date, Completed By, Description, Completed Checklist Items,
  Checklist Items, Labels.

Columns are matched by name. The layout follows a real export: the test data
of the [plannr](https://github.com/program--/plannr) package, copied to
`tests/fixtures/planner/`. The newer Planner's **Export as Excel** is described by
Microsoft's [Export a plan to Excel](https://support.microsoft.com/en-us/planner/export-a-plan-to-excel)
with Status, Task title and Assignments; those names are read as Progress,
Task Name and Assigned To.

What the import covers:

- buckets as lists;
- tasks as cards, with the Task ID as the source reference;
- `;`-separated Assigned To as owner and assignees;
- Created By as Requested by;
- the four dates. They are text in the export's locale: the day/month order is
  decided for the whole file, and reported when every date could be either.
  Real date cells are read too;
- Checklist Items as a checklist;
- Labels as labels;
- Progress, Priority and Completed By as custom fields.

Reported: which checklist items were done (Planner exports only a count), a
recurring task's repeat, and unknown progress or priority values. The export
writes the same workbook (`.xlsx`). Several checklists flatten into one list,
and a card with an end date and no Progress field is Completed.

From the current code (`models/lib/plannerFormat.js`,
`server/lib/plannerWorkbook.js`):

- The sheet named **Tasks** is read, or the first sheet when there is none.
  The header row is the first row with both **Task Name** and **Bucket Name**.
  Rows above it are read as `name | value` pairs; **Plan name** becomes the
  board title.
- Date order: a dot as the separator, or a first number above 12 anywhere in
  the file, means day/month. A second number above 12 means month/day. A file
  where every date could be either is read as month/day, Planner's default,
  and this is reported. A file with both kinds is read as month/day and
  reported. ISO dates (`2026-10-08`) are read as they are.
- Progress must be **Not started**, **In progress** or **Completed**. Priority
  must be **Urgent**, **Important**, **Medium** or **Low**.
- **Late** is worked out from the due date and is not stored.
- A task without a bucket goes to the list **No bucket**.
- A workbook may hold at most 20,000 rows.

The export writes the same sheet:

- **Plan name** (the board title), **Plan ID** (the board id) and **Date of
  export**, a blank row, then the 17 columns above (without Is Recurring);
- dates as text in Planner's default `MM/DD/YYYY`;
- Progress from the card's Progress custom field. Without a valid one, a card
  with an end date is **Completed** and any other card **Not started**;
- Priority from the card's Priority custom field, else **Medium**;
- **Late** `true` for a card that is not completed and whose due date has
  passed;
- Completed Date and Completed By only for a completed card;
- all checklist items of all checklists in one `;`-separated **Checklist
  Items** cell, and **Completed Checklist Items** as `done/total`;
- the owner, then the other assignees, in **Assigned To**, separated by `;`;
- the creator (or Requested by) as **Created By**.

### What is kept

| Planner | WeKan |
| --- | --- |
| Plan name | Board title |
| Bucket Name | List |
| Task Name | Card title |
| Description | Description |
| Task ID | The card's source reference |
| Assigned To (`A;B`) | Card members, when mapped (see below) |
| Created By | Requested by |
| Created Date | Creation date |
| Start Date | Start date |
| Due Date | Due date |
| Completed Date | End date |
| Progress, Priority, Completed By | Custom fields of those names |
| Checklist Items (`a;b;c`) | Checklist **Checklist**, every item not done |
| Labels (`a;b`) | Labels |

Assigned To becomes card members only when those names are mapped to WeKan
users, through the REST API's `membersMapping`. The import page maps no one,
so there they are not kept.

### What is not kept

The import reports these on the loss report, rather than dropping them
silently:

- the date order, when every date in the file could be day/month or
  month/day, or when the file mixes both;
- a date that is not a calendar date;
- a Progress or Priority value that is not one of Planner's;
- which checklist items were done: Planner exports only how many (`2/3`), so
  all items are imported as not done;
- a recurring task's repeat (Is Recurring): the task is imported once;
- a row without a Task Name.

The export leaves out comments, attachments, swimlanes, archived cards, lists
and swimlanes, and custom fields other than Progress, Priority and Completed
By. Several checklists become one list of items.

### How it is built and tested

- `models/lib/plannerFormat.js` reads and writes the rows.
  `server/lib/plannerWorkbook.js` opens and writes the workbook with ExcelJS.
  `models/lib/externalParsers.js` lists the parser in `EXTERNAL_PARSERS`, and
  `models/kanboardCreator.js` creates the board.
- `models/lib/externalExportFormatters.js` and
  `models/lib/externalExporters.js` collect the board and write the export.
- `tests/plannerFormat.test.cjs` is the unit test, with the real export in
  `tests/fixtures/planner/`. `tests/externalExportRoundTrip.test.cjs` runs the
  export back through the import, and
  `tests/plannerInstructionTranslations.test.cjs` checks the import page
  instruction in every language.
- The Playwright cases are in
  `tests/playwright/specs/import-export-format-audit.e2e.js`: *Microsoft
  Planner: the export menu link returns a Planner workbook and refuses an
  unrelated user*, and *Microsoft Planner: an exported plan imports through
  the page*.

## Commits

 - [Planner: the newer "Export as Excel" column names are read too; Linear is checked against its importer](https://github.com/wekan/wekan/commit/d3aa34e7b8f5d579fabb0e4df9f06710493fd1f2)
 - [Teamwork and Planner workbooks are written a page of cards at a time with ExcelJS's streaming writer](https://github.com/wekan/wekan/commit/a2257442a855ce930cc3ae3a4a5b9fdb16555aa8)
 - [Defer ZIP and Excel initialization until first use](https://github.com/wekan/wekan/commit/3df146c164158d65901d0d29ba123282671d6080)
 - [Excel-based tool exports work again, and All Boards offers Export all boards in its bar](https://github.com/wekan/wekan/commit/8834cecea9c3db559ccc92da19bf7a0c20196ed4)
 - [Read every import source through one path and one file chooser, from one description of the sources](https://github.com/wekan/wekan/commit/c80a656901103bfd29b41843c7e255b4ed3bfa17)
 - [Choose who an import's people become, for every import, and stream imported attachments](https://github.com/wekan/wekan/commit/73db241bd4628070ea95f10a83ace8d4c7cd2497)
 - [Import and export many boards at once for every format, and document each format in its own directory](https://github.com/wekan/wekan/commit/7858d84e127c2c6cd92134166352b9a4245d4ec2)
 - [Finish import instructions in four Portuguese catalogs](https://github.com/wekan/wekan/commit/a846a7961fd978c668e778b506bda0b6cdc0967f)
 - [Finish import instructions in nine Spanish catalogs](https://github.com/wekan/wekan/commit/771127e70bb89a7374f6ad0b75f29bcf103c07db)
 - [Finish import instructions in five French catalogs](https://github.com/wekan/wekan/commit/7d52e278f32aee6f8c1e796cb1ad665b884c7484)
 - [Import and export boards as monday.com Excel workbooks](https://github.com/wekan/wekan/commit/1ceaad80f48ff5133af4f0dc6a5443761c274e89)
 - [Import and export boards as Microsoft Planner Excel workbooks](https://github.com/wekan/wekan/commit/7ef5b875fa24edc99a4a4a7c37d1d2cad2c88c51)
