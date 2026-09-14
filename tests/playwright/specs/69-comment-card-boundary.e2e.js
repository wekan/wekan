'use strict';
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const { loginWithToken, waitForMeteor } = require('../helpers/auth');
const BASE_URL = process.env.WEKAN_BASE_URL || 'http://localhost:3000';
test('DDP cannot attach a comment to a foreign private-board card', async ({ page, user, user2, board }) => {
  const victim = db.seedBoard({ ownerId: user2.id, cardTitlesPerList: [['Private card']] });
  const card = db.find('cards', { boardId: victim.boardId })[0];
  const marker = `boundary-${Date.now()}`;
  try {
    await page.goto(`${BASE_URL}/sign-in`);
    await waitForMeteor(page);
    await loginWithToken(page, user.id, user.token);
    const result = await page.evaluate(async ({ boardId, cardId, userId, text }) => {
      try {
        await window.Meteor.callAsync('/card_comments/insert', { boardId, cardId, userId, text });
        return 'unexpected-success';
      } catch (error) { return error.error; }
    }, { boardId: board.boardId, cardId: card._id, userId: user.id, text: marker });
    expect(result).toBe(403);
    expect(db.find('card_comments', { text: marker })).toHaveLength(0);
  } finally {
    db.deleteMany('card_comments', { text: marker });
    db.cleanup({ boardIds: [victim.boardId] });
  }
});
