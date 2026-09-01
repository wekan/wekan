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
const db = require('../helpers/db');
const { navigateInApp } = require('../helpers/auth');
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

  test('#914 Chinese uses its locale without a Japanese font fallback', async ({
    loggedInPage,
    user,
  }) => {
    db.updateOne('users', { _id: user.id }, {
      $set: { 'profile.language': 'zh-CN' },
    });
    await loggedInPage.reload({ waitUntil: 'commit' });

    await expect
      .poll(
        () => loggedInPage.evaluate(() => document.documentElement.lang),
        { timeout: 15_000, message: 'the selected Chinese locale must reach html[lang]' },
      )
      .toBe('zh-CN');

    const family = await loggedInPage.evaluate(
      () => window.getComputedStyle(document.body).fontFamily,
    );
    expect(family).toMatch(/Arial/);
    expect(family).not.toMatch(/Yu Gothic|Meiryo/i);
  });

  test('#4023 Japanese add-card controls do not split characters', async ({
    boardPage,
    board,
    user,
  }) => {
    db.updateOne('users', { _id: user.id }, {
      $set: { 'profile.language': 'ja' },
    });
    await boardPage.reload({ waitUntil: 'commit' });
    await expect
      .poll(
        () => boardPage.evaluate(() => document.documentElement.lang),
        { timeout: 15_000 },
      )
      .toMatch(/^ja(?:-|$)/i);

    const list = boardPage.locator(`#js-list-${board.listIds[0]}`);
    await list.locator('.js-add-card.list-header-plus-top').first().click();
    const controls = list.locator('.js-inlined-form .add-controls');
    await expect(controls.first()).toBeVisible();

    const submit = controls.locator('button[type="submit"]');
    await expect(submit).toHaveText('追加');
    await expect(submit).toHaveCSS('white-space', 'nowrap');
    await expect(controls.first()).toHaveCSS('word-break', 'keep-all');

    const link = controls.locator('.js-link');
    await expect(link).toHaveText('リンク');
    const measurements = await controls.locator('.quiet').evaluateAll(elements =>
      elements.map(element => {
        const style = getComputedStyle(element);
        return {
          height: element.getBoundingClientRect().height,
          lineHeight: parseFloat(style.lineHeight),
          whiteSpace: style.whiteSpace,
        };
      }),
    );
    expect(measurements.length).toBeGreaterThan(0);
    for (const value of measurements) {
      expect(value.whiteSpace).toBe('nowrap');
      expect(value.height).toBeLessThanOrEqual(value.lineHeight * 1.25);
    }
  });

  test('#697 a resumed iframe publishes a fresh viewport measurement', async ({
    loggedInPage,
  }) => {
    // Login itself focuses the page and may already have queued the shared
    // next-frame refresh. Measure a separate resume cycle after that settles.
    await loggedInPage.waitForTimeout(200);
    const resizeCount = await loggedInPage.evaluate(() => new Promise(resolve => {
      let count = 0;
      const countResize = event => {
        if (event.detail?.source === 'wekan-viewport-resume') count += 1;
      };
      window.addEventListener('resize', countResize);

      // Sandstorm restores a preserved grain as a page-show lifecycle event;
      // the app must translate that into the ordinary responsive resize path.
      window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true }));
      window.setTimeout(() => {
        window.removeEventListener('resize', countResize);
        resolve(count);
      }, 250);
    }));

    expect(resizeCount).toBeGreaterThan(0);
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
    await navigateInApp(loggedInPage, '/global-search');
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

    // Focus stays inside the dialog in both directions, then returns to the
    // opener when the dialog closes.
    const opener = boardPage.locator('.js-open-list-menu').first();
    const focusEdge = async edge => popup.evaluate((dialog, requestedEdge) => {
      const selector = [
        'a[href]', 'button:not([disabled])',
        'input:not([disabled]):not([type="hidden"])',
        'select:not([disabled])', 'textarea:not([disabled])',
        '[tabindex]:not([tabindex="-1"])',
      ].join(',');
      const controls = Array.from(dialog.querySelectorAll(selector))
        .filter(element => element.offsetParent !== null && !element.closest('.no-height'));
      controls[requestedEdge === 'first' ? 0 : controls.length - 1]?.focus();
      return controls.length;
    }, edge);
    expect(await focusEdge('last')).toBeGreaterThan(0);
    await boardPage.keyboard.press('Tab');
    await expect.poll(() => popup.evaluate(dialog => {
      const first = Array.from(dialog.querySelectorAll(
        'a[href],button:not([disabled]),input:not([disabled]):not([type="hidden"]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])',
      )).find(element => element.offsetParent !== null && !element.closest('.no-height'));
      return document.activeElement === first;
    })).toBe(true);
    await boardPage.keyboard.press('Shift+Tab');
    await expect.poll(() => popup.evaluate(dialog => {
      const controls = Array.from(dialog.querySelectorAll(
        'a[href],button:not([disabled]),input:not([disabled]):not([type="hidden"]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])',
      )).filter(element => element.offsetParent !== null && !element.closest('.no-height'));
      return document.activeElement === controls[controls.length - 1];
    })).toBe(true);
    await closeBtn.click();
    await expect(opener).toBeFocused();
  });

  test('rendered pages keep natural tab order and name visible controls', async ({ loggedInPage }) => {
    const routes = ['/my-cards', '/due-cards', '/global-search', '/public'];
    for (const route of routes) {
      await navigateInApp(loggedInPage, route);
      await loggedInPage.locator('#content').waitFor({ timeout: 15_000 });
      const audit = await loggedInPage.evaluate(() => {
        const visible = element => {
          const style = getComputedStyle(element);
          return style.display !== 'none' && style.visibility !== 'hidden' && element.getClientRects().length > 0;
        };
        const accessibleName = element => {
          const aria = element.getAttribute('aria-label');
          if (aria?.trim()) return aria.trim();
          const labelledBy = element.getAttribute('aria-labelledby');
          if (labelledBy) {
            const text = labelledBy.split(/\s+/).map(id => document.getElementById(id)?.textContent || '').join(' ').trim();
            if (text) return text;
          }
          if (element.id) {
            const label = document.querySelector(`label[for="${CSS.escape(element.id)}"]`);
            if (label?.textContent.trim()) return label.textContent.trim();
          }
          return (element.textContent || element.getAttribute('title') || element.getAttribute('alt') || '').trim();
        };
        const controls = Array.from(document.querySelectorAll(
          'a[href], button, input:not([type="hidden"]), select, textarea, [role="button"], [role="tab"], [role="checkbox"]',
        )).filter(visible).filter(element => !element.disabled);
        return {
          positiveTabindex: controls.filter(element => Number(element.getAttribute('tabindex')) > 0)
            .map(element => element.outerHTML.slice(0, 160)),
          unnamed: controls.filter(element => !accessibleName(element))
            .map(element => element.outerHTML.slice(0, 160)),
          imagesWithoutAlt: Array.from(document.querySelectorAll('img')).filter(visible)
            .filter(image => !image.hasAttribute('alt'))
            .map(image => image.outerHTML.slice(0, 160)),
        };
      });
      expect(audit.positiveTabindex, `${route} must follow DOM order`).toEqual([]);
      expect(audit.unnamed, `${route} has unnamed visible controls`).toEqual([]);
      expect(audit.imagesWithoutAlt, `${route} has images without alt`).toEqual([]);
    }
  });

  test('the my-cards page has no duplicate element ids', async ({ loggedInPage }) => {
    await navigateInApp(loggedInPage, '/my-cards');
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
