'use strict';
// An attachment's SHA-256 and search text (server/lib/attachmentContentIndex.js):
// made when it is added, with the time and an "added" card history row; found
// by Filter, the board's Search and Search All Boards; checked on a whole
// read - a file changed behind WeKan's back is a Problems warning, a known
// earlier version is accepted with new hash and search text.
const crypto = require('node:crypto');
const fs = require('node:fs');
const { test, expect: baseExpect } = require('../fixtures');
const db = require('../helpers/db');
const BoardPage = require('../pages/BoardPage');
const CardPage = require('../pages/CardPage');
const SearchPage = require('../pages/SearchPage');

const sha = data => crypto.createHash('sha256').update(data).digest('hex');
// A raw-driver write reaches the page on Meteor's next poll in a test database.
const expect = baseExpect.configure({ timeout: 40_000 });

test('attachment text: hashed and indexed, found by Filter, Search and Search All Boards, and checked on read', async ({ boardPage: page, board }) => {
  test.setTimeout(180_000);
  const word = `zephyrquokka${Date.now()}`;
  const content = Buffer.from(`Meeting notes\nThe ${word} plan is approved.\n`);
  const bp = new BoardPage(page);
  const cp = new CardPage(page);
  const sp = new SearchPage(page);
  const card = db.findOne('cards', { boardId: board.boardId, title: 'Alpha Card' });
  const other = db.findOne('cards', { boardId: board.boardId, title: 'Beta Card' });

  await bp.clickCard(board.listIds[0], 'Alpha Card');
  await cp.waitForOpen();
  const details = page.locator('.card-details');
  const header = details.locator('.js-toggle-card-section[data-section="attachments"]');
  if (await header.locator('.fa-caret-right').count()) await header.click();
  await details.locator('.attachment-gallery .js-add-attachment').click();
  await page.locator('.js-pop-over .js-attach-file').setInputFiles({ name: 'notes.txt', mimeType: 'text/plain', buffer: content });

  // Added: its hash, its search text, each with a time, and the history row.
  await expect.poll(() => db.findOne('attachments', { 'meta.cardId': card._id })?.contentHash?.value).toBe(sha(content));
  const attachment = db.findOne('attachments', { 'meta.cardId': card._id });
  expect(attachment.contentHash.algorithm).toBe('sha256');
  expect(attachment.contentHash.at).toBeTruthy();
  await expect.poll(() => db.findOne('documentPreviews', { attachmentId: attachment._id })?.searchText || '').toContain(word);
  expect(db.findOne('documentPreviews', { attachmentId: attachment._id }).generatedAt).toBeTruthy();
  // ONE "added" row: the upload hook's. The content index used to write a
  // second one carrying the hash, which showed every upload twice in the card
  // history (5ba1098521); the hash is on the attachment, checked above.
  await expect.poll(() => db.countDocuments('changeHistory', { entityType: 'attachment', entityId: attachment._id, changeType: 'added' })).toBe(1);
  await cp.close();

  // Filter: the text filter finds the card by its attachment's text alone.
  const ids = () => page.locator('.board-canvas .js-minicard').evaluateAll(rows => rows.map(r => r.dataset.cardId).sort());
  await page.locator('.js-open-filter-view').click();
  await page.locator('.js-field-card-filter').fill(word);
  await expect.poll(ids).toEqual([card._id]);
  await page.locator('.js-field-card-filter').fill('');
  await expect.poll(ids).toContain(other._id);

  // Search (the board's own search sidebar), from a fresh page: the Filter
  // sidebar is open above.
  await page.reload();
  await page.locator('.board-canvas .js-minicard').first().waitFor();
  await sp.openBoardSearch();
  await sp.boardSearch(word);
  await expect.poll(() => sp.boardSearchResults().count()).toBe(1);

  // Search All Boards.
  await sp.navigateToGlobalSearch();
  await sp.globalSearch(word);
  await expect.poll(() => sp.globalSearchResultTitles()).toEqual(['Alpha Card']);

  const filePath = attachment.versions?.original?.path;
  test.skip(!filePath || !fs.existsSync(filePath), 'the attachment is not on this machine\'s filesystem');
  const fetchWhole = () => page.evaluate(async id => (await fetch(`/cdn/storage/attachments/${id}`, { cache: 'no-store' })).text(), attachment._id);

  // A file changed behind WeKan's back: Admin Panel / Problems, and the stored
  // hash is kept.
  const tampered = Buffer.from(content.toString().replace('approved', 'REJECTED'));
  fs.writeFileSync(filePath, tampered);
  expect(await fetchWhole()).toContain('REJECTED');
  await expect.poll(() => db.findOne('eventlog', { stream: 'security', source: 'attachment-read' })?.count || 0).toBeGreaterThan(0);
  expect(db.findOne('attachments', { _id: attachment._id }).contentHash.value).toBe(sha(content));

  // Negative: a partial read (a range) is no evidence.
  const before = db.findOne('eventlog', { stream: 'security', source: 'attachment-read' }).count;
  await page.evaluate(async id => (await fetch(`/cdn/storage/attachments/${id}`, { headers: { Range: 'bytes=0-3' }, cache: 'no-store' })).text(), attachment._id);
  await page.waitForTimeout(1500);
  expect(db.findOne('eventlog', { stream: 'security', source: 'attachment-read' }).count).toBe(before);

  // A version the card history knows (an undo or restore brought it back):
  // accepted, and its hash and search text made again.
  db.insertOne('changeHistory', { _id: `hist-${attachment._id}`, boardId: board.boardId, cardId: card._id, entityType: 'attachment',
    entityId: attachment._id, group: 'lifecycle', changeType: 'restored', previousContent: null,
    newContent: { deleted: false, name: 'notes.txt', contentHash: sha(tampered) }, userId: attachment.userId, createdAt: new Date() });
  await fetchWhole();
  await expect.poll(() => db.findOne('attachments', { _id: attachment._id }).contentHash.value).toBe(sha(tampered));
  await expect.poll(() => db.findOne('documentPreviews', { attachmentId: attachment._id })?.searchText || '').toContain('REJECTED');
});
