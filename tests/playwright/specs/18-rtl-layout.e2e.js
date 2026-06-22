'use strict';

/**
 * Spec 18 — RTL / LTR layout across all pages
 *
 * Verifies that when an RTL language (Arabic) is selected the whole UI mirrors,
 * and when an LTR language (English) is selected it does not — on every major
 * page. For each page we assert three things:
 *
 *   1. Direction:   <html dir> and the computed CSS `direction` match the
 *                   language (rtl vs ltr).
 *   2. Visibility:  the page's translated text actually renders (visible and
 *                   non-empty) — i.e. nothing disappears under RTL.
 *   3. Placement:   leading-edge content sits on the correct side — the boards
 *                   left menu and the first board list flip to the right under
 *                   RTL and stay on the left under LTR.
 *
 * Language is set via the user's `profile.language`, which the client reads at
 * startup and applies to document.documentElement.dir (see client/lib/i18n.js).
 *
 * The non-visual invariants (the RTL language set and the logical-property CSS)
 * are covered by the fast, server-less tests/rtl.test.js.
 */

const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const { loginWithToken, openBoard } = require('../helpers/auth');
const BoardPage = require('../pages/BoardPage');
const CardPage = require('../pages/CardPage');

const BASE_URL = process.env.WEKAN_BASE_URL || 'http://localhost:3000';

const LANGS = [
  { lang: 'en', dir: 'ltr', label: 'LTR (English)' },
  { lang: 'ar', dir: 'rtl', label: 'RTL (Arabic)' },
];

// --- helpers ---------------------------------------------------------------

/** Persist the user's language so the client applies it on the next load. */
function setUserLanguage(userId, lang) {
  db.updateOne('users', { _id: userId }, { $set: { 'profile.language': lang } });
}

/** Log in as `user` with `lang` already selected, landing on the home page. */
async function loginAs(page, user, lang) {
  setUserLanguage(user.id, lang);
  await loginWithToken(page, user.id, user.token);
}

/** Poll the root <html> dir attribute until it matches (it is set reactively). */
async function expectHtmlDir(page, dir) {
  await expect
    .poll(() => page.evaluate(() => document.documentElement.getAttribute('dir') || 'ltr'), {
      timeout: 15_000,
      message: `expected <html dir="${dir}">`,
    })
    .toBe(dir);
}

/** Assert the computed CSS direction of an element matches. */
async function expectComputedDirection(locator, dir) {
  const actual = await locator.evaluate(el => getComputedStyle(el).direction);
  expect(actual).toBe(dir);
}

/** Assert a locator is visible and renders non-empty text. */
async function expectVisibleText(locator) {
  await expect(locator).toBeVisible({ timeout: 15_000 });
  // i18n can populate the label slightly after the element becomes visible
  // (more noticeable on the production bundle in CI), so wait for non-empty
  // text rather than reading it the instant the element appears.
  await expect(locator, 'translated text should be visible (non-empty)')
    .toHaveText(/\S/, { timeout: 15_000 });
}

/** True when `childBox` sits on the leading side of `parentBox` for `dir`. */
function onLeadingSide(childBox, parentBox, dir) {
  const childCenter = childBox.x + childBox.width / 2;
  const parentCenter = parentBox.x + parentBox.width / 2;
  return dir === 'rtl' ? childCenter > parentCenter : childCenter < parentCenter;
}

// --- per-language page coverage -------------------------------------------

for (const { lang, dir, label } of LANGS) {
  test.describe(`${label} layout`, () => {
    test('home / boards list: direction, visible text, leading menu side', async ({
      page,
      user,
      board,
    }) => {
      await loginAs(page, user, lang);
      await page.goto(BASE_URL, { waitUntil: 'commit' });

      const layout = page.locator('.boards-layout');
      await expect(layout).toBeVisible({ timeout: 15_000 });

      await expectHtmlDir(page, dir);
      await expectComputedDirection(layout, dir);

      // Translated menu labels render.
      const leftMenu = page.locator('.boards-left-menu');
      await expectVisibleText(leftMenu.locator('.menu-label').first());

      // The left menu flips to the trailing/leading side with direction.
      const menuBox = await leftMenu.boundingBox();
      const layoutBox = await layout.boundingBox();
      expect(menuBox && layoutBox).toBeTruthy();
      expect(
        onLeadingSide(menuBox, layoutBox, dir),
        `boards menu should be on the ${dir === 'rtl' ? 'right' : 'left'} for ${dir}`,
      ).toBe(true);
    });

    test('board view: direction, visible cards, first list on leading side', async ({
      page,
      user,
      board,
    }) => {
      await loginAs(page, user, lang);
      await openBoard(page, board.boardId, board.slug);

      await expectHtmlDir(page, dir);

      const bp = new BoardPage(page);
      const [firstListId, , lastListId] = board.listIds;

      // Cards are visible.
      await expectVisibleText(bp.minicard(firstListId, 'Alpha Card').locator('.minicard-title').first());

      const canvas = page.locator('.js-lists, .board-canvas').first();
      await expectComputedDirection(canvas, dir);

      // The first list (lowest sort) is rendered on the leading edge: left for
      // LTR, right for RTL. Comparing it to the last list proves the columns
      // actually flipped (the flex row reverses with dir).
      const firstBox = await page.locator(`#js-list-${firstListId}`).boundingBox();
      const lastBox = await page.locator(`#js-list-${lastListId}`).boundingBox();
      expect(firstBox && lastBox).toBeTruthy();
      if (dir === 'rtl') {
        expect(firstBox.x, 'first list should be to the right of the last list in RTL').toBeGreaterThan(
          lastBox.x,
        );
      } else {
        expect(firstBox.x, 'first list should be to the left of the last list in LTR').toBeLessThan(
          lastBox.x,
        );
      }
    });

    test('card details panel: direction and visible title', async ({ page, user, board }) => {
      await loginAs(page, user, lang);
      await openBoard(page, board.boardId, board.slug);

      const bp = new BoardPage(page);
      await bp.minicard(board.listIds[0], 'Alpha Card').click();

      const cp = new CardPage(page);
      await cp.waitForOpen();

      await expectHtmlDir(page, dir);
      await expectComputedDirection(cp.root, dir);
      await expectVisibleText(cp.title());
    });

    test('list pages (my-cards, due-cards, global-search): direction and visible text', async ({
      page,
      user,
      board,
    }) => {
      await loginAs(page, user, lang);

      for (const route of ['/my-cards', '/due-cards', '/global-search']) {
        await page.goto(`${BASE_URL}${route}`, { waitUntil: 'commit' });
        const content = page.locator('#content');
        await expect(content, `#content visible on ${route}`).toBeVisible({ timeout: 15_000 });
        await expectHtmlDir(page, dir);
        await expectComputedDirection(content, dir);
        // The translated page title lives in the header bar and is always
        // present, even when the body is empty (e.g. My Cards with no cards
        // assigned to this user). That is the reliable "text is visible" anchor.
        await expectVisibleText(page.locator('#header-main-bar'));
      }
    });
  });
}

// --- admin settings (needs an admin user) ----------------------------------

for (const { lang, dir, label } of LANGS) {
  test(`admin settings page renders ${label}`, async ({ page, adminUser }) => {
    await loginAs(page, adminUser, lang);
    await page.goto(`${BASE_URL}/setting`, { waitUntil: 'commit' });

    const content = page.locator('#content');
    await expect(content).toBeVisible({ timeout: 15_000 });
    await expectHtmlDir(page, dir);
    await expectComputedDirection(content, dir);
    await expectVisibleText(content);
  });
}

// --- login page (logged out): switching the language flips direction --------

test('login page mirrors when an RTL language is chosen and text stays visible', async ({ page }) => {
  await page.goto(`${BASE_URL}/sign-in`, { waitUntil: 'commit' });

  const langSelect = page.locator('.js-userform-set-language');
  const authDialog = page.locator('section.auth-dialog');
  await expect(authDialog).toBeVisible({ timeout: 15_000 });

  // Choose Arabic -> the page must flip to RTL and the form text must remain.
  await expect(langSelect).toBeVisible({ timeout: 15_000 });
  await langSelect.selectOption('ar');
  await expectHtmlDir(page, 'rtl');
  await expectComputedDirection(authDialog, 'rtl');
  await expectVisibleText(authDialog);

  // Switch back to English -> LTR again.
  await langSelect.selectOption('en');
  await expectHtmlDir(page, 'ltr');
  await expectComputedDirection(authDialog, 'ltr');
  await expectVisibleText(authDialog);
});
