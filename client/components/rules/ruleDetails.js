BlazeComponent.extendComponent({
  onCreated() {
    this.subscribe('allRules');
  },

  trigger(){
    const rule = Rules.findOne({_id:ruleId});
    return Triggers.findOne({_id:rule.triggerId});
  },
  action(){
    const rule = Rules.findOne({_id:ruleId});
    return Triggers.findOne({_id:rule.actionId});
  },

  events() {
    return [{
     }];
  },

}).register('ruleDetails');








