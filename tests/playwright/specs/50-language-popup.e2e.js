'use strict';
const { test, expect } = require('../fixtures');
const fs = require('node:fs');
const path = require('node:path');
const { parseLanguageMetadata } = require('../../lib/languageRegistrySource.cjs');
const rows = parseLanguageMetadata(fs.readFileSync(path.resolve(__dirname, '../../../imports/i18n/languages.js'), 'utf8'));
for (const direction of ['ltr', 'rtl']) {
  test(`language popup places flags by language and region (${direction})`, async ({ boardPage, user }) => {
    const db = require('../helpers/db');
    db.updateOne('users', {_id:user.id}, {$set:{'profile.language': direction === 'rtl' ? 'ar' : 'en'}});
    await boardPage.reload();
    await expect(boardPage.locator('html')).toHaveAttribute('dir', direction);
    await boardPage.locator('.js-open-header-member-menu').first().click();
    await boardPage.locator('.js-change-language').click();
    const popup = boardPage.locator(".pop-over[data-popup='changeLanguagePopup']");
    await expect(popup).toBeVisible();
    await expect(popup.locator('.js-set-language')).toHaveCount(rows.length);
    for (const row of rows) {
      await expect(popup.locator(`.js-set-language[data-language="${row[2]}"]`)).toHaveCount(1);
    }
    for (const [tag, language, country] of [
      ['en-BR', '🇺🇸', '🇧🇷'], ['es-CO', '🇪🇸', '🇨🇴'],
      ['fr-CA', '🇫🇷', '🇨🇦'], ['ve-PP', '🇷🇺', '🇷🇺'],
    ]) {
      const entry = popup.locator(`.js-set-language[data-language="${tag}"]`);
      await expect(entry).toHaveAttribute('dir', direction);
      await expect(entry.locator('.language-flags')).toHaveText(language);
      await expect(entry.locator('.language-region .language-country-flag')).toHaveText(country);
    }
    const brazil = popup.locator('.js-set-language[data-language="en-BR"]');
    await expect(brazil.locator('.language-name')).toHaveText('English');
    await expect(brazil.locator('.language-region bdi')).toHaveText('Brazil');
    await expect(brazil.locator('.language-region')).toHaveText('(🇧🇷 Brazil)');
    const [flag, name, region, country, regionName] = await Promise.all([
      brazil.locator('.language-flags').boundingBox(),
      brazil.locator('.language-name').boundingBox(),
      brazil.locator('.language-region').boundingBox(),
      brazil.locator('.language-country-flag').boundingBox(),
      brazil.locator('.language-region bdi').boundingBox(),
    ]);
    if (direction === 'ltr') {
      expect(flag.x).toBeLessThan(name.x);
      expect(name.x).toBeLessThan(region.x);
      expect(country.x).toBeLessThan(regionName.x);
    } else {
      expect(flag.x).toBeGreaterThan(name.x);
      expect(name.x).toBeGreaterThan(region.x);
      expect(country.x).toBeGreaterThan(regionName.x);
    }
  });
}

test('missing profile language follows browser preferences; saved choice wins', async ({ boardPage, user }) => {
  const db = require('../helpers/db');
  db.updateOne('users', {_id:user.id}, {$unset:{'profile.language':''}});
  await boardPage.addInitScript(() => {
    Object.defineProperty(navigator, 'languages', {configurable:true, get:() => ['zz-ZZ', 'vep']});
    Object.defineProperty(navigator, 'language', {configurable:true, get:() => 'zz-ZZ'});
  });
  await boardPage.reload();
  await expect(boardPage.locator('html')).toHaveAttribute('lang','ve-PP');
  expect(db.findOne('users',{_id:user.id}).profile?.language).toBeUndefined();
  db.updateOne('users', {_id:user.id}, {$set:{'profile.language':'de'}});
  await boardPage.reload();
  await expect(boardPage.locator('html')).toHaveAttribute('lang','de');
});
