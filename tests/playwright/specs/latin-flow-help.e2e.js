'use strict';
const { test, expect } = require('../fixtures');
const strings = require('../../../imports/i18n/data/la.i18n.json');

for (const [slug, key, essential] of [
  ['aging-wip', 'agingWip', 'saltem quinque morae'],
  ['blocker-analysis', 'blockerAnalysis', 'separatim numerantur'],
  ['monte-carlo', 'monteCarlo', 'nulla cautio est'],
  ['process-behavior', 'processBehavior', 'saltem duae completiones validae'],
  ['size-cycle-time', 'sizeCycleTime', 'dies invalidi omittuntur'],
]) {
  test(`Latin ${slug} explains methodology and limits`, async ({ boardPage: page }) => {
    await page.evaluate(() => Meteor.callAsync('setLanguage', 'la'));
    await page.locator('.js-toggle-board-view').first().click();
    await page.locator(`.pop-over .js-open-${slug}-view`).click();
    const note = page.locator('.chart-view-content .chart-method-note');
    await expect(note).toHaveText(strings[`flow-note-${key}`]);
    await expect(note).toContainText(essential);
    await expect(note).not.toContainText('Latine:');
  });
}
