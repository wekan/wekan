# Design: one card layout, for every export

Status: **in progress** · Owner: xet7 · Related:
[#1173](https://github.com/wekan/wekan/issues/1173) (print a board with params),
[#6586](https://github.com/wekan/wekan/issues/6586) (PDF: umlauts, markdown, and
what a card export should contain).

**The rule this document exists for:** *the same functions, layouts and templates
for every PDF and Excel export, so that there is no duplicated code.*

## What an export should be

One layout — the one **Export card to Excel** already draws — used by every
scope and both formats:

| | Excel | PDF |
| --- | --- | --- |
| Card | the layout | the layout |
| List | the layout, per card | the layout, per card |
| Swimlane | the layout, per card | the layout, per card |
| Board | the layout, per card | the layout, per card |

with **images included** and **markdown rendered the way WeKan renders it**.

## Where it already is, and where it is not

Two of the four quarters are done, and were done by the same method — one
renderer, called by every scope:

- **Excel** already draws the card layout at every scope.
  `ExporterExcelBoard` renders each card through `ExporterExcelCard.renderCardBlock`,
  so a board, a swimlane and a list are that block repeated. Images are embedded
  there (`EMBEDDABLE_IMAGE_MIME`, `IMG_WIDTH_PX`, …).
- **PDF** already shares its block across scopes: `ExporterBoardPDF` and
  `ExporterCardPDF` both render through `PDFExporterBase.cardBlockLines`.

What is missing is that the PDF's block is **not that layout**. It is a
monospaced list of lines — no sections with a filled header, no label/value
columns, no boxes, and no images. So the two formats agree about *what* a card
export contains and disagree about what it *looks like*.

## The shape of the fix

**A card becomes a DOCUMENT, and each format DRAWS one.** Not "make the PDF look
like the Excel code": one description of a card's layout, built once, rendered
twice.

```
  buildCardDocument(card, data, fields)      models/lib/cardDocument.js
        │
        ├── renderCardToWorksheet(doc, ws)   models/server/ExporterExcelCard.js
        └── renderCardToPdf(doc, lines)      models/server/ExporterCardPDF.js
```

The document is a list of blocks, in the order the Excel layout already puts
them:

| Block | Carries | Excel draws | PDF draws |
| --- | --- | --- | --- |
| `section` | a title | merged A–F, grey fill, thick border | filled bar, bold, rule under it |
| `meta` | up to three label/value pairs | three label/value column pairs | label/value columns |
| `text` | markdown runs (see below) | one merged cell, rich text | wrapped styled lines |
| `list` | items, each with runs and a state | one row per item | one line per item |
| `images` | attachments that are images | embedded, 4 per row | embedded, 4 per row |
| `table` | header + rows | a bordered grid | a bordered grid |

Nothing in a block names a colour, a column letter or a font size: those are the
renderer's business, and they are what legitimately differ between a spreadsheet
and a page.

## Markdown  *(done)*

[`models/lib/exportMarkdown.js`](../../../../models/lib/exportMarkdown.js) parses a
card's text with **the same markdown-it options the reader's renderer uses** —
`html`, `linkify`, `typographer`, `breaks` — and returns blocks of styled runs:

```js
  [{ type: 'heading', level: 2, runs: [{ text: 'Plan', bold: true }] },
   { type: 'bullet', level: 0, runs: [{ text: 'first' }] },
   { type: 'code', text: 'npm install' }]
```

A run is `{ text, bold, italic, code, strike, link }`. Excel turns runs into an
ExcelJS `richText` array; the PDF picks one of the four Courier faces. Neither
knows markdown. HTML in a card is kept as **text** — an export is a document,
and a card containing `<script>` should put those characters in the file rather
than have anything act on them.

`tests/exportMarkdown.test.cjs` pins it as arithmetic: markdown in, blocks out,
under bare node.

## Images in the PDF  *(to do)*

The Excel export embeds JPEG, PNG, GIF and BMP attachments. A PDF can carry the
first two directly:

- **JPEG** is an image XObject with `/Filter /DCTDecode` and the file's own
  bytes — no decoding, no dependency.
- **PNG** is `/FlateDecode` with `/DecodeParms` naming the predictor, colour
  count and bit depth, which is what a PNG's IDAT already is. A palette image
  needs `/Indexed`, and transparency needs an `/SMask`.
- **GIF and BMP** have no PDF filter of their own. They are listed as "not
  embedded" rather than silently dropped, and the attachment's name is written
  where the picture would be.

## Order of work

1. **Markdown, shared** — *done*.
2. **Excel renders markdown** — description done; comments, checklist items and
   custom-field values next.
3. **The document model** — `buildCardDocument`, with the Excel renderer moved
   onto it. Excel's output must not change while this happens, which is what
   makes it verifiable: the same file, from a different route through the code.
4. **The PDF renderer draws the document** — sections, label/value columns and
   boxes, replacing the line list.
5. **Images in the PDF**, from the same block Excel embeds.

Each step is committed on its own and leaves both exports working, because both
are things people use every day.
