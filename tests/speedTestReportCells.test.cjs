'use strict';

// CodeQL js/incomplete-sanitization, alerts #593, #594 and #595: the speed
// test's report escaped a pipe in a Markdown table cell as `\|` but left a
// backslash alone, so a value ending in a backslash turned the added one into
// a literal backslash and its pipe split the cell again. mdCell() escapes the
// backslash first. The values are a database's name, an index key, a query's
// description and why two answers differed - and nowhere else in the tree
// escapes a pipe without the backslash.
// Run: node tests/speedTestReportCells.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { mdCell } = require('../docs/Databases/FerretDB/1/SpeedTest/report.cjs');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

// The cells of one Markdown table row, as GitHub splits it: on pipes that are
// not escaped, where a backslash escapes the character after it.
function cells(row) {
  const out = [];
  let cell = '';
  for (let i = 1; i < row.length - 1; i++) {
    if (row[i] === '\\') { cell += row[i] + row[i + 1]; i++; continue; }
    if (row[i] === '|') { out.push(cell.trim()); cell = ''; continue; }
    cell += row[i];
  }
  out.push(cell.trim());
  return out;
}

console.log('speedTestReportCells:');

test('a pipe, a backslash and a line break are escaped, the backslash first', () => {
  assert.strictEqual(mdCell('a|b'), 'a\\|b');
  assert.strictEqual(mdCell('ends with \\'), 'ends with \\\\');
  assert.strictEqual(mdCell('x\\|y'), 'x\\\\\\|y');
  assert.strictEqual(mdCell('two\nlines\r\nhere'), 'two lines here');
  assert.strictEqual(mdCell('plain'), 'plain');
  assert.strictEqual(mdCell(42), '42');
});

test('negative: a value cannot add a column to its row', () => {
  for (const evil of ['a\\', 'a\\|b', '\\\\|', '|', 'a\\\n|b', 'x | y \\']) {
    const row = `| ${mdCell(evil)} | second |`;
    assert.deepStrictEqual(cells(row).length, 2, `${JSON.stringify(evil)} -> ${row}`);
  }
});

test('negative: nowhere in the tree escapes a pipe without the backslash', () => {
  const root = path.join(__dirname, '..');
  const skip = new Set(['node_modules', '.tools', '_build', '.build', '.git', '.meteor']);
  const offenders = [];
  (function walk(dir) {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      if (skip.has(e.name)) continue;
      const p = path.join(dir, e.name);
      if (e.isDirectory()) walk(p);
      else if (/\.(c|m)?js$/.test(e.name)) {
        fs.readFileSync(p, 'utf8').split('\n').forEach((line, i) => {
          if (/\.replace(All)?\(\/\\\|\/g/.test(line) && !/\.replace(All)?\(\/\\\\\/g/.test(line)) {
            offenders.push(`${path.relative(root, p)}:${i + 1}`);
          }
        });
      }
    }
  })(root);
  assert.deepStrictEqual(offenders, []);
});

console.log(`speedTestReportCells: ${passed} passed`);
