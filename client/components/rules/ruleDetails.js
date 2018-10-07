BlazeComponent.extendComponent({
  onCreated() {
    this.subscribe('allRules');
    this.subscribe('allTriggers');
    this.subscribe('allActions');

  },

  trigger() {
    const ruleId = this.data().ruleId;
    const rule = Rules.findOne({
      _id: ruleId.get(),
    });
    const trigger = Triggers.findOne({
      _id: rule.triggerId,
    });
    const desc = trigger.description();
    const upperdesc = desc.charAt(0).toUpperCase() + desc.substr(1);
    return upperdesc;
  },
  action() {
    const ruleId = this.data().ruleId;
    const rule = Rules.findOne({
      _id: ruleId.get(),
    });
    const action = Actions.findOne({
      _id: rule.actionId,
    });
    const desc = action.description();
    const upperdesc = desc.charAt(0).toUpperCase() + desc.substr(1);
    return upperdesc;
  },

  events() {
    return [{}];
  },

}).register('ruleDetails');
