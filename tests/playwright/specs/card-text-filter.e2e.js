'use strict';
const { test, expect: baseExpect } = require('../fixtures');
const db = require('../helpers/db');
const { openBoard } = require('../helpers/auth');

test('literal text filter finds every text source beyond a lazy window and reacts to edits and access changes', async ({ loggedInPage: page, board, user }) => {
  // Standalone MongoDB uses Meteor polling for these successive raw-driver edits.
  test.setTimeout(150000);
  // A raw-driver write reaches the page on the next poll, about ten seconds
  // later; under a full parallel run one cycle overran the default 15 s wait
  // (Firefox, restoring the membership). Give every check two poll cycles.
  const expect = baseExpect.configure({ timeout: 40_000 });
  const cards = db.find('cards', { boardId: board.boardId });
  const [title, description, comment] = cards;
  const term = '[Needle].*';
  const extra = [];
  for (let i = 0; i < 35; i++) extra.push({ ...title, _id: `text-${board.boardId}-${i}`, title: `Plain ${i}`, sort: 100 + i });
  db.insertMany('cards', extra);
  const checklist = extra[33], item = extra[34];
  db.updateOne('cards', { _id: title._id }, { $set: { title: term } });
  db.updateOne('cards', { _id: description._id }, { $set: { description: term.toUpperCase() } });
  db.insertOne('card_comments', { _id: `comment-${board.boardId}`, boardId: board.boardId, cardId: comment._id, text: term, userId: user.id, createdAt: new Date() });
  db.insertOne('checklists', { _id: `checklist-${board.boardId}`, boardId: board.boardId, cardId: checklist._id, title: term, sort: 0 });
  db.insertOne('checklistItems', { _id: `item-${board.boardId}`, checklistId: `items-${board.boardId}`, boardId: board.boardId, cardId: item._id, title: term, sort: 0, isFinished: false });
  await openBoard(page, board.boardId, board.slug);
  await page.locator('.js-open-filter-view').click();
  const input = page.locator('.js-field-card-filter');
  const ids = () => page.locator('.board-canvas .js-minicard').evaluateAll(rows => rows.map(row => row.dataset.cardId).sort());
  await input.fill(term);
  await expect.poll(ids).toEqual([title, description, comment, checklist, item].map(card => card._id).sort());
  db.updateOne('card_comments', { _id: `comment-${board.boardId}` }, { $set: { text: 'No longer matches' } });
  await expect.poll(ids).toEqual([title, description, checklist, item].map(card => card._id).sort());
  db.deleteOne('checklists', { _id: `checklist-${board.boardId}` });
  await expect.poll(ids).toEqual([title, description, item].map(card => card._id).sort());
  // Stored child boardId cannot widen a card's scope.
  db.updateOne('checklistItems', { _id: `item-${board.boardId}` }, { $set: { boardId: 'unrelated-board' } });
  await expect.poll(ids).toEqual([title._id, description._id].sort());
  // A changed membership must narrow the text match stream as well as cards.
  db.updateOne('cards', { _id: title._id }, { $set: { assignees: [user.id] } });
  const original = db.findOne('boards', { _id: board.boardId });
  db.updateOne('boards', { _id: board.boardId }, { $set: { members: original.members.map(member => member.userId === user.id
    ? { ...member, isReadAssignedOnly: true } : member) } });
  await expect.poll(() => page.evaluate(() => {
    const store = Meteor.connection._stores.boardTextMatches;
    return store ? store._getCollection().find().fetch().map(row => row.cardId).sort() : [];
  })).toEqual([title._id]);
  db.updateOne('boards', { _id: board.boardId }, { $set: { members: original.members } });
  await expect.poll(ids).toEqual([title._id, description._id].sort());
  await input.fill('no matches'); await expect.poll(ids).toEqual([]);
  await input.fill(term); await expect.poll(ids).toEqual([title._id, description._id].sort());
  db.updateOne('boards', { _id: board.boardId }, { $set: { members: [], permission: 'private' } });
  await expect.poll(() => page.evaluate(() => Meteor.connection._stores.boardTextMatches?._getCollection().find().fetch() || [])).toEqual([]);
});
