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

for (const locale of ['co', 'gd']) {
test(`${locale} date triggers include both initial setting and later changes`, async ({ boardPage: page, board }) => {
  const strings = require(`../../../imports/i18n/data/${locale}.i18n.json`);
  await page.evaluate(code => Meteor.callAsync('setLanguage', code), locale);
  await navigateInApp(page, `/b/${board.boardId}/${board.slug}/rules`);
  await page.locator('#ruleTitle').fill('Date changes');
  await page.locator('.js-goto-trigger').click();
  for (const kind of ['due', 'start', 'end', 'received']) {
    const row = page.locator('.trigger-item').filter({ has: page.locator(`.js-add-${kind}-date-changed-trigger`) });
    await expect(row).toContainText(strings[`r-when-a-${kind}-date-changed`]);
    await expect(row).toContainText(locale === 'gd' ? 'a shuidheachadh no atharrachadh' : 'hè definita o cambiata');
  }
});
}



test('Latin rule import dialog explains partial conversion and keeps format identifiers', async ({ boardPage: page }) => {
  const { openRulesMenuEntry } = require('../helpers/rulesMenu');
  await page.evaluate(() => Meteor.callAsync('setLanguage', 'la'));
  await openRulesMenuEntry(page, 'js-open-rules-import-export');
  const pop = page.locator('.js-pop-over');
  await expect(pop).toContainText('Exportationes tabularum Trello regulas Butler non continent.');
  await expect(pop).toContainText('lineae non conversae indicantur.');
  await expect(pop).toContainText('nodi non conversi indicantur.');
  await expect(pop.locator('.js-rules-import-text')).toHaveValue('');
  await expect(pop.locator('.js-workflow-format option[value="auto"]')).toHaveText('Agnosce automatice');
  await expect(pop.locator('.js-workflow-format option[value="n8n"]')).toHaveText('n8n');
  await expect(pop.locator('.js-workflow-format option[value="nodered"]')).toHaveText('Node-RED');
});


test('Latin workflow toolbox distinguishes its trigger and action labels', async ({ boardPage: page }) => {
  const { openRulesMenuEntry } = require('../helpers/rulesMenu');
  await page.evaluate(() => Meteor.callAsync('setLanguage', 'la'));
  await openRulesMenuEntry(page, 'js-open-rules-workflow-view');
  const workflow = page.locator('.rules-workflow');
  await expect(workflow).toContainText('Nota chartam perfectam');
  await expect(workflow).toContainText('Nota chartam imperfectam');
  await expect(workflow.locator('.js-create-workflow-rule')).toBeDisabled();
});


test('Latin rule actions distinguish top and bottom of the current list', async ({ boardPage: page, board }) => {
  await page.evaluate(() => Meteor.callAsync('setLanguage', 'la'));
  await navigateInApp(page, `/b/${board.boardId}/${board.slug}/rules`);
  await page.locator('#ruleTitle').fill('Probatio ordinis');
  await page.locator('.js-goto-trigger').click();
  await page.locator('.js-add-gen-moved-trigger.js-goto-action').click();
  const row = page.locator('#move-gen-action').locator('xpath=../..');
  await expect(row).toContainText('Move chartam ad');
  await expect(row).toContainText('indicis sui');
  await expect(row.locator('option[value="top"]')).toHaveText('summum');
  await expect(row.locator('option[value="bottom"]')).toHaveText('imum');
  await row.locator('select').selectOption('bottom');
  await expect(row.locator('select')).toHaveValue('bottom');
  await expect(row).not.toContainText('Latine:');
});


test('Latin checklist action instructions explain comma separated items', async ({ boardPage: page, board }) => {
  await page.evaluate(() => Meteor.callAsync('setLanguage', 'la'));
  await navigateInApp(page, `/b/${board.boardId}/${board.slug}/rules`);
  await page.locator('#ruleTitle').fill('Probatio rerum');
  await page.locator('.js-goto-trigger').click();
  await page.locator('.js-add-gen-moved-trigger.js-goto-action').click();
  await page.locator('.js-set-checklist-actions').click();
  await expect(page.locator('#checklist-items')).toHaveAttribute('placeholder', 'res1,res2,res3');
  await expect(page.locator('#checklist-items')).toHaveValue('');
  await expect(page.locator('.rules-page')).toContainText('Nota: res indicis probationis scribendae sunt ut valores commatibus separati.');
});
