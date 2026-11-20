'use strict';
// Mail, calendar, chat and note imports through the Import page, read back in
// the views they are for: an mbox in Board View / Email, a Slack export in
// Board View / Chat, an .ics and an .enex with their dates and checklists.
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const { navigateInApp } = require('../helpers/auth');
const { waitForImportedBoard } = require('../helpers/import');

const MBOX = [
  'From 1@xxx Mon Nov 16 10:00:00 +0000 2026', 'X-Gmail-Labels: Inbox,Projekti',
  'From: Sam Sender <sam@example.test>', 'To: team@example.test', 'Subject: Printer jams',
  'Date: Mon, 16 Nov 2026 10:00:00 +0000', 'Message-ID: <p1@example.test>', '', 'The printer jams again.', '',
  'From 2@xxx Mon Nov 16 11:00:00 +0000 2026', 'From: Ann <ann@example.test>', 'Subject: Re: Printer jams',
  'Date: Mon, 16 Nov 2026 11:00:00 +0000', 'Message-ID: <p2@example.test>', 'In-Reply-To: <p1@example.test>', '', 'On it.', '',
].join('\n');

async function openView(page, boardId, view) {
  await page.waitForFunction(() => typeof Meteor !== 'undefined' && Meteor.userId && Meteor.userId() && !Meteor.loggingIn(),
    undefined, { timeout: 30_000 });
  await page.evaluate(async ([v, id]) => Meteor.callAsync('setBoardView', v, id), [view, boardId]);
  await navigateInApp(page, `/b/${boardId}/x`);
}

async function importText(page, source, text) {
  await navigateInApp(page, `/import/${source}`);
  await page.locator('#import-textarea').fill(text);
  await page.locator('.js-import-without-mapping').click();
  await waitForImportedBoard(page);
  return page.url().match(/\/b\/([^/]+)/)[1];
}

test('an mbox conversation is one mail card in the Email view, the reply its comment', async ({ loggedInPage: page }) => {
  let boardId;
  try {
    boardId = await importText(page, 'mail', MBOX);
    const [card] = db.find('cards', { boardId });
    expect(card.title).toBe('Printer jams');
    expect(card.email.from.address).toBe('sam@example.test');
    expect(card.email.threadIds.sort()).toEqual(['<p1@example.test>', '<p2@example.test>']);
    expect(db.find('card_comments', { cardId: card._id }).map(c => c.text).join('\n')).toContain('On it.');
    await openView(page, boardId, 'board-view-email');
    const row = page.locator('.email-view .email-view-row', { hasText: 'Printer jams' });
    await expect(row).toBeVisible();
    await expect(row.locator('.email-view-from')).toHaveText('Sam Sender');
    await expect(page.locator('.email-view-folders').getByText('Projekti', { exact: true })).toBeVisible();
  } finally { if (boardId) db.cleanup({ boardIds: [boardId] }); }
});

test('a Slack export .zip shows its channel and messages in the Chat view', async ({ loggedInPage: page }) => {
  const { zipSync, strToU8 } = require('../../../node_modules/fflate');
  const json = value => strToU8(JSON.stringify(value));
  const zip = Buffer.from(zipSync({
    'users.json': json([{ id: 'U1', name: 'ann', profile: { display_name: 'Ann' } }]),
    'channels.json': json([{ id: 'C1', name: 'general', purpose: { value: 'Everything' } }]),
    'general/2026-11-16.json': json([{ type: 'message', user: 'U1', text: 'Release today', ts: '1794823200.000100' }]),
  }));
  let boardId;
  try {
    await navigateInApp(page, '/import/slack');
    await page.locator('.js-import-file').setInputFiles({ name: 'slack.zip', mimeType: 'application/zip', buffer: zip });
    await page.locator('.js-import-without-mapping').click();
    await waitForImportedBoard(page);
    boardId = page.url().match(/\/b\/([^/]+)/)[1];
    await openView(page, boardId, 'board-view-chat');
    const view = page.locator('.chat-view');
    await view.locator('.js-chat-select-card', { hasText: '#general' }).click();
    await expect(view.locator('.chat-view-message', { hasText: 'Release today' })).toBeVisible();
  } finally { if (boardId) db.cleanup({ boardIds: [boardId] }); }
});

test('an .ics and an .enex keep their dates, lists and checklists', async ({ loggedInPage: page }) => {
  const boards = [];
  try {
    boards.push(await importText(page, 'ical', 'BEGIN:VCALENDAR\nX-WR-CALNAME:Home\nBEGIN:VTODO\nUID:a\nSUMMARY:Pay rent\nDUE:20261130T120000Z\nSTATUS:IN-PROCESS\nEND:VTODO\nEND:VCALENDAR\n'));
    const [rent] = db.find('cards', { boardId: boards[0] });
    expect(db.findOne('boards', { _id: boards[0] }).title).toBe('Home');
    expect(db.findOne('lists', { _id: rent.listId }).title).toBe('In Progress');
    expect(new Date(rent.dueAt).toISOString()).toBe('2026-11-30T12:00:00.000Z');
    boards.push(await importText(page, 'evernote', '<?xml version="1.0"?><en-export><note><title>Groceries</title>'
      + '<content><![CDATA[<en-note><div><en-todo checked="true"/>Milk</div><div><en-todo/>Bread</div></en-note>]]></content>'
      + '<tag>home</tag></note></en-export>'));
    const [note] = db.find('cards', { boardId: boards[1] });
    expect(note.title).toBe('Groceries');
    const items = db.find('checklistItems', { cardId: note._id }).map(i => [i.title, Boolean(i.isFinished)]).sort();
    expect(items).toEqual([['Bread', false], ['Milk', true]]);
  } finally { db.cleanup({ boardIds: boards }); }
});

test('negative: a file that is not of the chosen kind is refused and makes no board', async ({ loggedInPage: page }) => {
  await navigateInApp(page, '/import/ical');
  const results = await page.evaluate(async () => {
    const attempt = async (doc, source) => {
      try { await Meteor.callAsync('importBoard', doc, {}, source); return 'allowed'; } catch (e) { return e.error; }
    };
    return [await attempt('just text', 'ical'), await attempt('<opml/>', 'evernote'), await attempt('{"type":"post"}', 'mattermost'),
      await attempt({ zipBase64: 'bm90IGEgemlw' }, 'slack')];
  });
  expect(results).toEqual(['invalid-import-format', 'invalid-import-format', 'invalid-import-format', 'invalid-import-format']);
});

test('negative: a file over the administrator\'s largest import is refused by the upload', async ({ loggedInPage: page }) => {
  db.updateOne('settings', {}, { $set: { importMaxMegabytes: 1 } });
  try {
    await navigateInApp(page, '/import/mail');
    const before = db.countDocuments('boards', {});
    const big = Buffer.from(`${MBOX}\n${'x'.repeat(2 * 1024 * 1024)}\n`);
    await page.locator('.js-import-file').setInputFiles({ name: 'big.mbox', mimeType: 'application/mbox', buffer: big });
    await page.locator('.js-import-without-mapping').click();
    await expect(page.locator('.warning').first()).toBeVisible();
    expect(db.countDocuments('boards', {})).toBe(before);
    // The route answers the same to a direct POST, with the reason.
    const status = await page.evaluate(async size => {
      const token = localStorage.getItem('Meteor.loginToken');
      const r = await fetch('/api/import/upload/mail', { method: 'POST', headers: { 'Content-Type': 'application/octet-stream', Authorization: `Bearer ${token}` }, body: new Uint8Array(size) });
      return [r.status, (await r.json()).error];
    }, 2 * 1024 * 1024);
    expect(status).toEqual([413, 'import-too-large']);
  } finally {
    db.updateOne('settings', {}, { $unset: { importMaxMegabytes: '' } });
  }
});
