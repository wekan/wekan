'use strict';
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const { loginWithToken, navigateInApp } = require('../helpers/auth');

for (const mode of ['all', 'cards-only', 'none', 'swimlanes-only']) test(`selective board duplication: ${mode}`, async ({ page, board, user }) => {
  const source = db.getBoard(board.boardId);
  const cards = db.find('cards', { boardId: board.boardId });
  const parent = cards.find(c => c.title === 'Alpha Card');
  const child = cards.find(c => c.title === 'Beta Card');
  const labelId = db.uid('label'), fieldId = db.uid('field'), checklistId = db.uid('checklist');
  const actionId = db.uid('action'), triggerId = db.uid('trigger');
  db.updateOne('boards', { _id: board.boardId }, { $set: { labels: [{ _id: labelId, name: 'Copy label', color: 'green' }] } });
  db.updateOne('cards', { _id: parent._id }, { $set: { labelIds: [labelId], customFields: [{ _id: fieldId, value: 'Copy field value' }] } });
  db.updateOne('cards', { _id: child._id }, { $set: { parentId: parent._id, cardDependencies: [{ cardId: parent._id, type: 'blocks' }] } });
  db.insertOne('customFields', { _id: fieldId, boardIds: [board.boardId], name: 'Copy field', type: 'text', settings: {}, showOnCard: true });
  db.insertOne('checklists', { _id: checklistId, boardId: board.boardId, cardId: parent._id, title: 'Copy checklist', sort: 0 });
  db.insertOne('checklistItems', { _id: db.uid('item'), boardId: board.boardId, cardId: parent._id, checklistId, title: 'Copy item', isFinished: true, sort: 0 });
  db.insertOne('card_comments', { _id: db.uid('comment'), boardId: board.boardId, cardId: parent._id, userId: user.id, text: 'Copy comment', createdAt: new Date(), modifiedAt: new Date() });
  db.insertOne('actions', { _id: actionId, boardId: board.boardId, actionType: 'setColor', desc: 'Copy action' });
  db.insertOne('triggers', { _id: triggerId, boardId: board.boardId, activityType: 'never', desc: 'Copy trigger' });
  db.insertOne('rules', { _id: db.uid('rule'), boardId: board.boardId, title: 'Copy rule', actionId, triggerId, enabled: false });
  db.insertOne('integrations', { _id: db.uid('integration'), boardId: board.boardId, title: 'Copy webhook', userId: user.id, enabled: false, url: 'https://example.com/hook', activities: ['all'], type: 'outgoing-webhooks' });
  const originalFields = db.find('customFields', { _id: fieldId });
  const originalCards = db.find('cards', { boardId: board.boardId });
  const previous = db.find('boards', { 'members.userId': user.id }).map(b => b._id);
  const copies = () => db.find('boards', { 'members.userId': user.id }).filter(b => !previous.includes(b._id));
  try {
    await loginWithToken(page, user.id, user.token);
    await navigateInApp(page, '/allboards/remaining');
    await page.locator('.js-all-boards-sidebar-multiselection').first().click();
    await page.locator(`li.js-board.${board.boardId} .js-toggle-board-multi-selection`).click();
    await page.locator('.js-duplicate-selected-boards').click();
    const form = page.locator('.js-duplicate-boards-form');
    await expect(form.locator('[aria-checked="true"]')).toHaveCount(10);
    await form.locator('.js-copy-select-none').click();
    await expect(form.locator('[aria-checked="true"]')).toHaveCount(0);
    if (mode === 'all') {
      await form.locator('.js-copy-select-all').click();
      await expect(form.locator('[aria-checked="true"]')).toHaveCount(10);
    } else if (mode !== 'none') {
      await form.locator(`[data-field="${mode === 'cards-only' ? 'cards' : 'swimlanes'}"]`).click();
      await expect(form.locator('[aria-checked="true"]')).toHaveCount(mode === 'cards-only' ? 3 : 1);
    }
    await form.locator('button[type="submit"]').click();
    await expect(form).toHaveCount(0);
    expect(copies()).toHaveLength(1);
    const copy = copies()[0];
    const all = mode === 'all', hasCards = all || mode === 'cards-only';
    expect(copy.members).toEqual(source.members);
    expect(copy.permission).toBe(source.permission);
    expect(copy.copyOptions).toBeUndefined();
    expect(copy.labels.length).toBe(all ? 1 : 0);
    expect(db.find('lists', { boardId: copy._id }).length).toBe(hasCards ? board.listIds.length : 0);
    // An empty board may receive a default swimlane when opened, but no source lists/cards.
    if (mode !== 'none') expect(db.find('swimlanes', { boardId: copy._id }).length).toBeGreaterThan(0);
    const copiedCards = db.find('cards', { boardId: copy._id });
    expect(copiedCards.length).toBe(hasCards ? cards.length : 0);
    if (hasCards) {
      const p = copiedCards.find(c => c.title === parent.title), c = copiedCards.find(c => c.title === child.title);
      expect(c.parentId).toBe(p._id);
      expect(c.cardDependencies[0].cardId).toBe(p._id);
      expect(p.labelIds).toEqual(all ? [labelId] : []);
      expect(p.customFields.length).toBe(all ? 1 : 0);
      if (all) {
        const definition = db.findOne('customFields', { boardIds: copy._id });
        expect(p.customFields[0]).toEqual({ _id: definition._id, value: 'Copy field value' });
      }
    }
    for (const collection of ['customFields', 'checklists', 'checklistItems', 'card_comments', 'rules', 'actions', 'triggers', 'integrations']) {
      expect(db.find(collection, collection === 'customFields' ? { boardIds: copy._id } : { boardId: copy._id }).length, collection).toBe(all ? 1 : 0);
    }
    expect(db.find('customFields', { _id: fieldId })).toEqual(originalFields);
    expect(db.find('cards', { boardId: board.boardId })).toEqual(originalCards);
    const invalid = await page.evaluate(async boardId => {
      try { await Meteor.callAsync('copyBoard', boardId, { copyOptions: { cards: 'false' } }); return 'allowed'; }
      catch (error) { return error.error; }
    }, board.boardId);
    expect(invalid).toBe('invalid-copy-options');
    expect(copies()).toHaveLength(1);
  } finally {
    const ids = [board.boardId, ...copies().map(b => b._id)];
    db.deleteMany('customFields', { boardIds: { $in: ids } });
    for (const collection of ['rules', 'actions', 'triggers', 'integrations']) db.deleteMany(collection, { boardId: { $in: ids } });
    db.cleanup({ boardIds: copies().map(b => b._id) });
  }
});

for (const attachments of [true, false]) test(`selective copy includes attachment bytes and cover only when selected: ${attachments}`, async ({ page, board, user }) => {
  test.skip(!process.env.WEKAN_FILES_PATH, 'Needs the isolated app file storage directory');
  const fs = require('node:fs');
  const path = require('node:path');
  const id = db.uid('attachment');
  const directory = path.join(process.env.WEKAN_FILES_PATH, 'attachments');
  const filename = path.join(directory, `${id}.txt`);
  fs.mkdirSync(directory, { recursive: true });
  const bytes = 'Selective board copy attachment bytes';
  fs.writeFileSync(filename, bytes);
  const card = db.find('cards', { boardId: board.boardId })[0];
  db.insertOne('attachments', { _id: id, name: `${id}.txt`, extension: 'txt', type: 'text/plain', size: bytes.length, userId: user.id,
    meta: { boardId: board.boardId, cardId: card._id },
    versions: { original: { storage: 'fs', path: filename, size: bytes.length, extension: 'txt', type: 'text/plain' } } });
  db.updateOne('cards', { _id: card._id }, { $set: { coverId: id } });
  let copyId;
  try {
    await loginWithToken(page, user.id, user.token);
    copyId = await page.evaluate(({ boardId, attachments }) => Meteor.callAsync('copyBoard', boardId, { copyOptions: { attachments } }), { boardId: board.boardId, attachments });
    const copiedCard = db.findOne('cards', { boardId: copyId, title: card.title });
    if (attachments) {
      await expect.poll(() => db.find('attachments', { 'meta.boardId': copyId }).length).toBe(1);
      const copied = db.findOne('attachments', { 'meta.boardId': copyId });
      expect(copied.meta.cardId).toBe(copiedCard._id);
      expect(copiedCard.coverId).toBe(copied._id);
      expect(fs.readFileSync(copied.versions.original.path, 'utf8')).toBe(bytes);
      fs.rmSync(copied.versions.original.path, { force: true });
    } else {
      expect(db.find('attachments', { 'meta.boardId': copyId })).toHaveLength(0);
      expect(copiedCard.coverId).toBeFalsy();
    }
    expect(fs.readFileSync(filename, 'utf8')).toBe(bytes);
    expect(db.findOne('cards', { _id: card._id }).coverId).toBe(id);
  } finally {
    fs.rmSync(filename, { force: true });
    db.deleteMany('attachments', { 'meta.boardId': { $in: [board.boardId, copyId].filter(Boolean) } });
    if (copyId) db.cleanup({ boardIds: [copyId] });
  }
});
