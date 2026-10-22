'use strict';

// An import or export that throws is recorded as the user's ATTEMPT only when
// the transfer boundary itself refused it - a cycle, a non-plain object, a size
// limit. Anything else is the code failing. sanitize-html 2.18.0 threw
// RangeError on nested <iframe> inside secureTransfer, and every throw there was
// recorded as a high "blocked" event naming the user, which disabled the
// account: a card planted with the payload locked out the next member who
// exported the board. A throw that is not the boundary's refusal is recorded as
// detected now, and never blocks anybody.
// Run: node tests/transferFailure.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const { isTransferBoundaryError, transferFailureEvent } = require('../models/lib/transferFailure.cjs');
const { categoryFor } = require('../models/lib/securityCategories.js');

const boundary = {};
new Function('exports', read('models/lib/importExportBoundary.js')
  .replace(/export \{ sanitizeTransferValue, neutralizeSpreadsheetFormula, BLOCKED_KEYS \};/,
    'exports.sanitizeTransferValue = sanitizeTransferValue;'))(boundary);

// server/lib/blockOnSecurityEvent.js's own decision, run as it is.
const shouldBlockAccount = new Function('categoryFor', `${read('server/lib/blockOnSecurityEvent.js')
  .match(/const BLOCKING_ACTIONS[\s\S]*?\nexport function shouldBlockAccount[\s\S]*?\n\}/)[0]
  .replace('export function', 'function')}; return shouldBlockAccount;`)(categoryFor);

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

function thrown(fn) {
  try { fn(); } catch (error) { return error; }
  throw new Error('expected a throw');
}
const context = { direction: 'export', source: 'export:wekan', userId: 'member-1' };

test("the boundary's own refusals are attempts: a cycle and a non-plain object are high", () => {
  const cycle = {}; cycle.self = cycle;
  for (const error of [
    thrown(() => boundary.sanitizeTransferValue(cycle)),
    thrown(() => boundary.sanitizeTransferValue({ when: new Map() })),
  ]) {
    assert.ok(isTransferBoundaryError(error), error.message);
    const event = transferFailureEvent(error, context);
    assert.strictEqual(event.action, 'blocked');
    assert.strictEqual(event.severity, 'high');
    assert.strictEqual(event.bleed, 'ImportExportValidation');
    assert.strictEqual(shouldBlockAccount(event), true, 'an attempt still disables the account');
  }
});

test('a size limit, which a large real board also reaches, is medium and blocks nobody', () => {
  for (const error of [
    thrown(() => boundary.sanitizeTransferValue({ a: [1, 2, 3] }, { maxNodes: 2 })),
    thrown(() => boundary.sanitizeTransferValue([[[[1]]]], { maxDepth: 2 })),
    thrown(() => boundary.sanitizeTransferValue({ s: 'x'.repeat(20) }, { maxString: 10 })),
    thrown(() => boundary.sanitizeTransferValue({ a: [1, 2, 3] }, { maxArray: 2 })),
  ]) {
    const event = transferFailureEvent(error, context);
    assert.strictEqual(error.kind, 'limit', error.message);
    assert.strictEqual(event.action, 'blocked');
    assert.strictEqual(event.severity, 'medium');
    assert.strictEqual(shouldBlockAccount(event), false);
  }
});

test('negative: a sanitizer that throws is the code failing, and never locks the user out', () => {
  // sanitize-html 2.18.0 on nested <iframe>.
  const crash = thrown(() => boundary.sanitizeTransferValue({ description: '<iframe>'.repeat(3) }, {
    sanitizeHtml: () => { throw new RangeError('Maximum call stack size exceeded'); },
  }));
  assert.strictEqual(isTransferBoundaryError(crash), false);
  const event = transferFailureEvent(crash, context);
  assert.strictEqual(event.action, 'detected');
  assert.strictEqual(event.blocksAccount, false);
  assert.strictEqual(event.bleed, 'ImportExportFailure');
  assert.match(event.detail, /^RangeError: Maximum call stack/);
  assert.strictEqual(event.userId, 'member-1', 'still says whose import or export it was');
  assert.strictEqual(shouldBlockAccount(event), false);
  // Any other unexpected throw, and a non-Error, are the same.
  for (const other of [new TypeError('x is undefined'), 'a string', null]) {
    assert.strictEqual(shouldBlockAccount(transferFailureEvent(other, context)), false);
  }
  // A plain Error that merely READS like a refusal is not one: only the
  // boundary's own errors are marked.
  assert.strictEqual(transferFailureEvent(new Error('Import/export cycle at /x'), context).action, 'detected');
});

test('every refusal the boundary throws is marked as its own', () => {
  const src = read('models/lib/importExportBoundary.js');
  assert.deepStrictEqual(src.match(/throw new Error\(/g) || [], [], 'the boundary throws only boundaryError(...)');
  assert.ok((src.match(/throw boundaryError\(/g) || []).length >= 6);
});

test('secureTransfer records a failure only through transferFailureEvent, and still rethrows', () => {
  const src = read('server/lib/secureTransfer.js');
  const handler = src.slice(src.indexOf('} catch (error) {'));
  assert.match(handler, /record\(transferFailureEvent\(error, context\)\)/);
  assert.doesNotMatch(handler, /action: 'blocked'/, 'no unconditional blocked record left in the catch');
  assert.match(handler, /\} catch \(e\) \{ \/\* logging must never break the guard \*\/ \}\s*throw error;/);
});

test('negative: secureTransfer is the only caller of the boundary, so no other catch can blame the user', () => {
  const callers = [];
  const walk = dir => {
    for (const e of fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true })) {
      if (['node_modules', '.npm', '_build', '.build', 'tests'].includes(e.name)) continue;
      const rel = path.join(dir, e.name);
      if (e.isDirectory()) walk(rel);
      else if (/\.(c?m?js)$/.test(e.name) && /\bsanitizeTransferValue\(/.test(read(rel))) callers.push(rel);
    }
  };
  ['client', 'server', 'models', 'imports', 'packages'].forEach(walk);
  assert.deepStrictEqual(callers.sort(), ['models/lib/importExportBoundary.js', 'server/lib/secureTransfer.js']);
});

console.log(`\n${passed} passed`);
