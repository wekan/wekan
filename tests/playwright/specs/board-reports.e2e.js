'use strict';
// The Board View reports of 2026-11-20 (models/lib/boardReports.js): each opens
// from the Board View menu with its chart, its data table and the export bar
// at its top, and its PDF and Excel export are the table. A member who may see
// only their assigned cards gets none of them.
const { test, expect } = require('../fixtures');
const Excel = require('../../../node_modules/@wekanteam/exceljs');
const db = require('../helpers/db');
const { loginWithToken, openBoard } = require('../helpers/auth');

const REPORTS = [
  ['created-resolved', 'createdResolved'], ['net-flow', 'netFlow'], ['time-in-list', 'timeInList'],
  ['average-age', 'averageAge'], ['throughput-run', 'throughputRun'], ['due-date-performance', 'dueDatePerformance'],
  ['release-burndown', 'releaseBurndown'], ['epic-progress', 'epicProgress'], ['workload', 'workload'],
  ['distribution', 'distribution'], ['dependency-map', 'dependencyMap'], ['activity-heatmap', 'activityHeatmap'],
];
const DAY = 86400000;

function seed(board, user) {
  const [first, second] = db.find('cards', { boardId: board.boardId });
  const now = Date.now();
  // A Scrum release with a card, for the Release Burndown's table.
  const releaseId = db.uid('rel');
  db.insertOne('scrumReleases', { _id: releaseId, boardId: board.boardId, name: 'R1', state: 'planned', createdAt: new Date() });
  db.updateOne('cards', { _id: second._id }, { $set: { 'scrum.releaseIds': [releaseId] } });
  db.updateOne('cards', { _id: first._id }, { $set: { createdAt: new Date(now - 20 * DAY), endAt: new Date(now - 3 * DAY),
    dueAt: new Date(now - 5 * DAY), assignees: [user.id] } });
  db.updateOne('cards', { _id: second._id }, { $set: { createdAt: new Date(now - 10 * DAY), parentId: first._id, assignees: [user.id],
    cardDependencies: [{ cardId: first._id, type: 'blocks' }] } });
}

test.afterEach(({ board }) => { db.deleteMany('scrumReleases', { boardId: board.boardId }); });

for (const [slug, key] of REPORTS) {
  test(`${slug}: menu, chart, table, PDF and Excel`, async ({ page, user, board }) => {
    seed(board, user);
    test.info().annotations.push({ type: 'report', description: key });
    await loginWithToken(page, user.id, user.token);
    await openBoard(page, board.boardId, board.slug);
    await page.locator('.js-toggle-board-view').first().click();
    await page.locator(`.pop-over .js-open-${slug}-view`).click();
    const view = page.locator('.chart-view-content');
    await expect(view.locator('.chart-data-table').first()).toBeVisible();
    await expect(view.locator('.chart-data-table thead th').first()).not.toHaveText('');
    // The export bar at the top, as on every other report.
    await view.locator('.js-export-chart').click();
    for (const [label, format] of [['PDF', 'exportPDF'], ['Excel', 'exportExcel']]) {
      const url = await page.locator('.pop-over a').filter({ hasText: label }).getAttribute('href');
      expect(url).toContain(`/charts/${key}/${format}`);
      const response = await page.request.get(url);
      expect(response.status()).toBe(200);
      const buffer = await response.body();
      if (format === 'exportPDF') expect(buffer.subarray(0, 4).toString()).toBe('%PDF');
      else {
        const workbook = new Excel.Workbook();
        await workbook.xlsx.load(buffer);
        expect(workbook.worksheets[0].rowCount).toBeGreaterThan(1);
      }
    }
  });
}

test('negative: an assigned-only member gets no report data', async ({ page, user2, board }) => {
  db.addBoardMember({ boardId: board.boardId, userId: user2.id });
  db.updateOne('boards', { _id: board.boardId, 'members.userId': user2.id }, { $set: { 'members.$.isNormalAssignedOnly': true } });
  await loginWithToken(page, user2.id, user2.token);
  await openBoard(page, board.boardId, board.slug);
  const results = await page.evaluate(async ([id, keys]) => Promise.all(keys.map(async key => {
    try { await Meteor.callAsync('boardChartData', id, key, {}); return 'allowed'; } catch (e) { return e.error; }
  })), [board.boardId, REPORTS.map(([, key]) => key)]);
  expect(results).toEqual(REPORTS.map(() => 'not-authorized'));
});
