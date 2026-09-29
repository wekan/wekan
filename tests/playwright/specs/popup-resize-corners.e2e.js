'use strict';
const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../../..');
for (const direction of ['ltr', 'rtl']) {
  test('popup resize grip stays in the ' + direction + ' corner and grows/shrinks', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.setContent('<html dir="' + direction + '"><body><div class="pop-over pop-over--bounded" data-popup="boardActionsPopup" style="left:300px;top:100px;width:600px;height:450px"><div class="header"><span class="header-title">Settings</span></div><div class="content-wrapper"><div class="content-container"><div class="content"><button class="ordinary">Action</button><p style="height:900px">Scrollable content</p></div></div></div><button type="button" class="js-date-popup-resize" aria-label="Size"><span>◢</span></button></div></body></html>');
    for (const file of ['client/components/forms/forms.css', 'client/components/main/popup.css']) {
      await page.addStyleTag({ content: fs.readFileSync(path.join(root, file), 'utf8') });
    }
    // Themes and mobile styles can make ordinary buttons full width.
    await page.addStyleTag({ content: '.pop-over button { display:block; width:100%; min-height:40px; padding:12px; background:rgb(41,128,185); color:white; }' });
    const source = fs.readFileSync(path.join(root, 'client/components/main/popup.js'), 'utf8').replace(/^import .*;\n/gm, '');
    await page.addScriptTag({ content: 'window.Popup = {template:{events(map){window.popupEvents=map;},onRendered(){},onDestroyed(){}}};\n' + source });
    await page.evaluate(() => {
      const grip = document.querySelector('.js-date-popup-resize');
      const tpl = {};
      for (const type of ['pointerdown', 'pointermove', 'keydown', 'click']) {
        grip.addEventListener(type, evt => window.popupEvents[type + ' .js-date-popup-resize'](evt, tpl));
      }
      for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) {
        grip.addEventListener(type, evt => window.popupEvents['pointerup .js-date-popup-resize, pointercancel .js-date-popup-resize, lostpointercapture .js-date-popup-resize'](evt, tpl));
      }
    });
    const popup = page.locator('.pop-over'), grip = page.locator('.js-date-popup-resize');
    const initial = await popup.boundingBox(), corner = await grip.boundingBox();
    expect(corner.width).toBe(24);
    expect(corner.height).toBe(24);
    expect(Math.abs(corner.y + corner.height - initial.y - initial.height)).toBeLessThan(3);
    expect(Math.abs(direction === 'ltr'
      ? corner.x + corner.width - initial.x - initial.width : corner.x - initial.x)).toBeLessThan(3);
    await expect(grip).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
    const sign = direction === 'rtl' ? -1 : 1;
    await page.mouse.move(corner.x + 12, corner.y + 12);
    await page.mouse.down();
    await page.mouse.move(corner.x + 12 + sign * 80, corner.y + 72);
    await page.mouse.up();
    const larger = await popup.boundingBox();
    expect(larger.width).toBeCloseTo(initial.width + 80, 0);
    expect(larger.height).toBeCloseTo(initial.height + 60, 0);
    expect(direction === 'ltr' ? larger.x : larger.x + larger.width)
      .toBeCloseTo(direction === 'ltr' ? initial.x : initial.x + initial.width, 0);
    await grip.focus();
    await grip.press(direction === 'rtl' ? 'ArrowRight' : 'ArrowLeft');
    await grip.press('ArrowUp');
    const smaller = await popup.boundingBox();
    expect(smaller.width).toBeCloseTo(larger.width - 20, 0);
    expect(smaller.height).toBeCloseTo(larger.height - 20, 0);
    const end = await grip.boundingBox();
    expect(Math.abs(end.y + end.height - smaller.y - smaller.height)).toBeLessThan(3);
    await expect(popup.locator('.content-wrapper')).toHaveCSS('overflow-y', 'auto');
  });
}
