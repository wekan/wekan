import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';
import { Email, EmailInternals } from 'meteor/email';
import Boards from '/models/boards';
import Cards from '/models/cards';
import Lists from '/models/lists';
import Swimlanes from '/models/swimlanes';
import Settings from '/models/settings';
import EventLog from '/models/eventLog';
import { BoardEmailAddresses } from '/server/emailToCard';
import { pollAll } from '/server/lib/imapInbound';
import { pollMaildir } from '/server/sandstormEmail';
import { installAdminMailTransport } from '/server/lib/mailTransport';
import { startFakeSmtpServer } from './fakeSmtpServer';
import { startFakeImapServer } from './fakeImapServer';

const { simpleParser } = require('mailparser');

// Sending and receiving email for real, locally (#794, #3948): WeKan's own
// transports against a local SMTP server and a local IMAP server over TCP,
// the Sandstorm Maildir from a real directory, and the provider webhook over
// HTTP. Every way it can go wrong is checked to be handled - the member is told,
// nothing is half-made - and to be visible in Admin Panel -> Problems: the
// Email stream for what a real user meets, the Security stream for attempts.
describe('Email sending and receiving (runtime, local servers)', function () {
  this.timeout(90000);
  const call = (userId, name, ...args) => Meteor.server.method_handlers[name].apply({ userId }, args);
  const domain = `mail-${Random.id(6).toLowerCase()}.example.test`;
  const member = Random.id();
  const boardId = Random.id(), listId = Random.id(), laneId = Random.id();
  let settingId, previousInbound, createdSetting = false, savedTransport;
  let smtp, imap;
  // Mailbox ids of this run: the poller remembers each mailbox's last UID in
  // the database, which outlives a test run.
  const imapT = `imapT${Random.id(6)}`, imapBad = `imapBad${Random.id(6)}`;

  // A problem's row is per kind AND source, so one kind can have several rows:
  // the total, and the newest row's detail.
  async function problem(stream, bleed) {
    const rows = await EventLog.rawCollection().find({ stream, bleed }).sort({ at: -1 }).toArray();
    if (!rows.length) return null;
    return { ...rows[0], count: rows.reduce((n, r) => n + (r.count || 0), 0) };
  }
  async function countAfter(stream, bleed, before) {
    for (let i = 0; i < 60; i += 1) {
      const row = await problem(stream, bleed);
      if ((row?.count || 0) > before) return row;
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    return problem(stream, bleed);
  }

  before(async function () {
    if (!Meteor.isAppTest) this.skip();
    await Meteor.users.rawCollection().insertOne({ _id: member, username: `mail-${member}`, profile: { fullname: 'Mail Member' },
      emails: [{ address: `m-${member}@example.test`, verified: true }] });
    await Boards.rawCollection().insertOne({ _id: boardId, title: 'Mail board', permission: 'private', archived: false,
      cardNumber: 0, members: [{ userId: member, isAdmin: true, isActive: true }], emailToCard: { enabled: true, listId } });
    await Swimlanes.rawCollection().insertOne({ _id: laneId, boardId, title: 'Lane', sort: 0, archived: false });
    await Lists.rawCollection().insertOne({ _id: listId, boardId, title: 'Inbox', sort: 0, archived: false });
    const setting = await Settings.findOneAsync({});
    if (setting) { settingId = setting._id; previousInbound = setting.inboundMail; }
    else { settingId = Random.id(); createdSetting = true; await Settings.rawCollection().insertOne({ _id: settingId }); }
    await Settings.rawCollection().updateOne({ _id: settingId }, { $set: { inboundMail: { enabled: true, domain } } });
    savedTransport = Email.customTransport;
    smtp = await startFakeSmtpServer();
    imap = await startFakeImapServer({ user: 'cards@example.test', password: 'right-password' });
  });

  after(async function () {
    if (!Meteor.isAppTest) return;
    Email.customTransport = savedTransport;
    if (smtp) await smtp.close();
    if (imap) await imap.close();
    if (createdSetting) await Settings.rawCollection().deleteOne({ _id: settingId });
    else if (previousInbound === undefined) await Settings.rawCollection().updateOne({ _id: settingId }, { $unset: { inboundMail: '' } });
    else await Settings.rawCollection().updateOne({ _id: settingId }, { $set: { inboundMail: previousInbound } });
    await Cards.rawCollection().deleteMany({ boardId });
    await Lists.rawCollection().deleteMany({ boardId });
    await Swimlanes.rawCollection().deleteMany({ boardId });
    await Boards.rawCollection().deleteOne({ _id: boardId });
    await BoardEmailAddresses.rawCollection().deleteMany({ boardId });
    await Meteor.users.rawCollection().deleteOne({ _id: member });
  });

  function useSmtp(port) {
    // The transport the Admin Panel's SMTP settings install - the real one.
    const result = installAdminMailTransport({ Email, EmailInternals, mailServer: {
      enabled: true, service: 'SMTP', configurations: { SMTP: { host: '127.0.0.1', port: String(port), secure: false, from: 'wekan@example.test' } },
    } });
    assert.equal(result, 'admin-settings');
  }

  async function memberAddress() {
    const result = await call(member, 'emailToCardAddress', boardId);
    assert.equal(result.enabled, true, `address enabled (${result.reason})`);
    return result.address;
  }

  it('SENDS through the Admin Panel SMTP server: From the board address, threading headers, the text', async function () {
    useSmtp(smtp.port);
    const address = await memberAddress();
    const before = smtp.messages.length;
    const { cardId } = await call(member, 'sendBoardEmail', boardId,
      { to: ['client@example.test'], cc: ['boss@example.test'], subject: 'Invoice 42', text: 'Please find the invoice.' });
    assert.equal(smtp.messages.length, before + 1, 'the SMTP server received exactly one message');
    const delivered = smtp.messages[smtp.messages.length - 1];
    assert.deepEqual(delivered.to.sort(), ['boss@example.test', 'client@example.test']);
    const parsed = await simpleParser(delivered.raw);
    assert.equal(parsed.from.value[0].address, address, 'From is the member\'s board address');
    assert.equal(parsed.from.value[0].name, 'Mail Member');
    assert.equal(parsed.subject, 'Invoice 42');
    assert.equal(parsed.text.trim(), 'Please find the invoice.');
    const card = await Cards.findOneAsync(cardId);
    assert.equal(parsed.messageId, card.email.messageId, 'the Message-ID on the wire is the one the card threads by');

    // A reply from the card carries In-Reply-To and References.
    await call(member, 'sendBoardEmail', boardId, { to: ['client@example.test'], subject: 'Re: Invoice 42', text: 'Reminder', cardId });
    const reply = await simpleParser(smtp.messages[smtp.messages.length - 1].raw);
    assert.equal(reply.inReplyTo, card.email.messageId);
    assert.ok(String(reply.references).includes(card.email.messageId));
  });

  it('a send the mail server REFUSES is reported to the member and in Problems -> Email (negative)', async function () {
    useSmtp(smtp.port);
    smtp.rejectWith('550 5.7.1 Sender address rejected: not owned by user');
    const before = (await problem('mail', 'MailSendFailed'))?.count || 0;
    const cards = await Cards.find({ boardId }).countAsync();
    try {
      await assert.rejects(() => call(member, 'sendBoardEmail', boardId, { to: ['client@example.test'], subject: 'Refused', text: 'x' }),
        /email-view-send-failed/);
    } finally {
      smtp.rejectWith(null);
    }
    const row = await countAfter('mail', 'MailSendFailed', before);
    assert.ok(row.count > before, 'Problems -> Email counts the failed send');
    assert.match(row.detail, /550/);
    assert.deepEqual([row.category, row.severity], ['mail-send', 'high']);
    assert.equal(await Cards.find({ boardId }).countAsync(), cards, 'no "sent" card for an email that was not sent');

    // A mail server that is not there at all.
    const closed = await startFakeSmtpServer();
    const port = closed.port;
    await closed.close();
    useSmtp(port);
    const before2 = (await problem('mail', 'MailSendFailed')).count;
    await assert.rejects(() => call(member, 'sendBoardEmail', boardId, { to: ['client@example.test'], subject: 'Nobody home', text: 'x' }),
      /email-view-send-failed/);
    const row2 = await countAfter('mail', 'MailSendFailed', before2);
    assert.match(row2.detail, /ECONNREFUSED|connect/i);
  });

  it('RECEIVES from an IMAP mailbox: a card, the message marked read, other mail left alone, nothing twice', async function () {
    const address = await memberAddress();
    await Settings.rawCollection().updateOne({ _id: settingId }, { $set: { inboundMail: {
      enabled: true, domain,
      accounts: [{ id: imapT, label: 'Test box', host: '127.0.0.1', port: imap.port, secure: false,
        username: 'cards@example.test', mailbox: 'INBOX', after: 'seen', enabled: true }],
      passwords: { [imapT]: 'right-password' }, passwordSet: { [imapT]: true },
    } } });
    imap.deliver([`From: Iris <iris@example.test>`, `To: ${address}`, 'Subject: Server room is hot',
      `Message-ID: <imap-${Random.id()}@example.test>`, 'Content-Type: text/plain; charset=utf-8', '', 'Fans are loud.', ''].join('\n'));
    imap.deliver(['From: Other <o@example.test>', 'To: someone-else@example.test', 'Subject: Not for WeKan',
      `Message-ID: <other-${Random.id()}@example.test>`, '', 'Leave me', ''].join('\n'));

    await pollAll();
    const card = await Cards.findOneAsync({ boardId, title: 'Server room is hot' });
    assert.ok(card, 'the IMAP message became a card');
    assert.equal(card.userId, member);
    assert.match(card.description, /Fans are loud\./);
    assert.ok(imap.messages[0].flags.has('\\Seen'), 'the message for WeKan is marked read');
    assert.equal(imap.messages[1].flags.has('\\Seen'), false, 'a message for someone else is left unread');
    assert.ok(!imap.log.some(line => /right-password/.test(line)), 'the log of what the server was sent holds no password');

    await pollAll();
    assert.equal(await Cards.find({ boardId, title: 'Server room is hot' }).countAsync(), 1, 'a second poll makes nothing twice');

    // "Delete it" removes the message after it became a card.
    await Settings.rawCollection().updateOne({ _id: settingId }, { $set: { 'inboundMail.accounts.0.after': 'delete' } });
    imap.deliver([`From: Iris <iris@example.test>`, `To: ${address}`, 'Subject: Delete after reading',
      `Message-ID: <imap-${Random.id()}@example.test>`, '', 'Gone after', ''].join('\n'));
    await pollAll();
    assert.ok(await Cards.findOneAsync({ boardId, title: 'Delete after reading' }));
    assert.equal(imap.messages.some(msg => /Delete after reading/.test(msg.source.toString())), false, 'deleted from the mailbox');
  });

  it('an IMAP login that FAILS is in Problems -> Email and on the mailbox, without the password (negative)', async function () {
    await Settings.rawCollection().updateOne({ _id: settingId }, { $set: { inboundMail: {
      enabled: true, domain,
      accounts: [{ id: imapBad, label: 'Wrong password box', host: '127.0.0.1', port: imap.port, secure: false,
        username: 'cards@example.test', mailbox: 'INBOX', after: 'seen', enabled: true }],
      passwords: { [imapBad]: 'WRONG-pw-123' }, passwordSet: { [imapBad]: true },
    } } });
    const before = (await problem('mail', 'MailImapFailed'))?.count || 0;
    await pollAll();
    const row = await countAfter('mail', 'MailImapFailed', before);
    assert.ok(row.count > before, 'Problems -> Email counts the failed mailbox');
    assert.match(row.detail, /Wrong password box/);
    assert.match(row.detail, /cards@example\.test@127\.0\.0\.1/);
    assert.doesNotMatch(JSON.stringify(row), /WRONG-pw-123/, 'the password is never in Problems');
    const { imapAccountStatus } = require('/server/lib/imapInbound');
    const status = await imapAccountStatus();
    assert.ok(status[imapBad] && status[imapBad].lastError, 'the Admin Panel shows the error beside the mailbox');
    assert.doesNotMatch(status[imapBad].lastError, /WRONG-pw-123/);

    // A server that is not there.
    await Settings.rawCollection().updateOne({ _id: settingId }, { $set: {
      'inboundMail.accounts.0.port': 1, [`inboundMail.passwords.${imapBad}`]: 'x', 'inboundMail.accounts.0.label': 'No server box' } });
    const before2 = (await problem('mail', 'MailImapFailed')).count;
    await pollAll();
    const row2 = await countAfter('mail', 'MailImapFailed', before2);
    assert.match(row2.detail, /No server box/);
    await Settings.rawCollection().updateOne({ _id: settingId }, { $set: { inboundMail: { enabled: true, domain } } });
  });

  it('RECEIVES on Sandstorm from the grain Maildir: the subject token routes it, the file moves to cur', async function () {
    const address = await memberAddress();
    const token = address.slice('board+'.length, address.indexOf('@'));
    const maildir = fs.mkdtempSync(path.join(process.env.TMPDIR || os.tmpdir(), 'wekan-maildir-'));
    try {
      for (const dir of ['new', 'cur', 'tmp']) fs.mkdirSync(path.join(maildir, dir));
      fs.writeFileSync(path.join(maildir, 'new', '_m1'), ['From: Gus <gus@example.test>', 'To: abcdef0123456789abcd@sandstorm.example.test',
        `Subject: [board+${token}] Grain mail works`, `Message-ID: <grain-${Random.id()}@example.test>`, '', 'From the grain', ''].join('\n'));
      await pollMaildir(maildir);
      const card = await Cards.findOneAsync({ boardId, title: 'Grain mail works' });
      assert.ok(card, 'the token in the subject reached this member\'s board; the token is gone from the title');
      assert.equal(card.userId, member);
      assert.deepEqual(fs.readdirSync(path.join(maildir, 'new')), [], 'read once');
      assert.equal(fs.readdirSync(path.join(maildir, 'cur')).length, 1);
    } finally {
      fs.rmSync(maildir, { recursive: true, force: true });
    }
  });

  it('webhook errors: an unreadable email is in Problems -> Email, an unknown address in Problems -> Security (negative)', async function () {
    const before = (await problem('mail', 'MailUnreadable'))?.count || 0;
    const broken = await fetch(Meteor.absoluteUrl('api/inbound-email'), {
      method: 'POST', headers: { 'content-type': 'multipart/form-data' }, body: 'no boundary at all' });
    assert.equal(broken.status, 400);
    assert.ok((await countAfter('mail', 'MailUnreadable', before)).count > before);

    const securityBefore = (await problem('security', 'ReplyBleed'))?.count || 0;
    const unknown = await fetch(Meteor.absoluteUrl('api/inbound-email'), {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ to: `board+${'Z'.repeat(22)}@${domain}`, subject: 'guessing' }) });
    assert.equal(unknown.status, 404);
    assert.ok((await countAfter('security', 'ReplyBleed', securityBefore)).count > securityBefore,
      'a guessed address is an attempt, logged as security');
  });

  it('an email a real person sent that cannot become a card is in Problems -> Email (negative)', async function () {
    const address = await memberAddress();
    await Boards.rawCollection().updateOne({ _id: boardId }, { $set: { 'emailToCard.enabled': false } });
    const before = (await problem('mail', 'MailRefused'))?.count || 0;
    try {
      const res = await fetch(Meteor.absoluteUrl('api/inbound-email'), {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ to: address, from: 'x@example.test', subject: 'Board is off' }) });
      assert.equal(res.status, 403);
    } finally {
      await Boards.rawCollection().updateOne({ _id: boardId }, { $set: { 'emailToCard.enabled': true } });
    }
    const row = await countAfter('mail', 'MailRefused', before);
    assert.ok(row.count > before);
    assert.match(row.detail, /email to card is off \(board-off\)/);
    assert.equal(await Cards.findOneAsync({ boardId, title: 'Board is off' }), undefined);
  });
});
