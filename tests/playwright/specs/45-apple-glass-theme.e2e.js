'use strict';

// Apple Glass Pastel v2 — runtime visual contract.
//
// These assertions intentionally use computed styles and layout geometry rather
// than pixel snapshots. Browser blur rasterisation differs, while the user-facing
// contract (glass shell, neutral cards, responsive auth and no overflow) does not.

const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const { loginWithToken, openBoard } = require('../helpers/auth');
const fs = require('fs');
const path = require('path');

const THEME = 'appleglasspastel';
const EVIDENCE_DIR = process.env.WEKAN_APPLE_GLASS_EVIDENCE_DIR;

async function evidence(page, name) {
  if (!EVIDENCE_DIR) return;
  fs.mkdirSync(EVIDENCE_DIR, { recursive: true });
  await page.screenshot({ path: path.join(EVIDENCE_DIR, `${name}.png`), fullPage: true });
}

async function useGlobalTheme(userId) {
  db.updateOne('users', { _id: userId }, {
    $set: { 'profile.globalThemeColor': THEME, 'profile.globalThemeCustomColors': [] },
  });
}

async function computed(locator, properties) {
  return locator.evaluate((element, names) => {
    const style = getComputedStyle(element);
    return Object.fromEntries(names.map(name => [name, style[name]]));
  }, properties);
}

async function authGeometry(page) {
  return page.evaluate(() => {
    const logoPanel = document.querySelector('body > .auth-layout:has(.at-form-landing-logo)');
    const formPanel = document.querySelector('body > .auth-layout:has(.auth-dialog)');
    const logo = logoPanel?.getBoundingClientRect();
    const form = formPanel?.getBoundingClientRect();
    const at = (rect) => document.elementsFromPoint(
      rect.left + rect.width / 2,
      rect.top + Math.min(rect.height / 2, 200),
    );
    return {
      viewport: document.documentElement.clientWidth,
      document: document.documentElement.scrollWidth,
      logo: logo && { left: logo.left, right: logo.right, width: logo.width, top: logo.top, bottom: logo.bottom },
      form: form && { left: form.left, right: form.right, width: form.width, top: form.top, bottom: form.bottom },
      logoPaintsUnderForm: Boolean(logoPanel && form && at(form).includes(logoPanel)),
      formPaintsUnderLogo: Boolean(formPanel && logo && at(logo).includes(formPanel)),
    };
  });
}

async function viewportGeometry(page, selector) {
  return page.locator(selector).evaluate(root => {
    const rootBox = root.getBoundingClientRect();
    const controls = [...root.querySelectorAll('a, button, input, select')]
      .filter(element => {
        const box = element.getBoundingClientRect();
        const style = getComputedStyle(element);
        return style.display !== 'none' && style.visibility !== 'hidden'
          && box.width > 0 && box.height > 0;
      })
      .map(element => {
        const box = element.getBoundingClientRect();
        return {
          name: element.getAttribute('aria-label') || element.getAttribute('title')
            || element.textContent.trim(),
          left: box.left,
          right: box.right,
        };
      });
    return {
      viewport: document.documentElement.clientWidth,
      document: document.documentElement.scrollWidth,
      left: rootBox.left,
      right: rootBox.right,
      controls,
    };
  });
}

function expectInsideViewport(geometry) {
  expect(geometry.document).toBeLessThanOrEqual(geometry.viewport + 1);
  expect(geometry.left).toBeGreaterThanOrEqual(-1);
  expect(geometry.right).toBeLessThanOrEqual(geometry.viewport + 1);
  for (const control of geometry.controls) {
    expect(control.left, `${control.name} starts inside the viewport`).toBeGreaterThanOrEqual(-1);
    expect(control.right, `${control.name} ends inside the viewport`)
      .toBeLessThanOrEqual(geometry.viewport + 1);
  }
}

test.describe('Apple Glass Pastel v2', () => {
  test('global theme styles All Boards as glass islands and neutral cards', async ({
    page, user, board,
  }) => {
    const boardDescription = 'A concise board description shown below its thumbnail.';
    db.updateOne('boards', { _id: board.boardId }, { $set: {
      description: boardDescription,
      backgroundImageURL: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==',
    } });
    await useGlobalTheme(user.id);
    await loginWithToken(page, user.id, user.token);
    await page.goto('/remaining', { waitUntil: 'commit' });

    await expect(page.locator('body')).toHaveClass(new RegExp(`board-color-${THEME}`));
    await expect(page.locator('.board-list-item-name', { hasText: /E2E Board/ }).first())
      .toBeVisible();

    const header = await computed(page.locator('#header-quick-access'), [
      'backgroundColor', 'backdropFilter', 'color',
    ]);
    expect(header.backgroundColor).toContain('rgba(255, 255, 255');
    expect(header.backdropFilter).toContain('blur(24px)');
    expect(header.color).not.toBe('rgb(255, 255, 255)');
    const logo = await computed(page.locator('#header-quick-access .header-logo').first(), [
      'backgroundColor', 'borderRadius',
    ]);
    expect(logo.backgroundColor).toBe('rgba(15, 23, 42, 0.82)');
    expect(logo.borderRadius).toBe('10px');

    const menu = await computed(page.locator('.boards-left-menu'), [
      'backgroundColor', 'borderRadius', 'backdropFilter',
    ]);
    expect(menu.backgroundColor).toContain('rgba(255, 255, 255');
    expect(menu.borderRadius).toBe('24px');
    expect(menu.backdropFilter).toContain('blur(24px)');

    const boardTile = page.locator('.board-list > li.js-board').first();
    const tile = await computed(boardTile.locator(':scope > .board-list-item'), [
      'backgroundColor', 'borderRadius', 'boxShadow',
    ]);
    expect(tile.backgroundColor).toContain('rgba(255, 255, 255');
    expect(tile.borderRadius).toBe('18px');
    expect(tile.boxShadow).not.toBe('none');

    const thumbnail = boardTile.locator('.board-list-thumbnail');
    await expect(thumbnail).toBeVisible();
    await expect(thumbnail).toHaveClass(/has-image/);
    const thumbnailStyle = await computed(thumbnail, ['backgroundImage']);
    expect(thumbnailStyle.backgroundImage).not.toBe('none');
    const thumbnailGeometry = await thumbnail.evaluate(element => {
      const box = element.getBoundingClientRect();
      return { width: box.width, height: box.height };
    });
    expect(thumbnailGeometry.width / thumbnailGeometry.height).toBeCloseTo(16 / 9, 1);

    const description = boardTile.locator('.board-list-item-desc');
    await expect(description).toContainText(boardDescription);
    const textContract = await boardTile.evaluate(element => {
      const title = getComputedStyle(element.querySelector('.board-list-item-name'));
      const description = getComputedStyle(element.querySelector('.board-list-item-desc'));
      return {
        titleClamp: title.webkitLineClamp,
        descriptionClamp: description.webkitLineClamp,
      };
    });
    expect(textContract.titleClamp).toBe('2');
    expect(textContract.descriptionClamp).toBe('2');

    const structuralLayers = await boardTile.evaluate(element => {
      const item = element.querySelector(':scope > .board-list-item');
      const link = item.querySelector(':scope > .js-open-board');
      const styles = node => {
        const style = getComputedStyle(node);
        return {
          backgroundColor: style.backgroundColor,
          borderTopWidth: style.borderTopWidth,
          boxShadow: style.boxShadow,
        };
      };
      return { outer: styles(element), link: styles(link) };
    });
    for (const [name, layer] of Object.entries(structuralLayers)) {
      expect(layer.backgroundColor, `${name} wrapper is transparent`)
        .toBe('rgba(0, 0, 0, 0)');
      expect(layer.borderTopWidth, `${name} wrapper has no border`).toBe('0px');
      expect(layer.boxShadow, `${name} wrapper has no shadow`).toBe('none');
    }

    const geometry = await page.evaluate(() => ({
      viewport: document.documentElement.clientWidth,
      document: document.documentElement.scrollWidth,
    }));
    expect(geometry.document).toBeLessThanOrEqual(geometry.viewport + 1);
    await evidence(page, '01-all-boards-desktop');

    // Keep board fixture referenced so its cleanup remains part of this test.
    expect(board.boardId).toBeTruthy();
  });

  test('a board-only theme styles header, lists, cards, card details and popup', async ({
    page, user, board,
  }) => {
    db.updateOne('boards', { _id: board.boardId }, { $set: { color: THEME } });
    await loginWithToken(page, user.id, user.token);
    await openBoard(page, board.boardId, board.slug);

    await expect(page.locator('#header-quick-access'))
      .toHaveClass(new RegExp(`board-color-${THEME}`));
    await expect(page.locator('.board-wrapper')).toHaveClass(new RegExp(`board-color-${THEME}`));

    const boardHeader = page.locator('#header-quick-access');
    await expect.poll(async () => (
      await computed(boardHeader, ['backgroundColor'])
    ).backgroundColor).toContain('rgba(255, 255, 255');
    const header = await computed(boardHeader, ['color']);
    expect(header.color).toBe('rgb(15, 23, 42)');

    const list = await computed(page.locator('.js-list:not(.js-list-composer)').first(), [
      'backgroundColor', 'borderRadius', 'backdropFilter',
    ]);
    expect(list.backgroundColor).toContain('rgba(255, 255, 255');
    expect(list.borderRadius).toBe('18px');
    expect(list.backdropFilter).toContain('blur(24px)');

    const card = page.locator('.minicard').first();
    const cardStyle = await computed(card, [
      'backgroundColor', 'borderRadius', 'backdropFilter', 'marginBottom',
    ]);
    expect(cardStyle.backgroundColor).toBe('rgba(255, 255, 255, 0.9)');
    expect(cardStyle.borderRadius).toBe('14px');
    expect(cardStyle.backdropFilter).toBe('none');
    expect(cardStyle.marginBottom).toBe('0px');
    const wrapperStyle = await computed(page.locator('.minicard-wrapper').first(), [
      'marginBottom',
    ]);
    expect(wrapperStyle.marginBottom).toBe('12px');

    await card.click();
    await expect(page.locator('.card-details')).toBeVisible();
    const details = await computed(page.locator('.card-details'), [
      'backgroundColor', 'borderRadius', 'backdropFilter',
    ]);
    expect(details.backgroundColor).toContain('rgba(255, 255, 255');
    expect(details.borderRadius).toBe('18px');
    expect(details.backdropFilter).toContain('blur(24px)');

    const popupTrigger = page.locator('.js-open-card-details-menu').first();
    if (await popupTrigger.count()) {
      await popupTrigger.click();
      const popup = page.locator('.pop-over').last();
      await expect(popup).toBeVisible();
      const popupStyle = await computed(popup, ['backgroundColor', 'borderRadius']);
      expect(popupStyle.backgroundColor).toBe('rgba(255, 255, 255, 0.95)');
      expect(popupStyle.borderRadius).toBe('18px');
    }
    await evidence(page, '02-board-card-details-desktop');

    await page.setViewportSize({ width: 390, height: 844 });
    await expect.poll(async () => (
      await viewportGeometry(page, '#header-quick-access')
    ).right).toBeLessThanOrEqual(391);
    expectInsideViewport(await viewportGeometry(page, '#header-quick-access'));
  });

  test('Admin Panel keeps dense content inside two glass islands', async ({ page, adminUser }) => {
    await useGlobalTheme(adminUser.id);
    await loginWithToken(page, adminUser.id, adminUser.token);
    await page.goto('/admin/settings/visibility', { waitUntil: 'commit' });

    const menu = page.locator('.setting-content .content-body .side-menu');
    const main = page.locator('.setting-content .content-body .main-body');
    await expect(menu).toBeVisible();
    await expect(main).toBeVisible();

    for (const surface of [menu, main]) {
      const style = await computed(surface, ['backgroundColor', 'borderRadius', 'boxShadow']);
      expect(style.backgroundColor).toContain('rgba(255, 255, 255');
      expect(style.borderRadius).toBe('24px');
      expect(style.boxShadow).not.toBe('none');
    }
    await evidence(page, '03-admin-desktop');

    await page.setViewportSize({ width: 390, height: 844 });
    const mobile = await page.evaluate(() => {
      const rect = selector => {
        const box = document.querySelector(selector)?.getBoundingClientRect();
        return box && { left: box.left, right: box.right, width: box.width };
      };
      return {
        viewport: document.documentElement.clientWidth,
        document: document.documentElement.scrollWidth,
        menu: rect('.setting-content .content-body .side-menu'),
        main: rect('.setting-content .content-body .main-body'),
      };
    });
    expect(mobile.document).toBeLessThanOrEqual(mobile.viewport + 1);
    for (const surface of [mobile.menu, mobile.main]) {
      expect(surface.left).toBeGreaterThanOrEqual(-1);
      expect(surface.right).toBeLessThanOrEqual(mobile.viewport + 1);
    }
    expect(mobile.main.width).toBeGreaterThan(160);
    await evidence(page, '03b-admin-mobile');
  });

  test('login is split on desktop and collapses without overflow on mobile', async ({ page }) => {
    const setting = db.findOne('settings', {});
    test.skip(!setting, 'No settings document is available in this test database');
    const oldTheme = setting.themeColor;
    const oldCustom = setting.themeCustomColors;
    db.updateOne('settings', { _id: setting._id }, {
      $set: { themeColor: THEME, themeCustomColors: [] },
    });

    try {
      await page.goto('/sign-in', { waitUntil: 'commit' });
      await expect(page.locator('body')).toHaveClass(new RegExp(`board-color-${THEME}`));
      await expect(page.locator('.auth-dialog')).toBeVisible();
      await expect(page.locator('.at-form-landing-logo:empty')).toBeHidden();
      await expect(page.locator('.auth-layout:has(.at-form-landing-logo) > img').first())
        .toBeVisible();

      const desktop = await computed(page.locator('body'), ['display', 'gridTemplateColumns']);
      expect(desktop.display).toBe('grid');
      expect(desktop.gridTemplateColumns.split(' ')).toHaveLength(2);
      const ltr = await authGeometry(page);
      expect(ltr.logo.right).toBeLessThanOrEqual(ltr.form.left + 1);
      expect(ltr.logoPaintsUnderForm).toBe(false);
      expect(ltr.formPaintsUnderLogo).toBe(false);
      await evidence(page, '04-login-desktop');

      const langSelect = page.locator('.js-userform-set-language');
      await langSelect.selectOption('ar');
      await expect.poll(() => page.evaluate(() => document.documentElement.dir)).toBe('rtl');
      const rtl = await authGeometry(page);
      expect(rtl.form.right).toBeLessThanOrEqual(rtl.logo.left + 1);
      expect(rtl.logoPaintsUnderForm, JSON.stringify(rtl)).toBe(false);
      expect(rtl.formPaintsUnderLogo).toBe(false);
      await evidence(page, '04b-login-desktop-rtl');

      await page.setViewportSize({ width: 390, height: 844 });
      const mobile = await computed(page.locator('body'), ['display', 'gridTemplateColumns']);
      expect(mobile.display).toBe('block');

      const geometry = await page.evaluate(() => ({
        viewport: document.documentElement.clientWidth,
        document: document.documentElement.scrollWidth,
        dialog: document.querySelector('.auth-dialog')?.getBoundingClientRect().width,
      }));
      expect(geometry.document).toBeLessThanOrEqual(geometry.viewport + 1);
      expect(geometry.dialog).toBeLessThanOrEqual(geometry.viewport - 32);
      const rtlMobile = await authGeometry(page);
      for (const panel of [rtlMobile.logo, rtlMobile.form]) {
        expect(panel.left).toBeGreaterThanOrEqual(-1);
        expect(panel.right).toBeLessThanOrEqual(rtlMobile.viewport + 1);
      }
      expect(rtlMobile.logo.bottom).toBeLessThanOrEqual(rtlMobile.form.top + 1);
      await evidence(page, '05b-login-mobile-rtl');

      await langSelect.selectOption('en');
      await expect.poll(() => page.evaluate(() => document.documentElement.dir)).toBe('ltr');
      const ltrMobile = await authGeometry(page);
      for (const panel of [ltrMobile.logo, ltrMobile.form]) {
        expect(panel.left).toBeGreaterThanOrEqual(-1);
        expect(panel.right).toBeLessThanOrEqual(ltrMobile.viewport + 1);
      }
      expect(ltrMobile.logo.bottom).toBeLessThanOrEqual(ltrMobile.form.top + 1);
      await evidence(page, '05-login-mobile');
    } finally {
      const update = {};
      const unset = {};
      if (oldTheme === undefined) unset.themeColor = '';
      else update.themeColor = oldTheme;
      if (oldCustom === undefined) unset.themeCustomColors = '';
      else update.themeCustomColors = oldCustom;
      const modifier = {};
      if (Object.keys(update).length) modifier.$set = update;
      if (Object.keys(unset).length) modifier.$unset = unset;
      db.updateOne('settings', { _id: setting._id }, modifier);
    }
  });
});
