'use strict';

// Unit tests for the generic hang-mitigation deadline wrapper
// (models/lib/withDeadline.js): a long/hung operation must never block forever — the
// wrapper rejects with a timeout error while letting fast operations pass through.
//
// Run: node tests/withDeadline.test.cjs

const assert = require('assert');
const { withDeadline } = require('../models/lib/withDeadline.js');

(async () => {
  let passed = 0;
  const ok = (name) => { passed += 1; console.log('  ok -', name); };

  // Resolves with the value when the promise settles before the deadline.
  assert.strictEqual(await withDeadline(Promise.resolve(42), 1000), 42);
  ok('passes through a value that settles in time');

  // Rejects with the caller's timeout error when the promise never settles.
  let err;
  try { await withDeadline(new Promise(() => {}), 20, () => new Error('op-timeout')); }
  catch (e) { err = e; }
  assert.ok(err && err.message === 'op-timeout', 'uses onTimeout() error');
  ok('rejects with the custom timeout error when it hangs');

  // A default timeout error is used when no onTimeout is given.
  err = null;
  try { await withDeadline(new Promise(() => {}), 20); }
  catch (e) { err = e; }
  assert.ok(err && /timeout/i.test(err.message), 'has a default timeout error');
  ok('has a default timeout error');

  // The promise's own rejection propagates (not masked by the deadline).
  err = null;
  try { await withDeadline(Promise.reject(new Error('boom')), 1000); }
  catch (e) { err = e; }
  assert.strictEqual(err.message, 'boom');
  ok('propagates the underlying rejection');

  // ms <= 0 means "no deadline": just awaits the promise.
  assert.strictEqual(await withDeadline(Promise.resolve('x'), 0), 'x');
  assert.strictEqual(await withDeadline(Promise.resolve('y'), -5), 'y');
  ok('treats a non-positive deadline as no deadline');

  console.log(`\nwithDeadline: ${passed} tests passed`);
})().catch(e => { console.error('FAIL', e); process.exit(1); });
