import Boards from '/models/boards';
import Actions from '/models/actions';
import Triggers from '/models/triggers';
import Rules from '/models/rules';
import { ReactiveCache } from '/imports/reactiveCache';

Meteor.publish('rules', async function(ruleId) {
  check(ruleId, String);

  if (!this.userId) {
    return this.ready();
  }

  const rule = await ReactiveCache.getRule(ruleId);
  if (!rule) {
    return this.ready();
  }

  const board = await ReactiveCache.getBoard(rule.boardId);
  if (!board || !board.isVisibleBy(this.userId)) {
    return this.ready();
  }

  const ret = await ReactiveCache.getRules(
    {
      _id: ruleId,
    },
    {},
    true,
  );
  return ret;
});

Meteor.publish('allRules', async function() {
  if (!this.userId || !(await ReactiveCache.getUser(this.userId)).isAdmin) {
    return this.ready();
  }

  const ret = await ReactiveCache.getRules({}, {}, true);
  return ret;
});

Meteor.publish('allTriggers', async function() {
  if (!this.userId || !(await ReactiveCache.getUser(this.userId)).isAdmin) {
    return this.ready();
  }

  const ret = await ReactiveCache.getTriggers({}, {}, true);
  return ret;
});

Meteor.publish('allActions', async function() {
  if (!this.userId || !(await ReactiveCache.getUser(this.userId)).isAdmin) {
    return this.ready();
  }

  const ret = await ReactiveCache.getActions({}, {}, true);
  return ret;
});

Meteor.publish('rulesReport', async function() {
  if (!this.userId || !(await ReactiveCache.getUser(this.userId)).isAdmin) {
    return this.ready();
  }

  const rules = await ReactiveCache.getRules({}, {}, true);
  const actionIds = [];
  const triggerIds = [];
  const boardIds = [];

  rules.forEach(rule => {
    actionIds.push(rule.actionId);
    triggerIds.push(rule.triggerId);
    boardIds.push(rule.boardId);
  });

  const ret = [
    rules,
    await ReactiveCache.getActions({ _id: { $in: actionIds } }, {}, true),
    await ReactiveCache.getTriggers({ _id: { $in: triggerIds } }, {}, true),
    await ReactiveCache.getBoards({ _id: { $in: boardIds } }, { fields: { title: 1 } }, true),
  ];
  return ret;
});
