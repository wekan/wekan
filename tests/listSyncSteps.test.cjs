'use strict';
// When list Sync takes the durable path, and the steps it saves
// (server/lib/listSyncSteps.js). Run: node tests/listSyncSteps.test.cjs
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { durableSyncEligibility, buildListSyncSteps, DURABLE_RULE_ACTIONS } = require('../server/lib/listSyncSteps');
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
    [{ ruleActionTypes: ['sendEmail', 'moveCardToTop'] }, 'rule-actions'],
    [{ ruleActionTypes: [null] }, 'rule-actions'],
    [{ actorId: null }, 'actor'],
    [{ trigger: 'webhook' }, 'trigger'],
  ];
  for (const [over, reason] of reasons) assert.deepEqual(ok(over), { eligible: false, reason }, reason);
  const { RULE_CARD_ACTIONS } = require('../server/lib/syncRuleCardCommand');
  const { RULE_CHECKLIST_ACTIONS } = require('../server/lib/syncRuleChecklistCommand');
  assert.deepEqual([...DURABLE_RULE_ACTIONS], ['sendEmail', 'archive', 'unarchive', ...Object.keys(RULE_CARD_ACTIONS),
    ...Object.keys(RULE_CHECKLIST_ACTIONS)],
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
