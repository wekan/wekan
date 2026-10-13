'use strict';
const { test, expect } = require('../fixtures');
const { navigateInApp } = require('../helpers/auth');
const strings = require('../../../imports/i18n/data/co.i18n.json');

test('Corsican Trello import explains archives and optional workspace placement', async ({ loggedInPage: page }) => {
  await page.evaluate(() => Meteor.callAsync('setLanguage', 'co'));
  await navigateInApp(page, '/import/trello');
  const instruction = page.locator('label[for="import-textarea"]');
  await expect(instruction).toContainText(strings['import-board-instruction-trello']);
  await expect(instruction).toContainText(strings['import-board-instruction-about-errors']);
  await expect(page.locator('#import-zip-file').locator('..')).toContainText(strings['import-trello-zip-file-hint']);
  await expect(page.locator('label[for="import-workspace-name"]')).toHaveText(strings['import-trello-workspace']);
  await expect(page.locator('#import-workspace-name')).toHaveAttribute('placeholder', strings['import-trello-workspace-placeholder']);
  await expect(page.locator('.js-import-without-mapping')).toHaveText(strings['import-without-mapping-members']);
  await expect(page.locator('.trello-api-import')).toContainText(strings['trello-api-import-desc']);
  await expect(instruction).not.toContainText('Nella tua');
  await expect(page.locator('#import-file')).toBeEmpty();
  await expect(page.locator('#import-zip-file')).toBeEmpty();
  await expect(page.locator('#import-workspace-name')).toBeEmpty();
});
