'use strict';
const { test, expect } = require('../fixtures');
const strings = require('../../../imports/i18n/data/gd.i18n.json');

for (const [slug, key, essential] of [
  ['aging-wip', 'agingWip', 'co-dhiù còig amannan san ìre'],
  ['blocker-analysis', 'blockerAnalysis', 'a chunntadh fa leth'],
  ['monte-carlo', 'monteCarlo', 'chan e gealladh cinnteach'],
  ['process-behavior', 'processBehavior', 'co-dhiù dà chrìochnachadh dligheach'],
  ['size-cycle-time', 'sizeCycleTime', 'cinn-là neo-dhligheach fhàgail às'],
]) {
  test(`Scottish Gaelic ${slug} explains methodology and limits`, async ({ boardPage: page }) => {
    await page.evaluate(() => Meteor.callAsync('setLanguage', 'gd'));
    await page.locator('.js-toggle-board-view').first().click();
    const entry = page.locator(`.pop-over .js-open-${slug}-view`);
    await expect(entry).toContainText(strings[`board-view-${slug}`]);
    await entry.click();
    if (slug === 'monte-carlo') {
      await expect(page.locator('.js-flow-options')).toContainText(strings['flow-target-count']);
      await expect(page.locator('.js-flow-options')).not.toContainText('Cairtean — Àireamh');
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
