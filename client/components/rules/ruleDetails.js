import { ReactiveCache } from '/imports/reactiveCache';

Template.ruleDetails.onCreated(function () {
  this.subscribe('allRules');
  this.subscribe('allTriggers');
  this.subscribe('allActions');
  this.subscribe('boards');
});

Template.ruleDetails.helpers({
  trigger() {
    const ruleId = Template.currentData().ruleId;
    const rule = ReactiveCache.getRule(ruleId.get());
    if (!rule) return '';
    const trigger = ReactiveCache.getTrigger(rule.triggerId);
    if (!trigger) return '';
    const desc = trigger.description();
    const upperdesc = desc.charAt(0).toUpperCase() + desc.substr(1);
    return upperdesc;
  },
  action() {
    const ruleId = Template.currentData().ruleId;
    const rule = ReactiveCache.getRule(ruleId.get());
    if (!rule) return '';
    const action = ReactiveCache.getAction(rule.actionId);
    if (!action) return '';
    const desc = action.description();
    const upperdesc = desc.charAt(0).toUpperCase() + desc.substr(1);
    return upperdesc;
  },
});
