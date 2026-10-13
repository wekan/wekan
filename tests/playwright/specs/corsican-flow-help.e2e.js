'use strict';
const { test, expect } = require('../fixtures');
const strings = require('../../../imports/i18n/data/co.i18n.json');

for (const [slug, key, essential] of [
  ['aging-wip', 'agingWip', 'almenu cinque sughjorni'],
  ['blocker-analysis', 'blockerAnalysis', 'cuntate separatamente'],
  ['monte-carlo', 'monteCarlo', 'ùn hè micca una guaranzia'],
  ['process-behavior', 'processBehavior', 'almenu dui compii validi'],
  ['size-cycle-time', 'sizeCycleTime', 'date micca valide sò omesse'],
]) {
  test(`Corsican ${slug} explains its methodology and limits`, async ({ boardPage: page }) => {
    await page.evaluate(() => Meteor.callAsync('setLanguage', 'co'));
    await page.locator('.js-toggle-board-view').first().click();
    await page.locator(`.pop-over .js-open-${slug}-view`).click();
    const note = page.locator('.chart-view-content .chart-method-note');
    await expect(note).toHaveText(strings[`flow-note-${key}`]);
    await expect(note).toContainText(essential);
    await expect(note).not.toContainText('(sconosciuto)');
    await expect(note).not.toContainText('Completato/a');
  });
}
