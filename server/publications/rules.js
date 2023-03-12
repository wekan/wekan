import Boards from '/models/boards';
import Actions from '/models/actions';
import Triggers from '/models/triggers';
import Rules from '/models/rules';

Meteor.publish('rules', ruleId => {
  check(ruleId, String);
  const ret = ReactiveCache.getRules(
    {
      _id: ruleId,
    },
    {},
    true,
  );
  return ret;
});

Meteor.publish('allRules', () => {
  const ret = ReactiveCache.getRules({}, {}, true);
  return ret;
});

Meteor.publish('allTriggers', () => {
  const ret = ReactiveCache.getTriggers({}, {}, true);
  return ret;
});

Meteor.publish('allActions', () => {
  const ret = ReactiveCache.getActions({}, {}, true);
  return ret;
});

Meteor.publish('rulesReport', () => {
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
