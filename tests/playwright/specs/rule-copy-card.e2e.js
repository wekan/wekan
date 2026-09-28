'use strict';
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const { navigateInApp } = require('../helpers/auth');
const call = (page, method, ...args) => page.evaluate(({ method, args }) => Meteor.callAsync(method, ...args), { method, args });

test('Copy Card rule selects a destination, copies on creation, and rejects revoked or forged targets', async ({ boardPage: page, board, user, user2 }) => {
  test.setTimeout(120000);
  const destination = db.seedBoard({ ownerId: user.id, title: 'Copy destination', cardTitlesPerList: [[]] });
  const hidden = db.seedBoard({ ownerId: user2.id, title: 'Private destination', cardTitlesPerList: [[]] });
  try {
    const list = db.findOne('lists', { boardId: destination.boardId });
    const lane = db.findOne('swimlanes', { boardId: destination.boardId });
    await navigateInApp(page, `/b/${board.boardId}/${board.slug}/rules`);
    await page.locator('#ruleTitle').fill('Copy on creation');
    await page.locator('.js-goto-trigger').click();
    await page.locator('.js-add-create-trigger').click();
    await expect(page.locator(`#board-id-copy option[value="${destination.boardId}"]`)).toHaveCount(1);
    await expect(page.locator(`#board-id-copy option[value="${hidden.boardId}"]`)).toHaveCount(0);
    await page.locator('#board-id-copy').selectOption(destination.boardId);
    await expect(page.locator(`#list-id-copy option[value="${list._id}"]`)).toHaveCount(1);
    await page.locator('#list-id-copy').selectOption(list._id);
    await page.locator('#swimlane-id-copy').selectOption(lane._id);
    await page.locator('.js-copy-card-action').click();
    await expect(page.locator('.rules-lists-item').filter({ hasText: 'Copy on creation' })).toBeVisible();
    const rule = db.findOne('rules', { boardId: board.boardId, title: 'Copy on creation' });
    const action = db.findOne('actions', { _id: rule.actionId });
    expect(action).toMatchObject({ actionType: 'copyCard', boardId: destination.boardId, listId: list._id, swimlaneId: lane._id });
    const sourceList = db.findOne('lists', { boardId: board.boardId });
    const sourceLane = db.findOne('swimlanes', { boardId: board.boardId });
    const sourceId = await page.evaluate(async data => Meteor.callAsync('createCardWithDueDate', data.boardId, data.listId, 'Automatic copy', new Date('2027-01-01'), data.laneId),
      { boardId: board.boardId, listId: sourceList._id, laneId: sourceLane._id });
    await expect.poll(() => db.countDocuments('cards', { boardId: destination.boardId, title: 'Automatic copy' })).toBe(1);
    const copied = db.findOne('cards', { boardId: destination.boardId, title: 'Automatic copy' });
    expect(copied._id).not.toBe(sourceId);
    expect(copied).toMatchObject({ listId: list._id, swimlaneId: lane._id, dueAt: '2027-01-01T00:00:00.000Z' });
    expect(db.findOne('cards', { _id: sourceId }).boardId).toBe(board.boardId);
    // Run the same persisted action manually to cover copying related data.
    await call(page, 'rules.updateRule', rule._id, rule.title, { activityType: 'button', buttonType: 'card', buttonLabel: 'Copy' }, action);
    const checklist = `${sourceId}-steps`;
    db.insertOne('checklists', { _id: checklist, title: 'Steps', cardId: sourceId, sort: 0 });
    db.insertOne('checklistItems', { title: 'Do it', cardId: sourceId, checklistId: checklist, sort: 0, isFinished: false });
    db.insertOne('card_comments', { cardId: sourceId, boardId: board.boardId, userId: user.id, text: 'Keep this comment', createdAt: new Date(), modifiedAt: new Date() });
    await call(page, 'rules.runButton', rule._id, sourceId);
    const copies = db.find('cards', { boardId: destination.boardId, title: 'Automatic copy' });
    expect(copies).toHaveLength(2);
    const full = copies.find(card => card._id !== copied._id);
    expect(db.countDocuments('checklists', { cardId: full._id, title: 'Steps' })).toBe(1);
    expect(db.countDocuments('checklistItems', { cardId: full._id, title: 'Do it' })).toBe(1);
    expect(db.countDocuments('card_comments', { cardId: full._id, boardId: destination.boardId, text: 'Keep this comment' })).toBe(1);
    // A stored action cannot smuggle a foreign list into an authorized board.
    db.updateOne('actions', { _id: rule.actionId }, { $set: { listId: sourceList._id } });
    await call(page, 'rules.runButton', rule._id, sourceId);
    expect(db.countDocuments('cards', { boardId: destination.boardId, title: 'Automatic copy' })).toBe(2);
    db.updateOne('actions', { _id: rule.actionId }, { $set: { listId: list._id } });
    db.updateOne('boards', { _id: destination.boardId }, { $set: { members: [] } });
    await call(page, 'rules.runButton', rule._id, sourceId);
    expect(db.countDocuments('cards', { boardId: destination.boardId, title: 'Automatic copy' })).toBe(2);
  } finally { db.cleanup({ boardIds: [destination.boardId, hidden.boardId] }); }
});

test('same-board create-to-copy rule terminates and copies separate events independently', async ({ boardPage: page, board }) => {
  const list = db.findOne('lists', { boardId: board.boardId });
  const lane = db.findOne('swimlanes', { boardId: board.boardId });
  await call(page, 'rules.createRule', board.boardId, 'Copy once',
    { activityType: 'createCard', listName: '*', swimlaneName: '*', cardTitle: '*' },
    { actionType: 'copyCard', boardId: board.boardId, listId: list._id, swimlaneId: lane._id });
  for (const title of ['First independent event', 'Second independent event']) {
    await page.evaluate(async data => Meteor.callAsync('createCardWithDueDate', data.boardId, data.listId, data.title, new Date('2027-01-01'), data.laneId),
      { boardId: board.boardId, listId: list._id, laneId: lane._id, title });
    expect(db.countDocuments('cards', { boardId: board.boardId, title })).toBe(2);
  }
});
