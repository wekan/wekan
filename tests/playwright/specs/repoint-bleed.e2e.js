'use strict';
// RepointBleed (2026-10-02): rule triggers, webhook integrations and custom
// fields were allowed to a board admin (or writer) of the board the document
// was on BEFORE an update, so an update could move them to another board -
// a trigger to '*' matched every board's activity. Each is now refused over
// DDP, recorded in Admin Panel -> Problems, and the attacker's own board keeps
// working (negative).
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const { loginWithToken, openBoard } = require('../helpers/auth');

const mutate = (page, collection, op, ...args) => page.evaluate(async ({ collection, op, args }) => {
  try { await Meteor.callAsync(`/${collection}/${op}`, ...args); return 'accepted'; }
  catch (error) { return error.error === 403 || error.reason === 'Access denied' ? 'denied' : String(error.error || error.message); }
}, { collection, op, args });

test('triggers, webhooks and custom fields cannot be moved to another board', async ({ page, user, user2, board }) => {
  const victim = db.seedBoard({ ownerId: user2.id, cardTitlesPerList: [['Private card']] });
  const triggerId = `trg${Date.now()}`;
  const hookId = `hook${Date.now()}`;
  const fieldId = `cf${Date.now()}`;
  db.insertOne('triggers', { _id: triggerId, boardId: board.boardId, activityType: 'createCard', listName: '*', swimlaneName: '*', cardTitle: '*', userId: '*', createdAt: new Date() });
  db.insertOne('integrations', { _id: hookId, boardId: board.boardId, url: 'https://hooks.example/x', type: 'outgoing-webhooks', enabled: true, activities: ['all'], userId: user.id, createdAt: new Date() });
  db.insertOne('customFields', { _id: fieldId, boardIds: [board.boardId], name: 'Mine', type: 'text', settings: {}, showOnCard: false, automaticallyOnCard: false, alwaysOnCard: false, showLabelOnMiniCard: false, createdAt: new Date() });
  try {
    await loginWithToken(page, user.id, user.token);
    await openBoard(page, board.boardId, board.slug);
    expect(await mutate(page, 'triggers', 'update', { _id: triggerId }, { $set: { boardId: '*' } })).toBe('denied');
    expect(await mutate(page, 'triggers', 'update', { _id: triggerId }, { $unset: { boardId: 1 } })).toBe('denied');
    expect(await mutate(page, 'integrations', 'update', { _id: hookId }, { $set: { boardId: victim.boardId } })).toBe('denied');
    expect(await mutate(page, 'customFields', 'update', { _id: fieldId }, { $push: { boardIds: victim.boardId } })).toBe('denied');
    expect(await mutate(page, 'customFields', 'insert', { _id: `${fieldId}b`, boardIds: [board.boardId, victim.boardId], name: 'Planted', type: 'text', settings: {}, showOnCard: false, automaticallyOnCard: true, alwaysOnCard: true, showLabelOnMiniCard: false })).toBe('denied');
    expect(db.findOne('triggers', { _id: triggerId }).boardId).toBe(board.boardId);
    expect(db.findOne('integrations', { _id: hookId }).boardId).toBe(board.boardId);
    expect(db.findOne('customFields', { _id: fieldId }).boardIds).toEqual([board.boardId]);
    expect(db.findOne('customFields', { _id: `${fieldId}b` })).toBeNull();
    await expect.poll(() => db.findOne('eventlog', { bleed: 'RepointBleed' })?.count).toBeGreaterThanOrEqual(3);
    // Ordinary edits on one's own board still work (negative).
    expect(await mutate(page, 'integrations', 'update', { _id: hookId }, { $set: { title: 'Renamed' } })).toBe('accepted');
    expect(await mutate(page, 'customFields', 'update', { _id: fieldId }, { $set: { name: 'Renamed' } })).toBe('accepted');
  } finally {
    db.deleteMany('triggers', { _id: triggerId });
    db.deleteMany('integrations', { _id: hookId });
    db.deleteMany('customFields', { _id: { $in: [fieldId, `${fieldId}b`] } });
    db.cleanup({ boardIds: [victim.boardId] });
  }
});
