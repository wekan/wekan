'use strict';
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const { loginWithToken } = require('../helpers/auth');

test('History restores date-valued custom fields as BSON dates while preserving text values', async ({ page, user, board }) => {
  const card = db.find('cards', { boardId: board.boardId })[0];
  const dateId = db.uid('date'), textId = db.uid('text'), checkboxId = db.uid('check');
  const when = new Date('2026-09-01T12:34:56.000Z');
  try {
    db.insertOne('customFields', { _id: dateId, boardIds: [board.boardId], name: 'Date', type: 'date' });
    db.insertOne('customFields', { _id: textId, boardIds: [board.boardId], name: 'Literal date text', type: 'text' });
    db.insertOne('customFields', { _id: checkboxId, boardIds: [board.boardId], name: 'Reviewed', type: 'checkbox' });
    db.updateOne('cards', { _id: card._id }, { $set: { customFields: [
      { _id: dateId, value: when }, { _id: textId, value: when.toISOString() },
      { _id: checkboxId, value: false },
    ] } });
    await loginWithToken(page, user.id, user.token);
    await page.evaluate(({ cardId, checkboxId }) => Meteor.callAsync('setCardCustomFieldCheckbox', cardId, checkboxId, true),
      { cardId: card._id, checkboxId });
    const row = db.findOne('changeHistory', { cardId: card._id, group: 'customFields', changeType: 'edited' });
    expect(row.newContent.datePaths).toEqual([['0', 'value']]);
    // Change the saved card independently; restoring the recorded row must
    // decode its date metadata, not infer types from date-looking strings.
    db.updateOne('cards', { _id: card._id }, { $set: { customFields: [] } });
    const id = row._id;
    const result = await page.evaluate(id => Meteor.callAsync('changeHistory.restore', [id]), id);
    expect(result.restored).toBe(1);
    expect(db.countDocuments('cards', { _id: card._id, customFields: {
      $elemMatch: { _id: dateId, value: { $type: 'date', $eq: when } },
    } })).toBe(1);
    expect(db.countDocuments('cards', { _id: card._id, customFields: {
      $elemMatch: { _id: textId, value: { $type: 'string', $eq: when.toISOString() } },
    } })).toBe(1);
  } finally {
    db.deleteMany('customFields', { _id: { $in: [dateId, textId, checkboxId] } });
  }
});
