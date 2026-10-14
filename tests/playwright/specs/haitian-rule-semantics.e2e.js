'use strict';
const { test, expect } = require('../fixtures');
const { navigateInApp } = require('../helpers/auth');

test('Haitian checklist actions distinguish unchecking from disabling', async ({ boardPage: page, board }) => {
  await page.evaluate(() => Meteor.callAsync('setLanguage', 'ht'));
  await navigateInApp(page, `/b/${board.boardId}/${board.slug}/rules`);
  await page.locator('#ruleTitle').fill('Retire mak');
  await page.locator('.js-goto-trigger').click();
  await page.locator('.js-add-create-trigger.js-goto-action').first().click();
  await page.locator('.js-set-checklist-actions').click();
  await expect(page.locator('#checkall-action option[value="uncheck"]')).toHaveText('Retire tout mak yo sou');
  await expect(page.locator('#check-item-action option[value="uncheck"]')).toHaveText('Retire mak la sou');
  await expect(page.locator('#checkall-action')).not.toContainText('Dezaktive');
  await page.locator('#checkall-action').selectOption('uncheck');
  await expect(page.locator('#checkall-action')).toHaveValue('uncheck');
});
