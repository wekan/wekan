// The attachment slideshow's viewers for files a browser does not show by
// itself: Markdown, CSV and TSV, source code and JSON, iCalendar, Outlook
// .msg, tar archives and OpenDocument text, spreadsheets and presentations.
//
// Each reads the file through the same bounded download as the ZIP and Office
// viewers (attachmentPreviewSource.js), and loads its library only when such a
// file is opened: papaparse, highlight.js and DOMPurify, WeKan's own
// iCalendar and Outlook readers (models/lib/icalendarFormat.js,
// outlookMsgFormat.js) and fflate. Everything a file contains reaches the page
// as text (textContent), never as HTML - except highlight.js's output, which is
// escaped text in <span class="hljs-..."> and is sanitized down to exactly
// that, and Markdown, which the caller renders through WeKan's own markdown
// helper with every setting the card description has.

import { assertSourceSize, readBoundedResponse } from './attachmentPreviewSource.js';

export const MAX_TABLE_ROWS = 1000;
export const MAX_TABLE_COLUMNS = 200;
export const MAX_HIGHLIGHT_BYTES = 1024 * 1024;
export const MAX_ARCHIVE_ENTRIES = 2048;
export const MAX_INFLATED_BYTES = 96 * 1024 * 1024;
// What a cut-off table or list ends with: no words, so no translation.
export const MORE_MARK = '⋯';

export function decodeText(bytes) {
  return new TextDecoder('utf-8').decode(bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes));
}

// A NUL in the first 8000 bytes is how git decides a file is binary; such a
// file is not shown as text.
export function looksBinary(bytes) {
  const view = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  return view.subarray(0, 8000).includes(0);
}

// --- CSV / TSV --------------------------------------------------------------

export function csvRows(Papa, text, { tab = false } = {}) {
  const result = Papa.parse(text, {
    delimiter: tab ? '\t' : '',
    preview: MAX_TABLE_ROWS + 1,
    skipEmptyLines: 'greedy',
  });
  const rows = result.data.map(row => (Array.isArray(row) ? row : [row]));
  const truncated = rows.length > MAX_TABLE_ROWS;
  return {
    rows: rows.slice(0, MAX_TABLE_ROWS).map(row => row.slice(0, MAX_TABLE_COLUMNS).map(cell => String(cell ?? ''))),
    truncated: truncated || rows.some(row => row.length > MAX_TABLE_COLUMNS),
  };
}

// --- tar --------------------------------------------------------------------

// gunzip with a ceiling: fflate's streaming Gunzip, fed in slices, stops as soon
// as the inflated size passes MAX_INFLATED_BYTES, so a gzip bomb never fills
// the memory it claims.
export function gunzipBounded(Gunzip, bytes, limit = MAX_INFLATED_BYTES) {
  const chunks = [];
  let total = 0;
  const gunzip = new Gunzip();
  gunzip.ondata = chunk => {
    total += chunk.length;
    if (total > limit) throw new RangeError('Archive inflates past the preview limit');
    chunks.push(chunk);
  };
  const step = 64 * 1024;
  for (let at = 0; at < bytes.length; at += step) {
    gunzip.push(bytes.subarray(at, at + step), at + step >= bytes.length);
  }
  if (!bytes.length) throw new Error('Empty gzip stream');
  const out = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) { out.set(chunk, offset); offset += chunk.length; }
  return out;
}

const isGzip = bytes => bytes.length > 2 && bytes[0] === 0x1f && bytes[1] === 0x8b;

function field(bytes, start, length) {
  const slice = bytes.subarray(start, start + length);
  const end = slice.indexOf(0);
  return decodeText(end < 0 ? slice : slice.subarray(0, end));
}

function octal(bytes, start, length) {
  const text = field(bytes, start, length).trim();
  if (!/^[0-7]+$/.test(text)) return 0;
  return parseInt(text, 8);
}

// A tar header's checksum: the sum of its bytes with the checksum field
// itself counted as spaces, as tar(5) defines it.
function tarChecksumOk(header) {
  let sum = 0;
  for (let i = 0; i < 512; i += 1) sum += i >= 148 && i < 156 ? 32 : header[i];
  return sum === octal(header, 148, 8);
}

// The names in a tar archive (ustar, GNU long names, pax paths). Only the
// headers are read; no member is extracted or written anywhere.
export function listTarEntries(input) {
  const bytes = input instanceof Uint8Array ? input : new Uint8Array(input);
  const names = [];
  let longName = null;
  let at = 0;
  let truncated = false;
  while (at + 512 <= bytes.length) {
    const header = bytes.subarray(at, at + 512);
    if (header.every(b => b === 0)) break;
    if (!tarChecksumOk(header)) {
      // Not a tar at all, or the rest of one that was cut off.
      if (at === 0) throw new Error('Not a tar archive');
      truncated = true;
      break;
    }
    const size = octal(header, 124, 12);
    const type = String.fromCharCode(header[156] || 48);
    const dataStart = at + 512;
    const data = bytes.subarray(dataStart, dataStart + size);
    at = dataStart + Math.ceil(size / 512) * 512;
    if (type === 'L') { longName = field(data, 0, data.length); continue; }
    if (type === 'x') {
      const path = /(?:^|\n)\d+ path=([^\n]*)\n/.exec(decodeText(data));
      if (path) longName = path[1];
      continue;
    }
    if (type === 'g' || type === 'K') continue;
    const prefix = field(header, 0x159, 155);
    const name = longName || (prefix ? `${prefix}/${field(header, 0, 100)}` : field(header, 0, 100));
    longName = null;
    if (names.length >= MAX_ARCHIVE_ENTRIES) { truncated = true; break; }
    names.push(name);
  }
  return { names, truncated };
}

// --- OpenDocument -----------------------------------------------------------

const TEXT_NS = 'urn:oasis:names:tc:opendocument:xmlns:text:1.0';
const TABLE_NS = 'urn:oasis:names:tc:opendocument:xmlns:table:1.0';
const DRAW_NS = 'urn:oasis:names:tc:opendocument:xmlns:drawing:1.0';

// The text of an ODF element: its text nodes, with text:s spaces, text:tab
// and text:line-break kept as the characters they stand for.
function odfText(node) {
  let out = '';
  for (const child of Array.from(node.childNodes || [])) {
    if (child.nodeType === 3) out += child.nodeValue;
    else if (child.nodeType === 1 && child.namespaceURI === TEXT_NS) {
      if (child.localName === 's') out += ' '.repeat(Math.min(Number(child.getAttributeNS(TEXT_NS, 'c')) || 1, 1000));
      else if (child.localName === 'tab') out += '\t';
      else if (child.localName === 'line-break') out += '\n';
      else if (child.localName !== 'note') out += odfText(child);
    } else if (child.nodeType === 1) out += odfText(child);
  }
  return out;
}

// content.xml as blocks in document order: { kind: 'heading' | 'paragraph',
// text }, { kind: 'table', rows }, { kind: 'page', name } for a slide or a
// sheet. Pure DOM (childNodes, namespaceURI, localName), so a test can give it
// any DOMParser's document.
export function odfBlocks(doc) {
  const blocks = [];
  let rowsLeft = MAX_TABLE_ROWS;
  let truncated = false;
  const walk = node => {
    for (const child of Array.from(node.childNodes || [])) {
      if (child.nodeType !== 1) continue;
      const ns = child.namespaceURI;
      const name = child.localName;
      if (ns === TEXT_NS && (name === 'h' || name === 'p')) {
        const text = odfText(child);
        if (text.trim()) blocks.push({ kind: name === 'h' ? 'heading' : 'paragraph', text });
      } else if (ns === TABLE_NS && name === 'table') {
        const tableName = child.getAttributeNS(TABLE_NS, 'name');
        if (tableName) blocks.push({ kind: 'page', name: tableName });
        const rows = [];
        for (const row of Array.from(child.getElementsByTagNameNS(TABLE_NS, 'table-row'))) {
          const repeat = Math.max(1, Math.min(Number(row.getAttributeNS(TABLE_NS, 'number-rows-repeated')) || 1, MAX_TABLE_ROWS));
          const cells = [];
          for (const cell of Array.from(row.childNodes)) {
            if (cell.nodeType !== 1 || cell.namespaceURI !== TABLE_NS) continue;
            if (cell.localName !== 'table-cell' && cell.localName !== 'covered-table-cell') continue;
            const text = Array.from(cell.getElementsByTagNameNS(TEXT_NS, 'p')).map(odfText).join('\n');
            const span = Math.max(1, Math.min(Number(cell.getAttributeNS(TABLE_NS, 'number-columns-repeated')) || 1, MAX_TABLE_COLUMNS));
            for (let i = 0; i < span && cells.length < MAX_TABLE_COLUMNS; i += 1) cells.push(text);
          }
          // Spreadsheets end every row and sheet with empty cells repeated to
          // the edge of the grid; those are not content.
          while (cells.length && !cells[cells.length - 1]) cells.pop();
          for (let i = 0; i < repeat; i += 1) {
            if (rowsLeft <= 0) { truncated = true; break; }
            rows.push(cells);
            rowsLeft -= 1;
          }
        }
        while (rows.length && !rows[rows.length - 1].length) rows.pop();
        if (rows.length) blocks.push({ kind: 'table', rows });
      } else if (ns === DRAW_NS && name === 'page') {
        blocks.push({ kind: 'page', name: child.getAttributeNS(DRAW_NS, 'name') || '' });
        walk(child);
      } else {
        walk(child);
      }
    }
  };
  walk(doc.documentElement || doc);
  return { blocks, truncated };
}

export function odfContentXml(unzipSync, bytes) {
  let found = false;
  const files = unzipSync(bytes, { filter(entry) {
    if (entry.name !== 'content.xml') return false;
    if (entry.originalSize > MAX_INFLATED_BYTES) throw new RangeError('content.xml exceeds the preview limit');
    found = true;
    return true;
  } });
  if (!found || !files['content.xml']) throw new Error('Not an OpenDocument file: no content.xml');
  return decodeText(files['content.xml']);
}

// --- rendering --------------------------------------------------------------

function element(doc, tag, text, className) {
  const node = doc.createElement(tag);
  if (text !== undefined) node.textContent = text;
  if (className) node.className = className;
  return node;
}

function renderTable(doc, rows, truncated, { header = true } = {}) {
  const table = element(doc, 'table', undefined, 'attachment-preview-table');
  rows.forEach((row, index) => {
    const tr = doc.createElement('tr');
    for (const cell of row) tr.appendChild(element(doc, header && index === 0 ? 'th' : 'td', cell));
    table.appendChild(tr);
  });
  if (truncated) {
    const tr = doc.createElement('tr');
    tr.appendChild(element(doc, 'td', MORE_MARK));
    table.appendChild(tr);
  }
  return table;
}

function renderList(doc, names, truncated) {
  const list = doc.createElement('ul');
  for (const name of names) list.appendChild(element(doc, 'li', name));
  if (truncated) list.appendChild(element(doc, 'li', MORE_MARK));
  return list;
}

function localDate(value) {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString();
}

function definitionList(doc, pairs) {
  const dl = element(doc, 'dl', undefined, 'attachment-preview-fields');
  for (const [label, value] of pairs) {
    if (!value) continue;
    dl.appendChild(element(doc, 'dt', label));
    dl.appendChild(element(doc, 'dd', value));
  }
  return dl;
}

const people = list => (list || []).map(p => (p.name && p.address ? `${p.name} <${p.address}>` : p.name || p.address))
  .filter(Boolean).join(', ');

async function renderCode(doc, bytes, language) {
  if (looksBinary(bytes)) throw new Error('Binary file');
  let text = decodeText(bytes);
  if (language === 'json') {
    try { text = JSON.stringify(JSON.parse(text), null, 2); } catch (e) { /* shown as it is */ }
  }
  const wrap = element(doc, 'div', undefined, 'viewer attachment-preview-code');
  const pre = doc.createElement('pre');
  const code = element(doc, 'code', undefined, `hljs language-${language}`);
  if (language !== 'plaintext' && bytes.byteLength <= MAX_HIGHLIGHT_BYTES) {
    const [{ default: hljs }, { default: DOMPurify }] = await Promise.all([
      import('highlight.js/lib/common'), import('dompurify')]);
    if (hljs.getLanguage(language)) {
      const html = hljs.highlight(text, { language, ignoreIllegals: true }).value;
      // highlight.js escapes the source; this keeps that guarantee even if it
      // ever did not: only <span class="hljs-..."> survives.
      code.innerHTML = DOMPurify.sanitize(html, { ALLOWED_TAGS: ['span'], ALLOWED_ATTR: ['class'],
        ALLOWED_URI_REGEXP: /^$/ });
      for (const span of Array.from(code.querySelectorAll('span'))) {
        const classes = String(span.className).split(/\s+/).filter(c => /^hljs-[\w-]+$/.test(c));
        span.className = classes.join(' ');
      }
    } else code.textContent = text;
  } else code.textContent = text;
  pre.appendChild(code);
  wrap.appendChild(pre);
  return wrap;
}

async function renderKind({ doc, rich, bytes, extension, language, labels, renderMarkdown, container }) {
  switch (rich) {
    case 'markdown': {
      if (looksBinary(bytes)) throw new Error('Binary file');
      const holder = element(doc, 'div', undefined, 'attachment-preview-markdown');
      container.appendChild(holder);
      return renderMarkdown(holder, decodeText(bytes));
    }
    case 'csv': {
      if (looksBinary(bytes)) throw new Error('Binary file');
      const { default: Papa } = await import('papaparse');
      const { rows, truncated } = csvRows(Papa, decodeText(bytes), { tab: extension === 'tsv' });
      container.appendChild(renderTable(doc, rows, truncated));
      return null;
    }
    case 'code':
      container.appendChild(await renderCode(doc, bytes, language));
      return null;
    case 'calendar': {
      const { parseICalendar } = await import('../../models/lib/icalendarFormat.js');
      const { tasks } = parseICalendar(decodeText(bytes));
      const rows = [[labels.title, labels.start, labels.end, labels.due, labels.description]];
      for (const task of tasks.slice(0, MAX_TABLE_ROWS)) {
        // parseICalendar puts a VEVENT in the list "Events" and gives it its
        // DTEND as date_due; a VTODO's date_due is its DUE and date_end its
        // completion. A cancelled event is shown like a cancelled task.
        const isEvent = task.column_name === 'Events';
        rows.push([task.title, localDate(task.date_started),
          isEvent ? localDate(task.date_due) : localDate(task.date_end),
          isEvent ? '' : localDate(task.date_due), task.description || '']);
      }
      container.appendChild(renderTable(doc, rows, tasks.length > MAX_TABLE_ROWS));
      return null;
    }
    case 'outlook': {
      const { readOutlookMsg } = await import('../../models/lib/outlookMsgFormat.js');
      const msg = readOutlookMsg(new Uint8Array(bytes));
      container.appendChild(definitionList(doc, [
        [labels.from, people([msg.from])], [labels.to, people(msg.to)], [labels.cc, people(msg.cc)],
        [labels.subject, msg.subject], [labels.date, localDate(msg.date)],
      ]));
      container.appendChild(element(doc, 'div', msg.text || '', 'attachment-preview-mail-body'));
      const files = (msg.files || []).map(f => f.name);
      if (files.length) {
        container.appendChild(element(doc, 'h3', labels.attachments));
        container.appendChild(renderList(doc, files, !!msg.attachments));
      }
      return null;
    }
    case 'tar': {
      let view = new Uint8Array(bytes);
      if (isGzip(view)) {
        const { Gunzip } = await import('fflate');
        view = gunzipBounded(Gunzip, view);
      }
      const { names, truncated } = listTarEntries(view);
      if (names.length) container.appendChild(renderList(doc, names, truncated));
      else container.textContent = labels.empty;
      return null;
    }
    case 'opendocument': {
      const { unzipSync } = await import('fflate');
      const xml = odfContentXml(unzipSync, new Uint8Array(bytes));
      const parsed = new DOMParser().parseFromString(xml, 'application/xml');
      if (parsed.getElementsByTagName('parsererror').length) throw new Error('Invalid content.xml');
      const { blocks, truncated } = odfBlocks(parsed);
      for (const block of blocks) {
        if (block.kind === 'heading') container.appendChild(element(doc, 'h3', block.text));
        else if (block.kind === 'paragraph') container.appendChild(element(doc, 'p', block.text));
        else if (block.kind === 'page') container.appendChild(element(doc, 'h2', block.name, 'attachment-preview-page'));
        else container.appendChild(renderTable(doc, block.rows, false, { header: false }));
      }
      if (truncated) container.appendChild(element(doc, 'p', MORE_MARK));
      if (!blocks.length) container.textContent = labels.empty;
      return null;
    }
    default:
      throw new TypeError(`No viewer for ${rich}`);
  }
}

// Open one file into `container`. Resolves to { destroy() }, which the
// slideshow calls when it moves on or closes. A response that arrives after
// the slideshow moved on (signal aborted) is not rendered.
export async function openRichAttachment({ container, rich, extension, language, signal, size, url,
  labels = {}, renderMarkdown }) {
  assertSourceSize(size);
  const response = await fetch(url, { credentials: 'same-origin', signal });
  if (!response.ok) throw new Error(`Attachment fetch failed: ${response.status}`);
  assertSourceSize(Number(response.headers.get('content-length')));
  const bytes = new Uint8Array(await readBoundedResponse(response));
  if (signal && signal.aborted) return { destroy() {} };
  const doc = container.ownerDocument;
  container.replaceChildren();
  const view = await renderKind({ doc, rich, bytes, extension, language, labels, renderMarkdown, container });
  return {
    destroy() {
      if (view && typeof view.destroy === 'function') view.destroy();
      container.replaceChildren();
    },
  };
}
