// The attachment slideshow's windowed reading: only what is on the screen is
// fetched, and only what is on the screen is in the page.
//
//   RangeReader   the file through HTTP Range requests (server/routes/
//                 universalFileServer.js answers them, #6745), in CHUNK_BYTES
//                 pieces, of which at most CACHE_CHUNKS are kept: a file of any
//                 size costs a few megabytes. A server that answers a range with
//                 the whole file (a legacy CollectionFS attachment) is read as a
//                 stream up to the bytes wanted, and the rest is not downloaded.
//   ByteRows      the display rows of a text file, from ANY byte: a row ends at
//                 a newline, or at the next multiple of MAX_ROW_BYTES of the
//                 file, so a row is found the same way forwards, backwards and
//                 from a byte in its middle, and a 50 MB line of minified JSON
//                 is many rows rather than one. No row splits a UTF-8 character.
//   WindowView    a scroll area whose scrollbar is the whole file: dragged to
//                 the middle it shows the middle (the byte at that fraction of
//                 the file), scrolled a little it moves row by row. A file that
//                 fits in one chunk is indexed exactly. Only the visible rows are
//                 in the DOM.
//   GrowingView   for what can only be read from the start (a compressed tar, a
//                 calendar, an OpenDocument's text): rows are read as they are
//                 scrolled to - infinite scroll downwards - and only the visible
//                 ones are in the DOM.
//
// Pure except for the DOM the views draw into: tests/attachmentWindow.test.cjs
// drives all of it in jsdom with a fake fetch.

export const CHUNK_BYTES = 256 * 1024;
export const CACHE_CHUNKS = 16;
export const MAX_ROW_BYTES = 4096;
// Browsers stop scrolling an element somewhere above ten million pixels.
const MAX_SCROLL_PX = 8000000;
const DEFAULT_ROW_PX = 20;

const NEWLINE = 10;
const isContinuation = b => (b & 0xc0) === 0x80;

// --- reading ----------------------------------------------------------------

async function readUntil(response, from, to, signal) {
  // A 200 answer to a Range request: the whole file follows. Read it only up
  // to `to`, skipping `from` bytes, and cancel the rest.
  const reader = response.body.getReader();
  const out = new Uint8Array(to - from);
  let at = 0;
  let filled = 0;
  try {
    while (filled < out.length) {
      if (signal && signal.aborted) throw new DOMException('Aborted', 'AbortError');
      const { done, value } = await reader.read();
      if (done) break;
      const lo = Math.max(from - at, 0);
      const hi = Math.min(value.length, to - at);
      if (hi > lo) { out.set(value.subarray(lo, hi), filled); filled += hi - lo; }
      at += value.length;
    }
  } finally {
    await reader.cancel().catch(() => {});
  }
  return out.subarray(0, filled);
}

export class RangeReader {
  constructor(url, size, { signal, fetchImpl } = {}) {
    this.url = url;
    this.size = Number(size) || 0;
    this.signal = signal;
    this.fetch = fetchImpl || ((...a) => fetch(...a));
    this.cache = new Map();
    this.requests = 0;
  }

  // The size from the server when the document did not say: a one-byte range
  // answers it in Content-Range.
  async probeSize() {
    if (this.size > 0) return this.size;
    const response = await this.fetch(this.url, { credentials: 'same-origin', signal: this.signal,
      headers: { Range: 'bytes=0-0' } });
    if (!response.ok) throw new Error(`Attachment fetch failed: ${response.status}`);
    const total = /\/(\d+)$/.exec(response.headers.get('content-range') || '');
    this.size = total ? Number(total[1]) : Number(response.headers.get('content-length')) || 0;
    if (response.body) await response.body.cancel().catch(() => {});
    return this.size;
  }

  async chunk(index) {
    if (this.cache.has(index)) {
      const bytes = this.cache.get(index);
      this.cache.delete(index);
      this.cache.set(index, bytes); // most recently used last
      return bytes;
    }
    const start = index * CHUNK_BYTES;
    const end = Math.min(this.size, start + CHUNK_BYTES);
    this.requests += 1;
    const response = await this.fetch(this.url, { credentials: 'same-origin', signal: this.signal,
      headers: { Range: `bytes=${start}-${end - 1}` } });
    if (!response.ok) throw new Error(`Attachment fetch failed: ${response.status}`);
    let bytes;
    if (response.status === 206) {
      bytes = new Uint8Array(await response.arrayBuffer());
      if (bytes.length > end - start) bytes = bytes.subarray(0, end - start);
    } else {
      bytes = await readUntil(response, start, end, this.signal);
    }
    this.cache.set(index, bytes);
    while (this.cache.size > CACHE_CHUNKS) this.cache.delete(this.cache.keys().next().value);
    return bytes;
  }

  // Bytes [start, end) of the file, clamped to it.
  async bytes(start, end) {
    start = Math.max(0, start);
    end = Math.min(this.size, end);
    if (end <= start) return new Uint8Array(0);
    const first = Math.floor(start / CHUNK_BYTES);
    const last = Math.floor((end - 1) / CHUNK_BYTES);
    if (first === last) {
      const c = await this.chunk(first);
      return c.subarray(start - first * CHUNK_BYTES, end - first * CHUNK_BYTES);
    }
    const out = new Uint8Array(end - start);
    let filled = 0;
    for (let i = first; i <= last; i += 1) {
      const c = await this.chunk(i);
      const lo = i === first ? start - first * CHUNK_BYTES : 0;
      const hi = i === last ? end - last * CHUNK_BYTES : c.length;
      out.set(c.subarray(lo, hi), filled);
      filled += hi - lo;
    }
    return out.subarray(0, filled);
  }

  // The file as a stream of chunks from `start`, for the formats read in order.
  async *stream(start = 0, end = this.size) {
    for (let at = start; at < end; at += CHUNK_BYTES) {
      const bytes = await this.bytes(at, Math.min(end, at + CHUNK_BYTES));
      if (!bytes.length) return;
      yield bytes;
    }
  }
}

// --- rows of text -----------------------------------------------------------

const decoder = new TextDecoder('utf-8');

export class ByteRows {
  constructor(reader, size = reader.size) {
    this.reader = reader;
    this.size = size;
  }

  // The row that starts at `start` (a row start): { start, end, text }.
  async rowAt(start) {
    if (start >= this.size) return null;
    const limit = Math.min(this.size, (Math.floor(start / MAX_ROW_BYTES) + 1) * MAX_ROW_BYTES);
    const bytes = await this.reader.bytes(start, Math.min(this.size, limit + 3));
    const nl = bytes.subarray(0, limit - start).indexOf(NEWLINE);
    const end = nl >= 0 ? start + nl + 1 : limit;
    // A row cut at a multiple of MAX_ROW_BYTES owns the character whose lead
    // byte it holds; the next row skips that character's continuation bytes.
    let lo = 0;
    while (lo < 3 && lo < bytes.length && isContinuation(bytes[lo])) lo += 1;
    let hi = end - start;
    if (nl < 0) while (hi < bytes.length && hi < end - start + 3 && isContinuation(bytes[hi])) hi += 1;
    let text = decoder.decode(bytes.subarray(lo, hi));
    if (text.endsWith('\n')) text = text.slice(0, -1);
    if (text.endsWith('\r')) text = text.slice(0, -1);
    return { start, end, text };
  }

  // The start of the row that holds byte `b`.
  async startOf(b) {
    const lo = Math.floor(b / MAX_ROW_BYTES) * MAX_ROW_BYTES;
    const bytes = await this.reader.bytes(lo, b);
    const nl = bytes.lastIndexOf(NEWLINE);
    return nl >= 0 ? lo + nl + 1 : lo;
  }

  async rowContaining(b) {
    if (this.size <= 0) return null;
    return this.rowAt(await this.startOf(Math.min(Math.max(0, b), this.size - 1)));
  }

  // The row that ends where the row at `start` begins.
  async rowBefore(start) {
    if (start <= 0) return null;
    return this.rowAt(await this.startOf(start - 1));
  }

  // `count` rows from the row at `start`.
  async rowsFrom(start, count) {
    const rows = [];
    let at = start;
    while (rows.length < count && at < this.size) {
      const row = await this.rowAt(at);
      rows.push(row);
      at = row.end;
    }
    return rows;
  }
}

// Every row of bytes that are all in memory (a file of one chunk).
export function splitRows(bytes) {
  const rows = [];
  const reader = { size: bytes.length, bytes: async (a, b) => bytes.subarray(Math.max(0, a), Math.min(bytes.length, b)) };
  const source = new ByteRows(reader, bytes.length);
  return source.rowsFrom(0, Infinity).then(found => { rows.push(...found); return rows; });
}

// --- the views ----------------------------------------------------------------

function rowHeight(probe) {
  const h = probe.getBoundingClientRect ? probe.getBoundingClientRect().height : 0;
  return h > 0 ? h : DEFAULT_ROW_PX;
}

function frame(container, className) {
  const doc = container.ownerDocument;
  const scroller = doc.createElement('div');
  scroller.className = `attachment-window ${className || ''}`.trim();
  const viewport = doc.createElement('div');
  viewport.className = 'attachment-window-viewport';
  const spacer = doc.createElement('div');
  spacer.className = 'attachment-window-spacer';
  scroller.append(viewport, spacer);
  container.appendChild(scroller);
  return { doc, scroller, viewport, spacer };
}

// A scroll area over a text file of any size. renderRows(rows, viewport) draws
// the visible rows; header(viewport) may pin something above them.
export class WindowView {
  constructor(container, { rows, all = null, size, renderRows, className, viewportHeight, rowPx }) {
    Object.assign(this, frame(container, className));
    this.source = rows;
    this.all = all; // every row, when the file is one chunk: exact scrolling
    this.size = size;
    this.renderRows = renderRows;
    this.top = null;
    this.topIndex = 0;
    this.lastScroll = 0;
    this.carry = 0;
    this.generation = 0;
    this.fixedViewport = viewportHeight;
    const probe = this.doc.createElement('div');
    probe.className = 'attachment-window-row';
    probe.textContent = 'M';
    this.viewport.appendChild(probe);
    this.rowPx = rowPx || rowHeight(probe);
    probe.remove();
    this.onScroll = () => { this.update().catch(() => {}); };
    this.scroller.addEventListener('scroll', this.onScroll, { passive: true });
  }

  visibleCount() {
    const h = this.fixedViewport || this.scroller.clientHeight || 600;
    return Math.ceil(h / this.rowPx) + 1;
  }

  layout() {
    const viewportPx = this.visibleCount() * this.rowPx;
    let total;
    if (this.all) total = this.all.length * this.rowPx;
    else {
      // Rows estimated from the bytes per row seen so far.
      const perRow = Math.max(8, this.bytesPerRow || 80);
      total = Math.min(MAX_SCROLL_PX, Math.ceil(this.size / perRow) * this.rowPx);
    }
    this.spacer.style.height = `${Math.max(0, total - viewportPx)}px`;
    this.maxScroll = Math.max(0, total - viewportPx);
  }

  async start() {
    const n = this.visibleCount();
    if (this.all) {
      this.layout();
      this.draw(this.all.slice(0, n));
      return;
    }
    const rows = await this.source.rowsFrom(0, n);
    this.top = rows[0] || null;
    if (rows.length) this.bytesPerRow = (rows[rows.length - 1].end) / rows.length;
    this.layout();
    this.draw(rows);
  }

  draw(rows) {
    this.visible = rows;
    this.renderRows(rows, this.viewport);
  }

  async update() {
    const generation = ++this.generation;
    const scrollTop = this.scroller.scrollTop;
    const n = this.visibleCount();
    if (this.all) {
      this.topIndex = Math.min(Math.max(0, this.all.length - n + 1), Math.floor(scrollTop / this.rowPx));
      this.draw(this.all.slice(this.topIndex, this.topIndex + n));
      return;
    }
    const delta = scrollTop - this.lastScroll;
    this.lastScroll = scrollTop;
    const page = n * this.rowPx;
    let top = this.top;
    if (scrollTop <= 0) {
      top = await this.source.rowAt(0);
      this.carry = 0;
    } else if (scrollTop >= this.maxScroll - 1) {
      // The end of the scrollbar is the end of the file.
      let row = await this.source.rowContaining(this.size - 1);
      for (let i = 1; i < n - 1 && row && row.start > 0; i += 1) row = await this.source.rowBefore(row.start);
      top = row;
      this.carry = 0;
    } else if (Math.abs(delta) <= 2 * page && top) {
      // A small scroll moves row by row.
      const exact = (delta + this.carry) / this.rowPx;
      const steps = Math.trunc(exact);
      this.carry = (exact - steps) * this.rowPx;
      for (let i = 0; i < Math.abs(steps) && top; i += 1) {
        const next = steps > 0 ? (top.end < this.size ? await this.source.rowAt(top.end) : null)
          : await this.source.rowBefore(top.start);
        if (!next) break;
        top = next;
      }
    } else {
      // A jump: the byte at the scrollbar's fraction of the file.
      const fraction = this.maxScroll ? scrollTop / this.maxScroll : 0;
      top = await this.source.rowContaining(Math.floor(fraction * this.size));
      this.carry = 0;
    }
    if (generation !== this.generation || !top) return;
    this.top = top;
    this.draw(await this.source.rowsFrom(top.start, n));
  }

  destroy() {
    this.generation += 1;
    this.scroller.removeEventListener('scroll', this.onScroll);
    this.scroller.remove();
  }
}

// Rows read in order as they are scrolled to. next() resolves to the next
// rows, or null at the end. renderRow(row, index) returns an element.
export class GrowingView {
  constructor(container, { next, renderRow, className, listTag = 'div', viewportHeight, rowPx, batch = 4 }) {
    Object.assign(this, frame(container, className));
    this.list = this.doc.createElement(listTag);
    this.list.className = 'attachment-window-list';
    this.viewport.appendChild(this.list);
    this.next = next;
    this.renderRow = renderRow;
    this.rows = [];
    this.heights = [];
    this.done = false;
    this.loading = null;
    this.fixedViewport = viewportHeight;
    this.estimate = rowPx || DEFAULT_ROW_PX;
    this.batch = batch;
    this.onScroll = () => { this.update().catch(() => {}); };
    this.scroller.addEventListener('scroll', this.onScroll, { passive: true });
  }

  viewportPx() { return this.fixedViewport || this.scroller.clientHeight || 600; }

  heightOf(i) { return this.heights[i] || this.estimate; }

  async more() {
    if (this.done) return;
    if (!this.loading) {
      this.loading = (async () => {
        const got = await this.next();
        if (!got) this.done = true;
        else this.rows.push(...got);
      })().finally(() => { this.loading = null; });
    }
    await this.loading;
  }

  async start() {
    await this.update();
  }

  // The first row at or below `px`, and the pixel where it starts.
  rowAtPx(px) {
    let y = 0;
    for (let i = 0; i < this.rows.length; i += 1) {
      const h = this.heightOf(i);
      if (y + h > px) return [i, y];
      y += h;
    }
    return [this.rows.length, y];
  }

  totalPx() {
    let y = 0;
    for (let i = 0; i < this.rows.length; i += 1) y += this.heightOf(i);
    return y;
  }

  async update() {
    const scrollTop = this.scroller.scrollTop;
    const want = scrollTop + this.viewportPx() * (1 + this.batch);
    // Infinite scroll: read on while what is read does not reach past the view.
    while (!this.done && this.totalPx() < want) await this.more();
    const [first, y] = this.rowAtPx(scrollTop);
    const end = Math.min(this.rows.length, first + Math.ceil(this.viewportPx() / this.estimate) + 2);
    const items = [];
    for (let i = first; i < end; i += 1) items.push(this.renderRow(this.rows[i], i));
    this.list.replaceChildren(...items);
    // Measure what was drawn, for the rows' positions next time.
    items.forEach((el, k) => {
      const h = el.getBoundingClientRect ? el.getBoundingClientRect().height : 0;
      if (h > 0) this.heights[first + k] = h;
    });
    // The first drawn row may begin above the view: shift it up by that much.
    this.list.style.transform = `translateY(${y - scrollTop}px)`;
    this.spacer.style.height = `${Math.max(0, this.totalPx() - this.viewportPx())}px`;
    this.visible = items;
  }

  destroy() {
    this.done = true;
    this.scroller.removeEventListener('scroll', this.onScroll);
    this.scroller.remove();
  }
}

// A scroll area over rows whose number is known and that are fetched by their
// index (a converted preview, attachmentRecords.js): the scrollbar is exactly
// the rows, and only the visible ones are fetched and drawn.
// rowsAt(first, count) resolves to the rows [first, first + count).
export class IndexedView {
  constructor(container, { count, rowsAt, renderRows, className, viewportHeight, rowPx }) {
    Object.assign(this, frame(container, className));
    this.count = count;
    this.rowsAt = rowsAt;
    this.renderRows = renderRows;
    this.fixedViewport = viewportHeight;
    this.generation = 0;
    const probe = this.doc.createElement('div');
    probe.className = 'attachment-window-row';
    probe.textContent = 'M';
    this.viewport.appendChild(probe);
    this.rowPx = rowPx || rowHeight(probe);
    probe.remove();
    this.onScroll = () => { this.update().catch(() => {}); };
    this.scroller.addEventListener('scroll', this.onScroll, { passive: true });
  }

  visibleCount() {
    const h = this.fixedViewport || this.scroller.clientHeight || 600;
    return Math.ceil(h / this.rowPx) + 1;
  }

  layout() {
    const viewportPx = this.visibleCount() * this.rowPx;
    const total = Math.min(MAX_SCROLL_PX, this.count * this.rowPx);
    this.maxScroll = Math.max(0, total - viewportPx);
    this.spacer.style.height = `${this.maxScroll}px`;
  }

  // The first visible row for a scroll position: by pixels, or - for more rows
  // than a browser scrolls - by the fraction of the scrollbar.
  firstAt(scrollTop) {
    const n = this.visibleCount();
    const last = Math.max(0, this.count - n + 1);
    if (this.count * this.rowPx <= MAX_SCROLL_PX) return Math.min(last, Math.floor(scrollTop / this.rowPx));
    return Math.min(last, Math.round((this.maxScroll ? scrollTop / this.maxScroll : 0) * last));
  }

  async start() {
    this.layout();
    await this.update();
  }

  async update() {
    const generation = ++this.generation;
    const first = this.firstAt(this.scroller.scrollTop);
    const rows = await this.rowsAt(first, Math.min(this.visibleCount(), this.count - first));
    if (generation !== this.generation) return;
    this.first = first;
    this.visible = rows;
    this.renderRows(rows, this.viewport, first);
  }

  destroy() {
    this.generation += 1;
    this.scroller.removeEventListener('scroll', this.onScroll);
    this.scroller.remove();
  }
}
