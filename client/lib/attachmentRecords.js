// The slideshow's reader of a converted preview (server/lib/
// attachmentPreviewStore.js): an attachment whose content is scattered
// through it - an Outlook .msg, an OpenDocument - is converted once on the
// server into rows, and read here a screenful at a time through HTTP Range
// requests: the index entries of the visible rows, then those rows.
//
//   <link>/preview-meta    { kind, count, truncated }
//   <link>/preview-index   (count + 1) little-endian uint64 offsets
//   <link>/preview-rows    one JSON object a line
//
// (Two path segments: Meteor-Files takes every longer path under /cdn/storage.)

export const MAX_CACHED_ROWS = 5000;

async function ranged(fetchImpl, url, start, end, signal) {
  const response = await fetchImpl(url, { credentials: 'same-origin', signal, headers: { Range: `bytes=${start}-${end - 1}` } });
  if (!response.ok) throw new Error(`Attachment preview fetch failed: ${response.status}`);
  let bytes = new Uint8Array(await response.arrayBuffer());
  // A whole answer to a range request: take the range from it.
  if (response.status === 200) bytes = bytes.subarray(start, end);
  return bytes;
}

export class PreviewRecords {
  constructor(url, { signal, fetchImpl } = {}) {
    this.base = String(url).split(/[?#]/)[0].replace(/\/$/, '');
    this.signal = signal;
    this.fetch = fetchImpl || ((...a) => fetch(...a));
    this.cache = new Map();
    this.requests = 0;
  }

  async open() {
    this.requests += 1;
    const response = await this.fetch(`${this.base}/preview-meta`, { credentials: 'same-origin', signal: this.signal });
    if (!response.ok) throw new Error(`Attachment preview failed: ${response.status}`);
    this.meta = await response.json();
    this.count = Number(this.meta.count) || 0;
    return this;
  }

  // Rows [first, first + count), from the cache or in two requests.
  async rowsAt(first, count) {
    const end = Math.min(this.count, first + count);
    if (end <= first) return [];
    const missing = [];
    for (let i = first; i < end; i += 1) if (!this.cache.has(i)) missing.push(i);
    if (missing.length) {
      const a = missing[0];
      const b = missing[missing.length - 1] + 1;
      this.requests += 2;
      const index = await ranged(this.fetch, `${this.base}/preview-index`, a * 8, (b + 1) * 8, this.signal);
      const view = new DataView(index.buffer, index.byteOffset, index.byteLength);
      const offsets = [];
      for (let i = 0; i + 8 <= index.length; i += 8) offsets.push(Number(view.getBigUint64(i, true)));
      if (offsets.length < b - a + 1) throw new Error('The attachment preview is damaged: its index is short');
      const body = await ranged(this.fetch, `${this.base}/preview-rows`, offsets[0], offsets[offsets.length - 1], this.signal);
      const decoder = new TextDecoder('utf-8');
      for (let i = a; i < b; i += 1) {
        const line = decoder.decode(body.subarray(offsets[i - a] - offsets[0], offsets[i - a + 1] - offsets[0])).trim();
        let row;
        try { row = JSON.parse(line); } catch (e) { row = { k: 'text', v: line }; }
        this.cache.set(i, row);
      }
      while (this.cache.size > MAX_CACHED_ROWS) this.cache.delete(this.cache.keys().next().value);
    }
    const rows = [];
    for (let i = first; i < end; i += 1) rows.push(this.cache.get(i));
    return rows;
  }
}
