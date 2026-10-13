'use strict';
const { test, expect } = require('../fixtures');

test('Latin location dialog distinguishes failed detection from filled coordinates', async ({ boardPage: page }) => {
  await page.evaluate(async () => {
    await Meteor.callAsync('setLanguage', 'la');
    Popup.close();
    Popup.open('cardLocations')({ currentTarget: document.body, target: document.body, preventDefault() {}, stopPropagation() {} });
  });
  const pop = page.locator('.js-pop-over');
  await expect(pop.locator('.js-location-latitude').locator('..')).toContainText('Latitudo');
  await expect(pop.locator('.js-location-longitude').locator('..')).toContainText('Longitudo');
  await pop.locator('.js-location-map-link').fill('invalid');
  await pop.locator('.js-detect-location').click();
  await expect(pop.locator('.js-detect-message')).toHaveText('Locus ex hoc ligamine inveniri non potuit.');
  await expect(pop.locator('.js-location-latitude')).toHaveValue('');
  await pop.locator('.js-location-map-link').fill('https://www.openstreetmap.org/?mlat=60.17&mlon=24.94#map=16/60.17/24.94');
  await pop.locator('.js-detect-location').click();
  await expect(pop.locator('.js-detect-message')).toHaveText('Singula loci inventi infra inserta sunt.');
  await expect(pop.locator('.js-location-latitude')).toHaveValue('60.17');
  await expect(pop.locator('.js-location-longitude')).toHaveValue('24.94');
});
