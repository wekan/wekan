'use strict';

// A missing board, or a token that is too long, must not answer an export request
// with HTTP 200. PR #6869 fixed the Excel board route; the same two answers were in
// the PDF routes, so this pins the SHAPE of the fault over every export route and
// not only the one that was reported.
//
// Run: node tests/exportErrorStatuses.test.cjs

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');

const modelsDir = path.join(__dirname, '..', 'models');
const files = fs.readdirSync(modelsDir).filter(f => /^export.*\.js$/.test(f));
const read = f => fs.readFileSync(path.join(modelsDir, f), 'utf8').split('\n');

// every `res.end('literal error text')` and the last non-blank line before it
function endsWithoutStatus(lines) {
  const found = [];
  lines.forEach((line, i) => {
    if (!/res\.end\((['"`]|TAPi18n)/.test(line)) return;
    let j = i - 1;
    while (j >= 0 && lines[j].trim() === '') j -= 1;
    if (!/writeHead|statusCode|\.status\(/.test(lines[j])) found.push(`${i + 1}: ${line.trim()}`);
  });
  return found;
}

test('no export route ends a text answer without choosing its status', () => {
  assert.ok(files.length >= 5, 'the export route files are found');
  for (const f of files) {
    assert.deepEqual(endsWithoutStatus(read(f)), [], `${f} answers with the default 200`);
  }
});

test('negative: the scan does catch the fault shape', () => {
  const bad = ["if (!board) {", "  res.end('Board not found');", "  return;", "}"];
  assert.equal(endsWithoutStatus(bad).length, 1);
  const good = ["if (!board) {", "  res.writeHead(404, {});", "  res.end('Board not found');", "}"];
  assert.equal(endsWithoutStatus(good).length, 0);
});

test('"Board not found" is a 404 and a too-long token is a 400, in every export route', () => {
  for (const f of files) {
    const lines = read(f);
    lines.forEach((line, i) => {
      const m = /res\.end\('(Board not found|Invalid token)'\)/.exec(line);
      if (!m) return;
      let j = i - 1;
      while (j >= 0 && lines[j].trim() === '') j -= 1;
      const status = /writeHead\((\d+)/.exec(lines[j]);
      assert.ok(status, `${f}:${i + 1} sets a status`);
      if (m[1] === 'Board not found') assert.equal(status[1], '404', `${f}:${i + 1}`);
      else assert.ok(['400', '401'].includes(status[1]), `${f}:${i + 1} is ${status[1]}`);
    });
  }
  // the PDF routes are the ones that had it
  const pdf = fs.readFileSync(path.join(modelsDir, 'exportPDF.js'), 'utf8');
  assert.equal((pdf.match(/writeHead\(404[^)]*\);\s*res\.end\('Board not found'\)/g) || []).length, 2);
});
