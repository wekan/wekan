'use strict';

/**
 * Spec 47 - accessibility beyond spec 45's page list (TODO.md: "Accessibility:
 * every missing WCAG 2.2 AA feature added, and the accessibility tests extended
 * to every page, popup and Admin Panel pane").
 *
 * - every Admin Panel pane (models/lib/adminUrls.js ADMIN_PAGES), scanned with
 *   axe's WCAG 2.0, 2.1 and 2.2 A and AA rules;
 * - the popups people open most: member menu, board menu, list menu, swimlane
 *   menu, card details menu;
 * - 1.4.10 Reflow: at 320 CSS pixels wide (also what 200 % zoom of a 640 px
 *   window is) no page scrolls sideways;
 * - 2.3.3 / prefers-reduced-motion: with reduced motion asked for, nothing
 *   animates for longer than a moment.
 *
 * Theme contrast is spec 46. Automated rules cover only part of WCAG.
 */

const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const { loginWithToken, openBoard } = require('../helpers/auth');
const axe = require('axe-core');
const { ADMIN_PAGES, adminPath } = require('../../../models/lib/adminUrls');

const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

async function scan(page, root = 'document') {
  await page.waitForTimeout(1500);
  await page.evaluate(source => { if (!window.axe) (0, eval)(source); }, axe.source);
  return page.evaluate(async ([tags, rootSel]) => {
    const context = rootSel === 'document' ? document : (document.querySelector(rootSel) || document);
    const result = await window.axe.run(context, { runOnly: { type: 'tag', values: tags }, resultTypes: ['violations'] });
    return result.violations.map(v => `${v.id} (${v.impact}, ${v.nodes.length}): ${v.nodes.slice(0, 3).map(n => n.target.join(' ')).join(' | ')}`);
  }, [TAGS, root]);
}

// Every pane of the Admin Panel, as its address. Encrypt is shown only while
// ATTACHMENTS_PASSPHRASE is set; its address still answers.
const PANES = Object.entries(ADMIN_PAGES).flatMap(([page, cfg]) => Object.keys(cfg.panes).map(slug => adminPath(page, slug)));

test.describe('accessibility everywhere', () => {
  test.setTimeout(600_000);

  test('every Admin Panel pane passes the WCAG 2.2 AA rules', async ({ page, adminUser }) => {
    await loginWithToken(page, adminUser.id, adminUser.token);
    const failures = [];
    for (const url of PANES) {
      await page.goto(url, { waitUntil: 'load' });
      const v = await scan(page);
      if (v.length) failures.push(`${url}\n  ${v.join('\n  ')}`);
    }
    expect(failures, failures.join('\n')).toEqual([]);
  });

  test('the popups people open most pass the WCAG 2.2 AA rules', async ({ boardPage }) => {
    const failures = [];
    const popups = [
      ['member menu', '.js-open-header-member-menu'],
      ['list menu', '.js-open-list-menu'],
      ['swimlane menu', '.js-open-swimlane-menu'],
    ];
    for (const [name, opener] of popups) {
      const btn = boardPage.locator(opener).first();
      if (!(await btn.isVisible().catch(() => false))) { failures.push(`${name}: its opener ${opener} is not visible`); continue; }
      await btn.click();
      await expect(boardPage.locator('.js-pop-over').first()).toBeVisible({ timeout: 10_000 });
      const v = await scan(boardPage, '.js-pop-over');
      if (v.length) failures.push(`${name}\n  ${v.join('\n  ')}`);
      await boardPage.keyboard.press('Escape');
      await expect(boardPage.locator('.js-pop-over')).toHaveCount(0, { timeout: 10_000 });
    }
    // The card details menu, from an opened card.
    await boardPage.locator('.minicard').first().click();
    const menu = boardPage.locator('.js-open-card-details-menu').first();
    await expect(menu).toBeVisible({ timeout: 15_000 });
    await menu.click();
    await expect(boardPage.locator('.js-pop-over').first()).toBeVisible({ timeout: 10_000 });
    const v = await scan(boardPage, '.js-pop-over');
    if (v.length) failures.push(`card details menu\n  ${v.join('\n  ')}`);
    expect(failures, failures.join('\n')).toEqual([]);
  });

  test('1.4.10 Reflow: at 320 px wide no page scrolls sideways', async ({ page, user, board }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    await loginWithToken(page, user.id, user.token);
    const sideways = [];
    const check = async label => {
      await page.waitForTimeout(1500);
      const { scroll, width } = await page.evaluate(() => ({
        scroll: document.scrollingElement.scrollWidth, width: document.documentElement.clientWidth,
      }));
      if (scroll > width + 1) sideways.push(`${label}: content ${scroll}px in a ${width}px window`);
    };
    for (const url of ['/', '/my-cards', '/due-cards', '/accessibility', '/privacy']) {
      await page.goto(url, { waitUntil: 'load' });
      await check(url);
    }
    await openBoard(page, board.boardId, board.slug);
    await check('a board');
    expect(sideways, sideways.join('\n')).toEqual([]);
  });

  test('reduced motion: nothing animates for longer than a moment', async ({ browser, user, board }) => {
    const context = await browser.newContext({ reducedMotion: 'reduce' });
    const page = await context.newPage();
    try {
      await loginWithToken(page, user.id, user.token);
      await openBoard(page, board.boardId, board.slug);
      await page.waitForTimeout(1500);
      const long = await page.evaluate(() => {
        const secs = v => v.split(',').map(s => parseFloat(s) * (s.trim().endsWith('ms') ? 0.001 : 1)).reduce((a, b) => Math.max(a, b), 0);
        const out = [];
        for (const el of document.querySelectorAll('body *')) {
          const cs = getComputedStyle(el);
          const anim = cs.animationName !== 'none' ? secs(cs.animationDuration) * (cs.animationIterationCount === 'infinite' ? 100 : 1) : 0;
          const trans = secs(cs.transitionDuration);
          if (anim > 0.01 || trans > 0.01) out.push(`${el.tagName.toLowerCase()}.${String(el.className).split(' ').slice(0, 2).join('.')} anim ${anim}s trans ${trans}s`);
          if (out.length > 20) break;
        }
        return out;
      });
      expect(long, long.join('\n')).toEqual([]);
    } finally {
      await context.close();
    }
  });
});
