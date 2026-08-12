'use strict';

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
// all - Cyrillic, Greek, Hebrew, Arabic, CJK, emoji - falls back to '?', because
// the fix for that is an embedded Unicode font, which is a font binary this
// repository does not carry.
//
// MARKDOWN IS FLATTENED, not printed. The same report: "all the text in this PDF
// file is markdown formatted - this doesn't make sense in a pdf file, does it?" It
// does not: `**bold**` in a PDF is four stray asterisks. There is no markdown
// renderer here, so the syntax is removed and the words are kept, with headings and
// titles drawn in the bold font instead.

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

function paginateLines(lines) {
  const linesPerPage = Math.floor((PAGE_HEIGHT - PAGE_MARGIN * 2) / LINE_HEIGHT);
  const pages = [];
  for (let index = 0; index < lines.length; index += linesPerPage) {
    pages.push(lines.slice(index, index + linesPerPage));
  }
  return pages.length > 0 ? pages : [[line('No data')]];
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

  const pageIds = [];
  for (const pageLines of pages) {
    const textCommands = ['BT', `/F1 ${FONT_SIZE} Tf`, `${LINE_HEIGHT} TL`];
    textCommands.push(`1 0 0 1 ${PAGE_MARGIN} ${PAGE_HEIGHT - PAGE_MARGIN - FONT_SIZE} Tm`);

    let currentFont = 'F1';
    pageLines.forEach((item, index) => {
      if (index > 0) textCommands.push('T*');
      const wanted = item.bold ? 'F2' : 'F1';
      if (wanted !== currentFont) {
        textCommands.push(`/${wanted} ${FONT_SIZE} Tf`);
        currentFont = wanted;
      }
      // Encoded HERE, once, at the boundary where text becomes bytes.
      textCommands.push(`(${escapePdfText(encodeWinAnsi(item.text))}) Tj`);
    });

    textCommands.push('ET');
    const stream = textCommands.join('\n');
    const contentId = addObject(
      `<< /Length ${Buffer.byteLength(stream, 'latin1')} >>\nstream\n${stream}\nendstream`,
    );
    const pageId = addObject(
      `<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] `
      + `/Resources << /Font << /F1 ${fontId} 0 R /F2 ${boldFontId} 0 R >> >> `
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

export {
  PAGE_WIDTH,
  PAGE_HEIGHT,
  PAGE_MARGIN,
  LINE_HEIGHT,
  FONT_SIZE,
  TEXT_WIDTH,
  encodeWinAnsi,
  flattenMarkdown,
  normalizePdfText,
  escapePdfText,
  wrapLine,
  wrapTextBlock,
  line,
  paginateLines,
  buildPdfBuffer,
};
