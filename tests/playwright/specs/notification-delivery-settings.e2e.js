'use strict';
// #3695 / #5171: Notification Settings -> per-channel delivery (content,
// grouping, schedule) saves at the member and board scopes and in a
// webhook's own form, and the tray honours grouping.
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');

async function openPopup(page, name, dataContext) {
  await page.evaluate(({ name, dataContext }) => {
    Popup.close();
    const opener = document.body;
    Popup.open(name, dataContext ? { dataContext } : {})({
      currentTarget: opener, target: opener, preventDefault() {},
    });
  }, { name, dataContext });
}

function section(page, scope, channel) {
  return page.locator(`.notification-delivery-settings[data-scope="${scope}"][data-channel="${channel}"]`).first();
}

async function expand(sectionLocator) {
  await sectionLocator.locator('summary').click();
}

for (const language of ['en', 'haw', 'lt', 'yi', 'wuu-Hans', 'xh', 'zu', 'zu-ZA', 'pap', 'eo', 'ar', 'fi', 'sv', 'nb', 'da', 'it', 'fr', 'ja', 'ru', 'tr', 'uk', 'zh-Hant', 'tlh', 'vo', 've', 've-CC', 've-PP', 'wa-RR', 'zgh', 'chr']) {
test(`#5171 member scope: layout, grouping, daily schedule and webhook identity in ${language}`, async ({ boardPage: page, user }) => {
  await page.evaluate(language => Meteor.callAsync('setLanguage', language), language);
  const strings = require(`../../../imports/i18n/data/${language}.i18n.json`);
  await openPopup(page, 'notificationSettings', { scope: 'member' });
  const email = section(page, 'member', 'email');
  await expand(email);
  await expect(email.locator('select[data-key="layout"] option[value="clear"]')).toHaveText(strings['notification-delivery-layout-clear']);
  await expect(email.locator('select[data-key="grouping"] option[value="board"]')).toHaveText(strings['notification-delivery-grouping-board']);
  await expect(email.locator('select[data-key="schedule"] option[value="daily"]')).toHaveText(strings['notification-delivery-schedule-daily']);
  const read = () => ((db.findOne('users', { _id: user.id }).profile || {}).notificationDelivery || {}).email || {};
  await email.locator('select[data-key="layout"]').selectOption('clear');
  await expect.poll(() => read().layout).toBe('clear');
  await email.locator('select[data-key="grouping"]').selectOption('board');
  await expect.poll(() => read().grouping).toBe('board');
  await email.locator('.js-delivery-list-item[data-key="parts"][data-value="swimlane"]').click();
  await expect.poll(() => read().parts).not.toContain('swimlane');
  await email.locator('select[data-key="schedule"]').selectOption('daily');
  await expect.poll(() => read().schedule).toBe('daily');
  await expect(email.locator('label:has(input[data-key="dailyTime"])')).toHaveText(strings['notification-delivery-daily-time']);
  await expect(email.locator('label:has(input[data-key="quietEnd"])')).toHaveText(strings['notification-delivery-quiet-to']);
  expect(typeof read().timezone).toBe('string');
  await email.locator('select[data-key="schedule"]').selectOption('');
  await expect.poll(() => read().schedule).toBeUndefined();

  const webhook = section(page, 'member', 'webhook');
  await expand(webhook);
  await expect(webhook.locator('.js-webhook-hide-identity span')).toHaveText(strings['webhook-hide-identity']);
  await webhook.locator('.js-webhook-hide-identity').click();
  await expect.poll(() => (db.findOne('users', { _id: user.id }).profile || {}).webhookHideIdentity).toBe(true);
});

}

test('#3695 board scope: webhook text off and an extra field group, then back to default', async ({ boardPage: page, board }) => {
  await openPopup(page, 'notificationSettings', { scope: 'board' });
  const webhook = section(page, 'board', 'webhook');
  await expand(webhook);
  const read = () => ((db.findOne('boards', { _id: board.boardId }).notificationDelivery || {}).webhook) || {};
  await webhook.locator('select[data-key="text"]').selectOption('false');
  await expect.poll(() => read().text).toBe(false);
  await webhook.locator('.js-delivery-list-item[data-key="fields"][data-value="people"]').click();
  await expect.poll(() => read().fields).toEqual(['standard', 'people']);
  await webhook.locator('select[data-key="text"]').selectOption('');
  await webhook.locator('.js-delivery-list-default[data-key="fields"]').click();
  await expect.poll(() => Object.keys(read()).length).toBe(0);
});

test('#3695 a webhook form: its own grouping and schedule', async ({ boardPage: page, user, board }) => {
  const id = db.uid('hook');
  db.insertOne('integrations', { _id: id, boardId: board.boardId, userId: user.id, enabled: true,
    activities: ['all'], type: 'outgoing-webhooks', url: 'https://example.com/hook', createdAt: new Date() });
  try {
    await openPopup(page, 'outgoingWebhooks');
    const webhook = section(page, 'integration', 'webhook');
    await expand(webhook);
    const read = () => ((db.findOne('integrations', { _id: id }).notificationDelivery || {}).webhook) || {};
    await webhook.locator('select[data-key="grouping"]').selectOption('all');
    await expect.poll(() => read().grouping).toBe('all');
    await webhook.locator('select[data-key="schedule"]').selectOption('interval');
    await expect.poll(() => read().schedule).toBe('interval');
    await webhook.locator('select[data-key="intervalMinutes"]').selectOption('15');
    await expect.poll(() => read().intervalMinutes).toBe(15);
  } finally {
    db.deleteOne('integrations', { _id: id });
  }
});

test('#5171 tray: an entry scheduled for later is not counted until its time', async ({ boardPage: page, user }) => {
  const activityId = db.uid('act');
  db.insertOne('activities', { _id: activityId, userId: user.id, activityType: 'createBoard', createdAt: new Date() });
  db.updateOne('users', { _id: user.id }, { $set: { 'profile.notifications': [
    { activity: activityId, read: null, showAt: Date.now() + 24 * 3600000 },
  ] } });
  try {
    await expect(page.locator('.notifications-drawer-toggle')).not.toHaveClass(/alert/);
    db.updateOne('users', { _id: user.id }, { $set: { 'profile.notifications.0.showAt': Date.now() - 1000 } });
    await expect(page.locator('.notifications-drawer-toggle')).toHaveClass(/alert/);
  } finally {
    db.deleteOne('activities', { _id: activityId });
  }
});
