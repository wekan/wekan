'use strict';
const { test, expect } = require('../fixtures');
const strings = require('../../../imports/i18n/data/mg.i18n.json');
for (const [slug, key, essential] of [
  ['aging-wip', 'agingWip', 'dimy farafahakeliny'],
  ['blocker-analysis', 'blockerAnalysis', 'Isaina misaraka ny antony mifanindry'],
  ['monte-carlo', 'monteCarlo', 'tsy antoka izany'],
  ['process-behavior', 'processBehavior', 'roa farafahakeliny'],
  ['size-cycle-time', 'sizeCycleTime', 'daty tsy manan-kery'],
]) {
  test(`Malagasy ${slug} explains methodology and limits`, async ({ boardPage: page }) => {
    await page.evaluate(() => Meteor.callAsync('setLanguage', 'mg'));
    await page.locator('.js-toggle-board-view').first().click();
    await expect(page.locator(`.pop-over .js-open-${slug}-view`)).toContainText(strings[`board-view-${slug}`]);
    await page.locator(`.pop-over .js-open-${slug}-view`).click();
    const note = page.locator('.chart-view-content .chart-method-note');
    await expect(note).toHaveText(strings[`flow-note-${key}`]);
    await expect(note).toContainText(essential);
    await expect(note).not.toContainText(/→|≥|≤|✓|MR̄/);
  });
}
test('Malagasy account anonymization explains permanent effects', async ({ boardPage: page }) => {
  await page.evaluate(async () => {
    await Meteor.callAsync('setLanguage', 'mg');
    Popup.close();
    Popup.open('userAnonymize')({ currentTarget: document.body, target: document.body, preventDefault() {} });
  });
  const popup = page.locator('.js-pop-over');
  await expect(popup.locator('.header-title')).toHaveText(strings['anonymize-account']);
  for (const text of ['sakanana ny fidirana', 'mitazona ny tantarany', 'Tsy azo foanana']) await expect(popup).toContainText(text);
  await expect(popup).not.toContainText('fanondranana');
  await page.evaluate(() => Popup.close());
});
