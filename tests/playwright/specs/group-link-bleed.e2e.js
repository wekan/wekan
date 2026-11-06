'use strict';
// GroupLinkBleed (GHSA-v544-rmr5-38gx, 2026-11-06): a board admin skipped the
// board methods' checks by writing the board document over DDP - attaching a
// team they do not belong to (#5141), and pushing any user into members past
// inviteUserToBoard (#6116).
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const { loginWithToken, openBoard } = require('../helpers/auth');

test('a foreign team or a new member cannot be written straight onto the board', async ({ page, user, user2, board }) => {
  const foreign = `glbForeign${Date.now()}`;
  const own = `glbOwn${Date.now()}`;
  const original = db.getBoard(board.boardId);
  db.setUserGroups({ userId: user.id, teams: [{ teamId: own, teamDisplayName: 'Own' }] });
  try {
    await loginWithToken(page, user.id, user.token);
    await openBoard(page, board.boardId, board.slug);
    const write = (modifier) => page.evaluate(async ({ boardId, modifier }) => {
      try { await Meteor.callAsync('/boards/update', { _id: boardId }, modifier); return 'written'; }
      catch (error) { return 'denied'; }
    }, { boardId: board.boardId, modifier });

    // The method refuses the foreign team (the control) ...
    const method = await page.evaluate(({ boardId, foreign }) => Meteor.callAsync('setBoardTeams',
      [{ teamId: foreign, teamDisplayName: 'x', isActive: true }], [], boardId).then(() => 'ok', e => e.error), { boardId: board.boardId, foreign });
    expect(method).toBe('not-authorized');
    // ... and so does the collection now.
    expect(await write({ $set: { teams: [{ teamId: foreign, teamDisplayName: 'x', isActive: true }] } })).toBe('denied');
    expect((db.getBoard(board.boardId).teams || []).some(t => t.teamId === foreign)).toBe(false);

    // The member variant.
    expect(await write({ $push: { members: { userId: user2.id, isAdmin: false, isActive: true } } })).toBe('denied');
    expect(db.getBoard(board.boardId).members.some(m => m.userId === user2.id)).toBe(false);

    // Both attempts are in Admin Panel -> Problems; medium never disables.
    await expect.poll(() => db.findOne('eventlog', { bleed: 'GroupLinkBleed', source: 'ddp:boards.update' })?.count).toBeGreaterThanOrEqual(2);
    expect(db.findOne('users', { _id: user.id }).loginDisabled).toBeFalsy();

    // Negative: the method still adds the admin's own team, and a role change
    // written by the client still works.
    const ownTeam = await page.evaluate(({ boardId, own }) => Meteor.callAsync('setBoardTeams',
      [{ teamId: own, teamDisplayName: 'Own', isActive: true }], [], boardId).then(() => 'ok', e => e.error), { boardId: board.boardId, own });
    expect(ownTeam).toBe('ok');
    expect(db.getBoard(board.boardId).teams.some(t => t.teamId === own)).toBe(true);
    const index = db.getBoard(board.boardId).members.findIndex(m => m.userId === user.id);
    expect(await write({ $set: { [`members.${index}.isWorker`]: false } })).toBe('written');
  } finally {
    db.updateOne('boards', { _id: board.boardId }, { $set: { members: original.members, teams: original.teams || [] } });
    db.setUserGroups({ userId: user.id, teams: [] });
  }
});
