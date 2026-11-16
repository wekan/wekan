'use strict';

const { test: base, expect } = require('../fixtures');
const db = require('../helpers/db');
const BoardPage = require('../pages/BoardPage');
const CardPage = require('../pages/CardPage');

const headers = token => ({ Authorization: `Bearer ${token}` });
const fieldPath = (boardId, id) => `/api/boards/${boardId}/custom-fields/${id}`;
const items = [{ _id: 'first', name: 'First option' }, { _id: 'second', name: 'Second option' }];

const test = base.extend({
  dropdown: async ({ request, user, board }, use) => {
    const response = await request.post(`/api/boards/${board.boardId}/custom-fields`, {
      headers: headers(user.token),
      data: { name: 'Priority', type: 'dropdown', settings: { dropdownItems: items }, showOnCard: true },
    });
    expect(response.status()).toBe(200);
    const { _id } = await response.json();
    try {
      await use({ id: _id, path: fieldPath(board.boardId, _id) });
    } finally {
      db.deleteOne('customFields', { _id });
    }
  },
});

test('renaming dropdown options persists their names without changing siblings or card selections', async ({ request, user, board, dropdown }) => {
  const card = db.findOne('cards', { boardId: board.boardId, title: 'Alpha Card' });
  db.updateOne('cards', { _id: card._id }, { $set: { customFields: [{ _id: dropdown.id, value: 'second' }] } });
  const before = db.getCard(card._id);
  const expected = items.map(item => ({ ...item }));
  for (const [index, name] of [[1, 'Renamed option'], [0, 'First renamed'], [1, 'Renamed again']]) {
    const response = await request.put(`${dropdown.path}/dropdown-items/${items[index]._id}`, {
      headers: headers(user.token), data: { name },
    });
    expect(response.status()).toBe(200);
    expect(await response.json()).toEqual({ _id: items[index]._id });
    expected[index].name = name;
    expect(db.findOne('customFields', { _id: dropdown.id }).settings.dropdownItems).toEqual(expected);
    const read = await request.get(dropdown.path, { headers: headers(user.token) });
    expect(read.status()).toBe(200);
    expect((await read.json()).settings.dropdownItems).toEqual(expected);
    expect(db.getCard(card._id)).toEqual(before);
  }
});

test('missing options, missing fields and wrong boards return JSON 404 without mutations', async ({ request, user, board, dropdown }) => {
  const other = db.seedBoard({ ownerId: user.id });
  try {
    const before = db.findOne('customFields', { _id: dropdown.id });
    for (const path of [
      `${dropdown.path}/dropdown-items/missing`,
      `${fieldPath(board.boardId, 'missing-field')}/dropdown-items/second`,
      `${fieldPath(other.boardId, dropdown.id)}/dropdown-items/second`,
    ]) {
      const response = await request.put(path, { headers: headers(user.token), data: { name: 'Rejected' } });
      expect(response.status()).toBe(404);
      expect(response.headers()['content-type']).toContain('application/json');
      expect(await response.json()).toEqual({ error: 'Dropdown item not found' });
      expect(db.findOne('customFields', { _id: dropdown.id })).toEqual(before);
    }
  } finally {
    db.cleanup({ boardIds: [other.boardId] });
  }
});

test('dropdown renaming preserves write authorization and protected-field restrictions', async ({ request, user, user2, board, dropdown }) => {
  const path = `${dropdown.path}/dropdown-items/second`;
  const before = db.findOne('customFields', { _id: dropdown.id });
  expect((await request.put(path, { data: { name: 'Rejected' } })).status()).toBe(401);
  expect((await request.put(path, { headers: headers(user2.token), data: { name: 'Rejected' } })).status()).toBe(403);
  expect(db.findOne('customFields', { _id: dropdown.id })).toEqual(before);
  const member = db.seedUser();
  try {
    db.addBoardMember({ boardId: board.boardId, userId: member.id });
    const renamed = await request.put(path, { headers: headers(member.token), data: { name: 'Member rename' } });
    expect(renamed.status()).toBe(200);
    for (const protection of ['adminOnly', 'readOnly']) {
      db.updateOne('customFields', { _id: dropdown.id }, { $set: { adminOnly: false, readOnly: false, [protection]: true } });
      const protectedField = db.findOne('customFields', { _id: dropdown.id });
      const rejected = await request.put(path, { headers: headers(member.token), data: { name: 'Rejected' } });
      expect(rejected.ok()).toBe(false);
      expect(db.findOne('customFields', { _id: dropdown.id })).toEqual(protectedField);
      const allowed = await request.put(path, { headers: headers(user.token), data: { name: 'Admin rename' } });
      expect(allowed.status()).toBe(200);
      expect(db.findOne('customFields', { _id: dropdown.id }).settings.dropdownItems).toEqual([items[0], { ...items[1], name: 'Admin rename' }]);
    }
  } finally {
    db.cleanup({ userIds: [member.id] });
  }
});

test('URL-encoded option IDs can be renamed and invalid names remain rejected', async ({ request, user, dropdown }) => {
  const id = 'option / % +';
  db.updateOne('customFields', { _id: dropdown.id }, { $set: { 'settings.dropdownItems.1._id': id } });
  const path = `${dropdown.path}/dropdown-items/${encodeURIComponent(id)}`;
  const renamed = await request.put(path, { headers: headers(user.token), data: { name: 'Encoded option' } });
  expect(renamed.status()).toBe(200);
  expect(await renamed.json()).toEqual({ _id: id });
  const before = db.findOne('customFields', { _id: dropdown.id });
  expect(before.settings.dropdownItems).toEqual([items[0], { _id: id, name: 'Encoded option' }]);
  const rejected = await request.put(path, { headers: headers(user.token), data: { name: '' } });
  expect(rejected.ok()).toBe(false);
  expect(db.findOne('customFields', { _id: dropdown.id })).toEqual(before);
});

test('renamed dropdown choices appear on the card while retaining the selected option', async ({ request, user, board, dropdown, boardPage: page }) => {
  const card = db.findOne('cards', { boardId: board.boardId, title: 'Alpha Card' });
  db.updateOne('cards', { _id: card._id }, { $set: { customFields: [{ _id: dropdown.id, value: 'second' }] } });
  await new BoardPage(page).clickCard(board.listIds[0], 'Alpha Card');
  const cardPage = new CardPage(page);
  await cardPage.waitForOpen();
  const section = cardPage.root.locator('.card-details-group-custom-fields');
  await expect(section).toContainText('Second option');
  const response = await request.put(`${dropdown.path}/dropdown-items/second`, {
    headers: headers(user.token), data: { name: 'Renamed option' },
  });
  expect(response.status()).toBe(200);
  await page.reload();
  await new BoardPage(page).clickCard(board.listIds[0], 'Alpha Card');
  await cardPage.waitForOpen();
  await expect(section).toContainText('Renamed option');
  await section.locator('a.js-edit-card-custom-field-value').click();
  const select = section.locator('.js-card-customfield-dropdown select');
  await expect(select.locator('option[value="first"]')).toHaveText('First option');
  await expect(select.locator('option[value="second"]')).toHaveText('Renamed option');
  await expect(select).toHaveValue('second');
  expect(db.getCard(card._id).customFields).toEqual([{ _id: dropdown.id, value: 'second' }]);
});
