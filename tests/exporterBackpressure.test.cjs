'use strict';

// Regression test for #6480: the board/CSV export writers paused on socket
// backpressure with `res.once('drain', resolve); res.once('error', reject)`.
// The 'drain' listener self-removes when it fires, but the paired 'error'
// listener never does — so every backpressured write leaked one 'error' listener
// on the ServerResponse. A large export (an 11 MB board) accumulated dozens,
// tripping Node's "MaxListenersExceededWarning: 11 error listeners added to
// [ServerResponse]" and holding listeners for the life of the socket.
// writeWithBackpressure() must remove BOTH listeners once either settles.
//
// Run: node tests/exporterBackpressure.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { EventEmitter } = require('events');

let passed = 0;
function test(name, fn) {
  const r = fn();
  if (r && typeof r.then === 'function') return r.then(() => { passed += 1; console.log('  ok -', name); });
  passed += 1;
  console.log('  ok -', name);
  return Promise.resolve();
}

// Mirrors writeWithBackpressure() in models/exporter.js.
function writeWithBackpressure(res, str) {
  return new Promise((resolve, reject) => {
    if (res.write(str)) { resolve(); return; }
    const cleanup = () => {
      res.removeListener('drain', onDrain);
      res.removeListener('error', onError);
    };
    const onDrain = () => { cleanup(); resolve(); };
    const onError = err => { cleanup(); reject(err); };
    res.once('drain', onDrain);
    res.once('error', onError);
  });
}

// A fake ServerResponse whose write() reports backpressure (returns false) until
// a 'drain' is emitted — like a full socket buffer.
function fakeRes() {
  const res = new EventEmitter();
  res.setMaxListeners(10); // Node's default; the leak would trip a warning past it
  res.write = () => false;  // always backpressured, forcing the drain path
  return res;
}

console.log('exporterBackpressure:');

(async () => {

await test('no drain/error listeners remain after a backpressured write drains', async () => {
  const res = fakeRes();
  const p = writeWithBackpressure(res, 'chunk');
  assert.strictEqual(res.listenerCount('drain'), 1);
  assert.strictEqual(res.listenerCount('error'), 1);
  res.emit('drain');
  await p;
  assert.strictEqual(res.listenerCount('drain'), 0, 'drain listener removed');
  assert.strictEqual(res.listenerCount('error'), 0, 'error listener removed (this was the leak)');
});

await test('listeners never accumulate across many backpressured writes', async () => {
  const res = fakeRes();
  for (let i = 0; i < 100; i++) {
    const p = writeWithBackpressure(res, 'x');
    res.emit('drain');
    await p;
    assert.ok(res.listenerCount('error') <= 1, `error listeners leaked at write ${i}`);
    assert.ok(res.listenerCount('drain') <= 1, `drain listeners leaked at write ${i}`);
  }
  assert.strictEqual(res.listenerCount('error'), 0);
  assert.strictEqual(res.listenerCount('drain'), 0);
});

await test('a socket error rejects and still removes both listeners', async () => {
  const res = fakeRes();
  const p = writeWithBackpressure(res, 'x');
  res.emit('error', new Error('socket closed'));
  await assert.rejects(p, /socket closed/);
  assert.strictEqual(res.listenerCount('drain'), 0);
  assert.strictEqual(res.listenerCount('error'), 0);
});

await test('a write that does NOT backpressure registers no listeners at all', async () => {
  const res = fakeRes();
  res.write = () => true; // buffer has room
  await writeWithBackpressure(res, 'x');
  assert.strictEqual(res.listenerCount('drain'), 0);
  assert.strictEqual(res.listenerCount('error'), 0);
});

// Source guard: the real exporter must use the shared helper and must NOT carry
// the leaky inline `once('drain', resolve); once('error', reject)` pattern.
await test('source: exporter.js uses writeWithBackpressure and drops the leaky pattern', () => {
  const src = fs.readFileSync(path.join(__dirname, '..', 'models', 'exporter.js'), 'utf8');
  assert.ok(/export function writeWithBackpressure/.test(src), 'helper must exist');
  assert.ok(/removeListener\('drain'/.test(src) && /removeListener\('error'/.test(src),
    'helper must remove both listeners on settle');
  assert.ok(!/once\('drain',\s*resolve\)\s*;\s*res\.once\('error',\s*reject\)/.test(src),
    'the leaky inline once(drain)/once(error) pattern must be gone');
  // both writers delegate to the helper
  assert.ok((src.match(/writeWithBackpressure\(res,\s*str\)/g) || []).length >= 2,
    'both the JSON and CSV writers must delegate to the helper');
});

console.log(`\n${passed} passed`);

})();
