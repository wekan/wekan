'use strict';
// #2713, maintainer decision of 2026-09-30: partial or unknown SMTP acceptance
// is resolved by an administrator - resend to unconfirmed recipients only, mark
// sent, or drop - and WeKan never resends an uncertain attempt by itself.
//
// Run: node --test tests/syncRuleEmailResolution.test.cjs
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const R = require('../server/lib/syncRuleEmailResolution');
const { dispatchRuleEmail } = require('../server/lib/syncRuleEmailDispatch');

const clone = value => (value === undefined || value === null ? value : structuredClone(value));
const matches = (row, query) => Object.entries(query).every(([key, value]) =>
  JSON.stringify(row[key]) === JSON.stringify(value));
function collection() {
  const rows = new Map();
  return {
    rows,
    async findOne(query) { return clone([...rows.values()].find(row => matches(row, query)) || null); },
    find(query) {
      const list = [...rows.values()].filter(row => matches(row, query));
      return { sort: () => ({ toArray: async () => list.map(clone) }) };
    },
    async insertOne(row) {
      if (rows.has(row._id)) throw Object.assign(new Error('duplicate'), { code: 11000 });
      rows.set(row._id, clone(row));
    },
    async replaceOne(filter, row) {
      const current = rows.get(filter._id);
      if (current && JSON.stringify(current) === JSON.stringify(filter)) rows.set(row._id, clone(row));
    },
    async updateOne(filter, update, { upsert } = {}) {
      let row = [...rows.values()].find(r => matches(r, filter));
      if (!row && !upsert) return;
      if (!row) { row = { ...filter }; rows.set(row._id, row); }
      Object.assign(row, clone(update.$set || {}));
      for (const [key, { $each }] of Object.entries(update.$addToSet || {})) {
        row[key] = [...new Set([...(row[key] || []), ...$each])];
      }
    },
  };
}
// Only the envelope is used: comma-separated `to`, plain `from`.
class Composer {
  constructor(mail) { this.mail = mail; }
  compile() { return { getEnvelope: () => ({ from: this.mail.from, to: this.mail.to.split(',').map(s => s.trim()) }) }; }
}

const commandId = 'a'.repeat(64), attemptId = '12345678-1234-1234-1234-123456789abc';
const START = 1_000_000;
function fixture({ accepted = ['a@example.org'] } = {}) {
  const f = { attempts: collection(), commands: collection(), outcomes: collection(), resolutions: collection(),
    MailComposer: Composer, commandId, operator: 'admin-user', sent: [], time: START + R.QUARANTINE_MS };
  f.now = () => new Date(f.time);
  f.attempts.rows.set(commandId, { _id: commandId, version: 1, commandHash: 'b'.repeat(64),
    invocationId: 'c'.repeat(64), attemptId, state: 'sending', startedAt: new Date(START) });
  f.commands.rows.set(commandId, { _id: commandId, checksum: 'b'.repeat(64), invocationId: 'c'.repeat(64),
    mail: { to: 'a@example.org, b@example.org, c@example.org', from: 'wekan@example.org', subject: 'S', text: 'T' } });
  if (accepted.length) f.outcomes.rows.set(commandId, { _id: commandId, attemptId, accepted });
  f.send = async mail => { f.sent.push(clone(mail)); return { accepted: mail.envelope.to }; };
  return f;
}

test('detail shows each recipient\'s status and waits out the quarantine', async () => {
  const f = fixture();
  f.time = START + R.QUARANTINE_MS - 1;
  let detail = await R.ruleEmailRecoveryDetail(f);
  assert.deepEqual(detail.recipients, [
    { address: 'a@example.org', status: 'accepted' },
    { address: 'b@example.org', status: 'unconfirmed' },
    { address: 'c@example.org', status: 'unconfirmed' },
  ]);
  assert.equal(detail.resolvable, false, 'the original send may still be in flight');
  f.time = START + R.QUARANTINE_MS;
  detail = await R.ruleEmailRecoveryDetail(f);
  assert.equal(detail.resolvable, true);
});

test('resend goes to the unconfirmed recipients only, with the original headers', async () => {
  const f = fixture();
  const result = await R.resendUnconfirmedRuleEmail(f);
  assert.equal(result.status, 'sent');
  assert.equal(f.sent.length, 1);
  assert.deepEqual(f.sent[0].envelope, { from: 'wekan@example.org', to: ['b@example.org', 'c@example.org'] });
  assert.equal(f.sent[0].to, 'a@example.org, b@example.org, c@example.org', 'headers are unchanged');
  assert.equal(f.attempts.rows.get(commandId).state, 'sent');
  await assert.rejects(R.resendUnconfirmedRuleEmail(f), /already-resolved/, 'a second resend is refused');
  assert.equal(f.sent.length, 1);
});

test('a partial resend records who accepted and leaves the attempt for the administrator', async () => {
  const f = fixture();
  f.send = async mail => { f.sent.push(mail); return { accepted: ['b@example.org'], rejected: ['c@example.org'] }; };
  assert.equal((await R.resendUnconfirmedRuleEmail(f)).status, 'partial');
  assert.equal(f.attempts.rows.get(commandId).state, 'sending');
  const detail = await R.ruleEmailRecoveryDetail(f);
  assert.deepEqual(detail.recipients.map(r => r.status), ['accepted', 'accepted', 'unconfirmed']);
  f.send = async mail => { f.sent.push(mail); return { accepted: mail.envelope.to }; };
  await R.resendUnconfirmedRuleEmail(f);
  assert.deepEqual(f.sent[1].envelope.to, ['c@example.org'], 'the next resend skips b too');
});

test('an uncertain resend blocks another one until its own quarantine ends (negative)', async () => {
  const f = fixture();
  f.send = async () => { throw new Error('connection reset'); };
  await assert.rejects(R.resendUnconfirmedRuleEmail(f), /resend-uncertain/);
  f.send = async mail => { f.sent.push(mail); return { accepted: mail.envelope.to }; };
  await assert.rejects(R.resendUnconfirmedRuleEmail(f), /resend-in-flight/);
  await assert.rejects(R.resolveRuleEmailAttempt({ ...f, decision: 'drop' }), /resend-in-flight/);
  assert.equal(f.sent.length, 0);
  f.time += R.QUARANTINE_MS;
  assert.equal((await R.resendUnconfirmedRuleEmail(f)).status, 'sent');
});

test('mark sent and drop are immutable, one per attempt, and replay without another write', async () => {
  for (const decision of ['mark-sent', 'drop']) {
    const f = fixture();
    const result = await R.resolveRuleEmailAttempt({ ...f, decision });
    assert.equal(result.status, decision === 'mark-sent' ? 'sent' : 'dropped');
    assert.equal(f.attempts.rows.get(commandId).finishedAt.getTime(), f.time);
    f.time += 5000;
    assert.deepEqual(await R.resolveRuleEmailAttempt({ ...f, decision }), result, 'same decision replays');
    const other = decision === 'drop' ? 'mark-sent' : 'drop';
    await assert.rejects(R.resolveRuleEmailAttempt({ ...f, decision: other }), /already-resolved/);
    assert.equal(f.sent.length, 0, 'deciding never sends');
  }
});

test('no decision before the quarantine, on a sent attempt, or with bad input (negative)', async () => {
  const early = fixture(); early.time = START + 1000;
  await assert.rejects(R.resolveRuleEmailAttempt({ ...early, decision: 'drop' }), /too-early/);
  await assert.rejects(R.resendUnconfirmedRuleEmail(early), /too-early/);
  const done = fixture(); done.attempts.rows.get(commandId).state = 'sent';
  done.attempts.rows.get(commandId).finishedAt = new Date(START + 1);
  await assert.rejects(R.resolveRuleEmailAttempt({ ...done, decision: 'drop' }), /already-resolved/);
  const f = fixture();
  await assert.rejects(R.resolveRuleEmailAttempt({ ...f, decision: 'resend' }), /invalid/);
  await assert.rejects(R.resolveRuleEmailAttempt({ ...f, decision: 'drop', operator: '' }), /invalid/);
  const all = fixture({ accepted: ['a@example.org', 'b@example.org', 'c@example.org'] });
  await assert.rejects(R.resendUnconfirmedRuleEmail(all), /nothing-to-resend/);
  const changed = fixture(); changed.commands.rows.get(commandId).checksum = 'd'.repeat(64);
  await assert.rejects(R.ruleEmailRecoveryDetail(changed), /command-changed/);
});

test('an offline acceptance decision excludes an online one, and the reverse', async () => {
  const f = fixture();
  f.resolutions.rows.set(R.offlineDecisionId(commandId, attemptId), { _id: R.offlineDecisionId(commandId, attemptId), decision: 'accepted' });
  await assert.rejects(R.resolveRuleEmailAttempt({ ...f, decision: 'drop' }), /already-resolved/);
  const recovery = fs.readFileSync(path.join(__dirname, '../server/lib/syncRuleEmailRecovery.js'), 'utf8');
  assert.match(recovery, /\['rule-email-resolution', commandId, attemptId\][\s\S]*?decision-conflict/);
  assert.equal(R.decisionId(commandId, attemptId).length, 64);
});

test('dispatch completes a dropped attempt without mail and records a partial acceptance', async () => {
  const src = fs.readFileSync(path.join(__dirname, '../server/lib/syncRuleEmailDispatch.js'), 'utf8');
  assert.match(src, /existing\.state === 'sent' \|\| existing\.state === 'dropped'\) return command\.invocationId/);
  assert.match(src, /recordRuleEmailOutcome\(/);
  // Negative: nothing in the dispatch path resends an existing sending attempt.
  assert.match(src, /throw new Error\('sync-rule-email-delivery-uncertain'\)/);
  assert.equal(typeof dispatchRuleEmail, 'function');
  const outcomes = collection();
  const accepted = await R.recordRuleEmailOutcome({ outcomes, commandId, attemptId,
    recipients: ['a@example.org', 'b@example.org'], result: { accepted: [{ address: 'a@example.org' }, 'intruder@example.org'] } });
  assert.deepEqual(accepted, ['a@example.org'], 'only the command\'s own recipients are stored');
  assert.deepEqual(outcomes.rows.get(commandId).accepted, ['a@example.org']);
});

test('every resolution method is admin-only, rate limited and serialized per command', () => {
  const src = fs.readFileSync(path.join(__dirname, '../server/methods/syncRuleEmailRecovery.js'), 'utf8');
  for (const name of ['syncRuleEmailRecoveryDetail', 'syncRuleEmailRecoveryResolve', 'syncRuleEmailRecoveryResend']) {
    const at = src.indexOf(`async ${name}(`);
    assert.ok(at > 0, name);
    const body = src.slice(at, src.indexOf('\n  },', at));
    assert.match(body, /check\(commandId, CommandId\)/, `${name} validates its id`);
    assert.match(body, /await assertAdmin\(this\.userId\)/, `${name} is admin-only`);
    assert.ok(src.includes(`'${name}'`), `${name} is rate limited`);
  }
  for (const name of ['syncRuleEmailRecoveryResolve', 'syncRuleEmailRecoveryResend']) {
    const at = src.indexOf(`async ${name}(`);
    assert.match(src.slice(at, src.indexOf('\n  },', at)), /exclusive\(commandId/, `${name} holds the per-command lease`);
  }
  assert.match(src, /withEmailSlot\(/, 'a resend takes one of the shared email slots');
  // Negative: an unknown refusal never reaches the browser with its text.
  assert.match(src, /return new Meteor\.Error\('rule-email-resolution-failed'\)/);
});
