'use strict';

/**
 * Spec 26 — Admin Panel → People → "Shared templates" tab (feature #3313)
 *
 * The Templates tab lets an admin browse users' shareable template boards,
 * grouped by Organization / Team / email Domain. The three checkboxes are LIVE
 * view filters (default unchecked); checking one shows that grouping. Only users
 * whose Templates board is NON-EMPTY are listed.
 *
 * Covers:
 *  - The Templates tab is reachable from the People side-menu; its three
 *    checkboxes are unchecked by default and nothing is shown initially.
 *  - Checking "Organizations" shows the same-org users' template boards by name,
 *    and does NOT show the user whose Templates board is empty.
 *  - Checking "Teams" and "Domains" group correctly.
 *  - Unchecking a scope hides its results again.
 */

const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const { loginWithToken } = require('../helpers/auth');

const BASE_URL = process.env.WEKAN_BASE_URL || 'http://localhost:3000';

test.describe('Admin – shared templates', () => {
  test.use({ storageState: undefined });

  // Shared scope/group identifiers for the seeded users. Every value carries a
  // random per-run token: the parallel run launches Chromium/Firefox/WebKit as
  // separate processes against ONE server+DB, so a fixed email domain collided
  // on the unique emails.address index (E11000) and identical template titles /
  // group names bled between processes' admin views. Unique-per-run keeps each
  // browser's fixtures isolated.
  const RUN = db.uid('run');
  const ORG = { orgId: `e2e_org_${RUN}`, orgDisplayName: `Acme Org ${RUN}` };
  const TEAM = { teamId: `e2e_team_${RUN}`, teamDisplayName: `Rocket Team ${RUN}` };
  const DOMAIN = `${RUN}.acme-e2e.invalid`;
  const TPL = {
    alpha: `Alpha Template Board ${RUN}`,
    beta: `Beta Template Board ${RUN}`,
    gamma: `Gamma Template Board ${RUN}`,
  };

  let userA;
  let userB;
  let userEmpty;

  test.beforeAll(() => {
    // Two users sharing the SAME org, team and email domain, each with a
    // NON-EMPTY Templates board.
    userA = db.seedUser();
    userB = db.seedUser();
    // A third user with an EMPTY Templates board (must be excluded).
    userEmpty = db.seedUser();

    db.setUserGroups({ userId: userA.id, orgs: [ORG], teams: [TEAM], email: `usera@${DOMAIN}` });
    db.setUserGroups({ userId: userB.id, orgs: [ORG], teams: [TEAM], email: `userb@${DOMAIN}` });
    db.setUserGroups({ userId: userEmpty.id, orgs: [ORG], teams: [TEAM], email: `empty@${DOMAIN}` });

    db.seedTemplatesBoard({ ownerId: userA.id, templateTitles: [TPL.alpha] });
    db.seedTemplatesBoard({ ownerId: userB.id, templateTitles: [TPL.beta, TPL.gamma] });
    // Empty Templates board (no shared template boards).
    db.seedTemplatesBoard({ ownerId: userEmpty.id, templateTitles: [] });
  });

  test.afterAll(() => {
    db.cleanup({ userIds: [userA.id, userB.id, userEmpty.id] });
  });

  async function openTemplatesTab(page) {
    await page.goto(`${BASE_URL}/people`, { waitUntil: 'networkidle' });
    await page.locator('.js-templates-menu').waitFor({ timeout: 15_000 });
    await page.locator('.js-templates-menu').click();
    // templatesGeneral renders its three scope checkboxes.
    await page.locator('#templates-setting').waitFor({ timeout: 15_000 });
  }

  function scopeCheckbox(page, scope) {
    return page.locator(`a.js-toggle-template-scope[data-scope="${scope}"] .materialCheckBox`);
  }

  test('Templates tab is reachable; checkboxes unchecked by default; nothing shown', async ({ page, adminUser }) => {
    await loginWithToken(page, adminUser.id, adminUser.token);
    await openTemplatesTab(page);

    // Three scope rows present.
    await expect(page.locator('a.js-toggle-template-scope')).toHaveCount(3);

    // None checked by default.
    for (const scope of ['organizations', 'teams', 'domains']) {
      await expect(scopeCheckbox(page, scope)).not.toHaveClass(/is-checked/);
    }

    // No shared templates listed yet — the hint is shown, no template names.
    await expect(page.locator('.shared-templates-hint')).toBeVisible();
    await expect(page.locator('a.js-shared-template-link')).toHaveCount(0);
  });

  test('checking Organizations groups same-org users and excludes the empty one', async ({ page, adminUser }) => {
    await loginWithToken(page, adminUser.id, adminUser.token);
    await openTemplatesTab(page);

    await page.locator('a.js-toggle-template-scope[data-scope="organizations"]').click();
    await expect(scopeCheckbox(page, 'organizations')).toHaveClass(/is-checked/);

    // The org group header appears.
    await expect(page.locator('.shared-templates-group h5', { hasText: ORG.orgDisplayName })).toBeVisible();

    // Non-empty users' template boards appear by name.
    await expect(page.locator('a.js-shared-template-link', { hasText: TPL.alpha })).toBeVisible();
    await expect(page.locator('a.js-shared-template-link', { hasText: TPL.beta })).toBeVisible();
    await expect(page.locator('a.js-shared-template-link', { hasText: TPL.gamma })).toBeVisible();

    // The empty user must NOT be listed.
    await expect(page.locator('.shared-templates-user', { hasText: userEmpty.username })).toHaveCount(0);

    // Links point at the template boards.
    const href = await page.locator('a.js-shared-template-link', { hasText: TPL.alpha }).getAttribute('href');
    expect(href).toMatch(/^\/b\//);

    // Screenshot for visual verification of grouped shared templates.
    await page.screenshot({ path: 'test-results/shared-templates-organizations.png', fullPage: true });
  });

  test('checking Teams groups same-team users', async ({ page, adminUser }) => {
    await loginWithToken(page, adminUser.id, adminUser.token);
    await openTemplatesTab(page);

    await page.locator('a.js-toggle-template-scope[data-scope="teams"]').click();
    await expect(scopeCheckbox(page, 'teams')).toHaveClass(/is-checked/);

    await expect(page.locator('.shared-templates-group h5', { hasText: TEAM.teamDisplayName })).toBeVisible();
    await expect(page.locator('a.js-shared-template-link', { hasText: TPL.alpha })).toBeVisible();
    await expect(page.locator('a.js-shared-template-link', { hasText: TPL.beta })).toBeVisible();
  });

  test('checking Domains groups by email domain', async ({ page, adminUser }) => {
    await loginWithToken(page, adminUser.id, adminUser.token);
    await openTemplatesTab(page);

    await page.locator('a.js-toggle-template-scope[data-scope="domains"]').click();
    await expect(scopeCheckbox(page, 'domains')).toHaveClass(/is-checked/);

    await expect(page.locator('.shared-templates-group h5', { hasText: DOMAIN })).toBeVisible();
    await expect(page.locator('a.js-shared-template-link', { hasText: TPL.alpha })).toBeVisible();
    await expect(page.locator('a.js-shared-template-link', { hasText: TPL.gamma })).toBeVisible();
  });

  test('unchecking a scope hides its results again', async ({ page, adminUser }) => {
    await loginWithToken(page, adminUser.id, adminUser.token);
    await openTemplatesTab(page);

    const orgToggle = page.locator('a.js-toggle-template-scope[data-scope="organizations"]');
    await orgToggle.click();
    await expect(page.locator('a.js-shared-template-link', { hasText: TPL.alpha })).toBeVisible();

    // Uncheck — results disappear, the hint returns.
    await orgToggle.click();
    await expect(scopeCheckbox(page, 'organizations')).not.toHaveClass(/is-checked/);
    await expect(page.locator('a.js-shared-template-link')).toHaveCount(0);
    await expect(page.locator('.shared-templates-hint')).toBeVisible();
  });

  test('a checked scope is remembered across a reload (persisted, no save button)', async ({ page, adminUser }) => {
    await loginWithToken(page, adminUser.id, adminUser.token);
    await openTemplatesTab(page);

    await page.locator('a.js-toggle-template-scope[data-scope="teams"]').click();
    await expect(scopeCheckbox(page, 'teams')).toHaveClass(/is-checked/);

    // Reload and reopen the tab: the selection must still be checked and applied.
    await openTemplatesTab(page);
    await expect(scopeCheckbox(page, 'teams')).toHaveClass(/is-checked/);
    await expect(
      page.locator('.shared-templates-group h5', { hasText: TEAM.teamDisplayName }),
    ).toBeVisible();

    // Clean up the persisted state so other tests start unchecked.
    await page.locator('a.js-toggle-template-scope[data-scope="teams"]').click();
    await expect(scopeCheckbox(page, 'teams')).not.toHaveClass(/is-checked/);
  });
});
