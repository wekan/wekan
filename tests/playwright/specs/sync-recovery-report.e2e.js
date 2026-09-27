'use strict';
const { test, expect } = require('../fixtures');
const { loginWithToken, navigateInApp } = require('../helpers/auth');
const db = require('../helpers/db');

test('Recovery shows paged Sync diagnostics and denies non-administrators', async ({ page, adminUser, user }) => {
  const listId = `recovery-${Date.now()}.*`;
  try {
    for (let i = 0; i < 12; i++) db.insertOne('listSyncRunReports', {
      _id: `${listId}-${i}`, boardId: 'diagnostic-board', listId, startedAt: new Date(),
      status: i === 11 ? 'failed' : 'unfinished', token: 'PRIVATE-TOKEN',
      coverage: { source: { rows: [{ path: '/<script>extension', reason: 'unmapped', count: 1 }] } },
    });
    await loginWithToken(page, adminUser.id, adminUser.token);
    await navigateInApp(page, '/admin/problems/recovery');
    const panel = page.locator('.sync-recovery-reports');
    await expect(panel).toContainText('Sync run diagnostics');
    await panel.locator('.js-table-page-search').fill(listId);
    await panel.locator('.js-table-page-search').press('Enter');
    await expect(panel.locator('tbody tr')).toHaveCount(10);
    await expect(panel).toContainText('In progress or interrupted');
    await panel.locator('summary').first().click();
    await expect(panel).toContainText('/<script>extension');
    await expect(panel.locator('script')).toHaveCount(0);
    await expect(panel).not.toContainText('PRIVATE-TOKEN');
    await panel.locator('.js-table-page-next').click();
    await expect(panel.locator('tbody tr')).toHaveCount(1);
    await expect(panel.locator('.table-page-page-info')).toHaveText('2 / 2');
    await panel.locator('.js-table-page-filter').selectOption('failed');
    await expect(panel).toContainText('Failed; partial changes possible');
    const report = await page.evaluate(query => Meteor.callAsync('syncRecoveryReport', query), { search: listId, status: 'all', page: 1 });
    expect(report.total).toBe(12);expect(JSON.stringify(report)).not.toContain('PRIVATE-TOKEN');
    db.updateOne('listSyncRunReports', { listId, status: 'failed' }, { $set: { status: 'completed' } });
    await panel.locator('[data-action="refresh-sync"]').click();
    await expect(panel.locator('tbody tr')).toHaveCount(0);
    await expect(panel).toContainText('No recorded Sync runs.');
    await loginWithToken(page, user.id, user.token);
    const denied = await page.evaluate(async () => {
      try { await Meteor.callAsync('syncRecoveryReport', { search: '', status: 'all', page: 1 }); return 'allowed'; }
      catch (error) { return error.error; }
    });
    expect(denied).toBe('not-authorized');
  } finally { db.deleteMany('listSyncRunReports', { listId }); }
});
