'use strict';
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const { openBoard } = require('../helpers/auth');

test('native date filters select real dates, compose with custom fields and drive rule matching', async ({ loggedInPage: page, board }) => {
  const [old, recent, missing] = db.find('cards', { boardId: board.boardId });
  const customId = db.uid('dateName');
  db.insertOne('customFields', { _id: customId, boardIds: [board.boardId], name: '@endAt', type: 'text', settings: {} });
  const fields = ['createdAt', 'receivedAt', 'startAt', 'dueAt', 'endAt', 'listEnteredAt'];
  for (const [card, date] of [[old, new Date('2026-08-01T12:00:00Z')], [recent, new Date('2026-09-10T12:00:00Z')], [missing, null]]) {
    db.updateOne('cards', { _id: card._id }, { $set: { ...Object.fromEntries(fields.map(field => [field, date])),
      customFields: [{ _id: customId, value: card._id === recent._id ? 'keep' : 'other' }] } });
  }
  const triggerId = db.uid('trigger'), actionId = db.uid('action');
  db.insertOne('triggers', { _id: triggerId, boardId: board.boardId, activityType: 'advancedFilterTrigger', advancedFilter: "@endAt >= '2026-09-01'" });
  db.insertOne('actions', { _id: actionId, boardId: board.boardId, actionType: 'markCardComplete' });
  db.insertOne('rules', { _id: db.uid('rule'), boardId: board.boardId, triggerId, actionId, enabled: true, title: 'Recent end date' });
  try {
    await openBoard(page, board.boardId, board.slug);
    await page.locator('.js-open-filter-view').click();
    const input = page.locator('.js-field-advanced-filter');
    const visible = page.locator('.board-canvas .js-minicard');
    const apply = async (text, ids) => {
      await input.fill(text); await input.dispatchEvent('change');
      await expect.poll(() => visible.evaluateAll(elements => elements.map(el => el.dataset.cardId).sort())).toEqual([...ids].sort());
    };
    for (const field of fields) {
      await apply(`@${field} < '2026-09-01'`, [old._id]);
      await apply(`@${field} >= '2026-09-01' or @${field} = none`, [recent._id, missing._id]);
    }
    db.updateOne('cards', { _id: old._id }, { $set: { endAt: 'not-a-date' } });
    await apply("@endAt != '2026-08-01'", [recent._id]);
    db.updateOne('cards', { _id: old._id }, { $set: { endAt: new Date('2026-08-01T12:00:00Z') } });
    await apply("not @endAt < '2026-09-01'", [recent._id, missing._id]);
    await apply("(@endAt >= '2026-09-01' or @endAt = none) and '@endAt' = keep", [recent._id]);
    await apply("@endAt = '2026-02-30'", [recent._id]); // Retain the previous valid selector.
    await apply('', [old._id, recent._id, missing._id]);
    for (const card of [old, recent, missing]) {
      await page.evaluate(id => Meteor.callAsync('/cards/update', { _id: id }, { $set: { title: `Changed ${id}` } }), card._id);
    }
    await expect.poll(() => db.findOne('cards', { _id: recent._id }).dueComplete).toBe(true);
    for (const card of [old, missing]) expect(!!db.findOne('cards', { _id: card._id }).dueComplete).toBe(false);
  } finally {
    db.deleteMany('customFields', { _id: customId });
    db.deleteMany('rules', { triggerId });
    db.deleteMany('triggers', { _id: triggerId });
    db.deleteMany('actions', { _id: actionId });
  }
});
