import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import { ReactiveCache } from '/imports/reactiveCache';
import { RulesHelper } from '/server/rulesHelper';
import Rules from '/models/rules';
import Triggers from '/models/triggers';
import Actions from '/models/actions';
import { canDeleteBoardRule } from '/models/lib/ruleDeletePermission';

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
    // #5536: an action's own boardId is the DESTINATION board (e.g. "move card
    // to board X" / "link card to board X"). Let it win over the source boardId
    // so cross-board move/link rules created through this method keep their
    // target — only fall back to the source board when the action omits one.
    // #6472: "omits" must include an EMPTY boardId (a not-yet-loaded board
    // select posts ''), which the spread would otherwise let override the
    // fallback and make every list lookup in the action fail silently.
    const actionDoc = { boardId, ...clean(action) };
    if (!actionDoc.boardId) actionDoc.boardId = boardId;
    const actionId = await Actions.insertAsync(actionDoc);
    const ruleDoc = {
      title: title || 'Rule',
      triggerId,
      actionId,
      boardId,
    };
    // Denormalise manual-button metadata onto the rule. The board view renders
    // its board/card buttons from the rule document alone, because in this Meteor
    // 3 setup the schemaless `triggers` collection's documents do not reach the
    // client over the board subscription (the schema-backed `rules` collection
    // does), so reading the label off the published trigger would leave the
    // button blank/absent.
    if (trigger && trigger.activityType === 'button') {
      ruleDoc.buttonType = trigger.buttonType || 'card';
      ruleDoc.buttonLabel = trigger.buttonLabel || title || 'Run';
    }
    const ruleId = await Rules.insertAsync(ruleDoc);
    return { _id: ruleId, triggerId, actionId };
  },

  // Delete a rule (and its trigger + action) on the server in one call. The rule
  // wizard/list/workflow views previously ran three client-side
  // Collection.remove() calls; each is gated by a per-collection allow() rule
  // that resolves the board from that document's own boardId. A Trigger/Action
  // whose boardId does not resolve to a board (legacy docs, or docs not
  // published to the client) made the allow rule return false and Meteor
  // rejected the mutation with 403 "Access denied", failing the delete even for
  // a board admin. Authorizing once here and removing all three docs server-side
  // (which bypasses allow/deny) fixes that without loosening any permission.
  async 'rules.deleteRule'(ruleId) {
    check(ruleId, String);

    const rule = await ReactiveCache.getRule(ruleId);
    if (!rule) throw new Meteor.Error('not-found', 'Rule not found');

    const board = await ReactiveCache.getBoard(rule.boardId);
    if (!board) throw new Meteor.Error('not-found', 'Board not found');

    const user = await ReactiveCache.getUser(this.userId);
    if (!canDeleteBoardRule(board, this.userId, { isSiteAdmin: !!(user && user.isAdmin) })) {
      throw new Meteor.Error('not-authorized', 'Must be a board admin');
    }

    await Rules.removeAsync(rule._id);
    if (rule.triggerId) await Triggers.removeAsync(rule.triggerId);
    if (rule.actionId) await Actions.removeAsync(rule.actionId);
    return { _id: rule._id };
  },
});
