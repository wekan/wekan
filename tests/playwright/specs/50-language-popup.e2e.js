'use strict';
const { test, expect } = require('../fixtures');
const fs = require('node:fs');
const path = require('node:path');
const { parseLanguageMetadata } = require('../../lib/languageRegistrySource.cjs');
const rows = parseLanguageMetadata(fs.readFileSync(path.resolve(__dirname, '../../../imports/i18n/languages.js'), 'utf8'));
test('language popup lists every locale and orders country before language flags', async ({ boardPage }) => {
  await boardPage.locator('.js-open-header-member-menu').first().click();
  await boardPage.locator('.js-change-language').click();
  const popup = boardPage.locator(".pop-over[data-popup='changeLanguagePopup']");
  await expect(popup).toBeVisible();
  await expect(popup.locator('.js-set-language')).toHaveCount(rows.length);
  for (const [tag, name] of rows.map(row => [row[2], row[3]])) {
    const entry = popup.locator('.js-set-language').filter({ hasText: name });
    await expect(entry.first()).toBeAttached();
  }
  for (const [name, flags] of [['Español en Colombia','🇨🇴 🇪🇸'], ['Français (Canada)','🇨🇦 🇫🇷'], ['Vepsän kelʹ','🇷🇺 🇷🇺']]) {
    const entry = popup.locator('.js-set-language').filter({hasText:name});
    await expect(entry.locator('.language-flags')).toHaveText(flags);
    await expect(entry.locator('.language-flags')).toHaveAttribute('dir','ltr');
  }
});

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
