'use strict';
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const { waitForMeteor } = require('../helpers/auth');
const BASE_URL = process.env.WEKAN_BASE_URL || 'http://localhost:3000';
test('anonymous source viewer does not receive a stale private deposit', async ({ page, user2, board }) => {
  const victim = db.seedBoard({ ownerId: user2.id, cardTitlesPerList: [['Private deposit sentinel']] });
  const original = db.getBoard(board.boardId);
  db.updateOne('boards', { _id: board.boardId }, { $set: { permission: 'public', subtasksDefaultBoardId: victim.boardId } });
  try {
    await page.goto(`${BASE_URL}/sign-in`);
    await waitForMeteor(page);
    const exposed = await page.evaluate(({ boardId, privateBoardId }) => new Promise((resolve, reject) => {
      const subscription = window.Meteor.subscribe('board', boardId, false, {
        onReady() {
          const store = window.Meteor.connection._stores.cards;
          const cards = store ? store._getCollection().find({ boardId: privateBoardId }).fetch() : [];
          subscription.stop();
          resolve(cards);
        }, onStop(error) { if (error) reject(error); },
      });
    }), { boardId: board.boardId, privateBoardId: victim.boardId });
    expect(exposed).toHaveLength(0);
  } finally {
    const modifier = { $set: { permission: original.permission } };
    if (original.subtasksDefaultBoardId) modifier.$set.subtasksDefaultBoardId = original.subtasksDefaultBoardId;
    else modifier.$unset = { subtasksDefaultBoardId: '' };
    db.updateOne('boards', { _id: board.boardId }, modifier);
    db.cleanup({ boardIds: [victim.boardId] });
  }
});
