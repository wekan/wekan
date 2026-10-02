'use strict';
// RepointBleed (2026-10-02): rule triggers, webhook integrations and custom
// fields were allowed to a board admin (or writer) of the board the document
// was on BEFORE an update, so an update could move them to another board -
// a trigger to '*' matched every board's activity. Each is now refused over
// DDP, recorded in Admin Panel -> Problems, and costs the attacker the
// account; an admin's ordinary edits still work (negative).
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const { loginWithToken, openBoard } = require('../helpers/auth');

const mutate = (page, collection, op, ...args) => page.evaluate(async ({ collection, op, args }) => {
  try { await Meteor.callAsync(`/${collection}/${op}`, ...args); return 'accepted'; }
  catch (error) { return 'denied'; }
}, { collection, op, args });

const seedDocs = boardId => {
  const tag = `${Date.now()}${require('crypto').randomBytes(4).toString('hex')}`;
  db.insertOne('triggers', { _id: `trg${tag}`, boardId, activityType: 'createCard', listName: '*', swimlaneName: '*', cardTitle: '*', userId: '*', createdAt: new Date() });
  db.insertOne('integrations', { _id: `hook${tag}`, boardId, url: 'https://hooks.example/x', type: 'outgoing-webhooks', enabled: true, activities: ['all'], userId: 'x', createdAt: new Date() });
  db.insertOne('customFields', { _id: `cf${tag}`, boardIds: [boardId], name: 'Mine', type: 'text', settings: {}, showOnCard: false, automaticallyOnCard: false, alwaysOnCard: false, showLabelOnMiniCard: false, createdAt: new Date() });
  return { trigger: `trg${tag}`, hook: `hook${tag}`, field: `cf${tag}` };
};

test('triggers, webhooks and custom fields cannot be moved to another board', async ({ page, user2 }) => {
  // Six sign-ins and board loads, one per attempt: slower browsers against the
  // source server need more than the default minute.
  test.setTimeout(180_000);
  const victim = db.seedBoard({ ownerId: user2.id, cardTitlesPerList: [['Private card']] });
  const made = [];
  // One fresh board admin per attempt: a refused attempt disables the account.
  const attacker = async () => {
    const u = db.seedUser();
    u.token = db.addResumeToken(u.id);
    const b = db.seedBoard({ ownerId: u.id, cardTitlesPerList: [['Mine']] });
    const docs = seedDocs(b.boardId);
    made.push({ u, b, docs });
    await loginWithToken(page, u.id, u.token);
    await openBoard(page, b.boardId, b.slug);
    return { u, b, docs };
  };
  try {
    const attempts = [
      ({ docs }) => ['triggers', 'update', { _id: docs.trigger }, { $set: { boardId: '*' } }],
      ({ docs }) => ['triggers', 'update', { _id: docs.trigger }, { $unset: { boardId: 1 } }],
      ({ docs }) => ['integrations', 'update', { _id: docs.hook }, { $set: { boardId: victim.boardId } }],
      ({ docs }) => ['customFields', 'update', { _id: docs.field }, { $push: { boardIds: victim.boardId } }],
      ({ b }) => ['customFields', 'insert', { _id: `planted${Date.now()}`, boardIds: [b.boardId, victim.boardId], name: 'Planted', type: 'text', settings: {}, showOnCard: false, automaticallyOnCard: true, alwaysOnCard: true, showLabelOnMiniCard: false }],
    ];
    for (const build of attempts) {
      const ctx = await attacker();
      const [collection, op, ...args] = build(ctx);
      expect(await mutate(page, collection, op, ...args), `${collection} ${op}`).toBe('denied');
      await expect.poll(() => db.findOne('users', { _id: ctx.u.id }).loginDisabled).toBe(true);
      expect(db.findOne('triggers', { _id: ctx.docs.trigger }).boardId).toBe(ctx.b.boardId);
      expect(db.findOne('integrations', { _id: ctx.docs.hook }).boardId).toBe(ctx.b.boardId);
      expect(db.findOne('customFields', { _id: ctx.docs.field }).boardIds).toEqual([ctx.b.boardId]);
    }
    expect(db.find('customFields', { boardIds: victim.boardId })).toHaveLength(0);
    // Problems keeps one row per kind of event (source), each with a count.
    await expect.poll(() => db.find('eventlog', { bleed: 'RepointBleed' }).reduce((sum, row) => sum + (row.count || 0), 0))
      .toBeGreaterThanOrEqual(attempts.length);
    // An admin's ordinary edits on their own board still work (negative).
    const ok = await attacker();
    expect(await mutate(page, 'integrations', 'update', { _id: ok.docs.hook }, { $set: { title: 'Renamed' } })).toBe('accepted');
    expect(await mutate(page, 'customFields', 'update', { _id: ok.docs.field }, { $set: { name: 'Renamed' } })).toBe('accepted');
    expect(db.findOne('users', { _id: ok.u.id }).loginDisabled).not.toBe(true);
  } finally {
    for (const { docs } of made) {
      db.deleteMany('triggers', { _id: docs.trigger });
      db.deleteMany('integrations', { _id: docs.hook });
      db.deleteMany('customFields', { _id: docs.field });
    }
    db.deleteMany('customFields', { name: 'Planted' });
    db.cleanup({ boardIds: [victim.boardId, ...made.map(m => m.b.boardId)], userIds: made.map(m => m.u.id) });
  }
});
