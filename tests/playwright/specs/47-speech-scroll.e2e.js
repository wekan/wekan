'use strict';

// #2499: speech-recognition browser commands act on the focused scroll region.
// Lists and card details therefore need to be keyboard-focusable and named,
// instead of leaving assistive software to guess among the page's scrollbars.

const { test, expect } = require('../fixtures');
const db = require('../helpers/db');

test.describe('#2499 focusable speech-scroll regions', () => {
  test('Page Down scrolls the focused list and opened card', async ({
    boardPage,
    board,
  }) => {
    const source = db.findOne('cards', {
      boardId: board.boardId,
      title: 'Alpha Card',
    });
    for (let index = 0; index < 30; index += 1) {
      const copy = {
        ...source,
        _id: db.uid('speech-card'),
        title: `Speech overflow ${index}`,
        sort: 1000 + index * 100,
      };
      db.insertOne('cards', copy);
    }
    db.updateOne(
      'cards',
      { _id: source._id },
      { $set: { description: 'Long card content\n'.repeat(200) } },
    );

    await boardPage.setViewportSize({ width: 1000, height: 500 });
    await boardPage.reload({ waitUntil: 'networkidle' });

    const listBody = boardPage
      .locator(`#js-list-${board.listIds[0]} .list-body`)
      .first();
    await expect(listBody).toHaveAttribute('role', 'region');
    await expect(listBody).toHaveAttribute('tabindex', '0');
    await expect(listBody).toHaveAttribute('aria-label', /List/i);
    await listBody.focus();
    await boardPage.keyboard.press('PageDown');
    await expect.poll(() => listBody.evaluate(element => element.scrollTop)).toBeGreaterThan(0);

    await boardPage
      .locator('.js-minicard')
      .filter({ hasText: 'Alpha Card' })
      .first()
      .click();
    const cardDetails = boardPage.locator('.js-card-details').first();
    await expect(cardDetails).toBeVisible();
    await expect(cardDetails).toHaveAttribute('role', 'region');
    await expect(cardDetails).toHaveAttribute('tabindex', '0');
    await expect(cardDetails).toHaveAttribute('aria-label', /Card.*Alpha Card/i);
    await cardDetails.focus();
    await boardPage.keyboard.press('PageDown');
    await expect
      .poll(() => cardDetails.evaluate(element => element.scrollTop))
      .toBeGreaterThan(0);
  });
});
