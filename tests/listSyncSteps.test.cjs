'use strict';
// When list Sync takes the durable path, and the steps it saves
// (server/lib/listSyncSteps.js). Run: node tests/listSyncSteps.test.cjs
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { durableSyncEligibility, buildListSyncSteps, DURABLE_RULE_ACTIONS, durableRuleActionTypes,
  CROSS_BOARD_DURABLE_ACTIONS } = require('../server/lib/listSyncSteps');
const { validateStep } = require('../server/lib/syncOperationJournal');

const list = { _id: 'list', boardId: 'board', syncRevision: 'rev', syncCredentialIncarnation: 'life' };
const board = { _id: 'board', syncEffectsEnabled: true };
const ok = over => durableSyncEligibility({ list, board, trigger: 'manual', flags: {}, ruleActionTypes: [], actorId: 'actor', ...over });

test('the durable path is taken only when it can do everything', () => {
  assert.deepEqual(ok(), { eligible: true, reason: null });
  assert.equal(ok({ ruleActionTypes: ['sendEmail'] }).eligible, true);
  assert.equal(ok({ trigger: 'scheduled', flags: { enableSyncCronEffects: true } }).eligible, true);
});

test('every missing condition keeps the direct path, and says which (negative)', () => {
  const reasons = [
    [{ board: { ...board, syncEffectsEnabled: false } }, 'effects-not-enabled'],
    [{ board: null }, 'effects-not-enabled'],
    [{ trigger: 'scheduled' }, 'cron-effects-not-enabled'],
    [{ list: { ...list, syncRevision: undefined } }, 'legacy-scope'],
    [{ list: { ...list, syncCredentialIncarnation: '' } }, 'legacy-scope'],
    // An in-place move is durable since 2026-10-02 (server/lib/syncRuleMoveCommand.js);
    // a move elsewhere is reported as '<type>:elsewhere' and keeps direct Sync.
    [{ ruleActionTypes: ['sendEmail', 'moveCardToTop:elsewhere'] }, 'rule-actions'],
    [{ ruleActionTypes: ['sendEmail', 'moveAllCardsInList:elsewhere'] }, 'rule-actions'],
    [{ ruleActionTypes: [null] }, 'rule-actions'],
    [{ actorId: null }, 'actor'],
    [{ trigger: 'webhook' }, 'trigger'],
  ];
  for (const [over, reason] of reasons) assert.deepEqual(ok(over), { eligible: false, reason }, reason);
  const { RULE_CARD_ACTIONS } = require('../server/lib/syncRuleCardCommand');
  const { RULE_CHECKLIST_ACTIONS } = require('../server/lib/syncRuleChecklistCommand');
  assert.deepEqual([...DURABLE_RULE_ACTIONS], ['sendEmail', 'archive', 'unarchive', ...Object.keys(RULE_CARD_ACTIONS),
    ...Object.keys(RULE_CHECKLIST_ACTIONS), ...require('../server/lib/syncRuleMoveCommand').RULE_MOVE_ACTIONS,
    ...require('../server/lib/syncRuleChecklistLifecycleCommand').RULE_CHECKLIST_LIFECYCLE_ACTIONS, 'sortList', 'createCard', 'copyCard', 'linkCard', 'addSwimlane', 'moveAllCardsInList'],
    'the actions with durable adapters');
  const rules = fs.readFileSync(path.join(__dirname, '../server/notifications/storedRulePlans.js'), 'utf8');
  for (const type of ['sendEmail', 'archive', 'unarchive']) assert.match(rules, new RegExp(`\\b${type}[:,]`), `${type} is registered in runStoredSyncRules`);
  assert.match(rules, /Object\.keys\(RULE_CARD_ACTIONS\)\.map\(type => \[type, cardField\]\)/, 'the card-field actions are registered');
});

const card = (id, extra = {}) => ({ customFields: [{ _id: 'other', value: 1 }], _id: id, boardId: 'board', listId: 'list', swimlaneId: 'lane', title: `T ${id}`,
  description: '', archived: false, syncExternalId: id, syncSourceType: 'jira', syncSourceKey: 'key',
  syncLastSource: { title: `T ${id}` }, sort: 3, dateLastActivity: new Date(5), userId: 'someone', ...extra });

test('creations, updates and archives become valid saved steps in the direct order', () => {
  const now = new Date(1000);
  const steps = buildListSyncSteps({
    // The direct path's insert document (server/listSync.js creationDocument).
    creations: [{ cardId: 'new', document: (({ userId, archived, customFields, ...doc }) => ({ ...doc, sort: -1, dateLastActivity: now,
      spentTime: undefined }))(card('new')) }],
    updates: [{ cardId: 'a', changes: { title: 'New title', syncLastSource: { title: 'New title' } } },
      { cardId: 'untouched', changes: {} }],
    archives: ['b'],
    fetched: [card('a'), card('b'), card('untouched')],
    current: new Map([['a', card('a')], ['b', card('b')], ['untouched', card('untouched')]]),
    now,
  });
  assert.deepEqual(steps.map(step => [step.kind, step.cardId]), [['create', 'new'], ['update', 'a'], ['archive', 'b']]);
  for (const step of steps) {
    validateStep(step);
    for (const snapshot of [step.before, step.after]) if (snapshot) {
      assert.ok(!Object.hasOwn(snapshot, 'dateLastActivity'), 'the schema owns dateLastActivity');
      assert.ok(Object.values(snapshot).every(value => value !== undefined));
    }
  }
  assert.equal(steps[1].after.title, 'New title');
  assert.equal(steps[1].before.title, 'T a');
  assert.ok(!Object.hasOwn(steps[1].before, 'sort') && !Object.hasOwn(steps[1].before, 'userId'), 'only Sync-owned fields');
  assert.deepEqual([steps[2].after.archived, steps[2].after.archivedAt], [true, now]);
  assert.ok(!Object.hasOwn(steps[1].before, 'customFields') && !Object.hasOwn(steps[2].before, 'customFields'),
    'custom fields ride along only with an estimate change');
});

test('a local edit since the run fetched stops it, as the direct update would (negative)', () => {
  const build = current => () => buildListSyncSteps({ creations: [], updates: [{ cardId: 'a', changes: { title: 'Source' } }],
    archives: [], fetched: [card('a')], current, now: new Date() });
  assert.throws(build(new Map([['a', card('a', { title: 'Edited locally' })]])), { code: 'sync-card-changed' });
  assert.throws(build(new Map()), { code: 'sync-card-changed' }, 'a card gone since');
  assert.doesNotThrow(build(new Map([['a', card('a', { sort: 9 })]])), 'a field Sync does not own may change');
});

test('manual and scheduled Sync route through the decision, and replay is scheduled', () => {
  const src = fs.readFileSync(path.join(__dirname, '../server/listSync.js'), 'utf8');
  assert.match(src, /const decision = await durableSyncDecision\(\{ list, board, trigger, actorId \}\);/);
  assert.match(src, /if \(decision\.eligible\) \{[\s\S]*?await runDurableListSync\(/);
  assert.match(src, /name: 'wekan-list-sync-replay'/);
  assert.match(src, /run: assertCurrent => reconcileList\(current, \{ \.\.\.options, scheduled: true \}/);
  // Both paths build the same card.
  assert.equal((src.match(/creationDocument\(task, cardId\)/g) || []).length, 2);
});

// Maintainer decision of 2026-10-02: a rule effect on another board is durable
// only when that board opted in too - and its own rules are durable, since the
// card put there runs them through the same stored stages.
test('cross-board rule actions count only when every board they reach opted in', async () => {
  const { durableRuleActionType } = require('../server/lib/syncRuleMoveCommand');
  const boards = { b: { _id: 'b', syncEffectsEnabled: true }, c: { _id: 'c', syncEffectsEnabled: true },
    off: { _id: 'off', syncEffectsEnabled: false } };
  const run = (actions, extra = {}) => durableRuleActionTypes({ boardId: 'a', typeOf: durableRuleActionType,
    readActions: async id => actions[id] ?? [], readBoard: async id => boards[id] ?? null, ...extra });
  const reads = [];
  assert.deepEqual(await run({ a: [{ actionType: 'linkCard', boardId: 'b' }], b: [{ actionType: 'setColor' }] },
    { readActions: async id => { reads.push(id); return { a: [{ actionType: 'linkCard', boardId: 'b' }], b: [{ actionType: 'setColor' }] }[id]; } }),
  ['linkCard', 'setColor'], 'the destination\'s own actions are checked too');
  assert.deepEqual(reads, ['a', 'b']);
  // Negative: a destination that did not opt in, or that the actor cannot write to.
  assert.deepEqual(await run({ a: [{ actionType: 'linkCard', boardId: 'off' }] }), ['linkCard:elsewhere']);
  assert.deepEqual(await run({ a: [{ actionType: 'linkCard', boardId: 'nobody' }] }), ['linkCard:elsewhere']);
  // Negative: the destination has an action without an adapter, two boards on.
  assert.deepEqual(await run({ a: [{ actionType: 'linkCard', boardId: 'b' }], b: [{ actionType: 'linkCard', boardId: 'c' }],
    c: [{ actionType: 'moveCardToTop', boardId: 'off' }] }), ['linkCard', 'linkCard', 'moveCardToTop:elsewhere']);
  assert.equal(ok({ ruleActionTypes: ['linkCard', 'moveCardToTop:elsewhere'] }).reason, 'rule-actions');
  // A cycle is read once per board.
  const cycle = [];
  await run({}, { readActions: async id => { cycle.push(id); return [{ actionType: 'linkCard', boardId: id === 'a' ? 'b' : 'a' }]; } });
  assert.deepEqual(cycle, ['a', 'b']);
  // A missing action anywhere cannot be proven durable.
  assert.deepEqual(await run({}, { readActions: async () => null }), [null]);
  // Only actions with a cross-board adapter are lifted; the others stay elsewhere.
  assert.deepEqual([...CROSS_BOARD_DURABLE_ACTIONS], ['linkCard', 'copyCard']);
  assert.deepEqual(await run({ a: [{ actionType: 'copyCard', boardId: 'b' }] }), ['copyCard']);
  // A move to another board needs the later actions of its plan to follow the
  // card there - not built (see TODO Later) - so it stays elsewhere.
  assert.deepEqual(await run({ a: [{ actionType: 'moveCardToTop', boardId: 'b' }] }), ['moveCardToTop:elsewhere']);
  assert.deepEqual(await run({ a: [{ actionType: 'moveAllCardsInList', boardId: 'b' }] }), ['moveAllCardsInList:elsewhere']);
  // durableSyncDecision reads every board this way, the destination's membership included.
  const app = fs.readFileSync(path.join(__dirname, '../server/lib/listSyncApplication.js'), 'utf8');
  assert.match(app, /const ruleActionTypes = await durableRuleActionTypes\(\{ boardId: list\.boardId, readActions, readBoard,/);
  assert.match(app, /memberCan\(destination\.members, actorId, 'write'\) &&\s*!isAssignedOnlyMember\(destination, actorId\)/);
});
