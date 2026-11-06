'use strict';

/**
 * #6840 - a shortcut runs once on a non-Latin keyboard.
 *
 * "d" opened the Due date popup and closed it at a glance on a Farsi layout: the
 * key was handled by hotkeys-js (which resolves it from event.code) and again by a
 * copy of it re-dispatched by client/lib/keyboard.js. This drives real key events
 * (the browser's own, through the protocol, with the key a Farsi or Cyrillic layout
 * types on the d key) at the library WeKan uses, with no handler of WeKan's in
 * front, and counts how many times a shortcut runs.
 */

const fs = require('fs');
const path = require('path');
const { test, expect } = require('@playwright/test');

const hotkeysSource = fs.readFileSync(
  path.join(__dirname, '../../../node_modules/hotkeys-js/dist/hotkeys-js.umd.cjs'), 'utf8');

test('a shortcut runs once for the d key on a Latin, a Farsi and a Cyrillic layout', async ({ page, browserName }) => {
  // The key events come from the DevTools protocol, which only Chromium has
  // (Firefox failed with "CDP session is only available in Chromium").
  test.skip(browserName !== 'chromium', 'the key events come from the DevTools protocol');
  await page.setContent('<body></body>');
  await page.evaluate(source => {
    const module = { exports: {} };
    new Function('module', 'exports', source)(module, module.exports);
    window.hotkeys = module.exports.default || module.exports.hotkeys || module.exports;
    window.count = 0;
    window.hotkeys('d', () => { window.count += 1; });
  }, hotkeysSource);

  const cdp = await page.context().newCDPSession(page);
  for (const [layout, key] of [['Latin', 'd'], ['Farsi', 'ی'], ['Cyrillic', 'в']]) {
    await page.evaluate(() => { window.count = 0; });
    for (const type of ['rawKeyDown', 'keyUp']) {
      await cdp.send('Input.dispatchKeyEvent', { type, key, code: 'KeyD', windowsVirtualKeyCode: 68, nativeVirtualKeyCode: 68 });
    }
    expect(await page.evaluate(() => window.count), `${layout}: the d shortcut ran once`).toBe(1);
  }
});
