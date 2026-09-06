import { ReactiveCache } from '/imports/reactiveCache';
import { TAPi18n } from '/imports/i18n';
import { localizeStoredRuleDescription } from '/models/lib/ruleDescriptionLocalization';

function localizedDescription(description) {
  const sources = TAPi18n.getDefaultTranslations('r-');
  const translations = Object.entries(sources).map(([key, source]) => ({
    source,
    translated: TAPi18n.__(key),
  }));
  return localizeStoredRuleDescription(description, translations);
}

function upperFirst(value) {
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : '';
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
    return upperFirst(localizedDescription(trigger.description()));
  },
  action() {
    const ruleId = Template.currentData().ruleId;
    const rule = ReactiveCache.getRule(ruleId.get());
    if (!rule) return '';
    const action = ReactiveCache.getAction(rule.actionId);
    if (!action) return '';
    return upperFirst(localizedDescription(action.description()));
  },
});
