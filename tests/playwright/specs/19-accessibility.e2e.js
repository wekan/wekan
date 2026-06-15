'use strict';

/**
 * Spec 19 — Accessibility
 *
 * Verifies the cross-cutting accessibility guarantees that should hold on every
 * page, based on WCAG 2.1 AA success criteria:
 *  - 3.1.1 Language of Page: <html> has a lang (and dir) attribute
 *  - 2.4.1 Bypass Blocks: a skip-to-content link targets the main landmark
 *  - 1.3.1 Info and Relationships: page exposes main / navigation / search landmarks
 *  - 2.4.7 Focus Visible: a focused control gets a visible outline
 *  - 4.1.2 Name, Role, Value: icon-only dialog controls expose an accessible name
 *  - 4.1.1 Parsing: no duplicate element ids on a rendered page
 *
 * These tests exercise the shared layout (layouts.jade), the popup dialog
 * (popup.tpl.jade), the header (header.jade) and the global search page.
 */

const { test, expect } = require('../fixtures');
const BoardPage = require('../pages/BoardPage');

test.describe('Accessibility', () => {
  test('the html element declares its language and text direction', async ({ loggedInPage }) => {
    // lang/dir are set by client JS in Meteor.startup (client/lib/i18n.js), after
    // the page commits, so poll rather than read once (same as 18-rtl-layout).
    await expect
      .poll(
        () => loggedInPage.evaluate(() => document.documentElement.getAttribute('lang')),
        { timeout: 15_000, message: 'html[lang] must be set for screen readers' },
      )
      .toMatch(/\S/);
    const dir = await loggedInPage.locator('html').getAttribute('dir');
    // dir is "ltr" for English, "rtl" for Arabic/Hebrew/etc.
    expect(['ltr', 'rtl']).toContain((dir || 'ltr').trim());
  });

  test('a skip-to-content link points at the main landmark', async ({ loggedInPage }) => {
    const skip = loggedInPage.locator('a.skip-link').first();
    await expect(skip).toHaveCount(1);
    await expect(skip).toHaveAttribute('href', '#content');

    // The main landmark exists and is the skip-link target.
    const main = loggedInPage.locator('#content[role="main"]');
    await expect(main).toHaveCount(1);

    // The skip link is visually hidden until it receives keyboard focus, after
    // which it must be on-screen (left >= 0 rather than the off-screen -9999px).
    await skip.focus();
    const left = await skip.evaluate(el => el.getBoundingClientRect().left);
    expect(left).toBeGreaterThanOrEqual(0);
  });

  test('the header exposes a navigation landmark with an accessible name', async ({ loggedInPage }) => {
    const nav = loggedInPage.locator('#header-quick-access[role="navigation"]');
    await expect(nav).toHaveCount(1);
    const label = await nav.getAttribute('aria-label');
    expect((label || '').trim().length).toBeGreaterThan(0);
  });

  test('a focused control receives a visible focus outline', async ({ loggedInPage }) => {
    const skip = loggedInPage.locator('a.skip-link').first();
    await skip.focus();
    const outlineWidth = await skip.evaluate(el => {
      const s = window.getComputedStyle(el);
      return parseFloat(s.outlineWidth) || 0;
    });
    expect(outlineWidth, 'focused element must show a visible outline (WCAG 2.4.7)').toBeGreaterThan(0);
  });

  test('the global search page is a labelled search landmark', async ({ loggedInPage }) => {
    await loggedInPage.goto('/global-search', { waitUntil: 'commit' });
    const form = loggedInPage.locator('form[role="search"]').first();
    await expect(form).toBeVisible({ timeout: 15_000 });

    const input = loggedInPage.locator('#global-search-input');
    await expect(input).toBeVisible();
    // The search field must be reachable by name (aria-label or associated label).
    const accessibleName = await input.evaluate(el => {
      const aria = el.getAttribute('aria-label');
      if (aria && aria.trim()) return aria.trim();
      if (el.id) {
        const lbl = document.querySelector(`label[for="${el.id}"]`);
        if (lbl && lbl.textContent.trim()) return lbl.textContent.trim();
      }
      return '';
    });
    expect(accessibleName.length).toBeGreaterThan(0);
  });

  test('an opened popup is a dialog whose close button has an accessible name', async ({ boardPage }) => {
    // Open any list menu — it renders the shared popup (popup.tpl.jade).
    await boardPage.locator('.js-open-list-menu').first().click();
    const popup = boardPage.locator('.js-pop-over');
    await expect(popup).toBeVisible({ timeout: 10_000 });

    // The popup container is exposed as a dialog with a label.
    await expect(popup).toHaveAttribute('role', 'dialog');
    const dialogLabel = await popup.getAttribute('aria-label');
    expect((dialogLabel || '').trim().length).toBeGreaterThan(0);

    // The icon-only close button must expose an accessible name.
    const closeBtn = popup.locator('.js-close-pop-over').first();
    await expect(closeBtn).toBeVisible();
    const closeLabel = await closeBtn.getAttribute('aria-label');
    expect((closeLabel || '').trim().length).toBeGreaterThan(0);
  });

  test('the my-cards page has no duplicate element ids', async ({ loggedInPage }) => {
    await loggedInPage.goto('/my-cards', { waitUntil: 'commit' });
    // Wait for the page to render something meaningful.
    await loggedInPage.locator('#content').waitFor({ timeout: 15_000 });

    const duplicates = await loggedInPage.evaluate(() => {
      const counts = {};
      for (const el of document.querySelectorAll('[id]')) {
        const id = el.id;
        if (!id) continue;
        counts[id] = (counts[id] || 0) + 1;
      }
      return Object.entries(counts)
        .filter(([, n]) => n > 1)
        .map(([id, n]) => `${id} (${n}x)`);
    });
    expect(duplicates, `duplicate ids break assistive-tech navigation: ${duplicates.join(', ')}`).toEqual([]);
  });
});
