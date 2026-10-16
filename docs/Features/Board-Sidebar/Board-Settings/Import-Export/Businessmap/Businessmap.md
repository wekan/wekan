# Businessmap

WeKan imports boards from [Businessmap](https://businessmap.io), formerly
Kanbanize, and exports boards to it as an Excel file.

- **Import** reads the Excel file of Businessmap's Advanced Search export, and
  also a file in the layout of Businessmap's import tool.
- **Export** writes the columns Businessmap's import tool reads, so the file
  can be imported there as it is.

Columns become lists, lanes become swimlanes, and cards keep their owners,
tags, color, dates, comments and parent links.

## How to import

1. In Businessmap, open **Advanced Search** (the magnifying glass in the board
   header or the dashboard). Filter the cards you want, and use **Configure
   results** to pick the columns. Then download the results as an Excel file;
   see Businessmap's article
   [How to Export Card Data](https://knowledgebase.businessmap.io/hc/en-us/articles/115003163029-How-to-Export-Data-from-Businessmap)
   for the download button.
2. Columns are read by their **English** names (Title, Column, Lane, Owner,
   Deadline ...). Businessmap writes them in the account's language, so if
   your account uses another language, rename the header row to English first.
3. The file must be `.xlsx`. An old `.xls` file is refused: open it in a
   spreadsheet program and save it as `.xlsx`.
4. In WeKan, go to **All Boards → New → Import → Businessmap (Kanbanize)**.
5. Choose the `.xlsx` file and click **Import**. Members are not mapped on the
   way in; they can be mapped later.
6. Read the loss report on the import page. It is also kept in **Admin Panel →
   Problems → Recovery**.

A file made for Businessmap's import tool, filled in by hand or from another
tool, imports the same way.

## How to import many boards at once

1. On the import page, under **Import many boards**, choose several `.xlsx`
   files, or one `.zip` that holds them. Each file becomes its own board,
   imported without member mapping (members can be mapped later).
2. Businessmap files are imported through the generalized importer, so there
   is also a checkbox **One board per project**. It makes each swimlane the
   import would create its own board, named after that swimlane. For
   Businessmap the swimlanes are the **Lane** values, or the **Workflow name**
   of cards that have no Lane, so each lane (or workflow) becomes its own
   board. Cards with neither go to a board named **Default**.
3. Parent cards and dependencies between cards that end up on different boards
   are reported in the loss report rather than kept.

From a script:

```bash
python3 api.py importboardsfrom businessmap FILE_OR_DIR ...
```

It takes files, directories of files, or `.zip` files.

## How to export

1. In WeKan, open the board, then **Board Settings → Export**. Choose which
   fields to include, then click **Businessmap (Kanbanize)**. The board
   downloads as an `.xlsx` file. This format is offered for a whole board only.
2. In Businessmap, open the board to import into, open the **Board Sidebar**
   on the right of the board and select the **Import** icon.
3. Click **Browse**, choose the file and follow the import tool's steps; see
   Businessmap's article
   [How to Access the Import Tool and Format Your File](https://knowledgebase.businessmap.io/hc/en-us/articles/360010794520-How-to-Access-the-Import-Tool-and-Format-Your-File-for-Successful-Import).

Businessmap creates or updates at most **100 cards** in one import, so a
larger board is imported there in parts.

## How to export all boards at once

1. In WeKan, go to **All Boards**, open the sidebar and choose **Export all
   boards**, then **Businessmap (Kanbanize)**. This downloads one `.zip` with
   one file per board you can export: boards you are a member of, that are not
   archived and are not templates.
2. To export only some boards, choose **Multi-Selection** in the All Boards
   sidebar, select the boards, then **Export**.

From a script:

```bash
python3 api.py exportallboards businessmap boards.zip
```

## Format details

WeKan reads the Excel file of Businessmap's
[import tool](https://knowledgebase.businessmap.io/hc/en-us/articles/360010794520-How-to-Access-the-Import-Tool-and-Format-Your-File-for-Successful-Import)
and of its
[Advanced Search export](https://knowledgebase.businessmap.io/hc/en-us/articles/115003163029-How-to-Export-Data-from-Businessmap).
The export has the columns the user picked, plus `Links` and `Subtasks` tabs
when those were chosen.

- **Columns** are matched by their documented English names, in any order,
  without regard to case. Businessmap localizes them to the account language,
  so a file from an account in another language needs its headers renamed to
  English. A workbook with no Title, Card ID or Custom Card ID header is
  refused with that explanation.
- **Where the cards are.** The cards are read from the first sheet that has
  such a header in its first 20 rows. Rows above the header are skipped and
  reported.
- **.xlsx only.** An old `.xls` file is refused with a request to save it as
  `.xlsx`.
- **Tags** are comma-separated when a comma is present, otherwise
  space-separated.
- **Deadline** is read as `MM/DD/YYYY`, `DD-MM-YYYY` or `YYYY-MM-DD`, between
  1970 and 2037. The `MM/DD/YY` of the knowledge base's own example table
  (`10/28/21`) is read as 20YY. Created at, Start Date and End Date take the
  same forms without the year range. Excel date cells keep their time.
- **Links** look like `Parents: 1234; Children: 5678, 8765`, with the link
  types Parents, Children, Relatives, Predecessors and Successors. A relation
  written on both cards is kept once.
- **Board title.** The Board name column; else the sheet's name unless it is
  generic (`Sheet1`, `Export`, `Search results`); else *Imported Businessmap
  board*.

The export writes the documented import columns on the first sheet, with the
header in row 1:

- always Title, Description, Column, Lane, Owner, Co-Owners, Tags, Deadline
  and Color; Card ID, Custom Card ID, Workflow name, Priority, Size, Type,
  Start Date, End Date, Planned Start, Planned End, Track and Parent only when
  some card has a value. Other custom fields follow by name;
- dates as ISO dates (`YYYY-MM-DD`);
- **Card ID** and **Parent** only from the Card ID that an import from
  Businessmap kept. A Card ID updates that existing Businessmap card, which is
  the round trip Businessmap recommends; WeKan's own ids are not Businessmap
  ids;
- Priority synonyms mapped to low, average, high or critical (for example
  medium and normal become average, urgent and blocker become critical);
- WeKan palette colors as hex;
- the Default swimlane as an empty Lane;
- comments as repeated **Comment** columns, written as `author: text`;
- a single tag that contains a space with a trailing comma, so Businessmap
  does not split it.

Checklists have no column. Businessmap imports at most 100 cards per run, so
a larger board is imported there in parts.

## What is kept

| Businessmap | WeKan |
| --- | --- |
| Title | Card title (a blank Title with a Card ID becomes `Card <id>`) |
| Description | Card description |
| Column / Column name | List (**No column** when empty) |
| Lane / Lane name | Swimlane |
| Workflow name | Custom field Workflow name, and the swimlane when there is no Lane |
| Board name | Board title |
| Owner, Co-Owners | Owner, then assignees |
| Color (hex, `#067DB7`) | Card color |
| Tags | Labels |
| Deadline | Due date |
| Created at / Creation Date | Created date |
| Start Date, End Date | Start date, end date |
| Archived at / Archivation date | Archived card |
| Comment columns | Comments |
| Card ID | The card's reference, and custom field Card ID |
| Custom Card ID | Custom field (and the reference when there is no Card ID) |
| Parent, Links Parents and Children | Parent card (subtasks) |
| Links Predecessors, Successors | Blocking dependencies |
| Links Relatives | Related dependencies |
| Priority (low, average, high, critical), Size, Type, Planned Start, Planned End, Track | Custom fields |
| Any other column | Custom field of that name |

## What is not kept

The import reports these on the loss report, rather than dropping them
silently:

- the Template column, and Board ID (the cards go into one new board);
- other sheets, such as the `Links` and `Subtasks` tabs (the Links and Parent
  columns of the card sheet are read);
- rows above the header;
- rows without a Title or Card ID, and a blank Title (named `Card <id>`);
- a further parent (a WeKan card has one parent), children that are not in
  the import or already have another parent, and unknown link types;
- dates, deadlines, colors and sizes that cannot be read;
- priorities other than low, average, high or critical (kept as written);
- the archive date (the card is archived, the date is not kept).

The export does not write checklists, attachments or dependencies, and writes
Card ID and Parent only for cards that came from Businessmap.

## REST API

```bash
python3 api.py importboardfrom businessmap cards.xlsx          # POST /api/boards/import/businessmap
python3 api.py importboardsfrom businessmap a.xlsx b.xlsx
python3 api.py exportboardformat BOARDID businessmap cards.xlsx
python3 api.py exportallboards businessmap boards.zip
```

- `POST /api/boards/import/businessmap` imports one file.
- `GET /api/boards/:boardId/export/businessmap?authToken=…` exports one board.
- `GET /api/export-all-boards/businessmap?authToken=…` exports all boards you
  can export; add `&boardIds=ID1,ID2` to export only those boards.

## How it is built and tested

- `models/lib/businessmapFormat.js` reads and writes the sheets' rows.
  `server/lib/businessmapWorkbook.js` opens and writes the workbook.
- The parser is registered as `businessmap` in
  `models/lib/externalParsers.js`, and the formatter in
  `models/lib/externalExportFormatters.js`.
- `tests/businessmapFormat.test.cjs` is the unit test, for both directions.
- The Playwright case is in
  `tests/playwright/specs/import-export-format-audit.e2e.js`: *Businessmap: a
  workbook imports with its column, lane, deadline, priority, comment and
  parent*.

## Sources

- [How to Export Card Data](https://knowledgebase.businessmap.io/hc/en-us/articles/115003163029-How-to-Export-Data-from-Businessmap):
  Advanced Search, Configure results and the Excel download
- [How to Access the Import Tool and Format Your File for Successful Import](https://knowledgebase.businessmap.io/hc/en-us/articles/360010794520-How-to-Access-the-Import-Tool-and-Format-Your-File-for-Successful-Import):
  the import columns, their value forms, the 100-card limit and updating cards
  by Card ID

See also: [format coverage](../Format-Coverage.md),
[all formats](../External-Tools.md).
