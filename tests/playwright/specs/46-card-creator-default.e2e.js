'use strict';

// #3823: a board created before allowsCreatorOnMinicard existed must not gain
// creator avatars during an upgrade. The separate card-details creator setting
// remains enabled, while the minicard setting starts unchecked and only an
// explicit click opts the board in.
//
// The setting moved from the minicard's own menu (Minicard menu / Show on
// Minicard) to Board Settings / Card (#6680 follow-up): "Show on Card"/"Show
// on Minicard" as menu entries are gone, and the same shared table now opens
// from the board's cog menu with both columns shown side by side.

const { test, expect } = require('../fixtures');
const db = require('../helpers/db');

test.describe('#3823 legacy board creator visibility', () => {
  test('stays off until explicitly enabled in Show on Minicard', async ({
    boardPage,
    board,
  }) => {
    db.updateOne(
      'boards',
      { _id: board.boardId },
      {
        $set: { allowsCreator: true },
        $unset: { allowsCreatorOnMinicard: '' },
      },
    );
    await boardPage.reload({ waitUntil: 'networkidle' });

    const card = boardPage
      .locator('.js-minicard')
      .filter({ hasText: 'Alpha Card' })
      .first();
    await expect(card).toBeVisible();
    await expect(card.locator('.minicard-creator')).toHaveCount(0);

    // Board Settings / Card, from the board's own cog menu inside the sidebar.
    await boardPage.locator('.js-toggle-page-sidebar').click();
    await boardPage.locator('.board-sidebar.sidebar').waitFor({ state: 'visible' });
    await boardPage.locator('.board-sidebar .js-open-board-menu').click();
    await boardPage.locator('.js-pop-over').waitFor();
    await boardPage.locator('.js-pop-over .js-open-board-card-settings').click();
    const creatorSetting = boardPage.locator(
      '.js-pop-over .js-field-has-creator-on-minicard',
    );
    await expect(creatorSetting).toBeVisible();
    await expect(creatorSetting).not.toHaveClass(/is-checked/);

    await creatorSetting.click();
    await expect
      .poll(
        () =>
          db.findOne('boards', { _id: board.boardId })
            ?.allowsCreatorOnMinicard,
      )
      .toBe(true);
    await expect(card.locator('.minicard-creator')).toBeVisible();
    await expect(creatorSetting).toHaveClass(/is-checked/);
  });
});
