'use strict';

// A rule's triggers and actions (maintainer decision 2026-09-29, #4294 /
// #2953): a rule keeps its original triggerId/actionId and may add more in
// extraTriggerIds/extraActionIds. It fires when ANY of its triggers fires,
// once per activity, and runs its actions in order - the original first.
const MAX_EXTRA_RULE_PARTS = 10;

function ids(first, extra) {
  const list = [first].concat(Array.isArray(extra) ? extra : []);
  return [...new Set(list.filter(id => typeof id === 'string' && id))];
}

function ruleTriggerIds(rule) {
  return rule ? ids(rule.triggerId, rule.extraTriggerIds) : [];
}

function ruleActionIds(rule) {
  return rule ? ids(rule.actionId, rule.extraActionIds) : [];
}

// A rule matched through several of its triggers still runs once.
function uniqueRules(rules) {
  const seen = new Set();
  return (rules || []).filter(rule => {
    if (!rule || !rule._id || seen.has(rule._id)) return false;
    seen.add(rule._id);
    return true;
  });
}

// The selector for "the rule this trigger belongs to".
function ruleForTriggerSelector(triggerId) {
  return { $or: [{ triggerId }, { extraTriggerIds: triggerId }] };
}

// A copied or imported rule points at the copies of ALL its triggers and
// actions. An extra part that was not copied is dropped rather than left
// pointing at the source board's document.
function remapRuleParts(rule, triggersMap, actionsMap) {
  // Extras are unique and never repeat the rule's own trigger/action.
  const mapped = (ids, map, own) => (Array.isArray(ids)
    ? [...new Set(ids.map(id => map[id]).filter(id => id && id !== own))] : ids);
  rule.triggerId = triggersMap[rule.triggerId];
  rule.actionId = actionsMap[rule.actionId];
  if (rule.extraTriggerIds !== undefined) rule.extraTriggerIds = mapped(rule.extraTriggerIds, triggersMap, rule.triggerId);
  if (rule.extraActionIds !== undefined) rule.extraActionIds = mapped(rule.extraActionIds, actionsMap, rule.actionId);
  return rule;
}

module.exports = { MAX_EXTRA_RULE_PARTS, ruleTriggerIds, ruleActionIds, uniqueRules, ruleForTriggerSelector, remapRuleParts };
