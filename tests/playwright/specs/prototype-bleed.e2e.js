'use strict';
// PrototypeBleed (2026-10-02): the per-user layout methods wrote
// map[boardId][listId] with ids from the client, so '__proto__' polluted
// Object.prototype in the server process for every user.
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const { loginWithToken, openBoard } = require('../helpers/auth');

test('a __proto__ id is refused by the layout methods and blocks the account that sent it', async ({ page, user, board }) => {
  await loginWithToken(page, user.id, user.token);
  await openBoard(page, board.boardId, board.slug);
  const call = (name, ...args) => page.evaluate(async ({ name, args }) => {
    try { await Meteor.callAsync(name, ...args); return 'ok'; } catch (error) { return error.error || error.message; }
  }, { name, args });
  // Ordinary use works (negative)...
  expect(await call('setListCollapsedState', board.boardId, board.listIds[0], true)).toBe('ok');
  expect(db.findOne('users', { _id: user.id }).profile.collapsedLists[board.boardId][board.listIds[0]]).toBe(true);
  // ...and the attack is refused, recorded, and costs the attacker the account.
  for (const name of ['setListCollapsedState', 'setCardCollapsedState', 'setSwimlaneCollapsedState']) {
    expect(await call(name, '__proto__', 'polluted', true), name).not.toBe('ok');
  }
  await expect.poll(() => db.findOne('eventlog', { bleed: 'PrototypeBleed' })?.count).toBeGreaterThan(0);
  await expect.poll(() => db.findOne('users', { _id: user.id }).loginDisabled).toBe(true);
});
