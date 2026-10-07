'use strict';
// #572: a member can stop notifications about one kind of card activity - here
// labels - and keep the rest; the bell and email both follow it.
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const { loginWithToken, openBoard } = require('../helpers/auth');

const bell = userId => (db.findOne('users', { _id: userId }).profile?.notifications || []).map(n => n.activity);
const activityIds = (cardId, type) => db.find('activities', { cardId, activityType: type }).map(a => a._id);

// Member menu → Notifications, the way a member reaches it.
async function openMemberNotificationSettings(page) {
  await page.locator('.js-open-header-member-menu').first().click();
  await page.locator('.js-open-notification-settings').first().click();
  await expect(page.locator('.notification-activity-settings')).toBeVisible();
}

for (const language of ['en', 'tk_TM', 'tt', 'so', 'ku', 'ckb', 'pap', 'tpi', 'bi', 'mi', 'sm', 'haw', 'zu', 'zu-ZA', 'xh', 'st', 'tn', 'rw', 'rn', 'ny', 'bho', 'mai', 'or_IN', 'kok', 'ary', 'yi', 'nd', 'ss', 'nso', 'ts', 'om', 'fj', 'to', 'gv', 'wa', 'wa-RR', 'ak', 'lg', 'bm', 'wo', 'ee', 'rup', 'bua', 'sah', 'cv', 've', 've-CC', 'se', 'ace', 'bo', 'dz', 'ti', 'ks', 'qu', 'ay', 'gn', 'ff', 'vo', 'tlh', 'kl', 'nah', 've-PP', 'zgh', 'iu', 'wal', 'tig', 'chr']) {
test(`muting label activity keeps labels out of the bell, and nothing else in ${language}`, async ({ boardPage: owner, browser, board, user, user2 }) => {
  const card = db.findOne('cards', { boardId: board.boardId, title: 'Alpha Card' });
  db.updateOne('boards', { _id: board.boardId }, { $set: {
    labels: [{ _id: 'lblmute', name: 'Urgent', color: 'red' }],
    watchers: [{ userId: user2.id, level: 'watching' }],
  } });
  db.addBoardMember({ boardId: board.boardId, userId: user2.id, isAdmin: false });

  // user2 mutes "Labels added or removed" in Member Settings.
  const context = await browser.newContext();
  const member = await context.newPage();
  try {
    await loginWithToken(member, user2.id, user2.token);
    await openBoard(member, board.boardId, board.slug);
    await member.evaluate(language => Meteor.callAsync('setLanguage', language), language);
    await openMemberNotificationSettings(member);
    const strings = require(`../../../imports/i18n/data/${language}.i18n.json`);
    const settings = member.locator('.notification-activity-settings');
    await expect(settings.locator('.title')).toHaveText(strings['notification-activity-heading']);
    await expect(settings.locator('p.quiet')).toHaveText(strings['notification-activity-description']);
    for (const key of Object.keys(strings).filter(key => key.startsWith('notification-activity-') && !['notification-activity-heading', 'notification-activity-description'].includes(key))) {
      const group = key.slice('notification-activity-'.length);
      await expect(settings.locator(`[data-group="${group}"] span`)).toHaveText(strings[key]);
    }
    if (language !== 'en') await expect(settings).not.toContainText('Untick a kind of card activity');
    const labels = member.locator('.js-notify-activity[data-group="labels"]');
    await expect(labels).toHaveAttribute('aria-checked', 'true');
    await labels.click();
    await expect.poll(() => db.findOne('users', { _id: user2.id }).profile?.notifyMutedActivities).toEqual(['labels']);
    await expect(labels).toHaveAttribute('aria-checked', 'false');

    // The owner adds a label in the card, then comments.
    await owner.locator('.minicard', { hasText: 'Alpha Card' }).first().locator('.minicard-title').click();
    await owner.locator('.card-details a.add-label.js-add-labels').first().click();
    await owner.locator('.js-select-label').first().click();
    await expect.poll(() => activityIds(card._id, 'addedLabel').length).toBe(1);
    const labelActivity = activityIds(card._id, 'addedLabel')[0];
    const comment = await owner.request.post(`/api/boards/${board.boardId}/cards/${card._id}/comments`, {
      headers: { Authorization: `Bearer ${user.token}`, 'Content-Type': 'application/json' },
      data: { authorId: user.id, comment: 'Please look' },
    });
    expect(comment.status()).toBe(200);
    await expect.poll(() => activityIds(card._id, 'addComment').length).toBe(1);
    const commentActivity = activityIds(card._id, 'addComment')[0];

    // The comment reaches the bell; the earlier label change does not.
    await expect.poll(() => bell(user2.id)).toContain(commentActivity);
    expect(bell(user2.id)).not.toContain(labelActivity);

    // Control: unmuted again, the next label change does arrive.
    await labels.click();
    await expect.poll(() => db.findOne('users', { _id: user2.id }).profile?.notifyMutedActivities).toBeUndefined();
    await owner.locator('.js-select-label').first().click();
    await expect.poll(() => activityIds(card._id, 'removedLabel').length).toBe(1);
    await expect.poll(() => bell(user2.id)).toContain(activityIds(card._id, 'removedLabel')[0]);
  } finally {
    await context.close();
  }
});
}
