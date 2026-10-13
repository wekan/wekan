'use strict';
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const CardPage = require('../pages/CardPage');

for (const language of ['az', 'az-AZ', 'az-LA']) {
  test(`Board and assigned-person terminology renders in ${language}`, async ({ boardPage: page, board, user }) => {
    const strings = require(`../../../imports/i18n/data/${language}.i18n.json`);
    await page.evaluate(language => Meteor.callAsync('setLanguage', language), language);
    await page.locator('.js-create-board').first().click();
    const popup = page.locator('.js-pop-over');
    await expect(popup.getByText(strings['headerBarCreateBoardPopup-title'], { exact: true })).toBeVisible();
    await popup.locator('.js-change-visibility').click();
    const publicChoice = popup.locator('a.js-select-visibility:has(.fa-globe)');
    await expect(publicChoice.locator('.sub-name')).toHaveText(strings['public-desc']);
    await publicChoice.click();
    await expect(popup.locator('p.quiet strong')).toHaveText('açıq');
    await expect(popup.locator('p.quiet')).toContainText('Bu lövhə');
    await expect(popup).not.toContainText('Şura');
    // This only changes the prospective form; no public board is created.
    await page.reload();
    const card = db.find('cards', { boardId: board.boardId })[0];
    await page.locator('.minicard-title').filter({ hasText: card.title }).first().click();
    const details = new CardPage(page);
    await details.waitForOpen();
    await expect(details.root.locator('.js-add-assignees')).toHaveAttribute('title', strings.assignee);
    await details.openAssigneeSelector();
    await expect(popup.getByText(strings['cardAssigneesPopup-title'], { exact: true })).toBeVisible();
    await expect(popup).not.toContainText('Təyinatçı');
    await popup.locator('.js-select-assignee').filter({ hasText: user.username }).click();
    await expect.poll(() => db.findOne('cards', { _id: card._id }).assignees || [])
      .toContain(user.id);
  });
}
