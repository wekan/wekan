# PDF export

WeKan exports a board, list, swimlane or single card as an A4 PDF. The related
[Excel export](../Excel/Excel.md) offers the same card sections. Both formats
build their content from the layout in
[One Card Layout](../Excel/One-Card-Layout.md).

## Implementation

- `models/exportPDF.js` authenticates and scopes the HTTP routes.
- `models/server/ExporterCardPDF.js` loads board/card data, resolves users and
  custom fields, reads attachment images, and maps that data into the shared
  card document.
- `models/lib/cardDocument.js` decides which blocks exist and omits empty or
  unselected sections.
- `models/lib/pdfDocument.js` renders those blocks, paginates them, writes the
  PDF objects and cross-reference table, and embeds images without a separate
  PDF dependency.

Text uses the PDF base-14 Courier family with WinAnsi encoding. Western
European text is preserved, other Latin characters are transliterated where
possible, and scripts unavailable in that font fall back to `?`. Markdown
headings, lists, emphasis, quotes and code are rendered as document structure
instead of printing their Markdown punctuation.

JPEG attachments are embedded using their original `/DCTDecode` stream. PNG
scanlines are decoded, PNG filters are removed, transparency is composited onto
white, and the RGB pixels are embedded with `/FlateDecode`. Images are scaled
down to the printable width without being enlarged. A corrupt, unavailable or
unsupported image remains named in the attachment list and cannot make the PDF
export fail.

## Current progress

Completed:

- board, list, swimlane and single-card PDF routes;
- the same field selection and card-document layout as Excel;
- localized labels, user-timezone dates and rendered Markdown;
- card metadata, custom fields, checklists, subtasks, comments, attachments,
  voting and planning poker;
- JPEG and PNG attachment previews in card and detailed board PDFs;
- binary-safe object offsets and regression tests that inspect the resulting
  image XObjects and PDF cross-reference table.

Remaining:

- embed a Unicode font so Cyrillic, Greek, Hebrew, Arabic, CJK and emoji can be
  drawn rather than falling back to `?`;
- add GIF and BMP decoding if parity with Excel's preview formats is needed.

The former TODO item said PDF still listed images only by name. That step is now
implemented and guarded by positive and negative tests.
