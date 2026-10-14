'use strict';
const { test, expect } = require('../fixtures');
const strings = require('../../../imports/i18n/data/ga.i18n.json');

for (const [slug, key, essential] of [
  ['aging-wip', 'agingWip', 'cúig thréimhse fanachta ar a laghad'],
  ['blocker-analysis', 'blockerAnalysis', 'a chomhaireamh ar leithligh'],
  ['monte-carlo', 'monteCarlo', 'ní ráthaíocht é'],
  ['process-behavior', 'processBehavior', 'dhá chríochnú bhailí ar a laghad'],
  ['size-cycle-time', 'sizeCycleTime', 'dátaí neamhbhailí ar lár'],
]) {
  test(`Irish ${slug} explains methodology and limits`, async ({ boardPage: page }) => {
    await page.evaluate(() => Meteor.callAsync('setLanguage', 'ga'));
    await page.locator('.js-toggle-board-view').first().click();
    const entry = page.locator(`.pop-over .js-open-${slug}-view`);
    await expect(entry).toContainText(strings[`board-view-${slug}`]);
    await entry.click();
    if (slug === 'monte-carlo') {
      await expect(page.locator('.js-flow-options')).toContainText(strings['flow-target-count']);
      await expect(page.locator('.js-flow-options')).not.toContainText('Cártaí — Uimhir');
    }
    if (slug === 'size-cycle-time') {
      await expect(page.locator('.js-flow-options')).toContainText(strings['flow-size-source']);
    }
    const note = page.locator('.chart-view-content .chart-method-note');
    await expect(note).toHaveText(strings[`flow-note-${key}`]);
    await expect(note).toContainText(essential);
    await expect(note).not.toContainText(/→|≥|≤|✓|MR̄/);
  });
}
