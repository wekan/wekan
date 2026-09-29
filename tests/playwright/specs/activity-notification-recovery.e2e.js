'use strict';
const { test, expect } = require('../fixtures');
const { loginWithToken, navigateInApp } = require('../helpers/auth');
const db = require('../helpers/db');
const { canonical, sha256 } = require('../../../models/lib/changeHistoryIntegrity');
const { planId } = require('../../../server/lib/activityNotificationPlan');
function seed(id, activity, recipients) {
  const activityHash = sha256(canonical(activity));
  const intentId = sha256(canonical(['activity-notification-intent', id]));
  if (recipients) {
    db.insertOne('activities', activity);
    const plan = { version: 1, activityId: id, activityHash, dispatchUserId: null, recipients };
    db.insertOne('activityNotificationPlans', { _id: planId(id), checksum: sha256(canonical(plan)), plan });
  }
  // Publish the pending intent last: the live recovery worker must not race
  // fixture setup and create a competing plan before our stored plan exists.
  db.insertOne('activityNotificationIntents', { _id: intentId, activityHash, version: 1, state: 'pending',
    activity, writerId: 'test-writer', dispatchUserId: null });
  return intentId;
}
function cleanup(ids) {
  db.deleteMany('activityNotificationIntents', { _id: { $in: ids.map(id => sha256(canonical(['activity-notification-intent', id]))) } });
  db.deleteMany('activityNotificationControls', { _id: { $in: ids.map(id => sha256(canonical(['activity-notification-intent', id]))) } });
  db.deleteMany('activityNotificationLeases', { _id: { $in: ids.map(id => sha256(canonical(['activity-notification-intent', id]))) } });
  db.deleteMany('activityNotificationPlans', { _id: { $in: ids.map(planId) } });
  db.deleteMany('activities', { _id: { $in: ids } });
  db.deleteMany('notificationEmailJobs', { eventId: { $in: ids } });
}
test('Recovery paginates pending activity summaries, disables orphan retries and denies ordinary users', async ({ page, adminUser, user }) => {
  const prefix = db.uid('activity-report') + '.*[x]', ids = [];
  try {
    for (let i = 0; i < 13; i++) {
      const id = `${prefix}-${i}`; ids.push(id);
      seed(id, { _id: id, activityType: 'createCard', boardId: prefix, createdAt: new Date(), privateContent: 'PRIVATE BODY' });
    }
    await loginWithToken(page, adminUser.id, adminUser.token);
    await navigateInApp(page, '/admin/problems/recovery');
    const panel = page.locator('.activity-notification-recovery-reports');
    await expect(panel).toContainText('Pending activity notifications');
    await panel.locator('.js-table-page-search').fill(prefix);
    await panel.locator('.js-table-page-search').press('Enter');
    await expect(panel.locator('tbody tr')).toHaveCount(10);
    await expect(panel.locator('tbody tr').first()).toContainText('Original activity is missing');
    await expect(panel.locator('.js-retry-activity-notification').first()).toBeDisabled();
    await panel.locator('.js-table-page-next').click();
    await expect(panel.locator('tbody tr')).toHaveCount(3);
    const report = await page.evaluate(search => Meteor.callAsync('activityNotificationRecoveryReport', { search, page: 1 }), prefix);
    expect(report.total).toBe(13);
    expect(JSON.stringify(report)).not.toMatch(/PRIVATE|recipients|writerId|activityHash/);
    await loginWithToken(page, user.id, user.token);
    const denied = await page.evaluate(async intentId => {
      const results = [];
      for (const [method, request] of [['activityNotificationRecoveryReport', { search: '', page: 1 }], ['retryActivityNotification', { intentId }], ['controlActivityNotificationRecovery', { intentId, paused: true, expectedRevision: 0, requestId: 'a'.repeat(32) }], ['cancelActivityNotificationRecovery', { intentId, expectedRevision: 0, requestId: 'b'.repeat(32) }]]) {
        try { await Meteor.callAsync(method, request); results.push('allowed'); } catch (error) { results.push(error.error); }
      }
      return results;
    }, sha256(canonical(['activity-notification-intent', ids[0]])));
    expect(denied).toEqual(['not-authorized', 'not-authorized', 'not-authorized', 'not-authorized']);
    expect(db.find('activities', { _id: { $in: ids } })).toHaveLength(0);
  } finally { cleanup(ids); }
});
test('manual retry delivers a stored plan once and removes completed work from the report', async ({ page, adminUser, user2 }) => {
  const id = db.uid('manual-activity');
  try {
    // A disabled recipient keeps automatic recovery from racing the manual UI.
    db.updateOne('users', { _id: user2.id }, { $set: { loginDisabled: true, 'profile.notifyOverrideEmail': true } });
    const intentId = seed(id, { _id: id, activityType: 'createCard', createdAt: new Date(1000), modifiedAt: new Date(1000) },
      [{ userId: user2.id, tray: false, email: { userId: user2.id, eventId: id, boardId: null, cardId: null,
        language: 'en', subject: 'PRIVATE SUBJECT', html: 'PRIVATE BODY' } }]);
    await loginWithToken(page, adminUser.id, adminUser.token);
    await navigateInApp(page, '/admin/problems/recovery');
    const panel = page.locator('.activity-notification-recovery-reports');
    await panel.locator('.js-table-page-search').fill(id);
    await panel.locator('.js-table-page-search').press('Enter');
    await expect(panel.locator('tbody tr')).toHaveCount(1);
    await panel.locator('.js-control-activity-notification').click();
    await expect(panel).toContainText('Activity notification delivery is paused.');
    await expect(panel.locator('.js-retry-activity-notification')).toBeDisabled();
    const held = db.findOne('activityNotificationControls', { _id: intentId });
    expect(held.revision).toBe(1);
    await page.reload();
    await panel.locator('.js-table-page-search').fill(id);
    await panel.locator('.js-table-page-search').press('Enter');
    await expect(panel).toContainText('Activity notification delivery is paused.');
    await panel.locator('.js-control-activity-notification').click();
    await expect(panel.locator('.js-retry-activity-notification')).toBeEnabled();
    expect(db.findOne('activityNotificationControls', { _id: intentId }).revision).toBe(2);
    const stale = await page.evaluate(async request => {
      try { await Meteor.callAsync('controlActivityNotificationRecovery', request); return 'allowed'; }
      catch (error) { return error.error; }
    }, { intentId, paused: true, expectedRevision: 0, requestId: held.requestId });
    expect(stale).toBe('activity-recovery-control-conflict');
    expect(db.findOne('activityNotificationControls', { _id: intentId }).paused).toBe(false);
    await panel.locator('.js-retry-activity-notification').click();
    await expect(panel.locator('[role="alert"]')).toContainText('no longer permit delivery');
    expect(db.find('notificationEmailJobs', { eventId: id })).toHaveLength(0);
    db.updateOne('users', { _id: user2.id }, { $set: { loginDisabled: false } });
    await panel.locator('.js-retry-activity-notification').click();
    await expect.poll(() => db.findOne('activityNotificationIntents', { _id: intentId })?.state).toBe('completed');
    await expect(panel.locator('tbody tr')).toHaveCount(0);
    expect(db.find('notificationEmailJobs', { eventId: id })).toHaveLength(1);
    const repeat = await page.evaluate(intentId => Meteor.callAsync('retryActivityNotification', { intentId }), intentId);
    expect(repeat.status).toBe('skipped');
    expect(db.find('notificationEmailJobs', { eventId: id })).toHaveLength(1);
    expect(db.findOne('activityNotificationPlans', { _id: planId(id) }).plan).toBeUndefined();
  } finally { cleanup([id]); }
});
test('cancellation requires confirmation, stops remaining delivery and cannot be resumed', async ({ page, adminUser, user2 }) => {
  const id = db.uid('cancel-activity'), orphan = db.uid('cancel-orphan');
  try {
    db.updateOne('users', { _id: user2.id }, { $set: { loginDisabled: true, 'profile.notifyOverrideEmail': true } });
    const intentId = seed(id, { _id: id, activityType: 'createCard', createdAt: new Date(1000), modifiedAt: new Date(1000) },
      [{ userId: user2.id, tray: false, email: { userId: user2.id, eventId: id, boardId: null, cardId: null,
        language: 'en', subject: 'PRIVATE SUBJECT', html: 'PRIVATE BODY' } }]);
    const orphanIntent = seed(orphan, { _id: orphan, activityType: 'createCard', createdAt: new Date(1000), modifiedAt: new Date(1000) });
    await loginWithToken(page, adminUser.id, adminUser.token);
    await navigateInApp(page, '/admin/problems/recovery');
    const panel = page.locator('.activity-notification-recovery-reports');
    await panel.locator('.js-table-page-search').fill(id);
    await panel.locator('.js-table-page-search').press('Enter');
    await expect(panel.locator('tbody tr')).toHaveCount(1);
    page.once('dialog', dialog => dialog.dismiss());
    await panel.locator('.js-cancel-activity-notification').click();
    expect(db.findOne('activityNotificationControls', { _id: intentId })).toBeNull();
    page.once('dialog', dialog => dialog.accept());
    await panel.locator('.js-cancel-activity-notification').click();
    await expect(panel).toContainText('Activity notification delivery is cancelled.');
    await expect(panel.locator('.js-control-activity-notification')).toBeDisabled();
    await expect(panel.locator('.js-retry-activity-notification')).toBeDisabled();
    db.updateOne('users', { _id: user2.id }, { $set: { loginDisabled: false } });
    const outcomes = await page.evaluate(async intentId => {
      const results = [];
      for (const [method, request] of [['retryActivityNotification', { intentId }],
        ['controlActivityNotificationRecovery', { intentId, paused: false, expectedRevision: 1, requestId: 'late-resume-request-1234' }]]) {
        try { await Meteor.callAsync(method, request); results.push('allowed'); } catch (error) { results.push(error.error); }
      }
      return results;
    }, intentId);
    expect(outcomes).toEqual(['activity-recovery-status-cancelled', 'activity-recovery-control-conflict']);
    expect(db.find('notificationEmailJobs', { eventId: id })).toHaveLength(0);
    const receipt = db.findOne('activityNotificationControls', { _id: intentId });
    const repeated = await page.evaluate(request => Meteor.callAsync('cancelActivityNotificationRecovery', request),
      { intentId, expectedRevision: 0, requestId: receipt.requestId });
    expect(repeated).toEqual({ revision: 1, paused: true, cancelled: true });
    await panel.locator('.js-table-page-search').fill(orphan);
    await panel.locator('.js-table-page-search').press('Enter');
    await expect(panel).toContainText('Original activity is missing');
    page.once('dialog', dialog => dialog.accept());
    await panel.locator('.js-cancel-activity-notification').click();
    await expect(panel).toContainText('Activity notification delivery is cancelled.');
    expect(db.findOne('activityNotificationControls', { _id: orphanIntent }).cancelled).toBe(true);
    expect(db.findOne('activityNotificationIntents', { _id: orphanIntent }).activity).toBeUndefined();
    expect(db.findOne('activityNotificationIntents', { _id: intentId }).activity).toBeUndefined();
    expect(db.findOne('activityNotificationPlans', { _id: planId(id) }).plan).toBeUndefined();
    expect(db.findOne('activityNotificationPlans', { _id: planId(orphan) }).cancelled).toBe(true);
    expect(db.findOne('activities', { _id: orphan })).toBeNull();
  } finally { cleanup([id, orphan]); }
});
