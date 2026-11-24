'use strict';

/**
 * Spec 45 - axe-core scan of the pages, in the default theme.
 *
 * docs/Features/Accessibility/Audit.md records an automated audit that
 * found colour contrast, Label in Name, unlabelled fields, a button holding
 * controls, and missing landmarks and headings. They are fixed, and this spec
 * keeps them fixed: every page below must have NO violation of the WCAG 2.0,
 * 2.1 and 2.2 A and AA rules or of axe's best-practice rules (2.2 since WP-13,
 * docs/Compliance/README.md: its axe rule is target-size, 2.5.8).
 *
 * Automated rules cover only part of WCAG; passing this is a floor, not a
 * conformance claim.
 */

const { test, expect } = require('../fixtures');
const axe = require('axe-core');

const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'];

async function scan(page) {
  // Settle: the header and the page's own subscription data arrive after load.
  await page.waitForTimeout(2500);
  await page.evaluate(source => { if (!window.axe) (0, eval)(source); }, axe.source);
  return page.evaluate(async tags => {
    const result = await window.axe.run(document, { runOnly: { type: 'tag', values: tags }, resultTypes: ['violations'] });
    return result.violations.map(v => ({
      id: v.id,
      impact: v.impact,
      nodes: v.nodes.slice(0, 5).map(n => n.target.join(' ')),
      count: v.nodes.length,
    }));
  }, TAGS);
}

function describe(violations) {
  return violations.map(v => `${v.id} (${v.impact}, ${v.count}): ${v.nodes.join(' | ')}`).join('\n');
}

test.describe('axe-core: no violations in the default theme', () => {
  test.setTimeout(180_000);

  test('the signed-out pages: sign in, register and the legal pages', async ({ page }) => {
    for (const url of ['/sign-in', '/sign-up', '/privacy', '/imprint']) {
      await page.goto(url, { waitUntil: 'load' });
      const violations = await scan(page);
      expect(violations, `${url}\n${describe(violations)}`).toEqual([]);
    }
  });

  test('every page of the signed-in user', async ({ loggedInPage }) => {
    const pages = [
      '/', '/templates', '/remaining', '/archive', '/public', '/activity', '/support', '/shortcuts',
      '/my-cards', '/due-cards', '/my-attachments', '/starred-items', '/global-search', '/bookmarks',
      '/import', '/accessibility',
    ];
    for (const url of pages) {
      await loggedInPage.goto(url, { waitUntil: 'load' });
      const violations = await scan(loggedInPage);
      expect(violations, `${url}\n${describe(violations)}`).toEqual([]);
    }
  });

  test('the Admin Panel', async ({ page, adminUser }) => {
    const { loginWithToken } = require('../helpers/auth');
    await loginWithToken(page, adminUser.id, adminUser.token);
    for (const url of ['/setting', '/information', '/translation', '/admin/problems/compliance', '/admin/people/audit-log', '/admin/settings/privacy']) {
      await page.goto(url, { waitUntil: 'load' });
      const violations = await scan(page);
      expect(violations, `${url}\n${describe(violations)}`).toEqual([]);
    }
  });

  test('a board, and a card opened on it', async ({ boardPage }) => {
    let violations = await scan(boardPage);
    expect(violations, `board\n${describe(violations)}`).toEqual([]);
    await boardPage.locator('.minicard').first().click();
    violations = await scan(boardPage);
    expect(violations, `card details\n${describe(violations)}`).toEqual([]);
    // The section headings are real buttons in real headings: Enter and Space fold
    // a section, and the button says whether it is open.
    const toggle = boardPage.locator('h3.js-toggle-card-section[data-section="labels"] .card-details-section-toggle');
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await toggle.focus();
    await boardPage.keyboard.press('Enter');
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await boardPage.keyboard.press('Space');
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  });

  // WCAG 2.2, 2.4.11 Focus Not Obscured (Minimum), which axe has no rule for:
  // tabbing through a board, each control that takes focus is not hidden
  // behind the header, a sticky bar or a popup - the element at the middle of
  // its box is the control itself (or something inside it).
  test('keyboard focus is never hidden behind the header or a popup', async ({ boardPage }) => {
    await boardPage.waitForTimeout(1500);
    const hidden = [];
    let focused = 0;
    for (let i = 0; i < 25; i += 1) {
      await boardPage.keyboard.press('Tab');
      const result = await boardPage.evaluate(() => {
        const el = document.activeElement;
        if (!el || el === document.body) return null;
        const r = el.getBoundingClientRect();
        if (!r.width || !r.height) return null;
        window.__wekanFocused = (window.__wekanFocused || 0) + 1;
        if (r.bottom < 0 || r.top > innerHeight || r.right < 0 || r.left > innerWidth) return null;
        const x = Math.min(Math.max(r.left + r.width / 2, 0), innerWidth - 1);
        const y = Math.min(Math.max(r.top + r.height / 2, 0), innerHeight - 1);
        const top = document.elementFromPoint(x, y);
        const ok = !top || top === el || el.contains(top) || top.contains(el);
        return ok ? null : `${el.tagName.toLowerCase()}.${String(el.className).split(' ').join('.')} under ${top.tagName.toLowerCase()}.${String(top.className).split(' ').join('.')}`;
      });
      if (result) hidden.push(result);
    }
    focused = await boardPage.evaluate(() => window.__wekanFocused || 0);
    expect(focused, 'the scan only means something if focus really moved').toBeGreaterThan(5);
    expect(hidden, hidden.join('\n')).toEqual([]);
  });
});
