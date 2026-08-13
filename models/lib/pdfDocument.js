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
    const stream = textCommands.join('\n');
    const contentId = addObject(
      `<< /Length ${Buffer.byteLength(stream, 'latin1')} >>\nstream\n${stream}\nendstream`,
    );
    const pageId = addObject(
      `<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] `
      + `/Resources << /Font << /F1 ${fontId} 0 R /F2 ${boldFontId} 0 R `
      + `/F3 ${italicFontId} 0 R /F4 ${boldItalicFontId} 0 R >> >> `
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
  flattenMarkdownBlocks,
  inlineRuns,
  normalizePdfText,
  escapePdfText,
  wrapLine,
  wrapTextBlock,
  wrapRichTextBlock,
  line,
  richLine,
  paginateLines,
  buildPdfBuffer,
};
