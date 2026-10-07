'use strict';
// Keyboard undo/redo recovery made visible: an undo whose reply never came is
// shown on its board, and can be retried or forgotten.
const { test, expect } = require('../fixtures');

const KEY = 'wekan-history-key-request';
const plant = (page, request) => page.evaluate(({ KEY, request }) => sessionStorage.setItem(KEY, JSON.stringify(request)), { KEY, request });
const stored = page => page.evaluate(KEY => sessionStorage.getItem(KEY), KEY);

for (const language of ['en', 'ku', 'ckb', 'tt', 'tk_TM', 'yi', 'ary', 'bho', 'mai', 'or_IN', 'kok', 'so', 'om', 'rw', 'rn', 'ny', 'st', 'tn', 'nso', 'zu', 'zu-ZA', 'xh', 'ss', 'nd', 'ts', 've', 'bi', 'tpi', 'mi', 'sm', 'pap', 'wa', 'ace', 'haw', 'wa-RR', 'fj', 'to', 'lg', 'wo', 'bua', 'cv', 'sah', 'bo', 'dz', 'ti', 'gv', 've-CC', 'rup', 'ak', 'ee', 'bm', 'qu', 'ay', 'gn', 'se', 'ff', 'ks', 'tlh', 'vo', 've-PP', 'kl', 'nah', 'zgh', 'iu', 'wal', 'tig', 'chr']) {
  const locale = require(`../../../imports/i18n/data/${language}.i18n.json`);
  test(`an unanswered undo is shown, and can be forgotten or retried in ${language}`, async ({ boardPage: page, board }) => {
    await page.evaluate(async language => { await Meteor.callAsync('setLanguage', language); }, language);
    const notice = page.locator('.js-history-recovery-notice');
    await expect(notice).toHaveCount(0);

    // As a lost reply leaves it, then a reload.
    await plant(page, { boardId: board.boardId, direction: 'undo', requestId: 'key-lostreply0000000000000000', at: Date.now() });
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(notice).toBeVisible();
    await expect(notice.locator('p').first()).toHaveText(locale['history-request-pending-undo']);
    await expect(notice.locator('p.quiet')).toHaveText(locale['history-request-hint']);
    await expect(notice.locator('.js-history-retry')).toHaveText(locale['history-request-retry']);
    await expect(notice.locator('.js-history-forget')).toHaveText(locale['history-request-forget']);

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
    await expect(notice.locator('p').first()).toHaveText(locale['history-request-pending-redo']);
    await notice.locator('.js-history-retry').click();
    await expect(notice).toHaveCount(0);
    expect(await stored(page)).toBeNull();
  });
}
