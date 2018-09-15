BlazeComponent.extendComponent({
  onCreated() {
    this.subscribe('allRules');
  },

  rules() {
    const boardId = Session.get('currentBoard');
    return Rules.find({
      boardId,
    });
  },
  events() {
    return [{}];
  },
}).register('rulesList');
