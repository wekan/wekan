'use strict';
const { test, expect } = require('../fixtures');
const strings = require('../../../imports/i18n/data/ht.i18n.json');

for (const [slug, key, essential] of [
  ['aging-wip', 'agingWip', 'omwen senk sejou'],
  ['blocker-analysis', 'blockerAnalysis', 'Kòz ki sipèpoze yo konte apa'],
  ['monte-carlo', 'monteCarlo', 'se pa yon garanti'],
  ['process-behavior', 'processBehavior', 'omwen de kat ki fini ak done valab'],
  ['size-cycle-time', 'sizeCycleTime', 'Yo pa pran estimasyon ki manke ak dat ki pa valab yo an kont'],
]) {
  test(`Haitian ${slug} explains methodology and limits`, async ({ boardPage: page }) => {
    await page.evaluate(() => Meteor.callAsync('setLanguage', 'ht'));
    await page.locator('.js-toggle-board-view').first().click();
    await page.locator(`.pop-over .js-open-${slug}-view`).click();
    const note = page.locator('.chart-view-content .chart-method-note');
    await expect(note).toHaveText(strings[`flow-note-${key}`]);
    await expect(note).toContainText(essential);
    await expect(note).not.toContainText(/→|≥|≤|✓|MR̄/);
  });
}

test('Haitian time adjustments identify the author and distinguish work sessions', async ({ boardPage: page }) => {
  await page.evaluate(() => Meteor.callAsync('setLanguage', 'ht'));
  await page.locator('.js-toggle-board-view').first().click();
  await page.locator('.pop-over .js-open-time-view').click();
  const section = page.locator('.time-adjustments');
  await expect(section).toContainText('Ajisteman tan selon otè');
  await expect(section.locator(':scope > p')).toHaveText(strings['time-adjustment-note']);
  await expect(section).toContainText('Sa yo pa sesyon travay endividyèl');
  await expect(section).toContainText('Valè negatif yo se koreksyon');
});
