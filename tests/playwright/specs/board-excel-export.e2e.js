'use strict';

const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const BoardPage = require('../pages/BoardPage');
const ExcelJS = require('../../../node_modules/@wekanteam/exceljs');

async function expectWorkbook(response) {
  expect(response.status()).toBe(200);
  expect(response.headers()['content-type']).toContain('spreadsheetml.sheet');
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(await response.body());
  const values = [];
  workbook.eachSheet(sheet => sheet.eachRow(row => values.push(JSON.stringify(row.values))));
  expect(values.join('\n')).toContain('Alpha Card');
}

test('a missing board Excel export returns 404 with or without a token', async ({ request, user }) => {
  const url = `/api/boards/${db.uid('missing')}/exportExcel`;
  for (const suffix of ['', `?authToken=${encodeURIComponent(user.token)}`]) {
    const response = await request.get(url + suffix);
    expect(response.status()).toBe(404);
    expect(response.headers()['content-type']).toBe('text/plain; charset=utf-8');
    expect(response.headers()['content-disposition']).toBeUndefined();
    expect(await response.text()).toBe('Board not found');
  }
});

test('the board menu exports Excel and a deleted board link returns 404', async ({ boardPage: page, board }) => {
  await new BoardPage(page).openSidebar();
  await page.locator('.board-sidebar .js-open-board-menu').click();
  await page.locator('.js-pop-over .js-export-board').click();
  const anchor = page.locator('.js-pop-over a[href*="/exportExcel?"]');
  await expect(anchor).toBeVisible();
  const href = await anchor.getAttribute('href');
  await expectWorkbook(await page.request.get(href));

  db.deleteOne('boards', { _id: board.boardId });
  const response = await page.goto(href);
  expect(response.status()).toBe(404);
  expect(response.headers()['content-type']).toBe('text/plain; charset=utf-8');
  expect(response.headers()['content-disposition']).toBeUndefined();
  expect(await response.text()).toBe('Board not found');
  await expect(page.locator('body')).toHaveText('Board not found');
});

test('public board Excel exports still produce both workbook layouts', async ({ request, board }) => {
  db.updateOne('boards', { _id: board.boardId }, { $set: { permission: 'public' } });
  for (const suffix of ['', '?fields=description']) {
    await expectWorkbook(await request.get(`/api/boards/${board.boardId}/exportExcel${suffix}`));
  }
});

test('private board Excel exports still refuse an unrelated member', async ({ request, board, user2 }) => {
  const response = await request.get(`/api/boards/${board.boardId}/exportExcel?authToken=${encodeURIComponent(user2.token)}`);
  expect(response.status()).toBe(403);
  expect(await response.text()).not.toContain('Alpha Card');
});
