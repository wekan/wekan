// #2713: shared by every trigger/action "create the rule" button across
// boardActions.js, cardActions.js, checklistActions.js and mailActions.js.
// When the wizard was opened through rulesList's "Edit" button, the data
// context carries a `ruleId` ReactiveVar holding the rule being edited; this
// updates that rule's trigger/action IN PLACE (server/rulesButton.js ->
// rules.updateRule) instead of creating a brand-new rule. Otherwise it falls
// back to the normal create path (rules.createRule), same as before.
export function saveRuleTriggerAction(boardId, ruleIdVar, ruleName, trigger, actionDoc) {
  const ruleId =
    ruleIdVar && typeof ruleIdVar.get === 'function' ? ruleIdVar.get() : null;
  if (ruleId) {
    Meteor.call('rules.updateRule', ruleId, ruleName, trigger, actionDoc);
  } else {
    Meteor.call('rules.createRule', boardId, ruleName, trigger, actionDoc);
  }
}
