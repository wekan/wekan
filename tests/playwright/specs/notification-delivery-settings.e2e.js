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

for (const language of ['ig', 'gd', 'ga', 'mg', 'ht', 'la', 'st', 'co', 'sw', 'mt', 'en', 'haw', 'lt', 'yi', 'wuu-Hans', 'xh', 'zu', 'zu-ZA', 'pap', 'eo', 'ar', 'fi', 'sv', 'nb', 'da', 'it', 'de', 'de-AT', 'de-CH', 'de_DE', 'fr', 'fr-FR', 'fr-BE', 'fr-CA', 'fr-CH', 'es', 'es-AR', 'es-CL', 'es-CO', 'es-LA', 'es-MX', 'es-PE', 'es-PY', 'es_CO', 'pt', 'pt-BR', 'pt-PT', 'pt_PT', 'nl', 'nl-NL', 'pl', 'pl-PL', 'cs', 'cs-CZ', 'sk', 'hu', 'ro', 'ro-RO', 'ja', 'ja-JP', 'ja-HI', 'ko', 'ko-KR', 'id', 'ms', 'ms-MY', 'el', 'el-GR', 'ca', 'ca_ES', 'ca@valencia', 'gl', 'gl-ES', 'eu', 'vi', 'vi-VN', 'hr', 'sr', 'sl', 'sl_SI', 'bg', 'mk', 'lv', 'sq', 'bs', 'is', 'be', 'af', 'af_ZA', 'et-EE', 'fa', 'fa-IR', 'he', 'he-IL', 'ar-DZ', 'ar-EG', 'cmn', 'zh', 'zh-CN', 'zh-GB', 'zh-Hans', 'zh_SG', 'zh-TW', 'zh-HK', 'hi', 'hi-IN', 'gu-IN', 'ru', 'ru_RU', 'ru-UA', 'tr', 'uk', 'uk-UA', 'zh-Hant', 'tlh', 'vo', 've', 've-CC', 've-PP', 'wa-RR', 'zgh', 'chr', 'mr', 'bn', 'lg', 'tn', 'to', 'ts', 'ay', 'qu', 'wal', 'ace', 'ne', 'ta', 'th', 'kn', 'ur', 'ml', 'az', 'az-AZ', 'az-LA', 'uz', 'uz-UZ', 'uz-LA']) {
test(`#5171 member scope: layout, grouping, daily schedule and webhook identity in ${language}`, async ({ boardPage: page, user }) => {
  await page.evaluate(language => Meteor.callAsync('setLanguage', language), language === 'ja-HI' ? 'ja-Hira' : language === 'ca@valencia' ? 'ca-valencia' : language === 'zh_SG' ? 'zh-SG' : language);
  const strings = require(`../../../imports/i18n/data/${language}.i18n.json`);
  await openPopup(page, 'notificationSettings', { scope: 'member' });
  if (language === 'ht') {
    const precedence = page.getByText(strings['notification-settings-popup-description'], { exact: true });
    await expect(precedence).toBeVisible();
    await expect(precedence).toContainText('paramèt tablo a ki ranplase li');
    await expect(precedence).not.toContainText('Anilasyon');
  }
  const email = section(page, 'member', 'email');
  await expand(email);
  await expect(email.locator('label:has(select[data-key="layout"])')).toContainText(strings['notification-delivery-layout']);
  await expect(email.locator('select[data-key="layout"] option[value="clear"]')).toHaveText(strings['notification-delivery-layout-clear']);
  await expect(email.locator('select[data-key="grouping"] option[value="board"]')).toHaveText(strings['notification-delivery-grouping-board']);
  await expect(email.locator('select[data-key="schedule"] option[value="daily"]')).toHaveText(strings['notification-delivery-schedule-daily']);
  const read = () => ((db.findOne('users', { _id: user.id }).profile || {}).notificationDelivery || {}).email || {};
  await email.locator('select[data-key="layout"]').selectOption('clear');
  await expect.poll(() => read().layout).toBe('clear');
  for (const part of ['list', 'swimlane']) {
    await expect(email.locator(`.js-delivery-list-item[data-key="parts"][data-value="${part}"] span`)).toHaveText(strings[`notification-delivery-part-${part}`]);
  }
  await email.locator('select[data-key="grouping"]').selectOption('board');
  await expect.poll(() => read().grouping).toBe('board');
  await email.locator('.js-delivery-list-item[data-key="parts"][data-value="swimlane"]').click();
  await expect.poll(() => read().parts).not.toContain('swimlane');
  await email.locator('select[data-key="schedule"]').selectOption('daily');
  await expect.poll(() => read().schedule).toBe('daily');
  await expect(email.locator('label:has(input[data-key="dailyTime"])')).toHaveText(strings['notification-delivery-daily-time']);
  await expect(email.locator('label:has(input[data-key="quietStart"])')).toHaveText(strings['notification-delivery-quiet-from']);
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

test('Corsican clear notification drawer renders corrected card activity', async ({ boardPage: page, board, user }) => {
  const card = db.findOne('cards', { boardId: board.boardId, title: 'Alpha Card' });
  const activityId = db.uid('corsican-clear-activity');
  db.insertOne('activities', {
    _id: activityId, userId: user.id, activityType: 'createCard',
    boardId: board.boardId, cardId: card._id, cardTitle: card.title,
    listId: card.listId, swimlaneId: card.swimlaneId, createdAt: new Date(),
  });
  db.updateOne('users', { _id: user.id }, { $set: {
    'profile.notificationDelivery.tray': { layout: 'clear', grouping: 'none' },
    'profile.notifications': [{ activity: activityId, read: null }],
  } });
  try {
    await page.evaluate(() => Meteor.callAsync('setLanguage', 'co'));
    await page.reload();
    await page.locator('.notifications-drawer-toggle').first().click();
    const item = page.locator('#notifications-drawer .notification-clear-item').filter({ hasText: card.title });
    await expect(item).toBeVisible();
    await expect(item).toContainText('hà creatu a carta');
    await expect(item).not.toContainText('swimlane');
    await expect(item).not.toContainText('__card__');
  } finally {
    db.updateOne('users', { _id: user.id }, { $set: { 'profile.notifications': [] } });
    db.deleteOne('activities', { _id: activityId });
  }
});

test('Corsican delete-all confirmation preserves cancellation', async ({ boardPage: page, user }) => {
  const activityId = db.uid('corsican-delete-confirm');
  db.insertOne('activities', { _id: activityId, userId: user.id, activityType: 'createBoard', createdAt: new Date() });
  db.updateOne('users', { _id: user.id }, { $set: {
    'profile.notifications': [{ activity: activityId, read: null }],
  } });
  try {
    await page.evaluate(() => Meteor.callAsync('setLanguage', 'co'));
    await page.reload();
    await page.locator('.notifications-drawer-toggle').first().click();
    await page.locator('#notifications-drawer .notification-menu-toggle').click();
    const dialogSeen = new Promise((resolve, reject) => page.once('dialog', async dialog => {
      try {
        expect(dialog.message()).toBe(require('../../../imports/i18n/data/co.i18n.json')['delete-all-notifications-confirm']);
        expect(dialog.message()).toContain('ùn pò micca esse annullata');
        await dialog.dismiss();
        resolve();
      } catch (error) { await dialog.dismiss(); reject(error); }
    }));
    await page.locator('#notifications-drawer .delete-all').click();
    await dialogSeen;
    expect(db.findOne('users', { _id: user.id }).profile.notifications.map(n => n.activity)).toContain(activityId);
  } finally {
    db.updateOne('users', { _id: user.id }, { $set: { 'profile.notifications': [] } });
    db.deleteOne('activities', { _id: activityId });
  }
});
