'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '../models/cards.js'), 'utf8');
const start = source.indexOf('async function cardMembers(');
const end = source.indexOf('async function cardLabels(', start);
assert.ok(start >= 0 && end > start, 'membership activity hooks are present');

function hooks(user) {
  const activities = [];
  const context = {
    ReactiveCache: { getUser: async () => user },
    Activities: { insertAsync: async activity => activities.push(activity) },
  };
  vm.runInNewContext(source.slice(start, end), context);
  return { ...context, activities };
}

for (const [field, hook, idKey, joined, removed] of [
  ['members', 'cardMembers', 'memberId', 'joinMember', 'unjoinMember'],
  ['assignees', 'cardAssignees', 'assigneeId', 'joinAssignee', 'unjoinAssignee'],
]) {
  const card = { _id: 'card', boardId: 'board', listId: 'list', swimlaneId: 'lane' };

  test(`${field}: removing an absent user is a no-op without activity`, async () => {
    const h = hooks(undefined);
    for (const membership of [undefined, [], ['other']]) {
      await h[hook]('actor', { ...card, [field]: membership }, [field], { $pull: { [field]: 'missing' } });
    }
    assert.equal(h.activities.length, 0);
  });

  test(`${field}: a deleted user's assignment can be removed and recorded`, async () => {
    const h = hooks(undefined);
    await h[hook]('actor', { ...card, [field]: ['deleted'] }, [field], { $pull: { [field]: 'deleted' } });
    assert.equal(h.activities.length, 1);
    assert.deepEqual({ ...h.activities[0] }, {
      userId: 'actor', username: undefined, activityType: removed,
      boardId: card.boardId, cardId: card._id, [idKey]: 'deleted',
      listId: card.listId, swimlaneId: card.swimlaneId,
    });
  });

  test(`${field}: normal joins and removals retain the username and activity scope`, async () => {
    const h = hooks({ username: 'member' });
    await h[hook]('actor', { ...card, [field]: [] }, [field], { $addToSet: { [field]: 'member' } });
    await h[hook]('actor', { ...card, [field]: ['member'] }, [field], { $pull: { [field]: 'member' } });
    assert.deepEqual(h.activities.map(activity => activity.activityType), [joined, removed]);
    for (const activity of h.activities) {
      assert.equal(activity.username, 'member');
      assert.equal(activity[idKey], 'member');
      assert.equal(activity.userId, 'actor');
      assert.equal(activity.cardId, card._id);
    }
    await h[hook]('actor', { ...card, [field]: [] }, [field], { $pull: { [field]: 'member' } });
    await h[hook]('actor', { ...card, [field]: ['member'] }, ['title'], { $pull: { [field]: 'member' } });
    assert.equal(h.activities.length, 2);
  });
}

// The join halves had the same unguarded user.username (#6889 follow-up):
// REST checks the user before adding, but a client $addToSet, a copied or
// imported card, or a rule can add an id whose account is gone.
for (const [field, hook, idKey, joined] of [
  ['members', 'cardMembers', 'memberId', 'joinMember'],
  ['assignees', 'cardAssignees', 'assigneeId', 'joinAssignee'],
]) {
  test(`${field}: adding a user whose account is gone does not throw, and records the id`, async () => {
    const h = hooks(undefined);
    const card = { _id: 'card', boardId: 'board', listId: 'list', swimlaneId: 'lane' };
    await assert.doesNotReject(() => h[hook]('actor', { ...card, [field]: [] }, [field], { $addToSet: { [field]: 'gone' } }));
    assert.equal(h.activities.length, 1);
    assert.equal(h.activities[0].activityType, joined);
    assert.equal(h.activities[0][idKey], 'gone');
    assert.equal(h.activities[0].username, undefined);
  });
}

// Negative, tree-wide: a user looked up is never dereferenced before it is
// known to exist - the shape both halves of #6889 had.
test('nowhere: `const x = user.field;` straight after getUser() without a guard', () => {
  const root = path.join(__dirname, '..');
  const offenders = [];
  const walk = dir => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      if (['node_modules', '.meteor', 'tests', 'packages', 'public'].includes(e.name) || e.name.startsWith('_build') || e.name.startsWith('.')) continue;
      const p = path.join(dir, e.name);
      if (e.isDirectory()) walk(p);
      else if (p.endsWith('.js')) {
        const lines = fs.readFileSync(p, 'utf8').split('\n');
        lines.forEach((line, i) => {
          const m = /const (\w+) = await ReactiveCache\.getUser\(/.exec(line);
          if (!m) return;
          const next = (lines.slice(i + 1).find(l => l.trim()) || '').trim();
          if (new RegExp(`^const \\w+ = ${m[1]}\\.\\w+;`).test(next)) offenders.push(`${path.relative(root, p)}:${i + 2}`);
        });
      }
    }
  };
  for (const dir of ['server', 'models', 'client', 'imports']) walk(path.join(root, dir));
  assert.deepEqual(offenders, []);
});
