'use strict';

// #6815: a card added from the browser brings the number the browser
// computed; the server now replaces a number another card on the board
// already carries, and keeps a free one.
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');

const insertCard = (page, doc) => page.evaluate(async d => {
  try { return { value: await Meteor.callAsync('/cards/insert', d) }; }
  catch (error) { return { error: error.error || error.message }; }
}, doc);

test('#6815: a taken card number from the browser is replaced, a free one kept', async ({ boardPage: page, board }) => {
  const alpha = db.findOne('cards', { boardId: board.boardId, title: 'Alpha Card' });
  // A card far above the browser's view, as with lazy loading.
  db.updateOne('cards', { _id: alpha._id }, { $set: { cardNumber: 500 } });
  db.deleteOne('counters', { _id: `cardNumber-${board.boardId}` });
  const base = { boardId: board.boardId, listId: alpha.listId, swimlaneId: alpha.swimlaneId, type: 'cardType-card', sort: 99, archived: false };

  const dupId = db.uid('card');
  const dup = await insertCard(page, { ...base, _id: dupId, title: 'Duplicate number', cardNumber: 500 });
  expect(dup.error).toBeUndefined();
  await expect.poll(() => db.findOne('cards', { _id: dupId })?.cardNumber).toBe(501);

  // Negative: a free number is kept, and the counter never hands it out again.
  const freeId = db.uid('card');
  await insertCard(page, { ...base, _id: freeId, title: 'Free number', cardNumber: 700 });
  await expect.poll(() => db.findOne('cards', { _id: freeId })?.cardNumber).toBe(700);
  expect(db.findOne('counters', { _id: `cardNumber-${board.boardId}` }).next_val).toBeGreaterThanOrEqual(700);
  const numbers = db.find('cards', { boardId: board.boardId, cardNumber: { $gt: 0 } }).map(c => c.cardNumber);
  expect(new Set(numbers).size).toBe(numbers.length);
});
