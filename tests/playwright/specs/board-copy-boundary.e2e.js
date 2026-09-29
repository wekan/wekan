'use strict';
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const { loginWithToken } = require('../helpers/auth');

async function copy(page, boardId, properties) {
  return page.evaluate(async ({ boardId, properties }) => {
    try { return { id: await Meteor.callAsync('copyBoard', boardId, properties) }; }
    catch (error) { return { error: error.error }; }
  }, { boardId, properties });
}

test('board copy cannot replace the authorized source identity', async ({ page, user, user2, board }) => {
  const secret = db.seedBoard({ ownerId: user2.id, cardTitlesPerList: [['PRIVATE-BOARD-COPY-FIXTURE']] });
  let before = [];
  const copies = () => db.find('boards', { 'members.userId': user.id }).filter(row => !before.includes(row._id));
  try {
    await loginWithToken(page, user.id, user.token);
    before = db.find('boards', { 'members.userId': user.id }).map(row => row._id);
    const result = await copy(page, board.boardId, { _id: secret.boardId });
    const titles = result.id ? db.find('cards', { boardId: result.id }).map(row => row.title) : [];
    expect(result.error, `Copied cards: ${JSON.stringify(titles)}`).toBe('invalid-copy-properties');
    expect(copies()).toHaveLength(0);
    await expect.poll(() => db.findOne('eventlog', { bleed: 'CopyIdentityBleed', username: user.username, source: 'method:copyBoard' })?.count).toBeGreaterThan(0);
  } finally { db.cleanup({ boardIds: [secret.boardId, ...copies().map(row => row._id)] }); }
});

test('board copy accepts supported options, leaves source intact and rejects malformed input harmlessly', async ({ page, user, board }) => {
  await loginWithToken(page, user.id, user.token);
  const original = db.findOne('boards', { _id: board.boardId });
  const before = db.find('boards', { 'members.userId': user.id }).map(row => row._id);
  const copies = () => db.find('boards', { 'members.userId': user.id }).filter(row => !before.includes(row._id));
  try {
    for (const properties of [{ title: 42 }, { sort: '1' }, { sort: null }, { type: 'invalid' }, { withoutCards: 'false' }]) {
      expect((await copy(page, board.boardId, properties)).error).toBe('invalid-copy-properties');
      expect(copies()).toHaveLength(0);
    }
    expect((await copy(page, board.boardId, { copyOptions: { cards: 'false' } })).error).toBe('invalid-copy-options');
    expect(db.findOne('users', { _id: user.id }).loginDisabled).not.toBe(true);
    expect(db.countDocuments('eventlog', { bleed: 'CopyIdentityBleed', username: user.username })).toBe(0);
    for (const properties of [{}, { title: 'Supported renamed copy', sort: 20, type: 'board', withoutCards: true }, { copyOptions: { cards: false, scrum: false } }]) {
      const result = await copy(page, board.boardId, properties);
      expect(result.error).toBeUndefined();
      const created = db.findOne('boards', { _id: result.id });
      expect(created.members).toEqual(original.members);
      expect(created.permission).toEqual(original.permission);
      expect(created.withoutCards).toBeUndefined();
      expect(created.copyOptions).toBeUndefined();
      if (properties.withoutCards || properties.copyOptions) expect(db.find('cards', { boardId: result.id })).toHaveLength(0);
    }
    expect(db.findOne('boards', { _id: board.boardId })).toEqual(original);
  } finally { db.cleanup({ boardIds: copies().map(row => row._id) }); }
});
