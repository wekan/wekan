'use strict';

/**
 * Page Object for the Admin panel — People management at /people.
 *
 * Selectors from:
 *  - client/components/settings/peopleBody.jade  (people template, peopleGeneral, peopleRow)
 *  - config/router.js  (route: /people)
 *
 * The /people page opens on Login; call navigateToPeople() to switch to the
 * People (users) pane.
 */
class AdminPage {
  constructor(page) {
    this.page = page;
  }

  /**
   * Navigate to /people and switch to the "People" pane (the page opens on Login).
   *
   * Every Admin Panel page renders the ONE shared left menu now
   * (docs/Features/Page/Left-Menu.md): `a.js-left-menu-item(data-id="...")`, where
   * data-id is the menu entry's id and is what the page's click handler reads. So
   * the entry is addressed by data-id, not by a per-page class — the old
   * `.js-people-menu` was exactly such a class, and it went away with the
   * conversion.
   */
  async navigateToPeople() {
    // Follow the same in-app controls as an administrator. This preserves the
    // authenticated DDP connection and also verifies the Admin Panel tabs.
    await this.page.locator('.js-open-header-member-menu').click();
    await this.page.locator('.js-pop-over .js-go-setting').click();
    const peopleTab = this.page.locator('.admin-panel-tabs a.people');
    await peopleTab.waitFor({ timeout: 15_000 });
    await peopleTab.click();
    const peopleEntry = this.page.locator(
      '.js-left-menu-item[data-id="people-setting"]',
    );
    await peopleEntry.waitFor({ timeout: 15_000 });
    await peopleEntry.click();
    // Wait for people rows — peopleGeneral has an empty <tr> before each user row,
    // so wait for td.username which appears only in actual data rows.
    await this.page.locator('table tbody td.username').first().waitFor({ timeout: 15_000 });
  }

  async navigateToSettings() {
    await this.page.locator('.js-open-header-member-menu').click();
    await this.page.locator('.js-pop-over .js-go-setting').click();
  }

  async navigateToInfo() {
    await this.navigateToSettings();
    await this.page.locator('.admin-panel-tabs a.problems').click();
  }

  // --- People list ---

  /**
   * Returns all user rows in the people table.
   * peopleGeneral.jade: table > tbody > each user → +peopleRow → <tr>
   */
  userRows() {
    return this.page.locator('table tbody tr');
  }

  userRowByUsername(username) {
    return this.userRows().filter({ hasText: username });
  }

  // --- Edit user popup ---

  /**
   * Click the edit link for a user by username.
   * peopleRow.jade: a.edit-user (opens editUserPopup via Popup.open('editUser')).
   */
  async openEditUser(username) {
    const row = this.userRowByUsername(username);
    await row.locator('a.edit-user').first().click();
    await this.page.locator('.js-pop-over').waitFor({ timeout: 10_000 });
  }

  async setUsername(newUsername) {
    // editUserPopup may have a username input
    const input = this.page.locator('.js-pop-over input[name="username"], .js-pop-over .js-profile-username').first();
    await input.fill(newUsername);
  }

  async saveEditUser() {
    // editUserPopup.jade: input.primary.wide(type="submit") — it's an <input> not a <button>
    await this.page.locator('.js-pop-over input[type=submit], .js-pop-over button[type=submit]').first().click();
    await this.page.waitForTimeout(600);
  }

  // --- Toggle user active status ---

  /**
   * Toggle a user's active/inactive status.
   * peopleRow.jade: span.js-toggle-active-status[data-is-active="true"|"false"]
   * To deactivate: click data-is-active="true" (currently active → will deactivate)
   * To activate:   click data-is-active="false" (currently inactive → will activate)
   */
  async setUserActive(username, active) {
    const row = this.userRowByUsername(username);
    const toggleSelector = active
      ? '.js-toggle-active-status[data-is-active="false"]'  // click to activate
      : '.js-toggle-active-status[data-is-active="true"]';  // click to deactivate
    const toggle = row.locator(toggleSelector);
    if (await toggle.count() > 0) await toggle.click();
    await this.page.waitForTimeout(400);
  }

  // --- Change password (via editUserPopup) ---

  async changePassword(username, newPassword) {
    await this.openEditUser(username);
    // editUserPopup has required fields (fullname). If the user was seeded
    // without a fullname the browser's HTML5 validation blocks submission.
    // Ensure the field is non-empty before saving.
    const fullnameInput = this.page.locator('.js-pop-over input.js-profile-fullname');
    const currentFullname = await fullnameInput.inputValue().catch(() => '');
    if (!currentFullname.trim()) {
      await fullnameInput.fill(username);
    }
    const passwordInput = this.page.locator('.js-pop-over input.js-profile-password').first();
    if (await passwordInput.count() > 0) {
      await passwordInput.fill(newPassword);
      await this.saveEditUser();
    }
  }

  // --- Pagination ---
  //
  // People is a shared table page now (docs/Features/Page/Table.md), so its pager is
  // the shared one: the same `.js-table-page-prev` / `.js-table-page-next` every
  // table page in the Admin Panel uses. The old per-pane `.js-people-*-page`
  // buttons went away with that pane's own markup.

  async nextPage() {
    await this.page.locator('button.js-table-page-next:not(.disabled)').click();
    await this.page.waitForTimeout(500);
  }

  async prevPage() {
    await this.page.locator('button.js-table-page-prev:not(.disabled)').click();
    await this.page.waitForTimeout(500);
  }

  // --- Check that all action buttons are visible (not off-screen) ---

  async actionButtonsVisible() {
    // peopleRow.jade: .js-toggle-active-status, .js-toggle-lock-status, a.edit-user
    const buttons = this.page.locator('.js-toggle-active-status, .js-toggle-lock-status, a.edit-user');
    const count = await buttons.count();
    for (let i = 0; i < Math.min(count, 5); i++) {
      const box = await buttons.nth(i).boundingBox();
      if (!box || box.x < 0 || box.y < 0) return false;
    }
    return true;
  }
}

module.exports = AdminPage;
