import { ReactiveCache } from '/imports/reactiveCache';

BlazeComponent.extendComponent({
  onCreated() {
    this.subscribe('allRules');
    this.subscribe('allTriggers');
    this.subscribe('allActions');
    // Ensure boards are available on the client so board selects in the
    // Rules UI (move/link actions) can list other boards the user has access to.
    // Without this subscription the select may be empty and users can't choose
    // destination boards for rule actions.
    this.subscribe('boards');
  },

  trigger() {
    const ruleId = this.data().ruleId;
    const rule = ReactiveCache.getRule(ruleId.get());
    const trigger = ReactiveCache.getTrigger(rule.triggerId);
    const desc = trigger.description();
    const upperdesc = desc.charAt(0).toUpperCase() + desc.substr(1);
    return upperdesc;
  },
  action() {
    const ruleId = this.data().ruleId;
    const rule = ReactiveCache.getRule(ruleId.get());
    const action = ReactiveCache.getAction(rule.actionId);
    const desc = action.description();
    const upperdesc = desc.charAt(0).toUpperCase() + desc.substr(1);
    return upperdesc;
  },

  events() {
    return [{}];
  },
}).register('ruleDetails');
