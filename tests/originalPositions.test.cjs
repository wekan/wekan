'use strict';

// Board menu → Original positions: where each swimlane, list and card was put
// when it was made (positionHistory, written on creation), with the names they
// have now and whether they have moved. It was built as two templates nothing
// drew, in hard-coded English, showing raw ids; it is a right-sidebar view now,
// in every language, by name.
//
// Run: node tests/originalPositions.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { originalPositionGroups, hasMoved } = require('../models/lib/originalPositions.js');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

const docs = {
  swimlane: { s1: { title: 'Default', sort: 0 } },
  list: { l1: { title: 'Doing', sort: 1, swimlaneId: 's1' }, l2: { title: 'Done', sort: 2, swimlaneId: 's1' } },
  card: { c1: { title: 'Fix the login', sort: 5, listId: 'l2', swimlaneId: 's1' } },
};
const deps = {
  current: (type, id) => docs[type][id],
  titleOf: (type, id) => (docs[type][id] || {}).title || '',
  label: key => ({ list: 'Lista', swimlane: 'Kaista' })[key] || key,
  formatDate: () => 'yesterday',
};
const history = [
  { entityType: 'card', entityId: 'c1', originalTitle: 'Login broken', originalPosition: { sort: 5, title: 'Login broken' },
    originalListId: 'l1', originalSwimlaneId: 's1', createdAt: new Date() },
  { entityType: 'list', entityId: 'l1', originalPosition: { sort: 1, title: 'Doing' }, originalSwimlaneId: 's1' },
  { entityType: 'swimlane', entityId: 's1', originalPosition: { sort: 0, title: 'Default' } },
];

console.log('originalPositions:');

test('three groups, each row by the name it has now, its first place and title', () => {
  const groups = originalPositionGroups(history, deps);
  assert.deepStrictEqual(groups.map(g => g.labelKey), ['swimlanes', 'lists', 'cards']);
  const card = groups[2].items[0];
  assert.strictEqual(card.title, 'Fix the login');
  assert.strictEqual(card.originalTitle, 'Login broken');
  assert.strictEqual(card.originalPlace, 'Lista: Doing · Kaista: Default', 'names, translated labels, no ids');
  assert.strictEqual(card.moved, true, 'it is in Done now');
  assert.strictEqual(card.createdAt, 'yesterday');
  assert.strictEqual(groups[1].items[0].moved, false);
  assert.strictEqual(groups[1].items[0].originalTitle, '', 'an unchanged title is not repeated');
});

test('nothing moved, a missing thing and an empty history (negative)', () => {
  assert.strictEqual(hasMoved('card', history[0], undefined), false, 'a deleted card is not "moved"');
  assert.strictEqual(hasMoved('swimlane', { originalPosition: { sort: 0 } }, { sort: 0 }), false);
  assert.strictEqual(hasMoved('swimlane', { originalPosition: { sort: 0 } }, { sort: 3 }), true);
  assert.deepStrictEqual(originalPositionGroups([], deps), [], 'no groups, so the view says no results');
  assert.deepStrictEqual(originalPositionGroups(undefined, deps), []);
  const gone = originalPositionGroups([{ entityType: 'card', entityId: 'x', originalTitle: 'Old' }], deps)[0].items[0];
  assert.deepStrictEqual([gone.title, gone.exists, gone.moved], ['Old', false, false]);
});

test('the board menu opens it in the right sidebar, for everyone who sees the board', () => {
  const jade = read('client/components/sidebar/sidebar.jade');
  assert.match(jade, /a\.js-open-archives[\s\S]*?a\.js-open-original-positions\n\s*i\.fa\.fa-history\n\s*\| \{\{_ 'original-positions'\}\}/);
  const js = read('client/components/sidebar/sidebar.js');
  assert.match(js, /originalPositions: 'original-positions',/);
  assert.match(js, /'click \.js-open-original-positions'\(\) \{[\s\S]*?Sidebar\.setView\('originalPositions'\);/);
  assert.match(read('client/components/sidebar/sidebarOriginalPositions.jade'), /template\(name="originalPositionsSidebar"\)/);
  assert.match(read('client/features/sidebar.js'), /sidebarOriginalPositions\.js/);
});

test('the server narrows the history to what the reader may see', () => {
  const server = read('server/methods/positionHistory.js');
  const at = server.indexOf("async 'positionHistory.getBoardHistory'(boardId)");
  const body = server.slice(at, server.indexOf('\n  },', at));
  assert.match(body, /assertCanReadBoard\(this\.userId, boardId\)/);
  assert.match(body, /assignedOnlyHistoryScope\(this\.userId, board\)/);
});

test('every language has the menu entry, and the view has no English of its own (negative)', () => {
  const dir = path.join(ROOT, 'imports/i18n/data');
  for (const file of fs.readdirSync(dir)) {
    const data = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'));
    assert.ok(typeof data['original-positions'] === 'string' && data['original-positions'], `${file} has original-positions`);
    if (!file.startsWith('en')) assert.notStrictEqual(data['original-positions'], 'Original positions', `${file} is translated`);
  }
  const view = read('client/components/sidebar/sidebarOriginalPositions.jade');
  for (const line of view.split('\n').filter(l => /^\s*\|\s/.test(l))) {
    assert.ok(/^\s*\|\s+\{\{/.test(line), `literal text in the view: ${line.trim()}`);
  }
  assert.ok(!fs.existsSync(path.join(ROOT, 'client/lib/originalPositionHelpers.js')), 'the uncalled helpers stay removed');
});

console.log(`\noriginalPositions: ${passed} tests passed`);
