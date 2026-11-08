'use strict';
// GHSA-6xqf-jh8x-4wxc (2026-11-08): an assigned-only member passed the
// board-level write check of archiveSelectedCards and createBoardFromCard for
// every card on the board, so they archived - and hid - cards not assigned to
// them, and turned any card into a linked-board card. Both methods now ask the
// card as well, and a refusal is recorded in Admin Panel -> Problems.
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const { loginWithToken } = require('../helpers/auth');

const BASE_URL = process.env.WEKAN_BASE_URL || 'http://localhost:3000';

const call = (page, name, ...args) => page.evaluate(async ({ name, args }) => {
  try { return { result: await window.Meteor.callAsync(name, ...args) }; } catch (error) { return { error: error.error }; }
}, { name, args });

test('an assigned-only member archives and converts only the cards assigned to them', async ({ page, user2, board }) => {
  const [theirs, mine] = db.find('cards', { boardId: board.boardId });
  const original = db.getBoard(board.boardId).members;
  db.updateOne('boards', { _id: board.boardId }, { $set: { members: [...original,
    { userId: user2.id, isActive: true, isAdmin: false, isNormalAssignedOnly: true }] } });
  db.updateOne('cards', { _id: theirs._id }, { $set: { assignees: [] } });
  db.updateOne('cards', { _id: mine._id }, { $set: { assignees: [user2.id] } });
  const recorded = () => db.find('eventlog', { bleed: 'UnassignedArchiveBleed' })
    .filter(row => /archiveSelectedCards|createBoardFromCard/.test(row.source || ''))
    .reduce((sum, row) => sum + (row.count || 1), 0);
  const before = recorded();
  try {
    await page.goto(`${BASE_URL}/sign-in`);
    await loginWithToken(page, user2.id, user2.token);

    // The reported attack: a card that is not theirs.
    expect((await call(page, 'archiveSelectedCards', board.boardId, [theirs._id])).error).toBe('not-authorized');
    expect((await call(page, 'createBoardFromCard', theirs._id, 'x')).error).toBe('not-authorized');
    // A selection with one card not theirs changes none of it.
    expect((await call(page, 'archiveSelectedCards', board.boardId, [mine._id, theirs._id])).error).toBe('not-authorized');
    expect(db.findOne('cards', { _id: theirs._id }).archived).not.toBe(true);
    expect(db.findOne('cards', { _id: mine._id }).archived).not.toBe(true);
    expect(db.findOne('cards', { _id: theirs._id }).type).not.toBe('cardType-linkedBoard');
    // Each attempt is visible in Admin Panel -> Problems.
    await expect.poll(recorded).toBeGreaterThanOrEqual(before + 3);

    // Their own card: still allowed.
    expect((await call(page, 'archiveSelectedCards', board.boardId, [mine._id])).result).toEqual({ archived: 1 });
    expect(db.findOne('cards', { _id: mine._id }).archived).toBe(true);
  } finally {
    db.updateOne('boards', { _id: board.boardId }, { $set: { members: original } });
    db.updateOne('cards', { _id: mine._id }, { $set: { archived: false } });
  }
});
