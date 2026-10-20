'use strict';
// #6788: adding a colleague to a board failed when the email was typed in a
// different case than the directory stores it ("Jan.Jansen@Example.com"), and
// the member search could hide the colleague behind five other matches and
// offered disabled accounts. Drives the two server methods the Members dialog
// calls, as the logged-in board member.
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');

const call = (page, name, ...args) =>
  page.evaluate(async ({ name, args }) => {
    try { return { ok: await Meteor.callAsync(name, ...args) }; }
    catch (error) { return { error: `${error.error}: ${error.reason || error.message}` }; }
  }, { name, args });
const isMember = (boardId, userId) =>
  (db.findOne('boards', { _id: boardId }).members || []).some(m => m.userId === userId && m.isActive);

test('an existing colleague is invited by email in any letter case', async ({ boardPage: page, board, user2 }) => {
  const stored = user2.email.replace(/^e2e_/, 'E2E_').replace('@wekan-test.invalid', '@WeKan-Test.INVALID');
  db.updateOne('users', { _id: user2.id }, { $set: { 'emails.0.address': stored } });
  const result = await call(page, 'inviteUserToBoard', stored.toLowerCase(), board.boardId);
  expect(result.error).toBeUndefined();
  expect(isMember(board.boardId, user2.id)).toBe(true);
  // negative: no second account was created for the same address
  expect(db.countDocuments('users', { 'emails.address': { $regex: `^${stored.replace(/[.]/g, '\\.')}$`, $options: 'i' } })).toBe(1);
});

test('negative: a similar but different address is not taken for the colleague', async ({ boardPage: page, board, user2 }) => {
  const other = `x${user2.email}`;
  await call(page, 'inviteUserToBoard', other, board.boardId);
  expect(isMember(board.boardId, user2.id)).toBe(false);
});

test('search offers no disabled account, and finds a colleague behind five others', async ({ boardPage: page, board, user2 }) => {
  const tag = `zz${Date.now()}`;
  const disabled = [];
  for (let i = 0; i < 6; i += 1) {
    const { id } = db.seedUser();
    db.updateOne('users', { _id: id }, { $set: { username: `${tag}_off${i}`, loginDisabled: true } });
    disabled.push(id);
  }
  db.updateOne('users', { _id: user2.id }, { $set: { username: `${tag}_colleague` } });
  const result = await call(page, 'searchUsers', tag, board.boardId);
  expect(result.error).toBeUndefined();
  const names = result.ok.map(u => u.username);
  expect(names).toContain(`${tag}_colleague`);
  expect(names.some(n => n.includes('_off'))).toBe(false);
  expect(names.length).toBeLessThanOrEqual(5);
  db.deleteMany('users', { _id: { $in: disabled } });
});
