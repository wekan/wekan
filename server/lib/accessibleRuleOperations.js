import { Meteor } from 'meteor/meteor';
import { ReactiveCache } from '/imports/reactiveCache';
import Rules from '/models/rules';
import Triggers from '/models/triggers';
import Actions from '/models/actions';
import { canDeleteBoardRule } from '/models/lib/ruleDeletePermission';
import { tripCanary } from '/server/lib/canary';

const MAX_RULE_TITLE_LENGTH = 500;

function normalizedRuleTitle(value) {
  const title = typeof value === 'string' ? value.trim() : '';
  if (!title || title.length > MAX_RULE_TITLE_LENGTH) {
    throw new Meteor.Error('invalid-title', 'Rule title must contain 1-500 characters');
  }
  return title;
}

async function editableRule(userId, ruleId, routeBoardId) {
  if (typeof userId !== 'string' || typeof ruleId !== 'string') {
    throw new Meteor.Error('not-authorized');
  }
  const rule = await ReactiveCache.getRule(ruleId);
  if (!rule) throw new Meteor.Error('not-found', 'Rule not found');
  if (routeBoardId !== undefined && routeBoardId !== rule.boardId) {
    tripCanary('rule.cross-board-write', { userId });
    throw new Meteor.Error('not-authorized', 'Rule does not belong to route board');
  }
  const [board, user] = await Promise.all([
    ReactiveCache.getBoard(rule.boardId),
    ReactiveCache.getUser(userId),
  ]);
  if (!board) throw new Meteor.Error('not-found', 'Board not found');
  if (!canDeleteBoardRule(board, userId, { isSiteAdmin: !!user?.isAdmin })) {
    throw new Meteor.Error('not-authorized', 'Must be a board admin');
  }
  return rule;
}

export async function renameAccessibleRule(userId, input = {}) {
  const rule = await editableRule(userId, input.ruleId, input.boardId);
  const title = normalizedRuleTitle(input.title);
  await Rules.updateAsync(rule._id, { $set: { title } });
  return { _id: rule._id, title };
}

export async function removeAccessibleRule(userId, input = {}) {
  const rule = await editableRule(userId, input.ruleId, input.boardId);
  await Rules.removeAsync(rule._id);
  if (rule.triggerId) await Triggers.removeAsync(rule.triggerId);
  if (rule.actionId) await Actions.removeAsync(rule.actionId);
  return { _id: rule._id };
}

export { MAX_RULE_TITLE_LENGTH, normalizedRuleTitle };
