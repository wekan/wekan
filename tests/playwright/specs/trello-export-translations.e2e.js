'use strict';
// Read the export dialog without supplying credentials or contacting Trello.
const { test, expect } = require('../fixtures');
const BoardPage = require('../pages/BoardPage');

for (const language of ['ig', 'la', 'co', 'sw', 'mt', 'en', 'bn', 'mr', 'ne', 'cmn', 'zh', 'zh-CN', 'zh-GB', 'zh-Hans', 'zh_SG', 'zh-HK', 'zh-Hant', 'zh-TW', 'ta', 'th', 'kn', 'ur', 'ml', 'az', 'az-AZ', 'az-LA', 'uz', 'uz-UZ', 'uz-LA']) {
  test(`Trello export dialog preserves translated instructions in ${language}`, async ({ boardPage: page }) => {
    const strings = require(`../../../imports/i18n/data/${language}.i18n.json`);
    await page.evaluate(language => Meteor.callAsync('setLanguage', language), language === 'zh_SG' ? 'zh-SG' : language);
    await new BoardPage(page).openSidebar();
    await page.locator('.board-sidebar .js-open-board-menu').click();
    await page.locator('.js-pop-over .js-export-board').click();
    await page.locator('.js-pop-over .js-export-to-trello').click();
    if (language === 'ur') await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
    const dialog = page.locator('.export-to-trello');
    await expect(dialog.getByText(strings['trello-export-desc'], { exact: true })).toBeVisible();
    await expect(dialog).toContainText('Swimlane: …');
    await expect(dialog.locator('.trello-export-option span')).toHaveText(strings['trello-export-include-attachments']);
    await expect(dialog.locator('.js-trello-export-attachments')).toBeChecked();
    await expect(dialog.locator('.js-trello-export-start')).toHaveText(strings['trello-export-start']);
    await expect(dialog.locator('.js-trello-export-token')).toHaveAttribute('type', 'password');
    // Fresh users have neither credentials nor an export result.
    await expect(dialog.locator('.js-trello-export-key')).toBeEmpty();
    await expect(dialog.locator('.js-trello-export-token')).toBeEmpty();
    await expect(dialog.locator('.trello-export-progress')).toHaveCount(0);
    await expect(dialog.getByText(strings['trello-export-open-board'], { exact: true })).toHaveCount(0);
  });
}
