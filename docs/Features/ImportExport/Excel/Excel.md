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
- `models/server/createWorkbook.js` selects the safe buffered ExcelJS writer
  when the installed streaming writer cannot load.
- `models/lib/cardDocument.js` is the medium-independent card layout shared
  with PDF.

ExcelJS writes rich text for Markdown, embeds JPEG, PNG, GIF and BMP attachment
previews, formats dates in the requesting browser's timezone, and prints only
the sections selected in the export dialog. The workbook is generated directly
into the HTTP response and does not use a temporary export file.

## Current progress

Completed:

- board, list, swimlane and single-card export routes;
- field selection for board and card details;
- localized labels and user-timezone dates;
- Markdown-rich descriptions, comments, checklist items and custom fields;
- attachment metadata and inline image previews;
- voting, planning poker, checklists, subtasks and custom fields;
- the same card renderer for a single card and detailed board export;
- access checks that constrain a card to the authorized board and list;
- an Excel import round trip for the board-table shape.

Remaining:

- replace the Excel-specific description of the printable card layout with a
  renderer that consumes every block from `models/lib/cardDocument.js`
  directly. The generated workbook must retain its six-column geometry,
  colored labels, progress bars, attachment metadata and image placement. This
  is deliberately not a blind rewrite: tests must compare the workbook before
  and after so moving the layout does not change its output.

The design and progress live here rather than in `CHANGELOG.md`'s TODO list so
implementation details stay beside the format they describe.
