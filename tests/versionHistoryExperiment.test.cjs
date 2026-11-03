'use strict';

// docs/Databases/FerretDB/1/VersionHistory: what Dolt and TerminusDB would give
// WeKan's undo and redo. The scripts need a database server, so this checks what
// can be checked without one: they parse, they ask the questions the README
// answers, they leave nothing behind, and the README records the findings.
//
// Run: node tests/versionHistoryExperiment.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const DIR = path.join(__dirname, '..', 'docs/Databases/FerretDB/1/VersionHistory');
const read = f => fs.readFileSync(path.join(DIR, f), 'utf8');
let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }
console.log('versionHistoryExperiment:');

test('both scripts parse', () => {
  for (const f of ['dolt-history.cjs', 'terminusdb-history.cjs']) execFileSync(process.execPath, ['--check', path.join(DIR, f)]);
});

test('the Dolt script exercises undo, redo, a selective restore, time travel and the cost', () => {
  const src = read('dolt-history.cjs');
  for (const needle of ["DOLT_REVERT('HEAD')", 'dolt_diff_', 'AS OF', 'DOLT_RESET', '--timing', 'dolt_transaction_commit']) {
    assert.ok(src.includes(needle), needle);
  }
  // It goes through FerretDB (the MongoDB protocol), the way WeKan writes.
  assert.ok(src.includes("require('mongodb')"));
  // Negative: it works in its own database and never touches WeKan's.
  assert.ok(src.includes("const DB = 'wekanhistory'"));
  assert.ok(!/dropDatabase\(['"](?!wekanhistory)/.test(src));
});

test('the TerminusDB script exercises the same questions through its REST API', () => {
  const src = read('terminusdb-history.cjs');
  for (const needle of ['/api/log/', '/api/diff/', '/api/patch/', '/local/commit/', 'restore']) {
    assert.ok(src.includes(needle), needle);
  }
  assert.ok(src.includes("const DB = 'wekanhistory'"));
});

test('the README records what was found, including what does not work', () => {
  const md = read('README.md');
  for (const needle of ['DOLT_REVERT', 'are in conflict', 'Transaction commit', '+0.4 ms', 'SwapValue', 'No.** It has neither the MongoDB protocol nor SQL']) {
    assert.ok(md.includes(needle), needle);
  }
  // The recommendation: WeKan's own History stays.
  assert.match(md, /WeKan's own History is still the right undo/);
});

console.log(`versionHistoryExperiment: ${passed} tests passed`);
