'use strict';
// The Scrum meeting helpers of the board menu (docs/Features/Scrum/Meetings.md):
// the daily standup timer, and the retrospective board with its four lists -
// each hidden by the board's Scrum settings and by Admin Panel / Features.
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');

// The board menu is the cog inside the board's sidebar, opened from the
// header hamburger (tests/playwright/specs/15-board-actions.e2e.js).
const openBoardMenu = async page => {
  const cog = page.locator('.board-sidebar .js-open-board-menu');
  if (!(await cog.isVisible().catch(() => false))) await page.locator('.js-toggle-page-sidebar').first().click();
  await cog.click();
  await expect(page.locator('.js-pop-over')).toBeVisible({ timeout: 15_000 });
};
const featureStates = () => (db.findOne('settings', {}, { featureStates: 1 }) || {}).featureStates;
const restoreFeatures = saved => (saved
  ? db.updateOne('settings', {}, { $set: { featureStates: saved } })
  : db.updateOne('settings', {}, { $unset: { featureStates: 1 } }));

test.describe('Scrum meetings', () => {
  test('the daily standup gives each member a timebox, one after another', async ({ boardPage }) => {
    await openBoardMenu(boardPage);
    await boardPage.locator('.js-pop-over .js-open-daily-standup').click();
    const standup = boardPage.locator('.js-daily-standup');
    await expect(standup.locator('.daily-standup-order li')).toHaveCount(1, { timeout: 15_000 });
    await standup.locator('.js-standup-start').click();
    await expect(standup.locator('.daily-standup-clock')).toHaveText(/^[12]:\d\d$/, { timeout: 15_000 });
    await expect(standup.locator('.daily-standup-position')).toHaveText('1 / 1');
    await standup.locator('.js-standup-next').click();
    await expect(standup.locator('.daily-standup-done')).toBeVisible();
  });

  test('a retrospective board is made with its four lists', async ({ boardPage, board, user }) => {
    await openBoardMenu(boardPage);
    await boardPage.locator('.js-pop-over .js-create-retrospective-board').click();
    await expect.poll(() => db.find('boards', { title: /retrospective/, 'members.userId': user.id }).length, { timeout: 20_000 }).toBe(1);
    const retro = db.findOne('boards', { title: /retrospective/, 'members.userId': user.id });
    try {
      expect(retro.title.startsWith(db.findOne('boards', { _id: board.boardId }).title)).toBe(true);
      expect(retro.permission).toBe('private');
      await expect.poll(() => db.find('lists', { boardId: retro._id }).map(l => l.title).sort(), { timeout: 15_000 })
        .toEqual(['Action items', 'Keep doing', 'Start doing', 'Stop doing']);
      await expect(boardPage).toHaveURL(new RegExp(`/b/${retro._id}/`), { timeout: 15_000 });
    } finally {
      db.cleanup({ boardIds: [retro._id] });
    }
  });

  test('negative: the board\'s Scrum settings and Admin Panel / Features hide them', async ({ boardPage, board }) => {
    const saved = featureStates();
    try {
      db.updateOne('boards', { _id: board.boardId }, { $set: { 'scrum.standupTimer': false } });
      await openBoardMenu(boardPage);
      await expect(boardPage.locator('.js-pop-over .js-open-daily-standup')).toHaveCount(0);
      await expect(boardPage.locator('.js-pop-over .js-create-retrospective-board')).toBeVisible();
      await boardPage.reload();

      db.updateOne('settings', {}, { $set: { 'featureStates.retrospective-board': false } });
      await openBoardMenu(boardPage);
      await expect(boardPage.locator('.js-pop-over .js-create-retrospective-board')).toHaveCount(0);
    } finally {
      restoreFeatures(saved);
    }
  });
});
