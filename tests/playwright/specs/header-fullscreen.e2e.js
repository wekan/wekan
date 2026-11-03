'use strict';

// A full screen button to the right of the logo in the header bar (iPad Safari has
// the Fullscreen API; so do desktop browsers and Android). It uses the existing
// "Maximize" label, is drawn only where the browser offers the API and the page may
// use it, and follows the browser's own full screen events.
const { test, expect } = require('../fixtures');

const inFullscreen = page => page.evaluate(() => !!(document.fullscreenElement || document.webkitFullscreenElement));

test('the header has a full screen button beside the logo that enters and leaves full screen', async ({ boardPage: page, browserName }) => {
  const button = page.locator('.js-toggle-fullscreen');
  await expect(button, 'drawn where the browser has the Fullscreen API').toBeVisible();
  // The existing "Maximize" label: a title and an accessible name, and not pressed yet.
  await expect(button).toHaveAttribute('title', 'Maximize');
  await expect(button).toHaveAttribute('aria-label', 'Maximize');
  await expect(button).toHaveAttribute('aria-pressed', 'false');
  await expect(button.locator('.fa-expand')).toBeVisible();

  // To the right of the logo, in the same bar.
  const logo = page.locator('#header-quick-access .header-logo').first();
  const logoBox = await logo.boundingBox();
  const buttonBox = await button.boundingBox();
  expect(logoBox && buttonBox).toBeTruthy();
  expect(buttonBox.x, 'the button is to the right of the logo').toBeGreaterThan(logoBox.x + logoBox.width - 1);

  // Firefox could not be launched where this was written, so entering is not asserted there.
  test.skip(browserName === 'firefox', 'full screen entering not verified on Firefox');

  expect(await inFullscreen(page)).toBe(false);
  await button.click();
  await expect.poll(() => inFullscreen(page), { message: 'the click enters full screen' }).toBe(true);
  await expect(button).toHaveAttribute('aria-pressed', 'true');
  await expect(button.locator('.fa-compress')).toBeVisible();
  // In full screen the same button says how to leave: the existing "Minimize".
  await expect(button).toHaveAttribute('title', 'Minimize');
  await expect(button).toHaveAttribute('aria-label', 'Minimize');

  // Leaving by the button...
  await button.click();
  await expect.poll(() => inFullscreen(page)).toBe(false);
  await expect(button).toHaveAttribute('aria-pressed', 'false');
  await expect(button.locator('.fa-expand')).toBeVisible();
  await expect(button, 'and back to Maximize').toHaveAttribute('title', 'Maximize');

  // ...and by the browser's own way out (Esc), which the icon must follow.
  await button.click();
  await expect.poll(() => inFullscreen(page)).toBe(true);
  await page.evaluate(() => (document.exitFullscreen || document.webkitExitFullscreen).call(document));
  await expect.poll(() => inFullscreen(page)).toBe(false);
  await expect(button).toHaveAttribute('aria-pressed', 'false');
  await expect(button.locator('.fa-expand')).toBeVisible();
});

test('negative: no button where the page may not use full screen (iPhone, an iframe without allowfullscreen)', async ({ boardPage: page }) => {
  await expect(page.locator('.js-toggle-fullscreen')).toHaveCount(1);
  // What iPhone Safari and a plain iframe say: the API is not enabled.
  await page.addInitScript(() => {
    for (const name of ['fullscreenEnabled', 'webkitFullscreenEnabled']) {
      Object.defineProperty(Document.prototype, name, { get: () => false, configurable: true });
    }
  });
  await page.reload();
  await expect(page.locator('#header-quick-access')).toBeVisible();
  await expect(page.locator('.js-toggle-fullscreen'), 'not drawn').toHaveCount(0);
  // The rest of the bar is there.
  await expect(page.locator('#header-quick-access .header-logo').first()).toBeVisible();
});
