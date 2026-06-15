import Rules from '/models/rules';

// Lists the board's "card button" rules and runs one on the current card when
// clicked. Expects the card data context (cardId + boardId) inherited from the
// card detail template. The button metadata is denormalised onto the rule (see
// server/rulesButton.js), so this reads from the published `rules` collection
// alone — the schemaless `triggers` collection does not reach the client over
// the board subscription in this Meteor 3 setup.
Template.cardButtons.onCreated(function () {
  this.autorun(() => {
    const boardId = this.data && this.data.boardId;
    if (boardId) this.subscribe('boardRules', boardId);
  });
});

function buttonRulesForBoard(boardId) {
  if (!boardId) return [];
  return Rules.find({ boardId, buttonType: 'card' })
    .fetch()
    .map(rule => ({
      _id: rule._id,
      ruleId: rule._id,
      label: rule.buttonLabel || rule.title,
    }));
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
