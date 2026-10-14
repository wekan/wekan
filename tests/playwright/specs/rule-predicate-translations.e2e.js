'use strict';
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const { navigateInApp } = require('../helpers/auth');

for (const language of ['kn', 'ml', 'la', 'ga']) {
test(`Rule rows and saved descriptions omit the redundant linking verb in ${language}`, async ({ boardPage: page, board }) => {
  const strings = require(`../../../imports/i18n/data/${language}.i18n.json`);
  const name = language === 'ga' ? 'Sampla' : language === 'kn' ? 'ಪರೀಕ್ಷೆ' : language === 'la' ? 'Probatio' : 'പരീക്ഷണം';
  await page.evaluate(language => Meteor.callAsync('setLanguage', language), language);
  await navigateInApp(page, `/b/${board.boardId}/${board.slug}/rules`);
  await page.locator('#ruleTitle').fill(`${language} predicate`);
  await page.locator('.js-goto-trigger').click();
  await page.locator('.js-set-card-triggers').click();
  for (const id of ['spec-label', 'spec-member', 'spec-assignee']) {
    const row = page.locator(`#${id}`).locator('xpath=../..');
    await expect(row).toBeVisible();
    const labels = await row.locator('.trigger-text').allTextContents();
    expect(labels.map(text => text.trim())).not.toContain(strings['r-is']);
    expect(labels.map(text => text.trim())).not.toContain('is');
    await expect(row.locator('option[value="added"]')).toHaveText(strings['r-added-to']);
    await expect(row.locator('option[value="removed"]')).toHaveText(strings['r-removed-from']);
  }
  await page.locator('.js-set-checklist-triggers').click();
  await page.locator('#check-name').fill(name);
  await page.locator('.js-add-spec-check-trigger.js-goto-action').click();
  await page.locator('.js-add-gen-move-action.js-goto-rules').first().click();
  await expect.poll(() => db.find('triggers', { boardId: board.boardId }).map(item => item.desc).join('\n'))
    .toContain(name);
  const description = db.find('triggers', { boardId: board.boardId }).map(item => item.desc).join('\n');
  expect(description.split(/\s+/)).not.toContain('is');
  expect(description.split(/\s+/)).not.toContain(strings['r-is']);
  expect(description).toContain(strings['r-added-to']);
});
}
