'use strict';

const { test, expect } = require('@playwright/test');
const { KEYBOARD_SHORTCUT_MAPPINGS } = require('../../../imports/lib/keyboardShortcutMappings');

test('shortcuts expose the same translated actions with and without JavaScript', async ({
  browser,
  baseURL,
  page: modern,
}) => {
  await modern.goto(`${baseURL}/shortcuts`);

  const legacyContext = await browser.newContext({ javaScriptEnabled: false });
  const legacy = await legacyContext.newPage();
  await legacy.goto(`${baseURL}/shortcuts`);

  await expect(legacy.locator('h1')).toHaveText('Keyboard shortcuts');
  await expect(legacy.locator('table.legacy-content')).toHaveCount(1);
  await expect(legacy.locator('body')).not.toContainText(
    'This page has a Legacy HTML4 baseline',
  );

  for (const mapping of KEYBOARD_SHORTCUT_MAPPINGS) {
    const modernAction = modern.locator('.shortcuts-list-item-action').filter({
      hasText: /\S/,
    }).nth(KEYBOARD_SHORTCUT_MAPPINGS.indexOf(mapping));
    await expect(modernAction).not.toHaveText(mapping.action);
    const translated = (await modernAction.innerText()).trim();
    await expect(legacy.locator('tbody')).toContainText(translated);
    for (const key of mapping.keys) await expect(legacy.locator('tbody')).toContainText(key);
  }

  await legacyContext.close();
});
