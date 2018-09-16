Meteor.publish('rules', (ruleId) => {
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
