import { ReactiveCache } from '/imports/reactiveCache';

BlazeComponent.extendComponent({
  onCreated() {
    this.subscribe('allRules');
  },

  rules() {
    const boardId = Session.get('currentBoard');
    const ret = ReactiveCache.getRules({
      boardId,
    });
    return ret;
  },
  events() {
    return [{}];
  },
}).register('rulesList');
