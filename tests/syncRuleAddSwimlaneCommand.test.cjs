'use strict';
// Durable rule addSwimlane (server/lib/syncRuleAddSwimlaneCommand.js).
// Run: node tests/syncRuleAddSwimlaneCommand.test.cjs
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { prepareRulePlan } = require('../server/lib/syncRulePlan');
const A = require('../server/lib/syncRuleAddSwimlaneCommand');
const { canonical, sha256 } = require('../models/lib/changeHistoryIntegrity');

const ROOT = path.join(__dirname, '..');
async function fixture(actionType = 'addSwimlane') {
  const f = { activity: { _id: 'activity', boardId: 'board', cardId: 'card', userId: 'actor' },
    effectId: 'a'.repeat(64), index: 0, assertCurrent: async () => {} };
  f.plan = await prepareRulePlan({ ...f,
    selectRules: async () => [{ _id: 'rule', boardId: 'board', triggerId: 'trigger', actionId: 'action' }],
    readAction: async () => ({ _id: 'action', boardId: 'board', actionType, swimlaneName: 'Lane for {cardTitle}' }) });
  f.context = { plan: f.plan, activity: f.activity, effectId: f.effectId, index: 0 };
  f.prepare = over => A.prepareRuleAddSwimlaneCommand({ ...f.context, title: 'Lane for T', createdAt: new Date(1000), ...over });
  return f;
}

test('one derived swimlane and the hook\'s activity, each by its own id', async () => {
  const f = await fixture();
  const command = f.prepare();
  assert.deepEqual(command.swimlane, { _id: A.swimlaneIdFor(command._id), title: 'Lane for T', boardId: 'board', sort: 0 });
  const { _id, createdAt, modifiedAt, ...activity } = command.activity;
  assert.deepEqual(activity, { userId: 'actor', type: 'swimlane', activityType: 'createSwimlane', boardId: 'board',
    swimlaneId: command.swimlane._id }, 'the insert hook\'s own activity');
  assert.equal(f.prepare({ createdAt: new Date(5) }).swimlane._id, command.swimlane._id, 'a replay names the same swimlane');
  assert.deepEqual(A.validateRuleAddSwimlaneCommand(command, f.context), command);
});

test('negative: another action and tampering are refused', async () => {
  const other = await fixture('addChecklist');
  assert.throws(() => other.prepare(), /invalid/);
  const f = await fixture();
  const command = f.prepare();
  const resum = row => { const { checksum, ...content } = row; return { ...content, checksum: sha256(canonical(content)) }; };
  assert.throws(() => A.validateRuleAddSwimlaneCommand(resum({ ...command, swimlane: { ...command.swimlane, boardId: 'x' } }),
    f.context), /command-invalid/);
  assert.throws(() => A.validateRuleAddSwimlaneCommand(resum({ ...command, activity: { ...command.activity, userId: 'x' } }),
    f.context), /command-invalid/);
});

test('wiring: durable, registered, the hook deferred only for that swimlane', async () => {
  const { DURABLE_RULE_ACTIONS } = require('../server/lib/listSyncSteps');
  assert.ok(DURABLE_RULE_ACTIONS.has('addSwimlane'));
  const plans = fs.readFileSync(path.join(ROOT, 'server/notifications/storedRulePlans.js'), 'utf8');
  assert.match(plans, /addSwimlane: \(\{ invocation \}\) => runStoredSyncRuleAddSwimlane\(/);
  assert.match(plans, /RulesHelper\.ruleSwimlaneTitle\(/);
  assert.match(fs.readFileSync(path.join(ROOT, 'server/models/swimlanes.js'), 'utf8'),
    /if \(!deferSyncSwimlaneActivity\(doc\)\) await Activities\.insertAsync\(\{/);
  const { withSyncSwimlaneActivityDeferred, deferSyncSwimlaneActivity } = require('../server/lib/syncRecordingScope');
  assert.equal(deferSyncSwimlaneActivity({ _id: 's1' }), false, 'no scope, no deferral');
  await withSyncSwimlaneActivityDeferred('s1', async () => {
    assert.equal(deferSyncSwimlaneActivity({ _id: 's2' }), false, 'another swimlane');
    assert.equal(deferSyncSwimlaneActivity({ _id: 's1' }), true);
    assert.equal(deferSyncSwimlaneActivity({ _id: 's1' }), false, 'one shot');
  });
});
