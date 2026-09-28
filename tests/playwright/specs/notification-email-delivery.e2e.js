'use strict';

const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const { loginWithToken, openBoard } = require('../helpers/auth');
const { smtpSink } = require('../helpers/smtpSink');
const BoardPage = require('../pages/BoardPage');
const CardPage = require('../pages/CardPage');

// Start the test app with MAIL_URL=smtp://127.0.0.1:<port> and
// EMAIL_NOTIFICATION_TIMEOUT=100; run this spec with workers=1.
for (const scope of ['board', 'list', 'card']) test(`#6658 ${scope} watching delivers SMTP email`, async ({ page, user, user2, board }) => {
  test.skip(!process.env.WEKAN_TEST_SMTP_PORT, 'Requires the app to use the local SMTP capture port');
  const sink = await smtpSink(Number(process.env.WEKAN_TEST_SMTP_PORT));
  try {
    db.addBoardMember({ boardId: board.boardId, userId: user2.id });
    db.updateOne('boards', { _id: board.boardId }, { $set: {
      watchers: [{ userId: user.id, level: 'watching' }, { userId: user2.id, level: scope === 'board' ? 'watching' : 'muted' }], notifyOverrideEmail: true,
    } });
    db.updateOne('users', { _id: user2.id }, { $set: { 'profile.notifyOverrideEmail': true } });
    if (scope !== 'board') db.updateOne(scope === 'list' ? 'lists' : 'cards', {
      _id: scope === 'list' ? board.listIds[0] : db.findCardIdByTitle({ boardId: board.boardId, title: 'Alpha Card' }),
    }, { $set: { watchers: [user2.id] } });
    const recipient = db.findOne('users', { _id: user2.id }).emails[0].address.toLowerCase();
    await loginWithToken(page, user.id, user.token);
    await openBoard(page, board.boardId, board.slug);
    const bp = new BoardPage(page);
    await bp.clickCard(board.listIds[0], 'Alpha Card');
    const cp = new CardPage(page);
    await cp.waitForOpen();
    await cp.addComment('Watched email delivery regression');
    await expect.poll(() => sink.messages.filter(mail => mail.recipients.includes(recipient)).length,
      { timeout: 15000 }).toBeGreaterThan(0);
    expect(sink.messages.map(mail => mail.data.replace(/=\r\n/g, '')).join('\n')).toContain('Watched email delivery regression');
    const queuedEvent = db.findOne('notificationEmailJobs', { userId: user2.id, boardId: board.boardId });
    expect(queuedEvent).toBeTruthy();
    const { canonical, sha256 } = require('../../../models/lib/changeHistoryIntegrity');
    const intentId = sha256(canonical(['activity-notification-intent', queuedEvent.eventId]));
    await expect.poll(() => db.findOne('activityNotificationIntents', { _id: intentId })?.state).toBe('completed');
    const receipt = db.findOne('activityNotificationIntents', { _id: intentId });
    expect(receipt.activity).toBeUndefined();
    expect(receipt.dispatchUserId).toBe(user.id);
    const planId = sha256(canonical(['activity-notification-plan', queuedEvent.eventId]));
    await expect.poll(() => db.findOne('activityNotificationPlans', { _id: planId })?.compactReceiptVersion).toBe(1);
    expect(db.findOne('activityNotificationPlans', { _id: planId }).plan).toBeUndefined();
    const delivered = () => sink.messages.filter(mail => mail.recipients.includes(recipient)).length;
    let count = delivered();
    await cp.editTitle('Email title change');
    await expect.poll(delivered).toBeGreaterThan(count);
    if (scope !== 'card') {
      count = delivered();
      await cp.close();
      await bp.openAddCardTop(board.listIds[0]);
      await bp.submitNewCard(board.listIds[0], 'New watched card');
      await expect.poll(delivered).toBeGreaterThan(count);
    }
    // The actor watches too, but own changes must not generate email.
    expect(sink.messages.some(mail => mail.recipients.includes(user.email))).toBe(false);
  } finally { await sink.close(); }
});

for (const reason of ['muted', 'email disabled']) test(`#6658 ${reason} recipient receives no SMTP email`, async ({ page, user, user2, adminUser, board }) => {
  test.skip(!process.env.WEKAN_TEST_SMTP_PORT, 'Requires the app to use the local SMTP capture port');
  const sink = await smtpSink(Number(process.env.WEKAN_TEST_SMTP_PORT));
  try {
    for (const member of [user2, adminUser]) db.addBoardMember({ boardId: board.boardId, userId: member.id });
    db.updateOne('boards', { _id: board.boardId }, { $set: {
      watchers: [{ userId: adminUser.id, level: 'watching' },
        { userId: user2.id, level: reason === 'muted' ? 'muted' : 'watching' }],
      notifyOverrideEmail: true,
    } });
    db.updateOne('users', { _id: user2.id }, { $set: { 'profile.notifyOverrideEmail': reason !== 'email disabled' } });
    await loginWithToken(page, user.id, user.token);
    await openBoard(page, board.boardId, board.slug);
    await new BoardPage(page).clickCard(board.listIds[0], 'Alpha Card');
    const cp = new CardPage(page);
    await cp.waitForOpen();
    await cp.openMemberSelector();
    await page.locator('.js-pop-over .js-select-member').filter({ hasText: user2.username }).click();
    await expect.poll(() => sink.messages.filter(mail => mail.recipients.includes(adminUser.email)).length).toBeGreaterThan(0);
    // Observe ten configured digest intervals after the control delivery.
    await expect(async () => {
      expect(sink.messages.some(mail => mail.recipients.includes(user2.email))).toBe(false);
      expect(db.findOne('users', { _id: user2.id }).profile.emailBuffer || []).toHaveLength(0);
    }).toPass({ timeout: 1000 });
    await page.waitForTimeout(1000);
    expect(sink.messages.some(mail => mail.recipients.includes(user2.email))).toBe(false);
  } finally { await sink.close(); }
});

test('custom-field notifications retain numeric zero and checkbox false in delivered email', async ({ page, user, user2, board }) => {
  test.skip(!process.env.WEKAN_TEST_SMTP_PORT, 'Requires the local SMTP capture port');
  const sink = await smtpSink(Number(process.env.WEKAN_TEST_SMTP_PORT));
  const card = db.find('cards', { boardId: board.boardId })[0];
  const numeric = db.uid('zero'), checkbox = db.uid('false');
  try {
    db.addBoardMember({ boardId: board.boardId, userId: user2.id });
    db.updateOne('boards', { _id: board.boardId }, { $set: {
      watchers: [{ userId: user2.id, level: 'watching' }], notifyOverrideEmail: true,
    } });
    db.updateOne('users', { _id: user2.id }, { $set: { 'profile.notifyOverrideEmail': true, 'profile.language': 'en' } });
    db.insertOne('customFields', { _id: numeric, boardIds: [board.boardId], name: 'ZeroField', type: 'currency' });
    db.insertOne('customFields', { _id: checkbox, boardIds: [board.boardId], name: 'FalseField', type: 'checkbox' });
    db.updateOne('cards', { _id: card._id }, { $set: { customFields: [
      { _id: numeric, value: 1 }, { _id: checkbox, value: true },
    ] } });
    await loginWithToken(page, user.id, user.token);
    const recipient = db.findOne('users', { _id: user2.id }).emails[0].address.toLowerCase();
    const delivered = () => sink.messages.filter(mail => mail.recipients.includes(recipient))
      .map(mail => mail.data.replace(/=\r\n/g, '')).join('\n');
    for (const [method, fieldId, value, expected] of [
      ['setCardCustomFieldCurrency', numeric, 0, 'ZeroField: 0'],
      ['setCardCustomFieldCheckbox', checkbox, false, 'FalseField: false'],
    ]) {
      await page.evaluate(({ method, cardId, fieldId, value }) => Meteor.callAsync(method, cardId, fieldId, value),
        { method, cardId: card._id, fieldId, value });
      await expect.poll(delivered, { timeout: 15000 }).toContain(expected);
    }
    expect(delivered()).not.toContain('__customFieldValue__');
  } finally {
    db.deleteMany('customFields', { _id: { $in: [numeric, checkbox] } });
    await sink.close();
  }
});

test('SMTP rejection is retried automatically without another notification', async ({ page, user, user2, board }) => {
  test.skip(!process.env.WEKAN_TEST_SMTP_PORT, 'Requires the local SMTP capture port');
  let accepting = false;
  const sink = await smtpSink(Number(process.env.WEKAN_TEST_SMTP_PORT), { accept: () => accepting });
  try {
    db.addBoardMember({ boardId: board.boardId, userId: user2.id });
    db.updateOne('boards', { _id: board.boardId }, { $set: {
      watchers: [{ userId: user2.id, level: 'watching' }], notifyOverrideEmail: true,
    } });
    db.updateOne('users', { _id: user2.id }, { $set: { 'profile.notifyOverrideEmail': true } });
    await loginWithToken(page, user.id, user.token);
    await openBoard(page, board.boardId, board.slug);
    await new BoardPage(page).clickCard(board.listIds[0], 'Alpha Card');
    const cp = new CardPage(page); await cp.waitForOpen();
    await cp.addComment('Retained after SMTP rejection');
    await expect.poll(() => sink.messages.length).toBeGreaterThan(0);
    await page.waitForTimeout(300);
    const pending = () => db.find('notificationEmailJobs', { userId: user2.id, state: 'pending' });
    expect(pending().map(job => job.html).join('\n')).toContain('Retained after SMTP rejection');
    accepting = true;
    const prior = sink.messages.length;
    await expect.poll(() => sink.messages.length, { timeout: 15000 }).toBeGreaterThan(prior);
    await expect.poll(pending).toHaveLength(0);
    expect(db.find('notificationEmailJobs', { userId: user2.id, state: 'sent' }).length).toBeGreaterThan(0);
    const delivered = sink.messages.slice(prior).map(mail => mail.data.replace(/=\r\n/g, '')).join('\n');
    expect(delivered).toContain('Retained after SMTP rejection');
  } finally { await sink.close(); }
});


test('legacy email buffer is migrated and delivered without a new board event', async ({ user2 }) => {
  test.skip(!process.env.WEKAN_TEST_SMTP_PORT, 'Requires the local SMTP capture port');
  const sink = await smtpSink(Number(process.env.WEKAN_TEST_SMTP_PORT));
  try {
    db.updateOne('users', { _id: user2.id }, { $set: {
      'profile.emailBuffer': ['Legacy pending digest'], 'profile.language': 'en',
    } });
    await expect.poll(() => sink.messages.filter(mail => mail.recipients.includes(user2.email)).length,
      { timeout: 15000 }).toBeGreaterThan(0);
    await expect.poll(() => db.findOne('users', { _id: user2.id }).profile.emailBuffer).toHaveLength(0);
    await expect.poll(() => db.find('notificationEmailJobs', { userId: user2.id, state: 'sent' }).length).toBe(1);
    expect(sink.messages.map(mail => mail.data).join('\n')).toContain('Legacy pending digest');
  } finally { await sink.close(); }
});

test('clients cannot create or alter private email jobs and recipient leases', async ({ page, user, adminUser }) => {
  for (const actor of [user, adminUser]) {
    await loginWithToken(page, actor.id, actor.token);
    for (const collection of ['notificationEmailJobs', 'notificationEmailLeases', 'notificationEmailControls', 'notificationEmailCommands', 'notificationEmailSendSlots', 'activityNotificationIntents', 'activityNotificationPlans', 'activityNotificationLeases', 'activityNotificationControls']) {
      const id = db.uid('private-email');
      const errors = await page.evaluate(async ({ collection, id }) => {
        const errors = [];
        for (const [operation, args] of [
          ['insert', [{ _id: id, userId: Meteor.userId(), state: 'pending' }]],
          ['update', [{ _id: id }, { $set: { state: 'sent' } }]],
          ['remove', [{ _id: id }]],
        ]) {
          try { await Meteor.callAsync(`/${collection}/${operation}`, ...args); errors.push(null); }
          catch (error) { errors.push(error.error); }
        }
        return errors;
      }, { collection, id });
      expect(errors).toEqual([403, 403, 403]);
      expect(db.findOne(collection, { _id: id })).toBeNull();
    }
  }
});

test('a queued digest is cancelled when its recipient loses board membership', async ({ user2, board }) => {
  test.skip(!process.env.WEKAN_TEST_SMTP_PORT, 'Requires the local SMTP capture port');
  const sink = await smtpSink(Number(process.env.WEKAN_TEST_SMTP_PORT));
  const id = db.uid('revoked-mail');
  try {
    db.addBoardMember({ boardId: board.boardId, userId: user2.id });
    db.insertOne('notificationEmailJobs', { _id: id, userId: user2.id, eventId: id,
      boardId: board.boardId, cardId: null, subject: 'Revoked board', html: 'Private revoked text',
      language: 'en', state: 'pending', attempts: 0, createdAt: new Date(),
      nextAttemptAt: new Date(Date.now() + 1000) });
    db.updateOne('boards', { _id: board.boardId }, { $pull: { members: { userId: user2.id } } });
    await expect.poll(() => db.findOne('notificationEmailJobs', { _id: id }).state,
      { timeout: 15000 }).toBe('cancelled');
    expect(db.findOne('notificationEmailJobs', { _id: id }).html).toBeUndefined();
    expect(sink.messages.some(mail => mail.recipients.includes(user2.email))).toBe(false);
  } finally {
    db.deleteMany('notificationEmailJobs', { _id: id });
    await sink.close();
  }
});

test('background recovery delivers a persisted plan without a new activity and preserves missing-activity orphans', async ({ user2 }) => {
  test.skip(!process.env.WEKAN_TEST_SMTP_PORT, 'Requires the app to use the local SMTP capture port');
  const { canonical, sha256 } = require('../../../models/lib/changeHistoryIntegrity');
  const { randomUUID } = require('node:crypto');
  const sink = await smtpSink(Number(process.env.WEKAN_TEST_SMTP_PORT));
  const eventIds = [db.uid('resume-event'), db.uid('orphan-event')];
  const intentIds = [], planIds = [];
  try {
    db.updateOne('users', { _id: user2.id }, { $set: { 'profile.notifyOverrideEmail': true } });
    for (const [index, eventId] of eventIds.entries()) {
      const activity = { _id: eventId, activityType: 'createCard', userId: user2.id,
        createdAt: new Date('2026-01-01'), modifiedAt: new Date('2026-01-01') };
      const intentId = sha256(canonical(['activity-notification-intent', eventId])); intentIds.push(intentId);
      const planId = sha256(canonical(['activity-notification-plan', eventId])); planIds.push(planId);
      const plan = { version: 1, activityId: eventId, activityHash: sha256(canonical(activity)), dispatchUserId: null,
        recipients: [{ userId: user2.id, tray: false, email: { userId: user2.id, eventId, subject: 'Persisted recovery mail',
          html: `Frozen recovery body ${index}`, language: 'en', boardId: null, cardId: null } }] };
      // Seed an already persisted plan and a crashed owner's reservation before
      // exposing pending work to the scheduler. No notification hook is invoked.
      db.insertOne('activityNotificationPlans', { _id: planId, checksum: sha256(canonical(plan)), plan });
      if (index === 0) db.insertOne('activities', activity);
      db.insertOne('activityNotificationLeases', { _id: intentId, owner: 'crashed-worker', expiresAt: new Date(0) });
      db.insertOne('activityNotificationIntents', { _id: intentId, version: 1, state: 'pending', activity,
        activityHash: plan.activityHash, dispatchUserId: null, writerId: randomUUID() });
    }
    await expect.poll(() => sink.messages.filter(mail => mail.recipients.includes(user2.email)).length,
      { timeout: 20000 }).toBe(1);
    expect(sink.messages[0].data.replace(/=\r\n/g, '')).toContain('Frozen recovery body 0');
    await expect.poll(() => db.findOne('activityNotificationIntents', { _id: intentIds[0] })?.state).toBe('completed');
    await expect.poll(() => db.findOne('activityNotificationLeases', { _id: intentIds[0] })).toBeNull();
    expect(db.findOne('activityNotificationIntents', { _id: intentIds[1] }).state).toBe('pending');
    expect(db.findOne('activities', { _id: eventIds[1] })).toBeNull();
    await expect.poll(() => db.find('notificationEmailJobs', { eventId: eventIds[0] }).filter(row => row.state === 'sent').length).toBe(1);
    expect(db.find('notificationEmailJobs', { eventId: eventIds[1] })).toHaveLength(0);
  } finally {
    db.deleteMany('activityNotificationIntents', { _id: { $in: intentIds } });
    db.deleteMany('activityNotificationPlans', { _id: { $in: planIds } });
    db.deleteMany('activityNotificationLeases', { _id: { $in: intentIds } });
    db.deleteMany('activities', { _id: { $in: eventIds } });
    db.deleteMany('notificationEmailJobs', { eventId: { $in: eventIds } });
    await sink.close();
  }
});

test('background recovery prepares a plan when the process stopped after activity persistence', async ({ user, user2, board }) => {
  test.skip(!process.env.WEKAN_TEST_SMTP_PORT, 'Requires local SMTP capture');
  const { canonical, sha256 } = require('../../../models/lib/changeHistoryIntegrity');
  const { randomUUID } = require('node:crypto');
  const sink = await smtpSink(Number(process.env.WEKAN_TEST_SMTP_PORT));
  const eventId = db.uid('unplanned-event');
  const intentId = sha256(canonical(['activity-notification-intent', eventId]));
  const planId = sha256(canonical(['activity-notification-plan', eventId]));
  try {
    db.addBoardMember({ boardId: board.boardId, userId: user2.id });
    db.updateOne('boards', { _id: board.boardId }, { $set: { watchers: [{ userId: user2.id, level: 'watching' }], notifyOverrideEmail: true } });
    db.updateOne('users', { _id: user2.id }, { $set: { 'profile.notifyOverrideEmail': true } });
    const activity = { _id: eventId, activityType: 'createCard', userId: user.id, boardId: board.boardId,
      cardId: db.findCardIdByTitle({ boardId: board.boardId, title: 'Alpha Card' }), listId: board.listIds[0],
      createdAt: new Date('2026-01-01'), modifiedAt: new Date('2026-01-01') };
    db.insertOne('activities', activity);
    db.insertOne('activityNotificationIntents', { _id: intentId, version: 1, state: 'pending', activity,
      activityHash: sha256(canonical(activity)), dispatchUserId: user.id, writerId: randomUUID() });
    await expect.poll(() => db.findOne('activityNotificationIntents', { _id: intentId })?.state,
      { timeout: 20000 }).toBe('completed');
    await expect.poll(() => db.findOne('activityNotificationPlans', { _id: planId })?.compactReceiptVersion).toBe(1);
    expect(db.findOne('activityNotificationPlans', { _id: planId }).plan).toBeUndefined();
    await expect.poll(() => sink.messages.some(mail => mail.recipients.includes(user2.email)), { timeout: 15000 }).toBe(true);
    await expect.poll(() => db.find('notificationEmailJobs', { eventId, state: 'sent' }).length).toBe(1);
    expect(db.find('activities', { _id: eventId })).toHaveLength(1);
  } finally {
    db.deleteMany('activityNotificationIntents', { _id: intentId });
    db.deleteMany('activityNotificationPlans', { _id: planId });
    db.deleteMany('activityNotificationLeases', { _id: intentId });
    db.deleteMany('activities', { _id: eventId });
    db.deleteMany('notificationEmailJobs', { eventId });
    await sink.close();
  }
});

test('scheduled cleanup removes completed plan content and retains unfinished payloads', async ({ user2 }) => {
  test.skip(process.env.WEKAN_TEST_ACTIVITY_PLAN_CLEANUP !== '1', 'Start app with ACTIVITY_NOTIFICATION_PLAN_CLEANUP_INTERVAL_MS=1000');
  const { canonical, sha256 } = require('../../../models/lib/changeHistoryIntegrity');
  const { randomUUID } = require('node:crypto');
  const intentIds = [], planIds = [];
  try {
    for (const completed of [true, false]) {
      const eventId = db.uid(completed ? 'cleanup-completed' : 'cleanup-pending');
      const activity = { _id: eventId, activityType: 'createCard', userId: user2.id,
        createdAt: new Date('2026-01-01'), modifiedAt: new Date('2026-01-01') };
      const activityHash = sha256(canonical(activity));
      const intentId = sha256(canonical(['activity-notification-intent', eventId])); intentIds.push(intentId);
      const planId = sha256(canonical(['activity-notification-plan', eventId])); planIds.push(planId);
      const plan = { version: 1, activityId: eventId, activityHash, dispatchUserId: null,
        recipients: [{ userId: user2.id, tray: false, email: { userId: user2.id, eventId, subject: 'PRIVATE CLEANUP SUBJECT',
          html: 'PRIVATE CLEANUP BODY', language: 'en', boardId: null, cardId: null } }] };
      // No activity exists: completion evidence alone permits old payload cleanup,
      // while the pending orphan must retain its payload without being delivered.
      db.insertOne('activityNotificationIntents', { _id: intentId, version: 1, state: completed ? 'completed' : 'pending',
        activityHash, dispatchUserId: null, writerId: randomUUID(), ...(completed ? {} : { activity }) });
      db.insertOne('activityNotificationPlans', { _id: planId, checksum: sha256(canonical(plan)), plan });
    }
    await expect.poll(() => db.findOne('activityNotificationPlans', { _id: planIds[0] })?.compactReceiptVersion,
      { timeout: 15000 }).toBe(1);
    const receipt = db.findOne('activityNotificationPlans', { _id: planIds[0] });
    expect(Object.keys(receipt).sort()).toEqual(['_id', 'activityHash', 'checksum', 'compactReceiptVersion']);
    expect(JSON.stringify(receipt)).not.toContain('PRIVATE CLEANUP');
    expect(db.findOne('activityNotificationPlans', { _id: planIds[1] }).plan.recipients[0].email.html).toBe('PRIVATE CLEANUP BODY');
    expect(db.findOne('activityNotificationIntents', { _id: intentIds[1] }).state).toBe('pending');
  } finally {
    db.deleteMany('activityNotificationPlans', { _id: { $in: planIds } });
    db.deleteMany('activityNotificationIntents', { _id: { $in: intentIds } });
    db.deleteMany('activityNotificationLeases', { _id: { $in: intentIds } });
  }
});
