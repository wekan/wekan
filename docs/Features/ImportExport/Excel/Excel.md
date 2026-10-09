# Excel

WeKan imports a board from an Excel `.xlsx` workbook laid out as a table, one
card per row, and exports a whole board, a swimlane, a list or one card as an
`.xlsx` workbook. The board export has two forms:

- the default detailed export produces printable A4 card blocks, using the same
  fields offered by the export popup;
- explicitly clearing Card details selects a streaming table whose memory use
  stays flat for very large boards.

The related [PDF export](../PDF/PDF.md) uses the same field selection and the
same card-document model. The intended common layout is described in
[One Card Layout](One-Card-Layout.md). Using the workbook from Excel and VBA is
described in [Excel and VBA](Excel-and-VBA.md).

## How to import

1. In Excel, or another spreadsheet program, make a sheet whose **first row**
   is the header row, with the column names listed under **Format details**,
   and one card per row below it. Save it as an **Excel Workbook (.xlsx)**. A
   `.xls` file must first be saved as `.xlsx`. Only the first sheet of the
   workbook is read.
2. In WeKan, go to **All Boards → New → Import → Excel**.
3. Tick the parts to import (**Select what to include**).
4. Under **Excel file (.xlsx)**, choose the file and click **Import**. The
   import page says: *Choose a WeKan-style .xlsx spreadsheet (the same columns
   as the Excel export: Title, Description, Status/List, Members, Labels,
   dates, custom fields). The first row is the header.*
5. There is no member mapping step for Excel: members can be mapped later.
   The board opens when the import is done.

The workbook is read on the server and imported through the same engine as
the [CSV / TSV import](../CSV/CSV.md), so it reads the same column names. Like
the CSV import, it does not write a loss report.

## How to import many boards at once

- On the import page, under **Import many boards**, choose several `.xlsx`
  files, or one `.zip` that holds them. Each file becomes its own board,
  imported without member mapping (members can be mapped later).
- Excel is not imported through the generalized importer, so **One board per
  project** is not offered for it. An Excel import always makes one swimlane.
- From a script: `python3 api.py importboardsfrom excel FILE_OR_DIR ...`
  (files, directories of files, or `.zip` files).

## How to export

1. In WeKan, open the menu of what to export: **Board Settings → Export** for
   the board, or the hamburger menu of a swimlane, a list or a card.
2. Under **Select what to include**, tick the sections you want. Keep **Card
   details (each card as in card export)** ticked for the printable card
   blocks, or clear it for the streaming table.
3. Choose **Excel**. The `.xlsx` file downloads.
4. Open it in Excel, LibreOffice Calc or another program that reads `.xlsx`.

## How to export all boards at once

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

## Format details

From the [format coverage](../Format-Coverage.md) audit:

- **Authoritative shape:** ECMA-376 workbook data consumed through the
  maintained ExcelJS fork.
- **Required import coverage:** multiple worksheets when documented, typed
  cells and dates, formulas as displayed values, custom-field columns and
  size, row and column bounds.

The current import reads only the first worksheet, turns every cell into text
and hands the rows to the CSV import (`parseXlsxToRows` in
`models/import.js`).

### Import columns

The first row is the header. These headers are read, in any case and in any
order (the same as the [CSV import](../CSV/CSV.md#import-columns)):

- `Title`, `Description`;
- `Stage`, `Status` or `State`: the list, one list per value;
- `Members` or `Member`: usernames separated by spaces (with no member
  mapping on this page they are not applied);
- `Labels` or `Label`: separated by spaces, each `name` or `name-color`;
- `Due date` / `Deadline` / `Due at`, `Start date` / `Start at`,
  `Finish date` / `End at`, `Creation date` / `Created at`, and
  `Update date` / `Updated at` / `Modified at` / `Modified on`;
- `CustomField-NAME-TYPE`, `CustomField-NAME-dropdown-A/B/C` and
  `CustomField-NAME-currency-CODE`.

The board is named **Imported Board** with the import date, is private, and
has one swimlane, **Default**.

### Importing a WeKan Excel export again

The streaming table export starts with the board's title, description,
creation and modification dates and members in rows 1 to 6; its header is row
7, in the exporting user's language. To import it: delete rows 1 to 6, then
rename `List` to `Status`, `Start` to `Start date`, `Due` to `Due date` and
`End` to `Finish date`. The table has no custom field columns. The detailed
card-block export is a printed layout, not a table, and does not import.

### Export layout

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

### Current progress

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

The design and progress live here rather than in `CHANGELOG.md`'s TODO list so
implementation details stay beside the format they describe.

## What is kept

On import:

| Excel column | WeKan |
| --- | --- |
| Title, Description | Card title, description |
| Stage / Status / State | List |
| Labels (`name-color`) | Board labels and the card's labels |
| Due, start, finish, created and updated dates | Card dates |
| `CustomField-...` | Board custom fields and the card's values |

On export, the detailed workbook keeps every section of the opened card
listed under **Export layout**, as far as the sections are ticked.

## What is not kept

On import:

- every sheet after the first;
- members, because the Excel import has no member mapping step;
- columns WeKan does not know, cell formatting and images;
- the value of a cell that holds a formula or formatted (rich) text: such a
  cell is not plain text to the import. Paste the sheet as values before
  importing;
- label names with spaces in them: a space separates two labels.

The Excel import writes no loss report, so none of this is listed in Admin
Panel → Problems.

On export, the `.xlsx` cannot carry its own font, so the spreadsheet program
picks a font. The streaming table has no custom fields, checklists or
attachments; use the detailed export for those.

## REST API

```bash
python3 api.py importboardfrom excel board.xlsx        # POST /api/boards/import/excel
python3 api.py importboardsfrom excel a.xlsx b.xlsx
python3 api.py exportboardformat BOARDID excel board.xlsx  # GET /api/boards/BOARDID/exportExcel
python3 api.py exportallboards excel boards.xlsx       # GET /api/export-all-boards/excel?authToken=...
```

- `POST /api/boards/import/excel` takes `{ "board": { "excelBase64": "..." } }`:
  the workbook in base64.
- `GET /api/boards/BOARDID/exportExcel?authToken=TOKEN` exports a board, with
  `fields` (the ticked parts; leave out `card-details` for the table),
  `swimlaneId` or `listId` to narrow it.
- `GET /api/boards/BOARDID/lists/LISTID/cards/CARDID/exportExcel?authToken=TOKEN`
  exports one card.
- `GET /api/export-all-boards/excel?authToken=TOKEN` exports all boards as one
  workbook; `&boardIds=ID1,ID2` exports only those boards.

## How it is built and tested

- Import: `models/import.js` (`parseXlsxToRows`, the `excel` case) reads the
  first sheet with `@wekanteam/exceljs`; `models/csvCreator.js` writes the
  board; `client/components/import/import.js` sends the file.
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
- Unit tests: `tests/excelExport.test.cjs`,
  `tests/exportExcelCardContainment.test.cjs`,
  `tests/xlsxTabColorCssInjection.test.cjs`.
- Playwright: `tests/playwright/specs/25-excel-pdf.e2e.js` (importing an
  `.xlsx` creates a board with the rows),
  `tests/playwright/specs/import-export-format-audit.e2e.js` (multiline
  Unicode text survives an Excel import; an empty import fails without
  creating a board) and `tests/playwright/specs/export-access.e2e.js` (an
  assigned-only member cannot export the whole board, or an unassigned card).

## Sources

- [ECMA-376, Office Open XML](https://ecma-international.org/publications-and-standards/standards/ecma-376/):
  the `.xlsx` format
- [Rename a worksheet](https://support.microsoft.com/en-us/office/rename-a-worksheet-3f1f7148-ee83-404d-8ef0-9ff99fbad1f9):
  Excel's limits for sheet names

See also: [format coverage](../Format-Coverage.md),
[all formats](../External-Tools.md).
