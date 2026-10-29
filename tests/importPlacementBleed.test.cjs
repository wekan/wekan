'use strict';

// ImportPlacementBleed: an import INTO a board was authorized on boardId alone,
// and the listId / swimlaneId / cardId beside it - where the cards land - were
// written onto the new cards as given, or looked up with no board filter. A
// writer of board A created cards on A that pointed at board B's list and
// swimlane, by POST /api/import/zip and by the importScoped method alike.
// Reported by Zachariah Mithani (AploSec).
// Run: node tests/importPlacementBleed.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { importPlacementError, PLACEMENT_KEYS } = require('../models/lib/importPlacement');

const root = path.join(__dirname, '..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
const importer = read('models/server/scopedImporter.js');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }
console.log('importPlacementBleed:');

const A = 'boardA', B = 'boardB';
const on = (board, id) => ({ _id: id, boardId: board });

test('the reporter\'s attack is refused: board B\'s list and swimlane, then B\'s card', () => {
  // What the importer finds when it looks each id up WITH board A's id: nothing.
  assert.strictEqual(importPlacementError({ boardId: A, listId: 'listB', swimlaneId: 'swB' }, {}), 'listId');
  assert.strictEqual(importPlacementError({ boardId: A, swimlaneId: 'swB' }, {}), 'swimlaneId');
  assert.strictEqual(importPlacementError({ boardId: A, cardId: 'cardB' }, {}), 'cardId');
  // Even handed a document of the other board, the decision checks the board.
  assert.strictEqual(importPlacementError({ boardId: A, listId: 'listB' }, { list: on(B, 'listB') }), 'listId');
  assert.strictEqual(importPlacementError({ boardId: A, cardId: 'cardB' }, { card: on(B, 'cardB') }), 'cardId');
  assert.strictEqual(importPlacementError({ boardId: A, listId: 'l1' }, { list: on(A, 'other') }), 'listId', 'the document found must be that id');
  assert.strictEqual(importPlacementError({ boardId: A, listId: ['l1'] }, { list: on(A, 'l1') }), 'listId', 'not a string');
});

test('ids of the board itself, or none at all, are accepted', () => {
  assert.strictEqual(importPlacementError({ boardId: A }, {}), null);
  assert.strictEqual(importPlacementError({ boardId: A, listId: '', swimlaneId: null }, {}), null);
  assert.strictEqual(importPlacementError(
    { boardId: A, listId: 'l1', swimlaneId: 's1', cardId: 'c1' },
    { list: on(A, 'l1'), swimlane: on(A, 's1'), card: on(A, 'c1') }), null);
  assert.deepStrictEqual(PLACEMENT_KEYS, ['listId', 'swimlaneId', 'cardId']);
});

test('the importer checks the placement on the board before it writes anything', () => {
  const run = importer.slice(importer.indexOf('  async run() {'), importer.indexOf('  async _checkPlacement('));
  const check = run.indexOf('await this._checkPlacement(board);');
  assert.ok(check > 0, 'run() checks');
  for (const step of ['this._importCards(board)', 'this._importLists(board)', 'this._importSwimlanes(board)']) {
    assert.ok(run.indexOf(step) > check, `${step} only after the check`);
  }
  const body = importer.slice(importer.indexOf('  async _checkPlacement('));
  assert.match(body, /getList\(\{ _id: t\.listId, boardId: board\._id \}\)/);
  assert.match(body, /getSwimlane\(\{ _id: t\.swimlaneId, boardId: board\._id \}\)/);
  assert.match(body, /getCard\(\{ _id: t\.cardId, boardId: board\._id \}\)/);
  assert.match(body, /throw new Meteor\.Error\('error-import-placement'/);
  // Both routes are the importer's callers, so both get the check.
  const callers = execFileSync('git', ['grep', '-l', 'new ScopedImporter(', '--', '*.js'], { cwd: root, encoding: 'utf8' })
    .split('\n').filter(Boolean).filter(f => !f.startsWith('tests/'));
  assert.deepStrictEqual(callers.sort(), ['models/import.js', 'models/importZip.js']);
  assert.match(read('models/importZip.js'), /error\.error === 'error-import-placement'\) \{\n\s+answer\(400, \{ error: error\.reason \}\);/);
});

test('negative: no request id is written onto a card, nor looked up without the board', () => {
  // The v12.68 shapes: a raw target id as the fallback, and getCard(id).
  const cards = importer.slice(importer.indexOf('  async _importCards('));
  assert.ok(!/this\._target\.(listId|swimlaneId)\s*\n?\s*\|\|/.test(cards), 'no raw target id as a fallback');
  assert.ok(!/fallback(List|Swimlane)Id = this\._target\./.test(importer));
  // Anywhere in the importer: a target id is only ever looked up together
  // with the board's id.
  const unfiltered = [...importer.matchAll(/ReactiveCache\.get(Card|List|Swimlane)\(([^)]*)\)/g)]
    .filter(m => /this\._target\.|\bt\.(listId|swimlaneId|cardId)/.test(m[2]) && !/boardId: board\._id/.test(m[2]));
  assert.deepStrictEqual(unfiltered.map(m => m[0]), []);
  assert.ok(/ReactiveCache\.getCard\(this\._target\.cardId\)/.test('ReactiveCache.getCard(this._target.cardId)'), 'the scan sees the old line');
});

test('a refusal is recorded in Admin Panel → Problems, and logging cannot break the guard', () => {
  // An ESM module, read as text as the other catalog suites read it.
  assert.match(read('models/lib/securityCategories.js'),
    /'authz\.import-placement': \{ category: 'authz', bleed: 'ImportPlacementBleed', severity: 'medium', cwe: 'CWE-639', blocksAccount: false \},/);
  const body = importer.slice(importer.indexOf('  async _checkPlacement('));
  assert.match(body, /try \{\n\s+require\('\/server\/lib\/securityLog'\)\.record\(\{\n\s+key: 'authz\.import-placement', action: 'blocked', source: this\._source,[\s\S]{0,200}\} catch \(e\) \{ \/\* logging must never break the guard \*\/ \}\n\s+throw new Meteor\.Error/);
  assert.match(read('models/importZip.js'), /source: 'import:zip'/);
  assert.match(read('models/import.js'), /source: 'method:importScoped'/);
});

console.log(`importPlacementBleed: ${passed} passed`);
