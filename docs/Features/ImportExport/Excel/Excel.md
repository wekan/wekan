# Excel export

WeKan exports either a whole board or one card as an `.xlsx` workbook. The
board export has two forms:

- the default streaming table keeps memory use flat for very large boards;
- selecting card details produces printable A4 card blocks, using the same
  fields offered by the export popup.

The related [PDF export](../PDF/PDF.md) uses the same field selection and the
same card-document model. The intended common layout is described in
[One Card Layout](One-Card-Layout.md).

## Implementation

- `models/exportExcel.js` and `models/server/ExporterExcel.js` implement the
  streaming board table.
- `models/exportExcelCard.js` and
  `models/server/ExporterExcelCard.js` implement a printable card workbook.
- `models/server/ExporterExcelBoard.js` reuses the card renderer for every card
  when detailed board export is selected.
- `models/server/renderCardDocumentExcel.js` renders every block from the shared
  card document with the six-column worksheet geometry.
- `models/server/createWorkbook.js` selects the safe buffered ExcelJS writer
  when the installed streaming writer cannot load.
- `models/lib/cardDocument.js` is the medium-independent card layout shared
  with PDF.

ExcelJS writes rich text for Markdown, embeds JPEG, PNG, GIF and BMP attachment
previews, formats dates in the requesting browser's timezone, and prints only
the sections selected in the export dialog. The workbook is generated directly
into the HTTP response and does not use a temporary export file.

Excel stores text as Unicode, so the export preserves every language. The
`.xlsx` format used by ExcelJS cannot portably embed an OpenType font: it records
a font family name and the spreadsheet application selects an installed font or
fallback. Bundling GNU Unifont therefore fixes portable PDF rendering but cannot
force the same font into an Excel workbook. Converting cells to pictures would
make all glyphs visible but would destroy editing, searching, copying and
accessibility, so WeKan keeps real Unicode cell text.

## Current progress

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
- access checks that constrain a card to the authorized board and list;
- an Excel import round trip for the board-table shape.

There is no remaining export-layout implementation item. Portable font
embedding in `.xlsx` is a file-format/library limitation rather than an omitted
font asset; PDF is the format to use when identical glyph rendering on every
device is required.

The design and progress live here rather than in `CHANGELOG.md`'s TODO list so
implementation details stay beside the format they describe.
