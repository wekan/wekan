'use strict';
const { test, expect } = require('../fixtures');
const { loginWithToken, navigateInApp } = require('../helpers/auth');
const db = require('../helpers/db');
const { canonical, sha256 } = require('../../../models/lib/changeHistoryIntegrity');
const { planId } = require('../../../server/lib/activityNotificationPlan');
// Run seed, restart the app against the same database with a one-second
// recovery interval, then run verify. The seed phase deliberately retains data.
const phase = process.env.WEKAN_TEST_ACTIVITY_HOLD_RESTART;
const id = 'activity-hold-restart-fixture';
const intentId = sha256(canonical(['activity-notification-intent', id]));
function clean() {
  for (const collection of ['activityNotificationIntents', 'activityNotificationControls', 'activityNotificationLeases']) db.deleteMany(collection, { _id: intentId });
  db.deleteMany('activities', { _id: id });
  db.deleteMany('activityNotificationPlans', { _id: planId(id) });
}
test('a persisted operator hold survives server restart and resume releases automatic recovery', async ({ page, adminUser }) => {
  test.skip(!['seed', 'verify'].includes(phase), 'Requires explicit seed/restart/verify phases');
  if (phase === 'seed') {
    clean();
    const activity = { _id: id, activityType: 'createCard', createdAt: new Date(1000), modifiedAt: new Date(1000) };
    const activityHash = sha256(canonical(activity));
    const plan = { version: 1, activityId: id, activityHash, dispatchUserId: null, recipients: [] };
    // Reserve delivery until the administrator is logged in, then release the
    // fixture reservation before asking the production control method to pause.
    db.insertOne('activityNotificationLeases', { _id: intentId, owner: 'fixture', expiresAt: new Date(Date.now() + 60000) });
    db.insertOne('activities', activity);
    db.insertOne('activityNotificationIntents', { _id: intentId, activityHash, version: 1, state: 'pending', activity, writerId: 'fixture', dispatchUserId: null });
    db.insertOne('activityNotificationPlans', { _id: planId(id), checksum: sha256(canonical(plan)), plan });
    await loginWithToken(page, adminUser.id, adminUser.token);
    db.deleteMany('activityNotificationLeases', { _id: intentId });
    const result = await page.evaluate(request => Meteor.callAsync('controlActivityNotificationRecovery', request),
      { intentId, paused: true, expectedRevision: 0, requestId: 'restart-pause-request-1234' });
    expect(result).toEqual({ revision: 1, paused: true });
    return;
  }
  try {
    await loginWithToken(page, adminUser.id, adminUser.token);
    await navigateInApp(page, '/admin/problems/recovery');
    const panel = page.locator('.activity-notification-recovery-reports');
    await panel.locator('.js-table-page-search').fill(id);
    await panel.locator('.js-table-page-search').press('Enter');
    await expect(panel).toContainText('Activity notification delivery is paused.');
    // Observe more than two automatic recovery intervals after app startup.
    await page.waitForTimeout(2200);
    expect(db.findOne('activityNotificationIntents', { _id: intentId }).state).toBe('pending');
    expect(db.findOne('activityNotificationControls', { _id: intentId }).paused).toBe(true);
    await panel.locator('.js-control-activity-notification').click();
    await expect.poll(() => db.findOne('activityNotificationIntents', { _id: intentId }).state, { timeout: 15000 }).toBe('completed');
    expect(db.findOne('activityNotificationControls', { _id: intentId })).toMatchObject({ revision: 2, paused: false });
  } finally { clean(); }
});
