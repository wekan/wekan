import Boards from '/models/boards';
import Actions from '/models/actions';
import Triggers from '/models/triggers';
import Rules from '/models/rules';
import { ReactiveCache } from '/imports/reactiveCache';

Meteor.publish('rules', function(ruleId) {
  check(ruleId, String);

  if (!this.userId) {
    return this.ready();
  }

  const rule = ReactiveCache.getRule(ruleId);
  if (!rule) {
    return this.ready();
  }

  const board = ReactiveCache.getBoard(rule.boardId);
  if (!board || !board.isVisibleBy(this.userId)) {
    return this.ready();
  }

  const ret = ReactiveCache.getRules(
    {
      _id: ruleId,
    },
    {},
    true,
  );
  return ret;
});

Meteor.publish('allRules', function() {
  if (!this.userId || !ReactiveCache.getUser(this.userId).isAdmin) {
    return this.ready();
  }

  const ret = ReactiveCache.getRules({}, {}, true);
  return ret;
});

Meteor.publish('allTriggers', function() {
  if (!this.userId || !ReactiveCache.getUser(this.userId).isAdmin) {
    return this.ready();
  }

  const ret = ReactiveCache.getTriggers({}, {}, true);
  return ret;
});

Meteor.publish('allActions', function() {
  if (!this.userId || !ReactiveCache.getUser(this.userId).isAdmin) {
    return this.ready();
  }

  const ret = ReactiveCache.getActions({}, {}, true);
  return ret;
});

Meteor.publish('rulesReport', function() {
  if (!this.userId || !ReactiveCache.getUser(this.userId).isAdmin) {
    return this.ready();
  }

  const rules = ReactiveCache.getRules({}, {}, true);
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
    ReactiveCache.getActions({ _id: { $in: actionIds } }, {}, true),
    ReactiveCache.getTriggers({ _id: { $in: triggerIds } }, {}, true),
    ReactiveCache.getBoards({ _id: { $in: boardIds } }, { fields: { title: 1 } }, true),
  ];
  return ret;
});
