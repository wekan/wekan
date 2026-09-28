'use strict';
const { test, expect } = require('../fixtures');
const { loginWithToken, navigateInApp } = require('../helpers/auth');
const { smtpSink } = require('../helpers/smtpSink');
const db = require('../helpers/db');
function queued(id, userId, extra = {}) {
  return { _id: id, userId, eventId: id, boardId: null, cardId: null, state: 'pending', attempts: 0,
    subject: 'PRIVATE-QUEUE-SUBJECT', html: 'PRIVATE-QUEUE-BODY', language: 'en',
    createdAt: new Date(), nextAttemptAt: new Date(Date.now() + 86400000), ...extra };
}
test('Recovery groups email jobs by recipient, paginates, and denies non-admin access', async ({ page, adminUser, user }) => {
  const prefix = `mail-report-${Date.now()}.*`, ids = [];
  try {
    for (let i = 0; i < 13; i++) {
      const userId = `${prefix}-${String(i).padStart(2, '0')}`; ids.push(userId);
      for (let j = 0; j < 2; j++) db.insertOne('notificationEmailJobs', queued(`${userId}-${j}`, userId, { attempts: j * 3 }));
    }
    const empty = `${prefix}-empty`; ids.push(empty);
    db.insertOne('notificationEmailControls', { _id: empty, paused: true });
    db.insertOne('notificationEmailControls', { _id: ids[0], paused: true });
    await loginWithToken(page, adminUser.id, adminUser.token);
    await navigateInApp(page, '/admin/problems/recovery');
    const panel = page.locator('.email-recovery-reports');
    await expect(panel).toContainText('Email delivery queue');
    await panel.locator('.js-table-page-search').fill(prefix);
    await panel.locator('.js-table-page-search').press('Enter');
    await expect(panel.locator('tbody tr')).toHaveCount(10);
    await expect(panel.locator('tbody tr').first()).toContainText('Queued messages: 2');
    await expect(panel.locator('tbody tr').first()).toContainText('Messages retrying: 1');
    await expect(panel.locator('tbody tr').first()).toContainText('Paused');
    await panel.locator('.js-table-page-next').click();
    await expect(panel.locator('tbody tr')).toHaveCount(4);
    const emptyRow = panel.locator(`[data-recipient="${empty}"]`);
    await expect(emptyRow).toContainText('Queued messages: 0');
    await expect(emptyRow.locator('[data-action="resume"]')).toBeVisible();
    const report = await page.evaluate(search => Meteor.callAsync('emailRecoveryReport', { search, page: 1 }), prefix);
    expect(report.total).toBe(14); expect(JSON.stringify(report)).not.toMatch(/PRIVATE-QUEUE|html|subject|eventId|@/);
    await loginWithToken(page, user.id, user.token);
    const denied = await page.evaluate(async userId => {
      const results = [];
      for (const [method, args] of [
        ['emailRecoveryReport', { search: '', page: 1 }],
        ['controlEmailRecovery', { userId, action: 'pause', requestId: 'a'.repeat(32) }],
      ]) {
        try { await Meteor.callAsync(method, args); results.push('allowed'); }
        catch (error) { results.push(error.error); }
      }
      return results;
    }, ids[1]);
    expect(denied).toEqual(['not-authorized', 'not-authorized']);
    expect(db.findOne('notificationEmailControls', { _id: ids[1] })).toBeNull();
  } finally {
    db.deleteMany('notificationEmailJobs', { userId: { $in: ids } });
    db.deleteMany('notificationEmailControls', { _id: { $in: ids } });
  }
});
test('admin pauses new delivery, resumes it, confirms cancellation, and retries busy controls', async ({ page, adminUser, user2 }) => {
  test.skip(!process.env.WEKAN_TEST_SMTP_PORT, 'Requires local SMTP capture');
  const sink = await smtpSink(Number(process.env.WEKAN_TEST_SMTP_PORT));
  const first = db.uid('held-mail'), second = db.uid('new-held-mail'), third = db.uid('cancel-mail'), fourth = db.uid('later-mail');
  try {
    db.insertOne('notificationEmailJobs', queued(first, user2.id));
    await loginWithToken(page, adminUser.id, adminUser.token);
    await navigateInApp(page, '/admin/problems/recovery');
    const panel = page.locator('.email-recovery-reports');
    await panel.locator('.js-table-page-search').fill(user2.id);
    await panel.locator('.js-table-page-search').press('Enter');
    await expect(panel.locator('tbody tr')).toHaveCount(1);
    await panel.locator('[data-action="pause"]').click();
    await expect.poll(() => db.findOne('notificationEmailControls', { _id: user2.id })?.paused).toBe(true);
    db.updateOne('notificationEmailJobs', { _id: first }, { $set: { nextAttemptAt: new Date() } });
    db.insertOne('notificationEmailJobs', queued(second, user2.id, { nextAttemptAt: new Date() }));
    await page.waitForTimeout(2200);
    expect(sink.messages.filter(mail => mail.recipients.includes(user2.email))).toHaveLength(0);
    expect(db.find('notificationEmailJobs', { userId: user2.id, state: 'pending' })).toHaveLength(2);
    await panel.locator('[data-action="refresh-email"]').click();
    await expect(panel).toContainText('Queued messages: 2');
    await panel.locator('[data-action="resume"]').click();
    await expect.poll(() => db.find('notificationEmailJobs', { userId: user2.id, state: 'sent' }).length,
      { timeout: 15000 }).toBe(2);
    expect(sink.messages.filter(mail => mail.recipients.includes(user2.email))).toHaveLength(1);
    db.insertOne('notificationEmailJobs', queued(third, user2.id));
    await panel.locator('[data-action="refresh-email"]').click();
    await expect(panel.locator('[data-action="cancel"]')).toBeVisible();
    page.once('dialog', dialog => dialog.accept());
    await panel.locator('[data-action="cancel"]').click();
    await expect.poll(() => db.findOne('notificationEmailJobs', { _id: third }).state).toBe('cancelled');
    expect(db.findOne('notificationEmailJobs', { _id: third }).html).toBeUndefined();
    const cancelledRequest = db.findOne('notificationEmailControls', { _id: user2.id }).lastRequestId;
    db.insertOne('notificationEmailJobs', queued(fourth, user2.id));
    await page.evaluate(request => Meteor.callAsync('controlEmailRecovery', request),
      { userId: user2.id, action: 'cancel', requestId: cancelledRequest });
    expect(db.findOne('notificationEmailJobs', { _id: fourth }).state).toBe('pending');
    db.insertOne('notificationEmailLeases', { _id: user2.id, owner: 'test-in-flight', expiresAt: new Date(Date.now() + 60000) });
    await panel.locator('[data-action="refresh-email"]').click();
    await panel.locator('[data-action="pause"]').click();
    await expect(panel.locator('[role="alert"]')).toContainText('in progress');
    expect(db.findOne('notificationEmailControls', { _id: user2.id }).paused).toBe(false);
    db.deleteMany('notificationEmailLeases', { _id: user2.id, owner: 'test-in-flight' });
    await panel.locator('[data-action="pause"]').click();
    await expect.poll(() => db.findOne('notificationEmailControls', { _id: user2.id }).paused).toBe(true);
  } finally {
    db.deleteMany('notificationEmailJobs', { userId: user2.id });
    db.deleteMany('notificationEmailLeases', { _id: user2.id });
    db.deleteMany('notificationEmailControls', { _id: user2.id });
    db.deleteMany('notificationEmailCommands', { userId: user2.id });
    await sink.close();
  }
});

test('permanent SMTP rejection stays stopped until an administrator retries delivery', async ({ page, adminUser, user2 }) => {
  test.skip(!process.env.WEKAN_TEST_SMTP_PORT, 'Requires local SMTP capture');
  let accept = false;
  const sink = await smtpSink(Number(process.env.WEKAN_TEST_SMTP_PORT), { accept: () => accept, rejectionCode: 550 });
  const id = db.uid('rejected-mail');
  try {
    db.insertOne('notificationEmailJobs', queued(id, user2.id, { nextAttemptAt: new Date() }));
    await expect.poll(() => db.findOne('notificationEmailJobs', { _id: id })?.state, { timeout: 15000 }).toBe('failed');
    expect(db.findOne('notificationEmailJobs', { _id: id }).lastFailure).toBe('smtp-rejected');
    await loginWithToken(page, adminUser.id, adminUser.token);
    await navigateInApp(page, '/admin/problems/recovery');
    const panel = page.locator('.email-recovery-reports');
    await panel.locator('.js-table-page-search').fill(user2.id);
    await panel.locator('.js-table-page-search').press('Enter');
    await expect(panel).toContainText('Stopped messages: 1');
    await expect(panel).not.toContainText('PRIVATE-QUEUE');
    await page.waitForTimeout(5500);
    expect(db.findOne('notificationEmailJobs', { _id: id }).cycleAttempts).toBe(1);
    accept = true;
    await panel.locator('[data-action="retry"]').click();
    await expect.poll(() => db.findOne('notificationEmailJobs', { _id: id })?.state, { timeout: 15000 }).toBe('sent');
    const receipt = db.findOne('notificationEmailJobs', { _id: id });
    expect(receipt.html).toBeUndefined(); expect(receipt.cycleAttempts).toBe(1); expect(receipt.attempts).toBe(1);
    expect(sink.messages.filter(mail => mail.recipients.includes(user2.email))).toHaveLength(2);
  } finally {
    db.deleteMany('notificationEmailJobs', { userId: user2.id });
    db.deleteMany('notificationEmailLeases', { _id: user2.id });
    db.deleteMany('notificationEmailControls', { _id: user2.id });
    db.deleteMany('notificationEmailCommands', { userId: user2.id });
    await sink.close();
  }
});
