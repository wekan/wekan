'use strict';
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const { loginWithToken, waitForMeteor } = require('../helpers/auth');
const BASE_URL = process.env.WEKAN_BASE_URL || 'http://localhost:3000';
test.describe('Private-only board visibility policy', () => {
  test.describe.configure({ mode: 'serial' });
  test('public creation and card conversion remain private', async ({ page, user, board }) => {
    const id = 'tableVisibilityMode-allowPrivateOnly';
    const prior = db.findOne('tableVisibilityModeSettings', { _id: id });
    if (prior) db.updateOne('tableVisibilityModeSettings', { _id: id }, { $set: { booleanValue: true } });
    else db.insertOne('tableVisibilityModeSettings', { _id: id, booleanValue: true, sort: 0 });
    const created = [];
    try {
      db.updateOne('boards', { _id: board.boardId }, { $set: { permission: 'public' } });
      await page.goto(`${BASE_URL}/sign-in`);
      await waitForMeteor(page);
      await loginWithToken(page, user.id, user.token);
      const result = await page.evaluate(async cardId => {
        const first = await window.Meteor.callAsync('createBoardWithInitialSwimlanes', { title: 'Policy test', slug: 'policy-test', permission: 'public' });
        const second = await window.Meteor.callAsync('createBoardFromCard', cardId, 'Converted policy test');
        return { first, second };
      }, db.find('cards', { boardId: board.boardId })[0]._id);
      for (const value of Object.values(result)) {
        const boardId = typeof value === 'string' ? value : value.boardId;
        created.push(boardId);
        expect(db.getBoard(boardId).permission).toBe('private');
      }
    } finally {
      db.cleanup({ boardIds: created.filter(Boolean) });
      if (prior) db.updateOne('tableVisibilityModeSettings', { _id: id }, { $set: { booleanValue: prior.booleanValue } });
      else db.deleteOne('tableVisibilityModeSettings', { _id: id });
    }
  });
});
