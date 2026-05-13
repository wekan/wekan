'use strict';

const BASE_URL = process.env.WEKAN_BASE_URL || 'http://localhost:3000';

/**
 * Page Object for the Admin panel — People management at /people.
 *
 * Selectors from:
 *  - client/components/settings/peopleBody.jade  (people template, peopleGeneral, peopleRow)
 *  - config/router.js  (route: /people)
 *
 * The /people page defaults to the Organizations view.
 * Call navigateToPeople() to switch to the People (users) view.
 */
class AdminPage {
  constructor(page) {
    this.page = page;
  }

  /**
   * Navigate to /people and switch to the "People" tab (not the default Org tab).
   * peopleBody.jade: side-menu has a.js-people-menu(data-id="people-setting")
   * After clicking, peopleSetting.get becomes true and +peopleGeneral renders.
   */
  async navigateToPeople() {
    // Route: /people (not /admin/people)
    await this.page.goto(`${BASE_URL}/people`, { waitUntil: 'networkidle' });
    // Wait for the side menu to render (the page uses the people template).
    await this.page.locator('.js-people-menu').waitFor({ timeout: 15_000 });
    // Click the "People" tab to switch from the default Orgs view.
    await this.page.locator('.js-people-menu').click();
    // Wait for people rows — peopleGeneral has an empty <tr> before each user row,
    // so wait for td.username which appears only in actual data rows.
    await this.page.locator('table tbody td.username').first().waitFor({ timeout: 15_000 });
  }

  async navigateToSettings() {
    // WeKan admin settings are at /setting (check router if needed)
    await this.page.goto(`${BASE_URL}/setting`, { waitUntil: 'networkidle' });
  }

  async navigateToInfo() {
    await this.page.goto(`${BASE_URL}/admin-reports`, { waitUntil: 'networkidle' });
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

  async nextPage() {
    await this.page.locator('button.js-people-next-page:not(.disabled)').click();
    await this.page.waitForTimeout(500);
  }

  async prevPage() {
    await this.page.locator('button.js-people-prev-page:not(.disabled)').click();
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
