'use strict';

// Email to card (#794, #3948): the settings resolution, the email-to-card
// mapping and the personal board addresses.
// Run: node tests/emailToCard.test.cjs

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {
  DEFAULT_PARTS, cleanParts, resolveEmailToCard, cardFromEmail, htmlToText,
  cleanInboundAdmin, inboundMailAdminView, createRateLimiter,
} = require('../models/lib/emailToCard');
const {
  newBoardAddressToken, boardAddress, parseBoardAddress, recipientAddresses, subjectBoardToken,
} = require('../server/lib/inboundBoardAddress');
const { fromProviderFields, fromParsedMail } = require('../server/lib/inboundEmailPayload');

const ROOT = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(ROOT, file), 'utf8');
const { stripQuotedReply } = require('../server/lib/inboundEmailQuoteStrip');

const admin = { enabled: true, domain: 'boards.example.com' };

test('on only when the admin, the board and the member all allow it', () => {
  assert.equal(resolveEmailToCard({ admin, board: { enabled: true } }).enabled, true, 'member default is on');
  assert.deepEqual(
    [
      resolveEmailToCard({ admin: { enabled: false, domain: 'x' }, board: { enabled: true } }),
      resolveEmailToCard({ admin: { enabled: true }, board: { enabled: true } }),
      resolveEmailToCard({ admin, board: {} }),
      resolveEmailToCard({ admin, board: { enabled: true }, member: { enabled: false } }),
    ].map(r => [r.enabled, r.reason]),
    [[false, 'admin-off'], [false, 'admin-off'], [false, 'board-off'], [false, 'member-off']],
  );
  // A member cannot turn on what the admin or the board has off (negative).
  assert.equal(resolveEmailToCard({ admin: {}, board: { enabled: true }, member: { enabled: true } }).enabled, false);
  assert.equal(resolveEmailToCard({ admin, board: { enabled: false }, member: { enabled: true } }).enabled, false);
});

test('parts: member over board over defaults, unknown or invalid values dropped', () => {
  const r = resolveEmailToCard({
    admin,
    board: { enabled: true, listId: 'L', swimlaneId: 'S', parts: { attachments: false, description: 'none' } },
    member: { parts: { description: 'text', senderLine: false } },
  });
  assert.deepEqual(r.parts, { description: 'text', stripQuoted: true, attachments: false, senderLine: false });
  assert.equal(r.listId, 'L');
  assert.equal(r.swimlaneId, 'S');
  assert.deepEqual(cleanParts({ description: 'html', attachments: 'yes', evil: true, stripQuoted: false }), { stripQuoted: false });
  assert.deepEqual(cleanParts(null), {});
});

test('an email becomes a card: subject as title, stripped body, sender line, attachments', () => {
  const message = {
    subject: '  Fix   the login  ',
    text: 'Please fix it.\n\nOn Mon, Ann wrote:\n> old text\n',
    from: { name: 'Ann A', address: 'ann@example.com' },
    attachments: [{ filename: 'a.txt', content: Buffer.from('x') }, { filename: '', content: Buffer.from('y') }],
  };
  const card = cardFromEmail(message, DEFAULT_PARTS, { stripQuoted: stripQuotedReply });
  assert.equal(card.title, 'Fix the login');
  assert.equal(card.description, 'From: Ann A <ann@example.com>\n\nPlease fix it.');
  assert.deepEqual(card.attachments.map(a => a.filename), ['a.txt'], 'nameless attachments are skipped');
  const bare = cardFromEmail(message, { description: 'none', senderLine: false, attachments: false });
  assert.equal(bare.description, '');
  assert.deepEqual(bare.attachments, []);
});

test('no subject: the first line; no text part: the HTML as text, never as markup', () => {
  assert.equal(cardFromEmail({ text: '\n\nFirst line\nsecond' }, { senderLine: false }).title, 'First line');
  assert.equal(cardFromEmail({}, {}).title, 'Email');
  const html = '<html><head><style>p{}</style></head><body><p>Hi &amp; bye</p><script>alert(1)</script><div>Two</div></body></html>';
  assert.equal(htmlToText(html), 'Hi & bye\nTwo');
  const card = cardFromEmail({ subject: 's', html }, { senderLine: false });
  assert.equal(card.description, 'Hi & bye\nTwo');
  assert.doesNotMatch(card.description, /<|script|alert/);
  assert.equal(cardFromEmail({ subject: 'x'.repeat(400) }, {}).title.length, 255);
});

test('board addresses: random, case-sensitive tokens', () => {
  const a = newBoardAddressToken();
  const b = newBoardAddressToken();
  assert.match(a, /^[A-Za-z0-9]{22}$/);
  assert.notEqual(a, b);
  assert.equal(newBoardAddressToken(n => Buffer.alloc(n)), '0'.repeat(22));
  // Bytes 248..255 would bias the alphabet: they are thrown away (RandomBleed).
  let calls = 0;
  assert.equal(newBoardAddressToken(n => (calls++ ? Buffer.alloc(n, 61) : Buffer.alloc(n, 250))), 'z'.repeat(22));
  const address = boardAddress(a, 'boards.example.com');
  assert.equal(address, `board+${a}@boards.example.com`);
  assert.equal(parseBoardAddress(`Team <${address}>`), a);
  assert.equal(parseBoardAddress(address.replace('board+', 'BOARD+')), a, 'the prefix is case-insensitive');
  assert.equal(parseBoardAddress(address.replace(a, a.toLowerCase())), a.toLowerCase(),
    'the token keeps its case, so a lowercased one is a different (unknown) token');
});

test('anything that is not a board address is refused (negative)', () => {
  for (const value of ['reply+abc@x', 'board+short@x', `board+${'A'.repeat(23)}@x`, 'board+AAAAAAAAAAAAAAAAAAAA!!@x',
    'someone@x', '', null, 42, { address: 'board+x' }]) {
    assert.equal(parseBoardAddress(value), null, String(value));
  }
  assert.equal(boardAddress('bad', 'x'), '');
  assert.equal(boardAddress(newBoardAddressToken(), ''), '');
});

test('recipients: delivery headers first, then To and Cc, without duplicates', () => {
  assert.deepEqual(
    recipientAddresses({
      deliveredTo: 'board+X@d', originalTo: ['o@d'],
      to: 'Ann <a@d>, b@d', cc: [{ address: 'c@d' }, { value: 'a@d' }],
    }),
    ['board+X@d', 'o@d', 'a@d', 'b@d', 'c@d'],
  );
  assert.deepEqual(recipientAddresses({}), []);
});

test('provider webhooks: Mailgun, SendGrid and Postmark fields become one message', () => {
  const mailgun = fromProviderFields(
    { sender: 'ann@x', recipient: 'board+AAAAAAAAAAAAAAAAAAAAAA@d', subject: 'S', 'body-plain': 'B', 'Message-Id': '<m1>' },
    [{ fieldname: 'attachment-1', filename: 'a.pdf', contentType: 'application/pdf', content: Buffer.from('%PDF') },
      { fieldname: 'attachment-2', filename: '', content: Buffer.from('x') }],
  );
  assert.deepEqual([mailgun.from.address, mailgun.deliveredTo, mailgun.subject, mailgun.text, mailgun.messageId],
    ['ann@x', ['board+AAAAAAAAAAAAAAAAAAAAAA@d'], 'S', 'B', '<m1>']);
  assert.deepEqual(mailgun.attachments.map(a => a.filename), ['a.pdf']);

  const sendgrid = fromProviderFields({ from: '"Ann A" <ann@x>', to: 'list@d', envelope: '{"to":["board+B@d"],"from":"ann@x"}', text: 'T', html: '<p>T</p>' });
  assert.deepEqual([sendgrid.from, sendgrid.to, sendgrid.deliveredTo], [{ name: 'Ann A', address: 'ann@x' }, ['list@d'], ['board+B@d']]);
  assert.deepEqual(fromProviderFields({ envelope: '{broken' }).deliveredTo, [], 'a broken envelope is ignored');

  const postmark = fromProviderFields({ FromFull: { Email: 'ann@x', Name: 'Ann' }, ToFull: [{ Email: 'b@d' }], OriginalRecipient: 'board+C@d',
    Subject: 'P', TextBody: 'tb', HtmlBody: '<b>h</b>', MessageID: 'id', Attachments: [{ Name: 'n.txt', ContentType: 'text/plain', Content: Buffer.from('hi').toString('base64') }] });
  assert.deepEqual([postmark.from.name, postmark.to, postmark.deliveredTo, postmark.subject, postmark.text],
    ['Ann', ['b@d'], ['board+C@d'], 'P', 'tb']);
  assert.equal(postmark.attachments[0].content.toString(), 'hi');
});

test('a whole message (IMAP, raw webhook, Sandstorm Maildir) parsed by mailparser', async () => {
  const { simpleParser } = require('mailparser');
  const raw = [
    'Delivered-To: board+AAAAAAAAAAAAAAAAAAAAAA@d',
    'From: Ann <ann@x>', 'To: team@d', 'Cc: c@d', 'Subject: =?UTF-8?Q?P=C3=A4iv=C3=A4?=', 'Message-ID: <m2@x>',
    'MIME-Version: 1.0', 'Content-Type: multipart/mixed; boundary="b"', '',
    '--b', 'Content-Type: text/plain; charset=utf-8', '', 'Body text', '',
    '--b', 'Content-Type: text/plain; name="n.txt"', 'Content-Disposition: attachment; filename="n.txt"', '', 'file', '',
    '--b--', '',
  ].join('\r\n');
  const m = fromParsedMail(await simpleParser(raw));
  assert.deepEqual([m.from, m.to, m.cc, m.deliveredTo, m.subject, m.text.trim(), m.messageId],
    [{ name: 'Ann', address: 'ann@x' }, ['team@d'], ['c@d'], ['board+AAAAAAAAAAAAAAAAAAAAAA@d'], 'Päivä', 'Body text', '<m2@x>']);
  assert.deepEqual(m.attachments.map(a => a.filename), ['n.txt']);
});

test('Admin Panel inbound settings: cleaned, and the secrets never shown back', () => {
  const clean = cleanInboundAdmin({ enabled: true, domain: ' Boards.Example.com ', accounts: [
    { id: 'a1', host: 'IMAP.example.com', port: '993', username: 'u', mailbox: '', after: 'delete', enabled: true, password: 'leak' },
  ] });
  assert.deepEqual(clean, { enabled: true, domain: 'boards.example.com', accounts: [{ id: 'a1', label: '', host: 'imap.example.com',
    port: 993, secure: true, username: 'u', mailbox: 'INBOX', after: 'delete', enabled: true }] });
  assert.equal('password' in clean.accounts[0], false, 'a password is never part of the account');
  for (const [input, code] of [[{ enabled: true }, 'inbound-domain-required'], [{ domain: 'a b' }, 'inbound-domain-invalid'],
    [{ accounts: [{ id: 'x', host: 'bad host' }] }, 'inbound-account-invalid'],
    [{ accounts: [{ id: '../x', host: 'h' }] }, 'inbound-account-invalid'],
    [{ accounts: [{ id: 'x', host: 'h' }, { id: 'x', host: 'h' }] }, 'inbound-account-invalid']]) {
    assert.throws(() => cleanInboundAdmin(input), new RegExp(code));
  }
  const view = inboundMailAdminView({ enabled: true, domain: 'd', webhookSecret: 'S3CRET', webhookSecretSet: true,
    accounts: [{ id: 'a1', host: 'h' }], passwords: { a1: 'P4SS' }, passwordSet: { a1: true } });
  assert.doesNotMatch(JSON.stringify(view), /S3CRET|P4SS|passwords"/);
  assert.deepEqual([view.webhookSecretSet, view.accounts[0].passwordSet], [true, true]);
});

test('rate limit per board address, in a sliding window', () => {
  let t = 0;
  const allow = createRateLimiter({ limit: 2, windowMs: 100, now: () => t });
  assert.deepEqual([allow('a'), allow('a'), allow('a'), allow('b')], [true, true, false, true]);
  t = 101;
  assert.equal(allow('a'), true, 'the window slides');
});

test('Sandstorm: a member token in the subject reaches their board', () => {
  const token = 'AbCdEfGhIjKlMnOpQrStUv';
  assert.deepEqual(subjectBoardToken(`board+${token} Fix the login`), { token, subject: 'Fix the login' });
  assert.deepEqual(subjectBoardToken(`Re: [board+${token}] Fix`), { token, subject: 'Re: Fix' });
  for (const s of ['Fix the login', `board+${token}x`, 'board+short', `xboard+${token}`, null]) {
    assert.equal(subjectBoardToken(s).token, null, String(s));
  }
});

test('Sandstorm: an outgoing email is a valid capnp EmailMessage, limited to 20 recipients', async () => {
  const bridge = await import(path.join(ROOT, 'imports/sandstorm/bridgeClient.mjs'));
  const r = bridge.emailMessageRoundTrip({
    from: { address: 'grain@host', name: 'WeKan' }, to: [{ address: 'b@y' }], cc: [{ address: 'c@y' }],
    subject: 'S', text: 'T', html: '<p>T</p>', inReplyTo: '<p1>', references: ['<r1>', '<r2>'],
    attachments: [{ filename: 'f.txt', contentType: 'text/plain', content: Buffer.from('abc') }],
  });
  assert.deepEqual([r.from.address, r.from.name, r.to.get(0).address, r.cc.get(0).address, r.subject, r.text, r.html,
    r.inReplyTo.get(0), r.references.length], ['grain@host', 'WeKan', 'b@y', 'c@y', 'S', 'T', '<p>T</p>', '<p1>', 2]);
  assert.equal(Buffer.from(r.attachments.get(0).content.toUint8Array()).toString(), 'abc');
  assert.ok(r.date > 0n);
  const many = Array.from({ length: 21 }, (_, i) => ({ address: `u${i}@x` }));
  assert.throws(() => bridge.emailMessageRoundTrip({ to: many }), /20 recipients/);
});

test('source guards: the author is the address member, secrets stay on the server (negative)', () => {
  const server = read('server/emailToCard.js');
  // The card's author is the address row's user - never anything from the message.
  assert.match(server, /userId: user\._id,/);
  assert.doesNotMatch(server, /userId:\s*(message|from)/);
  assert.match(server, /allowIsBoardMemberWithWriteAccess\(user\._id, board\)/, 'write access checked at receipt');
  // inboundMail (passwords, webhook secret) is in no publication.
  for (const file of fs.readdirSync(path.join(ROOT, 'server/publications'))) {
    assert.doesNotMatch(read(`server/publications/${file}`), /inboundMail|board_email_addresses|BoardEmailAddresses/, file);
  }
  // Every inbound path goes through the same receiver.
  for (const file of ['server/lib/imapInbound.js', 'server/sandstormEmail.js']) {
    assert.match(read(file), /receiveEmail\(/, file);
  }
  assert.match(read('server/routes/inboundEmail.js'), /receiveBoardEmail\(message/);
  // Attachments obey the upload rule: no SVG.
  assert.match(server, /\.svg'\) \|\| type === 'image\/svg\+xml'/);
});

test('Problems -> Email: known kinds only, one row per kind, never a password', () => {
  const { KINDS, mailProblemEvent, scrub } = require('../models/lib/mailProblems');
  assert.deepEqual(Object.keys(KINDS).sort(), ['delivery-refused', 'imap-failed', 'receive-unreadable', 'send-failed']);
  const evt = mailProblemEvent('send-failed', { source: 'email-view', detail: '550 rejected', userId: 'u1' });
  assert.deepEqual(evt, { stream: 'mail', category: 'mail-send', bleed: 'MailSendFailed', severity: 'high', action: 'failed',
    source: 'email-view', detail: '550 rejected', userId: 'u1' });
  assert.equal(mailProblemEvent('anything-else', {}), null, 'a caller cannot invent a row (negative)');
  for (const leaky of ['A1 LOGIN cards@x Secr3t!', 'AUTH PLAIN AGNhcmRzAFNlY3IzdA==', 'password=Secr3t!', 'secret: Secr3t!']) {
    assert.doesNotMatch(scrub(leaky), /Secr3t|AGNhcmRzAFNlY3IzdA/, leaky);
  }
  assert.equal(scrub('a\r\nb').includes('\n'), false);
  assert.equal(scrub('x'.repeat(900)).length, 500);
  // Every place a mail problem can happen records one.
  const sources = ['server/emailView.js', 'server/emailToCard.js', 'server/lib/imapInbound.js', 'server/sandstormEmail.js',
    'server/routes/inboundEmail.js'].map(f => fs.readFileSync(path.join(ROOT, f), 'utf8'));
  assert.match(sources[0], /recordMailProblem\('send-failed'/);
  assert.match(sources[1], /recordMailProblem\('delivery-refused'/);
  assert.match(sources[2], /recordMailProblem\('imap-failed'/);
  assert.match(sources[2], /recordMailProblem\('receive-unreadable'/);
  assert.match(sources[3], /recordMailProblem\('send-failed'/);
  assert.match(sources[3], /recordMailProblem\('receive-unreadable'/);
  assert.match(sources[4], /recordMailProblem\('receive-unreadable'/);
  // ...and the Email stream is a pane of Admin Panel -> Problems.
  assert.match(fs.readFileSync(path.join(ROOT, 'models/eventLog.js'), 'utf8'), /EVENT_STREAMS = \[[^\]]*'mail'\]/);
  assert.match(fs.readFileSync(path.join(ROOT, 'client/components/settings/adminProblems.jade'), 'utf8'),
    /else if isPane 'report-mail'\n\s*\+eventStreamReport\(stream="mail"\)/);
});
