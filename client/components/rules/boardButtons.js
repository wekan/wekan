import Triggers from '/models/triggers';
import Rules from '/models/rules';

// Renders the board's "board button" rules in the board header and runs one
// (board-level, no card) when clicked. The triggers/rules/actions are published
// by the always-on `board` subscription (server/publications/boards.js); this
// template deliberately does NOT manage its own `boardRules` subscription, which
// would otherwise race the /rules page's subscription on navigation and drop the
// trigger documents from minimongo.
Template.boardButtons.helpers({
  boardButtonRules() {
    const boardId = Session.get('currentBoard');
    if (!boardId) return [];
    // Read Minimongo directly rather than via the memoizing ReactiveCache: the
    // header subtemplate re-renders while the board subscription settles, and the
    // cache can latch a transient empty result, making the button flicker out.
    // A stable `_id` lets Blaze reuse the node across re-renders.
    const triggers = Triggers.find({
      boardId,
      activityType: 'button',
      buttonType: 'board',
    }).fetch();
    return triggers
      .map(trigger => {
        const rule = Rules.findOne({ triggerId: trigger._id });
        if (!rule) return null;
        return { _id: rule._id, ruleId: rule._id, label: trigger.buttonLabel || rule.title };
      })
      .filter(Boolean);
  },
});

Template.boardButtons.events({
  'click .js-run-board-button'(event) {
    event.preventDefault();
    const ruleId = event.currentTarget.getAttribute('data-rule-id');
    Meteor.call('rules.runButton', ruleId);
  },
});
