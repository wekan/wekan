# Excel export

WeKan exports either a whole board or one card as an `.xlsx` workbook. The
board export has two forms:

- the default detailed export produces printable A4 card blocks, using the same
  fields offered by the export popup;
- explicitly clearing Card details selects a streaming table whose memory use
  stays flat for very large boards.

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
- `models/lib/cardExportDocument.js` is the single adapter from board, card,
  people, checklist, comment and attachment records to that card document. PDF
  calls the same adapter, including for human-readable attachment sizes.
- `models/server/createWorkbook.js` selects the safe buffered ExcelJS writer
  when the installed streaming writer cannot load.
- `models/lib/cardDocument.js` is the medium-independent card layout shared
  with PDF.

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
