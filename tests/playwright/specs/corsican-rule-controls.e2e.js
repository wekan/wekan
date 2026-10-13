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

for (const locale of ['co', 'la']) {
  test(`${locale} workflow builder distinguishes triggers from actions`, async ({ boardPage: page }) => {
    const { openRulesMenuEntry } = require('../helpers/rulesMenu');
    const strings = require(`../../../imports/i18n/data/${locale}.i18n.json`);
    await page.evaluate(code => Meteor.callAsync('setLanguage', code), locale);
    await openRulesMenuEntry(page, 'js-open-rules-workflow-view');
    const workflow = page.locator('.rules-workflow');
    await expect(workflow.locator('h2')).toHaveText(strings['r-workflow-view']);
    await expect(workflow.locator('.workflow-help')).toHaveText(strings['r-workflow-help']);
    await expect(workflow.locator('.js-when-slot')).toContainText(strings['r-drop-trigger']);
    await expect(workflow.locator('.js-then-slot')).toContainText(strings['r-drop-action']);
    await expect(workflow.locator('.js-create-workflow-rule')).toBeDisabled();
    await expect(workflow.locator('.workflow-help')).not.toContainText(locale === 'la' ? 'Latine:' : 'Trascina un trigger');
  });
}

test('Corsican date triggers include both initial setting and later changes', async ({ boardPage: page, board }) => {
  const strings = require('../../../imports/i18n/data/co.i18n.json');
  await page.evaluate(() => Meteor.callAsync('setLanguage', 'co'));
  await navigateInApp(page, `/b/${board.boardId}/${board.slug}/rules`);
  await page.locator('#ruleTitle').fill('Date changes');
  await page.locator('.js-goto-trigger').click();
  for (const kind of ['due', 'start', 'end', 'received']) {
    const row = page.locator('.trigger-item').filter({ has: page.locator(`.js-add-${kind}-date-changed-trigger`) });
    await expect(row).toContainText(strings[`r-when-a-${kind}-date-changed`]);
    await expect(row).toContainText('hè definita o cambiata');
  }
});
