import { ReactiveCache } from '/imports/reactiveCache';

Template.rulesList.onCreated(function () {
  this.subscribe('allRules');
});

Template.rulesList.helpers({
  rules() {
    const boardId = Session.get('currentBoard');
    const ret = ReactiveCache.getRules({
      boardId,
    });
    return ret;
  },
});
