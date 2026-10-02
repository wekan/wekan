'use strict';
// Durable rule linkCard (server/lib/syncRuleLinkCardCommand.js), on the card's own
// board or, when both boards opted in, another one.
// Run: node tests/syncRuleLinkCardCommand.test.cjs
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { prepareRulePlan } = require('../server/lib/syncRulePlan');
const L = require('../server/lib/syncRuleLinkCardCommand');
const { durableRuleActionType } = require('../server/lib/syncRuleMoveCommand');
const { canonical, sha256 } = require('../models/lib/changeHistoryIntegrity');

const ROOT = path.join(__dirname, '..');
async function fixture(action = {}) {
  const f = { activity: { _id: 'activity', boardId: 'board', cardId: 'card', userId: 'actor' },
    effectId: 'a'.repeat(64), index: 0, assertCurrent: async () => {} };
  f.plan = await prepareRulePlan({ ...f,
    selectRules: async () => [{ _id: 'rule', boardId: 'board', triggerId: 'trigger', actionId: 'action' }],
    readAction: async () => ({ _id: 'action', boardId: 'board', actionType: 'linkCard', listName: 'Next',
      swimlaneName: 'Lane', ...action }) });
  f.context = { plan: f.plan, activity: f.activity, effectId: f.effectId, index: 0 };
  f.source = { _id: 'card', boardId: 'board', listId: 'list', swimlaneId: 'lane', title: 'Pump', labelIds: ['l1'] };
  f.prepare = over => L.prepareRuleLinkCardCommand({ ...f.context, source: f.source,
    target: { listId: 'next', swimlaneId: 'lane' }, list: { _id: 'next', boardId: 'board', title: 'Next' },
    swimlane: { _id: 'lane', boardId: 'board', title: 'Lane' }, createdAt: new Date(1000), ...over });
  return f;
}

test('the linked card is Card.link\'s, under a derived id, with its creation activity', async () => {
  const f = await fixture();
  const command = f.prepare();
  assert.equal(command.card._id, L.linkedCardIdFor(command._id));
  assert.deepEqual([command.card.type, command.card.linkedId, command.card.listId, command.card.title],
    ['cardType-linkedCard', 'card', 'next', 'Pump']);
  assert.equal(command.card.labelIds, undefined, 'a linked card carries no labels, as Card.link');
  assert.deepEqual([command.activity.activityType, command.activity.cardId, command.activity.listName],
    ['createCard', command.card._id, 'Next']);
  assert.deepEqual(L.validateRuleLinkCardCommand(command, f.context), command);
  // A link of a linked card points at the original.
  assert.equal(f.prepare({ source: { ...f.source, linkedId: 'origin' } }).card.linkedId, 'origin');
});

test('a link to another board is built there, from that board\'s list and swimlane', async () => {
  // Eligibility names it '<type>:elsewhere'; listSyncSteps.js durableRuleActionTypes
  // counts it as linkCard only when that board opted in.
  assert.equal(durableRuleActionType({ actionType: 'linkCard', boardId: 'other' }, 'board'), 'linkCard:elsewhere');
  assert.equal(durableRuleActionType({ actionType: 'linkCard', boardId: 'board' }, 'board'), 'linkCard');
  const elsewhere = await fixture({ boardId: 'other' });
  const there = { list: { _id: 'next', boardId: 'other', title: 'Next' }, swimlane: { _id: 'lane', boardId: 'other', title: 'Lane' } };
  const command = elsewhere.prepare(there);
  assert.deepEqual([command.boardId, command.targetBoardId, command.card.boardId, command.activity.boardId],
    ['board', 'other', 'other', 'other']);
  assert.deepEqual(L.validateRuleLinkCardCommand(command, elsewhere.context), command);
  // Negative: a list or swimlane of the rule's own board is not the destination's.
  assert.throws(() => elsewhere.prepare(), /target-missing/);
  assert.throws(() => elsewhere.prepare({ ...there, swimlane: { _id: 'lane', boardId: 'board', title: 'Lane' } }),
    /target-missing/);
});

test('negative: a missing target and tampering are refused', async () => {
  const f = await fixture();
  assert.throws(() => f.prepare({ list: null }), /target-missing/);
  const command = f.prepare();
  const resum = row => { const { checksum, ...content } = row; return { ...content, checksum: sha256(canonical(content)) }; };
  assert.throws(() => L.validateRuleLinkCardCommand(resum({ ...command, card: { ...command.card, labelIds: ['l1'] } }), f.context),
    /command-invalid/);
  assert.throws(() => L.validateRuleLinkCardCommand(resum({ ...command, card: { ...command.card, type: 'cardType-card' } }),
    f.context), /command-invalid/);
  assert.throws(() => L.validateRuleLinkCardCommand(resum({ ...command, card: { ...command.card, boardId: 'other' } }),
    f.context), /command-invalid/);
  assert.throws(() => L.validateRuleLinkCardCommand(resum({ ...command, targetBoardId: 'other' }), f.context),
    /command-invalid/);
});

test('wiring: durable on the same board, one target lookup for both paths', () => {
  const { DURABLE_RULE_ACTIONS } = require('../server/lib/listSyncSteps');
  assert.ok(DURABLE_RULE_ACTIONS.has('linkCard'));
  const plans = fs.readFileSync(path.join(ROOT, 'server/notifications/storedRulePlans.js'), 'utf8');
  assert.match(plans, /linkCard: \(\{ invocation \}\) => runStoredSyncRuleLinkCard\(/);
  const rules = fs.readFileSync(path.join(ROOT, 'server/rulesHelper.js'), 'utf8');
  assert.match(rules, /const \{ listId, swimlaneId \} = await this\.linkCardTarget\(action\);/);
  assert.match(plans, /RulesHelper\.linkCardTarget\(/);
});

test('wiring: the runner checks the destination before every write there', () => {
  const plans = fs.readFileSync(path.join(ROOT, 'server/notifications/storedRulePlans.js'), 'utf8');
  const runner = plans.slice(plans.indexOf('export async function runStoredSyncRuleLinkCard('),
    plans.indexOf('export const SyncRuleAddSwimlaneCommands'));
  assert.match(runner, /await assertDestinationBoard\(targetBoardId, plan, options\.trigger\);/);
  assert.match(runner, /Lists\.findOneAsync\(\{ _id: target\.listId, boardId: targetBoardId \}\)/);
  assert.match(plans, /async function assertDestinationBoard\(boardId, plan, trigger\) \{\n  if \(boardId === plan\.boardId\) return;[\s\S]{0,400}memberCan\(board\.members, user\._id, 'write'\)[\s\S]{0,200}assertSyncActivation\(\{ board, trigger/);
});
