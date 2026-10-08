'use strict';
// The durable path of list Sync (maintainer decision of 2026-09-30: finish the
// Scrum/Sync handoff by calling the stored stages from manual and scheduled
// Sync). Pure: whether a run may take the durable path, and the saved steps it
// applies - so tests/listSyncSteps.test.cjs runs without Meteor.
//
// The durable path writes each card, its History, activities, rules,
// notifications and webhooks through the write-ahead journal and replays them
// after a restart. It is taken only when it can do all of that; otherwise the
// run uses the ordinary direct writes, exactly as before, so nothing that
// worked stops working:
//   - the board enabled Sync effects, and for a scheduled run the instance
//     enabled them for cron (server/lib/syncActivation.js);
//   - the list has a versioned scope (saved since lifetimes were added);
//   - every rule action on the board has a durable adapter: sending email,
//     archive and unarchive. Any other action keeps the board on the direct path.
const { syncValueChanges } = require('../../models/lib/listSyncTimeEstimates');

// Rule actions with a durable adapter in runStoredSyncRules: email, and
// archive/unarchive through the stored archive runner. Archive was held back
// while one rule-archived card took 36 s through nested guards; guard results
// are now shared within one evaluation (server/lib/syncGuardWindow.js).
// Card-field actions (colour, labels, completion) through saved commands:
// server/lib/syncRuleCardCommand.js. Moves to the top or bottom of the card's
// own list and swimlane: server/lib/syncRuleMoveCommand.js, whose
// durableRuleActionType reports any other move as '<type>:elsewhere', which
// is not in this set. Checklist creation and removal:
// server/lib/syncRuleChecklistLifecycleCommand.js.
const DURABLE_RULE_ACTIONS = new Set(['sendEmail', 'archive', 'unarchive', 'setColor', 'addLabel', 'removeLabel',
  'removeAllLabels', 'markCardComplete', 'markCardIncomplete', 'setDate', 'updateDate', 'setDateRelative', 'removeDate',
  'addMember', 'removeMember', 'addAssignee', 'removeAssignee', 'checkAll', 'uncheckAll', 'checkItem', 'uncheckItem', 'moveCardToTop', 'moveCardToBottom',
  'addChecklist', 'addChecklistWithItems', 'removeChecklist', 'sortList', 'createCard',
  'copyCard', 'linkCard', 'addSwimlane', 'moveAllCardsInList']);
// Rule actions whose variant on ANOTHER board has a durable adapter too.
// Maintainer decision of 2026-10-02: such an action is durable only when its
// destination board has opted into Sync effects as well. The card it puts
// there runs THAT board's rules through the same stored stages, which refuse
// an action without an adapter, so the destination's own rule actions must
// all be durable too - and so on, for every board reached that way.
const CROSS_BOARD_DURABLE_ACTIONS = new Set(['linkCard', 'copyCard']);
// ...and moves to another board, which take the card off the plan's board.
// The ordinary engine's later actions then act on the card on its new board
// (it reads the card by id); the durable commands that follow the card there
// (2026-10-03, storedRulePlans.js ruleCardNow) are FOLLOWER_SAFE. A move to
// another board counts only when every action that can follow it in a plan -
// the later actions of its rule, and every action of a rule whose trigger's
// activity type it shares - is one of them (`crossBoardMovable`, set by the
// caller from followableActionIds). Since the maintainer decision of
// 2026-10-03, a move, a sort or a move-all on the rule's own board, and an
// archive or restore, resolve on the board the card went to - in the ordinary
// engine (RulesHelper.ruleBoards) and in their durable commands (`onBoard`) -
// so they may follow too, and so may a further move to yet another board
// that opted in (its command saves the board the card leaves, `fromBoard`);
// each board a chain reaches is checked like the first - a move-all onto
// another board too, which takes its list from the board the card is on. An
// email may follow as well (maintainer decision of 2026-10-03): it reads the
// card where this plan's own move put it (storedRulePlans.js
// ruleEmailActivity, binding version 6 in server/lib/ruleEmailSource.js).
const CROSS_BOARD_FINAL_ACTIONS = new Set(['moveCardToTop', 'moveCardToBottom', 'moveAllCardsInList']);
const FOLLOWER_SAFE = new Set([...Object.keys(require('./syncRuleCardCommand').RULE_CARD_ACTIONS),
  ...Object.keys(require('./syncRuleChecklistCommand').RULE_CHECKLIST_ACTIONS),
  'addChecklist', 'addChecklistWithItems', 'removeChecklist', 'linkCard', 'copyCard', 'createCard', 'addSwimlane',
  'moveCardToTop', 'moveCardToBottom', 'sortList', 'moveAllCardsInList', 'archive', 'unarchive', 'sendEmail',
  'moveCardToTop:elsewhere', 'moveCardToBottom:elsewhere', 'moveAllCardsInList:elsewhere']);
const MAX_RULE_BOARDS = 50;

// The rule action types eligibility checks, across the source board and every
// board its durable cross-board actions reach. `readActions(boardId)` returns
// that board's rule actions, or null when one is missing; `readBoard(boardId)`
// the destination board when the actor may write there, or null; `typeOf` is
// syncRuleMoveCommand.js durableRuleActionType, which names an action on
// another board '<type>:elsewhere'. Such an action counts as its plain type
// only when CROSS_BOARD_DURABLE_ACTIONS has it and its destination opted in.
async function durableRuleActionTypes({ boardId, readActions, readBoard, typeOf }) {
  const types = [];
  const reached = new Set([boardId]);
  const queue = [boardId];
  while (queue.length) {
    const current = queue.shift();
    const actions = await readActions(current);
    if (!Array.isArray(actions)) return [null];
    for (const action of actions) {
      const type = typeOf(action, current);
      const [base, where] = typeof type === 'string' ? type.split(':') : [];
      const liftable = CROSS_BOARD_DURABLE_ACTIONS.has(base) ||
        (CROSS_BOARD_FINAL_ACTIONS.has(base) && (action.finalInPlan === true || action.crossBoardMovable === true));
      if (where !== 'elsewhere' || !liftable) { types.push(type); continue; }
      if (!reached.has(action.boardId)) {
        const destination = await readBoard(action.boardId);
        if (!destination || destination.syncEffectsEnabled !== true) { types.push(type); continue; }
        // A chain this long is not a configuration anyone reviews: direct Sync.
        if (reached.size >= MAX_RULE_BOARDS) return [null];
        reached.add(action.boardId);
        queue.push(action.boardId);
      }
      types.push(base);
    }
  }
  return types;
}

// Sync-owned card fields a saved step carries: the ones the direct path's
// conditional update compares, plus placement. SimpleSchema owns
// dateLastActivity, so it is never part of a step.
// The card's Scrum planning and its revision only when the run maps planning
// (models/lib/listSyncPlanning.js): the fetched cards then carry them.
const SNAPSHOT_FIELDS = ['_id', 'boardId', 'listId', 'swimlaneId', 'title', 'description', 'spentTime', 'archived',
  'archivedAt', 'customFields', 'syncExternalId', 'syncSourceType', 'syncSourceKey', 'syncLastSource',
  'scrum', 'scrumRevision'];
const PLANNING_SNAPSHOT_FIELDS = ['scrum', 'scrumRevision'];
// Fields the direct path compares against its fetched snapshot before writing.
const COMPARED_FIELDS = ['title', 'description', 'spentTime', 'archived', 'syncExternalId', 'syncSourceType',
  'syncSourceKey', 'syncLastSource', 'scrum', 'scrumRevision'];

function durableSyncEligibility({ list, board, trigger, flags, ruleActionTypes, actorId }) {
  if (!['manual', 'scheduled'].includes(trigger)) return { eligible: false, reason: 'trigger' };
  if (typeof actorId !== 'string' || !actorId) return { eligible: false, reason: 'actor' };
  if (!board || board.syncEffectsEnabled !== true) return { eligible: false, reason: 'effects-not-enabled' };
  if (trigger === 'scheduled' && flags?.enableSyncCronEffects !== true) return { eligible: false, reason: 'cron-effects-not-enabled' };
  if (!list || typeof list.syncRevision !== 'string' || !list.syncRevision ||
      typeof list.syncCredentialIncarnation !== 'string' || !list.syncCredentialIncarnation) {
    return { eligible: false, reason: 'legacy-scope' };
  }
  if (!Array.isArray(ruleActionTypes) || ruleActionTypes.some(type => !DURABLE_RULE_ACTIONS.has(type))) {
    return { eligible: false, reason: 'rule-actions' };
  }
  return { eligible: true, reason: null };
}

const same = (a, b) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);
// Custom fields only when the change maps an estimate into them: the journal
// allows a customFields snapshot only with its estimate mapping
// (syncOperationJournal.js validateEstimateChange), and a card's other custom
// fields are not Sync's to carry.
function snapshot(card, withCustomFields, withPlanning) {
  const result = {};
  for (const field of SNAPSHOT_FIELDS) {
    if (field === 'customFields' && !withCustomFields) continue;
    if (PLANNING_SNAPSHOT_FIELDS.includes(field) && !withPlanning) continue;
    if (card[field] !== undefined) result[field] = card[field];
  }
  return result;
}
function changed() { return Object.assign(new Error('sync-card-changed'), { code: 'sync-card-changed' }); }

// Steps in the direct path's order: creations, updates, archives.
//   creations: [{ cardId, document }]   the direct path's insert document
//   updates:   plan.toUpdate            [{ cardId, changes }]
//   archives:  plan.toArchive           [cardId]
//   fetched:   the cards as the run fetched and compared them (existingCards)
//   current:   the stored cards now, by id
function buildListSyncSteps({ creations, updates, archives, fetched, current, estimateMapping, timeMappings = {}, now }) {
  const fetchedById = new Map(fetched.map(card => [card._id, card]));
  const before = (cardId, withCustomFields) => {
    const stored = current.get(cardId), seen = fetchedById.get(cardId);
    if (!stored || !seen) throw changed();
    // A local edit since the run fetched must stop it, as the direct path's
    // conditional update would.
    for (const field of COMPARED_FIELDS) if (Object.hasOwn(seen, field) && !same(stored[field], seen[field])) throw changed();
    return snapshot(stored, withCustomFields, Object.hasOwn(seen, 'scrum'));
  };
  const steps = [];
  for (const { cardId, document } of creations) {
    const { dateLastActivity, ...after } = document;
    steps.push({ kind: 'create', cardId, before: null, after: snapshotCreate(after) });
  }
  for (const { cardId, changes } of updates) {
    if (!Object.keys(changes).length) continue;
    const applied = syncValueChanges(changes, fetchedById.get(cardId), estimateMapping, timeMappings);
    const previous = before(cardId, Object.hasOwn(applied, 'customFields'));
    steps.push({ kind: 'update', cardId, before: previous, after: { ...previous, ...applied } });
  }
  for (const cardId of archives) {
    const previous = before(cardId, false);
    steps.push({ kind: 'archive', cardId, before: previous, after: { ...previous, archived: true, archivedAt: now } });
  }
  return steps;
}
function snapshotCreate(document) {
  const after = {};
  for (const [key, value] of Object.entries(document)) if (value !== undefined) after[key] = value;
  return after;
}

// Which of a board's rule actions end every plan they are in: the last action
// of a rule whose trigger's activity type no other rule shares. `rules` are
// { actionIds, activityType } (activityType null when unknown).
function finalActionIds(rules) {
  const byType = new Map();
  for (const rule of rules) byType.set(rule.activityType, (byType.get(rule.activityType) || 0) + 1);
  const final = new Set(), notFinal = new Set();
  for (const rule of rules) {
    const unique = typeof rule.activityType === 'string' && byType.get(rule.activityType) === 1;
    rule.actionIds.forEach((id, i) => {
      if (unique && i === rule.actionIds.length - 1) final.add(id); else notFinal.add(id);
    });
  }
  for (const id of notFinal) final.delete(id);
  return final;
}

// Which of a board's rule actions can only be followed, in any plan, by
// FOLLOWER_SAFE actions: the later actions of its own rule, and every action
// of the other rules with the same trigger activity type (a rule whose
// trigger type is unknown may share any plan). `typeOf` gives an action id's
// type. An action nothing can follow qualifies trivially.
function followableActionIds(rules, typeOf) {
  const safe = id => FOLLOWER_SAFE.has(typeOf(id));
  const result = new Set(), refused = new Set();
  rules.forEach((rule, r) => {
    const others = rules.filter((other, o) => o !== r && (other.activityType === rule.activityType ||
      typeof other.activityType !== 'string' || typeof rule.activityType !== 'string'));
    const shared = others.every(other => other.actionIds.every(safe));
    rule.actionIds.forEach((id, i) => {
      if (shared && rule.actionIds.slice(i + 1).every(safe)) result.add(id); else refused.add(id);
    });
  });
  for (const id of refused) result.delete(id);
  return result;
}

module.exports = { DURABLE_RULE_ACTIONS, CROSS_BOARD_DURABLE_ACTIONS, CROSS_BOARD_FINAL_ACTIONS, FOLLOWER_SAFE,
  finalActionIds, followableActionIds,
  durableRuleActionTypes, durableSyncEligibility,
  buildListSyncSteps };
