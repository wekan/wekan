'use strict';

const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const { loginWithToken } = require('../helpers/auth');

const BASE_URL = process.env.WEKAN_BASE_URL || 'http://localhost:3000';

test.describe('Dashboard, Map and saved searches', () => {
  test('keeps data permission-scoped and supports drill-down, map and private saves', async ({
    page,
    user,
    user2,
    board,
  }) => {
    const cardId = db.findCardIdByTitle({ boardId: board.boardId, title: 'Alpha Card' });
    const originalCard = db.findOne('cards', { _id: cardId });
    db.updateOne('cards', { _id: cardId }, {
      $set: {
        members: [user.id],
        dueAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        locations: [{
          _id: db.uid('location'),
          name: 'E2E location',
          address: 'Permission-scoped test location',
          latitude: 10.7769,
          longitude: 106.7009,
        }],
      },
    });

    try {
      await loginWithToken(page, user2.id, user2.token);
      const denied = await page.evaluate(
        boardId => Meteor.callAsync('boardDashboardCards', boardId, 'due', 'upcoming', 0, 10)
          .then(() => 'allowed')
          .catch(error => error.error || error.reason),
        board.boardId,
      );
      expect(denied).toBe('not-authorized');

      await loginWithToken(page, user.id, user.token);
      db.updateOne('users', { _id: user.id }, {
        $set: { 'profile.boardView': 'board-view-stats' },
      });
      await page.goto(`${BASE_URL}/b/${board.boardId}/${board.slug}`, {
        waitUntil: 'networkidle',
      });
      await expect(page.locator('.stats-dashboard-grid')).toBeVisible({ timeout: 15_000 });
      await expect(page.locator('.stats-chart-row[data-dimension="member"]')).toHaveCount(1);
      await page.locator('.stats-chart-row[data-dimension="list"]').first().click();
      await expect(page.locator('.stats-drilldown')).toContainText('Alpha Card');

      await page.getByRole('link', { name: /Dashboard|Bảng điều khiển/ }).click();
      await page.getByText(/Map|Bản đồ/, { exact: true }).click();
      await expect(page.locator('.map-view-marker')).toHaveCount(1);
      await expect(page.locator('.map-view-list')).toContainText('E2E location');

      await page.goto(`${BASE_URL}/global-search`, { waitUntil: 'networkidle' });
      await page.locator('#global-search-input').fill('Alpha Card');
      await page.locator('#global-search-input').press('Enter');
      await page.locator('#saved-search-name').fill('Alpha cards');
      await page.locator('.js-save-search button[type="submit"]').click();
      await expect(page.locator('.saved-search-list')).toContainText('Alpha cards');

      const owner = db.findOne('users', { _id: user.id });
      const other = db.findOne('users', { _id: user2.id });
      expect(owner.profile.savedSearches.some(search => search.name === 'Alpha cards')).toBe(true);
      expect(other.profile?.savedSearches || []).toHaveLength(0);

      await page.setViewportSize({ width: 375, height: 812 });
      await expect(page.locator('.saved-searches-panel')).toBeInViewport();
    } finally {
      db.updateOne('cards', { _id: cardId }, {
        $set: {
          members: originalCard.members || [],
          dueAt: originalCard.dueAt || null,
          locations: originalCard.locations || [],
        },
      });
      db.updateOne('users', { _id: user.id }, {
        $set: { 'profile.savedSearches': [] },
      });
    }
  });
});
