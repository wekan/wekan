'use strict';
// Outlook's .msg ([MS-CFB] holding [MS-OXMSG]): read into the messages the
// mail import makes cards of, with their attachments, and a board written
// as .eml files (models/lib/outlookMsgFormat.js, server/lib/microsoftArchives.js).
// The .msg files here are written by a small Compound File writer below,
// with small streams in the mini stream and large ones in FAT chains, as
// Outlook writes them.
// Run: node --test tests/outlookMsg.test.cjs
const test = require('node:test');
// The export boundary's HTML sanitizer at its strictest: every tag removed,
// to a fixed point (tests/tagStrippingFixedPoint.test.cjs).
function stripEveryTag(value) {
  let out = value;
  let prev;
  do {
    prev = out;
    out = out.replace(/<[^>]*>/g, '');
  } while (out !== prev);
  return out;
}
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { zipSync, strToU8 } = require('fflate');

let msg;
let mail;
test.before(async () => {
  msg = await import('../models/lib/outlookMsgFormat.js');
  mail = await import('../models/lib/mailFormat.js');
});

// The .msg files: a small Compound File writer, shared with
// tests/attachmentRichViewer.test.cjs.
const { sampleMsg } = require('./lib/outlookMsgFixture.cjs');

test('a .msg is read: subject, sender, recipients, time, ids, body and attachments', () => {
  const m = msg.readOutlookMsg(sampleMsg());
  assert.strictEqual(m.subject, 'Quarterly plan');
  assert.deepStrictEqual(m.from, { name: 'Megan Bowen', address: 'megan@contoso.com' });
  assert.deepStrictEqual(m.to, [{ name: 'Alex Wilber', address: 'alex@contoso.com' }]);
  assert.deepStrictEqual(m.cc, [{ name: 'Lee Gu', address: 'lee@contoso.com' }]);
  assert.strictEqual(m.date, '2026-11-20T09:30:00.000Z');
  assert.strictEqual(m.messageId, '<plan@contoso.com>');
  assert.strictEqual(m.text, 'Here is the plan.\r\nComments welcome.');
  assert.deepStrictEqual(m.files.map(f => f.name), ['plan.xlsx', 'notes.txt']);
  // The large one came through FAT sectors, the small one the mini stream.
  assert.strictEqual(Buffer.from(m.files[0].file, 'base64').length, 6000);
  assert.strictEqual(Buffer.from(m.files[0].file, 'base64')[300], 300 % 251);
  assert.strictEqual(Buffer.from(m.files[1].file, 'base64').toString(), 'short');
  // An embedded message has no file data: counted, not imported.
  assert.strictEqual(m.attachments, 1);
});

test('messages become mail cards, threads by their ids, attachments on the card', () => {
  const first = msg.readOutlookMsg(sampleMsg());
  const reply = msg.readOutlookMsg(sampleMsg({ subject: 'RE: Quarterly plan', id: '<re@contoso.com>', inReplyTo: '<plan@contoso.com>', big: 10 }));
  const board = mail.parseMailMessages([first, reply], { name: 'Imported Outlook mail' });
  assert.strictEqual(board.tasks.length, 1);
  const card = board.tasks[0];
  assert.strictEqual(card.title, 'Quarterly plan');
  assert.strictEqual(card.email.from.address, 'megan@contoso.com');
  assert.deepStrictEqual(card.email.to, ['alex@contoso.com']);
  assert.strictEqual(card.comments.length, 1);
  assert.deepStrictEqual(card.attachments.map(a => a.name), ['plan.xlsx', 'notes.txt', 'plan.xlsx', 'notes.txt']);
  assert.ok(board.unsupported.some(u => /2 mail attachment/.test(u.reason)));
});

test('a .zip of .msg and .eml files, and one .msg as bytes, are read on the server', async () => {
  const { readOutlookMessages } = require('../server/lib/microsoftArchives');
  const eml = 'From: Lee Gu <lee@contoso.com>\r\nTo: megan@contoso.com\r\nSubject: Lunch\r\nMessage-ID: <lunch@contoso.com>\r\nDate: Fri, 20 Nov 2026 11:00:00 +0000\r\n\r\nAt noon?\r\n';
  const zipBase64 = Buffer.from(zipSync({ 'mail/plan.msg': sampleMsg(), 'mail/lunch.eml': strToU8(eml), '__MACOSX/._plan.msg': strToU8('x') })).toString('base64');
  const messages = await readOutlookMessages({ zipBase64 });
  assert.deepStrictEqual(messages.map(m => m.subject).sort(), ['Lunch', 'Quarterly plan']);
  const one = await readOutlookMessages({ binaryBase64: Buffer.from(sampleMsg()).toString('base64') });
  assert.strictEqual(one[0].subject, 'Quarterly plan');
});

test('export: a card and its comments as .eml files Outlook opens, which the import reads back', async () => {
  const built = msg.formatOutlookEml({ items: [{ cardId: 'c1', title: 'Quarterly plan', description: 'Here is the plan.',
    creator: 'megan', createdAt: '2026-11-20T09:30:00.000Z', labels: [],
    comments: [{ text: 'Looks good.', author: 'alex', date: '2026-11-20T10:00:00.000Z' }] }] });
  const files = msg.outlookArchiveFiles(built);
  const names = Object.keys(files);
  assert.deepStrictEqual(names, ['0001-Quarterly-plan.eml', '0002-Quarterly-plan.eml']);
  const first = files[names[0]];
  assert.ok(!/^From /.test(first), 'an .eml has no mbox "From " line');
  assert.match(first, /\r\nSubject: Quarterly plan\r\n/);
  const { decodeMail } = require('../server/lib/mailImport');
  const back = mail.parseMailMessages([...await decodeMail(first), ...await decodeMail(files[names[1]])]);
  assert.strictEqual(back.tasks.length, 1);
  assert.strictEqual(back.tasks[0].title, 'Quarterly plan');
  assert.strictEqual(back.tasks[0].comments[0].text, 'Looks good.');
});

test('negative: the export boundary cannot take the messages apart - they are written after it', async () => {
  // The boundary passes every string that looks like markup through the HTML
  // sanitizer; a sanitizer that removes every tag stands in for it here.
  const { sanitizeTransferValue } = await import('../models/lib/importExportBoundary.js');
  const built = msg.formatOutlookEml({ items: [{ cardId: 'c1', title: 'Plan', description: 'Text', creator: 'megan',
    createdAt: '2026-11-20T09:30:00.000Z', labels: [], comments: [{ text: 'Reply', author: 'alex' }] }] });
  const checked = sanitizeTransferValue(built, { direction: 'export', sanitizeHtml: stripEveryTag });
  assert.deepStrictEqual(checked.warnings, [], 'nothing in the document is markup');
  const files = Object.values(msg.outlookArchiveFiles(checked.value));
  assert.match(files[0], /\r\nMessage-ID: <c1@wekan\.invalid>\r\n/);
  assert.match(files[1], /\r\nIn-Reply-To: <c1@wekan\.invalid>\r\n/);
});

test('negative: what is not a Compound File, or whose sector chain loops, is refused', () => {
  assert.throws(() => msg.readOutlookMsg(new Uint8Array(Buffer.from('From: x\r\n\r\nnot a msg'.padEnd(600)))), /not a Compound File/);
  const looped = Buffer.from(sampleMsg());
  // The directory's first sector points to itself in the FAT.
  const dirSector = looped.readUInt32LE(0x30);
  looped.writeUInt32LE(dirSector, 512 + dirSector * 4);
  assert.throws(() => msg.readOutlookMsg(new Uint8Array(looped)), /loops/);
  assert.strictEqual(msg.isMsg(new Uint8Array(10)), false);
  // Only the names formatOutlookEml writes reach the zip.
  // Only formatOutlookEml's cards are written, under names it makes.
  assert.deepStrictEqual(msg.outlookArchiveFiles({ files: { '../evil.eml': 'x' } }), {});
  assert.deepStrictEqual(Object.keys(msg.outlookArchiveFiles({ outlook: true, items: [{ title: '../../evil', cardId: 'x' }] })), ['0001-evil.eml']);
});

test('the import reads .msg as bytes and the source is wired end to end', () => {
  const read = rel => fs.readFileSync(path.join(__dirname, '..', rel), 'utf8');
  assert.match(read('models/lib/importSources.js'), /key: 'outlook'[^\n]*files: \['\.msg', '\.zip'\]/);
  assert.match(read('server/lib/importUploadSource.js'), /return \{ binaryFile: file \}/);
  assert.match(read('server/lib/messageImports.js'), /case 'outlook':[\s\S]*readOutlookMessages/);
});
