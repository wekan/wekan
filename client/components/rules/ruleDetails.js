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

// #4294 / #2953: the rule's further triggers and actions, in order.
function extraParts(ruleIdVar, kind) {
  const rule = ReactiveCache.getRule(ruleIdVar.get());
  if (!rule) return [];
  const ids = (kind === 'trigger' ? rule.extraTriggerIds : rule.extraActionIds) || [];
  return ids.map(id => {
    const doc = kind === 'trigger' ? ReactiveCache.getTrigger(id) : ReactiveCache.getAction(id);
    return { ruleId: rule._id, kind, id, text: doc ? upperFirst(localizedDescription(doc.description())) : id };
  });
}

Template.ruleDetails.helpers({
  currentRuleId() {
    return Template.currentData().ruleId.get();
  },
  extraTriggers() {
    return extraParts(Template.currentData().ruleId, 'trigger');
  },
  extraActions() {
    return extraParts(Template.currentData().ruleId, 'action');
  },
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
