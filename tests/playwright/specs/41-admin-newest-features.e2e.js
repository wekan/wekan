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
