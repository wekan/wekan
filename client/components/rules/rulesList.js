BlazeComponent.extendComponent({
  onCreated() {
    this.subscribe('allRules');
  },

  rules() {
    return Rules.find({});
  },
  events() {
    return [{}];
  },
}).register('rulesList');