'use strict';
// Sprint Report: scope and burndown replayed change by change from History
// (models/lib/scrumScopeReplay.js, client/components/boards/scrum/scrumScopeHistory.js).
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const { loginWithToken, openBoard } = require('../helpers/auth');
const call = (page, method, ...args) => page.evaluate(async ({ method, args }) => {
  try { return await Meteor.callAsync(method, ...args); }
  catch (error) { throw new Error(`${error.error}: ${error.reason || error.message}`); }
}, { method, args });

test('Sprint Report replays each change to the sprint, and says when History is incomplete', async ({ page, user, board }) => {
  const cards = db.find('cards', { boardId: board.boardId });
  try {
    await loginWithToken(page, user.id, user.token);
    db.updateOne('cards', { _id: cards[0]._id }, { $set: { 'poker.estimation': 3 } });
    db.updateOne('cards', { _id: cards[1]._id }, { $set: { 'poker.estimation': 5 } });
    const sprint = await call(page, 'scrum.saveSprint', board.boardId, null,
      { name: 'Scope history', plannedStart: '2026-09-01', plannedEnd: '2026-12-30' }, null);
    await call(page, 'scrum.updateCard', board.boardId, cards[0]._id, { sprintId: sprint._id }, 0);
    await call(page, 'scrum.startSprint', board.boardId, sprint._id, sprint.revision);
    // A card joins during the sprint: one change.
    await call(page, 'scrum.updateCard', board.boardId, cards[1]._id, { sprintId: sprint._id }, 0);
    await openBoard(page, board.boardId, board.slug);
    await page.locator('.js-toggle-board-view').first().click();
    await page.locator('.pop-over .js-open-sprint-report-view').click();
    await page.locator('.js-scrum-sprint').selectOption(sprint._id);
    const report = page.locator('.scrum-scope-history');
    await expect(report.locator('.scrum-scope-row')).toHaveCount(2);
    await expect(report.locator('.scrum-scope-row').first()).toContainText('Sprint started');
    await expect(report.locator('.scrum-scope-row').last()).toContainText('Sprint membership changed');
    await expect(report.locator('.scrum-scope-row').last().locator('.scrum-chart-label').first()).toHaveText(/: 8$/);
    await expect(report.locator('.js-scrum-scope-inconsistent')).toHaveCount(0);
    // Negative: a write History never saw, to a card the start snapshot
    // measured, is flagged.
    db.updateOne('cards', { _id: cards[0]._id }, { $set: { 'poker.estimation': 30 } });
    await page.reload();
    await page.locator('.js-toggle-board-view').first().click();
    await page.locator('.pop-over .js-open-sprint-report-view').click();
    await page.locator('.js-scrum-sprint').selectOption(sprint._id);
    await expect(report.locator('.js-scrum-scope-inconsistent')).toBeVisible();
  } finally {
    db.deleteMany('scrumSprints', { boardId: board.boardId });
    db.deleteMany('scrumDailySnapshots', { boardId: board.boardId });
  }
});
