'use strict';

// Board menu -> Since your last visit
// (docs/Features/General/Since-Last-Visit/Since-Last-Visit.md): what is
// listed, from when, what never is, and who may read it.
//
// Run: node tests/sinceLastVisit.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const v = require('../models/lib/sinceLastVisit.js');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

const now = new Date('2026-10-17T12:00:00Z');
const ago = h => new Date(now.getTime() - h * 3600 * 1000);
const cards = { c1: { _id: 'c1', title: 'Write report' }, c2: { _id: 'c2', title: 'Fix printer' } };
const usernames = { me: 'me', bob: 'bob' };

console.log('sinceLastVisit:');

test('changes by others since the visit, grouped by card, newest first', () => {
  const groups = v.sinceLastVisit({
    activities: [
      { activityType: 'moveCard', userId: 'bob', cardId: 'c1', listName: 'Done', createdAt: ago(1) },
      { activityType: 'addComment', userId: 'bob', cardId: 'c2', createdAt: ago(2) },
      { activityType: 'a-dueAt', userId: 'bob', cardId: 'c1', createdAt: ago(3) },
    ],
    cards, usernames, userId: 'me', since: ago(5),
  });
  assert.deepStrictEqual(groups.map(g => g.title), ['Write report', 'Fix printer']);
  assert.deepStrictEqual(groups[0].changes.map(c => c.key), ['since-visit-moved', 'since-visit-due']);
  assert.strictEqual(groups[0].changes[0].list, 'Done');
  assert.strictEqual(groups[0].changes[0].username, 'bob');
  assert.strictEqual(v.changeCount(groups), 3);
});

test('never your own changes, older ones, unknown kinds or unseen cards (negative)', () => {
  const groups = v.sinceLastVisit({
    activities: [
      { activityType: 'moveCard', userId: 'me', cardId: 'c1', createdAt: ago(1) },
      { activityType: 'moveCard', userId: 'bob', cardId: 'c1', createdAt: ago(10) },
      { activityType: 'deleteAttachment', userId: 'bob', cardId: 'c1', createdAt: ago(1) },
      { activityType: 'moveCard', userId: 'bob', cardId: 'hidden', createdAt: ago(1) },
    ],
    cards, usernames, userId: 'me', since: ago(5),
  });
  assert.deepStrictEqual(groups, []);
});

test('a board never visited shows its last seven days', () => {
  assert.strictEqual(v.sinceOf(null, now).getTime(), now.getTime() - 7 * 24 * 3600 * 1000);
  assert.strictEqual(v.sinceOf(ago(2), now).getTime(), ago(2).getTime());
  assert.strictEqual(v.sinceOf('nonsense', now).getTime(), now.getTime() - 7 * 24 * 3600 * 1000);
});

test('the visit times stay bounded', () => {
  assert.deepStrictEqual(v.boardVisitsModifier({}, 'b1', now), { $set: { 'profile.boardVisits.b1': now } });
  const full = { a: ago(3), b: ago(1), c: ago(2) };
  const mod = v.boardVisitsModifier(full, 'd', now, 3);
  assert.deepStrictEqual(Object.keys(mod.$set['profile.boardVisits']).sort(), ['b', 'c', 'd'], 'the oldest is forgotten');
});

test('the server reads only what the caller may read; the visit is kept while hidden (negative)', () => {
  const src = read('server/methods/sinceLastVisit.js');
  assert.match(src, /async 'boards\.sinceLastVisit'[\s\S]*?if \(!\(await featureOnFor\(this\.userId, 'since-last-visit'\)\)\) return \[\];/);
  const mark = src.slice(src.indexOf("async 'boards.markVisited'"), src.indexOf("async 'boards.sinceLastVisit'"));
  assert.ok(!mark.includes('featureOnFor'), 'a visit is remembered whatever the feature');
  assert.match(src, /return board && canReadBoard\(userId, board\) \? board : null;/);
  assert.match(src, /const ID = \/\^\[A-Za-z0-9_-\]\{1,64\}\$\/;/, 'a board id cannot add a path segment');
  assert.match(src, /mergeCardScope\(\{ _id: \{ \$in: cardIds \}, boardId \}, assignedOnlyCardScope\(board, this\.userId\)\)/);
  assert.match(src, /userId: \{ \$ne: this\.userId \}/);
  assert.match(read('server/imports.js'), /import '\/server\/methods\/sinceLastVisit';/);
  assert.match(read('models/users.js'), /'profile\.boardVisits': \{[\s\S]*?blackbox: true,/);
  assert.match(read('client/components/boards/boardBody.js'), /markBoardVisited\(Session\.get\('currentBoard'\)\);/);
  const menu = read('client/components/sidebar/sidebar.jade');
  assert.match(menu, /if allowFeature 'since-last-visit'\n\s+li\n\s+a\.js-open-since-last-visit/);
  const { FEATURES } = require('../models/lib/instanceFeatures.js');
  assert.ok(FEATURES.some(f => f.key === 'since-last-visit' && f.views.length === 0));
});

console.log(`\nsinceLastVisit: ${passed} tests passed`);
