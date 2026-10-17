'use strict';

// Rule suggestions (docs/Features/Rules/Rule-Suggestions.md): which pairs of
// actions become a suggestion, which never do, and who may see or create them.
//
// Run: node tests/ruleSuggestions.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const r = require('../models/lib/ruleSuggestions.js');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

const board = {
  boardId: 'b1',
  lists: { todo: 'To Do', done: 'Done' },
  labels: { urgent: 'Urgent', bug: 'Bug' },
  usernames: { alice: 'alice', bob: 'bob' },
};
const t0 = new Date('2026-10-01T10:00:00Z').getTime();
const at = s => new Date(t0 + s * 1000);

// Card cN moved to Done by alice, archived `gap` seconds later.
function movedThenArchived(n, gap = 30) {
  const out = [];
  for (let i = 0; i < n; i += 1) {
    out.push({ activityType: 'moveCard', cardId: `c${i}`, userId: 'alice', listId: 'done', createdAt: at(i * 600) });
    out.push({ activityType: 'archivedCard', cardId: `c${i}`, userId: 'alice', createdAt: at(i * 600 + gap) });
  }
  return out;
}

console.log('ruleSuggestions:');

test('moved to Done, then archived, on three cards: archive on move to Done', () => {
  const [s] = r.ruleSuggestions(movedThenArchived(3), board);
  assert.ok(s, 'a suggestion');
  assert.strictEqual(s.count, 3);
  assert.deepStrictEqual(s.trigger, { activityType: 'moveCard', boardId: 'b1', listName: 'Done', cardTitle: '*', swimlaneName: '*', oldListName: '*' });
  assert.deepStrictEqual(s.action, { actionType: 'archive', boardId: 'b1' });
  assert.strictEqual(s.triggerName, 'Done');
});

test('labels and members as actions, and a label as a trigger', () => {
  const acts = [];
  for (let i = 0; i < 4; i += 1) {
    acts.push({ activityType: 'createCard', cardId: `n${i}`, userId: 'bob', listId: 'todo', createdAt: at(i * 900) });
    acts.push({ activityType: 'addedLabel', cardId: `n${i}`, userId: 'bob', labelId: 'bug', createdAt: at(i * 900 + 5) });
    acts.push({ activityType: 'joinMember', cardId: `n${i}`, userId: 'bob', memberId: 'alice', createdAt: at(i * 900 + 9) });
  }
  const got = r.ruleSuggestions(acts, board);
  const kinds = got.map(s => `${s.triggerKind}->${s.actionKind}`).sort();
  assert.deepStrictEqual(kinds, ['created->addLabel', 'created->addMember', 'label->addMember']);
  const member = got.find(s => s.actionKind === 'addMember' && s.triggerKind === 'created');
  assert.deepStrictEqual(member.action, { actionType: 'addMember', boardId: 'b1', username: 'alice' });
  const label = got.find(s => s.triggerKind === 'label');
  assert.deepStrictEqual(label.trigger, { activityType: 'addedLabel', boardId: 'b1', labelId: 'bug' });
});

test('what is never a suggestion (negative)', () => {
  assert.deepStrictEqual(r.ruleSuggestions(movedThenArchived(2), board), [], 'two cards are not a habit');
  assert.deepStrictEqual(r.ruleSuggestions(movedThenArchived(3, 300), board), [], 'five minutes apart is not one action');
  // Three times on ONE card counts once.
  const sameCard = movedThenArchived(3).map(a => ({ ...a, cardId: 'c0' }));
  assert.deepStrictEqual(r.ruleSuggestions(sameCard, board), []);
  // Different people: the move by one, the archive by another.
  const split = movedThenArchived(3).map(a => (a.activityType === 'archivedCard' ? { ...a, userId: 'bob' } : a));
  assert.deepStrictEqual(r.ruleSuggestions(split, board), []);
  // A list that is gone, a member who left.
  assert.deepStrictEqual(r.ruleSuggestions(movedThenArchived(3), { ...board, lists: {} }), []);
  // An archive first, a move after, is not "archive when moved".
  const reversed = movedThenArchived(3).map(a => ({ ...a, createdAt: a.activityType === 'archivedCard' ? new Date(a.createdAt.getTime() - 60000) : a.createdAt }));
  assert.deepStrictEqual(r.ruleSuggestions(reversed, board), []);
});

test('a rule that already does it, and a dismissed one, are not suggested (negative)', () => {
  const [s] = r.ruleSuggestions(movedThenArchived(3), board);
  const existing = [{ trigger: { activityType: 'moveCard', listName: 'Done' }, action: { actionType: 'archive' } }];
  assert.deepStrictEqual(r.ruleSuggestions(movedThenArchived(3), board, { existing }), []);
  const anyList = [{ trigger: { activityType: 'moveCard', listName: '*' }, action: { actionType: 'archive' } }];
  assert.deepStrictEqual(r.ruleSuggestions(movedThenArchived(3), board, { existing: anyList }), []);
  const otherList = [{ trigger: { activityType: 'moveCard', listName: 'To Do' }, action: { actionType: 'archive' } }];
  assert.strictEqual(r.ruleSuggestions(movedThenArchived(3), board, { existing: otherList }).length, 1);
  assert.deepStrictEqual(r.ruleSuggestions(movedThenArchived(3), board, { dismissed: [s.key] }), []);
});

test('a dismissed key is only ever a suggestion key (negative)', () => {
  const [s] = r.ruleSuggestions(movedThenArchived(3), board);
  assert.strictEqual(r.isSuggestionKey(s.key), true);
  for (const bad of ['', 'x', '{}', '[1,2]', JSON.stringify([{ kind: 'nope' }, {}]), 'a'.repeat(400), 42]) {
    assert.strictEqual(r.isSuggestionKey(bad), false, String(bad).slice(0, 20));
  }
});

test('only a board admin, only while the feature is on, and creating is rules.createRule', () => {
  const src = read('server/methods/ruleSuggestions.js');
  assert.match(src, /if \(!\(await featureOnFor\(userId, 'rule-suggestions'\)\)\) return null;/);
  assert.match(src, /return board && board\.hasAdmin\(userId\) \? board : null;/);
  assert.match(src, /if \(!isSuggestionKey\(key\)\) throw/);
  assert.match(src, /\$addToSet: \{ \[`profile\.dismissedRuleSuggestions\.\$\{boardId\}`\]: key \}/);
  assert.match(src, /const ID = \/\^\[A-Za-z0-9_-\]\{1,64\}\$\/;/, 'a board id cannot add a path segment (negative)');
  assert.match(read('server/imports.js'), /import '\/server\/methods\/ruleSuggestions';/);
  const client = read('client/components/rules/ruleSuggestions.js');
  assert.match(client, /Meteor\.call\('rules\.createRule', boardId, '',/);
  assert.match(client, /allowFeature\('rule-suggestions'\)/);
  assert.match(read('client/components/rules/rulesMain.jade'), /\+ruleSuggestions\n\s+\+rulesList/);
  assert.match(read('models/users.js'), /'profile\.dismissedRuleSuggestions': \{[\s\S]*?blackbox: true,/);
  const { FEATURES } = require('../models/lib/instanceFeatures.js');
  assert.ok(FEATURES.some(f => f.key === 'rule-suggestions' && f.views.length === 0), 'Admin Panel / Visibility / Features');
});

console.log(`\nruleSuggestions: ${passed} tests passed`);
