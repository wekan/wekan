'use strict';

// #6792, from IRC: a Jira import of 25 issues worked and one of 858 failed,
// and there was no way to turn an existing board into a template.
//
// - The transfer boundary (models/lib/importExportBoundary.js) refused any
//   document over 250,000 values, which a Jira search export reaches at under
//   1,000 issues; the refusal was a plain Error, "Internal server error" on
//   the import page.
// - The import deadline was a flat two minutes whatever the file held.
// - A board template could only be built inside the Templates board.
//
// Run: node tests/largeImportAndBoardTemplate.test.cjs

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(ROOT, file), 'utf8');
let passed = 0;
const test = (name, fn) => { fn(); passed += 1; console.log('  ok -', name); };

const boundarySource = read('models/lib/importExportBoundary.js');
const boundary = {};
new Function('exports', boundarySource
  .replace(/export \{ sanitizeTransferValue, neutralizeSpreadsheetFormula, BLOCKED_KEYS \};/,
    'exports.sanitizeTransferValue = sanitizeTransferValue;'))(boundary);
const { importRecordCount, importDeadlineFor, IMPORT_MS_PER_RECORD } = require('../models/lib/importDeadline.js');

// A Jira Cloud search result issue as its REST API writes it, with three
// comments: the values come from null custom fields, avatars and statuses.
const avatars = { '48x48': 'a', '24x24': 'b', '16x16': 'c', '32x32': 'd' };
const person = id => ({ self: 's', accountId: id, emailAddress: `${id}@x`, avatarUrls: avatars, displayName: id, active: true, timeZone: 'UTC', accountType: 'atlassian' });
function jiraIssue(index) {
  const fields = {
    summary: `Issue ${index}`, description: 'text', labels: ['a'],
    status: { self: 's', name: 'To Do', id: '1', statusCategory: { self: 's', id: 2, key: 'new', colorName: 'blue-gray', name: 'To Do' } },
    assignee: person('u1'), reporter: person('u2'), creator: person('u2'),
    issuetype: { self: 's', id: '10001', name: 'Task', subtask: false, iconUrl: 'i', avatarId: 1, hierarchyLevel: 0 },
    project: { self: 's', id: '1', key: 'P', name: 'Proj', projectTypeKey: 'software', avatarUrls: avatars },
    priority: { self: 's', iconUrl: 'i', name: 'Medium', id: '3' },
    comment: { comments: [1, 2, 3].map(n => ({ self: 's', id: String(n), author: person('u1'), updateAuthor: person('u1'), body: 'c', created: 'x', updated: 'x', jsdPublic: true })), maxResults: 3, total: 3, startAt: 0 },
  };
  for (let c = 10000; c < 10200; c += 1) fields[`customfield_${c}`] = null;
  return { expand: 'x', id: String(index), self: 's', key: `P-${index}`, fields };
}

console.log('largeImportAndBoardTemplate:');

test('the 858-issue Jira export from the report passes the transfer boundary', () => {
  const doc = { issues: Array.from({ length: 858 }, (_, i) => jiraIssue(i)) };
  // It is over the old cap - this is the file that failed.
  assert.throws(() => boundary.sanitizeTransferValue(doc, { maxNodes: 250000 }), /object limit exceeded/);
  const result = boundary.sanitizeTransferValue(doc);
  assert.equal(result.value.issues.length, 858);
});

test('negative: a runaway document is still refused, by the same message', () => {
  // 41 arrays of 100,000: every array within its own cap, over four million values.
  const runaway = Array.from({ length: 41 }, () => new Array(100000).fill(0));
  assert.throws(() => boundary.sanitizeTransferValue(runaway), /Import\/export object limit exceeded/);
  assert.throws(() => boundary.sanitizeTransferValue({ a: new Array(100001).fill(0) }), /array limit exceeded/);
});

test('the deadline grows with the records of the file, and zero still disables it', () => {
  assert.equal(importRecordCount({ issues: new Array(858), names: {} }), 858);
  assert.equal(importRecordCount({ cards: new Array(10), lists: new Array(3), title: 'x' }), 13);
  assert.equal(importRecordCount([[1], [2]]), 2);
  assert.equal(importRecordCount('a\nb\nc'), 3);
  assert.equal(importRecordCount({ excelBase64: 'AAAA' }), 0);
  assert.equal(importRecordCount(null), 0);
  assert.equal(importDeadlineFor(120000, { issues: new Array(858) }), 120000 + 858 * IMPORT_MS_PER_RECORD);
  assert.equal(importDeadlineFor(120000, { issues: [] }), 120000, 'an empty file keeps the base');
  assert.equal(importDeadlineFor(0, { issues: new Array(858) }), 0, 'WEKAN_IMPORT_TIMEOUT_MS=0 is still no deadline');
  assert.ok(Number.isNaN(importDeadlineFor(NaN, [])), 'an invalid base stays invalid, which withDeadline reads as none');
});

test('every deadline in models/import.js scales with its document, and the page watchdog too', () => {
  const src = read('models/import.js');
  const calls = src.match(/withDeadline\(\s*[^,]+,\s*[^\n]+/g) || [];
  assert.ok(calls.length >= 4, 'importBoard (three paths) and importScoped');
  for (const call of calls) assert.match(call, /,\s*importDeadlineFor\(importDeadlineMs\(\), [\w.]+\),$/, call);
  const page = read('client/components/import/import.js');
  assert.match(page, /const timeoutMs = importDeadlineFor\(parseInt\(window\.WEKAN_IMPORT_TIMEOUT_MS, 10\) \|\| 120000, importDocument\);/);
  // The watchdog measures the document the server is sent.
  assert.match(page, /'importBoard',\s*importDocument,/);
});

test('a refused import is a Meteor.Error the page can name, not an internal error', () => {
  const src = read('models/import.js');
  const fn = src.slice(src.indexOf('function sanitizeImported('), src.indexOf('// On Sandstorm an import replaces'));
  assert.match(fn, /throw new Meteor\.Error\(\/limit exceeded\/\.test\(message\) \? 'import-too-large' : 'invalid-import-format', message\)/);
  const en = JSON.parse(read('imports/i18n/data/en.i18n.json'));
  assert.ok(en['import-too-large'], 'the page translates the key');
  assert.ok(!/__|%/.test(en['import-too-large']), 'no placeholders to keep');
});

test('the Jira creator collects the issue keys once, not once per issue', () => {
  const src = read('models/jiraCreator.js');
  assert.match(src, /if \(!this\.importedKeys\) this\.importedKeys = new Set\(/);
  // negative: the per-issue rebuild is gone.
  assert.doesNotMatch(src, /const importedKeys = new Set\(this\._issues\(data\)/);
});

test('saveBoardAsTemplate: board admin only, never a template, a template-board copy with its linked card', () => {
  const src = read('server/publications/boards.js');
  const start = src.indexOf('async saveBoardAsTemplate(boardId)');
  assert.ok(start > 0);
  const fn = src.slice(start, src.indexOf('\n  },\n', start));
  // Checked before anything is read or written.
  const writes = fn.indexOf('ensureTemplatesBoardForUserId(');
  for (const guard of ["if (!this.userId) throw new Meteor.Error('not-authorized')",
    "if (!board.hasAdmin(this.userId)) throw new Meteor.Error('not-authorized')",
    "if (board.isAnyTemplateBoard()) throw new Meteor.Error('already-a-template')"]) {
    assert.ok(fn.indexOf(guard) > 0 && fn.indexOf(guard) < writes, guard);
  }
  assert.match(fn, /boardWithCopyProperties\(board, \{ type: 'template-board' \}\)\.copy\(false\)/);
  // Group-only (#5850): the creator alone, private.
  assert.match(fn, /members: \[\{ userId: this\.userId, isAdmin: true, isActive: true/);
  assert.match(fn, /permission: 'private'/);
  // The linked card in the Board Templates swimlane is what makes it a template.
  assert.match(fn, /user\.profile\.boardTemplatesSwimlaneId/);
  assert.match(fn, /type: 'cardType-linkedBoard',\s*linkedId: templateId,/);
});

test('the board menu offers Save as Template to a board admin, and not on a template board', () => {
  const jade = read('client/components/sidebar/sidebar.jade');
  const menu = jade.slice(jade.indexOf('template(name="boardMenuPopup")'), jade.indexOf('template(name="boardViewSettingsPopup")'));
  assert.match(menu, /unless currentBoard\.isTemplatesBoard\n\s+if currentUser\.isBoardAdmin[\s\S]*?unless currentBoard\.isAnyTemplateBoard\n\s+li\n\s+a\.js-save-board-as-template/);
  // Reuses the card action's words, so there is nothing new to translate.
  assert.match(menu, /a\.js-save-board-as-template\n\s+i\.fa\.fa-clone\n\s+\| \{\{_ 'save-card-as-template'\}\}/);
  const js = read('client/components/sidebar/sidebar.js');
  assert.match(js, /'click \.js-save-board-as-template'\(\) \{[\s\S]*?Meteor\.callAsync\('saveBoardAsTemplate', currentBoard\._id\)/);
});

test('import-too-large is in every language file, right after import-timeout', () => {
  const dir = path.join(ROOT, 'imports/i18n/data');
  const missing = [];
  for (const file of fs.readdirSync(dir).filter(f => f.endsWith('.i18n.json'))) {
    const keys = Object.keys(JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8')));
    if (keys[keys.indexOf('import-timeout') + 1] !== 'import-too-large') missing.push(file);
  }
  assert.deepEqual(missing, []);
});

console.log(`\nlargeImportAndBoardTemplate: ${passed} tests passed`);
