'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { confirmAcceptedRuleEmail: recover } = require('../server/lib/syncRuleEmailRecovery');
const { parse } = require('../releases/recover-rule-email.cjs');
const clone = value => value && structuredClone(value);
function fixture() {
  const f = { commandId: 'a'.repeat(64), attemptId: '12345678-1234-1234-1234-123456789abc',
    operator: 'Maintainer', evidence: 'smtp-log-42', assertOffline: async () => {}, now: () => new Date(2000), writes: [] };
  f.attempt = { _id: f.commandId, version: 1, commandHash: 'b'.repeat(64), invocationId: 'c'.repeat(64),
    attemptId: f.attemptId, state: 'sending', startedAt: new Date(1000) };
  f.attempts = { findOne: async () => clone(f.attempt), replaceOne: async (before, after) => {
    assert.deepEqual(before, f.attempt); f.writes.push('receipt'); f.attempt = clone(after);
  } };
  f.commands = { findOne: async (query, options) => {
    assert.deepEqual(options.projection, { _id: 1, checksum: 1, invocationId: 1 });
    return { _id: f.commandId, checksum: 'b'.repeat(64), invocationId: 'c'.repeat(64) };
  } };
  f.resolutions = { findOne: async () => clone(f.decision), insertOne: async row => {
    assert.equal(f.decision, undefined); f.writes.push('decision'); f.decision = clone(row);
  } };
  return f;
}
test('offline acceptance records an immutable decision before the exact receipt and replays without another write', async () => {
  const f = fixture(); const result = await recover(f);
  assert.equal(result.status, 'confirmed-accepted'); assert.deepEqual(f.writes, ['decision', 'receipt']);
  assert.equal(f.attempt.state, 'sent'); assert.equal(+f.attempt.finishedAt, 2000);
  assert.equal(f.decision.evidence, 'smtp-log-42');
  f.now = () => new Date(3000); assert.deepEqual(await recover(f), result);
  assert.deepEqual(f.writes, ['decision', 'receipt']);
});
test('uncertain insert and receipt acknowledgements are reconciled by exact readback', async () => {
  for (const stage of ['decision', 'receipt']) {
    const f = fixture(), collection = stage === 'decision' ? f.resolutions : f.attempts;
    const name = stage === 'decision' ? 'insertOne' : 'replaceOne', original = collection[name];
    collection[name] = async (...args) => { await original(...args); throw Error('ack lost'); };
    assert.equal((await recover(f)).status, 'confirmed-accepted');
  }
});
test('interruption leaves durable decision and retry uses its original confirmation time', async () => {
  const f = fixture(), replace = f.attempts.replaceOne;
  f.attempts.replaceOne = async () => { throw Error('offline interruption'); };
  await assert.rejects(recover(f), /offline interruption/);
  assert.ok(f.decision); assert.equal(f.attempt.state, 'sending');
  f.now = () => new Date(9000); f.attempts.replaceOne = replace;
  await recover(f); assert.equal(+f.attempt.finishedAt, 2000);
});
test('changed evidence, tampered decision, changed attempt and missing offline exclusivity refuse writes', async () => {
  for (const change of ['evidence', 'checksum', 'attempt', 'offline']) {
    const f = fixture(); const replace = f.attempts.replaceOne;
    f.attempts.replaceOne = async () => { throw Error('pause'); };
    await assert.rejects(recover(f)); f.attempts.replaceOne = replace;
    if (change === 'evidence') f.evidence = 'different';
    if (change === 'checksum') f.decision.checksum = '0'.repeat(64);
    if (change === 'attempt') f.attempt.attemptId = '87654321-1234-1234-1234-123456789abc';
    if (change === 'offline') f.assertOffline = async () => { throw Error('writers active'); };
    await assert.rejects(recover(f)); assert.deepEqual(f.writes, ['decision']);
  }
});
test('normal sent receipts are not rewritten and malformed records/inputs are rejected', async () => {
  const f = fixture(); f.attempt.state = 'sent'; f.attempt.finishedAt = new Date(1500);
  assert.equal((await recover(f)).status, 'already-sent'); assert.deepEqual(f.writes, []);
  for (const change of [f => { f.operator = ''; }, f => { f.evidence = 'line\nbreak'; },
    f => { f.attempt.extra = true; }, f => { f.commands.findOne = async () => null; },
    f => { f.now = () => new Date(500); }]) {
    const g = fixture(); change(g); await assert.rejects(recover(g)); assert.deepEqual(g.writes, []);
  }
});
test('CLI requires both offline and explicit full-acceptance assertions and rejects unknown/duplicate flags', () => {
  const args = ['--command', 'a'.repeat(64), '--attempt', '12345678-1234-1234-1234-123456789abc',
    '--operator', 'Maintainer', '--evidence', 'log-ref', '--offline', '--confirm-accepted'];
  assert.equal(parse(args).evidence, 'log-ref');
  for (const bad of [args.slice(0, -1), args.filter(x => x !== '--offline'), [...args, '--resend'], [...args, '--offline']]) assert.throws(() => parse(bad));
});
