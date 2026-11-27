'use strict';

// #6948: a board filtered by assignee keeps `?assignee=<username>` in its URL
// and applies it again after a refresh (#4540 reads it, #319 writes it). For
// the signed-in user's own username it did not: the board publication never
// sends the current user's own document (#6919), so after the refresh the
// username resolved to nobody and the URL sync removed it from the URL.

const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const { waitForMeteor } = require('../helpers/auth');

const BASE_URL = process.env.WEKAN_BASE_URL || 'http://localhost:3000';

function assign(board, title, userId) {
  const card = db.findOne('cards', { boardId: board.boardId, title });
  db.updateOne('cards', { _id: card._id }, { $set: { assignees: [userId] } });
}

async function openFiltered(page, board, query) {
  await page.goto(`${BASE_URL}/b/${board.boardId}/${board.slug}?${query}`, { waitUntil: 'commit' });
  await waitForMeteor(page);
}

const minicard = (page, title) => page.locator('.js-minicard').filter({ hasText: title });

test.describe('Filter by assignee in the URL (#6948)', () => {
  test.beforeEach(async ({ board, user2 }) => {
    db.addBoardMember({ boardId: board.boardId, userId: user2.id });
    assign(board, 'Alpha Card', board.owner.id);
    assign(board, 'Beta Card', user2.id);
  });

  test('?assignee=<own username> is applied and kept after a refresh', async ({ boardPage: page, board, user }) => {
    await openFiltered(page, board, `assignee=${user.username}`);
    await expect(minicard(page, 'Alpha Card')).toBeVisible({ timeout: 30_000 });
    await expect(minicard(page, 'Beta Card')).toHaveCount(0);

    await page.reload({ waitUntil: 'commit' });
    await waitForMeteor(page);
    await expect(minicard(page, 'Alpha Card')).toBeVisible({ timeout: 30_000 });
    await expect(minicard(page, 'Beta Card')).toHaveCount(0);
    await expect(page).toHaveURL(new RegExp(`[?&]assignee=${user.username}(&|$)`));
  });

  test('another member as assignee is still applied and kept after a refresh', async ({ boardPage: page, board, user2 }) => {
    await openFiltered(page, board, `assignee=${user2.username}`);
    await page.reload({ waitUntil: 'commit' });
    await waitForMeteor(page);
    await expect(minicard(page, 'Beta Card')).toBeVisible({ timeout: 30_000 });
    await expect(minicard(page, 'Alpha Card')).toHaveCount(0);
    await expect(page).toHaveURL(new RegExp(`[?&]assignee=${user2.username}(&|$)`));
  });

  test('negative: an unknown username filters nothing and leaves the URL', async ({ boardPage: page, board }) => {
    await openFiltered(page, board, 'assignee=e2e_nobody_6948');
    await expect(minicard(page, 'Alpha Card')).toBeVisible({ timeout: 30_000 });
    await expect(minicard(page, 'Beta Card')).toBeVisible();
    await expect(page).not.toHaveURL(/assignee=/);
  });
});
