import Boards from '/models/boards';
import Actions from '/models/actions';
import Triggers from '/models/triggers';
import Rules from '/models/rules';

Meteor.publish('rules', ruleId => {
  check(ruleId, String);
  return Rules.find({
    _id: ruleId,
  });
});

Meteor.publish('allRules', () => {
  return Rules.find({});
});

Meteor.publish('allTriggers', () => {
  return Triggers.find({});
});

Meteor.publish('allActions', () => {
  return Actions.find({});
});

Meteor.publish('rulesReport', () => {
  const rules = Rules.find();
  const actionIds = [];
  const triggerIds = [];
  const boardIds = [];

  rules.forEach(rule => {
    actionIds.push(rule.actionId);
    triggerIds.push(rule.triggerId);
    boardIds.push(rule.boardId);
  });

  return [
    rules,
    Actions.find({ _id: { $in: actionIds } }),
    Triggers.find({ _id: { $in: triggerIds } }),
    Boards.find({ _id: { $in: boardIds } }, { fields: { title: 1 } }),
  ];
});
