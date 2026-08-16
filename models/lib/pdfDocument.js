'use strict';

import zlib from 'zlib';

// The PDF the board and card exports are written with: text encoding, markdown
// flattening, wrapping and the file itself. Pure and dependency-free, so the bytes
// that reach a reader's PDF viewer can be tested (tests/pdfExport.test.cjs).
//
// #6586: "the umlauts (german, ä, ü, ö,...) are corrupt". They were, by hand:
// every character outside printable ASCII was replaced with a question mark before
// anything was written. "Grüße" left as "Gr??e", and that is the whole of what a
// German, Finnish, French or Spanish board's export said.
//
// TEXT IN A PDF IS BYTES PLUS AN ENCODING, and this file had neither on purpose.
// A simple `(...)` string in a content stream is read through the font's encoding;
// the exporter declared none, so the viewer used the font's built-in one
// (StandardEncoding), where the bytes above 127 are not the Latin-1 letters at all
// - and the file was assembled as a UTF-8 string, so a single "ü" would have
// arrived as two bytes and drawn as two wrong glyphs. Hence the question marks:
// they were the workaround, not the bug.
//
// So the font now declares /WinAnsiEncoding (Windows-1252, the encoding every PDF
// viewer has for the base-14 fonts), the text is encoded to those single bytes, and
// the file is assembled as binary rather than as UTF-8 text. Everything Windows-1252
// has - the Western European letters, the dashes, the quotes, the euro sign - is
// written as itself.
//
// What Windows-1252 does NOT have is transliterated rather than dropped: Latin
// letters with other marks lose the mark (ā -> a, ő -> o, ł -> l), and a few
// letters that decompose to nothing useful are spelled out (đ -> d, ß stays, æ
// stays - it is in the set). Only text in a script the base-14 fonts cannot draw at
// all - Cyrillic, Greek, Hebrew, Arabic, CJK, emoji - falls back to '?'. This
// writer is now the emergency fallback; the normal server path embeds the GNU
// Unifont BMP and supplementary-plane fonts in buildUnicodePdf.js.
//
// MARKDOWN IS RENDERED, not printed and not thrown away. The same report: "all the
// text in this PDF file is markdown formatted - this doesn't make sense in a pdf
// file, does it?" It does not: `**bold**` in a PDF is four stray asterisks. The
// first fix removed the syntax and kept the words (flattenMarkdown, still used for
// the places where a line has one style); the follow-up asked for the other half -
// "would it make sense to support markdown formated text in description? (so it
// gets transformed correct in the pdf output with bold, underline,....)".
//
// So a description is now cut into RUNS - `inlineRuns` turns `**bold**` into a run
// with bold set, `*italic*` into an italic one, `***both***` into both - and each
// run is drawn in the matching Courier face: Courier, Courier-Bold,
// Courier-Oblique, Courier-BoldOblique. Nothing is measured to do it: consecutive
// `Tj` operators continue at the current text position, so a font switch between
// two of them lands the second run exactly where the first ended, whatever the
// glyph widths are.
//
// What has no face is not invented: strikethrough and inline code keep their words
// and lose their markers, because a Type1 base-14 font has no strike and there is
// no fifth face to give code. Underline would be a drawn line rather than a font,
// and is not done here.
//
// BLOCK-level markdown is still flattened either way - a heading loses its `#`
// and is drawn in the bold font, a bullet keeps one shape, a fence keeps its code
// and loses the fence.

const PAGE_WIDTH = 595;      // A4 at 72 dpi
const PAGE_HEIGHT = 842;
const PAGE_MARGIN = 50;
const LINE_HEIGHT = 14;
const FONT_SIZE = 10;
const TEXT_WIDTH = 90;       // characters per line, in a monospaced font

// Windows-1252's own assignments in 0x80-0x9F, where it differs from Latin-1.
const CP1252_HIGH = {
  '€': 0x80, '‚': 0x82, 'ƒ': 0x83, '„': 0x84, '…': 0x85,
  '†': 0x86, '‡': 0x87, 'ˆ': 0x88, '‰': 0x89, 'Š': 0x8A,
  '‹': 0x8B, 'Œ': 0x8C, 'Ž': 0x8E, '‘': 0x91, '’': 0x92,
  '“': 0x93, '”': 0x94, '•': 0x95, '–': 0x96, '—': 0x97,
  '˜': 0x98, '™': 0x99, 'š': 0x9A, '›': 0x9B, 'œ': 0x9C,
  'ž': 0x9E, 'Ÿ': 0x9F,
};

// Letters that lose their identity rather than a diacritic when decomposed.
const TRANSLITERATE = {
  'đ': 'd', 'Đ': 'D', 'ħ': 'h', 'Ħ': 'H', 'ı': 'i', 'ł': 'l', 'Ł': 'L',
  'ŋ': 'n', 'Ŋ': 'N', 'ø': 'o', 'Ø': 'O', 'ŧ': 't', 'Ŧ': 'T',
  'œ': 'œ', 'Œ': 'Œ', 'ẞ': 'SS', 'ﬁ': 'fi', 'ﬂ': 'fl',
  '−': '-', ' ': ' ', '​': '', '﻿': '',
};

// One character as a Windows-1252 code point, or null when the set has no room
// for it even after taking marks off.
function cp1252Char(ch) {
  const code = ch.charCodeAt(0);
  if (code >= 0x20 && code <= 0x7E) return code;
  if (code >= 0xA0 && code <= 0xFF) return code;          // Latin-1 half
  if (CP1252_HIGH[ch] !== undefined) return CP1252_HIGH[ch];
  return null;
}

// Text as Windows-1252 bytes, one JS char per byte (so writing it as 'latin1'
// produces exactly those bytes). Unrepresentable characters are transliterated
// where a Latin reading exists, and '?' where none does.
function encodeWinAnsi(value) {
  const input = String(value ?? '');
  let out = '';
  for (const ch of input) {
    if (ch === '\n') { out += '\n'; continue; }
    const direct = cp1252Char(ch);
    if (direct !== null) { out += String.fromCharCode(direct); continue; }
    const mapped = TRANSLITERATE[ch];
    if (mapped !== undefined) {
      for (const m of mapped) {
        const c = cp1252Char(m);
        out += c === null ? '?' : String.fromCharCode(c);
      }
      continue;
    }
    // Take the marks off (ā -> a) and keep whatever survives in the set.
    const stripped = ch.normalize('NFD').replace(/[̀-ͯ]/g, '');
    let wrote = false;
    for (const s of stripped) {
      const c = cp1252Char(s);
      if (c !== null) { out += String.fromCharCode(c); wrote = true; }
    }
    if (!wrote) out += '?';
  }
  return out;
}

// Markdown as words. A PDF has no markdown renderer, so the syntax is noise -
// `**bold**` prints as four asterisks and a fenced block prints its fence.
function flattenMarkdown(value) {
  return String(value ?? '')
    .replace(/\r/g, '')
    .replace(/^```[^\n]*\n?/gm, '')                       // fences, keep the code
    .replace(/^~~~[^\n]*\n?/gm, '')
    .replace(/!\[([^\]]*)\]\(([^)\s]+)[^)]*\)/g, (m, alt, url) => (alt ? `${alt} (${url})` : url))
    .replace(/\[([^\]]*)\]\(([^)\s]+)[^)]*\)/g, (m, text, url) => (text ? `${text} (${url})` : url))
    .replace(/^\s{0,3}(#{1,6})\s+/gm, '')                 // heading markers
    .replace(/^\s{0,3}>\s?/gm, '')                        // block quotes
    .replace(/^\s{0,3}([-*+])\s+/gm, '- ')                // bullets, one shape
    .replace(/\*\*\*(\S(?:[\s\S]*?\S)?)\*\*\*/g, '$1')    // bold italic
    .replace(/\*\*(\S(?:[\s\S]*?\S)?)\*\*/g, '$1')        // bold
    .replace(/\*(\S(?:[\s\S]*?\S)?)\*/g, '$1')            // italic
    // Underscores only count at a word boundary, the way markdown itself treats
    // them: `file_name_here` and `snake_case` are identifiers, not emphasis, and
    // stripping the underscores out of them rewrites the text the card actually
    // holds.
    .replace(/(^|[\s([{"'])___(\S(?:[\s\S]*?\S)?)___(?=[\s)\]}"'.,!?:;]|$)/g, '$1$2')
    .replace(/(^|[\s([{"'])__(\S(?:[\s\S]*?\S)?)__(?=[\s)\]}"'.,!?:;]|$)/g, '$1$2')
    .replace(/(^|[\s([{"'])_(\S(?:[\s\S]*?\S)?)_(?=[\s)\]}"'.,!?:;]|$)/g, '$1$2')
    .replace(/~~(\S(?:[\s\S]*?\S)?)~~/g, '$1')            // strikethrough
    .replace(/`([^`]+)`/g, '$1')                          // inline code
    .replace(/^\s{0,3}([-*_])\s*(\1\s*){2,}$/gm, '')      // thematic breaks
    .replace(/[ \t]+$/gm, '');
}

// HTML out (a description may hold some) and markdown flattened. NOT encoded:
// encoding happens once, in buildPdfBuffer, as the text is written. Encoding here
// as well would put an already-encoded Windows-1252 byte through the encoder a
// second time - and 0x95 read as a character is a control code, not the bullet it
// stands for, so a second pass would turn it into '?'.
function normalizePdfText(value) {
  return flattenMarkdown(
    String(value ?? '')
      .replace(/<[^>]*>/g, ' ')
      .replace(/\r/g, '')
      .replace(/\t/g, ' '),
  );
}

// Block-level markdown only: what `flattenMarkdown` does MINUS the emphasis
// stripping, so `**bold**` survives as far as inlineRuns below. A heading still
// loses its `#`, a bullet is still one shape, a fence still keeps its code.
function flattenMarkdownBlocks(value) {
  return String(value ?? '')
    .replace(/\r/g, '')
    .replace(/^```[^\n]*\n?/gm, '')
    .replace(/^~~~[^\n]*\n?/gm, '')
    .replace(/!\[([^\]]*)\]\(([^)\s]+)[^)]*\)/g, (m, alt, url) => (alt ? `${alt} (${url})` : url))
    .replace(/\[([^\]]*)\]\(([^)\s]+)[^)]*\)/g, (m, text, url) => (text ? `${text} (${url})` : url))
    .replace(/^\s{0,3}(#{1,6})\s+/gm, '')
    .replace(/^\s{0,3}>\s?/gm, '')
    .replace(/^\s{0,3}([-*+])\s+/gm, '- ')
    .replace(/^\s{0,3}([-*_])\s*(\1\s*){2,}$/gm, '')
    .replace(/[ \t]+$/gm, '');
}

// The inline markers, longest first so `***` is not read as `*` and then `**`.
//
// `word` marks the underscore forms, which only count at a word boundary - the
// same rule markdown itself applies and flattenMarkdown already relied on:
// `file_name_here` and `snake_case` are identifiers, and turning half of one
// italic would rewrite the text the card holds.
//
// `~~` and `` ` `` carry no face: their words are kept and their markers dropped.
const INLINE_MARKERS = [
  { mark: '***', bold: true, italic: true, word: false },
  { mark: '___', bold: true, italic: true, word: true },
  { mark: '**', bold: true, italic: false, word: false },
  { mark: '__', bold: true, italic: false, word: true },
  { mark: '~~', bold: false, italic: false, word: false },
  { mark: '*', bold: false, italic: true, word: false },
  { mark: '_', bold: false, italic: true, word: true },
  { mark: '`', bold: false, italic: false, word: false },
];

const OPENS_WORD = /[\s([{"']/;
const CLOSES_WORD = /[\s)\]}"'.,!?:;]/;

// ONE line of text as styled runs. Adjacent runs of the same style are merged, so
// a caller gets the fewest font switches the line needs.
function inlineRuns(value) {
  const text = String(value ?? '');
  const runs = [];
  const push = (chunk, bold, italic) => {
    if (!chunk) return;
    const last = runs[runs.length - 1];
    if (last && last.bold === bold && last.italic === italic) last.text += chunk;
    else runs.push({ text: chunk, bold, italic });
  };

  let plain = '';
  let index = 0;
  while (index < text.length) {
    let matched = null;
    for (const marker of INLINE_MARKERS) {
      if (!text.startsWith(marker.mark, index)) continue;
      const from = index + marker.mark.length;
      const close = text.indexOf(marker.mark, from);
      // An unclosed marker, or `** **`, is not emphasis - it is text.
      if (close === -1 || close === from) continue;
      const content = text.slice(from, close);
      if (/^\s|\s$/.test(content)) continue;
      if (marker.word) {
        const before = index === 0 ? '' : text[index - 1];
        const after = text[close + marker.mark.length] || '';
        if (before && !OPENS_WORD.test(before)) continue;
        if (after && !CLOSES_WORD.test(after)) continue;
      }
      matched = { marker, content, end: close + marker.mark.length };
      break;
    }

    if (!matched) {
      plain += text[index];
      index += 1;
      continue;
    }

    push(plain, false, false);
    plain = '';
    // The content is scanned again, so `**bold with *italic* inside**` keeps both.
    for (const run of inlineRuns(matched.content)) {
      push(run.text, run.bold || matched.marker.bold, run.italic || matched.marker.italic);
    }
    index = matched.end;
  }
  push(plain, false, false);

  return runs.length ? runs : [{ text: '', bold: false, italic: false }];
}

// A line of runs, for buildPdfBuffer. `line()` above is the single-style form.
function richLine(runs) {
  return { runs: (runs || []).map(run => ({
    text: String(run.text ?? ''),
    bold: !!run.bold,
    italic: !!run.italic,
  })) };
}

// The same job wrapTextBlock does - HTML out, block markdown flattened, wrapped to
// the page - except the inline emphasis is kept as runs instead of being stripped.
// Wrapping counts CHARACTERS across the whole line, because the four Courier faces
// are one monospaced width; a run boundary is not a wrap opportunity of its own.
function wrapRichTextBlock(text, indent = '') {
  const width = TEXT_WIDTH - indent.length;
  const source = flattenMarkdownBlocks(
    String(text ?? '')
      .replace(/<[^>]*>/g, ' ')
      .replace(/\r/g, '')
      .replace(/\t/g, ' '),
  );

  const out = [];
  for (const rawLine of source.split('\n')) {
    // Words carrying their style, so a wrap can happen between any two of them.
    const words = [];
    for (const run of inlineRuns(rawLine)) {
      for (const part of run.text.split(/(\s+)/)) {
        if (!part) continue;
        if (/^\s+$/.test(part)) words.push(null);            // a space
        else words.push({ text: part, bold: run.bold, italic: run.italic });
      }
    }

    let current = [];
    let length = 0;
    const flush = () => {
      out.push(richLine(current.length
        ? [{ text: indent, bold: false, italic: false }, ...current]
        : [{ text: indent, bold: false, italic: false }]));
      current = [];
      length = 0;
    };
    const add = word => {
      const last = current[current.length - 1];
      if (last && last.bold === word.bold && last.italic === word.italic) last.text += word.text;
      else current.push({ ...word });
      length += word.text.length;
    };

    for (const word of words) {
      if (word === null) {
        if (length && length < width) add({ text: ' ', bold: false, italic: false });
        continue;
      }
      let rest = word;
      // A word longer than the page is cut, the way wrapLine cuts one.
      while (rest.text.length > width) {
        if (length) flush();
        add({ ...rest, text: rest.text.slice(0, width) });
        rest = { ...rest, text: rest.text.slice(width) };
        flush();
      }
      if (!rest.text) continue;
      if (length + rest.text.length > width) {
        // Do not leave the trailing space of the previous word on the old line.
        const last = current[current.length - 1];
        if (last && last.text.endsWith(' ')) last.text = last.text.replace(/ +$/, '');
        flush();
      }
      add(rest);
    }
    flush();
  }
  return out;
}

function escapePdfText(value) {
  return String(value ?? '')
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');
}

function wrapLine(line, width = TEXT_WIDTH) {
  if (!line) return [''];
  const words = line.split(/\s+/).filter(Boolean);
  if (words.length === 0) return [''];

  const wrapped = [];
  let current = '';
  for (const word of words) {
    if (!current) { current = word; continue; }
    if (`${current} ${word}`.length <= width) { current = `${current} ${word}`; continue; }
    wrapped.push(current);
    current = word;
  }
  if (current) wrapped.push(current);

  const splitLongWords = [];
  for (const item of wrapped) {
    if (item.length <= width) { splitLongWords.push(item); continue; }
    for (let index = 0; index < item.length; index += width) {
      splitLongWords.push(item.slice(index, index + width));
    }
  }
  return splitLongWords;
}

function wrapTextBlock(text, indent = '') {
  return normalizePdfText(text)
    .split('\n')
    .flatMap(line => wrapLine(line, TEXT_WIDTH - indent.length))
    .map(line => `${indent}${line}`);
}

// A line of the document. `bold` picks the bold font; the text is already encoded.
function line(text, bold = false) {
  return { text: String(text ?? ''), bold: !!bold };
}

// A SECTION BAR: the filled header the Excel layout puts above each section.
// It is a line like any other as far as pagination is concerned - one line high,
// with a grey rectangle drawn behind it - so nothing else has to know about it.
function bar(text) {
  return { text: String(text ?? ''), bold: true, bar: true };
}

// A ROW OF LABEL/VALUE PAIRS, in columns. The font is monospaced, so a column is
// a character count and the alignment needs no measuring: three pairs across the
// page is what the worksheet does with A-F.
function columns(pairs, width = TEXT_WIDTH) {
  const cells = (pairs || []).filter(pair => pair && pair.length);
  if (!cells.length) return line('');
  const cellWidth = Math.max(12, Math.floor(width / cells.length));
  const runs = [];
  cells.forEach(([label, value], index) => {
    const room = cellWidth - 1;
    const head = `${String(label ?? '')}: `;
    const text = `${head}${String(value ?? '')}`;
    const clipped = text.length > room ? `${text.slice(0, room - 1)}…` : text;
    // The label is bold and the value is not, which is what makes a column of
    // them readable - the same reason the worksheet right-aligns its labels.
    const headLength = Math.min(head.length, clipped.length);
    runs.push({ text: clipped.slice(0, headLength), bold: true, italic: false });
    runs.push({ text: clipped.slice(headLength), bold: false, italic: false });
    const pad = cellWidth - clipped.length;
    if (pad > 0 && index < cells.length - 1) {
      runs.push({ text: ' '.repeat(pad), bold: false, italic: false });
    }
  });
  return { runs };
}

// A metadata row may contain a long translated label and a full date/time. It
// must grow vertically rather than replace the end with an ellipsis.
function columnRows(pairs, width = TEXT_WIDTH) {
  const cells = (pairs || []).filter(pair => pair && pair.length);
  if (!cells.length) return [line('')];
  const cellWidth = Math.max(12, Math.floor(width / cells.length));
  const wrapped = cells.map(([label, value]) => {
    const head = `${String(label ?? '')}: `;
    const body = String(value ?? '');
    const room = cellWidth - 1;
    const chunks = [];
    if (head.length + body.length <= room) {
      chunks.push({ text: `${head}${body}`, headLength: head.length });
    } else {
      for (let offset = 0; offset < head.length; offset += room) {
        const text = head.slice(offset, offset + room);
        chunks.push({ text, headLength: text.length });
      }
      for (let offset = 0; offset < body.length; offset += room) {
        chunks.push({ text: body.slice(offset, offset + room), headLength: 0 });
      }
    }
    return chunks.length ? chunks : [{ text: '', headLength: 0 }];
  });
  const height = Math.max(...wrapped.map(cell => cell.length));
  return Array.from({ length: height }, (_, rowIndex) => {
    const runs = [];
    wrapped.forEach((cell, index) => {
      const chunk = cell[rowIndex] || { text: '', headLength: 0 };
      const { text, headLength } = chunk;
      if (headLength) runs.push({ text: text.slice(0, headLength), bold: true, italic: false });
      runs.push({ text: text.slice(headLength), bold: false, italic: false });
      if (index < wrapped.length - 1) {
        runs.push({ text: ' '.repeat(cellWidth - text.length), bold: false, italic: false });
      }
    });
    return { runs };
  });
}

function paginateLines(lines) {
  const linesPerPage = Math.floor((PAGE_HEIGHT - PAGE_MARGIN * 2) / LINE_HEIGHT);
  const pages = [];
  let page = [];
  for (const item of lines) {
    const span = Math.max(1, Number(item && item.span) || 1);
    if (page.length && page.length + span > linesPerPage) {
      pages.push(page);
      page = [];
    }
    page.push(item);
    for (let reserve = 1; reserve < span; reserve += 1) page.push(line(''));
  }
  if (page.length) pages.push(page);
  return pages.length > 0 ? pages : [[line('No data')]];
}

// An attachment image as a PDF image XObject. JPEG's compressed bytes are
// already a PDF-native DCT stream. PNG stores scanlines in IDAT chunks; those
// are inflated, their PNG filters are undone, alpha is composited onto white,
// and the RGB bytes are deflated again. Keeping this pure makes malformed image
// input testable without a file store or Meteor.
function jpegSize(data) {
  if (!Buffer.isBuffer(data) || data.length < 4 || data[0] !== 0xFF || data[1] !== 0xD8) return null;
  let offset = 2;
  while (offset + 8 < data.length) {
    if (data[offset] !== 0xFF) { offset += 1; continue; }
    const marker = data[offset + 1];
    offset += 2;
    if (marker === 0xD8 || marker === 0xD9) continue;
    const length = data.readUInt16BE(offset);
    if (length < 2 || offset + length > data.length) return null;
    if ((marker >= 0xC0 && marker <= 0xC3) || (marker >= 0xC5 && marker <= 0xC7)
        || (marker >= 0xC9 && marker <= 0xCB) || (marker >= 0xCD && marker <= 0xCF)) {
      return { height: data.readUInt16BE(offset + 3), width: data.readUInt16BE(offset + 5) };
    }
    offset += length;
  }
  return null;
}

function paeth(a, b, c) {
  const p = a + b - c;
  const pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
  return pa <= pb && pa <= pc ? a : (pb <= pc ? b : c);
}

function pngImage(data) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  if (!Buffer.isBuffer(data) || data.length < 33 || !data.subarray(0, 8).equals(signature)) return null;
  let offset = 8, width = 0, height = 0, bitDepth = 0, colorType = -1;
  const idat = [];
  let palette = null;
  while (offset + 12 <= data.length) {
    const length = data.readUInt32BE(offset);
    const type = data.toString('ascii', offset + 4, offset + 8);
    const chunk = data.subarray(offset + 8, offset + 8 + length);
    if (chunk.length !== length) return null;
    if (type === 'IHDR') {
      width = chunk.readUInt32BE(0); height = chunk.readUInt32BE(4);
      bitDepth = chunk[8]; colorType = chunk[9];
      if (chunk[12] !== 0) return null; // interlaced PNG needs a different pass layout
    } else if (type === 'PLTE') palette = chunk;
    else if (type === 'IDAT') idat.push(chunk);
    else if (type === 'IEND') break;
    offset += length + 12;
  }
  if (!width || !height || bitDepth !== 8 || !idat.length) return null;
  const channels = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 }[colorType];
  if (!channels || (colorType === 3 && !palette)) return null;
  const packed = zlib.inflateSync(Buffer.concat(idat));
  const stride = width * channels;
  if (packed.length < (stride + 1) * height) return null;
  const rows = [];
  let previous = Buffer.alloc(stride), at = 0;
  for (let y = 0; y < height; y += 1) {
    const filter = packed[at++];
    const raw = packed.subarray(at, at + stride); at += stride;
    const row = Buffer.alloc(stride);
    for (let x = 0; x < stride; x += 1) {
      const left = x >= channels ? row[x - channels] : 0;
      const up = previous[x] || 0;
      const upperLeft = x >= channels ? previous[x - channels] : 0;
      const predictor = filter === 0 ? 0 : filter === 1 ? left : filter === 2 ? up
        : filter === 3 ? Math.floor((left + up) / 2) : filter === 4 ? paeth(left, up, upperLeft) : null;
      if (predictor === null) return null;
      row[x] = (raw[x] + predictor) & 255;
    }
    rows.push(row); previous = row;
  }
  const rgb = Buffer.alloc(width * height * 3);
  let out = 0;
  for (const row of rows) {
    for (let x = 0; x < width; x += 1) {
      let r, g, b, alpha = 255;
      if (colorType === 0 || colorType === 4) r = g = b = row[x * channels];
      else if (colorType === 3) {
        const p = row[x] * 3; r = palette[p] || 0; g = palette[p + 1] || 0; b = palette[p + 2] || 0;
      } else { r = row[x * channels]; g = row[x * channels + 1]; b = row[x * channels + 2]; }
      if (colorType === 4) alpha = row[x * channels + 1];
      if (colorType === 6) alpha = row[x * channels + 3];
      rgb[out++] = Math.round((r * alpha + 255 * (255 - alpha)) / 255);
      rgb[out++] = Math.round((g * alpha + 255 * (255 - alpha)) / 255);
      rgb[out++] = Math.round((b * alpha + 255 * (255 - alpha)) / 255);
    }
  }
  return { width, height, data: zlib.deflateSync(rgb), filter: '/FlateDecode' };
}

function preparePdfImage(image) {
  if (!image || !Buffer.isBuffer(image.data)) return null;
  const kind = String(image.type || image.ext || '').toLowerCase();
  if (kind.includes('jpeg') || kind.includes('jpg')) {
    const size = jpegSize(image.data);
    return size && { ...size, data: image.data, filter: '/DCTDecode' };
  }
  if (kind.includes('png')) return pngImage(image.data);
  return null;
}

// Accepts plain strings as well as {text, bold} lines, so a caller that has
// nothing to emphasise stays readable.
function toLine(item) {
  return typeof item === 'string' ? line(item) : item;
}

function buildPdfBuffer(rawLines) {
  const pages = paginateLines((rawLines || []).map(toLine));
  const objects = [];
  const addObject = content => {
    objects.push(content);
    return objects.length;
  };

  const catalogId = addObject('');
  const pagesId = addObject('');
  // WinAnsiEncoding is the point: without it the bytes above 127 are read through
  // the font's built-in encoding and an "ü" is not a "ü".
  const fontId = addObject(
    '<< /Type /Font /Subtype /Type1 /BaseFont /Courier /Encoding /WinAnsiEncoding >>',
  );
  const boldFontId = addObject(
    '<< /Type /Font /Subtype /Type1 /BaseFont /Courier-Bold /Encoding /WinAnsiEncoding >>',
  );
  // The other two faces of the same family, for the markdown runs (#6586). All
  // four are base-14, so no font binary is embedded and no metric is needed.
  const italicFontId = addObject(
    '<< /Type /Font /Subtype /Type1 /BaseFont /Courier-Oblique /Encoding /WinAnsiEncoding >>',
  );
  const boldItalicFontId = addObject(
    '<< /Type /Font /Subtype /Type1 /BaseFont /Courier-BoldOblique /Encoding /WinAnsiEncoding >>',
  );
  const fontFor = (bold, italic) => {
    if (bold && italic) return 'F4';
    if (bold) return 'F2';
    if (italic) return 'F3';
    return 'F1';
  };

  const pageIds = [];
  for (const pageLines of pages) {
    const pageImages = [];
    pageLines.forEach((item, index) => {
      const images = item && item.imageRow ? item.imageRow : (item && item.image ? [item.image] : []);
      images.forEach((image, column) => {
        const prepared = preparePdfImage(image);
        if (!prepared) return;
        const imageId = addObject(
          `<< /Type /XObject /Subtype /Image /Width ${prepared.width} /Height ${prepared.height} `
          + `/ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter ${prepared.filter} `
          + `/Length ${prepared.data.length} >>\nstream\n${prepared.data.toString('latin1')}\nendstream`,
        );
        pageImages.push({ index, column, imageId, prepared, name: `Im${pageImages.length + 1}` });
      });
    });
    // Rectangles are drawn OUTSIDE BT/ET - a PDF text object may not contain a
    // path - so every bar on the page is filled first and the text is written
    // over it. The y of a line is known from its index, which is what makes this
    // possible without a layout pass.
    const barCommands = [];
    pageLines.forEach((item, index) => {
      if (!item || !item.bar) return;
      const baseline = PAGE_HEIGHT - PAGE_MARGIN - FONT_SIZE - index * LINE_HEIGHT;
      const top = baseline - 3;
      barCommands.push(
        '0.85 g',
        `${PAGE_MARGIN - 4} ${top} ${PAGE_WIDTH - (PAGE_MARGIN - 4) * 2} ${LINE_HEIGHT} re f`,
        '0 g',
      );
    });

    const imageCommands = pageImages.flatMap(entry => {
      const gap = 10;
      const maxWidth = entry.column === undefined
        ? PAGE_WIDTH - PAGE_MARGIN * 2
        : (PAGE_WIDTH - PAGE_MARGIN * 2 - gap * 2) / 3;
      const maxHeight = LINE_HEIGHT * 7;
      const scale = Math.min(maxWidth / entry.prepared.width, maxHeight / entry.prepared.height, 1);
      const width = Math.max(1, Math.round(entry.prepared.width * scale));
      const height = Math.max(1, Math.round(entry.prepared.height * scale));
      const x = PAGE_MARGIN + (entry.column || 0) * (maxWidth + gap);
      const y = PAGE_HEIGHT - PAGE_MARGIN - FONT_SIZE - (entry.index + 1) * LINE_HEIGHT - height + LINE_HEIGHT;
      return ['q', `${width} 0 0 ${height} ${x} ${y} cm`, `/${entry.name} Do`, 'Q'];
    });
    const textCommands = ['BT', `/F1 ${FONT_SIZE} Tf`, `${LINE_HEIGHT} TL`];
    textCommands.push(`1 0 0 1 ${PAGE_MARGIN} ${PAGE_HEIGHT - PAGE_MARGIN - FONT_SIZE} Tm`);

    let currentFont = 'F1';
    const draw = (text, bold, italic) => {
      const wanted = fontFor(bold, italic);
      if (wanted !== currentFont) {
        textCommands.push(`/${wanted} ${FONT_SIZE} Tf`);
        currentFont = wanted;
      }
      // Encoded HERE, once, at the boundary where text becomes bytes.
      textCommands.push(`(${escapePdfText(encodeWinAnsi(text))}) Tj`);
    };

    pageLines.forEach((item, index) => {
      if (index > 0) textCommands.push('T*');
      if (item.image) return;
      // A line is either one style, or a list of runs. Consecutive Tj operators
      // continue where the previous one ended, so the runs need no measuring.
      if (item.runs) {
        if (item.runs.length === 0) draw('', false, false);
        for (const run of item.runs) draw(run.text, run.bold, run.italic);
        return;
      }
      draw(item.text, item.bold, false);
    });

    textCommands.push('ET');
    const stream = barCommands.concat(imageCommands, textCommands).join('\n');
    const contentId = addObject(
      `<< /Length ${Buffer.byteLength(stream, 'latin1')} >>\nstream\n${stream}\nendstream`,
    );
    const pageId = addObject(
      `<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] `
      + `/Resources << /Font << /F1 ${fontId} 0 R /F2 ${boldFontId} 0 R `
      + `/F3 ${italicFontId} 0 R /F4 ${boldItalicFontId} 0 R >> `
      + `/XObject << ${pageImages.map(entry => `/${entry.name} ${entry.imageId} 0 R`).join(' ')} >> >> `
      + `/Contents ${contentId} 0 R >>`,
    );
    pageIds.push(pageId);
  }

  objects[catalogId - 1] = `<< /Type /Catalog /Pages ${pagesId} 0 R >>`;
  objects[pagesId - 1] = `<< /Type /Pages /Kids [${pageIds.map(id => `${id} 0 R`).join(' ')}] /Count ${pageIds.length} >>`;

  let pdf = '%PDF-1.4\n';
  const offsets = [0];
  objects.forEach((object, index) => {
    // latin1, not utf8: the text is Windows-1252 bytes, and measuring it as UTF-8
    // would put every byte offset in the xref table past the first accented
    // character out by one - a file some viewers refuse to open at all.
    offsets.push(Buffer.byteLength(pdf, 'latin1'));
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });

  const xrefOffset = Buffer.byteLength(pdf, 'latin1');
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += '0000000000 65535 f \n';
  for (let index = 1; index < offsets.length; index += 1) {
    pdf += `${String(offsets[index]).padStart(10, '0')} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root ${catalogId} 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return Buffer.from(pdf, 'latin1');
}

// ── the card document, drawn as a page ──────────────────────────────────────
//
// models/lib/cardDocument.js describes the layout ONCE, in blocks that name no
// medium; this is what a page makes of them, and ExporterExcelCard makes a
// worksheet of the same blocks. A block type added there is added here, and the
// two formats cannot drift into two layouts.
//
//   section -> a filled bar          meta  -> a row of label/value columns
//   title   -> bold, then a rule     text  -> markdown blocks, wrapped
//   list    -> a marker per item     rows  -> a small grid
//   images  -> the pictures, or their names when this page cannot embed one
//   note    -> one quiet line
function documentToLines(document, options = {}) {
  const out = [];
  let currentSection = '';
  const push = (...items) => out.push(...items);
  const runsOfBlock = block => (block.runs || []).map(run => ({
    text: run.text, bold: !!run.bold, italic: !!run.italic,
  }));

  // A markdown block, as wrapped lines. The list marker and the indent are the
  // document's, and the emphasis is the author's.
  const markdownLines = (blocks, indent = '') => {
    for (const block of blocks || []) {
      const pad = `${indent}${'  '.repeat(block.level || 0)}`;
      if (block.type === 'rule') { push(line(`${pad}${'-'.repeat(20)}`)); continue; }
      if (block.type === 'code') {
        for (const codeLine of String(block.text || '').split('\n')) {
          push(line(`${pad}    ${codeLine}`));
        }
        continue;
      }
      const marker = block.type === 'bullet' ? '- '
        : block.type === 'ordered' ? `${block.index}. `
          : block.quote ? '> ' : '';
      const runs = runsOfBlock(block);
      if (block.type === 'heading') runs.forEach(run => { run.bold = true; });
      const text = runs.map(run => run.text).join('');
      // One style for the whole block is the common case and wraps properly;
      // a mixed block is emitted as its runs on one line, which the writer
      // continues where the previous run ended.
      const uniform = runs.every(run => run.bold === runs[0].bold && run.italic === runs[0].italic);
      if (uniform) {
        // wrapTextBlock returns STRINGS. Wrapping one in a styled run needs the
        // string itself; reading a `.text` off it gives undefined, and the line
        // comes out blank - which is what happened to every bullet the first
        // time this was written.
        const styled = runs.length > 0 && (runs[0].bold || runs[0].italic);
        push(...wrapTextBlock(`${marker}${text}`, pad).map(item => (
          styled
            ? { runs: [{ text: String(item), bold: runs[0].bold, italic: runs[0].italic }] }
            : String(item)
        )));
      } else {
        push({ runs: [{ text: `${pad}${marker}`, bold: false, italic: false }, ...runs] });
      }
    }
  };

  for (const block of document || []) {
    switch (block.type) {
      case 'title':
        push(line((block.runs || []).map(run => run.text).join(''), true));
        push(line('='.repeat(TEXT_WIDTH)));
        break;
      case 'section':
        currentSection = block.key || '';
        push('', bar(block.title || ''));
        break;
      case 'meta':
        if (block.labelDetails && block.labelDetails.length) {
          const ordinary = (block.pairs || []).filter(pair => pair[0] !== block.labelTitle);
          if (ordinary.length) push(...columnRows(ordinary));
          for (let index = 0; index < block.labelDetails.length; index += 5) {
            const labels = block.labelDetails.slice(index, index + 5);
            push({
              labelRow: labels,
              labelTitle: index === 0 ? (block.labelTitle || 'Labels') : '',
              runs: columns([[index === 0 ? (block.labelTitle || 'Labels') : '',
                labels.map(label => label.name || '').join(', ')]]).runs,
            });
          }
        } else push(...columnRows(block.pairs));
        break;
      case 'text':
        markdownLines(block.blocks);
        break;
      case 'note':
        if ((block.runs || []).length) push({ runs: runsOfBlock(block) });
        if (block.progress) push({ progress: block.progress,
          text: `${block.progress.done || 0}/${block.progress.total || 0}` });
        break;
      case 'list':
        if (currentSection === 'attachments' && (block.items || []).some(item => item.attachment)) {
          const headings = options.attachmentHeadings
            || ['#', 'Name', 'Size', 'Type', 'Uploaded', 'Uploader'];
          push({ attachmentCells: headings, attachmentHeader: true,
            text: headings.join(' | ') });
          (block.items || []).forEach((item, index) => {
            const attachment = item.attachment || {};
            const cells = [index + 1, attachment.name || '', attachment.size || '',
              attachment.type || '', attachment.uploaded || '', attachment.uploader || ''];
            push({ attachmentCells: cells, text: cells.join(' | ') });
          });
          break;
        }
        for (const item of block.items || []) {
          const indent = '  '.repeat(item.level || 0);
          const runs = (item.runs || []).map(run => ({
            text: run.text, bold: !!run.bold, italic: !!run.italic,
          }));
          push({
            runs: [
              { text: `${indent}${item.marker || '-'} `, bold: false, italic: false },
              ...(runs.length ? runs : [{ text: '', bold: false, italic: false }]),
            ],
          });
        }
        break;
      case 'rows':
        for (const row of block.rows || []) {
          const cells = row.map(cell => (cell || []).map(run => run.text).join(''));
          push({
            runs: [
              { text: `${cells[0] || ''}  `, bold: false, italic: true },
              ...(row[1] || []).map(run => ({
                text: run.text, bold: !!run.bold, italic: !!run.italic,
              })),
            ],
          });
        }
        break;
      case 'images':
        for (let index = 0; index < (block.images || []).length; index += 3) {
          const imageRow = block.images.slice(index, index + 3);
          push({
            imageRow,
            span: 9,
            imageCaptions: imageRow.map(image => image.name || ''),
            text: '',
          });
        }
        break;
      default:
        break;
    }
  }
  return out;
}

export {
  documentToLines,
  PAGE_WIDTH,
  PAGE_HEIGHT,
  PAGE_MARGIN,
  LINE_HEIGHT,
  FONT_SIZE,
  TEXT_WIDTH,
  encodeWinAnsi,
  flattenMarkdown,
  flattenMarkdownBlocks,
  inlineRuns,
  normalizePdfText,
  escapePdfText,
  wrapLine,
  wrapTextBlock,
  wrapRichTextBlock,
  line,
  bar,
  columns,
  columnRows,
  richLine,
  paginateLines,
  preparePdfImage,
  buildPdfBuffer,
};
