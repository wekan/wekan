'use strict';
// Mail import and export: mbox and .eml (models/lib/mailFormat.js, decoded on
// the server by server/lib/mailImport.js with mailparser). A conversation is
// one card in the Inbox list with its `email`, so Board View / Email shows it;
// the replies are its comments.
// Run: node --test tests/mailFormat.test.cjs
const test = require('node:test');
const assert = require('node:assert');
const { decodeMail } = require('../server/lib/mailImport');
const { splitMbox } = require('../models/lib/mboxSplit');

// As Gmail writes it in Google Takeout: X-Gmail-Labels, an encoded subject, a
// quoted-printable body, a reply in the same thread, and a body line that
// begins "From " escaped as ">From ".
const MBOX = [
  'From 1790000000000000000@xxx Mon Nov 16 10:00:00 +0000 2026',
  'X-Gmail-Labels: Inbox,Projekti,Unread',
  'From: =?UTF-8?Q?Matti_M=C3=A4kel=C3=A4?= <matti@example.com>',
  'To: team@example.com, Anna <anna@example.com>',
  'Subject: =?UTF-8?Q?P=C3=A4=C3=A4t=C3=B6s?=',
  'Date: Mon, 16 Nov 2026 10:00:00 +0000',
  'Message-ID: <first@example.com>',
  'MIME-Version: 1.0',
  'Content-Type: text/plain; charset=UTF-8',
  'Content-Transfer-Encoding: quoted-printable',
  '',
  'Hyv=C3=A4ksyt=C3=A4=C3=A4n.',
  '>From here on it is a quoted line.',
  '',
  'From 1790000000000000001@xxx Mon Nov 16 11:00:00 +0000 2026',
  'X-Gmail-Labels: Sent,Projekti',
  'From: Anna <anna@example.com>',
  'To: matti@example.com',
  'Subject: Re: =?UTF-8?Q?P=C3=A4=C3=A4t=C3=B6s?=',
  'Date: Mon, 16 Nov 2026 11:00:00 +0000',
  'Message-ID: <reply@example.com>',
  'In-Reply-To: <first@example.com>',
  'References: <first@example.com>',
  'Content-Type: text/plain; charset=UTF-8',
  '',
  'Sovittu.',
  '',
  'From x Tue Nov 17 09:00:00 2026',
  'From: Other <other@example.org>',
  'Subject: Another thread',
  'Date: Tue, 17 Nov 2026 09:00:00 +0000',
  'Message-ID: <other@example.org>',
  'Content-Type: multipart/mixed; boundary="b"',
  '',
  '--b',
  'Content-Type: text/html; charset=UTF-8',
  '',
  '<p>Only <b>HTML</b> here</p>',
  '--b',
  'Content-Type: application/pdf; name="a.pdf"',
  'Content-Disposition: attachment; filename="a.pdf"',
  'Content-Transfer-Encoding: base64',
  '',
  'JVBERi0xLjQK',
  '--b--',
  '',
].join('\n');

let mail;
test.before(async () => { mail = await import('../models/lib/mailFormat.js'); });

test('an mbox splits into its messages, and an .eml is one', () => {
  const parts = splitMbox(MBOX);
  assert.strictEqual(parts.length, 3);
  assert.match(parts[0], /^From here on it is a quoted line\.$/m, 'the >From escape is taken off');
  assert.strictEqual(splitMbox('From: a@example.com\nSubject: x\n\nbody').length, 1);
  assert.deepStrictEqual(splitMbox(''), []);
});

test('a conversation is one card of mail in the Inbox, its reply a comment', async () => {
  const board = mail.parseMailMessages(await decodeMail(MBOX), { name: 'Mail' });
  assert.deepStrictEqual(board.columns, [{ title: 'Inbox' }]);
  assert.strictEqual(board.tasks.length, 2);
  const [thread, other] = board.tasks;
  assert.strictEqual(thread.title, 'Päätös');
  assert.match(thread.description, /^Hyväksytään\.\nFrom here on/);
  assert.deepStrictEqual(thread.tags, ['Projekti']);
  assert.strictEqual(thread.email.direction, 'in');
  assert.deepStrictEqual(thread.email.from, { name: 'Matti Mäkelä', address: 'matti@example.com' });
  assert.deepStrictEqual(thread.email.to, ['team@example.com', 'anna@example.com']);
  assert.deepStrictEqual(thread.email.threadIds.sort(), ['first@example.com', 'reply@example.com'],
    'without brackets, which the import sanitizer would read as tags');
  assert.deepStrictEqual(thread.comments.map(c => [c.author, c.authorName, c.text]),
    [['anna@example.com', 'Anna', 'Sovittu.']]);
  // An HTML-only message reads as text; its attachment is reported, not kept.
  assert.match(other.description, /Only HTML here/);
  assert.ok(board.unsupported.some(u => /1 mail attachment/.test(u.reason)));
});

test('the card plan keeps a valid email and refuses a malformed one', async () => {
  const { planImportedTask, importedEmail } = await import('../models/lib/importedTaskPlan.js');
  const board = mail.parseMailMessages(await decodeMail(MBOX));
  const plan = planImportedTask(board.tasks[0]);
  assert.strictEqual(plan.card.email.from.address, 'matti@example.com');
  assert.ok(plan.card.receivedAt instanceof Date);
  assert.ok(plan.card.email.at instanceof Date);
  // The card stores them as email to card does, so a later reply joins the thread.
  assert.strictEqual(plan.card.email.messageId, '<first@example.com>');
  assert.deepStrictEqual(plan.card.email.threadIds.sort(), ['<first@example.com>', '<reply@example.com>']);
  // Through the real sanitizer of the import boundary nothing is lost.
  const { sanitizeTransferValue } = await import('../models/lib/importExportBoundary.js');
  const sanitizeHtml = require('sanitize-html');
  const { value: clean } = sanitizeTransferValue(board.tasks[0], { sanitizeHtml: v => sanitizeHtml(v, { allowedTags: [], allowedAttributes: {} }) });
  assert.deepStrictEqual(planImportedTask(clean).card.email.threadIds.sort(), ['<first@example.com>', '<reply@example.com>']);
  // Negative: no usable sender is no mail, header injection is flattened,
  // unknown keys are dropped.
  assert.strictEqual(importedEmail({ from: { address: 'not an address' } }), undefined);
  const odd = importedEmail({ from: { address: 'a@b.example' }, subject: 'x\r\nBcc: evil@example.com',
    to: ['ok@example.com', 'bad address', '<x@y>'], secret: 1 });
  assert.strictEqual(odd.subject, 'x Bcc: evil@example.com');
  assert.deepStrictEqual(odd.to, ['ok@example.com']);
  assert.ok(!('secret' in odd));
});

test('a board exported as an .mbox reads back as the same cards and comments', async () => {
  const items = [
    { cardId: 'c1', title: 'Order valves', description: 'Two.\nFrom the shop.', creator: 'anna', createdAt: '2026-11-01T10:00:00.000Z',
      comments: [{ text: 'Done', author: 'matti', date: '2026-11-02T10:00:00.000Z' }] },
    { cardId: 'c2', title: 'Päätös', description: '', creator: 'matti', createdAt: '2026-11-03T10:00:00.000Z',
      email: { from: { name: 'Matti', address: 'matti@example.com' }, to: ['anna@example.com'], messageId: '<first@example.com>', at: '2026-11-03T10:00:00.000Z' } },
  ];
  const mbox = mail.formatMbox({ items });
  assert.strictEqual(splitMbox(mbox).length, 3);
  assert.match(mbox, /^>From the shop\.$/m, 'a body line starting "From " is escaped');
  const back = mail.parseMailMessages(await decodeMail(mbox));
  assert.deepStrictEqual(back.tasks.map(t => t.title), ['Order valves', 'Päätös']);
  assert.strictEqual(back.tasks[0].description, 'Two.\nFrom the shop.');
  assert.deepStrictEqual(back.tasks[0].comments.map(c => c.text), ['Done']);
  assert.strictEqual(back.tasks[1].email.from.address, 'matti@example.com');
  assert.deepStrictEqual(back.tasks[1].email.to, ['anna@example.com']);
});
