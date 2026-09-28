'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs'), vm = require('node:vm');
const { syncRuleEmailReport: report } = require('../server/lib/syncRuleEmailReport');
test('report limits projections and strips private fields even from malformed rows', async () => {
  let projection, limit;
  const db = { countDocuments: async () => 1, find: (_query, options) => {
    projection = options.projection;
    return { sort() { return this; }, skip() { return this; }, limit(value) { limit = value; return this; },
      toArray: async () => [{ _id: 'private@example.org', invocationId: 'private body', attemptId: 'smtp password', startedAt: 'invalid', state: 'sent', mail: 'private' }] };
  } };
  const result = await report(db, { search: '', page: 100, status: 'all' });
  assert.equal(result.page, 0); assert.equal(limit, 10);
  assert.equal(projection.mail, undefined); assert.equal(projection.to, undefined);
  assert.deepEqual(result.rows, [{ commandId: null, invocationId: null, attemptId: null, status: 'invalid', startedAt: null, finishedAt: null }]);
});
test('invalid query parameters fail before database access', async () => {
  for (const patch of [{ search: 'x'.repeat(129) }, { page: -1 }, { page: 0.5 }, { page: Infinity }, { status: 'retry' }]) {
    await assert.rejects(report({}, { search: '', page: 0, status: 'all', ...patch }), /report-invalid/);
  }
});
test('method checks administrator access before and after reads and hides backend errors', async () => {
  let handler, admin = true, reads = 0, revoked = false, failure = false;
  class MeteorError extends Error { constructor(code) { super(code); this.error = code; } }
  const context = { Meteor: { Error: MeteorError, users: { findOneAsync: async () => ({ isAdmin: admin, loginDisabled: revoked }) },
    methods: methods => { handler = methods.syncRuleEmailRecoveryReport; } }, check() {},
    DDPRateLimiter: { addRule(rule, limit, window) { assert.equal(rule.name, 'syncRuleEmailRecoveryReport'); assert.equal(limit, 30); assert.equal(window, 10000); } },
    SyncRuleEmailAttempts: { rawCollection: () => ({}) }, require: () => ({ syncRuleEmailReport: async () => {
      reads++; if (failure) throw new Error('database password secret'); revoked = true; return { rows: [] };
    } }) };
  vm.runInNewContext(fs.readFileSync(require.resolve('../server/methods/syncRuleEmailRecovery'), 'utf8').replace(/^import .*;\n/gm, ''), context);
  admin = false;
  await assert.rejects(handler.call({ userId: 'member' }, {}), /not-authorized/); assert.equal(reads, 0);
  admin = true;
  await assert.rejects(handler.call({ userId: 'admin' }, {}), /not-authorized/); assert.equal(reads, 1);
  revoked = false; failure = true;
  await assert.rejects(handler.call({ userId: 'admin' }, {}), error => error.error === 'sync-rule-email-report-unavailable' && !error.message.includes('secret'));
});
