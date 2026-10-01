'use strict';
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const { openBoard } = require('../helpers/auth');

test('duplicate relation picker, editing and History undo/redo retain typed links', async ({ loggedInPage: page, board }) => {
  const cards = db.find('cards', { boardId: board.boardId });
  const [source, target] = cards;
  db.setShowDependencies({ boardId: board.boardId, board: true });
  await openBoard(page, board.boardId, board.slug);
  await page.locator(`.js-minicard[data-card-id="${source._id}"]`).click();
  await page.locator('.js-add-dependency').click();
  await page.locator('.js-new-dependency-type').selectOption('duplicates');
  await page.locator(`.js-pick-dependency[data-target-id="${target._id}"]`).click();
  const type = () => db.findOne('cards', { _id: source._id }).cardDependencies?.[0]?.type;
  await expect.poll(type).toBe('duplicates');
  await expect(page.locator('.js-dependency-overlay .dependency-line').first()).toHaveAttribute('marker-end', /url\(#/);
  const select = page.locator(`.js-dependency-type[data-target-id="${target._id}"]`);
  await expect(select).toHaveValue('duplicates');
  await expect(select.locator('option:checked')).toHaveText('Duplicates');
  await select.selectOption('is-duplicated-by');
  await expect.poll(type).toBe('is-duplicated-by');
  await expect(select.locator('option:checked')).toHaveText('Is duplicated by');
  await page.evaluate(id => Meteor.callAsync('changeHistory.undoLast', id), board.boardId);
  await expect.poll(type).toBe('duplicates');
  await page.evaluate(id => Meteor.callAsync('changeHistory.redoLast', id), board.boardId);
  await expect.poll(type).toBe('is-duplicated-by');
});

test('Jira duplicate links preserve both directions through native board transfer', async ({ loggedInPage: page, request, user }) => {
  const ids = [];
  const source = { board: { name: `Duplicate links ${db.uniqueSuffix()}` }, issues: [
    { key: 'DUP-1', fields: { summary: 'Duplicate source', status: { name: 'Todo' }, issuelinks: [
      { type: { name: 'Duplicate' }, outwardIssue: { key: 'DUP-2' } },
      { type: { name: 'Duplicate' }, inwardIssue: { key: 'DUP-3' } },
      { type: { name: 'Duplicate' }, outwardIssue: { key: 'DUP-1' } },
      { type: { name: 'Duplicate' }, outwardIssue: { key: 'MISSING' } },
    ] } },
    { key: 'DUP-2', fields: { summary: 'Original target', status: { name: 'Todo' } } },
    { key: 'DUP-3', fields: { summary: 'Other duplicate', status: { name: 'Todo' } } },
  ] };
  try {
    const id = await page.evaluate(value => Meteor.callAsync('importBoard', value, {}, 'jira'), source); ids.push(id);
    const verify = boardId => {
      const cards = db.find('cards', { boardId });
      const from = cards.find(card => card.title.includes('Duplicate source'));
      const original = cards.find(card => card.title.includes('Original target'));
      const duplicate = cards.find(card => card.title.includes('Other duplicate'));
      expect(from.cardDependencies).toHaveLength(2);
      expect(from.cardDependencies).toEqual(expect.arrayContaining([
        expect.objectContaining({ cardId: original._id, type: 'duplicates' }),
        expect.objectContaining({ cardId: duplicate._id, type: 'is-duplicated-by' }),
      ]));
    };
    verify(id);
    const response = await request.get(`/api/boards/${id}/export`, { headers: { Authorization: `Bearer ${user.token}` } });
    expect(response.status()).toBe(200);
    const native = await response.json();
    const copy = await page.evaluate(value => Meteor.callAsync('importBoard', value, {}, 'wekan'), native); ids.push(copy);
    verify(copy);
  } finally { for (const id of ids) db.cleanup({ boardIds: [id] }); }
});

test('REST accepts both duplicate types and retains board boundary validation', async ({ request, user, board }) => {
  const [source, target] = db.find('cards', { boardId: board.boardId });
  const url = `/api/boards/${board.boardId}/cards/${source._id}/dependencies`;
  const headers = { Authorization: `Bearer ${user.token}` };
  for (const type of ['duplicates', 'is-duplicated-by']) {
    const result = await request.post(url, { headers, data: { cardId: target._id, type } });
    expect(result.status()).toBe(200);
    expect(db.findOne('cards', { _id: source._id }).cardDependencies).toEqual([
      expect.objectContaining({ cardId: target._id, type }),
    ]);
  }
  const self = await request.post(url, { headers, data: { cardId: source._id, type: 'duplicates' } });
  expect(self.status()).toBeGreaterThanOrEqual(400);
  const foreign = db.seedBoard({ ownerId: user.id, title: 'Other board', listCount: 1, cardTitlesPerList: [['Foreign card']] });
  try {
    const card = db.find('cards', { boardId: foreign.boardId })[0];
    const result = await request.post(url, { headers, data: { cardId: card._id, type: 'duplicates' } });
    expect(result.status()).toBeGreaterThanOrEqual(400);
    expect(db.findOne('cards', { _id: source._id }).cardDependencies).toHaveLength(1);
  } finally { db.cleanup({ boardIds: [foreign.boardId] }); }
});
