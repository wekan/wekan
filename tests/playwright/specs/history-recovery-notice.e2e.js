'use strict';
// Keyboard undo/redo recovery made visible: an undo whose reply never came is
// shown on its board, and can be retried or forgotten.
const { test, expect } = require('../fixtures');

const KEY = 'wekan-history-key-request';
const plant = (page, request) => page.evaluate(({ KEY, request }) => sessionStorage.setItem(KEY, JSON.stringify(request)), { KEY, request });
const stored = page => page.evaluate(KEY => sessionStorage.getItem(KEY), KEY);

test('an unanswered undo is shown, and can be forgotten or retried', async ({ boardPage: page, board }) => {
  const notice = page.locator('.js-history-recovery-notice');
  await expect(notice).toHaveCount(0);

  // As a lost reply leaves it, then a reload.
  await plant(page, { boardId: board.boardId, direction: 'undo', requestId: 'key-lostreply0000000000000000', at: Date.now() });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(notice).toBeVisible();
  await expect(notice).toContainText('undo has not been confirmed');

  await notice.locator('.js-history-forget').click();
  await expect(notice).toHaveCount(0);
  expect(await stored(page)).toBeNull();

  // Negative: a request for another board, or one too old to mean anything,
  // is not shown here.
  await plant(page, { boardId: 'another-board', direction: 'redo', requestId: 'key-otherboard00000000000000', at: Date.now() });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => typeof Meteor !== 'undefined' && Meteor.status().connected);
  await expect(notice).toHaveCount(0);
  await plant(page, { boardId: board.boardId, direction: 'redo', requestId: 'key-tooold00000000000000000', at: Date.now() - 11 * 60 * 1000 });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => typeof Meteor !== 'undefined' && Meteor.status().connected);
  await expect(notice).toHaveCount(0);

  // Try again: the server answers (here: nothing to redo), and the notice goes.
  await plant(page, { boardId: board.boardId, direction: 'redo', requestId: 'key-retrythis000000000000000', at: Date.now() });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(notice).toContainText('redo has not been confirmed');
  await notice.locator('.js-history-retry').click();
  await expect(notice).toHaveCount(0);
  expect(await stored(page)).toBeNull();
});
