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
