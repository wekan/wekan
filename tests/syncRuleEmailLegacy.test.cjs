'use strict';
// Legacy (unbound) rule email commands, maintainer decision of 2026-09-30:
// nothing runs them automatically; an administrator re-binds one (its content
// recaptured from the current source after a fresh access check) or discards
// it (a dropped attempt, so the stage completes without mail).
//
// Run: node --test tests/syncRuleEmailLegacy.test.cjs
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { canonical, sha256 } = require('../models/lib/changeHistoryIntegrity');
const { prepareRulePlan, planId } = require('../server/lib/syncRulePlan');
const { commandId: commandIdOf } = require('../server/lib/syncRuleEmailCommand');
const L = require('../server/lib/syncRuleEmailLegacy');

const clone = value => (value == null ? value : structuredClone(value));
const get = (row, key) => key.split('.').reduce((value, part) => value?.[part], row);
function matches(row, query) {
  return Object.entries(query).every(([key, value]) => {
    if (key === '$or') return value.some(part => matches(row, part));
    if (value && typeof value === 'object' && '$exists' in value) return (get(row, key) !== undefined) === value.$exists;
    if (value && typeof value === 'object' && '$lt' in value) return get(row, key) < value.$lt;
    return JSON.stringify(get(row, key)) === JSON.stringify(value);
  });
}
function collection() {
  const rows = new Map();
  return { rows,
    async findOne(query) { return clone([...rows.values()].find(row => matches(row, query)) || null); },
    find(query) {
      const list = [...rows.values()].filter(row => matches(row, query));
      const cursor = { sort: () => cursor, limit: () => cursor, toArray: async () => list.map(clone) };
      return cursor;
    },
    async insertOne(row) {
      if (rows.has(row._id)) throw Object.assign(new Error('duplicate'), { code: 11000 });
      rows.set(row._id, clone(row));
    },
    async replaceOne(filter, row) { const current = rows.get(filter._id); if (current && matches(current, filter)) rows.set(row._id, clone(row)); },
  };
}

const effectId = 'e'.repeat(64);
// A real current (v5) binding for card c1 on board b1, as resolveRuleEmailSource makes.
const V5 = { version: 5, cards: [['c1', 'b1', 'cardType-card', null]], linkedBoardId: null, linkedBoardVisibility: null,
  visibility: [[false, false, false, null]], scrumVisibility: [[false, false, false, false, false, false]],
  customFieldPolicies: [], adminAccess: [false], relatedSources: [] };
const activity = { _id: 'act1', boardId: 'b1', cardId: 'c1', listId: 'l1', userId: 'u1', activityType: 'moveCard' };
async function fixture({ binding, details = false } = {}) {
  const f = { commands: collection(), plans: collection(), attempts: collection(), resolutions: collection(),
    operator: 'admin', now: () => new Date(5000), access: 'ok', prepared: 0 };
  const plan = await prepareRulePlan({ activity, effectId, assertCurrent: async () => {},
    selectRules: async () => [{ _id: 'r1', boardId: 'b1', actionId: 'a1', triggerId: 't1' }],
    readAction: async () => ({ _id: 'a1', actionType: 'sendEmail', ...(details ? { includeCardDetails: true } : {}) }) });
  f.plan = plan;
  f.plans.rows.set(planId(effectId, activity._id), { _id: planId(effectId, activity._id), plan, checksum: sha256(canonical(plan)) });
  const invocation = plan.actions[0];
  const identity = { _id: commandIdOf(invocation.id), version: binding ? 2 : 1, kind: 'rule-email', invocationId: invocation.id,
    planId: planId(effectId, activity._id), effectId, planHash: sha256(canonical(plan)), activityHash: plan.activityHash,
    actorId: plan.actorId, boardId: plan.boardId, cardId: plan.cardId };
  const command = { ...identity, mail: { to: 'x@example.org', from: 'w@example.org', subject: 'Old subject', text: 'old' },
    ...(binding ? { sourceBinding: binding } : {}) };
  command.checksum = sha256(canonical(command));
  f.commands.rows.set(command._id, command);
  f.commandId = command._id;
  f.readActivity = async id => (id === activity._id ? clone(activity) : null);
  f.assertAccess = async () => { if (f.access !== 'ok') throw new Error('rule-email-legacy-access-denied'); };
  f.prepare = async () => {
    f.prepared++;
    return { mail: { to: 'x@example.org', from: 'w@example.org', subject: 'Current subject', text: 'now' },
      sourceBinding: clone(V5) };
  };
  return f;
}

test('an unbound command is listed with what it would send', async () => {
  const f = await fixture();
  const list = await L.listLegacyRuleEmailCommands(f);
  assert.equal(list.total, 1);
  assert.deepEqual(list.rows[0], { commandId: f.commandId, boardId: 'b1', cardId: 'c1', reason: 'unbound',
    to: 'x@example.org', subject: 'Old subject', rebindable: true });
});

test('an old Details binding is legacy only when the action includes Details', async () => {
  const old = await fixture({ binding: { version: 3, cards: [] }, details: true });
  assert.equal((await L.listLegacyRuleEmailCommands(old)).rows[0].reason, 'details-snapshot');
  const plain = await fixture({ binding: { version: 3, cards: [] } });
  assert.equal((await L.listLegacyRuleEmailCommands(plain)).total, 0, 'a bound command without Details is current');
});

test('re-bind recaptures content from the current source and writes one audit record', async () => {
  const f = await fixture();
  assert.deepEqual(await L.rebindLegacyRuleEmailCommand(f), { commandId: f.commandId, status: 'rebound' });
  const saved = f.commands.rows.get(f.commandId);
  assert.equal(saved.version, 2);
  assert.equal(saved.mail.subject, 'Current subject', 'old content is not paired with new evidence');
  assert.equal(saved.sourceBinding.version, 5);
  assert.equal([...f.resolutions.rows.values()][0].decision, 'legacy-rebind');
  assert.equal((await L.listLegacyRuleEmailCommands(f)).total, 0);
  await assert.rejects(L.rebindLegacyRuleEmailCommand(f), /not-legacy/);
});

test('re-bind refuses without access, with a changed activity, or after an attempt (negative)', async () => {
  const denied = await fixture(); denied.access = 'no';
  await assert.rejects(L.rebindLegacyRuleEmailCommand(denied), /access-denied/);
  assert.equal(denied.prepared, 0, 'nothing is read from the source without access');
  assert.equal(denied.commands.rows.get(denied.commandId).version, 1);
  const changed = await fixture(); changed.readActivity = async () => ({ ...activity, activityType: 'addComment' });
  await assert.rejects(L.rebindLegacyRuleEmailCommand(changed), /source-changed/);
  const gone = await fixture(); gone.readActivity = async () => null;
  await assert.rejects(L.rebindLegacyRuleEmailCommand(gone), /source-unavailable/);
  const tried = await fixture();
  tried.attempts.rows.set(tried.commandId, { _id: tried.commandId, state: 'sending' });
  await assert.rejects(L.rebindLegacyRuleEmailCommand(tried), /attempt-exists/);
  await assert.rejects(L.discardLegacyRuleEmailCommand(tried), /attempt-exists/);
  const unbound = await fixture({ details: true });
  unbound.prepare = async () => ({ mail: { to: 'x@example.org', from: 'w@example.org', subject: 'S', text: 'T' },
    sourceBinding: { version: 4, cards: [] } });
  await assert.rejects(L.rebindLegacyRuleEmailCommand(unbound), /source-unavailable/, 'Details still need a v5 chain');
});

test('discard records a dropped attempt and keeps the command as evidence', async () => {
  const f = await fixture();
  assert.equal((await L.discardLegacyRuleEmailCommand(f)).status, 'discarded');
  const attempt = f.attempts.rows.get(f.commandId);
  assert.equal(attempt.state, 'dropped');
  assert.equal(attempt.commandHash, f.commands.rows.get(f.commandId).checksum);
  assert.ok(f.commands.rows.get(f.commandId), 'the command stays');
  assert.equal((await L.listLegacyRuleEmailCommands(f)).total, 0);
  await assert.rejects(L.rebindLegacyRuleEmailCommand(f), /attempt-exists/, 'a discard is final');
});

test('the stored rule path completes a dropped attempt before the binding guard', () => {
  const src = fs.readFileSync(path.join(__dirname, '../server/notifications/storedRulePlans.js'), 'utf8');
  const at = src.indexOf('export async function runStoredSyncRuleEmail');
  const body = src.slice(at, src.indexOf('\n}\n', at));
  const dropped = body.indexOf("dropped?.state === 'dropped'");
  assert.ok(dropped > 0);
  assert.ok(dropped < body.indexOf('assertRuleEmailSourceBinding'), 'checked before the source guard');
  // Negative: nothing re-binds or discards on its own - only the admin methods call these.
  const callers = [];
  for (const dir of ['server', 'models', 'client', 'imports']) {
    const walk = d => fs.readdirSync(d, { withFileTypes: true }).forEach(entry => {
      const full = path.join(d, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (/\.js$/.test(entry.name) && /(rebind|discard)LegacyRuleEmailCommand\(/.test(fs.readFileSync(full, 'utf8'))) callers.push(path.relative(path.join(__dirname, '..'), full));
    });
    walk(path.join(__dirname, '..', dir));
  }
  assert.deepEqual(callers.sort(), ['server/lib/syncRuleEmailLegacy.js', 'server/methods/syncRuleEmailRecovery.js']);
  const methods = fs.readFileSync(path.join(__dirname, '../server/methods/syncRuleEmailRecovery.js'), 'utf8');
  for (const name of ['syncRuleEmailLegacyList', 'syncRuleEmailLegacyRebind', 'syncRuleEmailLegacyDiscard']) {
    const start = methods.indexOf(`async ${name}(`);
    assert.match(methods.slice(start, methods.indexOf('\n  },', start)), /await assertAdmin\(this\.userId\)/, name);
  }
});
