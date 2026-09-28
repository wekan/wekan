'use strict';
const { randomBytes, randomUUID } = require('node:crypto');
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const { loginWithToken, navigateInApp } = require('../helpers/auth');
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


test('administrator filters, pages and refreshes rule email attempts in Recovery', async ({ page, adminUser }) => {
  const prefix = randomBytes(12).toString('hex');
  const ids = Array.from({ length: 13 }, (_, i) => `${prefix}${i.toString(16).padStart(40, '0')}`);
  for (const [i, id] of ids.entries()) db.insertOne('listSyncRuleEmailAttempts', {
    _id: id, version: 1, commandHash: 'a'.repeat(64), invocationId: 'b'.repeat(64),
    attemptId: randomUUID(), state: i === 12 ? 'sent' : 'sending', startedAt: new Date(1000),
    ...(i === 12 ? { finishedAt: new Date(2000) } : {}), mail: 'private body address@example.org',
  });
  try {
    await loginWithToken(page, adminUser.id, adminUser.token);
    await navigateInApp(page, '/admin/problems/recovery');
    const panel = page.locator('.sync-rule-email-recovery-reports');
    await expect(panel.getByRole('heading', { name: 'Rule email delivery' })).toBeVisible();
    const search = panel.locator('.js-table-page-search');
    await search.fill(prefix); await search.press('Enter');
    const rows = panel.locator('tr[data-command]');
    await expect(rows).toHaveCount(10);
    await expect(rows.first()).toHaveAttribute('data-command', ids[0]);
    await panel.locator('.js-table-page-next').click();
    await expect(rows).toHaveCount(3);
    await panel.locator('.js-table-page-prev').click();
    await expect(rows).toHaveCount(10);
    await panel.locator('.js-rule-email-status').selectOption('sent');
    await expect(rows).toHaveCount(1);
    await expect(rows.first()).toHaveAttribute('data-command', ids[12]);
    await expect(rows.first()).toContainText('Accepted by mail server');
    await panel.locator('.js-rule-email-status').selectOption('unconfirmed');
    await expect(rows).toHaveCount(10);
    await panel.locator('.js-table-page-next').click();
    await expect(rows).toHaveCount(2);
    await panel.locator('.js-table-page-action').click();
    await expect(rows).toHaveCount(2);
    await expect(panel).not.toContainText('private body');
    await expect(panel).not.toContainText('address@example.org');
    await search.fill(`${prefix}missing`); await search.press('Enter');
    await expect(rows).toHaveCount(0);
    await expect(panel).toContainText('No rule email attempts match this search.');
  } finally { db.deleteMany('listSyncRuleEmailAttempts', { _id: { $in: ids } }); }
});
