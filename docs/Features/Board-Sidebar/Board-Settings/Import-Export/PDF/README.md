# PDF

## What it is

WeKan exports a board, list, swimlane or single card as an A4 PDF. The related
[Excel export](../Excel/README.md) offers the same card sections. Both formats
build their content from the layout in
[One Card Layout](../Excel/One-Card-Layout.md). PDF is export only.

## Read more

- [Wikipedia: PDF, the document format](https://en.wikipedia.org/wiki/PDF)
- [PDF 2.0, ISO 32000-2](https://pdfa.org/resource/iso-32000-2/): the PDF
  format, including the `/DCTDecode` and `/FlateDecode` filters
- [PDFKit](https://pdfkit.org/docs/text.html): font embedding and subsetting
- [GNU Unifont](https://unifoundry.com/unifont/): the bundled fonts

See also: [format coverage](../Format-Coverage.md),
[all formats](../External-Tools.md).

## How to use it

Each task has its own steps below: importing one board, importing many
boards at once, exporting one board, exporting all boards at once, and the
same from a script through the REST API.

### How to import

There is no PDF import. A PDF is a printed page: it holds the text and images
as they are laid out, not the lists, cards and fields they came from, so there
is nothing WeKan could read back reliably. To move a board between WeKan
servers, use the [WeKan JSON or .zip export](../WeKan/From-Previous-Export.md).

### How to import many boards at once

There is nothing to import: PDF has no import.

### How to export

1. In WeKan, open the menu of what to export: **Board Settings → Export** for
   the board, or the hamburger menu of a swimlane, a list or a card.
2. Under **Select what to include**, tick the sections you want.
3. Choose **PDF**. The PDF downloads.
4. Open it in any PDF reader, or print it.

### How to export all boards at once

This is not available for PDF. A PDF is a document of one board (or one
swimlane, list or card), so **Export all boards** does not offer it. Export
each board from its own menu, or use **Export all boards** with WeKan JSON or
[Excel](../Excel/README.md) instead.

### REST API

```bash
python3 api.py exportboardformat BOARDID pdf board.pdf  # GET /api/boards/BOARDID/exportPDF
curl -o board.pdf "https://WEKAN-SERVER/api/boards/BOARDID/exportPDF?authToken=TOKEN"
```

- `GET /api/boards/BOARDID/exportPDF?authToken=TOKEN` exports a board, with
  `fields` (the ticked parts), `swimlaneId` or `listId` to narrow it.
- `GET /api/boards/BOARDID/lists/LISTID/cards/CARDID/exportPDF?authToken=TOKEN`
  exports one card.

There is no import route and no mass export route for PDF.

## How the numbers are calculated

The limits and conversions of this format, from its own code:

- The A4 page width, 595 points (72 dpi). (`PAGE_WIDTH` in
  [models/lib/pdfDocument.js](../../../../../../models/lib/pdfDocument.js#L61))
- The A4 page height, 842 points. (`PAGE_HEIGHT` in
  [models/lib/pdfDocument.js](../../../../../../models/lib/pdfDocument.js#L62))
- The page margin, 50 points. (`PAGE_MARGIN` in
  [models/lib/pdfDocument.js](../../../../../../models/lib/pdfDocument.js#L63))
- The line height, 14 points. (`LINE_HEIGHT` in
  [models/lib/pdfDocument.js](../../../../../../models/lib/pdfDocument.js#L64))
- The font size, 10 points. (`FONT_SIZE` in
  [models/lib/pdfDocument.js](../../../../../../models/lib/pdfDocument.js#L65))
- The text width: a line wraps at 90 characters of a monospaced font.
  (`TEXT_WIDTH` in
  [models/lib/pdfDocument.js](../../../../../../models/lib/pdfDocument.js#L66))

## How it works in WeKan

This format's own code:
[client/components/boards/exportScope.jade](../../../../../../client/components/boards/exportScope.jade),
[models/exportPDF.js](../../../../../../models/exportPDF.js),
[models/lib/cardDocument.js](../../../../../../models/lib/cardDocument.js),
[models/lib/cardExportDocument.js](../../../../../../models/lib/cardExportDocument.js),
[models/lib/pdfDocument.js](../../../../../../models/lib/pdfDocument.js),
[models/server/ExporterCardPDF.js](../../../../../../models/server/ExporterCardPDF.js),
[models/server/buildUnicodePdf.js](../../../../../../models/server/buildUnicodePdf.js).

The tests that pin it:
[tests/pdfDrawsTheDocument.test.cjs](../../../../../../tests/pdfDrawsTheDocument.test.cjs),
[tests/pdfExport.test.cjs](../../../../../../tests/pdfExport.test.cjs),
[tests/pdfkitEntryPatch.test.cjs](../../../../../../tests/pdfkitEntryPatch.test.cjs),
[tests/playwright/specs/25-excel-pdf.e2e.js](../../../../../../tests/playwright/specs/25-excel-pdf.e2e.js),
[tests/playwright/specs/export-access.e2e.js](../../../../../../tests/playwright/specs/export-access.e2e.js).

The details of the format, what is kept and how it is tested are below.

### Format details

From the [format coverage](../Format-Coverage.md) audit, for PDF, HTML and SVG:

- **Authoritative shape:** export-only rendered views.
- **Required coverage:** every selected visible section, Unicode, safe links
  and images, pagination and deterministic filenames; these are
  presentations, not lossless re-import formats.

#### Layout and fonts

The board, swimlane, list and card hamburger menus do not have four PDF
templates or a second set for Excel. They all include `exportScopeBody` from
`client/components/boards/exportScope.jade`; one table in `exportScope.js`
defines both download formats, one URL builder adds the selected scope, and one
checkbox selection is sent to both routes.

On the server, scope changes only the hierarchy surrounding the cards. Every
card at every scope is converted by `buildExportCardDocument`, then PDF renders
the returned medium-independent blocks as pages. PDF-specific code is limited
to page geometry, wrapping, pagination, embedded fonts and image encoding; the
meaning and ordering of card fields are shared with Excel.

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

#### Images and attachments

JPEG attachments are embedded using their original `/DCTDecode` stream. PNG
scanlines are decoded, PNG filters are removed, transparency is composited onto
white, and the RGB pixels are embedded with `/FlateDecode`. Images are scaled
down without being enlarged. Up to three previews share an A4 PDF row, and only
the filename appears below each image. Excel can fit six previews across its
six worksheet columns. The whole PDF preview row moves to the next page when it
does not fit. A corrupt, unavailable or unsupported image cannot make the PDF
export fail.

Before the previews, the attachment detail table includes every attachment and
the same six fields as Excel: row number, filename, human-readable size, media
type, upload date/time and uploader. Image details therefore remain complete
without repeating size or other metadata in the preview caption.

#### Order and metadata

Metadata uses three columns like the printable Excel card. A translated label
and its value wrap onto additional lines inside that column instead of being
shortened with an ellipsis, so complete date and time values remain visible.

Board PDFs are ordered as board name, members, created and modified metadata,
then each swimlane, each list within that swimlane, and each card within that
list. Smaller exports begin at their selected level: swimlane then lists and
cards, list then cards, or the single card. The only visible swimlane is still
named, so the hierarchy does not change merely because a board currently has
one. Detailed Excel exports use the same order.

Because every scope uses the shared card document, PDF carries the same complete
opened-card fields as detailed Excel, including stickers, dependencies, numeric
sort position, and every location's place name, address, latitude and longitude.
Legacy single-location fields remain visible too.

#### Current progress

Completed:

- board, list, swimlane and single-card PDF routes;
- the same field selection and card-document layout as Excel;
- one shared hamburger-menu template and one raw-record adapter across board,
  swimlane, list and card PDF/Excel exports;
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

### What is kept

The PDF shows every ticked section of each card in scope:

| WeKan | PDF |
| --- | --- |
| Board, swimlane, list | Headings, in board order |
| Board name, members, created and modified dates | The board's opening block |
| Card title, labels, stickers, locations, people, dates, time tracking | The card's metadata columns |
| Description, comments, checklist items, custom fields | Rendered Markdown text |
| Checklists, subtasks, dependencies, voting, planning poker | Their own sections |
| Attachments | A six-column detail table, and previews of JPEG and PNG images |

### What is not kept

- GIF and BMP images are listed in the attachment table but not previewed.
- When the embedded fonts cannot be used, the fallback writer replaces scripts
  it cannot show with `?`.
- A PDF cannot be imported, so nothing in it comes back into WeKan.

### How it is built and tested

- `models/exportPDF.js` authenticates and scopes the HTTP routes.
- `models/server/ExporterCardPDF.js` loads board/card data, resolves users and
  custom fields and reads attachment images.
- `models/lib/cardExportDocument.js` maps those records into the shared card
  document. Excel calls exactly the same adapter, so people, dates, checklist
  items, comments, attachment details, sizes, voting and poker cannot be mapped
  differently by the two formats.
- `models/lib/cardDocument.js` decides which blocks exist and omits empty or
  unselected sections.
- `models/lib/pdfDocument.js` renders those blocks, paginates them, writes the
  fallback PDF objects and embeds images.
- `models/server/buildUnicodePdf.js` uses PDFKit to subset and embed the bundled
  GNU Unifont fonts for the normal export path.
- Unit tests: `tests/pdfExport.test.cjs`, `tests/pdfDrawsTheDocument.test.cjs`,
  `tests/pdfkitEntryPatch.test.cjs`.
- Playwright: `tests/playwright/specs/25-excel-pdf.e2e.js` (a board PDF export
  returns a PDF document) and `tests/playwright/specs/export-access.e2e.js`
  (an assigned-only member cannot export the whole board, or an unassigned
  card).

## Commits

 - [Read a PDF export's pictures one at a time as they are drawn, and write it to disk, not memory](https://github.com/wekan/wekan/commit/52b86ef75344abb020725dcd8d0f4f53109e7b5f)
 - [Keep each chart PDF export row on one line, in fixed columns](https://github.com/wekan/wekan/commit/e487f8d913bb0ce32504b4363d20fe0ce23b84de)
 - [Bundle portable PDFKit in every release target](https://github.com/wekan/wekan/commit/ec26abdc91f5d6e3c91db11ed6433f1c09cb40b5)
 - [Keep Windows PDF and Snap release builds portable](https://github.com/wekan/wekan/commit/6c39c6ad32a5b8dae5d0091fc3af8eadc424d31f)
 - [Share one card document adapter across PDF and Excel exports](https://github.com/wekan/wekan/commit/0885b9a10b596e22d4919b241bb06bbb097d0b55)
 - [Name PDF and Excel exports by their localized scope](https://github.com/wekan/wekan/commit/4b27f4fc455ef47ead365dd430edf54d0bfbd069)
 - [Align PDF and Excel card attachment layouts](https://github.com/wekan/wekan/commit/fb52149e94dbee3c1f3118d45f73e44620234a52)
 - [Start PDFKit with the embedded Unicode font](https://github.com/wekan/wekan/commit/4deff691ebe968b2319d2f3e0f92bd47a74a0f5d)
 - [Wrap PDF metadata and arrange image previews in rows](https://github.com/wekan/wekan/commit/9ff542b9b1e7fd2468374e33c63003590323bf08)
 - [Complete multilingual PDF and Excel exports](https://github.com/wekan/wekan/commit/c796fc6c6b79f2362bd03bea469ba3f3b00ee549)
 - [Embed attachment images in PDF exports](https://github.com/wekan/wekan/commit/74888f1edfbe1473e8b1bfb5499952a10445038b)
 - [Step 4: the PDF draws the shared card document, so both formats have one layout](https://github.com/wekan/wekan/commit/f6e31444521ffc71c9a1cd78cceaa001c52b8e9b)
 - [Card PDF and Excel exports say the same thing, in the reader's language, format and time zone](https://github.com/wekan/wekan/commit/698e980e27522b53f60ad6fce347727cb11eb017)
 - [Fix #6586: the PDF export writes umlauts, not question marks](https://github.com/wekan/wekan/commit/eb141688936802c5ce0bcdd47dd1d67a49fe0ee3)
 - [Update PDF export models](https://github.com/wekan/wekan/commit/6953cc0670f50970103211b7d9d5507b4aecb40c)
 - [Export Card to PDF. In Progress](https://github.com/wekan/wekan/commit/a2f2ce11354a8dbfdd6759e3b65797e4be4cc6ec)
