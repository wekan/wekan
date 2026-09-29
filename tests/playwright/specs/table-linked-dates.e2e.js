'use strict';
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const { openLazyBoard } = require('../helpers/lazyBoard');

test('lazy Table date order follows linked cards/boards, source edits and source permission changes', async ({ loggedInPage: page, user, user2 }) => {
  test.setTimeout(150000);
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (/Exception|TypeError/.test(message.text())) errors.push(message.text()); });
  const local = db.seedBoard({ ownerId: user.id, cardTitlesPerList: [['Local', 'Linked card', 'Linked board', 'Private link']] });
  const source = db.seedBoard({ ownerId: user.id, cardTitlesPerList: [['Source']] });
  const hidden = db.seedBoard({ ownerId: user2.id, cardTitlesPerList: [['Secret']] });
  try {
    const sourceCard = db.findOne('cards', { boardId: source.boardId });
    const secret = db.findOne('cards', { boardId: hidden.boardId });
    const set = (title, fields) => db.updateOne('cards', { boardId: local.boardId, title }, { $set: fields });
    set('Local', { dueAt: new Date('2026-06-01') });
    set('Linked card', { type: 'cardType-linkedCard', linkedId: sourceCard._id, dueAt: new Date('2026-12-01') });
    set('Linked board', { type: 'cardType-linkedBoard', linkedId: source.boardId, dueAt: new Date('2026-12-01') });
    set('Private link', { type: 'cardType-linkedCard', linkedId: secret._id, dueAt: new Date('2026-01-01') });
    db.updateOne('cards', { _id: sourceCard._id }, { $set: { dueAt: new Date('2026-02-01') } });
    db.updateOne('cards', { _id: secret._id }, { $set: { dueAt: new Date('2025-01-01') } });
    db.updateOne('boards', { _id: source.boardId }, { $set: { dueAt: new Date('2026-04-01') } });
    await openLazyBoard(page, local);
    await page.locator('.js-toggle-board-view').first().click();
    await page.locator('.pop-over .js-open-table-view').click();
    await page.locator('.js-table-view-sort[data-field="dueAt"]').click();
    await expect.poll(() => page.evaluate(() => Meteor.connection._stores.boardTablePages?._getCollection().findOne()?.total)).toBe(4);
    const titles = () => page.locator('.my-cards-card-title-table').allTextContents().then(values => values.map(value => value.trim()));
    await expect.poll(titles).toEqual(['Linked card', 'Linked board', 'Local', 'Private link']);
    const row = title => page.locator('.table-view-table tbody tr').filter({ has: page.locator('.my-cards-card-title-table', { hasText: title }) });
    await expect(row('Private link').locator('.due-date')).toHaveCount(0);
    await expect(row('Linked board').locator('.due-date')).toHaveCount(1);
    db.updateOne('cards', { _id: sourceCard._id }, { $set: { dueAt: new Date('2026-08-01') } });
    await expect.poll(titles).toEqual(['Linked board', 'Local', 'Linked card', 'Private link']);
    db.updateOne('boards', { _id: source.boardId }, { $set: { dueAt: new Date('2026-10-01') } });
    await expect.poll(titles).toEqual(['Local', 'Linked card', 'Linked board', 'Private link']);
    const membership = db.findOne('boards', { _id: source.boardId }).members;
    db.updateOne('boards', { _id: source.boardId }, { $set: { members: [] } });
    await expect.poll(titles).toEqual(['Local', 'Linked board', 'Linked card', 'Private link']);
    await expect(row('Linked board').locator('.due-date')).toHaveCount(0);
    await expect(row('Linked card').locator('.due-date')).toHaveCount(0);
    db.updateOne('boards', { _id: source.boardId }, { $set: { members: membership } });
    await expect.poll(titles).toEqual(['Local', 'Linked card', 'Linked board', 'Private link']);
    await expect(row('Linked card').locator('.due-date')).toHaveCount(1);
    expect(errors).toEqual([]);
  } finally { db.cleanup({ boardIds: [local.boardId, source.boardId, hidden.boardId] }); }
});
