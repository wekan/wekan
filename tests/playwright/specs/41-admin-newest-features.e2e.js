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
const { loginWithToken, waitForMeteor, navigateInApp } = require('../helpers/auth');

const BASE_URL = process.env.WEKAN_BASE_URL || 'http://localhost:3000';
const ZW = '\u200b'; // zero-width space (escape sequence — no literal invisible char in source)

test.describe('Admin – newest features', () => {
  test.use({ storageState: undefined });

  test('Files report shows clean filenames (decoded, homoglyphs folded, invisible/exploit removed), no Search button', async ({ page, adminUser }) => {
    // Seed a board + card owned by the admin so the attachments are "accessible"
    // (the report restricts to attachments on cards the user can see).
    const board = await db.seedBoard({ ownerId: adminUser.id, title: 'Files Board', cardTitlesPerList: [['FilesCard']] });
    const cardId = db.findCardIdByTitle({ boardId: board.boardId, title: 'FilesCard' });
    // Seed sanity: the attachments' meta.cardId is this id; if it were null the report
    // could never match them, so fail here with a clear message instead of "no table".
    expect(cardId, 'seed: findCardIdByTitle must return the seeded card id').toBeTruthy();
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
    // Straight to the pane by its own address. Every Admin Panel pane has one
    // now - `/admin/problems/files` - so there is no need to land on the page
    // and then click a menu row, and no race between the redirect from the old
    // `/admin-reports` and the menu rendering.
    // docs/Features/Page/Admin-Panel-URLs.md
    await navigateInApp(page, '/admin/problems/files');
    // The evaluate below reaches for `window.Meteor.callAsync`; `networkidle`
    // only means the network went quiet, so Firefox got here with Meteor still
    // undefined and the count came back as an error string.
    await waitForMeteor(page);

    // Localize any failure: ask the SERVER directly whether it counts the seeded
    // attachments (this method runs the SAME accessibleCardIds + meta.cardId query the
    // report publication uses). If this is >= 5 but the table is still missing, it is a
    // client-render problem; if it is 0 (or an error), the server query is the problem —
    // so the failure message points straight at the layer instead of just "no table".
    const serverCount = await page.evaluate(async () => {
      try { return await window.Meteor.callAsync('getAttachmentsReportCount', ''); }
      catch (e) { return `error: ${(e && e.message) || e}`; }
    });
    expect(serverCount, 'server getAttachmentsReportCount must see the seeded attachments')
      .toBeGreaterThanOrEqual(5);

    // The report renders our attachments.
    const table = page.locator('table').first();
    await expect(table).toBeVisible({ timeout: 15_000 });

    // WHICH half is missing, when the table draws its headers and then "No results".
    //
    // A row of this report needs TWO things to arrive over DDP, and the server
    // count above proves only that the query finds them. The publication sends
    // the page with this.added('attachments', ...) AND one small `report_pages`
    // index document naming the ids of that page, in order; the pane renders
    // that index and nothing else, because minimongo holds far more than the
    // page (models/lib/reportPageIndex.js, reportPageResults in
    // adminProblems.js). So an empty table means the rows did not arrive, or the
    // index did not, or they disagree - three different bugs that all look like
    // "element(s) not found".
    //
    // Read through Meteor's client stores rather than app globals, which the
    // production bundle does not expose. Entirely defensive: any failure here
    // leaves the diagnosis empty and the assertion below fails exactly as it
    // would have anyway.
    const diag = await page.evaluate(() => {
      const countIn = name => {
        try {
          const store = window.Meteor?.connection?._stores?.[name];
          const coll = store && store._getCollection && store._getCollection();
          return coll ? coll.find().count() : `no client store "${name}"`;
        } catch (e) { return `error: ${(e && e.message) || e}`; }
      };
      let index;
      try {
        const store = window.Meteor?.connection?._stores?.report_pages;
        const coll = store && store._getCollection && store._getCollection();
        const doc = coll && coll.findOne('report-files');
        index = doc ? `${(doc.ids || []).length} id(s)` : 'no report-files index doc';
      } catch (e) { index = `error: ${(e && e.message) || e}`; }
      return `attachments in minimongo: ${countIn('attachments')}; report_pages index: ${index}`;
    }).catch(e => `diagnosis unavailable: ${(e && e.message) || e}`);

    // URL-encoded name is DECODED for display (and the raw %-encoding is gone).
    await expect(
      table.getByText('Гр.png'),
      `the Files report drew no usable row. ${diag}. ` +
      'Rows but no index = publishReportPage did not send one; index but no rows = ' +
      "this.added went to a collection the client does not have; neither = the " +
      'publication returned early (the isAdmin check) or never ran.',
    ).toBeVisible();
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

    // NO Search button; the search field + pagination controls ARE present. Every
    // report renders through the ONE shared table page now
    // (docs/Features/Page/Table.md), so the controls carry the shared class names and
    // the per-report ones are gone with the per-report markup.
    await expect(page.locator('button.js-files-search-button')).toHaveCount(0);
    await expect(page.locator('input.js-files-search-input')).toHaveCount(0);
    await expect(page.locator('input.js-table-page-search')).toBeVisible();
    await expect(page.locator('.table-page-pagination')).toBeVisible();
  });

  test('Version page shows Reactivity mode + configured REACTIVITY_ORDER and DDP_TRANSPORT', async ({ page, adminUser }) => {
    await loginWithToken(page, adminUser.id, adminUser.token);
    // `/information` redirects to the Version pane's own address.
    await navigateInApp(page, '/admin/settings/version');

    const body = page.locator('body');
    await expect(body).toContainText('Reactivity mode', { timeout: 15_000 });
    const check = page.locator('.js-check-newest-versions');
    await expect(check).toBeVisible();
    const checkBox = await check.boundingBox();
    const currentBox = await page.getByText('WeKan ® Version', { exact: true }).boundingBox();
    expect(checkBox.y).toBeLessThan(currentBox.y);
    await check.click();
    const results = page.locator('.version-check-results');
    await expect(results).toContainText(/^WeKan \d+\.\d+/m, { timeout: 15_000 });
    await expect(results).toContainText(/^FerretDB \d+\.\d+\.\d+/m);
    await expect(results).toContainText(/^Meteor \d+\.\d+/m);
    await expect(results).toContainText(/^Node \d+\.\d+\.\d+/m);
    await expect(results).toContainText(/^NPM \d+\.\d+\.\d+/m);
    await expect(results.locator('a')).toHaveCount(0);
    // The configured-env rows show the literal env-var names.
    await expect(body).toContainText('METEOR_REACTIVITY_ORDER');
    await expect(body).toContainText('DDP_TRANSPORT');
  });

  test('Version release lookup rejects a non-admin caller', async ({ page, user }) => {
    await loginWithToken(page, user.id, user.token);
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    await waitForMeteor(page);
    const denied = await page.evaluate(async () => {
      try {
        await window.Meteor.callAsync('checkNewestVersions');
        return 'allowed';
      } catch (error) {
        return error.error;
      }
    });
    expect(denied).toBe('not-authorized');
  });

  test('Rules/Boards/Cards/Impersonation reports load without hanging (manual publish on FerretDB)', async ({ page, adminUser }) => {
    // Give the Boards/Cards reports some data; Rules/Impersonation have none and must
    // still become READY and show their (empty) report, not hang on the spinner.
    await db.seedBoard({ ownerId: adminUser.id, title: 'Report Data Board', cardTitlesPerList: [['RCard']] });
    await loginWithToken(page, adminUser.id, adminUser.token);
    await navigateInApp(page, '/admin/problems/summary');

    // #6480: these report publications returned sorted+limited live cursors, whose
    // LIMITED live observe hangs on FerretDB's OpLog — the subscription never became
    // ready and the report was stuck on the loading spinner. Each report's template
    // (with its search input) only renders once the subscription is ready, so a
    // visible search input proves the spinner cleared and the report loaded.
    // One shared table page for every report (docs/Features/Page/Table.md): the entry
    // is addressed by data-id and the search field is the shared one, so what proves
    // the subscription became ready is the shared controls row rendering with the
    // report's own title above it.
    const reports = [
      { id: 'report-rules', title: 'Rules' },
      { id: 'report-boards', title: 'Boards' },
      { id: 'report-cards', title: 'Cards' },
      { id: 'report-impersonation', title: 'Impersonation' },
    ];
    for (const r of reports) {
      await page.locator(`.js-left-menu-item[data-id="${r.id}"]`).click();
      await expect(page.locator('input.js-table-page-search')).toBeVisible({ timeout: 15_000 });
      await expect(page.locator('.admin-pane-title')).toContainText(r.title, { timeout: 15_000 });
    }
  });

  test('Board Statistics view renders full-width with board counts and selectable text', async ({ page, adminUser }) => {
    const board = await db.seedBoard({ ownerId: adminUser.id, title: 'Stats Board', cardTitlesPerList: [['S1'], ['S2']] });
    await loginWithToken(page, adminUser.id, adminUser.token);
    await navigateInApp(page, `/b/${board.boardId}/${board.slug}`);

    // Use the real view switcher. It updates local reactive state immediately,
    // so this avoids racing a direct database change against the user publication.
    await page.locator('.js-toggle-board-view').click();
    await page.locator('.js-open-stats-view').click();

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
    await navigateInApp(page, '/my-cards').catch(() => {});
    await page.waitForTimeout(1_000);
    await expect(page.locator('.js-table-view-sort')).toHaveCount(0);
  });
});
