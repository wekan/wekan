BlazeComponent.extendComponent({
  onCreated() {
    this.subscribe('allRules');
    this.subscribe('allTriggers');
    this.subscribe('allActions');

  },

  trigger(){
    const ruleId = this.data().ruleId;
    const rule = Rules.findOne({_id: ruleId.get()});
    const trigger = Triggers.findOne({_id:rule.triggerId});
    console.log(trigger);
    return trigger.description();
  },
  action(){
    const ruleId = this.data().ruleId;
    const rule = Rules.findOne({_id: ruleId.get()});
    const action = Actions.findOne({_id:rule.actionId});
    console.log(action);
    return action.description();
  },

  events() {
    return [{
     }];
  },

}).register('ruleDetails');








