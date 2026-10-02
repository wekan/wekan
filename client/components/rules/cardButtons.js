import Rules from '/models/rules';
import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';
import { Utils } from '/client/lib/utils';

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

// Card buttons, Show on Minicard: the same rule buttons under each minicard.
// They read the rules from the ONE board-level subscription below, never one
// per minicard; a click runs the rule and does not open the card.
Template.minicardCardButtons.helpers({
  hasCardButtons() {
    return buttonRulesForBoard(this.boardId).length > 0;
  },
  cardButtonRules() {
    return buttonRulesForBoard(this.boardId);
  },
});

Template.minicardCardButtons.events({
  'click .js-run-minicard-card-button'(event, tpl) {
    event.preventDefault();
    event.stopPropagation();
    const ruleId = event.currentTarget.getAttribute('data-rule-id');
    const cardId = tpl.data && tpl.data._id;
    Meteor.call('rules.runButton', ruleId, cardId);
  },
});

Meteor.startup(() => {
  Tracker.autorun(() => {
    const board = Utils.getCurrentBoard();
    // Stopped by the autorun itself when the board or the setting changes.
    if (board && board.allowsCardButtonsOnMinicard === true) Meteor.subscribe('boardRules', board._id);
  });
});
