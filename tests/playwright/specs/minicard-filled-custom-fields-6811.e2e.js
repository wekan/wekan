'use strict';

// #6811: a minicard shows only the custom fields that hold a value - a field
// on every card ("Always on card") is empty until filled in, and an empty one
// is not drawn. 0 and an unticked checkbox are values and are shown.
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');

test('#6811: the minicard draws filled custom fields and hides the empty ones', async ({ boardPage: page, board }) => {
  const card = db.findOne('cards', { boardId: board.boardId, title: 'Alpha Card' });
  const ids = { filled: db.uid('cf'), empty: db.uid('cf'), blank: db.uid('cf'), zero: db.uid('cf'), unticked: db.uid('cf') };
  const def = (id, name, type) => db.insertOne('customFields', {
    _id: id, boardIds: [board.boardId], name, type, settings: {}, showOnCard: true, showLabelOnMiniCard: true, automaticallyOnCard: true,
  });
  def(ids.filled, 'Filled field', 'text');
  def(ids.empty, 'Empty field', 'text');
  def(ids.blank, 'Blank field', 'text');
  def(ids.zero, 'Zero field', 'number');
  def(ids.unticked, 'Unticked field', 'checkbox');
  db.updateOne('boards', { _id: board.boardId }, { $set: { allowsCustomFieldsOnMinicard: true } });
  db.updateOne('cards', { _id: card._id }, { $set: { customFields: [
    { _id: ids.filled, value: 'BVH 123' }, { _id: ids.empty, value: null }, { _id: ids.blank, value: '   ' },
    { _id: ids.zero, value: 0 }, { _id: ids.unticked, value: false },
  ] } });
  const minicard = page.locator('.minicard', { hasText: 'Alpha Card' }).first();
  await expect(minicard.locator('.minicard-custom-field', { hasText: 'Filled field' })).toHaveCount(1);
  await expect(minicard.locator('.minicard-custom-field', { hasText: 'Zero field' })).toHaveCount(1);
  await expect(minicard.locator('.minicard-custom-field', { hasText: 'Unticked field' })).toHaveCount(1);
  // Negative: the empty and the blank one are not drawn.
  await expect(minicard.locator('.minicard-custom-field', { hasText: 'Empty field' })).toHaveCount(0);
  await expect(minicard.locator('.minicard-custom-field', { hasText: 'Blank field' })).toHaveCount(0);
  await expect(minicard.locator('.minicard-custom-field')).toHaveCount(3);
});
