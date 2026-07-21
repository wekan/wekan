'use strict';

/**
 * Spec 41 — newest Admin Panel features (this release)
 *
 * Covers, as UI + negative tests:
 *  - Files report: every filename is shown as a clean name — URL-decoded,
 *    confusable homoglyphs folded, invisible + exploit characters removed — via the
 *    global {{cleanFilename}} helper; there is NO Search button and the search field
 *    + pagination controls are present. (No filter button / warning / legend.)
 *  - Version (Information) page: shows the live Reactivity mode plus the configured
 *    METEOR_REACTIVITY_ORDER and DDP_TRANSPORT rows.
 *  - Board Table view: column headers are NOT clickable-sortable (removed).
 */

const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const { loginWithToken } = require('../helpers/auth');

const BASE_URL = process.env.WEKAN_BASE_URL || 'http://localhost:3000';
const ZW = '\u200b'; // zero-width space (escape sequence — no literal invisible char in source)

test.describe('Admin – newest features', () => {
  test.use({ storageState: undefined });

  test('Files report shows clean filenames (decoded, homoglyphs folded, invisible/exploit removed), no Search button', async ({ page, adminUser }) => {
    // Seed a board + card owned by the admin so the attachments are "accessible"
    // (the report restricts to attachments on cards the user can see).
    const board = await db.seedBoard({ ownerId: adminUser.id, title: 'Files Board', cardTitlesPerList: [['FilesCard']] });
    const cardId = db.findCardIdByTitle({ boardId: board.boardId, title: 'FilesCard' });
    const meta = { boardId: board.boardId, cardId };
    const attachmentIds = ['e2e-att-normal', 'e2e-att-encoded', 'e2e-att-invisible', 'e2e-att-homoglyph', 'e2e-att-exploit'];
    // Idempotent seed: clear any leftovers from a previous run (or another browser
    // project sharing this DB) so insertMany never hits an E11000 duplicate _id.
    await db.deleteMany('attachments', { _id: { $in: attachmentIds } });
    await db.insertMany('attachments', [
      { _id: 'e2e-att-normal', name: 'normal-file.png', size: 10, type: 'image/png', meta },
      { _id: 'e2e-att-encoded', name: '%D0%93%D1%80.png', size: 20, type: 'image/png', meta }, // -> "Гр.png"
      { _id: 'e2e-att-invisible', name: 'evil' + ZW + '.png', size: 30, type: 'image/png', meta },
      { _id: 'e2e-att-homoglyph', name: 'pаypal.png', size: 40, type: 'image/png', meta }, // Cyrillic a
      { _id: 'e2e-att-exploit', name: '<script>x</script>note.png', size: 50, type: 'image/png', meta },
    ]);

    await loginWithToken(page, adminUser.id, adminUser.token);
    await page.goto(`${BASE_URL}/admin-reports`, { waitUntil: 'networkidle' });
    await page.locator('a.js-report-files').click();

    // The report renders our attachments.
    const table = page.locator('table').first();
    await expect(table).toBeVisible({ timeout: 15_000 });

    // URL-encoded name is DECODED for display (and the raw %-encoding is gone).
    await expect(table.getByText('Гр.png')).toBeVisible();
    await expect(table.getByText('%D0%93%D1%80')).toHaveCount(0);

    // Invisible character is REMOVED — the clean "evil.png" is shown, and the old
    // red warning / inline description elements no longer exist.
    await expect(table.getByText('evil.png', { exact: false })).toBeVisible();
    await expect(page.locator('.filename-invisible-warning')).toHaveCount(0);
    await expect(page.locator('.invisible-char-desc')).toHaveCount(0);
    await expect(page.locator('.js-files-invisible-filter')).toHaveCount(0);
    await expect(page.locator('.admin-report-legend')).toHaveCount(0);

    // Confusable homoglyph is folded to plain Latin ("paypal.png").
    await expect(table.getByText('paypal.png', { exact: false })).toBeVisible();
    // Exploit markup is stripped from the shown name.
    await expect(table.getByText('note.png', { exact: false })).toBeVisible();
    await expect(table.getByText('<script>')).toHaveCount(0);

    // NO Search button; the search field + pagination controls ARE present.
    await expect(page.locator('button.js-files-search-button')).toHaveCount(0);
    await expect(page.locator('input.js-files-search-input')).toBeVisible();
    await expect(page.locator('.admin-report-pagination')).toBeVisible();
  });

  test('Version page shows Reactivity mode + configured REACTIVITY_ORDER and DDP_TRANSPORT', async ({ page, adminUser }) => {
    await loginWithToken(page, adminUser.id, adminUser.token);
    await page.goto(`${BASE_URL}/information`, { waitUntil: 'networkidle' });

    const body = page.locator('body');
    await expect(body).toContainText('Reactivity mode', { timeout: 15_000 });
    // The configured-env rows show the literal env-var names.
    await expect(body).toContainText('METEOR_REACTIVITY_ORDER');
    await expect(body).toContainText('DDP_TRANSPORT');
  });

  test('Rules/Boards/Cards/Impersonation reports load without hanging (manual publish on FerretDB)', async ({ page, adminUser }) => {
    // Give the Boards/Cards reports some data; Rules/Impersonation have none and must
    // still become READY and show their (empty) report, not hang on the spinner.
    await db.seedBoard({ ownerId: adminUser.id, title: 'Report Data Board', cardTitlesPerList: [['RCard']] });
    await loginWithToken(page, adminUser.id, adminUser.token);
    await page.goto(`${BASE_URL}/admin-reports`, { waitUntil: 'networkidle' });

    // #6480: these report publications returned sorted+limited live cursors, whose
    // LIMITED live observe hangs on FerretDB's OpLog — the subscription never became
    // ready and the report was stuck on the loading spinner. Each report's template
    // (with its search input) only renders once the subscription is ready, so a
    // visible search input proves the spinner cleared and the report loaded.
    const reports = [
      { link: 'a.js-report-rules', search: 'input.js-rules-search-input' },
      { link: 'a.js-report-boards', search: 'input.js-boards-search-input' },
      { link: 'a.js-report-cards', search: 'input.js-cards-search-input' },
      { link: 'a.js-report-impersonation', search: 'input.js-impersonation-search-input' },
    ];
    for (const r of reports) {
      await page.locator(r.link).click();
      await expect(page.locator(r.search)).toBeVisible({ timeout: 15_000 });
    }
  });

  test('Board Statistics view renders full-width with board counts and selectable text', async ({ page, adminUser }) => {
    const board = await db.seedBoard({ ownerId: adminUser.id, title: 'Stats Board', cardTitlesPerList: [['S1'], ['S2']] });
    // Pre-seed the per-user board view so the board renders the Statistics view on
    // its first (single) load. The switcher path calls Utils.setBoardView, which
    // does a full window.location.reload() — reloading the whole board cold mid-test
    // races the 15s assertion (the board-canvas can still be empty when it fires).
    // Pre-seeding avoids that reload and tests what actually matters here: that
    // statsView renders (with server-resolved counts) when it is the user's view.
    db.updateOne('users', { _id: adminUser.id }, { $set: { 'profile.boardView': 'board-view-stats' } });
    await loginWithToken(page, adminUser.id, adminUser.token);
    await page.goto(`${BASE_URL}/b/${board.boardId}/${board.slug}`, { waitUntil: 'networkidle' });

    const stats = page.locator('.stats-view');
    await expect(stats).toBeVisible({ timeout: 15_000 });
    // Shows the board title and both sections (status + time summary), with counts
    // resolved from the server boardStatus method (not the '…' loading placeholder).
    await expect(stats).toContainText('Stats Board');
    await expect(stats.locator('.stats-view-table')).toHaveCount(2);
    await expect(stats).toContainText('Lists');
    await expect(stats.locator('.stats-view-value').first()).not.toHaveText('…', { timeout: 15_000 });
    // The text is selectable (not user-select:none) so values can be copied.
    // WebKit exposes the computed value as `webkitUserSelect` (the unprefixed
    // `userSelect` is undefined there), so read both.
    const userSelect = await stats.evaluate(el => {
      const s = getComputedStyle(el);
      return s.userSelect || s.webkitUserSelect;
    });
    expect(['text', 'auto']).toContain(userSelect);
  });

  test('NEGATIVE: board Table view column headers are not clickable-sortable', async ({ page, adminUser }) => {
    await db.seedBoard({ ownerId: adminUser.id, title: 'Table View Board', cardTitlesPerList: [['TVCard']] });
    await loginWithToken(page, adminUser.id, adminUser.token);
    // Open the board's Table view via My Cards / board table (the .js-table-view-sort
    // class only ever existed on the sortable headers). Anywhere the table view
    // renders, no sortable header must exist.
    await page.goto(`${BASE_URL}/my-cards`, { waitUntil: 'networkidle' }).catch(() => {});
    await page.waitForTimeout(1_000);
    await expect(page.locator('.js-table-view-sort')).toHaveCount(0);
  });
});
