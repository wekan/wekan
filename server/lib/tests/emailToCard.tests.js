import assert from 'node:assert/strict';
import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';
import { Email } from 'meteor/email';
import Boards from '/models/boards';
import Cards from '/models/cards';
import Lists from '/models/lists';
import Swimlanes from '/models/swimlanes';
import CardComments from '/models/cardComments';
import Settings from '/models/settings';
import Attachments from '/models/attachments';
import { BoardEmailAddresses, receiveBoardEmail } from '/server/emailToCard';

// Email to card (#794, #3948) and the Email board view, on a running server
// with its database: an email to a member's board address becomes that
// member's card, through the function every inbound path ends in and over the
// real HTTP webhook (JSON and multipart); a reply threads onto the card; a
// card is not made twice; addresses that are unknown, turned off or without
// write access are refused; and Compose sends From the member's own board
// address.
const escapeRegExp = text => String(text).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

describe('Email to card (runtime)', function () {
  this.timeout(60000);
  const call = (userId, name, ...args) => Meteor.server.method_handlers[name].apply({ userId }, args);
  const domain = `boards-${Random.id(6).toLowerCase()}.example.test`;
  const admin = Random.id(), member = Random.id(), reader = Random.id();
  const boardId = Random.id(), listId = Random.id(), laneId = Random.id();
  let settingId;
  let previousInbound;
  let createdSetting = false;
  let savedTransport;
  const sent = [];

  before(async function () {
    if (!Meteor.isAppTest) this.skip();
    await Meteor.users.rawCollection().insertMany([
      { _id: admin, username: `etc-admin-${admin}`, isAdmin: true, profile: {}, emails: [{ address: `a-${admin}@example.test`, verified: true }] },
      { _id: member, username: `etc-member-${member}`, profile: { fullname: 'Mia Member' }, emails: [{ address: `m-${member}@example.test`, verified: true }] },
      { _id: reader, username: `etc-reader-${reader}`, profile: {}, emails: [{ address: `r-${reader}@example.test`, verified: true }] },
    ]);
    await Boards.rawCollection().insertOne({ _id: boardId, title: 'Mailbox', permission: 'private', archived: false,
      cardNumber: 0, labels: [{ _id: 'lbl1', name: 'Urgent', color: 'red' }],
      members: [{ userId: member, isAdmin: true, isActive: true }, { userId: reader, isAdmin: false, isActive: true, isReadOnly: true }],
      emailToCard: { enabled: true, listId } });
    await Swimlanes.rawCollection().insertOne({ _id: laneId, boardId, title: 'Lane', sort: 0, archived: false });
    await Lists.rawCollection().insertOne({ _id: listId, boardId, title: 'Inbox', sort: 0, archived: false });
    const setting = await Settings.findOneAsync({});
    if (setting) {
      settingId = setting._id;
      previousInbound = setting.inboundMail;
    } else {
      settingId = Random.id();
      createdSetting = true;
      await Settings.rawCollection().insertOne({ _id: settingId });
    }
    await Settings.rawCollection().updateOne({ _id: settingId }, { $set: { inboundMail: { enabled: true, domain } } });
    savedTransport = Email.customTransport;
    Email.customTransport = options => { sent.push(options); };
  });

  after(async function () {
    if (!Meteor.isAppTest) return;
    Email.customTransport = savedTransport;
    if (createdSetting) await Settings.rawCollection().deleteOne({ _id: settingId });
    else if (previousInbound === undefined) await Settings.rawCollection().updateOne({ _id: settingId }, { $unset: { inboundMail: '' } });
    else await Settings.rawCollection().updateOne({ _id: settingId }, { $set: { inboundMail: previousInbound } });
    const cardIds = (await Cards.find({ boardId }).fetchAsync()).map(c => c._id);
    await CardComments.rawCollection().deleteMany({ boardId });
    await Attachments.collection.rawCollection().deleteMany({ 'meta.boardId': boardId });
    await Cards.rawCollection().deleteMany({ _id: { $in: cardIds } });
    await Lists.rawCollection().deleteMany({ boardId });
    await Swimlanes.rawCollection().deleteMany({ boardId });
    await Boards.rawCollection().deleteOne({ _id: boardId });
    await BoardEmailAddresses.rawCollection().deleteMany({ boardId });
    await Meteor.users.rawCollection().deleteMany({ _id: { $in: [admin, member, reader] } });
  });

  async function memberAddress() {
    const result = await call(member, 'emailToCardAddress', boardId);
    assert.equal(result.enabled, true, `address enabled (${result.reason})`);
    return result.address;
  }

  it('gives the member an address on this board, and a new one on request', async function () {
    const first = await memberAddress();
    assert.match(first, new RegExp(`^board\\+[A-Za-z0-9]{22}@${escapeRegExp(domain)}$`));
    assert.equal(await memberAddress(), first, 'the same address is shown again');
    const renewed = await call(member, 'emailToCardNewAddress', boardId);
    assert.notEqual(renewed.address, first, 'New address replaces it');
    // A read-only member has no address: they could not add the card.
    await assert.rejects(() => call(reader, 'emailToCardAddress', boardId), /not-authorized/);
  });

  it('turns an email into the member\'s card, with attachments, once', async function () {
    const to = await memberAddress();
    const messageId = `<m-${Random.id()}@sender.example.test>`;
    const message = {
      from: { name: 'Sam Sender', address: 'sam@sender.example.test' }, to: [to], cc: [], deliveredTo: [],
      subject: 'Printer is broken', text: 'It jams.\n\nOn Monday Sam wrote:\n> older', html: '',
      messageId, inReplyTo: [], references: [],
      attachments: [
        { filename: 'jam.txt', contentType: 'text/plain', content: Buffer.from('paper') },
        { filename: 'evil.svg', contentType: 'image/svg+xml', content: Buffer.from('<svg/>') },
      ],
    };
    const result = await receiveBoardEmail(message, { source: 'test' });
    assert.equal(result.code, 200, result.error);
    const card = await Cards.findOneAsync(result.cardId);
    assert.deepEqual([card.title, card.userId, card.listId, card.swimlaneId, card.boardId],
      ['Printer is broken', member, listId, laneId, boardId], 'the address member\'s card, in the chosen list');
    assert.equal(card.description, 'From: Sam Sender <sam@sender.example.test>\n\nIt jams.');
    assert.deepEqual([card.email.direction, card.email.messageId, card.email.from.address], ['in', messageId, 'sam@sender.example.test']);
    const files = await Attachments.collection.find({ 'meta.cardId': card._id }).fetchAsync();
    assert.deepEqual(files.map(f => f.name), ['jam.txt'], 'the SVG is refused, as for uploads');

    const again = await receiveBoardEmail(message, { source: 'test' });
    assert.equal(again.duplicate, true, 'the same Message-ID is not a second card');
    assert.equal(await Cards.find({ boardId, title: 'Printer is broken' }).countAsync(), 1);

    // A reply in that conversation is a comment on the card, not a new card.
    const reply = await receiveBoardEmail({ ...message, subject: 'Re: Printer is broken', text: 'Fixed it.',
      messageId: `<r-${Random.id()}@sender.example.test>`, inReplyTo: [messageId], references: [messageId], attachments: [] });
    assert.equal(reply.cardId, card._id);
    const comments = await CardComments.find({ cardId: card._id }).fetchAsync();
    assert.equal(comments.length, 1);
    assert.equal(comments[0].userId, member);
    assert.match(comments[0].text, /Fixed it\./);
  });

  it('refuses unknown addresses, a board that is off, and a member without write access (negative)', async function () {
    const unknown = await receiveBoardEmail({ to: [`board+${'A'.repeat(22)}@${domain}`], subject: 'x' });
    assert.deepEqual([unknown.handled, unknown.code], [true, 404]);
    const notOurs = await receiveBoardEmail({ to: ['someone@example.test'], subject: 'x' });
    assert.equal(notOurs.handled, false, 'an ordinary address is left for the other uses');

    const to = await memberAddress();
    const member$ = { _id: boardId, 'members.userId': member };
    try {
      await Boards.rawCollection().updateOne({ _id: boardId }, { $set: { 'emailToCard.enabled': false } });
      const off = await receiveBoardEmail({ to: [to], subject: 'board off' });
      assert.equal(off.code, 403);
    } finally {
      await Boards.rawCollection().updateOne({ _id: boardId }, { $set: { 'emailToCard.enabled': true } });
    }

    // Read-only: a board admin is never read-only (isAdmin wins, as everywhere
    // on a board), so the member is made a plain read-only member here.
    try {
      await Boards.rawCollection().updateOne(member$, { $set: { 'members.$.isAdmin': false, 'members.$.isReadOnly': true } });
      const readOnly = await receiveBoardEmail({ to: [to], subject: 'lost access' });
      assert.equal(readOnly.code, 403, 'write access is checked when the email ARRIVES');
    } finally {
      await Boards.rawCollection().updateOne(member$, { $set: { 'members.$.isAdmin': true, 'members.$.isReadOnly': false } });
    }

    try {
      await Settings.rawCollection().updateOne({ _id: settingId }, { $set: { 'inboundMail.enabled': false } });
      assert.equal((await receiveBoardEmail({ to: [to], subject: 'admin off' })).code, 404, 'the Admin Panel switch is a hard gate');
    } finally {
      await Settings.rawCollection().updateOne({ _id: settingId }, { $set: { 'inboundMail.enabled': true } });
    }
    assert.equal(await Cards.find({ boardId, title: { $in: ['board off', 'lost access', 'admin off'] } }).countAsync(), 0);
  });

  it('takes provider webhooks over HTTP: JSON and multipart with an attachment', async function () {
    const to = await memberAddress();
    const json = await fetch(Meteor.absoluteUrl('api/inbound-email'), {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ From: 'Pat <pat@example.test>', OriginalRecipient: to, Subject: 'Via Postmark', TextBody: 'Hello' }),
    });
    assert.equal(json.status, 200, await json.clone().text());
    const jsonCard = await Cards.findOneAsync({ boardId, title: 'Via Postmark' });
    assert.equal(jsonCard.userId, member);

    const form = new FormData();
    form.append('sender', 'kim@example.test');
    form.append('recipient', to);
    form.append('subject', 'Via Mailgun');
    form.append('body-plain', 'With a file');
    form.append('attachment-1', new Blob(['report body'], { type: 'text/plain' }), 'report.txt');
    const multipart = await fetch(Meteor.absoluteUrl('api/inbound-email'), { method: 'POST', body: form });
    if (multipart.status !== 200) {
      // Say WHY: the same detail Admin Panel -> Problems -> Email shows.
      const EventLog = require('/models/eventLog').default;
      const row = await EventLog.rawCollection().findOne({ stream: 'mail', bleed: 'MailUnreadable' });
      assert.fail(`multipart webhook answered ${multipart.status} ${await multipart.text()}: ${row && row.detail}`);
    }
    const formCard = await Cards.findOneAsync({ boardId, title: 'Via Mailgun' });
    const files = await Attachments.collection.find({ 'meta.cardId': formCard._id }).fetchAsync();
    assert.deepEqual(files.map(f => f.name), ['report.txt']);

    // A raw message, as SendGrid's raw mode or a relay posts it.
    const raw = [`From: Lee <lee@example.test>`, `To: ${to}`, 'Subject: Via raw MIME', 'Message-ID: <raw-1@example.test>',
      'Content-Type: text/plain; charset=utf-8', '', 'Raw body', ''].join('\r\n');
    const rawPost = await fetch(Meteor.absoluteUrl('api/inbound-email'), {
      method: 'POST', headers: { 'content-type': 'message/rfc822' }, body: raw });
    assert.equal(rawPost.status, 200, await rawPost.clone().text());
    assert.ok(await Cards.findOneAsync({ boardId, title: 'Via raw MIME' }));

    // The Admin Panel webhook secret, when set, is required (negative).
    await Settings.rawCollection().updateOne({ _id: settingId },
      { $set: { 'inboundMail.webhookSecret': 's3cret', 'inboundMail.webhookSecretSet': true } });
    const noSecret = await fetch(Meteor.absoluteUrl('api/inbound-email'), {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ to, subject: 'No secret' }) });
    assert.equal(noSecret.status, 401);
    await Settings.rawCollection().updateOne({ _id: settingId },
      { $unset: { 'inboundMail.webhookSecret': '', 'inboundMail.webhookSecretSet': '' } });
  });

  it('Admin Panel: only an admin saves, passwords are kept but never shown', async function () {
    await assert.rejects(() => call(member, 'saveInboundMailSettings', { enabled: true, domain }), /not-authorized/);
    const view = await call(admin, 'saveInboundMailSettings', {
      enabled: true, domain, accounts: [{ id: 'imap1', host: 'imap.example.test', port: 993, username: 'u', enabled: false }],
      passwords: { imap1: 'P4ssw0rd' }, webhookSecret: 'hook',
    });
    assert.doesNotMatch(JSON.stringify(view), /P4ssw0rd|"hook"/);
    assert.deepEqual([view.accounts[0].passwordSet, view.webhookSecretSet], [true, true]);
    const stored = (await Settings.findOneAsync(settingId)).inboundMail;
    assert.equal(stored.passwords.imap1, 'P4ssw0rd');
    // Saving again without typing the password keeps it.
    await call(admin, 'saveInboundMailSettings', { enabled: true, domain, accounts: [{ id: 'imap1', host: 'imap.example.test', enabled: false }] });
    assert.equal((await Settings.findOneAsync(settingId)).inboundMail.passwords.imap1, 'P4ssw0rd');
    const read = await call(admin, 'getInboundMailSettings');
    assert.doesNotMatch(JSON.stringify(read), /P4ssw0rd/);
    await assert.rejects(() => call(member, 'getInboundMailSettings'), /not-authorized/);
    await Settings.rawCollection().updateOne({ _id: settingId }, { $set: { inboundMail: { enabled: true, domain } } });
  });

  it('Email view: Compose sends From the member\'s board address, and the answer threads back', async function () {
    const address = await memberAddress();
    sent.length = 0;
    const { cardId } = await call(member, 'sendBoardEmail', boardId,
      { to: ['client@example.test'], cc: [], subject: 'Quote', text: 'Here is the quote.' });
    assert.equal(sent.length, 1);
    assert.ok(String(sent[0].from).includes(address), String(sent[0].from));
    assert.equal(sent[0].subject, 'Quote');
    const card = await Cards.findOneAsync(cardId);
    assert.deepEqual([card.email.direction, card.listId, card.userId], ['out', listId, member]);
    const count = await call(member, 'emailViewCount', boardId, { folder: 'sent' });
    assert.ok(count.total >= 1);
    assert.equal(count.inboxListId, listId);

    // The client answers; In-Reply-To names our message, so it is a comment.
    const answer = await receiveBoardEmail({ from: { address: 'client@example.test' }, to: [address],
      subject: 'Re: Quote', text: 'Accepted.', messageId: `<a-${Random.id()}@example.test>`,
      inReplyTo: [card.email.messageId], references: [card.email.messageId] });
    assert.equal(answer.cardId, cardId);

    // Reply from the card: In-Reply-To is the last message of the thread.
    sent.length = 0;
    await call(member, 'sendBoardEmail', boardId, { to: ['client@example.test'], subject: 'Re: Quote', text: 'Thanks', cardId });
    assert.ok(sent[0].inReplyTo, 'a reply carries In-Reply-To');
    assert.equal(await Cards.find({ boardId, title: { $in: ['Quote', 'Re: Quote'] } }).countAsync(), 1, 'no new card for a reply');

    // A read-only member cannot send, and a header cannot be injected (negative).
    await assert.rejects(() => call(reader, 'sendBoardEmail', boardId, { to: ['x@example.test'], subject: 's', text: 't' }), /not-authorized/);
    await assert.rejects(() => call(member, 'sendBoardEmail', boardId,
      { to: ['x@example.test\r\nBcc: y@example.test'], subject: 's', text: 't' }), /email-view-invalid-address/);
  });

  it('Chat view: the member\'s layout is saved cleaned', async function () {
    const saved = await call(member, 'setChatViewLayout', { treeWidth: 50, chatWidth: 420, cardCollapsed: true, evil: 1 });
    assert.deepEqual(saved, { treeWidth: 160, chatWidth: 420, treeCollapsed: false, cardCollapsed: true, chatCollapsed: false });
    const user = await Meteor.users.findOneAsync(member);
    assert.deepEqual(user.profile.chatViewLayout, saved);
    await assert.rejects(() => call(null, 'setChatViewLayout', {}), /not-logged-in/);
  });
});
