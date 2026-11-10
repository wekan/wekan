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
