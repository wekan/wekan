'use strict';
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const { openBoard } = require('../helpers/auth');
async function registerProvider(page, version = 1) {
  await page.evaluate(version => {
    // Use the actual registered global helper to reach the app's Filter instance.
    const filter = Blaze._globalHelpers.Filter();
    const value = new Package['reactive-var'].ReactiveVar('');
    window.disposeTestFilter = filter.providers.register({
      id: 'test.card-title', version, scope: 'board', template: 'textFilterProvider',
      data: () => ({ labelKey: 'filter-card-title-label', get: () => value.get(), set: text => value.set(text) }),
      isActive: () => !!value.get(), selector: () => ({ title: value.get() }), reset: () => value.set(''),
      capture: () => value.get(), validate: text => typeof text === 'string' && text.length <= 512,
      restore: text => value.set(text),
    });
  }, version);
}
async function openFilter(page) {
  if (!(await page.locator('.js-filter-preset-name').isVisible())) await page.locator('.js-open-filter-view').click();
}
test('registered provider renders, narrows lazy cards, persists state and refuses unavailable versions without clearing filters', async ({ loggedInPage: page, board, user }) => {
  test.setTimeout(90000);
  await openBoard(page, board.boardId, board.slug); await openFilter(page);
  await registerProvider(page);
  const field = page.locator('[data-provider-id="test.card-title"] .js-provider-text');
  await field.fill('Alpha Card');
  const cards = page.locator('.board-canvas .js-minicard');
  await expect(cards).toHaveCount(1); await expect(cards).toContainText('Alpha Card');
  await page.locator('.js-filter-preset-name').fill('Provider choice');
  await page.locator('.js-save-filter-preset [type="submit"]').click();
  await expect(page.locator('.js-filter-preset-message')).toHaveText('Filters saved.');
  const saved = db.findOne('savedCardFilters', { ownerId: user.id, boardId: board.boardId });
  expect(saved.state.version).toBe(2);
  expect(saved.state.providers['test.card-title']).toEqual({ version: 1, value: 'Alpha Card' });
  await page.locator('.js-clear-all').click(); await openFilter(page);
  await expect(field).toHaveValue(''); await expect(cards).toHaveCount(3);
  await page.locator('.js-filter-preset-select').selectOption(saved._id);
  await page.locator('.js-apply-filter-preset').click();
  await expect(field).toHaveValue('Alpha Card'); await expect(cards).toHaveCount(1);
  await page.evaluate(() => window.disposeTestFilter());
  await expect(field).toHaveCount(0); await expect(cards).toHaveCount(3);
  await openFilter(page);
  await page.locator('.js-field-card-filter').fill('Beta');
  await page.locator('.js-filter-preset-select').selectOption(saved._id);
  await page.locator('.js-apply-filter-preset').click();
  await expect(page.locator('.js-filter-preset-message')).toContainText('Could not');
  await expect(page.locator('.js-field-card-filter')).toHaveValue('Beta');
  await registerProvider(page, 2);
  await page.locator('.js-apply-filter-preset').click();
  await expect(page.locator('.js-filter-preset-message')).toContainText('Could not');
  await expect(page.locator('.js-field-card-filter')).toHaveValue('Beta');
  await expect(field).toHaveValue('');
  await page.evaluate(() => window.disposeTestFilter());
});
