'use strict';

// Unit + negative tests for the i18n loader helpers (imports/i18n/loadHelpers.js),
// the robustness guards behind #6503 (a hung/failed dynamic language import must
// never leave i18n permanently stuck on raw keys).
// Run: node tests/i18nLoadHelpers.test.cjs

const assert = require('assert');
const {
  unwrapI18nModule,
  promiseWithTimeout,
} = require('../imports/i18n/loadHelpers');

let passed = 0;
const pending = [];
function check(name, fn) {
  pending.push(
    Promise.resolve().then(fn).then(() => { passed += 1; console.log('  ok -', name); }),
  );
}

// ── unwrapI18nModule ────────────────────────────────────────────────────────
check('unwraps a real ES-module namespace (__esModule)', () => {
  const ns = { __esModule: true, default: { hello: 'Hello' } };
  assert.deepStrictEqual(unwrapI18nModule(ns), { hello: 'Hello' });
});
check('unwraps a Symbol.toStringTag "Module" namespace', () => {
  const ns = { default: { a: '1' } };
  Object.defineProperty(ns, Symbol.toStringTag, { value: 'Module' });
  assert.deepStrictEqual(unwrapI18nModule(ns), { a: '1' });
});
check('#5756 trap: does NOT unwrap a plain object that merely has a "default" key', () => {
  // Real translation data contains a literal key named "default".
  const data = { default: 'Default', hello: 'Hello' };
  assert.deepStrictEqual(unwrapI18nModule(data), data, 'must return the object unchanged');
});
check('returns non-namespace values unchanged (plain object / null / undefined)', () => {
  const plain = { x: 'y' };
  assert.strictEqual(unwrapI18nModule(plain), plain);
  assert.strictEqual(unwrapI18nModule(null), null);
  assert.strictEqual(unwrapI18nModule(undefined), undefined);
});
check('does not unwrap when default is not an object', () => {
  const ns = { __esModule: true, default: 'nope' };
  assert.deepStrictEqual(unwrapI18nModule(ns), ns);
});

// ── promiseWithTimeout ──────────────────────────────────────────────────────
check('resolves with the value when the promise settles in time', async () => {
  const v = await promiseWithTimeout(Promise.resolve(42), 1000);
  assert.strictEqual(v, 42);
});
check('rejects with the original error when the promise rejects in time', async () => {
  await assert.rejects(
    () => promiseWithTimeout(Promise.reject(new Error('boom')), 1000),
    /boom/,
  );
});
check('#6503: REJECTS (does not hang) when the promise never settles', async () => {
  const neverSettles = new Promise(() => {}); // simulates a hung dynamic import()
  await assert.rejects(
    () => promiseWithTimeout(neverSettles, 20, 'timed out'),
    /timed out/,
    'a hung load must time out so the caller can fall back to bundled English',
  );
});
check('a value that settles just before the timeout still wins over the timeout', async () => {
  const slow = new Promise(resolve => setTimeout(() => resolve('ok'), 5));
  const v = await promiseWithTimeout(slow, 200);
  assert.strictEqual(v, 'ok');
});

// ── source guard: init() no longer blocks readiness on the dynamic load ─────
check('tap.js init registers bundled English and always sets ready (source guard)', () => {
  const fs = require('fs');
  const path = require('path');
  const src = fs.readFileSync(path.join(__dirname, '..', 'imports', 'i18n', 'tap.js'), 'utf8');
  assert.ok(/import enData from '\.\/data\/en\.i18n\.json'/.test(src),
    'the default English must be statically imported');
  assert.ok(/promiseWithTimeout\(\s*TAPi18n\.loadLanguage\(DEFAULT_LANGUAGE\)/.test(src),
    'the default dynamic load must be bounded by a timeout');
  // ready.set(true) must sit OUTSIDE the try, after the catch, so every path reaches it.
  const idx = src.indexOf('this.ready.set(true);');
  const catchIdx = src.lastIndexOf('} catch (e) {', idx);
  assert.ok(idx > -1 && catchIdx > -1 && idx > catchIdx,
    'ready.set(true) must run after the try/catch (reached in every path)');
});

Promise.all(pending).then(() => {
  console.log(`\ni18nLoadHelpers: ${passed} checks passed`);
}).catch(err => {
  console.error('FAILED:', err && err.message);
  process.exit(1);
});
