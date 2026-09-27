'use strict';
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const { loginWithToken, navigateInApp } = require('../helpers/auth');

test('failed authenticated exports fold safe route diagnostics without storing request tokens', async ({ page, request, user, adminUser, board }) => {
  const selector = { stream: 'api', source: 'apiMiddleware', action: 'failed',
    api: 'GET /api/boards/:boardId/charts/:chartKey/exportExcel (failed)' };
  const before = db.find('eventlog', selector).reduce((sum, row) => sum + row.count, 0);
  const marker = `private-${board.boardId}`;
  for (let index = 0; index < 2; index++) {
    const response = await request.get(`/api/boards/${board.boardId}/charts/scrumSprint/exportExcel?authToken=${encodeURIComponent(user.token)}&sprintId=${marker}-${index}`);
    expect(response.status()).toBe(500);
    expect(await response.text()).toBe('Internal server error');
  }
  await expect.poll(() => db.find('eventlog', selector).reduce((sum, row) => sum + row.count, 0)).toBe(before + 2);
  const rows = db.find('eventlog', selector);
  expect(rows).toHaveLength(1);
  expect(JSON.stringify(rows)).not.toContain(user.token);
  expect(JSON.stringify(rows)).not.toContain(marker);
  expect(rows[0].detail).toContain('exception text are omitted');
  await loginWithToken(page, adminUser.id, adminUser.token);
  await navigateInApp(page, '/admin/problems/api');
  await expect(page.locator('.main-body')).toContainText(selector.api);
  await expect(page.locator('.main-body')).not.toContainText(user.token);
  await expect(page.locator('.main-body')).not.toContainText(marker);
});
