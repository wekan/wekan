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
  fallback PDF objects and embeds images.
- `models/server/buildUnicodePdf.js` uses PDFKit to subset and embed the bundled
  GNU Unifont fonts for the normal export path.

The distributable includes GNU Unifont 17.0.05 and Unifont Upper under the SIL
Open Font License 1.1 in `private/fonts/unifont`. PDFKit subsets and embeds both
fonts, so readers do not have to install them. The main font covers the Basic
Multilingual Plane and the upper font supplies glyphs from supplementary
Unicode planes. This gives every WeKan language a visible glyph and also covers
supplementary characters such as emoji. GNU Unifont is deliberately a
last-resort coverage font: complex-script shaping and color emoji can be less
polished than a platform's script-specific fonts, but text remains present,
searchable and portable.

If loading or rendering the embedded fonts fails, the dependency-free writer
in `models/lib/pdfDocument.js` is retained as a safe fallback. It uses base-14
Courier with WinAnsi encoding, preserves Western European text, transliterates
some other Latin characters, and replaces unsupported scripts with `?`.
Markdown headings, lists, emphasis, quotes and code are rendered as document
structure instead of printing their Markdown punctuation.

JPEG attachments are embedded using their original `/DCTDecode` stream. PNG
scanlines are decoded, PNG filters are removed, transparency is composited onto
white, and the RGB pixels are embedded with `/FlateDecode`. Images are scaled
down without being enlarged. Up to three previews share a row, matching the
three two-column preview cells in Excel, and only the filename appears below
each image. The whole preview row moves to the next page when it does not fit.
A corrupt, unavailable or unsupported image cannot make the PDF export fail.

Before the previews, the attachment detail table includes every attachment and
the same six fields as Excel: row number, filename, human-readable size, media
type, upload date/time and uploader. Image details therefore remain complete
without repeating size or other metadata in the preview caption.

Metadata uses three columns like the printable Excel card. A translated label
and its value wrap onto additional lines inside that column instead of being
shortened with an ellipsis, so complete date and time values remain visible.

## Current progress

Completed:

- board, list, swimlane and single-card PDF routes;
- the same field selection and card-document layout as Excel;
- localized labels, user-timezone dates and rendered Markdown;
- the logged-in user's saved language, falling back to the current browser
  language when no language is saved;
- the date format displayed by the opened card;
- card metadata, custom fields, checklists, subtasks, comments, attachments,
  voting and planning poker;
- JPEG and PNG attachment previews in card and detailed board PDFs;
- three previews per row with filename-only captions below and atomic
  pagination;
- the same six-column attachment details table, colored labels and segmented
  checklist progress as the printable Excel card;
- wrapped metadata columns that preserve complete date/time values;
- binary-safe object offsets and regression tests that inspect the resulting
  image XObjects and PDF cross-reference table;
- embedded Unicode-plane fonts, their OFL license, font subsetting and tests
  that verify PDFKit can parse and embed both shipped fonts.

Remaining: add GIF and BMP decoding if parity with Excel's preview formats is
needed.

The former TODO item said PDF still listed images only by name. That step is now
implemented and guarded by positive and negative tests.
