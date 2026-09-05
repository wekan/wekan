'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'models/lib/importExportBoundary.js'), 'utf8');
const boundary = {};
new Function('exports', source
  .replace(/export \{ sanitizeTransferValue, neutralizeSpreadsheetFormula, BLOCKED_KEYS \};/,
    'exports.sanitizeTransferValue = sanitizeTransferValue;\nexports.neutralizeSpreadsheetFormula = neutralizeSpreadsheetFormula;\nexports.BLOCKED_KEYS = BLOCKED_KEYS;'))(boundary);

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

console.log('importExportBoundary:');

test('removes prototype keys without polluting Object.prototype', () => {
  const input = JSON.parse('{"safe":1,"__proto__":{"polluted":true},"nested":{"constructor":{"x":1}}}');
  const result = boundary.sanitizeTransferValue(input);
  assert.deepStrictEqual(result.value, { safe: 1, nested: {} });
  assert.strictEqual({}.polluted, undefined);
  assert.strictEqual(result.warnings.length, 2);
});

test('never invokes accessors', () => {
  let invoked = false;
  const input = { safe: 'yes' };
  Object.defineProperty(input, 'trap', { enumerable: true, get() { invoked = true; return 'bad'; } });
  const result = boundary.sanitizeTransferValue(input);
  assert.strictEqual(invoked, false);
  assert.deepStrictEqual(result.value, { safe: 'yes' });
});

test('uses the established sanitizer for active strings', () => {
  const seen = [];
  const result = boundary.sanitizeTransferValue({
    html: '<img src=x onerror=alert(1)>hello',
    scheme: 'javascript:alert(1)',
    base64: 'YWJjZGVmZw==',
  }, { sanitizeHtml(value) { seen.push(value); return value.replace(/javascript:/i, '').replace(/<[^>]*>/g, ''); } });
  assert.deepStrictEqual(result.value, { html: 'hello', scheme: 'alert(1)', base64: 'YWJjZGVmZw==' });
  assert.strictEqual(seen.length, 2);
});

test('rejects cycles, excessive nesting and giant arrays', () => {
  const cycle = {}; cycle.self = cycle;
  assert.throws(() => boundary.sanitizeTransferValue(cycle), /cycle/);
  assert.throws(() => boundary.sanitizeTransferValue({ a: { b: 1 } }, { maxDepth: 1 }), /nesting/);
  assert.throws(() => boundary.sanitizeTransferValue([1, 2], { maxArray: 1 }), /array limit/);
});

test('normalizes invalid scalar values and strips export secrets', () => {
  const result = boundary.sanitizeTransferValue({
    ok: 2, bad: Infinity, date: new Date('invalid'), apiToken: 'do-not-export',
  }, { direction: 'export' });
  assert.deepStrictEqual(result.value, { ok: 2, bad: null, date: null });
});

test('neutralizes every spreadsheet formula prefix', () => {
  for (const value of ['=1+1', '+cmd', '-2+3', '@SUM(A1)', '\t=1', '\r=1', '\n=1']) {
    assert.strictEqual(boundary.neutralizeSpreadsheetFormula(value), `'${value}`);
  }
  assert.strictEqual(boundary.neutralizeSpreadsheetFormula('ordinary'), 'ordinary');
});

test('all import transports and export adapters use the common boundary', () => {
  for (const file of [
    'models/import.js', 'models/importZip.js', 'server/trelloApiImport.js',
    'models/exporter.js', 'models/lib/externalExporters.js',
  ]) {
    const contents = fs.readFileSync(path.join(root, file), 'utf8');
    assert.ok(contents.includes('secureTransfer'), `${file} bypasses common boundary`);
  }
  const wrapper = fs.readFileSync(path.join(root, 'server/lib/secureTransfer.js'), 'utf8');
  assert.ok(wrapper.includes('sanitizeTransferValue'));
  assert.ok(wrapper.includes("action: 'blocked'"));
  assert.ok(wrapper.includes("action: 'sanitized'"));
  const rest = fs.readFileSync(path.join(root, 'server/models/boards.js'), 'utf8');
  assert.match(rest, /Meteor\.callAsync\('importBoard'/);
});

console.log(`\nimportExportBoundary: ${passed} tests passed`);
