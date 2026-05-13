'use strict';

const BASE_URL = process.env.WEKAN_BASE_URL || 'http://localhost:3000';

/**
 * Page Object for the global search page (/global-search) and
 * in-board search/filter (sidebar search/filter forms).
 *
 * Selectors are derived from:
 *  - client/components/main/globalSearch.jade  (global search page)
 *  - client/components/cards/resultCard.jade   (search result cards)
 *  - client/components/sidebar/sidebarFilters.jade  (filter sidebar)
 *  - client/components/sidebar/sidebarSearches.jade (in-board search)
 *  - client/components/boards/boardHeader.jade  (.js-open-filter-view, .js-open-search-view)
 */
class SearchPage {
  constructor(page) {
    this.page = page;
  }

  // --- Global search (/global-search) ---

  async navigateToGlobalSearch() {
    // WeKan's global search route is /global-search (not /search).
    await this.page.goto(`${BASE_URL}/global-search`, { waitUntil: 'networkidle' });
    // Wait for the search form: form.global-search-page.js-search-query-form
    await this.page.locator('form.js-search-query-form').waitFor({ timeout: 15_000 });
  }

  async globalSearch(term) {
    // Input: input.global-search-query-input  (keydown Enter triggers search)
    const input = this.page.locator('input.global-search-query-input').first();
    await input.fill(term);
    await input.press('Enter');
    // Wait until WeKan leaves the "searching" state. The template shows either:
    //   .global-search-results-list-wrapper  (results found)
    //   .global-search-help                  (no results / server error)
    // Both are mutually exclusive with the spinner (.global-search-page loading).
    await this.page
      .locator('.global-search-results-list-wrapper, .global-search-help')
      .first()
      .waitFor({ timeout: 15_000 });
  }

  /**
   * Returns the list of result-card-wrapper elements in the current search results page.
   * Each has an inner .minicard-wrapper.js-minicard.card-title with the card title.
   */
  globalSearchResults() {
    return this.page.locator('.global-search-results-list-wrapper .result-card-wrapper');
  }

  async globalSearchResultTitles() {
    return this.page
      .locator('.global-search-results-list-wrapper .minicard-title')
      .allInnerTexts();
  }

  globalSearchResultByTitle(title) {
    return this.page
      .locator('.global-search-results-list-wrapper .result-card-wrapper')
      .filter({ hasText: title });
  }

  // --- Navigation within global search pages ---

  async nextPage() {
    await this.page.locator('button.js-next-page').click();
    await this.page.waitForTimeout(800);
  }

  async prevPage() {
    await this.page.locator('button.js-previous-page').click();
    await this.page.waitForTimeout(800);
  }

  // --- Board-level search (sidebar search form, .js-open-search-view) ---

  async openBoardSearch() {
    // boardHeader.jade: a.board-header-btn.js-open-search-view
    await this.page.locator('.js-open-search-view').first().click();
    // Wait for searchSidebar template: form.js-search-term-form
    await this.page.locator('form.js-search-term-form').waitFor({ timeout: 10_000 });
  }

  async boardSearch(term) {
    const input = this.page.locator('form.js-search-term-form input[type=text]').first();
    await input.fill(term);
    await input.press('Enter');
    await this.page.waitForTimeout(1_000);
  }

  boardSearchResults() {
    // searchSidebar.jade: .minicards .minicard-wrapper.js-minicard
    return this.page.locator('.board-sidebar .js-minicards .minicard-wrapper.js-minicard');
  }

  // --- Filter sidebar (.js-open-filter-view) ---

  async openFilterSidebar() {
    // boardHeader.jade: a.board-header-btn.js-open-filter-view
    await this.page.locator('.js-open-filter-view').click();
    // filterSidebar.jade has .js-field-card-filter input and .js-list-filter form
    await this.page.locator('.board-sidebar .js-field-card-filter, .board-sidebar .js-list-filter').first().waitFor({ timeout: 10_000 });
  }

  async filterByMember(memberName) {
    // filterSidebar.jade: .js-toggle-member-filter links per member
    await this.page.locator('.js-toggle-member-filter').filter({ hasText: memberName }).click();
    await this.page.waitForTimeout(600);
  }

  async filterByTitle(titleFragment) {
    // filterSidebar.jade: input.js-field-card-filter
    // sidebarFilters.js: 'change .js-field-card-filter' triggers filter — must blur to fire change.
    const input = this.page.locator('.js-field-card-filter');
    await input.fill(titleFragment);
    await input.press('Tab'); // blur triggers the Blaze 'change' event handler
    await this.page.waitForTimeout(800);
  }

  async clearFilters() {
    const clearBtn = this.page.locator('.js-filter-reset, .js-clear-all');
    if (await clearBtn.count() > 0) await clearBtn.first().click();
  }
}

module.exports = SearchPage;
