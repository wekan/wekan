'use strict';

// Guard: BFLABleed (2026-05-19, reported by Fredrik Dietrichson) and ExcelBleed.
// Run: node tests/unawaitedAccessCheck.test.cjs
//
// Both were the same mistake. An access check that is an `async` function
// returns a Promise, and a Promise is truthy and never throws where it is
// called: `Authentication.checkBoardAccess(userId, boardId);` without `await`
// let the handler run on for anyone, and its rejection went nowhere. BFLABleed
// was 48 REST endpoints written that way, which let an authenticated non-member
// read and write any board; ExcelBleed was the Excel export route's check.
//
// The test reads the access checks' definitions, so a check that becomes async
// later is covered without editing this file, and requires every call to one of
// them - anywhere in the server tree - to be awaited or returned.

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(ROOT, file), 'utf8');
let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

function sourceFiles() {
  const out = [];
  const walk = dir => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (['node_modules', 'tests'].includes(entry.name) || entry.name.startsWith('_build') || entry.name.startsWith('.')) continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (/\.(c|m)?js$/.test(entry.name)) out.push(full);
    }
  };
  for (const dir of ['server', 'models', 'packages', 'imports']) walk(path.join(ROOT, dir));
  return out;
}
const withoutComments = text => text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/([^:])\/\/.*$/gm, '$1');

// The async Authentication checks, read from their definitions.
const authentication = read('server/authentication.js');
const ASYNC_CHECKS = [...authentication.matchAll(/^\s*async (check\w+)\s*\(/gm)].map(m => m[1]);

test('the access checks that must be awaited are the async ones', () => {
  for (const name of ['checkUserId', 'checkAdminOrCondition', 'checkBoardAccess', 'checkBoardWriteAccess', 'checkBoardAdmin']) {
    assert.ok(ASYNC_CHECKS.includes(name), `${name} is an async check`);
  }
  // A synchronous check stays callable without await; it throws in place.
  assert.ok(!ASYNC_CHECKS.includes('checkLoggedIn'));
});

// Every call of `<receiver>.<method>(`: awaited, returned, or the definition itself.
function unawaitedCalls(pattern) {
  const found = [];
  for (const file of sourceFiles()) {
    const lines = withoutComments(fs.readFileSync(file, 'utf8')).split('\n');
    lines.forEach((line, i) => {
      for (const m of line.matchAll(pattern)) {
        const before = line.slice(0, m.index);
        if (/\b(await|return)\s+(\(\s*)?(!\s*)?[\w.\s]*$/.test(before) || /\basync\s+$/.test(before)) continue;
        found.push(`${path.relative(ROOT, file)}:${i + 1}: ${line.trim()}`);
      }
    });
  }
  return found;
}

test('BFLABleed: every async Authentication check is awaited, everywhere (negative)', () => {
  const pattern = new RegExp(`\\bAuthentication\\.(${ASYNC_CHECKS.join('|')})\\(`, 'g');
  let calls = 0;
  for (const file of sourceFiles()) calls += (fs.readFileSync(file, 'utf8').match(pattern) || []).length;
  assert.ok(calls > 100, `expected the REST routes' checks, found ${calls}`);
  assert.deepStrictEqual(unawaitedCalls(pattern), [],
    'an un-awaited async access check lets the handler run for anyone');
});

test('ExcelBleed: every exporter\'s canExport() is awaited, everywhere (negative)', () => {
  const definitions = sourceFiles().filter(file => /async canExport\(/.test(fs.readFileSync(file, 'utf8')));
  assert.ok(definitions.length >= 5, 'the exporters define canExport as async');
  assert.deepStrictEqual(unawaitedCalls(/\.canExport\(/g), [],
    'an un-awaited canExport() is a truthy Promise: the export runs for anyone');
  // The Excel export route itself, where ExcelBleed was.
  assert.match(read('models/exportExcel.js'), /if \(\(await exporterExcel\.canExport\(user\)\)\)/);
});

test('the scan recognises the vulnerable shape (self-check)', () => {
  const tmp = 'const r = Authentication.checkBoardAccess(req.userId, id);\nif (exporter.canExport(user)) {}\n';
  const pattern = /\bAuthentication\.(checkBoardAccess)\(|\.canExport\(/g;
  const hits = [...tmp.matchAll(pattern)].filter(m => !/\b(await|return)\s+(\(\s*)?(!\s*)?[\w.\s]*$/.test(tmp.slice(tmp.lastIndexOf('\n', m.index) + 1, m.index)));
  assert.strictEqual(hits.length, 2);
});

console.log(`\nunawaitedAccessCheck: ${passed} tests passed`);
