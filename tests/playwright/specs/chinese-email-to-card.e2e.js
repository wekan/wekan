'use strict';
const { test, expect } = require('../fixtures');
const { loginWithToken } = require('../helpers/auth');
const available = Object.hasOwn(require('../../../imports/i18n/data/en.i18n.json'), 'email-to-card');
async function openSettings(page, scope) {
  await page.evaluate(scope => {
    Popup.close();
    Popup.open('notificationSettings', { dataContext: { scope } })({
      currentTarget: document.body, target: document.body, preventDefault() {},
    });
  }, scope);
  const section = page.locator(`.email-to-card-settings[data-scope="${scope}"]`);
  await section.locator('summary').click();
  return section;
}
for (const language of ['cmn', 'zh', 'zh-CN', 'zh-GB', 'zh-Hans', 'zh_SG', 'zh-HK', 'zh-Hant', 'zh-TW']) {
  test(`Chinese email-to-card board destination and parts in ${language}`, async ({ boardPage: page }) => {
    test.skip(!available, 'Email-to-card source strings are not present on this branch');
    const strings = require(`../../../imports/i18n/data/${language}.i18n.json`);
    await page.evaluate(language => Meteor.callAsync('setLanguage', language), language === 'zh_SG' ? 'zh-SG' : language);
    const section = await openSettings(page, 'board');
    await expect(section.locator('summary')).toContainText(strings['email-to-card']);
    await expect(section.locator('p.quiet').first()).toHaveText(strings['email-to-card-description']);
    await expect(section.locator('.js-etc-board-enabled span')).toHaveText(strings['email-to-card-board-enabled']);
    await expect(section.locator('select[data-key="listId"] option[value=""]')).toHaveText(strings['email-to-card-first-list']);
    await expect(section.locator('select[data-key="swimlaneId"] option[value=""]')).toHaveText(strings['email-to-card-default-swimlane']);
    await expect(section).toContainText(strings['email-to-card-part-strip-quoted']);
    await expect(section).toContainText(strings['email-to-card-part-attachments']);
  });
  test(`Chinese email-to-card distinguishes read and delete in ${language}`, async ({ page, adminUser }) => {
    test.skip(!available, 'Email-to-card source strings are not present on this branch');
    const strings = require(`../../../imports/i18n/data/${language}.i18n.json`);
    await loginWithToken(page, adminUser.id, adminUser.token);
    await page.evaluate(language => Meteor.callAsync('setLanguage', language), language === 'zh_SG' ? 'zh-SG' : language);
    const section = await openSettings(page, 'admin');
    await expect(section.locator('.js-etc-webhook-secret')).toHaveAttribute('type', 'password');
    await expect(section.locator('.js-etc-webhook-secret')).toBeEmpty();
    // Add a local unsaved row; no mailbox is configured or contacted.
    await section.locator('.js-etc-add-account').click();
    const row = section.locator('.email-to-card-account').last();
    await expect(row.locator('select[data-key="after"] option[value="seen"]')).toHaveText(strings['email-to-card-imap-after-seen']);
    await expect(row.locator('select[data-key="after"] option[value="delete"]')).toHaveText(strings['email-to-card-imap-after-delete']);
    await expect(row.locator('.js-etc-account-password')).toHaveAttribute('type', 'password');
    await row.locator('.js-etc-remove-account').click();
  });
}
