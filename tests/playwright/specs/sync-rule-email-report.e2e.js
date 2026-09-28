'use strict';
const { randomBytes, randomUUID } = require('node:crypto');
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const { loginWithToken } = require('../helpers/auth');
test('only administrators can read bounded rule-email attempt metadata through DDP', async ({ page, user, adminUser }) => {
  const prefix = randomBytes(12).toString('hex');
  const ids = Array.from({ length: 12 }, (_, i) => `${prefix}${i.toString(16).padStart(40, '0')}`);
  for (const id of ids) db.insertOne('listSyncRuleEmailAttempts', { _id: id, version: 1,
    commandHash: 'a'.repeat(64), invocationId: 'b'.repeat(64), attemptId: randomUUID(),
    state: 'sending', startedAt: new Date(1000), mail: 'private body and address@example.org' });
  const query = { search: prefix, page: 0, status: 'unconfirmed' };
  try {
    await loginWithToken(page, user.id, user.token);
    const denied = await page.evaluate(async query => {
      try { await Meteor.callAsync('syncRuleEmailRecoveryReport', query); return 'accepted'; }
      catch (error) { return error.error; }
    }, query);
    expect(denied).toBe('not-authorized');
    await loginWithToken(page, adminUser.id, adminUser.token);
    const first = await page.evaluate(query => Meteor.callAsync('syncRuleEmailRecoveryReport', query), query);
    expect(first.total).toBe(12); expect(first.rows).toHaveLength(10);
    expect(first.rows[0].status).toBe('unconfirmed');
    expect(Object.keys(first.rows[0]).sort()).toEqual(['attemptId', 'commandId', 'finishedAt', 'invocationId', 'startedAt', 'status']);
    expect(JSON.stringify(first)).not.toContain('private body');
    expect(JSON.stringify(first)).not.toContain('address@example.org');
    const last = await page.evaluate(query => Meteor.callAsync('syncRuleEmailRecoveryReport', query), { ...query, page: 99 });
    expect(last.page).toBe(1); expect(last.rows).toHaveLength(2);
    expect(new Set([...first.rows, ...last.rows].map(row => row.commandId)).size).toBe(12);
  } finally { db.deleteMany('listSyncRuleEmailAttempts', { _id: { $in: ids } }); }
});
