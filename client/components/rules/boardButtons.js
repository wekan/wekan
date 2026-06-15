import Rules from '/models/rules';

// Renders the board's "board button" rules in the board header and runs one
// (board-level, no card) when clicked. The button metadata (type + label) is
// denormalised onto the rule document (see server/rulesButton.js), so the board
// view reads it from the published `rules` collection alone — the schemaless
// `triggers` collection's documents do not reach the client over the board
// subscription in this Meteor 3 setup.
Template.boardButtons.onCreated(function () {
  this.autorun(() => {
    const boardId = Session.get('currentBoard');
    if (boardId) this.subscribe('boardRules', boardId);
  });
});

Template.boardButtons.helpers({
  boardButtonRules() {
    const boardId = Session.get('currentBoard');
    if (!boardId) return [];
    // Read Minimongo directly (not the memoizing ReactiveCache, which can latch a
    // transient empty result during subscription churn). A stable `_id` lets
    // Blaze reuse the node across re-renders.
    return Rules.find({ boardId, buttonType: 'board' })
      .fetch()
      .map(rule => ({
        _id: rule._id,
        ruleId: rule._id,
        label: rule.buttonLabel || rule.title,
      }));
  },
});

Template.boardButtons.events({
  'click .js-run-board-button'(event) {
    event.preventDefault();
    const ruleId = event.currentTarget.getAttribute('data-rule-id');
    Meteor.call('rules.runButton', ruleId);
  },
});
