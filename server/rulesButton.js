import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import { ReactiveCache } from '/imports/reactiveCache';
import { RulesHelper } from '/server/rulesHelper';
import Rules from '/models/rules';
import Triggers from '/models/triggers';
import Actions from '/models/actions';

// Button rules are manual: a user clicks a card/board button and we run the
// rule's action immediately. This method runs one button rule on demand.
Meteor.methods({
  async 'rules.runButton'(ruleId, cardId) {
    check(ruleId, String);
    check(cardId, Match.Optional(String));

    const rule = await ReactiveCache.getRule(ruleId);
    if (!rule) throw new Meteor.Error('not-found', 'Rule not found');

    const trigger = await ReactiveCache.getTrigger(rule.triggerId);
    if (!trigger || trigger.activityType !== 'button') {
      throw new Meteor.Error('not-a-button', 'Rule is not a button rule');
    }

    // The user must be a member of the board the rule belongs to.
    const board = await ReactiveCache.getBoard(rule.boardId);
    if (!board || !board.hasMember(this.userId)) {
      throw new Meteor.Error('not-authorized', 'Not a board member');
    }

    const action = await ReactiveCache.getAction(rule.actionId);
    if (!action) throw new Meteor.Error('not-found', 'Action not found');

    await RulesHelper.performAction(
      {
        activityType: 'button',
        cardId,
        boardId: rule.boardId,
        userId: this.userId,
      },
      action,
    );
    return true;
  },

  // Create a rule (trigger + action + rule) on the server in one call. The rule
  // wizard previously did three client-side Collection.insert() calls; those are
  // optimistic writes whose documents end up in client-minimongo limbo once the
  // wizard's `boardRules` subscription stops on navigation, so a freshly created
  // board-button's trigger never re-published to the board view (the button only
  // appeared after a full page reload). Inserting on the server avoids the
  // optimistic-ghost reconciliation problem entirely.
  async 'rules.createRule'(boardId, title, trigger, action) {
    check(boardId, String);
    check(title, Match.Optional(String));
    check(trigger, Object);
    check(action, Object);

    const board = await ReactiveCache.getBoard(boardId);
    if (!board) throw new Meteor.Error('not-found', 'Board not found');
    if (!board.hasAdmin(this.userId)) {
      throw new Meteor.Error('not-authorized', 'Must be a board admin');
    }

    const clean = doc => {
      const { _id, ...rest } = doc || {};
      return rest;
    };

    const triggerId = await Triggers.insertAsync({ ...clean(trigger), boardId });
    const actionId = await Actions.insertAsync({ ...clean(action), boardId });
    const ruleId = await Rules.insertAsync({
      title: title || 'Rule',
      triggerId,
      actionId,
      boardId,
    });
    return { _id: ruleId, triggerId, actionId };
  },
});
