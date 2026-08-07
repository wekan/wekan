'use strict';

// A board export carries every section, and finds the old records too.
//
// Two failures, one after the other, in the same few lines:
//
//   #6274 - "Export includes only comments from current year". The exporters
//   selected comments and activities by `boardId`, and records written by older
//   WeKan versions have no boardId on them, so every comment from a previous
//   year was silently dropped from the JSON and the Excel export alike. PR #6275
//   fixed it by selecting on the cards' ids instead, which every comment has.
//
//   #6275's own follow-up - the reporter came back with "the export is now
//   missing the lists part". A section that vanishes from an export is invisible
//   until somebody restores a backup and finds it half empty, and both failures
//   were of exactly that shape: something that should be in the file is not.
//
// So this pins BOTH, against the source, for all three export paths (streaming
// JSON, in-memory JSON, Excel):
//
//   * the two JSON writers emit the SAME set of sections - the streaming one was
//     added later, and a key that only one of them writes is a section that
//     disappears depending on which path served the download;
//   * `lists` is one of them, in both;
//   * comments are selected by cardId, and activities by boardId OR cardId, in
//     every exporter - putting a bare boardId selector back is #6274 again.
//
// Read from the source rather than run: an exporter needs Meteor, a database and
// a board, and the property worth pinning here is which sections the code emits.
//
// Run: node tests/exportBoardSections.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const exporter = fs.readFileSync(path.join(ROOT, 'models/exporter.js'), 'utf8');
const excel = fs.readFileSync(path.join(ROOT, 'models/server/ExporterExcel.js'), 'utf8');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

// Comments quote the code they replaced - a `boardId` selector is written out in
// the note explaining #6274 - so strip them before asserting on what runs.
function code(src) {
  return src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
}

const exporterCode = code(exporter);
const excelCode = code(excel);

// The sections a wekan-board-1.0.0 file is made of. Anything added to the format
// belongs in this list AND in both writers.
const SECTIONS = [
  'attachments', 'lists', 'swimlanes', 'customFields', 'cards', 'comments',
  'activities', 'checklists', 'checklistItems', 'subtaskItems', 'rules',
  'triggers', 'actions', 'users',
];

console.log('exportBoardSections:');

test('build() writes every section of the board file', () => {
  const keys = new Set(
    [...exporterCode.matchAll(/result\.([a-zA-Z]+)\s*=/g)].map(m => m[1]),
  );
  const missing = SECTIONS.filter(s => !keys.has(s));
  assert.deepStrictEqual(missing, [],
    'a section the in-memory JSON export stops writing is a section missing '
    + 'from every backup taken with it');
});

test('buildStream() writes the same sections, and no fewer', () => {
  // `streamArray('key', …)` for most, and a hand-written `,"key":[` for the two
  // that stream file bytes or build their own objects (attachments, users).
  const streamed = new Set([
    ...[...exporterCode.matchAll(/streamArray\(\s*'([a-zA-Z]+)'/g)].map(m => m[1]),
    ...[...exporterCode.matchAll(/w\(`,"([a-zA-Z]+)":\[`\)/g)].map(m => m[1]),
  ]);
  const missing = SECTIONS.filter(s => !streamed.has(s));
  assert.deepStrictEqual(missing, [],
    'the streaming writer serves the download on big boards - a section it '
    + 'skips is one that vanishes for exactly the boards that most need a backup');
});

test('lists are exported by both JSON writers, and by name in the flat formats', () => {
  // The section #6275's reporter found gone. Pinned on its own, because it is
  // the one an import cannot reconstruct: cards carry a listId and nothing else.
  assert.ok(/result\.lists\s*=/.test(exporterCode), 'build() writes lists');
  assert.ok(/streamArray\(\s*'lists'/.test(exporterCode), 'buildStream() writes lists');
  // CSV/TSV and Excel are flat card tables: they carry the list's NAME on each
  // row instead of a lists section, from a lookup built for that.
  assert.ok(/lists:\s*await ReactiveCache\.getLists\(/.test(exporterCode),
    'the CSV writer loads the lists lookup for its list column');
  assert.ok(/getLists\(\s*\{\s*boardId:\s*this\._boardId\s*\}/.test(excelCode),
    'and the Excel writer loads it too');
});

test('comments are found by card, not by board - #6274', () => {
  // The whole of #6274: a comment written by an older WeKan has no boardId, so a
  // boardId selector cannot see it. Its cardId is always there.
  //
  // Every call that reads the comments collection, in either exporter, must open
  // its selector with cardId. Whitespace is flattened first because these
  // selectors are written across several lines.
  const CALL = /(?:getCardComments|cardCommentsRaw\.find|streamArray\(\s*'comments',\s*cardCommentsRaw)\s*,?\s*\(?\s*(\{[^}]*\{[^}]*\}[^}]*\}|\{[^}]*\})/g;
  for (const [name, src] of [['exporter.js', exporterCode], ['ExporterExcel.js', excelCode]]) {
    const flat = src.replace(/\s+/g, ' ');
    const selectors = [...flat.matchAll(CALL)].map(m => m[1]);
    assert.ok(selectors.length >= 2,
      `${name}: expected the comment reads to be found, got ${selectors.length}`);
    for (const sel of selectors) {
      assert.ok(/^\{ cardId: \{ \$in/.test(sel),
        `${name}: comments must be selected by cardId - "${sel.slice(0, 70)}"`);
    }
  }
});

test('activities are found by board OR by card - #6274', () => {
  // Activities are the mixed case: board-level ones have only a boardId, old
  // card-level ones have only a cardId. Both halves have to be asked for.
  const withOr = /\$or:\s*\[\s*\{\s*boardId[^\]]*\}\s*,\s*\{\s*cardId:\s*\{\s*\$in/;
  assert.ok(withOr.test(exporterCode.replace(/\s+/g, ' ')),
    'exporter.js must select activities on boardId OR cardId');
});

test('the Excel export names its own board, and survives a deleted user', () => {
  // From PR #6275: `this.boardId` is undefined on this class - the field is
  // `_boardId` - so that query ran against no board at all. The class must not
  // grow another one.
  assert.ok(!/this\.boardId\b/.test(excelCode),
    'ExporterExcel has no `this.boardId` - the field is `this._boardId`');
  // Also #6275: a comment whose author has since been deleted has no entry in
  // the username map, and the cell used to read `undefined`.
  assert.ok(/jmeml\[[^\]]+\]\s*\|\|/.test(excelCode),
    'a deleted comment author falls back, rather than writing undefined into the cell');
});

test('custom fields live in the JSON export, which is the one that round-trips', () => {
  // The other half of that #6275 line. The Excel exporter used to LOAD custom
  // fields and render them nowhere - the load was dead weight, and the streaming
  // rewrite dropped it along with the activities, checklists, subtasks and rules
  // the spreadsheet also never showed. That is why there is no getCustomFields
  // in ExporterExcel and why this guard does not ask for one: the spreadsheet is
  // a flat card table, and a board's custom fields survive in the JSON export,
  // which is what an import reads back.
  assert.ok(!/getCustomFields|customFields/.test(excelCode),
    'the Excel exporter loads no data it does not render - if it grows custom '
    + 'field COLUMNS, pin those instead of deleting this');
  assert.ok(/result\.customFields\s*=/.test(exporterCode)
    && /streamArray\(\s*'customFields'/.test(exporterCode),
    'both JSON writers carry customFields, or an import loses them');
});

console.log(`\n${passed} tests passed`);
