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
// server/lib/syncRuleCardCommand.js.
const DURABLE_RULE_ACTIONS = new Set(['sendEmail', 'archive', 'unarchive', 'setColor', 'addLabel', 'removeLabel',
  'removeAllLabels', 'markCardComplete', 'markCardIncomplete', 'setDate', 'updateDate', 'setDateRelative', 'removeDate',
  'addMember', 'removeMember', 'checkAll', 'uncheckAll', 'checkItem', 'uncheckItem']);
// Sync-owned card fields a saved step carries: the ones the direct path's
// conditional update compares, plus placement. SimpleSchema owns
// dateLastActivity, so it is never part of a step.
const SNAPSHOT_FIELDS = ['_id', 'boardId', 'listId', 'swimlaneId', 'title', 'description', 'spentTime', 'archived',
  'archivedAt', 'customFields', 'syncExternalId', 'syncSourceType', 'syncSourceKey', 'syncLastSource'];
// Fields the direct path compares against its fetched snapshot before writing.
const COMPARED_FIELDS = ['title', 'description', 'spentTime', 'archived', 'syncExternalId', 'syncSourceType',
  'syncSourceKey', 'syncLastSource'];

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
function snapshot(card, withCustomFields) {
  const result = {};
  for (const field of SNAPSHOT_FIELDS) {
    if (field === 'customFields' && !withCustomFields) continue;
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
    return snapshot(stored, withCustomFields);
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

module.exports = { DURABLE_RULE_ACTIONS, durableSyncEligibility, buildListSyncSteps };
