'use strict';

/**
 * Spec 46 - colour contrast in every board theme, and in custom colours (#6863).
 *
 * "Dark Themes broken in 12.87": Card Settings had white text on light grey blocks,
 * the custom fields popup, the sidebar's shortcuts row and the quiet buttons were
 * dark on dark, and list headers kept light text on a light grey. The default theme
 * is scanned by spec 45; this is every other theme, in the places the report named
 * and the ones the same scan found: the board, the filter sidebar, an opened card,
 * the board sidebar, Card Settings, and the custom fields popup. axe-core's
 * color-contrast rule must find nothing.
 *
 * A color a member chooses is one half of a pair, and the other half is worked out
 * (models/lib/contrastColor.js): a custom theme accent is darkened until the
 * header's white text reads, a chosen text color is made legible on the theme's
 * surface. The last tests choose colors that do not read, and scan.
 */

const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const { loginWithToken, openBoard } = require('../helpers/auth');
const axe = require('axe-core');

const { THEME_CATEGORIES } = require('../../../models/lib/themeCategories');

// Every theme there is; the default one (belize) is spec 45's.
const THEMES = Object.values(THEME_CATEGORIES).flat().filter(name => name !== 'belize');

async function contrastFailures(page) {
  await page.evaluate(source => { if (!window.axe) (0, eval)(source); }, axe.source);
  return page.evaluate(async () => {
    const result = await window.axe.run(document, { runOnly: { type: 'rule', values: ['color-contrast'] }, resultTypes: ['violations'] });
    return result.violations.flatMap(v => v.nodes.map(n => {
      const data = (n.any[0] && n.any[0].data) || {};
      return `${n.target.join(' ').slice(0, 80)} ${data.fgColor}/${data.bgColor} ${data.contrastRatio}`;
    }));
  });
}

test.describe('axe-core: colour contrast in every theme', () => {
  test.setTimeout(180_000);

  for (const theme of THEMES) {
    test(`${theme}: board, card, sidebar, Card Settings and the custom fields popup`, async ({ page, user }) => {
      const board = db.seedBoard({ ownerId: user.id, title: `Dark ${theme}`, listCount: 2, cardTitlesPerList: [['Alpha'], ['Beta']] });
      db.updateOne('boards', { _id: board.boardId }, { $set: { color: theme } });
      try {
        await loginWithToken(page, user.id, user.token);
        await openBoard(page, board.boardId, board.slug);
        await page.waitForTimeout(2000);
        expect(await contrastFailures(page), `${theme}: board`).toEqual([]);

        // The board sidebar and Card Settings, where the report's white-on-grey blocks were.
        await page.locator('.js-toggle-board-menu, .board-header-btn.js-open-board-menu, .js-toggle-sidebar, .fa-bars').first().click();
        await page.waitForTimeout(1000);
        expect(await contrastFailures(page), `${theme}: sidebar`).toEqual([]);
        await page.getByText('Board Settings', { exact: true }).first().click();
        await page.waitForTimeout(1200);
        const cardSettings = page.locator('.pop-over a:has-text("Card")').last();
        await expect(cardSettings, 'Board Settings has a Card item').toBeVisible();
        await cardSettings.click();
        await page.waitForTimeout(2000);
        expect(await contrastFailures(page), `${theme}: Card Settings`).toEqual([]);
        await page.locator('.pop-over .js-close-pop-over').first().click();
        await page.waitForTimeout(500);

        // The filter sidebar: its headings and preset buttons were below 4.5 in most themes.
        await page.locator('.js-open-filter-view').first().click();
        await page.waitForTimeout(1000);
        expect(await contrastFailures(page), `${theme}: filter sidebar`).toEqual([]);
        await page.locator('.sidebar .js-close-sidebar').first().click();
        await page.waitForTimeout(600);

        // An opened card and its custom fields popup.
        await page.locator('.minicard').first().click();
        await page.waitForTimeout(2000);
        expect(await contrastFailures(page), `${theme}: card`).toEqual([]);
        const link = page.locator('.js-open-custom-fields-settings').first();
        await link.scrollIntoViewIfNeeded();
        await link.click({ force: true });
        await page.waitForTimeout(1200);
        expect(await contrastFailures(page), `${theme}: custom fields popup`).toEqual([]);
      } finally {
        db.cleanup({ boardIds: [board.boardId] });
      }
    });
  }

  // Colors the member chose, that do not read as chosen.
  for (const [label, theme, custom, uiTextColor] of [
    ['a custom yellow accent', 'belize', ['#ffff00'], null],
    ['a custom yellow and cyan slide', 'clearblue', ['#ffff00', '#00ffff'], null],
    ['a dark text color on a dark theme', 'cleandark', [], '#333333'],
    ['a pale text color on a light theme', 'belize', [], '#bbbbbb'],
  ]) {
    test(`custom color: ${label} is made readable`, async ({ page, user }) => {
      const board = db.seedBoard({ ownerId: user.id, title: label, listCount: 1, cardTitlesPerList: [['Alpha']] });
      db.updateOne('boards', { _id: board.boardId }, { $set: { color: theme, customThemeColors: custom } });
      if (uiTextColor) db.updateOne('users', { _id: user.id }, { $set: { 'profile.uiTextColor': uiTextColor } });
      try {
        await loginWithToken(page, user.id, user.token);
        await openBoard(page, board.boardId, board.slug);
        await page.waitForTimeout(2500);
        expect(await contrastFailures(page), label).toEqual([]);
      } finally {
        db.cleanup({ boardIds: [board.boardId] });
      }
    });
  }
});
