'use strict';

/**
 * Page Object for the main board view.
 * Encapsulates all selectors and actions on /b/<id>/<slug>.
 */
class BoardPage {
  constructor(page) {
    this.page = page;
  }

  // --- Lists ---

  list(listId) {
    return this.page.locator(`#js-list-${listId}`);
  }

  listHeader(listId) {
    return this.list(listId).locator('.list-header-name');
  }

  allLists() {
    return this.page.locator('.js-list:not(.js-list-composer)');
  }

  async listTitles(containerSelector = '.js-lists') {
    return this.page
      .locator(`${containerSelector} .js-list:not(.js-list-composer) .list-header-name`)
      .allInnerTexts();
  }

  async openListMenu(listId) {
    // The board view can briefly re-render to a "Board not found" state while the
    // client subscription settles, detaching the trigger after the canvas first
    // appears. Retry the open until the popup actually shows.
    const trigger = this.list(listId).locator('.js-open-list-menu');
    const popover = this.page.locator('.js-pop-over');
    for (let attempt = 0; attempt < 4; attempt++) {
      await this.page
        .locator('.board-canvas')
        .waitFor({ state: 'visible', timeout: 15_000 })
        .catch(() => {});
      try {
        await trigger.click({ timeout: 5_000 });
        await popover.waitFor({ state: 'visible', timeout: 5_000 });
        return;
      } catch (err) {
        // board re-rendered mid-interaction; loop and try again
      }
    }
    await popover.waitFor({ timeout: 5_000 });
  }

  async clickListMenuItem(selector) {
    await this.page.locator(`.js-pop-over ${selector}`).click();
  }

  // --- Cards within a list ---

  cardTitlesInList(listId) {
    return this.list(listId).locator('.js-minicard .minicard-title');
  }

  async getCardTitles(listId) {
    return this.cardTitlesInList(listId).allInnerTexts();
  }

  minicard(listId, titleSubstring) {
    return this.list(listId)
      .locator('.js-minicard')
      .filter({ hasText: titleSubstring });
  }

  // --- Adding cards ---

  async openAddCardTop(listId) {
    await this.list(listId).locator('.js-add-card.list-header-plus-top').click();
    await this.list(listId).locator('.js-inlined-form textarea.js-card-title').waitFor();
  }

  async openAddCardBottom(listId) {
    // list-header-plus-bottom only appears inside listActionPopup.
    // Open the list menu (hamburger icon), click the "add to bottom" item.
    await this.openListMenu(listId);
    await this.page.locator('.js-pop-over .js-add-card.list-header-plus-bottom').click();
    await this.list(listId).locator('.js-inlined-form textarea.js-card-title').waitFor();
  }

  async submitNewCard(listId, title) {
    const textarea = this.list(listId).locator('.js-inlined-form textarea.js-card-title');
    await textarea.fill(title);
    await this.list(listId).locator('.js-inlined-form button[type=submit]').click();
    // Wait until the card appears
    await this.minicard(listId, title).waitFor({ timeout: 15_000 });
  }

  async closeComposers(listId) {
    const close = this.list(listId).locator('.js-inlined-form .js-close-inlined-form');
    while (await close.count() > 0) {
      await close.first().click();
      await this.page.waitForTimeout(200);
    }
  }

  // --- Opening a card ---

  async clickCard(listId, titleSubstring) {
    await this.minicard(listId, titleSubstring).click();
    await this.page.locator('.js-card-details').first().waitFor({ timeout: 15_000 });
  }

  // --- Board view switching ---

  async switchToView(viewSelector) {
    await this.page.locator('.js-toggle-board-view').click();
    await this.page.locator(`.js-pop-over ${viewSelector}`).click();
    await this.page.waitForTimeout(800);
  }

  async switchToListView() {
    await this.switchToView('.js-open-lists-view');
  }

  async switchToSwimlanesView() {
    await this.switchToView('.js-open-swimlanes-view');
  }

  // --- Sidebar ---

  async openSidebar() {
    const sidebar = this.page.locator('.board-sidebar.sidebar');
    const isOpen = await sidebar.evaluate(el => el.classList.contains('is-open'));
    if (!isOpen) {
      // .js-toggle-sidebar is in the board header (boardHeader.jade line 147).
      // .js-open-board-menu lives *inside* the sidebar — don't use it here.
      await this.page.locator('.js-toggle-sidebar').click();
      await sidebar.waitFor({ state: 'visible' });
    }
  }

  async openBoardMembers() {
    await this.openSidebar();
    await this.page.locator('.js-manage-board-members').click();
    await this.page.locator('.js-pop-over').waitFor();
  }

  async openFilterSidebar() {
    await this.page.locator('.js-open-filter-view').click();
    await this.page.locator('.filter-sidebar, .filterSidebar').waitFor();
  }

  async openMultiSelection() {
    await this.page.locator('.js-open-multiselection-view, .js-toggle-multi-selection').click();
  }

  // --- Multi-select cards ---

  async selectCard(listId, titleSubstring) {
    const card = this.minicard(listId, titleSubstring);
    await card.locator('.js-minicard-details-menu-with-handle, input[type=checkbox]').first().click({ force: true });
  }

  // --- Sorting ---

  /**
   * Sort cards board-wide using the board-header sort button.
   * criterion: 'created-desc' | 'created-asc' | 'title' | 'due'
   * The sort button (.js-sort-cards) lives in the board header — NOT the list
   * menu — and opens the cardsSortPopup with .js-sort-<criterion> options.
   */
  async sortCardsBy(listId, criterion) {
    await this.page.locator('.js-sort-cards').first().click();
    await this.page.locator('.js-pop-over').waitFor();
    await this.page.locator(`.js-pop-over .js-sort-${criterion}`).click();
    await this.page.waitForTimeout(600);
  }
}

module.exports = BoardPage;
