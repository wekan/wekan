'use strict';
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const { loginWithToken, waitForMeteor } = require('../helpers/auth');
const BASE_URL = process.env.WEKAN_BASE_URL || 'http://localhost:3000';
test('button rule cannot archive a foreign private card', async ({ page, user, user2, board }) => {
  const victim = db.seedBoard({ ownerId: user2.id, cardTitlesPerList: [['Private card']] });
  const card = db.find('cards', { boardId: victim.boardId })[0];
  const id = `button-boundary-${Date.now()}`;
  db.insertOne('triggers', { _id: id, boardId: board.boardId, activityType: 'button' });
  db.insertOne('actions', { _id: id, boardId: board.boardId, actionType: 'archive' });
  db.insertOne('rules', { _id: id, boardId: board.boardId, triggerId: id, actionId: id });
  try {
    await page.goto(`${BASE_URL}/sign-in`);
    await waitForMeteor(page);
    await loginWithToken(page, user.id, user.token);
    const result = await page.evaluate(async ({ ruleId, cardId }) => {
      try { await window.Meteor.callAsync('rules.runButton', ruleId, cardId); return 'unexpected-success'; }
      catch (error) { return error.error; }
    }, { ruleId: id, cardId: card._id });
    expect(result).toBe('not-authorized');
    expect(db.findOne('cards', { _id: card._id }).archived).toBe(card.archived);
  } finally {
    for (const collection of ['rules', 'triggers', 'actions']) db.deleteOne(collection, { _id: id });
    db.cleanup({ boardIds: [victim.boardId] });
  }
});
