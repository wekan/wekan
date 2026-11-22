# Excel

## What it is

WeKan imports boards from an Excel `.xlsx` workbook laid out as a table, one
card per row - including the table WeKan's own Excel export writes, in any
language, and the "Export all boards" workbook with a sheet per board - and
exports a whole board, a swimlane, a list or one card as an `.xlsx`
workbook. The board export has two forms:

- the default detailed export produces printable A4 card blocks, using the same
  fields offered by the export popup;
- explicitly clearing Card details selects a streaming table whose memory use
  stays flat for very large boards.

The related [PDF export](../PDF/PDF.md) uses the same field selection and the
same card-document model. The intended common layout is described in
[One Card Layout](One-Card-Layout.md). Using the workbook from Excel and VBA is
described in [Excel and VBA](Excel-and-VBA.md).

## Read more

- [Wikipedia: Microsoft Excel](https://en.wikipedia.org/wiki/Microsoft_Excel)
- [Wikipedia: Office Open XML, the .xlsx file format](https://en.wikipedia.org/wiki/Office_Open_XML)
- [ECMA-376, Office Open XML](https://ecma-international.org/publications-and-standards/standards/ecma-376/):
  the `.xlsx` format
- [Rename a worksheet](https://support.microsoft.com/en-us/office/rename-a-worksheet-3f1f7148-ee83-404d-8ef0-9ff99fbad1f9):
  Excel's limits for sheet names

See also: [format coverage](../Format-Coverage.md),
[all formats](../External-Tools.md).

## How to use it

Each task has its own steps below: importing one board, importing many
boards at once, exporting one board, exporting all boards at once, and the
same from a script through the REST API.

### How to import

1. In Excel, or another spreadsheet program, make a sheet with a header row
   (the column names are listed under **Format details**) and one card per
   row below it, and save it as an **Excel Workbook (.xlsx)**. A `.xls` file
   must first be saved as `.xlsx`. A workbook WeKan exported can be imported
   as it is.
2. In WeKan, go to **All Boards → Add Board → Import → Import board → Excel**.
3. Tick the parts to import (**Select what to include**).
4. Under **Choose the export file, or paste its text below:**, choose the `.xlsx` file and click
   **Import**.
5. **Which column is which?** The workbook is opened on the server, and the
   page shows each card field with a choice of the first board sheet's
   columns, matched from the column names - the same step as the
   [CSV / TSV import](../CSV/CSV.md#how-to-import). When the sheet has no
   list column, type the name of the one list every card goes into. The page
   also names the sheets that become boards and the sheets that are not
   imported. Click **Import**.
6. There is no member mapping step for Excel: members can be mapped later.
   The board opens when the import is done; when the workbook held several
   boards, the first one opens and the others are on All Boards.

The workbook is read on the server and imported through the same engine as
the [CSV / TSV import](../CSV/CSV.md), so it reads the same column names.
The file is sent twice: once to read its columns for the mapping step, once
to import it. Like the CSV import, it does not write a loss report.

### How to import many boards at once

- One workbook can hold many boards: every sheet with a header row becomes
  its own board, named after the title above its table (WeKan's export
  writes the board's title in cell A1) or else after the sheet. The
  **Export all boards** workbook (below) imports back this way, one board per
  sheet. The mapping confirmed on the page applies to every sheet whose
  header is the same as the first board sheet's; a sheet with other columns
  is read by its column names.
- On the import page, under **Import many boards**, choose several `.xlsx`
  files, or one `.zip` that holds them. Each file is imported without member
  mapping (members can be mapped later) and without the mapping step: its
  columns are read by their names.
- Excel is not imported through the generalized importer, so **One board per
  project** is not offered for it. A Swimlane column gives one swimlane per
  value instead.
- From a script: `python3 api.py importboardsfrom excel FILE_OR_DIR ...`
  (files, directories of files, or `.zip` files).

### How to export

1. In WeKan, open the menu of what to export: **Board Settings → Export** for
   the board, or the hamburger menu of a swimlane, a list or a card.
2. Under **Select what to include**, tick the sections you want. Keep **Card
   details (each card as in card export)** ticked for the printable card
   blocks, or clear it for the streaming table.
3. Choose **Excel**. The `.xlsx` file downloads.
4. Open it in Excel, LibreOffice Calc or another program that reads `.xlsx`.

### How to export all boards at once

- **All Boards → sidebar → Export all boards**, choose **Excel**: this
  downloads **one `.xlsx` workbook** in which each board you can export
  (boards you are a member of, not archived, not templates) is its own sheet.
  It is not a `.zip`.
- Each sheet is named after the board's title, cut to Excel's 31-character
  limit for sheet names. The characters Excel does not allow in a sheet name,
  `\ / ? * [ ] :`, are replaced, and a number is added when two boards would
  get the same sheet name.
- To export only some boards: **Multi-Selection** in the All Boards sidebar,
  select the boards, then **Export**.
- From a script: `python3 api.py exportallboards excel boards.xlsx`.

### REST API

```bash
python3 api.py importboardfrom excel board.xlsx        # POST /api/boards/import/excel
python3 api.py importboardsfrom excel a.xlsx b.xlsx
python3 api.py exportboardformat BOARDID excel board.xlsx  # GET /api/boards/BOARDID/exportExcel
python3 api.py exportallboards excel boards.xlsx       # GET /api/export-all-boards/excel?authToken=...
```

- `POST /api/boards/import/excel` takes `{ "board": { "excelBase64": "..." } }`:
  the workbook in base64. Every sheet with a header becomes a board, and the
  answer is the first board's id. An optional `csvMapping` beside `board`
  says which column holds which field, as the mapping step does, in the shape
  the [CSV page](../CSV/CSV.md#rest-api) describes; it applies to the sheets
  with the first board sheet's header, and a column the sheet does not have
  is refused with `400`. From `api.py`: `python3 api.py importboardfrom excel
  board.xlsx --csv-mapping mapping.json`.
- `GET /api/boards/BOARDID/exportExcel?authToken=TOKEN` exports a board, with
  `fields` (the ticked parts; leave out `card-details` for the table),
  `swimlaneId` or `listId` to narrow it.
- `GET /api/boards/BOARDID/lists/LISTID/cards/CARDID/exportExcel?authToken=TOKEN`
  exports one card.
- `GET /api/export-all-boards/excel?authToken=TOKEN` exports all boards as one
  workbook; `&boardIds=ID1,ID2` exports only those boards.

## How the numbers are calculated

The limits and conversions of this format, from its own code:

- A list name given in the column mapping may be at most 255 characters; a
  longer one makes the mapping invalid. (`MAX_LIST_NAME` in
  [models/lib/csvImportMapping.js](../../../../../../models/lib/csvImportMapping.js#L73))
- The column mapping accepts at most 10,000 columns. (`MAX_COLUMNS` in
  [models/lib/csvImportMapping.js](../../../../../../models/lib/csvImportMapping.js#L74))
- The header row read for the column mapping has at most 10,000 cells.
  (`MAX_HEADER_CELLS` in
  [server/methods/csvImportMapping.js](../../../../../../server/methods/csvImportMapping.js#L15))
- The column mapping step shows the first 3 data rows of the file as samples.
  (`SAMPLE_ROWS` in
  [server/methods/csvImportMapping.js](../../../../../../server/methods/csvImportMapping.js#L16))

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
[client/components/boards/exportScope.jade](../../../../../../client/components/boards/exportScope.jade),
[client/components/import/csvMapping.js](../../../../../../client/components/import/csvMapping.js),
[models/csvCreator.js](../../../../../../models/csvCreator.js),
[models/exportExcel.js](../../../../../../models/exportExcel.js),
[models/exportExcelCard.js](../../../../../../models/exportExcelCard.js),
[models/lib/cardDocument.js](../../../../../../models/lib/cardDocument.js),
[models/lib/cardExportDocument.js](../../../../../../models/lib/cardExportDocument.js),
[models/lib/csvImportMapping.js](../../../../../../models/lib/csvImportMapping.js),
[models/server/ExporterExcel.js](../../../../../../models/server/ExporterExcel.js),
[models/server/ExporterExcelBoard.js](../../../../../../models/server/ExporterExcelBoard.js),
[models/server/ExporterExcelCard.js](../../../../../../models/server/ExporterExcelCard.js),
[models/server/createWorkbook.js](../../../../../../models/server/createWorkbook.js),
[models/server/renderCardDocumentExcel.js](../../../../../../models/server/renderCardDocumentExcel.js),
[server/lib/excelBoardWorkbook.js](../../../../../../server/lib/excelBoardWorkbook.js),
[server/methods/csvImportMapping.js](../../../../../../server/methods/csvImportMapping.js).

The tests that pin it:
[tests/csvImportMapping.test.cjs](../../../../../../tests/csvImportMapping.test.cjs),
[tests/excelExport.test.cjs](../../../../../../tests/excelExport.test.cjs),
[tests/exportExcelCardContainment.test.cjs](../../../../../../tests/exportExcelCardContainment.test.cjs),
[tests/playwright/specs/25-excel-pdf.e2e.js](../../../../../../tests/playwright/specs/25-excel-pdf.e2e.js),
[tests/playwright/specs/export-access.e2e.js](../../../../../../tests/playwright/specs/export-access.e2e.js),
[tests/playwright/specs/import-export-format-audit.e2e.js](../../../../../../tests/playwright/specs/import-export-format-audit.e2e.js),
[tests/xlsxTabColorCssInjection.test.cjs](../../../../../../tests/xlsxTabColorCssInjection.test.cjs).

The details of the format, what is kept and how it is tested are below.

### Format details

From the [format coverage](../Format-Coverage.md) audit:

- **Authoritative shape:** ECMA-376 workbook data consumed through the
  maintained ExcelJS fork.
- **Required import coverage:** multiple worksheets when documented, typed
  cells and dates, formulas as displayed values, custom-field columns and
  size, row and column bounds.

The import reads every worksheet, finds each one's header row, reads a
formula cell as its calculated result, a rich text cell as its text and a
date cell as a date, and hands each board's rows to the CSV import
(`server/lib/excelBoardWorkbook.js`, `models/lib/csvImportMapping.js`).

#### Import columns

The header is the first row that names a title column - row 1 of a plain
table, row 7 of WeKan's export, which has the board's title, description,
dates and members above it. A header below row 1 has to name at least four
known columns, so a note somewhere above a table is not taken for one. The
column names are the same as the
[CSV import's](../CSV/CSV.md#import-columns): English names such as `Title`,
`Status`, `Owner`, `Due date`, `Labels` and `CustomField-NAME-TYPE`, and the
names WeKan's exports write in every language. The mapping step shows what
was matched, and anything can be changed there.

- A sheet without a header row is not a board: WeKan's **Activity** sheet
  (its header names an activity and a card, not a title), an empty sheet or
  a sheet of notes is skipped, and the mapping step lists it. When no sheet
  has a recognised header, the first sheet's first row is the header.
- A formula cell is read as the result the spreadsheet program last
  calculated and saved; rich text as its text; a hyperlink as its text; an
  error cell as empty; a date cell as that moment.
- A merged range is one cell: the cells it covers are empty.
- Labels are separated by spaces or commas, so the export's
  `Bug ,Feature` is two labels.
- With no list column, every card of the sheet goes to one list: the name
  typed in the mapping step, or *To do* in the importing user's language.
- The board is private and the importing user is its admin.

#### Importing a WeKan Excel export again

Import the streaming table export, or the **Export all boards** workbook, as
it is: the header in row 7 is found in the language it was exported in,
every column but Number is chosen for its field (Parent card links the card
to the card with that title), the board is named after cell A1, and the
Activity sheet is skipped. The table has no custom field columns. The
detailed card-block export is a printed layout, not a table, and does not
import.

#### Export layout

The board, swimlane, list and card hamburger menus all include the same
`exportScopeBody` Blaze template from
`client/components/boards/exportScope.jade`. Its format table, section
checkboxes, URL builder, locale parameters and scope parameters are defined
once in `client/components/boards/exportScope.js`. There are no separate Excel
or PDF menu templates for the four scopes.

On the server, scope changes only the surrounding hierarchy and the cards
selected. Every selected card goes through `buildExportCardDocument`; detailed
board, list and swimlane Excel then calls the same
`ExporterExcelCard.renderCardBlock` used by a single-card export. Excel-specific
code only converts the shared blocks into worksheet cells, fills, borders,
progress bars and images.

ExcelJS writes rich text for Markdown, embeds JPEG, PNG, GIF and BMP attachment
previews, formats dates in the requesting browser's timezone, and prints only
the sections selected in the export dialog. The workbook is generated directly
into the HTTP response and does not use a temporary export file.

Detailed exports follow the visible hierarchy. A board workbook starts with the
board name, members, creation time and modification time, then writes each
swimlane, each list in that swimlane, and each card in that list. A swimlane
export starts with that swimlane and continues with its lists and cards; a list
export starts with that list and its cards; a card export contains that card.
Even a board with one visible swimlane names it explicitly. PDF uses this same
ordering.

The shared card block includes the complete opened-card data: labels, stickers,
all locations (place name, address, latitude and longitude), people, board/list/
swimlane information, numeric sort position, dates and time tracking,
dependencies, description, custom fields, checklists, subtasks, comments,
attachments, voting and planning poker. Legacy single-location fields are
rendered the same way as the current multiple-location array.

The attachment section lists every file in a six-column details table: row
number, filename, human-readable size, media type, upload date/time and
uploader. Preview images use one worksheet column each, up to six on the same
row, with the filename in the cell directly below each image. The seventh image
starts the next image row, followed by its own filename row.

The streaming table (Card details cleared) has one row per card with these
columns: Number, Title, Description, Parent card, Owner, Created at, Last
modified at, Received, Start, Due, End, List, Swimlane, Assignee, Members,
Requested By, Assigned By, Labels, Overtime (hours) and Spent time (hours),
and a second sheet, **Activity**, with the board's comments.

Excel stores text as Unicode, so the export preserves every language. The
`.xlsx` format used by ExcelJS cannot portably embed an OpenType font: it records
a font family name and the spreadsheet application selects an installed font or
fallback. Bundling GNU Unifont therefore fixes portable PDF rendering but cannot
force the same font into an Excel workbook. Converting cells to pictures would
make all glyphs visible but would destroy editing, searching, copying and
accessibility, so WeKan keeps real Unicode cell text.

#### Current progress

Completed:

- board, list, swimlane and single-card export routes;
- field selection for board and card details;
- localized labels and user-timezone dates;
- the logged-in user's saved language, falling back to the current browser
  language when no language is saved;
- the date format displayed by the opened card;
- Markdown-rich descriptions, comments, checklist items and custom fields;
- attachment metadata and inline image previews;
- voting, planning poker, checklists, subtasks and custom fields;
- a shared document renderer for a single card and detailed board export,
  including six-column metadata, colored labels, checklist progress,
  attachment metadata and image placement;
- one shared hamburger-menu template and one raw-record adapter across board,
  swimlane, list and card PDF/Excel exports;
- access checks that constrain a card to the authorized board and list;
- an Excel import round trip for the board-table shape.

There is no remaining export-layout implementation item. Portable font
embedding in `.xlsx` is a file-format/library limitation rather than an omitted
font asset; PDF is the format to use when identical glyph rendering on every
device is required.

The design and progress live here rather than in `CHANGELOG-big.md`'s TODO list so
implementation details stay beside the format they describe.

### What is kept

On import:

| Excel column | WeKan |
| --- | --- |
| Every sheet with a header row | A board, named after the title above the table or the sheet |
| Title, Description | Card title, description |
| List (Stage / Status / State) | List; without it, one list named in the mapping step |
| Swimlane | Swimlane |
| Owner | The card's creator when it is the importing user's username |
| Labels (`name-color`) | Board labels and the card's labels |
| Received, start, due, end, created and last modified dates | Card dates |
| Requested By, Assigned By | The card's free text |
| Parent card | The card's parent, by title |
| Spent time, Overtime | Spent time, overtime |
| `CustomField-...` | Board custom fields and the card's values |
| Other columns ticked in the mapping step | Text custom fields |
| Formula and rich text cells | Their values |

On export, the detailed workbook keeps every section of the opened card
listed under **Export layout**, as far as the sections are ticked.

### What is not kept

On import:

- sheets without a header row, including WeKan's Activity sheet (the
  comments of the export);
- members, assignees and owners other than the importing user, because the
  Excel import has no member mapping step;
- columns no field uses and that were not ticked as custom fields, cell
  formatting and images;
- a formula's formula: only its saved result is read. A workbook saved by a
  program that does not store results reads such a cell as empty;
- label names with spaces or commas in them: those separate two labels.

The Excel import writes no loss report, so none of this is listed in Admin
Panel → Problems.

On export, the `.xlsx` cannot carry its own font, so the spreadsheet program
picks a font. The streaming table has no custom fields, checklists or
attachments; use the detailed export for those.

### How it is built and tested

- Import: `server/lib/excelBoardWorkbook.js` opens the workbook with
  `@wekanteam/exceljs`; `models/lib/csvImportMapping.js` reads the cells,
  finds each sheet's header and plans each board; the `excel` case in
  `models/import.js` imports each board through `models/csvCreator.js`;
  `client/components/import/import.js` sends the file and
  `client/components/import/csvMapping.js` shows the mapping step, whose
  columns come from the `excelImportPreview` method
  (`server/methods/csvImportMapping.js`).
- `models/exportExcel.js` and `models/server/ExporterExcel.js` implement the
  streaming board table.
- `models/exportExcelCard.js` and
  `models/server/ExporterExcelCard.js` implement a printable card workbook.
- `models/server/ExporterExcelBoard.js` reuses the card renderer for every card
  when detailed board export is selected.
- `models/server/renderCardDocumentExcel.js` renders every block from the shared
  card document with the six-column worksheet geometry.
- `models/lib/cardExportDocument.js` is the single adapter from board, card,
  people, checklist, comment and attachment records to that card document. PDF
  calls the same adapter, including for human-readable attachment sizes.
- `models/server/createWorkbook.js` selects the safe buffered ExcelJS writer
  when the installed streaming writer cannot load.
- `models/lib/cardDocument.js` is the medium-independent card layout shared
  with PDF.
- Unit tests: `tests/csvImportMapping.test.cjs` (a WeKan export in Finnish
  with its header in row 7 and its Activity sheet, a workbook with a sheet
  per board, formula, rich text and date cells), `tests/excelExport.test.cjs`,
  `tests/exportExcelCardContainment.test.cjs`,
  `tests/xlsxTabColorCssInjection.test.cjs`.
- Playwright: `tests/playwright/specs/25-excel-pdf.e2e.js` (importing an
  `.xlsx` creates a board with the rows),
  `tests/playwright/specs/import-export-format-audit.e2e.js` (multiline
  Unicode text survives an Excel import; an empty import fails without
  creating a board; a WeKan export workbook in Finnish with a sheet per board
  imports as several boards) and `tests/playwright/specs/export-access.e2e.js` (an
  assigned-only member cannot export the whole board, or an unassigned card).

## Commits

 - [CSV, TSV and Excel imports keep every column: one with no card field becomes a text custom field](https://github.com/wekan/wekan/commit/5b9fa791a82da0bcaa01e5b04f8e711c011580db)
 - [Teamwork and Planner workbooks are written a page of cards at a time with ExcelJS's streaming writer](https://github.com/wekan/wekan/commit/a2257442a855ce930cc3ae3a4a5b9fdb16555aa8)
 - [Defer ZIP and Excel initialization until first use](https://github.com/wekan/wekan/commit/3df146c164158d65901d0d29ba123282671d6080)
 - [Write the card and board Excel exports as they are drawn, reading each picture only when it is written](https://github.com/wekan/wekan/commit/b1841b75254a5e0fa008aa87ca1da7ed78b5a8c0)
 - [Ask for the columns of a CSV or Excel import, apply Owner, and import WeKan's own Excel export](https://github.com/wekan/wekan/commit/86652c8718abf6a91964d2676b711ef9093829cc)
 - [Export Wrike Excel with Wrike's custom workflow statuses, and import and export Wrike workflows as lists and rules](https://github.com/wekan/wekan/commit/a78b4aa744b011fc385bbd462b83fb092b547efd)
 - [Import and export boards as Businessmap (Kanbanize) Excel workbooks](https://github.com/wekan/wekan/commit/edb808e266ee214f91a1330535a8749a79001063)
 - [Import and export boards as Teamwork.com Excel task import templates](https://github.com/wekan/wekan/commit/7aa90f7a0056412e611e187debcc0ca54189297a)
 - [Import and export boards as Wrike Excel workbooks](https://github.com/wekan/wekan/commit/063365e8b919b5e3ad1974d52cbd2747f86c08f1)
 - [Import and export boards as monday.com Excel workbooks](https://github.com/wekan/wekan/commit/1ceaad80f48ff5133af4f0dc6a5443761c274e89)
 - [Import and export boards as Microsoft Planner Excel workbooks](https://github.com/wekan/wekan/commit/7ef5b875fa24edc99a4a4a7c37d1d2cad2c88c51)
 - [Write dates as real date cells in every Excel export](https://github.com/wekan/wekan/commit/278db0ada3c9f695d82ead81b75c5f15c715b959)
 - [Restore the full-featured DOCX/XLSX/PPTX viewer and native PDF preview](https://github.com/wekan/wekan/commit/373980ac8a37eb830539b01ffc12dfb0c0a53e18)
 - [Validate XLSX sheet colors before CSS serialization](https://github.com/wekan/wekan/commit/e54b123c1086423056d8a79d92f8ba34b1e91e1d)
 - [Share one card document adapter across PDF and Excel exports](https://github.com/wekan/wekan/commit/0885b9a10b596e22d4919b241bb06bbb097d0b55)
 - [Name PDF and Excel exports by their localized scope](https://github.com/wekan/wekan/commit/4b27f4fc455ef47ead365dd430edf54d0bfbd069)
 - [Place six Excel attachment previews per row](https://github.com/wekan/wekan/commit/ef66347f07bb7a28f3ff19e3c230ce460d3e0cda)
 - [Align PDF and Excel card attachment layouts](https://github.com/wekan/wekan/commit/fb52149e94dbee3c1f3118d45f73e44620234a52)
 - [Complete multilingual PDF and Excel exports](https://github.com/wekan/wekan/commit/c796fc6c6b79f2362bd03bea469ba3f3b00ee549)
 - [Step 2: every text in an Excel card export renders its markdown](https://github.com/wekan/wekan/commit/c1b68efbd342b26afe1751425f3da7716341face)
 - [Card PDF and Excel exports say the same thing, in the reader's language, format and time zone](https://github.com/wekan/wekan/commit/698e980e27522b53f60ad6fce347727cb11eb017)
 - [Fix the board Excel export, and the attachment stuck as .bin](https://github.com/wekan/wekan/commit/a712db94737d6f1e49c7d773e2cc004911f39a80)
 - [PassBleed: the Excel card export authorised one board and read a card from another](https://github.com/wekan/wekan/commit/5269d0ba5c791d9017637da3c2e103d55daae313)
 - [Stream board exports (JSON, CSV/TSV, Excel) with bounded memory](https://github.com/wekan/wekan/commit/41cd166358ea40a4517eddd02fe1913c22b7777b)
 - [Fix ExcelBleed](https://github.com/wekan/wekan/commit/7bbd1a3fad5d868fd01d79b5908913e215698e8e)
 - [Export Card to Excel. Part 3. Also, fixed uploading attachments](https://github.com/wekan/wekan/commit/5c5ed102cabd07e1be00d3fdb01ea599da0a5517)
 - [Export Card to Excel. Part 2](https://github.com/wekan/wekan/commit/7de1b04ebc51269e37840e74ba8fa72eed59950e)
 - [Export Card to Excel and related fixes. Part 1](https://github.com/wekan/wekan/commit/be5bdbe3142f54f571fcef79cac064cec6da17d2)
 - [Fix: Impossible to export board to excel where title exceeding 31 chars](https://github.com/wekan/wekan/commit/08a01c6d2c9c4639414890688441d5aec56ba753)
 - [Excel Export : fix add comments worksheet (#4045)](https://github.com/wekan/wekan/commit/e694c587e5fd866ecd6c6cef333f3c41ac1a0b1e)
