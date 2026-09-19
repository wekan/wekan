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
