'use strict';

/**
 * Spec 45 - axe-core scan of the pages, in the default theme.
 *
 * docs/Features/General/Accessibility/Audit.md records an automated audit that
 * found colour contrast, Label in Name, unlabelled fields, a button holding
 * controls, and missing landmarks and headings. They are fixed, and this spec
 * keeps them fixed: every page below must have NO violation of the WCAG 2.0 and
 * 2.1 A and AA rules or of axe's best-practice rules.
 *
 * Automated rules cover only part of WCAG; passing this is a floor, not a
 * conformance claim.
 */

const { test, expect } = require('../fixtures');
const axe = require('axe-core');

const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'];

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

  test('the signed-out pages: sign in and register', async ({ page }) => {
    for (const url of ['/sign-in', '/sign-up']) {
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
    for (const url of ['/setting', '/information', '/translation']) {
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
});
