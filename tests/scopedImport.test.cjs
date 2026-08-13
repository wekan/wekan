'use strict';

// Where an imported thing lands, and what comes in with it.
// Run: node tests/scopedImport.test.cjs
//
// wekan/wekan#1173's other half: a swimlane's menu imports a swimlane BELOW that
// swimlane, a list's menu imports a list after it, a card's menu imports a card
// below it - into the board that is already open. The placement is arithmetic,
// so it is tested as arithmetic; the rest is read from the source, like the
// other export/import suites.
//
// The RTL rule is worth stating because it looks like a missing branch: a list
// imported from a list's menu goes to the RIGHT in English and to the LEFT in
// Arabic, and that is ONE rule, not two. The page carries `dir`
// (client/components/main/layouts.jade), so the board's row of lists mirrors
// itself - "after in sort order" is already "the other side". A separate RTL
// branch here would mirror it twice and put the list back where it started.

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const read = f => fs.readFileSync(path.join(repoRoot, f), 'utf8');
const { sortsAfter, gapIsExhausted } = require('../models/lib/insertPosition.js');
const importer = read('models/server/scopedImporter.js');
const importModel = read('models/import.js');
const scopeJs = read('client/components/boards/exportScope.js');
const scopeJade = read('client/components/boards/exportScope.jade');
const position = read('models/lib/insertPosition.js');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

console.log('scopedImport:');

// ── where it lands ──────────────────────────────────────────────────────────

test('one item lands between its target and the next', () => {
  assert.deepStrictEqual(sortsAfter([0, 1, 2], 1, 1), [1.5]);
  assert.deepStrictEqual(sortsAfter([0, 10], 0, 1), [5]);
});

test('several land spread through the gap, not on top of each other', () => {
  const sorts = sortsAfter([0, 1], 0, 3);
  assert.deepStrictEqual(sorts, [0.25, 0.5, 0.75]);
  assert.ok(!gapIsExhausted([0, ...sorts, 1]), 'and they are all distinct');
});

test('after the last one, it just counts on', () => {
  // No gap to divide: 2, 3, 4 rather than an ever-finer fraction.
  assert.deepStrictEqual(sortsAfter([0, 1], 1, 3), [2, 3, 4]);
});

test('no target means the top, and an empty board means zero', () => {
  assert.deepStrictEqual(sortsAfter([5, 6], undefined, 2), [3, 4]);
  assert.deepStrictEqual(sortsAfter([], undefined, 2), [0, 1]);
});

test('junk in does not put a card at NaN (negative)', () => {
  // A hand-edited document, a missing sort, a string where a number was: the
  // sorts of the siblings are filtered, and a bad count imports nothing rather
  // than looping.
  assert.deepStrictEqual(sortsAfter([0, null, 'x', 2], 0, 1), [1]);
  assert.deepStrictEqual(sortsAfter([0, 1], 0, 0), []);
  assert.deepStrictEqual(sortsAfter([0, 1], 0, -3), []);
  for (const value of sortsAfter([0, 1], 0, 2)) {
    assert.ok(Number.isFinite(value), `${value} is a number`);
  }
});

test('the sort is a fraction because renumbering is what does not scale', () => {
  assert.ok(/renumbering/.test(position),
    'the reason is written where the arithmetic is');
  assert.ok(!/updateMany|renumber\(/.test(position),
    'and no sibling is rewritten to make room');
});

test('RTL is one rule, and the reason is written down (negative)', () => {
  assert.ok(/right-to-left/.test(position) && /mirrors itself/.test(position),
    'the page mirrors, so "after" is already the other side');
  assert.ok(!/isRtl|rtl \?/.test(position),
    'a direction branch here would mirror it twice');
});

// ── what comes in ───────────────────────────────────────────────────────────

test('the same selection decides what an import brings in', () => {
  assert.ok(/hasField\('comments'\)/.test(importer)
    && /hasField\('checklists'\)/.test(importer)
    && /hasField\('custom-fields'\)/.test(importer),
    'the importer gates the same sections the exporters gate');
  assert.ok(/selectedFields\(\)/.test(scopeJs),
    'and the popup sends the same list it sends to an export');
  assert.ok(/WHAT TO BRING IN/.test(importer), 'which is what it means here');
});

test('an import creates, and never edits what is already there', () => {
  assert.ok(/never an edit of what is already there/.test(importer),
    'importing twice gives two copies, not a half-updated board');
  assert.ok(/_cardIdMap|_listIdMap|_swimlaneIdMap/.test(importer),
    'old ids are mapped to new ones, so nothing is inserted under a foreign id');
});

test('a comment comes back under the importing user, not a stranger', () => {
  assert.ok(/The importing user, not the original author/.test(importer),
    'the original author may not exist on this server');
});

test('a custom field is matched by NAME, not by id', () => {
  // A custom field belongs to a board, so an id from another board matches
  // nothing - matching by name is what makes a cross-board import work at all.
  assert.ok(/Matching by name rather than by id/.test(importer), 'says so');
  assert.ok(/byName\.get\(String\(field\.name/.test(importer), 'and does so');
});

// ── who may do it ───────────────────────────────────────────────────────────

test('importing is a WRITE, and is checked as one', () => {
  assert.ok(/isBoardMember\(\)/.test(importModel),
    'export asks "may you see it"; import asks "may you change it"');
  assert.ok(/assertImportEnabled/.test(importModel),
    'and the Admin Panel master switch still applies');
  assert.ok(/wekan-board-1\.0\.0/.test(importModel),
    'a file that is not a WeKan export is refused by format');
  assert.ok(/import-timeout/.test(importModel),
    'and a hung import ends, like the board import');
});

test('the popup offers import only to somebody who may write', () => {
  assert.ok(/canImport\(\)/.test(scopeJs) && /isReadOnly/.test(scopeJs),
    'a read-only member sees the exports and not the import');
  assert.ok(/if canImport/.test(scopeJade), 'and the template asks');
});

test('a .zip is unpacked in the browser, so there is one import path', () => {
  assert.ok(/JSZip/.test(scopeJs), 'the .zip is read client-side');
  assert.ok(/zip\.file\('wekan\.json'\)/.test(scopeJs),
    'and the document inside it is the one the export wrote');
  assert.ok(/return JSON\.parse\(await file\.text\(\)\)/.test(scopeJs),
    'a .json is the same object without the unpacking');
});

console.log(`\nscopedImport: ${passed} tests passed`);
