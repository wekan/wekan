import { withRuleHistory, removeRuleWithUnusedParts, writeRuleComponent } from '/server/lib/ruleHistory';
import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import { ReactiveCache } from '/imports/reactiveCache';
import { RulesHelper } from '/server/rulesHelper';
import Rules from '/models/rules';
import Triggers from '/models/triggers';
import Actions from '/models/actions';
import { canDeleteBoardRule } from '/models/lib/ruleDeletePermission';
import { allowIsBoardMemberWithWriteAccess } from '/server/lib/utils';
import { tripCanary } from '/server/lib/canary';
import { requireButtonRuleContext } from '/models/lib/buttonRulePermission';
import { ruleActionIds, MAX_EXTRA_RULE_PARTS } from '/models/lib/ruleParts';

// Button rules are manual: a user clicks a card/board button and we run the
// rule's action immediately. This method runs one button rule on demand.
Meteor.methods({
  async 'rules.runButton'(ruleId, cardId) {
    check(ruleId, String);
    check(cardId, Match.Optional(String));
    if (!this.userId) throw new Meteor.Error('not-authorized');

    const rule = await ReactiveCache.getRule(ruleId);
    if (!rule) throw new Meteor.Error('not-found', 'Rule not found');

    const trigger = await ReactiveCache.getTrigger(rule.triggerId);
    if (!trigger || trigger.activityType !== 'button') {
      throw new Meteor.Error('not-a-button', 'Rule is not a button rule');
    }

    // A manual rule is a write, and its card must be on the rule's board.
    const board = await ReactiveCache.getBoard(rule.boardId);
    const card = cardId === undefined ? undefined : await ReactiveCache.getCard(cardId);
    requireButtonRuleContext(this.userId, board, cardId, card, Meteor);

    // A rule runs each of its actions in order (models/lib/ruleParts.js).
    const actions = [];
    for (const actionId of ruleActionIds(rule)) {
      const action = await ReactiveCache.getAction(actionId);
      if (!action) throw new Meteor.Error('not-found', 'Action not found');
      actions.push(action);
    }

    for (const action of actions) {
      await RulesHelper.performAction(
        {
          activityType: 'button',
          cardId,
          boardId: rule.boardId,
          userId: this.userId,
        },
        action,
      );
    }
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

    // #5536: an action's own boardId is the DESTINATION board (e.g. "move card
    // to board X" / "link card to board X"). Let it win over the source boardId
    // so cross-board move/link rules created through this method keep their
    // target — only fall back to the source board when the action omits one.
    // #6472: "omits" must include an EMPTY boardId (a not-yet-loaded board
    // select posts ''), which the spread would otherwise let override the
    // fallback and make every list lookup in the action fail silently.
    const actionDoc = { boardId, ...clean(action) };
    if (!actionDoc.boardId) actionDoc.boardId = boardId;
    // RuleBleed (GHSA-9w4x-hf2r-hc9v): automation actions execute on the
    // server, where collection allow/deny callbacks do not run. Do not persist
    // a cross-board destination unless the rule creator can write there.
    if (actionDoc.boardId !== boardId) {
      const destination = await ReactiveCache.getBoard(actionDoc.boardId);
      if (!allowIsBoardMemberWithWriteAccess(this.userId, destination)) {
        tripCanary('rule.cross-board-write', { userId: this.userId });
        throw new Meteor.Error(
          'not-authorized',
          'Must have write access to the destination board',
        );
      }
    }
    const triggerId = await Triggers.insertAsync({ ...clean(trigger), boardId });
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

  // #2713: edit an existing rule's trigger/action in place instead of forcing
  // "delete the rule, recreate it from scratch". The rule document keeps its
  // own _id (and its unshared trigger/action _ids too) —
  // only their CONTENT is replaced, so anything that already refers to this
  // rule by id keeps working after the edit.
  async 'rules.updateRule'(ruleId, title, trigger, action) {
    check(ruleId, String);
    check(title, Match.Optional(String));
    check(trigger, Object);
    check(action, Object);

    const rule = await ReactiveCache.getRule(ruleId);
    if (!rule) throw new Meteor.Error('not-found', 'Rule not found');

    const board = await ReactiveCache.getBoard(rule.boardId);
    if (!board) throw new Meteor.Error('not-found', 'Board not found');
    if (!board.hasAdmin(this.userId)) {
      throw new Meteor.Error('not-authorized', 'Must be a board admin');
    }

    const clean = doc => {
      const { _id, ...rest } = doc || {};
      return rest;
    };

    const boardId = rule.boardId;
    // Same cross-board destination handling as rules.createRule above.
    const actionDoc = { boardId, ...clean(action) };
    if (!actionDoc.boardId) actionDoc.boardId = boardId;
    if (actionDoc.boardId !== boardId) {
      const destination = await ReactiveCache.getBoard(actionDoc.boardId);
      if (!allowIsBoardMemberWithWriteAccess(this.userId, destination)) {
        tripCanary('rule.cross-board-write', { userId: this.userId });
        throw new Meteor.Error(
          'not-authorized',
          'Must have write access to the destination board',
        );
      }
    }
    const triggerDoc = { ...clean(trigger), boardId };

    return withRuleHistory(ruleId, this.userId, async () => {
      // Full-document replace (not $set) so a trigger/action switched to a
      // different type does not keep stale fields from the type it replaced -
      // and keep existing unshared IDs. Shared components get a private copy
      // so editing this rule cannot change a sibling rule's configuration.
      const triggerId = await writeRuleComponent(rule, 'trigger', triggerDoc);
      const actionId = await writeRuleComponent(rule, 'action', actionDoc);

      const ruleSet = {
        title: title || rule.title || 'Rule',
        triggerId,
        actionId,
      };
      const { ruleButtonMetadata } = require('/models/lib/ruleButtonMetadata');
      const buttonModifier = ruleButtonMetadata(triggerDoc, ruleSet.title);
      await Rules.updateAsync(ruleId, { ...buttonModifier, $set: { ...ruleSet, ...buttonModifier.$set } });
      return { _id: ruleId, triggerId, actionId };
    });
  },

  // #4294 / #2953: add one more trigger (the rule then fires when ANY of its
  // triggers fires) or one more action (run after the rule's others, in order)
  // to an existing rule. Same board-admin and cross-board checks as
  // rules.createRule; recorded as one rule History entry.
  async 'rules.addPart'(ruleId, kind, doc) {
    check(ruleId, String);
    check(kind, Match.OneOf('trigger', 'action'));
    check(doc, Object);
    const rule = await ReactiveCache.getRule(ruleId);
    if (!rule) throw new Meteor.Error('not-found', 'Rule not found');
    const board = await ReactiveCache.getBoard(rule.boardId);
    if (!board) throw new Meteor.Error('not-found', 'Board not found');
    if (!board.hasAdmin(this.userId)) throw new Meteor.Error('not-authorized', 'Must be a board admin');
    const { _id, ...fields } = doc;
    const field = kind === 'trigger' ? 'extraTriggerIds' : 'extraActionIds';
    if ((rule[field] || []).length >= MAX_EXTRA_RULE_PARTS) {
      throw new Meteor.Error('too-many-rule-parts', `A rule can have at most ${MAX_EXTRA_RULE_PARTS} extra ${kind}s`);
    }
    let partDoc;
    if (kind === 'trigger') {
      // A manual button is the rule's own trigger, never an extra one.
      if (fields.activityType === 'button') throw new Meteor.Error('invalid-rule-part', 'A button cannot be an extra trigger');
      partDoc = { ...fields, boardId: rule.boardId };
    } else {
      partDoc = { boardId: rule.boardId, ...fields };
      if (!partDoc.boardId) partDoc.boardId = rule.boardId;
      if (partDoc.boardId !== rule.boardId) {
        const destination = await ReactiveCache.getBoard(partDoc.boardId);
        if (!allowIsBoardMemberWithWriteAccess(this.userId, destination)) {
          tripCanary('rule.cross-board-write', { userId: this.userId });
          throw new Meteor.Error('not-authorized', 'Must have write access to the destination board');
        }
      }
    }
    return withRuleHistory(ruleId, this.userId, async () => {
      const partId = await (kind === 'trigger' ? Triggers : Actions).insertAsync(partDoc);
      await Rules.updateAsync(ruleId, { $push: { [field]: partId } });
      return { _id: ruleId, partId };
    });
  },

  // Remove one extra trigger or action from a rule. The rule's own
  // triggerId/actionId cannot be removed this way.
  async 'rules.removePart'(ruleId, kind, partId) {
    check(ruleId, String);
    check(kind, Match.OneOf('trigger', 'action'));
    check(partId, String);
    const rule = await ReactiveCache.getRule(ruleId);
    if (!rule) throw new Meteor.Error('not-found', 'Rule not found');
    const board = await ReactiveCache.getBoard(rule.boardId);
    if (!board) throw new Meteor.Error('not-found', 'Board not found');
    if (!board.hasAdmin(this.userId)) throw new Meteor.Error('not-authorized', 'Must be a board admin');
    const field = kind === 'trigger' ? 'extraTriggerIds' : 'extraActionIds';
    if (!(rule[field] || []).includes(partId)) throw new Meteor.Error('not-found', 'Not an extra part of this rule');
    return withRuleHistory(ruleId, this.userId, async () => {
      await Rules.updateAsync(ruleId, { $pull: { [field]: partId } });
      const using = await Rules.findOneAsync({ $or: [{ [`${kind}Id`]: partId }, { [field]: partId }] });
      if (!using) await (kind === 'trigger' ? Triggers : Actions).removeAsync(partId);
      return { _id: ruleId };
    });
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

    await withRuleHistory(rule._id, this.userId, () => removeRuleWithUnusedParts(rule));
    return { _id: rule._id };
  },

  // #2322: flip a rule's `enabled` flag without touching anything else. A
  // disabled rule's Trigger/Action documents and the rule's own title/
  // trigger/action are left exactly as they are - only RulesHelper.
  // findMatchingRules() skips it (server/rulesHelper.js) - so re-enabling
  // restores the rule to firing with the same configuration it had before.
  async 'rules.setEnabled'(ruleId, enabled) {
    check(ruleId, String);
    check(enabled, Boolean);

    const rule = await ReactiveCache.getRule(ruleId);
    if (!rule) throw new Meteor.Error('not-found', 'Rule not found');

    const board = await ReactiveCache.getBoard(rule.boardId);
    if (!board) throw new Meteor.Error('not-found', 'Board not found');
    if (!board.hasAdmin(this.userId)) {
      throw new Meteor.Error('not-authorized', 'Must be a board admin');
    }

    await Rules.updateAsync(ruleId, { $set: { enabled } });
    return { _id: ruleId, enabled };
  },
});
