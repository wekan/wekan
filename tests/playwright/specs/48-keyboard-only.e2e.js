'use strict';

/**
 * Spec 48 - the main tasks with the keyboard alone, and three WCAG 2.2
 * criteria that automated rules do not check (TODO.md: "a keyboard-only walk
 * through the main tasks; 3.2.6 Consistent Help, 3.3.7 Redundant Entry and
 * 3.3.8 Accessible Authentication").
 *
 * - 3.3.8 Accessible Authentication: signing in asks for no cognitive test -
 *   no CAPTCHA, no puzzle - and lets a password manager fill and paste: the
 *   fields carry autocomplete="username" / "current-password" and a paste is
 *   not refused. The whole sign-in is done with Tab, typing and Enter.
 * - 2.1.1 Keyboard on a board: Tab reaches a card, Enter opens it, Escape
 *   closes it, and a new card is added from the keyboard.
 * - 3.2.6 Consistent Help: every Admin Panel pane puts its help button in the
 *   same place, right after the pane's title.
 * - 3.3.7 Redundant Entry: a list's Add Card carries its list and swimlane,
 *   so the next card asks for nothing already entered.
 */

const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const { loginWithToken, openBoard } = require('../helpers/auth');
const { ADMIN_PAGES, adminPath } = require('../../../models/lib/adminUrls');

// The same seeded password hash the WeLite helper signs in with.
const PASSWORD = 'test-password';
const PASSWORD_BCRYPT = '$2b$04$......................b8CYpLYfgS/XMWDCU3/.oCRJREnOf3y';

// Tab until the focused element matches, or fail after `max` presses.
async function tabTo(page, selector, max = 60) {
  for (let i = 0; i < max; i += 1) {
    if (await page.evaluate(sel => !!document.activeElement && document.activeElement.matches(sel), selector)) return;
    await page.keyboard.press('Tab');
  }
  throw new Error(`Tab never reached ${selector}`);
}

test.describe('keyboard only', () => {
  test.setTimeout(240_000);

  test('3.3.8: sign in with Tab, typing and Enter; no puzzle, and a password manager may fill and paste', async ({ page, user }) => {
    db.updateOne('users', { _id: user.id }, { $set: { 'services.password.bcrypt': PASSWORD_BCRYPT } });
    await page.goto('/sign-in', { waitUntil: 'load' });
    const name = page.locator('#at-field-username_and_email, #at-field-username, #at-field-email').first();
    const password = page.locator('#at-field-password');
    await expect(password).toBeVisible({ timeout: 30_000 });
    expect(await name.getAttribute('autocomplete')).toBe('username');
    expect(await password.getAttribute('autocomplete')).toBe('current-password');
    // No CAPTCHA or other cognitive function test on the form.
    expect(await page.locator('iframe[src*="captcha"], .g-recaptcha, .h-captcha, [class*="captcha" i]').count()).toBe(0);
    // A paste into the password field is not refused.
    const refused = await password.evaluate(el => {
      const ev = new Event('paste', { bubbles: true, cancelable: true });
      return !el.dispatchEvent(ev);
    });
    expect(refused, 'paste is not prevented').toBe(false);

    await page.locator('body').focus();
    await tabTo(page, '#at-field-username_and_email, #at-field-username, #at-field-email');
    await page.keyboard.type(user.username);
    await tabTo(page, '#at-field-password', 5);
    await page.keyboard.type(PASSWORD);
    await page.keyboard.press('Enter');
    await expect(page).not.toHaveURL(/sign-in/, { timeout: 30_000 });
  });

  test('2.1.1 and 3.3.7: on a board, Tab reaches a card, Enter opens it, Escape closes it, and cards are added from the keyboard', async ({ boardPage, board }) => {
    const page = boardPage;
    await page.locator('body').focus();
    // The card is a link wrapping the minicard (listBody.jade a.minicard-wrapper).
    await tabTo(page, 'a.minicard-wrapper', 200);
    // Focus is visible where it is (2.4.7).
    const outline = await page.evaluate(() => {
      const cs = getComputedStyle(document.activeElement);
      return cs.outlineStyle !== 'none' || cs.boxShadow !== 'none';
    });
    expect(outline, 'the focused card shows focus').toBe(true);
    await page.keyboard.press('Enter');
    await expect(page.locator('.card-details').first()).toBeVisible({ timeout: 15_000 });
    await page.keyboard.press('Escape');
    await expect(page.locator('.card-details')).toHaveCount(0, { timeout: 15_000 });

    // Add two cards to the first list with the keyboard alone.
    await page.locator('body').focus();
    await tabTo(page, '.js-card-composer, .open-minicard-composer', 300);
    await page.keyboard.press('Enter');
    const composer = page.locator('textarea.js-card-title, .minicard-composer textarea').first();
    await expect(composer).toBeFocused({ timeout: 15_000 });
    await page.keyboard.type('Keyboard one');
    // Ctrl+Enter saves; plain Enter is a new line in the title (#4236, unless
    // Member Settings turns on submit on Enter).
    await page.keyboard.press('Control+Enter');
    // The form closes after a card (#6827, unless Member Settings keeps it
    // open). 3.3.7: the list's own Add Card carries the list and swimlane, so
    // the next card asks for nothing already entered.
    await expect.poll(() => db.countDocuments('cards', { boardId: board.boardId, title: 'Keyboard one' }),
      { timeout: 15_000 }).toBe(1);
    await page.locator('body').focus();
    await tabTo(page, '.js-card-composer, .open-minicard-composer', 300);
    await page.keyboard.press('Enter');
    await expect(composer).toBeFocused({ timeout: 15_000 });
    await page.keyboard.type('Keyboard two');
    await page.keyboard.press('Control+Enter');
    await page.keyboard.press('Escape');
    await expect.poll(() => db.countDocuments('cards', { boardId: board.boardId, title: { $in: ['Keyboard one', 'Keyboard two'] } }),
      { timeout: 15_000 }).toBe(2);
    const [one, two] = ['Keyboard one', 'Keyboard two'].map(title => db.findOne('cards', { boardId: board.boardId, title }));
    expect([two.listId, two.swimlaneId]).toEqual([one.listId, one.swimlaneId]);
  });

  test('3.2.6: every Admin Panel pane puts its help button right after its title', async ({ page, adminUser }) => {
    await loginWithToken(page, adminUser.id, adminUser.token);
    const panes = Object.entries(ADMIN_PAGES).flatMap(([p, cfg]) => Object.keys(cfg.panes).map(slug => adminPath(p, slug)));
    const misplaced = [];
    let withHelp = 0;
    for (const url of panes) {
      await page.goto(url, { waitUntil: 'load' });
      await page.waitForTimeout(800);
      const where = await page.evaluate(() => {
        const btn = document.querySelector('.setting-content .js-open-feature-help, .content-title .js-open-feature-help, .js-open-feature-help');
        if (!btn) return null;
        const title = btn.closest('h1, h2, .content-title, .setting-title, .pane-title') || btn.previousElementSibling;
        if (!title) return 'no title beside it';
        const b = btn.getBoundingClientRect();
        const t = title.getBoundingClientRect();
        // On the title's line, to its right.
        return (b.top < t.bottom && b.bottom > t.top && b.left >= t.left) ? 'ok' : `at ${Math.round(b.left)},${Math.round(b.top)}`;
      });
      if (where === null) continue;
      withHelp += 1;
      if (where !== 'ok') misplaced.push(`${url}: ${where}`);
    }
    expect(withHelp, 'panes with a help button').toBeGreaterThan(10);
    expect(misplaced, misplaced.join('\n')).toEqual([]);
  });
});
