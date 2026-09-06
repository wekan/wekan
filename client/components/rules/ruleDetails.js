import { ReactiveCache } from '/imports/reactiveCache';
import { TAPi18n } from '/imports/i18n';
import { localizedStoredRuleDescription } from '/models/lib/ruleDescriptionLocalization';

function localizedDescription(description) {
  return localizedStoredRuleDescription(
    description,
    key => TAPi18n.__(key),
    TAPi18n.getDefaultTranslations('r-'),
  );
}

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
    return localizedDescription(trigger.description());
  },
  action() {
    const ruleId = Template.currentData().ruleId;
    const rule = ReactiveCache.getRule(ruleId.get());
    if (!rule) return '';
    const action = ReactiveCache.getAction(rule.actionId);
    if (!action) return '';
    return localizedDescription(action.description());
  },
});
