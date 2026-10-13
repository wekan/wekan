'use strict';
const { test, expect } = require('../fixtures');
const { navigateInApp } = require('../helpers/auth');

test('Corsican empty rules page translates creation controls', async ({ boardPage: page, board }) => {
  await page.evaluate(() => Meteor.callAsync('setLanguage', 'co'));
  await navigateInApp(page, `/b/${board.boardId}/${board.slug}/rules`);
  const rules = page.locator('.rules-page .rules');
  await expect(rules.locator('h2')).toHaveText('Regule di a tavula');
  await expect(rules.locator('.rules-list .no-items-message')).toHaveText('Nisuna regula');
  await expect(rules.locator('#ruleTitle')).toHaveAttribute('placeholder', 'Titulu di a nova regula');
  await expect(rules.locator('.js-goto-trigger')).toHaveText('Aghjunghje una regula');
  await expect(rules).not.toContainText('Nessuna regola');
});
