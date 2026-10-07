'use strict';
// Nextcloud Deck-style auto-archive: a board admin sets or clears the number
// of days in Board Settings. (The hourly job itself runs against real
// collections in server/lib/tests/autoArchiveCards.tests.js.)
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');

for (const language of ['en', 'chr', 'iu', 'wal', 'zgh', 'tig', 'dz', 'kl', 'nah', 'vo', 'sah', 'ace', 'bm', 'ak', 'lg', 'ay', 'qu', 'gn', 'ee', 'wo', 'ff', 'tlh', 'bo', 'bua', 'cv', 'ks', 'ti', 'gv', 've-CC', 've-PP', 've']) {
  test(`a board admin turns auto-archive on and off in ${language}`, async ({ boardPage: page, board }) => {
    const strings = require(`../../../imports/i18n/data/${language}.i18n.json`);
    await page.evaluate(language => Meteor.callAsync('setLanguage', language), language);
    await page.evaluate(() => {
      Popup.close();
      const opener = document.querySelector('.js-board-info-on-my-boards') || document.body;
      Popup.open('boardInfoOnMyBoards')({ currentTarget: opener, target: opener, preventDefault() {}, stopPropagation() {} });
    });
    const input = page.locator('.js-auto-archive-days');
    await expect(input).toBeVisible();
    await expect(input).toHaveValue('');
    await expect(page.locator('label[for="auto-archive-days"]')).toContainText(strings['auto-archive-days']);
    await expect(input).toHaveAttribute('placeholder', strings['auto-archive-off']);
    await expect(input.locator('..').locator('p.quiet')).toHaveText(strings['auto-archive-hint']);
    if (language !== 'en') {
      await expect(page.locator('label[for="auto-archive-days"]')).not.toContainText('Archive cards after');
    }
    await input.fill('30');
    await input.dispatchEvent('change');
    await expect.poll(() => db.findOne('boards', { _id: board.boardId }).autoArchiveInactiveDays).toBe(30);
    // Negative: a value that is not a whole number of days from 1 to 3650 is off.
    for (const bad of ['0', '-3', '4000']) {
      await input.fill(bad);
      await input.dispatchEvent('change');
      await expect.poll(() => db.findOne('boards', { _id: board.boardId }).autoArchiveInactiveDays).toBeUndefined();
      await input.fill('30');
      await input.dispatchEvent('change');
      await expect.poll(() => db.findOne('boards', { _id: board.boardId }).autoArchiveInactiveDays).toBe(30);
    }
    await input.fill('');
    await input.dispatchEvent('change');
    await expect.poll(() => db.findOne('boards', { _id: board.boardId }).autoArchiveInactiveDays).toBeUndefined();
  });
}
