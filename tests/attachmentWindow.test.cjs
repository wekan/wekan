'use strict';
// The attachment slideshow's windowed reading (client/lib/attachmentWindow.js):
// only what is on the screen is fetched (HTTP Range) and only that is in the
// page; the scrollbar is the whole file. In jsdom, with a fake server that
// answers ranges and counts what it sent.
// Run: node --test tests/attachmentWindow.test.cjs
const test = require('node:test');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');

const dom = new JSDOM('<!doctype html><body></body>');
const doc = dom.window.document;

let w;
test.before(async () => { w = await import('../client/lib/attachmentWindow.js'); });

const { rangeServer: server } = require('./lib/rangeServer.cjs');

const enc = s => new TextEncoder().encode(s);

test('rows: forwards, backwards and from any byte they are the same rows, and no character is split', async () => {
  let seed = 3;
  const rand = n => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed % n; };
  const words = ['a', 'bb', 'ccc ', 'é', '日本', '😀', '\n', '\n', 'x'.repeat(700), '\r\n'];
  let text = '';
  while (text.length < 60000) text += words[rand(words.length)];
  text += 'y'.repeat(9000); // one line longer than a row
  const bytes = enc(text);
  const { fetchImpl } = server(bytes);
  const reader = new w.RangeReader('/f', bytes.length, { fetchImpl });
  const rows = new w.ByteRows(reader);
  const forward = await rows.rowsFrom(0, Infinity);
  assert.equal(forward[0].start, 0);
  for (let i = 1; i < forward.length; i += 1) assert.equal(forward[i].start, forward[i - 1].end, 'rows are contiguous');
  assert.equal(forward[forward.length - 1].end, bytes.length);
  assert.ok(forward.every(r => r.end - r.start <= w.MAX_ROW_BYTES), 'no row is longer than MAX_ROW_BYTES');
  assert.ok(forward.every(r => !r.text.includes('�')), 'no UTF-8 character is split between rows');
  // The rows put back together are the text, newlines where the file had them.
  let rebuilt = '';
  for (const r of forward) {
    const ended = bytes[r.end - 1] === 10;
    rebuilt += r.text + (ended ? '\n' : '');
  }
  assert.equal(rebuilt, text.replace(/\r\n/g, '\n'));
  const backward = [];
  for (let row = await rows.rowContaining(bytes.length - 1); row; row = await rows.rowBefore(row.start)) backward.unshift(row);
  assert.deepEqual(backward.map(r => [r.start, r.end]), forward.map(r => [r.start, r.end]), 'backwards: the same rows');
  for (let k = 0; k < 300; k += 1) {
    const b = rand(bytes.length);
    const row = await rows.rowContaining(b);
    assert.ok(row.start <= b && b < row.end, `byte ${b} is in its row`);
    assert.ok(forward.some(r => r.start === row.start && r.end === row.end));
  }
});

test('reading: a window in the middle of a large file fetches only its chunks, and keeps a bounded cache', async () => {
  const size = 50 * 1024 * 1024;
  const bytes = new Uint8Array(size).fill(65);
  for (let i = 99; i < size; i += 100) bytes[i] = 10;
  const { fetchImpl, log } = server(bytes);
  const reader = new w.RangeReader('/big', size, { fetchImpl });
  const rows = new w.ByteRows(reader);
  const row = await rows.rowContaining(size / 2);
  await rows.rowsFrom(row.start, 50);
  assert.ok(log.requests <= 2, `${log.requests} requests`);
  assert.ok(log.sent <= 2 * w.CHUNK_BYTES, `${log.sent} bytes sent of ${size}`);
  for (let i = 0; i < 40; i += 1) await reader.chunk(i * 10);
  assert.ok(reader.cache.size <= w.CACHE_CHUNKS, 'the cache stays bounded');
});

test('negative: a server that ignores Range is read only up to the bytes wanted, then cancelled', async () => {
  const bytes = new Uint8Array(20 * 1024 * 1024).fill(66);
  const { fetchImpl, log } = server(bytes, { ignoreRange: true });
  const reader = new w.RangeReader('/legacy', bytes.length, { fetchImpl });
  const got = await reader.bytes(0, 1000);
  assert.equal(got.length, 1000);
  assert.ok(log.sent < 2 * w.CHUNK_BYTES + 65536, `only the start was read (${log.sent} bytes)`);
});

test('the size comes from the server when the document does not say it', async () => {
  const bytes = enc('hello\nworld\n');
  const { fetchImpl } = server(bytes);
  const reader = new w.RangeReader('/f', 0, { fetchImpl });
  assert.equal(await reader.probeSize(), bytes.length);
});

function rendered(viewport) {
  return [...viewport.children].map(c => c.textContent);
}

test('the scrollbar is the file: the top, a jump to the middle, a few rows down, the end - only visible rows in the page', async () => {
  const lines = Array.from({ length: 200000 }, (_, i) => `line ${i}`);
  const bytes = enc(`${lines.join('\n')}\n`);
  const { fetchImpl, log } = server(bytes);
  const reader = new w.RangeReader('/f', bytes.length, { fetchImpl });
  const container = doc.createElement('div');
  const view = new w.WindowView(container, { rows: new w.ByteRows(reader), size: bytes.length, viewportHeight: 200, rowPx: 20,
    renderRows: (rows, viewport) => viewport.replaceChildren(...rows.map(r => { const d = doc.createElement('div'); d.textContent = r.text; return d; })) });
  await view.start();
  assert.deepEqual(rendered(view.viewport).slice(0, 2), ['line 0', 'line 1']);
  assert.equal(view.viewport.children.length, view.visibleCount(), 'only the visible rows are drawn');
  assert.ok(view.maxScroll > 1000000, 'the scrollbar is as long as the whole file');

  view.scroller.scrollTop = Math.floor(view.maxScroll / 2);
  await view.update();
  const middle = Number(rendered(view.viewport)[0].replace('line ', ''));
  // The scrollbar is the file's bytes: its middle is the line that holds the middle byte.
  const half = new TextDecoder().decode(bytes.subarray(0, Math.floor(bytes.length / 2))).split('\n').length - 1;
  assert.ok(Math.abs(middle - half) <= 1, `dragged to the middle it shows the middle byte's line (${middle}, ${half})`);

  view.scroller.scrollTop += 60; // three rows of 20 px
  await view.update();
  assert.equal(Number(rendered(view.viewport)[0].replace('line ', '')), middle + 3, 'a small scroll moves row by row');
  view.scroller.scrollTop -= 20;
  await view.update();
  assert.equal(Number(rendered(view.viewport)[0].replace('line ', '')), middle + 2);

  view.scroller.scrollTop = view.maxScroll;
  await view.update();
  assert.equal(rendered(view.viewport).filter(Boolean).pop(), 'line 199999', 'the end of the scrollbar is the end of the file');
  assert.ok(log.sent < bytes.length / 3, `only the windows were fetched (${log.sent} of ${bytes.length} bytes)`);
  view.destroy();
  assert.equal(container.children.length, 0);
});

test('a file of one chunk is indexed exactly', async () => {
  const lines = Array.from({ length: 300 }, (_, i) => `r${i}`);
  const bytes = enc(lines.join('\n'));
  const all = await w.splitRows(bytes);
  assert.equal(all.length, 300);
  const container = doc.createElement('div');
  const view = new w.WindowView(container, { all, size: bytes.length, viewportHeight: 100, rowPx: 10,
    renderRows: (rows, viewport) => viewport.replaceChildren(...rows.map(r => { const d = doc.createElement('div'); d.textContent = r.text; return d; })) });
  await view.start();
  view.scroller.scrollTop = 1500;
  await view.update();
  assert.equal(rendered(view.viewport)[0], 'r150');
  assert.equal(view.viewport.children.length, view.visibleCount());
});

test('infinite scroll: rows are read only as far as they are scrolled to, and only the visible ones are drawn', async () => {
  let produced = 0;
  const next = async () => {
    if (produced >= 100000) return null;
    const rows = Array.from({ length: 100 }, () => `n${produced++}`);
    return rows;
  };
  const container = doc.createElement('div');
  const view = new w.GrowingView(container, { next, viewportHeight: 200, rowPx: 20, batch: 2,
    renderRow: name => { const li = doc.createElement('li'); li.textContent = name; return li; } });
  await view.start();
  assert.ok(produced <= 200, `only the first rows were read (${produced})`);
  assert.equal(view.list.children[0].textContent, 'n0');
  assert.ok(view.list.children.length <= 13, 'only the visible rows are drawn');
  view.scroller.scrollTop = 20 * 5000;
  await view.update();
  assert.equal(view.list.children[0].textContent, 'n5000');
  assert.ok(produced >= 5000 && produced <= 5300, `read on as far as scrolled (${produced})`);
  assert.ok(view.list.children.length <= 13);
  view.destroy();
});
