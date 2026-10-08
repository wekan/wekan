'use strict';
// Multi-Selection offers the same custom card color as one card's popup.
//
// Reported by email: only the ready-made palette could be put on several cards
// at once, so a lighter yellow (readable card text) had to be set card by
// card. Now the Multi-Selection color popup has the same color wheel, writes
// the same card.color through the same Card.setColor and server allow rule,
// and offers the custom colors already used on the board beside the palette.
//
// Negative: a linked card whose source board is comment-only for the user is
// in the selection and is NOT changed; a crafted color sent straight to the
// server is refused by the Cards schema.
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const BoardPage = require('../pages/BoardPage');

const LIGHT_YELLOW = '#fff3b0';

test('Multi-Selection applies a custom light yellow to every editable selected card', async ({ boardPage, board, user, user2 }) => {
  const [listA] = board.listIds;
  const alpha = db.findOne('cards', { boardId: board.boardId, title: 'Alpha Card' });
  const secondId = db.uid('card');
  db.insertOne('cards', { ...alpha, _id: secondId, title: 'Second Card', cardNumber: 2, sort: alpha.sort + 1 });

  // A card the user may not edit: a link to a card on a board where the user
  // is comment-only (the source role blocks delegated writes).
  const source = db.seedBoard({ ownerId: user2.id, cardTitlesPerList: [['Comment-only source']] });
  db.updateOne('boards', { _id: source.boardId }, { $push: { members: {
    userId: user.id, isActive: true, isAdmin: false, isNoComments: false,
    isCommentOnly: true, isWorker: false, isReadOnly: false,
  } } });
  const sourceCard = db.findOne('cards', { boardId: source.boardId, title: 'Comment-only source' });
  const linkedId = db.uid('link');
  db.insertOne('cards', {
    ...sourceCard, _id: linkedId, boardId: board.boardId, swimlaneId: board.swimlaneId,
    listId: listA, linkedId: sourceCard._id, type: 'cardType-linkedCard', sort: alpha.sort + 2,
  });

  try {
    await boardPage.reload();
    const bp = new BoardPage(boardPage);
    await expect(bp.minicard(listA, 'Second Card')).toBeVisible({ timeout: 15_000 });

    await boardPage.locator('.js-multiselection-activate').click();
    await bp.openListMenu(listA);
    await bp.clickListMenuItem('.js-select-cards');
    await boardPage.locator('.board-sidebar .js-selection-color').click();

    const popup = boardPage.locator('.pop-over');
    const wheel = popup.locator('input.js-selection-color-wheel');
    await expect(wheel).toBeVisible();
    await wheel.fill(LIGHT_YELLOW);
    await popup.locator('.js-submit').click();

    await expect.poll(() => [alpha._id, secondId].map(id => db.findOne('cards', { _id: id }).color))
      .toEqual([LIGHT_YELLOW, LIGHT_YELLOW]);
    // The card the user may not edit keeps its (absent) color.
    expect(db.findOne('cards', { _id: sourceCard._id }).color || null).toBe(null);
    expect(db.findOne('cards', { _id: linkedId }).color || null).toBe(null);

    // Both minicards show it, with readable (black) text on the light yellow.
    for (const title of ['Alpha Card', 'Second Card']) {
      const minicard = bp.minicard(listA, title).locator('.minicard').first();
      await expect(minicard).toHaveCSS('background-color', 'rgb(255, 243, 176)');
      await expect(minicard).toHaveCSS('color', 'rgb(0, 0, 0)');
    }

    // The color now sits beside the palette for the next cards. The sidebar
    // re-renders while the cards' new colors arrive, so the button can be
    // replaced mid-click under load: click until the popup is really open.
    for (let attempt = 0; ; attempt++) {
      try {
        await boardPage.locator('.board-sidebar .js-selection-color').click({ timeout: 5000 });
        await popup.locator('input.js-selection-color-wheel').waitFor({ state: 'visible', timeout: 5000 });
        break;
      } catch (error) {
        if (attempt === 2) throw error;
      }
    }
    await expect(popup.locator(`.js-custom-palette-color[data-color="${LIGHT_YELLOW}"]`)).toBeVisible();

    // A crafted color sent straight to the server is refused by the schema.
    const results = await boardPage.evaluate(async ({ cardId, values }) => {
      const out = [];
      for (const color of values) {
        try {
          await window.Meteor.callAsync('/cards/update', { _id: cardId }, { $set: { color } });
          out.push('accepted');
        } catch (error) {
          out.push('refused');
        }
      }
      return out;
    }, { cardId: alpha._id, values: ['red;background:url(https://evil.example/x)', '</style>', 'javascript:alert(1)'] });
    expect(results).toEqual(['refused', 'refused', 'refused']);
    expect(db.findOne('cards', { _id: alpha._id }).color).toBe(LIGHT_YELLOW);
  } finally {
    db.cleanup({ boardIds: [source.boardId] });
  }
});
