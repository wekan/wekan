'use strict';
// Durable rule createCard (server/lib/syncRuleCreateCardCommand.js).
// Run: node tests/syncRuleCreateCardCommand.test.cjs
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { prepareRulePlan } = require('../server/lib/syncRulePlan');
const C = require('../server/lib/syncRuleCreateCardCommand');
const { cardCreationActivity } = require('../models/lib/cardCreationActivity');
const { canonical, sha256 } = require('../models/lib/changeHistoryIntegrity');

const ROOT = path.join(__dirname, '..');
async function fixture() {
  const f = { activity: { _id: 'activity', boardId: 'board', cardId: 'card', userId: 'actor' },
    effectId: 'a'.repeat(64), index: 0, assertCurrent: async () => {} };
  f.plan = await prepareRulePlan({ ...f,
    selectRules: async () => [{ _id: 'rule', boardId: 'board', triggerId: 'trigger', actionId: 'action' }],
    readAction: async () => ({ _id: 'action', boardId: 'board', actionType: 'createCard', cardName: 'Follow up',
      listName: 'Next', swimlaneName: 'Lane' }) });
  f.context = { plan: f.plan, activity: f.activity, effectId: f.effectId, index: 0 };
  f.target = { boardId: 'board', listId: 'next', swimlaneId: 'lane', title: 'Follow up for T' };
  f.list = { _id: 'next', boardId: 'board', title: 'Next' };
  f.swimlane = { _id: 'lane', boardId: 'board', title: 'Lane' };
  f.prepare = over => C.prepareRuleCreateCardCommand({ ...f.context, target: f.target, list: f.list, swimlane: f.swimlane,
    createdAt: new Date(1000), ...over });
  return f;
}

test('one derived card, and the creation hook\'s activity saved with it', async () => {
  const f = await fixture();
  const command = f.prepare();
  assert.equal(command.card._id, C.newCardIdFor(command._id));
  assert.deepEqual(command.card, { _id: command.card._id, boardId: 'board', listId: 'next', swimlaneId: 'lane',
    title: 'Follow up for T' });
  const { _id, createdAt, modifiedAt, ...activity } = command.activity;
  assert.deepEqual(activity, cardCreationActivity('actor', command.card, f.list, f.swimlane), 'the hook\'s own payload');
  assert.equal(f.prepare({ createdAt: new Date(5) }).card._id, command.card._id, 'a replayed capture names the same card');
  assert.deepEqual(C.validateRuleCreateCardCommand(command, f.context), command);
});

test('negative: a missing target, another board and tampering are refused', async () => {
  const f = await fixture();
  assert.throws(() => f.prepare({ list: null }), /target-missing/);
  assert.throws(() => f.prepare({ target: { ...f.target, listId: '' } }), /target-missing/);
  assert.throws(() => f.prepare({ swimlane: { ...f.swimlane, boardId: 'other' } }), /target-missing/);
  assert.throws(() => f.prepare({ target: { ...f.target, boardId: 'other' } }), /invalid/);
  const command = f.prepare();
  const resum = row => { const { checksum, ...content } = row; return { ...content, checksum: sha256(canonical(content)) }; };
  assert.throws(() => C.validateRuleCreateCardCommand(resum({ ...command, card: { ...command.card, _id: 'chosen' } }), f.context),
    /command-invalid/);
  assert.throws(() => C.validateRuleCreateCardCommand(resum({ ...command, activity: { ...command.activity, userId: 'x' } }),
    f.context), /command-invalid/);
});

test('wiring: durable, registered, and one target lookup for both paths', () => {
  const { DURABLE_RULE_ACTIONS } = require('../server/lib/listSyncSteps');
  assert.ok(DURABLE_RULE_ACTIONS.has('createCard'));
  const plans = fs.readFileSync(path.join(ROOT, 'server/notifications/storedRulePlans.js'), 'utf8');
  assert.match(plans, /createCard: \(\{ invocation \}\) => runStoredSyncRuleCreateCard\(/);
  assert.match(plans, /kinds: \['create'\] \},\s*\(\) => Cards\.insertAsync\(\{ \.\.\.command\.card, sort: 0 \}\)/);
  const rules = fs.readFileSync(path.join(ROOT, 'server/rulesHelper.js'), 'utf8');
  assert.match(rules, /const target = await this\.createCardTarget\(activity, card, action\);/);
  assert.match(plans, /RulesHelper\.createCardTarget\(context\.saved, card, action\)/);
});
