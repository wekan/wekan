'use strict';

/**
 * #6917: Copy Checklist to a board that loads lazily. The destination's card
 * dropdown read the `board` publication, which ships no cards for a board over
 * the lazy threshold, so it stayed empty. tests/destinationCards6917.test.cjs
 * runs the publication and the dialog; this runs the popup against a real
 * server whose destination board stays over the threshold while it is open.
 */

const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const BoardPage = require('../pages/BoardPage');
const CardPage = require('../pages/CardPage');

test('copy a checklist to a card of a lazily loaded board', async ({ boardPage: page, board, user }) => {
  const dest = db.seedBoard({ ownerId: user.id, title: 'Large destination', cardTitlesPerList: [['Target card']] });
  const threshold = await page.evaluate(() => Meteor.settings.public.cardsLoadingLazyThreshold ?? 500);
  const template = db.findOne('cards', { boardId: dest.boardId, title: 'Target card' });
  // The padding lives in another list, so the target list holds one card.
  db.insertMany('cards', Array.from({ length: threshold + 1 }, (_, i) => ({ ...template,
    _id: db.uid('lazy-padding'), title: 'Lazy padding', listId: dest.listIds[1], sort: 1000 + i })));
  try {
    await new BoardPage(page).clickCard(board.listIds[0], 'Alpha Card');
    const card = new CardPage(page);
    await card.waitForOpen();
    await card.addChecklist('Template steps');
    await card.root.locator('.js-checklist').filter({ hasText: 'Template steps' }).first()
      .locator('.js-open-checklist-details-menu').click();
    const pop = page.locator('.js-pop-over');
    await pop.locator('.js-copy-checklist').click();

    await pop.locator('.js-select-boards').selectOption(dest.boardId);
    await expect(pop.locator('.js-select-lists option')).not.toHaveCount(0);
    await pop.locator('.js-select-lists').selectOption(dest.listIds[0]);
    await expect(pop.locator('.js-select-cards option', { hasText: 'Target card' })).toHaveCount(1);
    // Negative: the dropdown holds the chosen list's cards, not the padding.
    await expect(pop.locator('.js-select-cards option', { hasText: 'Lazy padding' })).toHaveCount(0);
    await expect(pop.locator('.js-done')).toBeEnabled();
    await pop.locator('.js-done').click();

    await expect.poll(() => db.countDocuments('checklists', { cardId: template._id, title: 'Template steps' })).toBe(1);
  } finally {
    db.cleanup({ boardIds: [dest.boardId] });
  }
});
