import Triggers from '/models/triggers';
import Rules from '/models/rules';

// Lists the board's "card button" rules and runs one on the current card when
// clicked. Expects the card data context (cardId + boardId) inherited from the
// card detail template. The triggers/rules are published by the always-on
// `board` subscription, so no per-template `boardRules` subscription is needed.
function buttonRulesForBoard(boardId) {
  if (!boardId) return [];
  // Read Minimongo directly rather than via the memoizing ReactiveCache, which
  // can latch a transient empty result during subscription churn and add a
  // stable `_id` so Blaze reuses each row node.
  const triggers = Triggers.find({
    boardId,
    activityType: 'button',
    buttonType: 'card',
  }).fetch();
  return triggers
    .map(trigger => {
      const rule = Rules.findOne({ triggerId: trigger._id });
      if (!rule) return null;
      return { _id: rule._id, ruleId: rule._id, label: trigger.buttonLabel || rule.title };
    })
    .filter(Boolean);
}

Template.cardButtons.helpers({
  hasCardButtons() {
    return buttonRulesForBoard(this.boardId).length > 0;
  },
  cardButtonRules() {
    return buttonRulesForBoard(this.boardId);
  },
});

Template.cardButtons.events({
  'click .js-run-card-button'(event, tpl) {
    event.preventDefault();
    const ruleId = event.currentTarget.getAttribute('data-rule-id');
    const cardId = tpl.data && tpl.data._id;
    Meteor.call('rules.runButton', ruleId, cardId);
  },
});
