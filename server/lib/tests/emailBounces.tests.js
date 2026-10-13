import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';
import { Email } from 'meteor/email';
import Boards from '/models/boards';
import Cards from '/models/cards';
import Lists from '/models/lists';
import Swimlanes from '/models/swimlanes';
import Settings from '/models/settings';
import EventLog from '/models/eventLog';
import InvitationCodes from '/models/invitationCodes';
import { EmailBounces, snsStringToSign, setSnsCertFetcherForTests } from '/server/emailBounces';
import { BoardEmailAddresses } from '/server/emailToCard';
import { pollAll } from '/server/lib/imapInbound';
import { startFakeImapServer } from './fakeImapServer';

// Email bounces (#794), on a running server: Amazon SES notifications over
// HTTP with real SNS signatures (a test key stands in for Amazon's
// certificate), bounces and out-of-office replies arriving by IMAP, the
// actions - stop emailing the address, tell the inviter, delete the
// invitation - and the Admin Panel's rules and list.
describe('Email bounces (runtime)', function () {
  this.timeout(60000);
  const call = (userId, name, ...args) => Meteor.server.method_handlers[name].apply({ userId }, args);
  const TOPIC = 'arn:aws:sns:eu-west-1:123456789012:wekan-bounces';
  const domain = `bounce-${Random.id(6).toLowerCase()}.example.test`;
  const admin = Random.id(), inviter = Random.id();
  const boardId = Random.id(), listId = Random.id(), laneId = Random.id();
  const inviterMail = `inviter-${inviter}@example.test`;
  let settingId, previous = {}, createdSetting = false, savedTransport, keys;
  const sent = [];

  const sign = msg => {
    const body = { SignatureVersion: '2', SigningCertURL: 'https://sns.eu-west-1.amazonaws.com/SimpleNotificationService-test.pem', ...msg };
    body.Signature = crypto.sign('RSA-SHA256', Buffer.from(snsStringToSign(body)), keys.privateKey).toString('base64');
    return body;
  };
  const sns = body => fetch(Meteor.absoluteUrl('api/inbound-email/ses'), {
    method: 'POST', headers: { 'content-type': 'text/plain; charset=UTF-8', 'x-amz-sns-message-type': body.Type },
    body: JSON.stringify(body) });
  const notification = message => sign({ Type: 'Notification', MessageId: Random.id(), TopicArn: TOPIC,
    Message: JSON.stringify(message), Timestamp: new Date().toISOString() });

  before(async function () {
    if (!Meteor.isAppTest) this.skip();
    keys = crypto.generateKeyPairSync('rsa', { modulusLength: 2048,
      publicKeyEncoding: { type: 'spki', format: 'pem' }, privateKeyEncoding: { type: 'pkcs8', format: 'pem' } });
    setSnsCertFetcherForTests(async url => (/^https:\/\/sns\.[a-z0-9-]+\.amazonaws\.com\//.test(url) ? keys.publicKey : null));
    await Meteor.users.rawCollection().insertMany([
      { _id: admin, username: `bounce-admin-${admin}`, isAdmin: true, profile: {}, emails: [{ address: `a-${admin}@example.test`, verified: true }] },
      { _id: inviter, username: `inviter-${inviter}`, profile: {}, emails: [{ address: inviterMail, verified: true }] },
    ]);
    await Boards.rawCollection().insertOne({ _id: boardId, title: 'Bounce board', permission: 'private', archived: false,
      cardNumber: 0, members: [{ userId: inviter, isAdmin: true, isActive: true }], emailToCard: { enabled: true, listId } });
    await Swimlanes.rawCollection().insertOne({ _id: laneId, boardId, title: 'Lane', sort: 0, archived: false });
    await Lists.rawCollection().insertOne({ _id: listId, boardId, title: 'Inbox', sort: 0, archived: false });
    const setting = await Settings.findOneAsync({});
    if (setting) { settingId = setting._id; previous = { inboundMail: setting.inboundMail, emailBounces: setting.emailBounces }; }
    else { settingId = Random.id(); createdSetting = true; await Settings.rawCollection().insertOne({ _id: settingId }); }
    await Settings.rawCollection().updateOne({ _id: settingId }, { $set: {
      inboundMail: { enabled: true, domain }, emailBounces: { enabled: true, sesTopicArns: [TOPIC] } } });
    savedTransport = Email.customTransport;
    Email.customTransport = options => { sent.push(options); };
  });

  after(async function () {
    if (!Meteor.isAppTest) return;
    setSnsCertFetcherForTests(null);
    Email.customTransport = savedTransport;
    if (createdSetting) await Settings.rawCollection().deleteOne({ _id: settingId });
    else {
      for (const key of ['inboundMail', 'emailBounces']) {
        await Settings.rawCollection().updateOne({ _id: settingId },
          previous[key] === undefined ? { $unset: { [key]: '' } } : { $set: { [key]: previous[key] } });
      }
    }
    await EmailBounces.rawCollection().deleteMany({ email: /example\.(test|org|net)$/ });
    await InvitationCodes.rawCollection().deleteMany({ authorId: inviter });
    await Cards.rawCollection().deleteMany({ boardId });
    await Lists.rawCollection().deleteMany({ boardId });
    await Swimlanes.rawCollection().deleteMany({ boardId });
    await Boards.rawCollection().deleteOne({ _id: boardId });
    await BoardEmailAddresses.rawCollection().deleteMany({ boardId });
    await Meteor.users.rawCollection().deleteMany({ _id: { $in: [admin, inviter] } });
  });

  it('a Permanent SES bounce for a mistyped invited address: stopped, the inviter told, nothing emailed there again', async function () {
    const typo = `jhon-${Random.id(4).toLowerCase()}@exmaple.org`;
    await InvitationCodes.rawCollection().insertOne({ _id: Random.id(), code: Random.id(6), email: typo, authorId: inviter,
      boardsToBeInvited: [boardId], valid: true, createdAt: new Date(), modifiedAt: new Date() });
    sent.length = 0;
    const res = await sns(notification({ notificationType: 'Bounce',
      bounce: { bounceType: 'Permanent', bounceSubType: 'General',
        bouncedRecipients: [{ emailAddress: typo, status: '5.1.1', diagnosticCode: 'smtp; 550 5.1.1 user unknown' }] },
      mail: { commonHeaders: { subject: 'You are invited' } } }));
    assert.equal(res.status, 200, await res.clone().text());
    const row = await EmailBounces.findOneAsync({ email: typo });
    assert.deepEqual([row.counts.hard, row.stopped, row.lastStatus, row.lastSource], [1, true, '5.1.1', 'ses']);
    const toInviter = sent.find(mail => String(mail.to).includes(inviterMail));
    assert.ok(toInviter, 'the inviter is told');
    assert.match(toInviter.subject, new RegExp(typo.replace(/[.]/g, '\\.')));
    assert.match(toInviter.text, /user unknown/);

    // Every WeKan email to the address is stopped now; one with another
    // recipient still goes, without it.
    sent.length = 0;
    await Email.sendAsync({ to: typo, from: 'wekan@example.test', subject: 'Should not go', text: 'x' });
    assert.equal(sent.length, 0, 'an email with only a stopped address is not sent');
    await Email.sendAsync({ to: [typo, 'someone@example.test'], from: 'wekan@example.test', subject: 'Goes', text: 'x' });
    assert.deepEqual(sent[0].to, ['someone@example.test']);

    // The admin clears it: emailing starts again.
    await call(admin, 'clearEmailBounce', typo);
    sent.length = 0;
    await Email.sendAsync({ to: typo, from: 'wekan@example.test', subject: 'Goes again', text: 'x' });
    assert.equal(sent.length, 1);
  });

  it('soft bounces stop the address only at the threshold; a complaint at once', async function () {
    const full = `full-${Random.id(4).toLowerCase()}@example.org`;
    const bounce = () => sns(notification({ notificationType: 'Bounce',
      bounce: { bounceType: 'Transient', bounceSubType: 'MailboxFull', bouncedRecipients: [{ emailAddress: full, status: '4.2.2' }] } }));
    for (let i = 1; i <= 4; i += 1) {
      assert.equal((await bounce()).status, 200);
      assert.equal((await EmailBounces.findOneAsync({ email: full })).stopped, false, `not after ${i}`);
    }
    await bounce();
    const row = await EmailBounces.findOneAsync({ email: full });
    assert.deepEqual([row.counts.soft, row.stopped, row.stoppedBy], [5, true, 'soft']);

    const angry = `angry-${Random.id(4).toLowerCase()}@example.org`;
    await sns(notification({ notificationType: 'Complaint', complaint: { complainedRecipients: [{ emailAddress: angry }], complaintFeedbackType: 'abuse' } }));
    assert.equal((await EmailBounces.findOneAsync({ email: angry })).stopped, true);
  });

  it('refuses a wrong signature, an unlisted topic and a non-Amazon subscribe URL, in Problems -> Security (negative)', async function () {
    const before = (await EventLog.rawCollection().find({ stream: 'security', bleed: 'ReplyBleed' }).toArray())
      .reduce((n, r) => n + (r.count || 0), 0);
    const forged = notification({ notificationType: 'Bounce', bounce: { bounceType: 'Permanent', bouncedRecipients: [{ emailAddress: 'victim@example.org' }] } });
    forged.Message = forged.Message.replace('victim', 'other');
    assert.equal((await sns(forged)).status, 403, 'a changed message no longer matches its signature');
    const otherTopic = sign({ Type: 'Notification', MessageId: Random.id(), TopicArn: 'arn:aws:sns:eu-west-1:999999999999:theirs',
      Message: JSON.stringify({ notificationType: 'Complaint', complaint: { complainedRecipients: [{ emailAddress: 'victim@example.org' }] } }),
      Timestamp: new Date().toISOString() });
    assert.equal((await sns(otherTopic)).status, 403, 'a validly signed message from somebody else\'s topic');
    const badCert = { ...notification({ notificationType: 'Delivery' }), SigningCertURL: 'https://evil.example.org/cert.pem' };
    assert.equal((await sns(badCert)).status, 403, 'a certificate from outside amazonaws.com is not fetched');
    const subscribe = sign({ Type: 'SubscriptionConfirmation', MessageId: Random.id(), TopicArn: TOPIC, Token: 't',
      SubscribeURL: 'https://evil.example.org/confirm', Message: 'confirm', Timestamp: new Date().toISOString() });
    assert.equal((await sns(subscribe)).status, 400);
    assert.equal(await EmailBounces.findOneAsync({ email: { $in: ['victim@example.org', 'other@example.org'] } }), undefined);
    await new Promise(resolve => setTimeout(resolve, 300));
    const after = (await EventLog.rawCollection().find({ stream: 'security', bleed: 'ReplyBleed' }).toArray())
      .reduce((n, r) => n + (r.count || 0), 0);
    assert.ok(after >= before + 3, 'every refusal is an attempt in Problems -> Security');
  });

  it('SES RECEIVED mail: an email to a board address becomes a card; a bounce sent there does not', async function () {
    const { address } = await call(inviter, 'emailToCardAddress', boardId);
    const mail = [`From: Ann <ann@example.org>`, `To: ${address}`, 'Subject: Via SES receiving', `Message-ID: <ses-${Random.id()}@example.org>`,
      '', 'Hello through SES', ''].join('\r\n');
    const received = await sns(notification({ notificationType: 'Received', receipt: { recipients: [address], action: { type: 'SNS', encoding: 'BASE64' } },
      mail: { commonHeaders: { subject: 'Via SES receiving' } }, content: Buffer.from(mail).toString('base64') }));
    assert.equal(received.status, 200, await received.clone().text());
    assert.ok(await Cards.findOneAsync({ boardId, title: 'Via SES receiving' }));

    const gone = `gone-${Random.id(6).toLowerCase()}@example.org`;
    const dsn = ['From: MAILER-DAEMON@amazonses.com', `To: ${address}`, 'Subject: Delivery Status Notification (Failure)',
      'MIME-Version: 1.0', 'Content-Type: multipart/report; report-type=delivery-status; boundary="b"', '',
      '--b', 'Content-Type: text/plain', '', 'An error occurred while trying to deliver the mail.', '',
      '--b', 'Content-Type: message/delivery-status', '',
      'Reporting-MTA: dns; amazonses.com', '', `Final-Recipient: rfc822; ${gone}`, 'Action: failed', 'Status: 5.1.1', '',
      '--b--', ''].join('\r\n');
    const res = await sns(notification({ notificationType: 'Received', receipt: { recipients: [address], action: { type: 'SNS', encoding: 'BASE64' } },
      mail: {}, content: Buffer.from(dsn).toString('base64') }));
    assert.equal(res.status, 200);
    assert.equal(await Cards.findOneAsync({ boardId, title: /Delivery Status Notification/ }), undefined, 'a bounce is never a card');
    const row = await EmailBounces.findOneAsync({ email: gone });
    assert.deepEqual([row.counts.hard, row.lastSource], [1, 'ses']);
  });

  it('by IMAP: a bounce is recorded and marked read, an out-of-office reply makes no card', async function () {
    const imap = await startFakeImapServer({ user: 'b@example.test', password: 'pw' });
    const bimap = `bimap${Random.id(6)}`;
    try {
      const { address } = await call(inviter, 'emailToCardAddress', boardId);
      await Settings.rawCollection().updateOne({ _id: settingId }, { $set: { inboundMail: { enabled: true, domain,
        accounts: [{ id: bimap, host: '127.0.0.1', port: imap.port, secure: false, username: 'b@example.test', mailbox: 'INBOX', after: 'seen', enabled: true }],
        passwords: { [bimap]: 'pw' }, passwordSet: { [bimap]: true } } } });
      const nobody = `nobody-${Random.id(6).toLowerCase()}@example.net`;
      imap.deliver(['From: postmaster@example.net', `To: ${address}`, 'Subject: failure notice', `Message-ID: <b-${Random.id()}@x>`, '',
        `<${nobody}>:`, `550 5.1.1 <${nobody}>: No such user`, ''].join('\n'));
      imap.deliver(['From: Away <away@example.org>', `To: ${address}`, 'Subject: Automatic reply: Weekly update', 'Auto-Submitted: auto-replied',
        `Message-ID: <o-${Random.id()}@x>`, '', 'I am out until Monday.', ''].join('\n'));
      await pollAll();
      assert.equal((await EmailBounces.findOneAsync({ email: nobody })).counts.hard, 1);
      assert.equal(await Cards.findOneAsync({ boardId, title: /Automatic reply|failure notice/ }), undefined, 'neither became a card');
      assert.equal(await EmailBounces.findOneAsync({ email: 'away@example.org' }), undefined, 'auto-replies are ignored by default');
      assert.ok(imap.messages.every(m => m.flags.has('\\Seen')), 'both are dealt with and marked read');
    } finally {
      await Settings.rawCollection().updateOne({ _id: settingId }, { $set: { inboundMail: { enabled: true, domain } } });
      await imap.close();
    }
  });

  it('Admin Panel: only an admin reads and saves the rules, and the list pages and searches', async function () {
    await assert.rejects(() => call(inviter, 'getEmailBounceSettings'), /not-authorized/);
    await assert.rejects(() => call(inviter, 'emailBouncesPage', {}), /not-authorized/);
    const saved = await call(admin, 'saveEmailBounceSettings', { enabled: true, sesTopicArns: [TOPIC],
      rules: { 'auto-reply': { actions: ['record'], threshold: 1 }, hard: { actions: ['stop-email', 'delete-invitation'], threshold: 1 } } });
    assert.deepEqual(saved.rules['auto-reply'].actions, ['record']);
    await assert.rejects(() => call(admin, 'saveEmailBounceSettings', { enabled: true, rules: {}, sesTopicArns: ['not an arn'] }),
      /email-bounce-invalid-topic/);
    const page = await call(admin, 'emailBouncesPage', { search: 'example.org' });
    assert.ok(page.total >= 3);
    assert.ok(page.rows.length <= 10);
    const stoppedOnly = await call(admin, 'emailBouncesPage', { stoppedOnly: true });
    assert.ok(stoppedOnly.rows.every(r => r.stopped));
    const view = await call(admin, 'getEmailBounceSettings');
    assert.match(view.sesEndpoint, /api\/inbound-email\/ses$/);

    // With "delete invitation", a hard bounce removes the pending invitation.
    const typo = `del-${Random.id(4).toLowerCase()}@exmaple.org`;
    await InvitationCodes.rawCollection().insertOne({ _id: Random.id(), code: Random.id(6), email: typo, authorId: inviter,
      boardsToBeInvited: [boardId], valid: true, createdAt: new Date(), modifiedAt: new Date() });
    await sns(notification({ notificationType: 'Bounce', bounce: { bounceType: 'Permanent', bouncedRecipients: [{ emailAddress: typo, status: '5.1.1' }] } }));
    assert.equal(await InvitationCodes.findOneAsync({ email: typo }), undefined);
  });

  it('the other sending services: each webhook over HTTP, signed or with its password, and a forgery refused', async function () {
    const ts = String(Math.floor(Date.now() / 1000));
    const ec = crypto.generateKeyPairSync('ec', { namedCurve: 'prime256v1' });
    const svixKey = crypto.randomBytes(24);
    const secrets = {
      mailgun: 'mg-signing-key', sendgrid: ec.publicKey.export({ format: 'der', type: 'spki' }).toString('base64'),
      postmark: 'pm-pass', brevo: 'br-pass', mailjet: 'mj-pass', sparkpost: 'sp-pass', mandrill: 'md-key',
      resend: `whsec_${svixKey.toString('base64')}`,
    };
    const providers = Object.fromEntries(Object.keys(secrets).map(n => [n, { enabled: true }]));
    await call(admin, 'saveEmailBounceSettings', { enabled: true, rules: {}, sesTopicArns: [TOPIC], providers, providerSecrets: secrets });
    const view = await call(admin, 'getEmailBounceSettings');
    assert.doesNotMatch(JSON.stringify(view), /mg-signing-key|pm-pass|whsec_/, 'no key or password goes back to the browser');
    assert.equal(view.providers.mailgun.secretSet, true);

    const tag = Random.id(5).toLowerCase();
    const who = name => `${name}-${tag}@example.org`;
    const url = name => Meteor.absoluteUrl(`api/inbound-email/bounces/${name}`);
    const basic = pw => `Basic ${Buffer.from(`hook:${pw}`).toString('base64')}`;
    const post = (name, body, headers = {}, raw) => fetch(url(name), { method: 'POST',
      headers: { 'content-type': 'application/json', ...headers }, body: raw || JSON.stringify(body) });

    // Mailgun
    const mg = { signature: { timestamp: ts, token: 'tok', signature: crypto.createHmac('sha256', secrets.mailgun).update(`${ts}tok`).digest('hex') },
      'event-data': { event: 'failed', severity: 'permanent', recipient: who('mailgun'), 'delivery-status': { code: 550, description: 'No such user' } } };
    assert.equal((await post('mailgun', mg)).status, 200);
    // SendGrid, signed over the raw body
    const sgRaw = JSON.stringify([{ email: who('sendgrid'), event: 'bounce', type: 'bounce', status: '5.1.1', reason: 'unknown' }]);
    const sgSig = crypto.sign('sha256', Buffer.from(`${ts}${sgRaw}`), ec.privateKey).toString('base64');
    assert.equal((await post('sendgrid', null, { 'x-twilio-email-event-webhook-signature': sgSig, 'x-twilio-email-event-webhook-timestamp': ts }, sgRaw)).status, 200);
    // Postmark, Brevo, Mailjet, SparkPost: Basic auth, or ?secret=
    assert.equal((await post('postmark', { RecordType: 'Bounce', Type: 'HardBounce', Email: who('postmark') }, { authorization: basic('pm-pass') })).status, 200);
    assert.equal((await post('brevo', { event: 'hard_bounce', email: who('brevo') }, { authorization: basic('br-pass') })).status, 200);
    assert.equal((await post('mailjet', [{ event: 'bounce', email: who('mailjet'), hard_bounce: true }], { authorization: basic('mj-pass') })).status, 200);
    assert.equal((await fetch(`${url('sparkpost')}?secret=sp-pass`, { method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify([{ msys: { message_event: { type: 'bounce', rcpt_to: who('sparkpost'), bounce_class: '10' } } }]) })).status, 200);
    // Mandrill: a form, signed over the URL and the fields
    const mdEvents = JSON.stringify([{ event: 'hard_bounce', msg: { email: who('mandrill'), bounce_description: 'bad_mailbox' } }]);
    const mdSig = crypto.createHmac('sha1', secrets.mandrill).update(`${url('mandrill')}mandrill_events${mdEvents}`).digest('base64');
    assert.equal((await fetch(url('mandrill'), { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded', 'x-mandrill-signature': mdSig },
      body: new URLSearchParams({ mandrill_events: mdEvents }).toString() })).status, 200);
    // Resend (Svix)
    const rsRaw = JSON.stringify({ type: 'email.bounced', data: { to: [who('resend')], bounce: { type: 'Permanent', message: 'no such user' } } });
    const rsSig = crypto.createHmac('sha256', svixKey).update(`msg_${tag}.${ts}.${rsRaw}`).digest('base64');
    assert.equal((await post('resend', null, { 'svix-id': `msg_${tag}`, 'svix-timestamp': ts, 'svix-signature': `v1,${rsSig}` }, rsRaw)).status, 200);

    for (const name of Object.keys(secrets)) {
      const row = await EmailBounces.findOneAsync({ email: who(name) });
      assert.ok(row, `${name}: the bounce is recorded`);
      assert.deepEqual([row.lastCategory, row.lastSource, row.stopped], ['hard', name, true], name);
    }

    // Forgeries: a wrong password, a wrong signature, a provider not turned on.
    const forged = who('forged');
    assert.equal((await post('postmark', { RecordType: 'Bounce', Type: 'HardBounce', Email: forged }, { authorization: basic('guess') })).status, 401);
    assert.equal((await post('mailgun', { ...mg, 'event-data': { ...mg['event-data'], recipient: forged } , signature: { ...mg.signature, signature: 'f'.repeat(64) } })).status, 401);
    assert.equal((await post('sendgrid', null, { 'x-twilio-email-event-webhook-signature': sgSig, 'x-twilio-email-event-webhook-timestamp': ts },
      sgRaw.replace(who('sendgrid'), forged))).status, 401, 'a body changed after signing');
    await call(admin, 'saveEmailBounceSettings', { enabled: true, rules: {}, sesTopicArns: [TOPIC], providers: { ...providers, brevo: { enabled: false } } });
    assert.equal((await post('brevo', { event: 'hard_bounce', email: forged }, { authorization: basic('br-pass') })).status, 404, 'a service that is off is not there');
    assert.equal(await EmailBounces.findOneAsync({ email: forged }), undefined);
    // Turning a provider on without its key is refused.
    await assert.rejects(() => call(admin, 'saveEmailBounceSettings', { enabled: true, rules: {}, sesTopicArns: [],
      providers: { mailgun: { enabled: true } }, clearProviderSecrets: ['mailgun'] }), /email-bounce-provider-secret-required/);
  });
});
