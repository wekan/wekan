'use strict';
const { test, expect } = require('../fixtures');
const { loginWithToken, navigateInApp } = require('../helpers/auth');

test('admin can view live Meteor instrumentation while a regular user cannot', async ({ page, adminUser, user }) => {
  await loginWithToken(page, adminUser.id, adminUser.token);
  await navigateInApp(page, '/admin/problems/instrumentation');
  await expect(page.locator('.admin-pane-title')).toContainText('Instrumentation');
  await expect(page.locator('.table-page-table thead')).toContainText('Method or publication');
  await expect(page.locator('.table-page-status')).toContainText('DDP connections');

  const snapshot = await page.evaluate(() => window.Meteor.callAsync('getInstrumentationReport'));
  expect(snapshot.connections.opened).toBeGreaterThan(0);
  expect(snapshot.operations.some(row => row.kind === 'Method')).toBe(true);
  expect(JSON.stringify(snapshot)).not.toContain(adminUser.id);

  await loginWithToken(page, user.id, user.token);
  const denied = await page.evaluate(async () => {
    try { await window.Meteor.callAsync('getInstrumentationReport'); return null; }
    catch (error) { return error.error; }
  });
  expect(denied).toBe('not-authorized');
});
