'use strict';
// The Trello export keeps a board's checklists and comments (2026-11-20, the
// first tool of the import/export coverage review in TODO.md): they used to
// be written as empty arrays, so a board exported for Trello lost both. The
// export is read back by WeKan's own Trello import.
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const { navigateInApp } = require('../helpers/auth');
const { waitForImportedBoard } = require('../helpers/import');
const fs = require('node:fs');
const path = require('node:path');

const fixtures = path.resolve(__dirname, '../../fixtures/import-formats');
const expected = require('../../fixtures/import-formats/expectations.json');

async function importTrello(page, document) {
  await navigateInApp(page, '/import/trello');
  await page.locator('#import-textarea').fill(JSON.stringify(document));
  await page.locator('.js-import-without-mapping').click();
  await waitForImportedBoard(page);
  return page.url().match(/\/b\/([^/]+)/)[1];
}

test('a Trello export carries the checklists and comments, and imports back with them', async ({ loggedInPage: page, user }) => {
  test.setTimeout(90000);
  const document = JSON.parse(fs.readFileSync(path.join(fixtures, 'trello.json')));
  document.name += ` ${db.uniqueSuffix()}`;
  const boardIds = [];
  try {
    const source = await importTrello(page, document);
    boardIds.push(source);
    await expect.poll(() => db.find('checklistItems', { boardId: source }).length).toBe(1);

    // A number custom field with a value on the card.
    const fieldId = `trellofield${db.uniqueSuffix()}`;
    db.insertOne('customFields', { _id: fieldId, name: 'Estimate', type: 'number', boardIds: [source], settings: {},
      showOnCard: true, automaticallyOnCard: false, alwaysOnCard: false, showLabelOnMiniCard: false });
    const sourceCard = db.findOne('cards', { boardId: source });
    db.updateOne('cards', { _id: sourceCard._id }, { $set: { customFields: [{ _id: fieldId, value: 3 }] } });
    // An archived card: Trello's closed one.
    db.insertOne('cards', { ...sourceCard, _id: `trelloarch${db.uniqueSuffix()}`, title: 'Archived audit card', archived: true,
      archivedAt: new Date(), customFields: [] });
    const response = await page.request.get(`/api/boards/${source}/export/trello?authToken=${encodeURIComponent(user.token)}`);
    expect(response.status()).toBe(200);
    const exported = await response.json();
    expect(exported.checklists).toHaveLength(1);
    expect(exported.checklists[0].checkItems).toHaveLength(1);
    expect(exported.cards.find(c => c.name === expected.title).idChecklists).toEqual([exported.checklists[0].id]);
    const comments = exported.actions.filter(action => action.type === 'commentCard');
    expect(comments.map(action => action.data.text)).toContain(expected.comment);
    expect(comments[0].data.card.id).toBe(exported.cards.find(c => c.name === expected.title).id);
    expect(exported.cards.find(c => c.name === 'Archived audit card').closed).toBe(true);
    expect(exported.customFields.map(f => [f.name, f.type])).toEqual([['Estimate', 'number']]);
    expect(exported.cards.find(c => c.name === expected.title).customFieldItems[0].value).toEqual({ number: '3' });
    // The comment's author is a member of the file, so the import can map them.
    expect(exported.members.map(m => m.username)).toContain(comments[0].idMemberCreator);

    exported.name += ' round trip';
    const restored = await importTrello(page, exported);
    boardIds.push(restored);
    await expect.poll(() => db.find('checklistItems', { boardId: restored }).length).toBe(1);
    expect(db.find('card_comments', { boardId: restored }).map(c => c.text)).toContain(expected.comment);
    expect(db.findOne('cards', { boardId: restored, archived: { $ne: true } }).title).toBe(expected.title);
    expect(db.findOne('cards', { boardId: restored, title: 'Archived audit card' }).archived).toBe(true);
    // The custom field and its value came back, the value a number.
    const restoredField = db.findOne('customFields', { boardIds: restored, name: 'Estimate' });
    expect(restoredField.type).toBe('number');
    expect(db.findOne('cards', { boardId: restored, title: expected.title }).customFields).toEqual([{ _id: restoredField._id, value: 3 }]);
  } finally {
    db.deleteMany('customFields', { boardIds: { $in: boardIds } });
    db.cleanup({ boardIds });
  }
});

// The Trello .zip: board.json with the cards' attachments named, and each
// attachment as its file - imported back with the same bytes.
test('a Trello .zip export carries the attachment files and imports back with them', async ({ loggedInPage: page, user }) => {
  test.setTimeout(120000);
  const JSZip = require('jszip');
  const { openBoard } = require('../helpers/auth');
  const bytes = fs.readFileSync(path.join(fixtures, 'audit.txt'));
  const importZip = async (zipBuffer) => {
    await navigateInApp(page, '/import/trello');
    await page.locator('.js-import-zip-file').setInputFiles({ name: 'trello.zip', mimeType: 'application/zip', buffer: zipBuffer });
    await page.locator('.js-import-without-mapping').click();
  };
  const document = JSON.parse(fs.readFileSync(path.join(fixtures, 'trello.json')));
  document.name += ` ${db.uniqueSuffix()}`;
  const source = new JSZip();
  source.file('board.json', JSON.stringify(document));
  source.file('attachments/audit.txt', bytes);
  const boardIds = [];
  try {
    await importZip(await source.generateAsync({ type: 'nodebuffer' }));
    await expect.poll(() => db.find('boards', { title: document.name }).length).toBe(1);
    const sourceBoard = db.findOne('boards', { title: document.name });
    boardIds.push(sourceBoard._id);
    await expect.poll(() => db.find('attachments', { 'meta.boardId': sourceBoard._id }).length).toBe(1);

    const response = await page.request.get(`/api/boards/${sourceBoard._id}/export/trellozip?authToken=${encodeURIComponent(user.token)}`);
    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('application/zip');
    const exported = await JSZip.loadAsync(await response.body());
    const boardJson = JSON.parse(await exported.file('board.json').async('string'));
    const attachment = boardJson.cards.flatMap(card => card.attachments || [])[0];
    expect(attachment.fileName).toBe('audit.txt');
    const entry = Object.keys(exported.files).find(name => name.startsWith('attachments/') && name.endsWith('_audit.txt'));
    expect(entry).toBeTruthy();
    expect(Buffer.from(await exported.file(entry).async('nodebuffer'))).toEqual(bytes);

    boardJson.name += ' zip round trip';
    exported.file('board.json', JSON.stringify(boardJson));
    await importZip(await exported.generateAsync({ type: 'nodebuffer' }));
    await expect.poll(() => db.find('boards', { title: boardJson.name }).length).toBe(1);
    const restored = db.findOne('boards', { title: boardJson.name });
    boardIds.push(restored._id);
    await expect.poll(() => db.find('attachments', { 'meta.boardId': restored._id }).length).toBe(1);
    const restoredAttachment = db.findOne('attachments', { 'meta.boardId': restored._id });
    await openBoard(page, restored._id, restored.slug);
    const mtok = await page.evaluate(() => Meteor.connection._lastSessionId);
    const file = await page.request.get(`/cdn/storage/attachments/${restoredAttachment._id}/original/audit.txt`, { headers: { 'x-mtok': mtok } });
    expect(file.status()).toBe(200);
    expect(await file.body()).toEqual(bytes);
  } finally { db.cleanup({ boardIds }); }
});
