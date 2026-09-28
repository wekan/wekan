'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs'), vm = require('node:vm');
function fixture(scenario) {
  let methods, reads = 0, writes = 0, checks = 0;
  const rules = [];
  const collection = { rawCollection: () => ({}) };
  const context = { Meteor: { methods: value => { methods = value; },
    users: { ...collection, findOneAsync: async () => ({ isAdmin: scenario === 'admin' || scenario === 'disabled' || scenario === 'revoked' && ++checks === 1,
      loginDisabled: scenario === 'disabled' }) }, Error: class extends Error { constructor(code) { super(code); this.error = code; } } },
    DDPRateLimiter: { addRule: (...args) => rules.push(args) }, check() {},
    EmailJobs: collection, EmailLeases: collection, EmailControls: collection, EmailCommands: collection,
    require: id => id.endsWith('emailOutboxReport') ? { emailOutboxReport: async () => { reads++; return { rows: [], total: 0 }; } } :
      { controlEmailOutbox: async options => { await options.assertAdmin(); writes++; return { status: 'completed' }; } },
  };
  vm.runInNewContext(fs.readFileSync(require.resolve('../server/methods/emailRecovery.js'), 'utf8').replace(/^import .*;\n/gm, ''), context);
  return { methods, rules, count: () => ({ reads, writes }) };
}
test('private queue report requires current admin access before and after reading', async () => {
  for (const scenario of ['admin', 'ordinary', 'anonymous', 'disabled', 'revoked']) {
    const f = fixture(scenario), ctx = { userId: scenario === 'anonymous' ? null : 'user' };
    const call = () => f.methods.emailRecoveryReport.call(ctx, { search: '', page: 1 });
    if (scenario === 'admin') assert.equal((await call()).total, 0);
    else await assert.rejects(call(), /not-authorized/);
    assert.equal(f.count().reads, ['admin', 'revoked'].includes(scenario) ? 1 : 0);
  }
});
test('mutation rechecks administrator access inside the reservation and rate limits both methods', async () => {
  for (const action of ['pause', 'resume', 'cancel', 'retry']) for (const scenario of ['admin', 'ordinary', 'anonymous', 'disabled', 'revoked']) {
    const f = fixture(scenario), ctx = { userId: scenario === 'anonymous' ? null : 'user' };
    const call = () => f.methods.controlEmailRecovery.call(ctx, { userId: 'recipient', action, requestId: 'x'.repeat(32) });
    if (scenario === 'admin') assert.equal((await call()).status, 'completed');
    else await assert.rejects(call(), /not-authorized/);
    assert.equal(f.count().writes, scenario === 'admin' ? 1 : 0);
    assert.deepEqual(f.rules.map(rule => rule[0].name), ['emailRecoveryReport', 'controlEmailRecovery']);
  }
});
