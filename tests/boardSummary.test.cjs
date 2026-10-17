'use strict';

// Board menu -> Summary (docs/Features/General/Summary/Summary.md): the groups,
// the period, what is never listed, and who may read it.
//
// Run: node tests/boardSummary.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const s = require('../models/lib/boardSummary.js');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

const now = new Date('2026-10-17T12:00:00Z');
const hoursAgo = h => new Date(now.getTime() - h * 3600 * 1000);
const usernames = { alice: 'alice', bob: 'bob' };
const cards = {
  c1: { _id: 'c1', title: 'Write report' },
  c2: { _id: 'c2', title: 'Fix printer' },
  c3: { _id: 'c3', title: 'Order paper', dueAt: hoursAgo(5), members: ['bob'] },
  c4: { _id: 'c4', title: 'Plan party' },
  c5: { _id: 'c5', title: 'Old overdue but done', dueAt: hoursAgo(50), assignees: ['bob'], dueComplete: true },
};

console.log('boardSummary:');

test('each person gets done, moved, added, commented and overdue', () => {
  const rows = s.boardSummary({
    activities: [
      { activityType: 'moveCard', userId: 'alice', cardId: 'c1', listId: 'doing', createdAt: hoursAgo(3) },
      { activityType: 'moveCard', userId: 'alice', cardId: 'c2', listId: 'done', createdAt: hoursAgo(2) },
      { activityType: 'createCard', userId: 'bob', cardId: 'c4', listId: 'todo', createdAt: hoursAgo(1) },
      { activityType: 'addComment', userId: 'bob', cardId: 'c1', createdAt: hoursAgo(1) },
      { activityType: 'addComment', userId: 'bob', cardId: 'c1', createdAt: hoursAgo(1) },
    ],
    history: [{ userId: 'alice', cardId: 'c4', newContent: { field: 'dueComplete', value: true }, createdAt: hoursAgo(1) }],
    cards, lastListIds: ['done'], usernames, since: s.sinceFor('day', now), now,
  });
  const alice = rows.find(r => r.username === 'alice');
  const bob = rows.find(r => r.username === 'bob');
  assert.deepStrictEqual(alice.groups.moved.map(c => c.title), ['Write report']);
  assert.deepStrictEqual(alice.groups.done.map(c => c.title), ['Fix printer', 'Plan party']);
  assert.deepStrictEqual(bob.groups.added.map(c => c.title), ['Plan party']);
  assert.deepStrictEqual(bob.groups.commented.map(c => c.title), ['Write report'], 'two comments, one card');
  assert.deepStrictEqual(bob.groups.overdue.map(c => c.title), ['Order paper'], 'a done card is never overdue');
  assert.strictEqual(rows[0].username, 'alice', 'most done first');
});

test('the period, and what is never listed (negative)', () => {
  const base = {
    cards, lastListIds: ['done'], usernames, now,
    activities: [
      { activityType: 'moveCard', userId: 'alice', cardId: 'c1', listId: 'doing', createdAt: hoursAgo(30) },
      { activityType: 'moveCard', userId: 'mallory', cardId: 'c1', listId: 'doing', createdAt: hoursAgo(1) },
      { activityType: 'moveCard', userId: 'alice', cardId: 'secret', listId: 'doing', createdAt: hoursAgo(1) },
      { activityType: 'changedTitle', userId: 'alice', cardId: 'c1', createdAt: hoursAgo(1) },
    ],
  };
  const day = s.boardSummary({ ...base, since: s.sinceFor('day', now) });
  assert.ok(!day.some(r => r.username === 'alice'), 'a day ago and older is not in Last day; an unseen card is not listed');
  assert.ok(!day.some(r => r.userId === 'mallory'), 'somebody who is not a member is not listed');
  const week = s.boardSummary({ ...base, since: s.sinceFor('week', now) });
  assert.deepStrictEqual(week.find(r => r.username === 'alice').groups.moved.map(c => c.title), ['Write report']);
  assert.strictEqual(s.finishes({ newContent: { field: 'dueComplete', value: false } }), false, 'unticking is not finishing');
  assert.strictEqual(s.finishes({ newContent: { field: 'endAt', value: null } }), false);
  assert.strictEqual(s.finishes({ newContent: { field: 'endAt', value: '2026-10-17' } }), true);
});

test('Copy as text is Markdown with card links', () => {
  const rows = [{ username: 'alice', groups: { done: [{ _id: 'c2', title: 'Fix printer' }], moved: [], added: [], commented: [], overdue: [] } }];
  const md = s.summaryMarkdown(rows, { heading: 'Board - Summary', label: g => g.toUpperCase(), cardUrl: id => `https://x/${id}` });
  assert.strictEqual(md, '# Board - Summary\n\n## @alice\n- **DONE:** [Fix printer](https://x/c2)\n');
});

test('the server reads only what the caller may read, and nothing when the feature is off (negative)', () => {
  const src = read('server/methods/boardSummary.js');
  assert.match(src, /if \(!this\.userId \|\| !\(await featureOnFor\(this\.userId, 'board-summary'\)\)\) return \[\];/);
  assert.match(src, /if \(!board \|\| !canReadBoard\(this\.userId, board\)\) return \[\];/);
  assert.match(src, /mergeCardScope\(\{ boardId \}, assignedOnlyCardScope\(board, this\.userId\)\)/);
  assert.match(src, /check\(period, Match\.OneOf\('day', 'week'\)\);/);
  assert.match(read('server/imports.js'), /import '\/server\/methods\/boardSummary';/);
  const { FEATURES } = require('../models/lib/instanceFeatures.js');
  assert.ok(FEATURES.some(f => f.key === 'board-summary' && f.views.length === 0));
  const menu = read('client/components/sidebar/sidebar.jade');
  assert.match(menu, /if allowFeature 'board-summary'\n\s+li\n\s+a\.js-open-board-summary/);
  assert.match(read('client/components/sidebar/sidebar.js'), /Sidebar\.setView\('boardSummary'\);/);
  assert.match(read('client/lib/instanceFeatures.js'), /Template\.registerHelper\('allowFeature'/);
});

console.log(`\nboardSummary: ${passed} tests passed`);
