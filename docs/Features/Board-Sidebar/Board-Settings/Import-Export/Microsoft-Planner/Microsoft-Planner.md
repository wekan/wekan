# Microsoft Planner

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

## How to import

1. In Planner, open the plan, open the **...** menu next to the plan's name
   and choose **Export as Excel** (classic Planner calls it **Export plan to
   Excel**). The `.xlsx` file downloads to your Downloads folder.
2. In WeKan, go to **All Boards → New → Import → Microsoft Planner**.
3. Choose the `.xlsx` file and click **Import**. Under **People in the file**, choose whether
   Planner's people become existing users you pick, placeholder users with
   their own names, or you.
4. Read the loss report on the import page. It is also kept in **Admin Panel →
   Problems → Recovery**.

## How to import many boards at once

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

## How to export

1. In WeKan, open the board, then **Board Settings → Export**.
2. Under **Select what to include**, choose what to export, then click
   **Microsoft Planner**. This downloads `<board>.xlsx`. The Planner export is
   for a whole board; it is not offered for one swimlane or one list.
3. Planner has no import of this workbook: Microsoft documents only the
   export. The file opens in Excel and other spreadsheet programs, and WeKan
   imports it back. Creating Planner tasks from it needs a tool outside
   Planner's own pages; see Microsoft's Planner documentation.

## How to export all boards at once

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

## Format details

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
`tests/fixtures/planner/`.

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

## What is kept

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

## What is not kept

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

## REST API

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

## How it is built and tested

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

## Sources

- [Export a plan to Excel](https://support.microsoft.com/office/4d850c6e-e548-4aab-83b4-b62b68662d2a):
  the export steps and what the workbook holds
- [plannr](https://github.com/program--/plannr): the real Planner export used
  as test data (`tests/fixtures/planner/`)
- [Planner API overview](https://learn.microsoft.com/graph/api/resources/planner-overview):
  the Microsoft Graph API, which needs credentials and is not used

See also the [format coverage](../Format-Coverage.md) and
[all formats](../External-Tools.md).
