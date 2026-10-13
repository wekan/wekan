'use strict';
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const CardPage = require('../pages/CardPage');

for (const language of ['uz', 'uz-UZ', 'uz-LA']) {
  test(`Assigned-person labels allow assigning a card in ${language}`, async ({ boardPage: page, board, user }) => {
    const strings = require(`../../../imports/i18n/data/${language}.i18n.json`);
    await page.evaluate(language => Meteor.callAsync('setLanguage', language), language);
    const card = db.find('cards', { boardId: board.boardId })[0];
    await page.locator('.minicard-title').filter({ hasText: card.title }).first().click();
    const details = new CardPage(page);
    await details.waitForOpen();
    await expect(details.root.locator('.js-add-assignees')).toHaveAttribute('title', strings.assignee);
    await details.openAssigneeSelector();
    const popup = page.locator('.js-pop-over');
    await expect(popup.getByText(strings['cardAssigneesPopup-title'], { exact: true })).toBeVisible();
    await expect(popup).not.toContainText('Tayinlovchi');
    await popup.locator('.js-select-assignee').filter({ hasText: user.username }).click();
    await expect.poll(() => db.findOne('cards', { _id: card._id }).assignees || []).toContain(user.id);
  });

  test(`Time history explains corrections and attribution in ${language}`, async ({ boardPage: page }) => {
    const strings = require(`../../../imports/i18n/data/${language}.i18n.json`);
    await page.evaluate(language => Meteor.callAsync('setLanguage', language), language);
    await page.locator('.js-toggle-board-view').first().click();
    await page.locator('.pop-over .js-open-time-view').click();
    const note = page.locator('.time-adjustments > p');
    await expect(note).toHaveText(strings['time-adjustment-note']);
    await expect(note).toContainText('alohida ish seanslari emas');
    await expect(note).toContainText('Manfiy qiymatlar tuzatishlardir');
    await expect(note).not.toContainText('≠');
  });
}
