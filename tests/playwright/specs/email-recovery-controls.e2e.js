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

test('a slow SMTP recipient remains visible while another recipient completes delivery', async ({ page, adminUser, user, user2 }) => {
  test.skip(!process.env.WEKAN_TEST_SMTP_PORT, 'Requires local SMTP capture');
  const [slowUser, fastUser] = [user, user2].sort((a, b) => a.id < b.id ? -1 : 1);
  let release;
  const held = new Promise(resolve => { release = resolve; });
  const sink = await smtpSink(Number(process.env.WEKAN_TEST_SMTP_PORT), {
    accept: async mail => { if (mail.recipients.includes(slowUser.email)) await held; return true; },
  });
  const slow = db.uid('slow-recipient'), fast = db.uid('fast-recipient');
  try {
    const due = new Date(Date.now() + 1000);
    db.insertMany('notificationEmailJobs', [
      queued(slow, slowUser.id, { nextAttemptAt: due }),
      queued(fast, fastUser.id, { nextAttemptAt: due }),
    ]);
    await expect.poll(() => db.findOne('notificationEmailJobs', { _id: fast })?.state, { timeout: 15000 }).toBe('sent');
    expect(db.findOne('notificationEmailJobs', { _id: slow }).state).toBe('pending');
    await loginWithToken(page, adminUser.id, adminUser.token);
    await navigateInApp(page, '/admin/problems/recovery');
    const panel = page.locator('.email-recovery-reports');
    await panel.locator('.js-table-page-search').fill(slowUser.id);
    await panel.locator('.js-table-page-search').press('Enter');
    await expect(panel).toContainText('Queued messages: 1');
    if (process.env.WEKAN_TEST_MAIL_TOTAL_TIMEOUT === '1000') {
      await expect.poll(() => db.findOne('notificationEmailJobs', { _id: slow })?.attempts).toBeGreaterThan(0);
    }
    release();
    await expect.poll(() => db.findOne('notificationEmailJobs', { _id: slow })?.state, { timeout: 15000 }).toBe('sent');
    expect(sink.messages.filter(mail => mail.recipients.includes(fastUser.email))).toHaveLength(1);
    // With a short total deadline the held DATA acknowledgement expires while
    // the administrator opens Recovery. Each persisted attempt may send the
    // body once; an unconfirmed body must not suppress its eventual retry.
    const receipt = db.findOne('notificationEmailJobs', { _id: slow });
    expect(sink.messages.filter(mail => mail.recipients.includes(slowUser.email)))
      .toHaveLength(receipt.cycleAttempts);
    expect(receipt.cycleAttempts).toBe(receipt.attempts + 1);
    if (process.env.WEKAN_TEST_MAIL_TOTAL_TIMEOUT === '1000') expect(receipt.attempts).toBeGreaterThan(0);
  } finally {
    release(); await sink.close();
    db.deleteMany('notificationEmailJobs', { _id: { $in: [slow, fast] } });
  }
});

for (const phase of ['greeting', 'idle', 'total']) test(`SMTP ${phase} timeout closes the socket and retains delivery for retry`, async ({ page, adminUser, user2 }) => {
  test.skip(phase === 'total' ? process.env.WEKAN_TEST_MAIL_TOTAL_TIMEOUT !== '1000' :
    process.env.WEKAN_TEST_MAIL_TIMEOUTS !== '1000',
    'Use one-second total timeout and longer phase limits, or one-second phase limits');
  let recovered = false, release;
  const held = new Promise(resolve => { release = resolve; });
  const sink = await smtpSink(Number(process.env.WEKAN_TEST_SMTP_PORT), {
    greet: () => phase !== 'greeting' || recovered,
    onMessage: (message, socket) => {
      if (phase !== 'total' || recovered) return;
      const timer = setInterval(() => socket.write('250-still processing\r\n'), 10);
      socket.on('close', () => clearInterval(timer));
    },
    accept: async () => { if (!recovered) await held; return true; },
  });
  const id = db.uid(`timeout-${phase}`);
  try {
    db.insertOne('notificationEmailJobs', queued(id, user2.id, { nextAttemptAt: new Date() }));
    await expect.poll(() => db.findOne('notificationEmailJobs', { _id: id })?.attempts, { timeout: 10000 }).toBe(1);
    await expect.poll(() => sink.connections()).toBe(0);
    const pending = db.findOne('notificationEmailJobs', { _id: id });
    expect(pending.state).toBe('pending'); expect(pending.html).toBe('PRIVATE-QUEUE-BODY');
    expect(pending.lastFailure).toBe('delivery-failed');
    if (phase === 'total') expect(sink.messages).toHaveLength(1);
    await loginWithToken(page, adminUser.id, adminUser.token);
    await navigateInApp(page, '/admin/problems/recovery');
    const panel = page.locator('.email-recovery-reports');
    await panel.locator('.js-table-page-search').fill(user2.id);
    await panel.locator('.js-table-page-search').press('Enter');
    await expect(panel).toContainText('Messages retrying: 1');
    recovered = true; release();
    await expect.poll(() => db.findOne('notificationEmailJobs', { _id: id })?.state, { timeout: 20000 }).toBe('sent');
    expect(db.findOne('notificationEmailJobs', { _id: id }).html).toBeUndefined();
  } finally {
    release(); await sink.close();
    db.deleteMany('notificationEmailJobs', { _id: id });
  }
});

test('deployment SMTP capacity keeps queued mail visible without spending retry attempts', async ({ page, adminUser, user2 }) => {
  test.skip(!process.env.WEKAN_TEST_SMTP_PORT, 'Requires local SMTP capture');
  const sink = await smtpSink(Number(process.env.WEKAN_TEST_SMTP_PORT));
  const owner = db.uid('capacity-owner'), id = db.uid('capacity-job');
  try {
    await expect.poll(() => db.countDocuments('notificationEmailSendSlots', {})).toBe(0);
    db.insertMany('notificationEmailSendSlots', Array.from({ length: 4 }, (_, slot) => ({
      _id: `slot-${slot}`, owner, expiresAt: new Date(Date.now() + 60000),
    })));
    db.insertOne('notificationEmailJobs', queued(id, user2.id, { cycleAttempts: 0, nextAttemptAt: new Date() }));
    await loginWithToken(page, adminUser.id, adminUser.token);
    await navigateInApp(page, '/admin/problems/recovery');
    const panel = page.locator('.email-recovery-reports');
    await panel.locator('.js-table-page-search').fill(user2.id);
    await panel.locator('.js-table-page-search').press('Enter');
    await expect(panel).toContainText('Queued messages: 1');
    await page.waitForTimeout(2200); // allow at least two ordinary queue scans
    const pending = db.findOne('notificationEmailJobs', { _id: id });
    expect(pending.state).toBe('pending');
    expect(pending.cycleAttempts).toBe(0); expect(pending.attempts).toBe(0);
    expect(sink.messages).toHaveLength(0);
    db.deleteMany('notificationEmailSendSlots', { owner });
    await expect.poll(() => db.findOne('notificationEmailJobs', { _id: id })?.state, { timeout: 15000 }).toBe('sent');
    expect(sink.messages).toHaveLength(1);
  } finally {
    db.deleteMany('notificationEmailSendSlots', { owner });
    db.deleteMany('notificationEmailJobs', { _id: id });
    await sink.close();
  }
});

test('Recovery preserves later mail when an old compacted cancellation is replayed', async ({ page, adminUser, user }) => {
  test.skip(process.env.WEKAN_TEST_EMAIL_RETENTION !== '1', 'Start app with EMAIL_RECEIPT_SWEEP_INTERVAL_MS=1000');
  const requestId = require('node:crypto').randomUUID();
  const oldId = db.uid('retention-old'), freshId = db.uid('retention-fresh');
  const userId = db.uid('retention-recipient');
  try {
    db.insertOne('notificationEmailJobs', queued(oldId, userId));
    await loginWithToken(page, adminUser.id, adminUser.token);
    const request = { userId, requestId, action: 'cancel' };
    await page.evaluate(request => Meteor.callAsync('controlEmailRecovery', request), request);
    db.updateOne('notificationEmailCommands', { _id: requestId }, { $set: { finishedAt: new Date('2000-01-01') } });
    await expect.poll(() => db.findOne('notificationEmailCommands', { _id: requestId })?.compactReceiptVersion,
      { timeout: 10000 }).toBe(1);
    db.insertOne('notificationEmailJobs', queued(freshId, userId));
    await page.evaluate(request => Meteor.callAsync('controlEmailRecovery', request), request);
    await navigateInApp(page, '/admin/problems/recovery');
    const panel = page.locator('.email-recovery-reports');
    await panel.locator('.js-table-page-search').fill(userId);
    await panel.locator('.js-table-page-search').press('Enter');
    await expect(panel).toContainText('Queued messages: 1');
    expect(db.findOne('notificationEmailJobs', { _id: freshId }).state).toBe('pending');
    expect(db.findOne('notificationEmailControls', { _id: userId }).cancelCount).toBe(1);
    await loginWithToken(page, user.id, user.token);
    const denied = await page.evaluate(async request => {
      try { await Meteor.callAsync('controlEmailRecovery', request); return 'allowed'; }
      catch (error) { return error.error; }
    }, request);
    expect(denied).toBe('not-authorized');
  } finally {
    db.deleteMany('notificationEmailJobs', { _id: { $in: [oldId, freshId] } });
    db.deleteMany('notificationEmailCommands', { _id: requestId });
    db.deleteMany('notificationEmailControls', { _id: userId });
  }
});
