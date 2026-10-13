'use strict';
const { test, expect } = require('../fixtures');
const strings = require('../../../imports/i18n/data/st.i18n.json');
const db = require('../helpers/db');

for (const [slug, key, essential] of [
  ['aging-wip', 'agingWip', 'bonyane dinako tse hlano'],
  ['blocker-analysis', 'blockerAnalysis', 'balwa ka thoko'],
  ['monte-carlo', 'monteCarlo', 'ha se tiisetso'],
  ['process-behavior', 'processBehavior', 'bonyane diphetho tse pedi tse nepahetseng'],
  ['size-cycle-time', 'sizeCycleTime', 'matsatsi a sa nepahalang di a tlohelwa'],
]) {
  test(`Southern Sotho ${slug} explains methodology and limits`, async ({ boardPage: page }) => {
    await page.evaluate(() => Meteor.callAsync('setLanguage', 'st'));
    await page.locator('.js-toggle-board-view').first().click();
    await page.locator(`.pop-over .js-open-${slug}-view`).click();
    const note = page.locator('.chart-view-content .chart-method-note');
    await expect(note).toHaveText(strings[`flow-note-${key}`]);
    await expect(note).toContainText(essential);
  });
}

test('Southern Sotho time adjustments distinguish corrections from work sessions', async ({ boardPage: page }) => {
  await page.evaluate(() => Meteor.callAsync('setLanguage', 'st'));
  await page.locator('.js-toggle-board-view').first().click();
  await page.locator('.pop-over .js-open-time-view').click();
  const note = page.locator('.time-adjustments > p');
  await expect(note).toHaveText(strings['time-adjustment-note']);
  await expect(note).toContainText('ka tlase ho lefela ke ditokiso');
});

test('Southern Sotho list sync describes synchronization and credentials', async ({ boardPage: page, board }) => {
  await page.evaluate(() => Meteor.callAsync('setLanguage', 'st'));
  await page.evaluate(list => {
    Popup.open('listSync', { dataContext: list })({
      currentTarget: document.body, target: document.body, preventDefault() {}, stopPropagation() {},
    });
  }, db.findOne('lists', { _id: board.listIds[0] }));
  const popup = page.locator('.js-pop-over');
  await expect(popup.locator('.header-title')).toHaveText(strings['listSyncPopup-title']);
  await expect(popup).toContainText(strings['list-sync-description']);
  await expect(popup).not.toContainText('Tumellano');
  await page.evaluate(() => Popup.close());
});
