'use strict';
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const { loginWithToken, openBoard } = require('../helpers/auth');
const Excel = require('../../../node_modules/@wekanteam/exceljs');
const DAY = 86400000;
const pages = [
  ['aging-wip', 'agingWip'], ['blocker-analysis', 'blockerAnalysis'],
  ['monte-carlo', 'monteCarlo'], ['process-behavior', 'processBehavior'], ['size-cycle-time', 'sizeCycleTime'],
];

function seedReports(board) {
  const cards = db.find('cards', { boardId: board.boardId });
  const extra = { ...cards[2], _id: `flow-extra-${board.boardId}`, title: 'Fourth sample' };
  db.insertOne('cards', extra);
  cards.push(extra);
  const now = Date.now();
  cards.forEach((card, index) => {
    db.updateOne('cards', { _id: card._id }, { $set: {
      createdAt: new Date(now - 30 * DAY), startAt: new Date(now - 20 * DAY),
      ...(index > 1 ? { endAt: new Date(now - (index + 1) * DAY), poker: { estimation: index } } : {}),
    } });
    db.insertOne('activities', { _id: `flow-entry-${card._id}`, boardId: board.boardId,
      cardId: card._id, listId: card.listId, activityType: 'createCard', createdAt: new Date(now - 30 * DAY) });
  });
  const dep = [{ cardId: cards[1]._id, type: 'blocks', color: '#eb144c', icon: 'ban' }];
  db.updateOne('cards', { _id: cards[0]._id }, { $set: { cardDependencies: dep } });
  db.insertOne('changeHistory', { _id: `flow-blocker-${board.boardId}`, boardId: board.boardId,
    entityType: 'card', entityId: cards[0]._id, cardId: cards[0]._id,
    group: 'dependencies', changeType: 'added', createdAt: new Date(now - 5 * DAY), userId: 'fixture',
    previousContent: { field: 'cardDependencies', value: [] }, newContent: { field: 'cardDependencies', value: dep } });
}

for (const [slug, key] of pages) {
  test(`${slug}: menu, chart, table, PDF and Excel`, async ({ page, request, user, board }) => {
    seedReports(board);
    await loginWithToken(page, user.id, user.token);
    await openBoard(page, board.boardId, board.slug);
    await page.locator('.js-toggle-board-view').first().click();
    await page.locator(`.pop-over .js-open-${slug}-view`).click();
    const view = page.locator('.chart-view-content');
    await expect(view.locator('.chart-data-table').first()).toBeVisible();
    await expect(view.locator('.js-chart-canvas')).toBeVisible();
    // Chart.js changes canvas width/height only when its constructor ran.
    await expect.poll(() => view.locator('.js-chart-canvas').evaluate(canvas => canvas.width)).toBeGreaterThan(300);
    if (['monteCarlo', 'processBehavior'].includes(key)) await expect(view.locator('.js-chart-secondary')).toBeVisible();
    await view.locator('.js-export-chart').click();
    for (const [label, format] of [['PDF', 'exportPDF'], ['Excel', 'exportExcel']]) {
      const link = page.locator('.pop-over a').filter({ hasText: label });
      const url = await link.getAttribute('href');
      expect(url).toContain(`/charts/${key}/${format}`);
      const response = await page.request.get(url);
      expect(response.status()).toBe(200);
      const buffer = await response.body();
      if (format === 'exportPDF') expect(buffer.subarray(0, 4).toString()).toBe('%PDF');
      else {
        const workbook = new Excel.Workbook();
        await workbook.xlsx.load(buffer);
        expect(workbook.worksheets[0].rowCount).toBeGreaterThan(2);
      }
    }
  });
}

test('forecast inputs reach exports; invalid inputs and unauthorized reads are rejected', async ({ page, request, user, board }) => {
  seedReports(board);
  await loginWithToken(page, user.id, user.token);
  await openBoard(page, board.boardId, board.slug);
  await page.locator('.js-toggle-board-view').first().click();
  await page.locator('.js-open-monte-carlo-view').click();
  await expect(page.locator('.chart-data-table').first()).toBeVisible();
  await page.locator('[name=targetCount]').fill('7');
  await page.locator('[name=historyDays]').fill('30');
  await page.locator('.js-flow-options button').click();
  await expect(page.locator('.chart-data-table').first().locator('tbody tr').first()).toContainText('7');
  await page.locator('.js-export-chart').click();
  const url = await page.locator('.pop-over a').filter({ hasText: 'Excel' }).getAttribute('href');
  expect(url).toContain('targetCount=7');
  expect(url).toContain('historyDays=30');
  const bad = await page.evaluate(async boardId => {
    try { await Meteor.callAsync('boardChartData', boardId, 'monteCarlo', { targetCount: -1 }); return null; }
    catch (error) { return error.error; }
  }, board.boardId);
  expect(bad).toBe('bad-request');
  // No session or token on this request context's HTTP request.
  const denied = await request.get(`/api/boards/${board.boardId}/charts/monteCarlo/exportExcel`);
  expect([401, 403]).toContain(denied.status());
});

test('empty scatter explains its data requirements and has no misleading points', async ({ page, user, board }) => {
  await loginWithToken(page, user.id, user.token);
  await openBoard(page, board.boardId, board.slug);
  await page.locator('.js-toggle-board-view').first().click();
  await page.locator('.js-open-size-cycle-time-view').click();
  await expect(page.locator('.chart-method-note')).toContainText('estimate');
  await expect(page.locator('.stats-view-placeholder-note')).toContainText('No results');
  await expect(page.locator('.js-chart-canvas')).toHaveCount(0);
});

test('dependency edits appear in History and undo/redo restores the edge', async ({ page, user, board }) => {
  const cards = db.find('cards', { boardId: board.boardId });
  const [source, target] = cards;
  await loginWithToken(page, user.id, user.token);
  await page.goto(`/b/${board.boardId}/${board.slug}/${source._id}`);
  await page.locator('.js-add-dependency').click();
  await page.locator(`.js-pick-dependency[data-target-id="${target._id}"]`).click();
  await expect.poll(() => db.find('changeHistory', { boardId: board.boardId, group: 'dependencies' }).length).toBe(1);
  let row = db.findOne('changeHistory', { boardId: board.boardId, group: 'dependencies' });
  expect(row.previousContent.value).toEqual([]);
  expect(row.newContent.value[0].cardId).toBe(target._id);
  expect(row.createdAt).toBeTruthy();
  await page.evaluate(boardId => Meteor.callAsync('changeHistory.undoLast', boardId), board.boardId);
  await expect.poll(() => db.getCard(source._id).cardDependencies || []).toEqual([]);
  await page.evaluate(boardId => Meteor.callAsync('changeHistory.redoLast', boardId), board.boardId);
  await expect.poll(() => (db.getCard(source._id).cardDependencies || []).map(dep => dep.cardId)).toContain(target._id);
  await page.locator(`.js-remove-dependency[data-target-id="${target._id}"]`).click();
  await expect.poll(() => db.getCard(source._id).cardDependencies || []).toEqual([]);
  await page.evaluate(boardId => Meteor.callAsync('changeHistory.undoLast', boardId), board.boardId);
  await expect.poll(() => (db.getCard(source._id).cardDependencies || []).map(dep => dep.cardId)).toContain(target._id);
});
