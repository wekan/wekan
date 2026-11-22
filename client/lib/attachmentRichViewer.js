// The attachment slideshow's viewers for files a browser does not show by
// itself: plain text, Markdown, CSV and TSV, source code and JSON, iCalendar,
// Outlook .msg, tar archives and OpenDocument text, spreadsheets and
// presentations.
//
// Nothing is read whole that does not have to be (attachmentWindow.js):
//
//   text, code, CSV, JSON, Markdown   HTTP Range requests for what is on the
//       screen; the scrollbar is the whole file, so dragging it to the middle
//       shows the middle. A file of one chunk (256 KB) is read in that one
//       request and indexed exactly; Markdown and JSON of that size are
//       formatted (a larger one is shown as its text, as formatting needs the
//       whole document).
//   tar and tar.gz, iCalendar   read in order, as far as they are scrolled:
//       infinite scroll downwards. Compressed data cannot be read from its
//       middle.
//   Outlook .msg, OpenDocument   their content is scattered through the file
//       (a Compound File's sectors, a ZIP's compressed content.xml), so the
//       server converts each once, a piece at a time, into rows with an index
//       (server/lib/attachmentPreviewStore.js); the scrollbar is exactly those
//       rows, and only the visible ones are fetched (attachmentRecords.js).
//
// Only the visible rows are in the page. Everything a file contains reaches it
// as text (textContent) - except highlight.js's output, escaped text in
// <span class="hljs-..."> sanitized down to exactly that, and Markdown, which
// the caller renders through WeKan's own markdown helper with every setting
// the card description has.

import { RangeReader, ByteRows, WindowView, GrowingView, IndexedView, splitRows, CHUNK_BYTES, MAX_ROW_BYTES }
  from './attachmentWindow.js';
import { PreviewRecords } from './attachmentRecords.js';

export const MAX_COLUMNS = 1024;
export const MAX_COMPONENT_BYTES = 1024 * 1024;
export const ROWS_PER_READ = 200;
const FEED_BYTES = 4096;

export function decodeText(bytes) {
  return new TextDecoder('utf-8').decode(bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes));
}

// A NUL in the first 8000 bytes is how git decides a file is binary; such a
// file is not shown as text.
export function looksBinary(bytes) {
  const view = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  return view.subarray(0, 8000).includes(0);
}

function element(doc, tag, text, className) {
  const node = doc.createElement(tag);
  if (text !== undefined) node.textContent = text;
  if (className) node.className = className;
  return node;
}

// Rows of text already in memory, cut at MAX_ROW_BYTES characters as ByteRows
// cuts a file.
function rowsOfText(text) {
  const rows = [];
  for (const line of text.split('\n')) {
    if (line.length <= MAX_ROW_BYTES) rows.push({ start: rows.length, end: rows.length + 1, text: line });
    else {
      for (let at = 0; at < line.length; at += MAX_ROW_BYTES) {
        rows.push({ start: rows.length, end: rows.length + 1, text: line.slice(at, at + MAX_ROW_BYTES) });
      }
    }
  }
  return rows;
}

// --- text, code, CSV, JSON, Markdown ----------------------------------------------

async function highlighter(language) {
  if (!language || language === 'plaintext') return null;
  const [{ default: hljs }, { default: DOMPurify }] = await Promise.all([
    import('highlight.js/lib/common'), import('dompurify')]);
  if (!hljs.getLanguage(language)) return null;
  // highlight.js escapes the source; this keeps that guarantee even if it ever
  // did not: only <span class="hljs-..."> survives. Each row is coloured on
  // its own, as only the rows on the screen are read.
  return text => DOMPurify.sanitize(hljs.highlight(text, { language, ignoreIllegals: true }).value,
    { ALLOWED_TAGS: ['span'], ALLOWED_ATTR: ['class'], ALLOWED_URI_REGEXP: /^$/ });
}

function textRenderer(doc, highlight) {
  return (rows, viewport) => {
    const items = rows.map(row => {
      const el = element(doc, 'div', undefined, 'attachment-window-row');
      if (highlight) {
        el.innerHTML = highlight(row.text);
        for (const span of Array.from(el.querySelectorAll('span'))) {
          span.className = String(span.className).split(/\s+/).filter(c => /^hljs-[\w-]+$/.test(c)).join(' ');
        }
      } else el.textContent = row.text;
      return el;
    });
    viewport.replaceChildren(...items);
  };
}

function cellsRow(doc, cells, className) {
  const el = element(doc, 'div', undefined, `attachment-window-row attachment-csv-row ${className || ''}`.trim());
  for (const text of cells) {
    const cell = element(doc, 'span', text, 'attachment-csv-cell');
    cell.title = text;
    el.appendChild(cell);
  }
  return el;
}

function csvRenderer(doc, Papa, delimiter, header) {
  // Each row is parsed on its own, as only the rows on the screen are read; a
  // quoted value with a newline in it shows as two rows.
  const parse = text => {
    const data = Papa.parse(text, { delimiter }).data[0];
    return (Array.isArray(data) ? data : [text]).slice(0, MAX_COLUMNS).map(c => String(c ?? ''));
  };
  const columns = header ? parse(header.text) : [];
  return (rows, viewport) => {
    const items = [];
    if (header) items.push(cellsRow(doc, columns, 'attachment-csv-header'));
    // The header row is drawn once, pinned; not again as data.
    for (const r of rows) if (!header || r.start !== header.start) items.push(cellsRow(doc, parse(r.text)));
    viewport.replaceChildren(...items);
  };
}

async function openTextWindow({ container, reader, rich, language, extension, renderMarkdown, viewportHeight }) {
  const doc = container.ownerDocument;
  const size = reader.size;
  const first = await reader.bytes(0, Math.min(size, CHUNK_BYTES));
  if (looksBinary(first)) throw new Error('Binary file');
  const whole = size <= CHUNK_BYTES;
  container.replaceChildren();
  if (whole && rich === 'markdown') {
    const holder = element(doc, 'div', undefined, 'attachment-preview-markdown');
    container.appendChild(holder);
    return renderMarkdown(holder, decodeText(first));
  }
  let all = null;
  if (whole) {
    let text = null;
    if (language === 'json') {
      try { text = JSON.stringify(JSON.parse(decodeText(first)), null, 2); } catch (e) { /* shown as it is */ }
    }
    all = text === null ? await splitRows(first) : rowsOfText(text);
  }
  const rows = new ByteRows(reader, size);
  let renderRows;
  let className = 'attachment-preview-text';
  if (rich === 'csv') {
    const { default: Papa } = await import('papaparse');
    const header = all ? all[0] : await rows.rowAt(0);
    renderRows = csvRenderer(doc, Papa, extension === 'tsv' ? '\t' : ',', header);
    className = 'attachment-preview-csv';
  } else {
    const highlight = rich === 'code' ? await highlighter(language) : null;
    renderRows = textRenderer(doc, highlight);
    if (rich === 'code') className = 'viewer attachment-preview-code';
  }
  const view = new WindowView(container, { rows, all, size, renderRows, className, viewportHeight });
  await view.start();
  return { view, destroy() { view.destroy(); } };
}

// --- tar --------------------------------------------------------------------

function field(bytes, start, length) {
  const slice = bytes.subarray(start, start + length);
  const end = slice.indexOf(0);
  return decodeText(end < 0 ? slice : slice.subarray(0, end));
}

function octal(bytes, start, length) {
  const text = field(bytes, start, length).trim();
  return /^[0-7]+$/.test(text) ? parseInt(text, 8) : 0;
}

// A tar header's checksum: the sum of its bytes with the checksum field
// itself counted as spaces, as tar(5) defines it.
function tarChecksumOk(header) {
  let sum = 0;
  for (let i = 0; i < 512; i += 1) sum += i >= 148 && i < 156 ? 32 : header[i];
  return sum === octal(header, 148, 8);
}

// The names of a tar archive, fed in pieces as it streams in: ustar, GNU long
// names and pax paths. Member data is counted past, never kept.
export class TarNames {
  constructor() {
    this.buffer = new Uint8Array(0);
    this.skip = 0;
    this.collect = null;
    this.longName = null;
    this.headers = 0;
    this.ended = false;
  }

  push(bytes) {
    const names = [];
    let data = bytes;
    while (data.length && !this.ended) {
      if (this.skip > 0) {
        const n = Math.min(this.skip, data.length);
        this.skip -= n;
        data = data.subarray(n);
        continue;
      }
      if (this.collect) {
        const n = Math.min(this.collect.left, data.length);
        this.collect.parts.push(data.slice(0, n));
        this.collect.left -= n;
        data = data.subarray(n);
        if (this.collect.left === 0) {
          const joined = new Uint8Array(this.collect.parts.reduce((t, p) => t + p.length, 0));
          let at = 0;
          for (const p of this.collect.parts) { joined.set(p, at); at += p.length; }
          const body = decodeText(joined);
          if (this.collect.type === 'L') this.longName = body.replace(/\0[\s\S]*$/, '');
          else {
            const path = /(?:^|\n)\d+ path=([^\n]*)\n/.exec(body);
            if (path) this.longName = path[1];
          }
          this.skip = this.collect.padding;
          this.collect = null;
        }
        continue;
      }
      const take = Math.min(512 - this.buffer.length, data.length);
      const header = new Uint8Array(this.buffer.length + take);
      header.set(this.buffer);
      header.set(data.subarray(0, take), this.buffer.length);
      data = data.subarray(take);
      if (header.length < 512) { this.buffer = header; continue; }
      this.buffer = new Uint8Array(0);
      if (header.every(b => b === 0)) { this.ended = true; break; }
      if (!tarChecksumOk(header)) {
        if (!this.headers) throw new Error('Not a tar archive');
        this.ended = true; // the rest of one that was cut off or damaged
        break;
      }
      this.headers += 1;
      const size = octal(header, 124, 12);
      const padded = Math.ceil(size / 512) * 512;
      const type = String.fromCharCode(header[156] || 48);
      if ((type === 'L' || type === 'x') && size > 0 && size <= 65536) {
        this.collect = { type, left: size, parts: [], padding: padded - size };
        continue;
      }
      if (type === 'L' || type === 'x' || type === 'g' || type === 'K') { this.skip = padded; continue; }
      const prefix = field(header, 0x159, 155);
      names.push(this.longName || (prefix ? `${prefix}/${field(header, 0, 100)}` : field(header, 0, 100)));
      this.longName = null;
      this.skip = padded;
    }
    return names;
  }
}

async function* tarNameStream(reader) {
  const tar = new TarNames();
  let gunzip = null;
  let pending = [];
  for await (const chunk of reader.stream()) {
    if (gunzip === null) {
      if (chunk.length > 2 && chunk[0] === 0x1f && chunk[1] === 0x8b) {
        const { Gunzip } = await import('fflate');
        gunzip = new Gunzip();
        gunzip.ondata = data => { if (!tar.ended) pending.push(...tar.push(data)); };
      } else gunzip = false;
    }
    // Small pieces, so a gzip bomb inflates a little at a time and stops as
    // soon as the view has enough names.
    for (let at = 0; at < chunk.length; at += FEED_BYTES) {
      const piece = chunk.subarray(at, at + FEED_BYTES);
      if (gunzip) gunzip.push(piece, false);
      else pending.push(...tar.push(piece));
      if (pending.length) { yield* pending; pending = []; }
      if (tar.ended) return;
    }
  }
}

// --- iCalendar ----------------------------------------------------------------

// The VEVENTs and VTODOs of a calendar, fed as text as it streams in; each is
// read by WeKan's own parseICalendar on its own.
export class IcsComponents {
  constructor(parseICalendar) {
    this.parse = parseICalendar;
    this.rest = '';
    this.line = null;
    this.lines = null;
    this.depth = 0;
    this.bytes = 0;
    this.started = false;
  }

  logical(line, out) {
    if (!this.started) {
      if (!line.trim()) return;
      if (!/^BEGIN:VCALENDAR$/i.test(line.trim())) throw new Error('Not an iCalendar file: no BEGIN:VCALENDAR');
      this.started = true;
      return;
    }
    const upper = line.toUpperCase();
    if (!this.lines) {
      if (upper === 'BEGIN:VEVENT' || upper === 'BEGIN:VTODO') { this.lines = [line]; this.depth = 1; this.bytes = line.length; }
      return;
    }
    this.lines.push(line);
    this.bytes += line.length;
    if (upper.startsWith('BEGIN:')) this.depth += 1;
    else if (upper.startsWith('END:')) this.depth -= 1;
    if (this.depth === 0) {
      const text = `BEGIN:VCALENDAR\r\n${this.lines.join('\r\n')}\r\nEND:VCALENDAR\r\n`;
      this.lines = null;
      try { out.push(...this.parse(text).tasks); } catch (e) { /* one broken item: the others still show */ }
    } else if (this.bytes > MAX_COMPONENT_BYTES) {
      this.lines = null; // an item this large is not shown
    }
  }

  push(text, final = false) {
    const out = [];
    const parts = (this.rest + text).split(/\r?\n/);
    this.rest = final ? '' : parts.pop();
    for (const raw of parts) {
      if (/^[ \t]/.test(raw) && this.line !== null) { this.line += raw.slice(1); continue; }
      if (this.line !== null) this.logical(this.line, out);
      this.line = raw;
    }
    if (final && this.line !== null) { this.logical(this.line, out); this.line = null; }
    if (final && !this.started) throw new Error('Not an iCalendar file: no BEGIN:VCALENDAR');
    return out;
  }
}

async function* calendarStream(reader) {
  const { parseICalendar } = await import('../../models/lib/icalendarFormat.js');
  const ics = new IcsComponents(parseICalendar);
  const decoder = new TextDecoder('utf-8');
  for await (const chunk of reader.stream()) {
    for (let at = 0; at < chunk.length; at += FEED_BYTES * 16) {
      const tasks = ics.push(decoder.decode(chunk.subarray(at, at + FEED_BYTES * 16), { stream: true }));
      if (tasks.length) yield* tasks;
    }
  }
  yield* ics.push(decoder.decode(), true);
}

// --- converted previews: Outlook .msg, OpenDocument -----------------------------

function recordRenderer(doc, labels) {
  const field = { subject: labels.subject, from: labels.from, to: labels.to, cc: labels.cc, date: labels.date };
  return (rows, viewport) => {
    viewport.replaceChildren(...rows.map(row => {
      if (!row) return element(doc, 'div', '', 'attachment-window-row');
      if (row.k === 'row') return cellsRow(doc, (row.c || []).map(String));
      if (row.k === 'field' || row.k === 'file') {
        const el = element(doc, 'div', undefined, 'attachment-window-row attachment-preview-field');
        el.appendChild(element(doc, 'span', row.k === 'file' ? labels.attachments : (field[row.l] || row.l), 'attachment-preview-label'));
        el.appendChild(element(doc, 'span', row.k === 'field' && row.l === 'date' ? localDate(row.v) : String(row.v ?? '')));
        return el;
      }
      const cls = { h: 'attachment-preview-heading', page: 'attachment-preview-page', more: 'attachment-preview-more' }[row.k] || '';
      return element(doc, 'div', String(row.v ?? ''), `attachment-window-row ${cls}`.trim());
    }));
  };
}

async function openRecords({ container, url, signal, fetchImpl, labels, viewportHeight }) {
  const records = await new PreviewRecords(url, { signal, fetchImpl }).open();
  if (signal && signal.aborted) return { destroy() {} };
  container.replaceChildren();
  if (!records.count) {
    container.textContent = labels.empty;
    return { records, destroy() { container.replaceChildren(); } };
  }
  // A preview the server's disk guard ended (attachmentPreviewStore.js
  // MAX_PREVIEW_BYTES) ends with a row that says so, without words.
  const extra = records.meta.truncated ? 1 : 0;
  const view = new IndexedView(container, {
    count: records.count + extra, viewportHeight, className: 'attachment-preview-records',
    rowsAt: async (first, n) => {
      const rows = await records.rowsAt(first, Math.min(n, records.count - first));
      if (extra && first + n > records.count) rows.push({ k: 'more', v: '\u22ef' });
      return rows;
    },
    renderRows: recordRenderer(container.ownerDocument, labels),
  });
  await view.start();
  return { view, records, destroy() { view.destroy(); container.replaceChildren(); } };
}

// --- opening ------------------------------------------------------------------

function batches(iterator) {
  return async () => {
    const rows = [];
    while (rows.length < ROWS_PER_READ) {
      const { value, done } = await iterator.next();
      if (done) break;
      rows.push(value);
    }
    return rows.length ? rows : null;
  };
}

function localDate(value) {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString();
}

async function openGrowing({ container, next, renderRow, header, className, listTag, viewportHeight, emptyText }) {
  const view = new GrowingView(container, { next, renderRow, className, listTag, viewportHeight });
  if (header) view.viewport.insertBefore(header, view.list);
  await view.start();
  if (!view.rows.length && view.done) {
    view.destroy();
    container.textContent = emptyText;
    return { destroy() { container.replaceChildren(); } };
  }
  return { view, destroy() { view.destroy(); } };
}

// Open one file into `container`. Resolves to { destroy() }, which the
// slideshow calls when it moves on or closes. A file whose first read arrives
// after the slideshow moved on (signal aborted) is not rendered.
export async function openRichAttachment({ container, rich, extension, language, signal, size, url,
  labels = {}, renderMarkdown, fetchImpl, viewportHeight }) {
  const reader = new RangeReader(url, size, { signal, fetchImpl });
  await reader.probeSize();
  if (signal && signal.aborted) return { destroy() {} };
  const doc = container.ownerDocument;
  switch (rich) {
    case 'text': case 'markdown': case 'csv': case 'code':
      return openTextWindow({ container, reader, rich, language, extension, renderMarkdown, viewportHeight });
    case 'tar':
      container.replaceChildren();
      return openGrowing({ container, listTag: 'ul', viewportHeight, emptyText: labels.empty,
        next: batches(tarNameStream(reader)), renderRow: name => element(doc, 'li', name) });
    case 'calendar': {
      container.replaceChildren();
      const head = cellsRow(doc, [labels.title, labels.start, labels.end, labels.due, labels.description], 'attachment-csv-header');
      return openGrowing({ container, viewportHeight, emptyText: labels.empty, header: head, className: 'attachment-preview-csv',
        next: batches(calendarStream(reader)),
        // parseICalendar puts a VEVENT in the list "Events" and gives it its
        // DTEND as date_due; a VTODO's date_due is its DUE and date_end its
        // completion.
        renderRow: task => {
          const isEvent = task.column_name === 'Events';
          return cellsRow(doc, [task.title, localDate(task.date_started),
            isEvent ? localDate(task.date_due) : localDate(task.date_end),
            isEvent ? '' : localDate(task.date_due), task.description || '']);
        } });
    }
    case 'opendocument':
    case 'outlook':
      return openRecords({ container, url, signal, fetchImpl, labels, viewportHeight });
    default:
      throw new TypeError(`No viewer for ${rich}`);
  }
}
