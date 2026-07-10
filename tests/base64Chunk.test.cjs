'use strict';

// Plain-Node unit test (no Meteor) for the streaming base64 chunker used by the
// JSON board export (Exporter.buildStream). Run: node tests/base64Chunk.test.cjs
//
// The export streams an attachment's bytes into the JSON as base64 without
// buffering the whole file. Correctness property: feeding the bytes through
// encodeAligned() in ANY chunk sizes, concatenating the emitted pieces and then
// encodeFinal(leftover), must equal base64-encoding the whole buffer at once —
// otherwise a large attachment would export as corrupt base64.

const assert = require('assert');
const { encodeAligned, encodeFinal } = require('../models/lib/base64Chunk');

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

// Run `full` through the chunker split at the given boundary sizes.
function streamEncode(full, sizes) {
  let leftover = Buffer.alloc(0);
  let out = '';
  let pos = 0;
  for (const n of sizes) {
    const chunk = full.subarray(pos, pos + n);
    pos += n;
    const r = encodeAligned(leftover, chunk);
    leftover = r.leftover;
    out += r.piece;
  }
  // any remaining bytes not covered by sizes
  if (pos < full.length) {
    const r = encodeAligned(leftover, full.subarray(pos));
    leftover = r.leftover;
    out += r.piece;
  }
  out += encodeFinal(leftover);
  return out;
}

// Deterministic pseudo-random bytes (no Math.random, for reproducibility).
function bytes(len, seed) {
  const b = Buffer.alloc(len);
  let x = seed >>> 0;
  for (let i = 0; i < len; i++) {
    x = (x * 1103515245 + 12345) & 0x7fffffff;
    b[i] = x & 0xff;
  }
  return b;
}

// --- POSITIVE: reconstruction is exact regardless of chunk boundaries -------
test('empty input -> empty base64', () => {
  assert.strictEqual(streamEncode(Buffer.alloc(0), []), '');
});

test('every length 0..50, one chunk, matches Buffer.toString(base64)', () => {
  for (let len = 0; len <= 50; len++) {
    const full = bytes(len, len + 1);
    assert.strictEqual(streamEncode(full, [len]), full.toString('base64'), `len ${len}`);
  }
});

test('byte-at-a-time chunking matches whole-buffer base64', () => {
  const full = bytes(64, 7);
  assert.strictEqual(streamEncode(full, Array(64).fill(1)), full.toString('base64'));
});

test('unaligned chunk sizes (1,2,4,5,7,...) match whole-buffer base64', () => {
  const full = bytes(200, 99);
  assert.strictEqual(
    streamEncode(full, [1, 2, 4, 5, 7, 11, 13, 1, 2, 3]),
    full.toString('base64'),
  );
});

test('lengths that leave 1 and 2 leftover bytes pad correctly', () => {
  // len % 3 === 1  -> tail "==",  len % 3 === 2 -> tail "="
  const one = bytes(3 * 5 + 1, 3);
  const two = bytes(3 * 5 + 2, 4);
  assert.strictEqual(streamEncode(one, [4, 4, 4, 4]), one.toString('base64'));
  assert.ok(one.toString('base64').endsWith('=='));
  assert.strictEqual(streamEncode(two, [3, 3, 3, 3, 3]), two.toString('base64'));
  assert.ok(two.toString('base64').endsWith('=') && !two.toString('base64').endsWith('=='));
});

// --- NEGATIVE / edge: aligned pieces never carry padding mid-stream ---------
test('mid-stream pieces are never padded (padding only in final tail)', () => {
  const full = bytes(100, 5);
  let leftover = Buffer.alloc(0);
  const pieces = [];
  for (let i = 0; i < full.length; i += 7) {
    const r = encodeAligned(leftover, full.subarray(i, i + 7));
    leftover = r.leftover;
    if (r.piece) pieces.push(r.piece);
    assert.ok(leftover.length <= 2, 'leftover must be 0-2 bytes');
  }
  for (const p of pieces) {
    assert.ok(!p.includes('='), 'an aligned piece must not contain padding');
    assert.strictEqual(p.length % 4, 0, 'aligned piece length is a multiple of 4');
  }
});

console.log(`\nbase64Chunk: ${passed} tests passed`);
