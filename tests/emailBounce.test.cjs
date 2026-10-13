'use strict';

// Email bounces (#794): the categories, the rules an admin saves, Amazon SES
// notifications, delivery status notifications and auto-replies.
// Run: node tests/emailBounce.test.cjs

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {
  CATEGORIES, ACTIONS, DEFAULT_RULES, cleanBounceRules, categoryForStatus, classifySesNotification, classifyEmail, ruleDue,
} = require('../models/lib/emailBounce');

const ROOT = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(ROOT, file), 'utf8');

test('categories and defaults: hard stops at once and tells the inviter, soft after five, auto-replies are ignored', () => {
  assert.deepEqual(CATEGORIES, ['hard', 'soft', 'auto-reply', 'complaint']);
  assert.deepEqual(DEFAULT_RULES.hard, { actions: ['stop-email', 'notify-inviter'], threshold: 1 });
  assert.deepEqual(DEFAULT_RULES.soft, { actions: ['stop-email'], threshold: 5 });
  assert.deepEqual(DEFAULT_RULES['auto-reply'], { actions: ['ignore'], threshold: 1 });
  assert.deepEqual(DEFAULT_RULES.complaint, { actions: ['stop-email'], threshold: 1 });
  assert.deepEqual(cleanBounceRules(undefined), cleanBounceRules({}));
});

test('saved rules: only known actions, ignore alone, threshold 1..100, never empty (negative)', () => {
  const rules = cleanBounceRules({
    hard: { actions: ['delete-invitation', 'rm -rf', 'record'], threshold: '3' },
    soft: { actions: ['ignore', 'stop-email'], threshold: 0 },
    'auto-reply': { actions: [], threshold: 500 },
    complaint: { actions: 'stop-email' },
    evil: { actions: ['stop-email'] },
  });
  assert.deepEqual(rules.hard, { actions: ['delete-invitation', 'record'], threshold: 3 });
  assert.deepEqual(rules.soft, { actions: ['stop-email'], threshold: 5 }, 'ignore with others is dropped; a bad threshold is the default');
  assert.deepEqual(rules['auto-reply'], { actions: ['record'], threshold: 100 });
  assert.deepEqual(rules.complaint, DEFAULT_RULES.complaint);
  assert.equal('evil' in rules, false);
  for (const rule of Object.values(rules)) for (const a of rule.actions) assert.ok(ACTIONS.includes(a));
});

test('SMTP status: 5.x.x hard, 4.x.x soft, mailbox full and too big are soft, 2.x.x is not a bounce', () => {
  assert.equal(categoryForStatus('5.1.1'), 'hard');
  assert.equal(categoryForStatus('550 5.1.10 RESOLVER.ADR.RecipientNotFound'), 'hard');
  assert.equal(categoryForStatus('4.4.7'), 'soft');
  assert.equal(categoryForStatus('5.2.2'), 'soft', 'mailbox full');
  assert.equal(categoryForStatus('5.3.4'), 'soft', 'message too big');
  assert.equal(categoryForStatus('2.0.0'), null);
  assert.equal(categoryForStatus('no status'), null);
});

test('Amazon SES: Permanent bounce, Transient bounce, Complaint, Received', () => {
  const hard = classifySesNotification({
    notificationType: 'Bounce',
    bounce: { bounceType: 'Permanent', bounceSubType: 'General',
      bouncedRecipients: [{ emailAddress: 'Typo@Exmaple.com', status: '5.1.1', diagnosticCode: 'smtp; 550 5.1.1 user unknown' }] },
    mail: { commonHeaders: { subject: 'Invitation' } },
  });
  assert.deepEqual(hard.bounces, [{ email: 'typo@exmaple.com', category: 'hard', status: '5.1.1',
    diagnostic: 'smtp; 550 5.1.1 user unknown', subType: 'General' }]);
  const soft = classifySesNotification({ notificationType: 'Bounce',
    bounce: { bounceType: 'Transient', bounceSubType: 'MailboxFull', bouncedRecipients: [{ emailAddress: 'full@x.org' }] } });
  assert.equal(soft.bounces[0].category, 'soft');
  const ooo = classifySesNotification({ notificationType: 'Bounce',
    bounce: { bounceType: 'Transient', bounceSubType: 'General',
      bouncedRecipients: [{ emailAddress: 'away@x.org', diagnosticCode: 'Automatic reply: Out of Office' }] } });
  assert.equal(ooo.bounces[0].category, 'auto-reply');
  const complaint = classifySesNotification({ notificationType: 'Complaint',
    complaint: { complainedRecipients: [{ emailAddress: 'angry@x.org' }], complaintFeedbackType: 'abuse' } });
  assert.deepEqual(complaint.bounces.map(b => [b.email, b.category]), [['angry@x.org', 'complaint']]);
  assert.equal(classifySesNotification({ notificationType: 'Delivery' }).kind, 'delivery');
  const received = classifySesNotification({ notificationType: 'Received', receipt: { recipients: ['b@d'] }, content: 'eA==' });
  assert.deepEqual([received.kind, received.content], ['received', 'eA==']);
  assert.equal(classifySesNotification(null).kind, null);
  assert.deepEqual(classifySesNotification({ notificationType: 'Bounce', bounce: { bouncedRecipients: [{ emailAddress: 'not an address' }] } }).bounces, []);
});

test('a delivery status notification (RFC 3464) is a bounce, per recipient', () => {
  const dsn = classifyEmail({
    headers: new Map([['content-type', { value: 'multipart/report', params: {} }]]),
    from: { address: 'MAILER-DAEMON@mx.example.org' },
    subject: 'Undelivered Mail Returned to Sender',
    deliveryStatus: [
      'Reporting-MTA: dns; mx.example.org', '',
      'Final-Recipient: rfc822; jhon@example.org', 'Action: failed', 'Status: 5.1.1',
      'Diagnostic-Code: smtp; 550 5.1.1 <jhon@example.org>: Recipient address rejected:', '  User unknown', '',
      'Final-Recipient: rfc822; full@example.org', 'Action: delayed', 'Status: 4.2.2', '',
      'Final-Recipient: rfc822; fine@example.org', 'Action: delivered', 'Status: 2.0.0',
    ].join('\n'),
  });
  assert.equal(dsn.category, 'hard');
  assert.deepEqual(dsn.bounces.map(b => [b.email, b.category, b.status]),
    [['jhon@example.org', 'hard', '5.1.1'], ['full@example.org', 'soft', '4.2.2']]);
  assert.match(dsn.bounces[0].diagnostic, /User unknown/, 'a folded Diagnostic-Code is read whole');
});

test('an older bounce with only a text body is still read', () => {
  const old = classifyEmail({ from: 'postmaster@mail.example.net', subject: 'failure notice',
    text: 'Hi. This is the qmail-send program.\n<nobody@example.net>:\n550 5.1.1 <nobody@example.net>: No such user\n' });
  assert.deepEqual(old.bounces.map(b => [b.email, b.category]), [['nobody@example.net', 'hard']]);
});

test('auto-replies: RFC 3834 Auto-Submitted, vendor headers, Out of Office subjects in several languages', () => {
  for (const headers of [{ 'auto-submitted': 'auto-replied' }, { 'x-autoreply': 'yes' }, { 'x-autorespond': 'x' },
    { precedence: 'auto_reply' }, { 'x-auto-response-suppress': 'All' }]) {
    const verdict = classifyEmail({ headers, from: { address: 'Away@Example.org' }, subject: 'Re: Your card' });
    assert.equal(verdict.category, 'auto-reply', JSON.stringify(headers));
    assert.equal(verdict.bounces[0].email, 'away@example.org');
  }
  for (const subject of ['Out of Office: Board update', 'Automatic reply: hello', 'Abwesend: Projekt', 'Automaattinen vastaus: kortti',
    'Réponse automatique : tableau']) {
    assert.equal(classifyEmail({ from: 'a@b.org', subject }).category, 'auto-reply', subject);
  }
});

test('an ordinary email is neither (negative): it stays an email for a card or a comment', () => {
  assert.equal(classifyEmail({ from: { address: 'ann@x.org' }, subject: 'Fix the printer', text: 'It jams.',
    headers: new Map([['auto-submitted', 'no']]) }), null);
  assert.equal(classifyEmail({ from: 'ann@x.org', subject: 'Re: Office move', text: 'Moving the out of office plants.' }), null);
  assert.equal(classifyEmail({}), null);
});

test('a rule acts at its threshold; ignore never acts', () => {
  assert.equal(ruleDue({ actions: ['stop-email'], threshold: 5 }, 4), false);
  assert.equal(ruleDue({ actions: ['stop-email'], threshold: 5 }, 5), true);
  assert.equal(ruleDue({ actions: ['ignore'], threshold: 1 }, 9), false);
  assert.equal(ruleDue(undefined, 1), false);
});

test('server: SNS signature and topic are checked, bounces never become cards, stopped addresses are not emailed', () => {
  const src = read('server/emailBounces.js');
  assert.match(src, /if \(!\(await verifySns\(msg, fetchCertImpl\)\)\) \{\n\s*refuse\(/);
  assert.match(src, /if \(!settings\.sesTopicArns\.includes\(msg\.TopicArn\)\) \{\n\s*refuse\(/, 'only the topics the Admin Panel lists');
  assert.match(src, /SNS_HOST = \/\^sns\\\.\[a-z0-9-\]\+\\\.amazonaws\\\.com/, 'certificate and subscribe URLs only from amazonaws.com');
  assert.match(src, /Email\.hookSend\(email => \{/);
  assert.match(read('server/routes/inboundEmail.js'), /if \(await handleBounceEmail\(message, \{ source \}\)\) return \{ handled: true, code: 200, bounce: true \};/);
  // The SES endpoint is reachable without the REST API, like the webhook.
  assert.match(read('server/apiMiddleware.js'), /INBOUND_EMAIL_PATHS = \['\/api\/inbound-email', '\/api\/inbound-email\/ses'\]/);
});

// --- The other sending services (models/lib/emailBounceProviders.js) ---------
const crypto = require('node:crypto');
const { PROVIDERS, parseProviderBounces, verifyProviderRequest } = require('../models/lib/emailBounceProviders');

test('every provider\'s bounce payload, in the shape its documentation gives', () => {
  const pairs = bounces => bounces.map(b => [b.email, b.category]);
  assert.deepEqual(PROVIDERS, ['mailgun', 'sendgrid', 'postmark', 'brevo', 'mailjet', 'sparkpost', 'mandrill', 'resend']);
  assert.deepEqual(pairs(parseProviderBounces('mailgun', { 'event-data': { event: 'failed', severity: 'permanent', recipient: 'Typo@X.org',
    'delivery-status': { code: 550, description: 'No such user' } } })), [['typo@x.org', 'hard']]);
  assert.deepEqual(pairs(parseProviderBounces('mailgun', { 'event-data': { event: 'failed', severity: 'temporary', recipient: 'full@x.org' } })), [['full@x.org', 'soft']]);
  assert.deepEqual(pairs(parseProviderBounces('mailgun', { 'event-data': { event: 'complained', recipient: 'a@x.org' } })), [['a@x.org', 'complaint']]);
  assert.deepEqual(pairs(parseProviderBounces('mailgun', { 'event-data': { event: 'delivered', recipient: 'a@x.org' } })), []);
  assert.deepEqual(pairs(parseProviderBounces('sendgrid', [
    { email: 'h@x.org', event: 'bounce', type: 'bounce', status: '5.1.1', reason: '550 no such user' },
    { email: 'b@x.org', event: 'bounce', type: 'blocked', reason: 'blocked' },
    { email: 'd@x.org', event: 'deferred', response: '421 try later' },
    { email: 's@x.org', event: 'spamreport' },
    { email: 'o@x.org', event: 'open' },
  ])), [['h@x.org', 'hard'], ['b@x.org', 'soft'], ['d@x.org', 'soft'], ['s@x.org', 'complaint']]);
  assert.deepEqual(pairs(parseProviderBounces('postmark', { RecordType: 'Bounce', Type: 'HardBounce', Email: 'h@x.org', Description: 'unknown' })), [['h@x.org', 'hard']]);
  assert.deepEqual(pairs(parseProviderBounces('postmark', { RecordType: 'Bounce', Type: 'SoftBounce', Email: 's@x.org' })), [['s@x.org', 'soft']]);
  assert.deepEqual(pairs(parseProviderBounces('postmark', { RecordType: 'Bounce', Type: 'AutoResponder', Email: 'away@x.org' })), [['away@x.org', 'auto-reply']]);
  assert.deepEqual(pairs(parseProviderBounces('postmark', { RecordType: 'SpamComplaint', Email: 'c@x.org' })), [['c@x.org', 'complaint']]);
  assert.deepEqual(pairs(parseProviderBounces('brevo', { event: 'hard_bounce', email: 'h@x.org', reason: 'unknown user' })), [['h@x.org', 'hard']]);
  assert.deepEqual(pairs(parseProviderBounces('brevo', { event: 'soft_bounce', email: 's@x.org' })), [['s@x.org', 'soft']]);
  assert.deepEqual(pairs(parseProviderBounces('brevo', { event: 'spam', email: 'c@x.org' })), [['c@x.org', 'complaint']]);
  assert.deepEqual(pairs(parseProviderBounces('mailjet', [{ event: 'bounce', email: 'h@x.org', hard_bounce: true, error: 'user unknown' },
    { event: 'bounce', email: 's@x.org', hard_bounce: false }, { event: 'spam', email: 'c@x.org' }])),
  [['h@x.org', 'hard'], ['s@x.org', 'soft'], ['c@x.org', 'complaint']]);
  assert.deepEqual(pairs(parseProviderBounces('sparkpost', [
    { msys: { message_event: { type: 'bounce', rcpt_to: 'h@x.org', bounce_class: '10', reason: '550 invalid' } } },
    { msys: { message_event: { type: 'bounce', rcpt_to: 's@x.org', bounce_class: '21' } } },
    { msys: { message_event: { type: 'spam_complaint', rcpt_to: 'c@x.org' } } },
    { msys: { message_event: { type: 'delivery', rcpt_to: 'ok@x.org' } } },
  ])), [['h@x.org', 'hard'], ['s@x.org', 'soft'], ['c@x.org', 'complaint']]);
  assert.deepEqual(pairs(parseProviderBounces('mandrill', { mandrill_events: JSON.stringify([
    { event: 'hard_bounce', msg: { email: 'h@x.org', bounce_description: 'bad_mailbox' } },
    { event: 'soft_bounce', msg: { email: 's@x.org' } }, { event: 'spam', msg: { email: 'c@x.org' } }, { event: 'open', msg: { email: 'o@x.org' } }]) })),
  [['h@x.org', 'hard'], ['s@x.org', 'soft'], ['c@x.org', 'complaint']]);
  assert.deepEqual(pairs(parseProviderBounces('resend', { type: 'email.bounced', data: { to: ['h@x.org'], bounce: { type: 'Permanent', message: 'no such user' } } })), [['h@x.org', 'hard']]);
  assert.deepEqual(pairs(parseProviderBounces('resend', { type: 'email.complained', data: { to: ['c@x.org'] } })), [['c@x.org', 'complaint']]);
  // Nothing from an unknown service, a broken payload or a non-address (negative).
  assert.deepEqual(parseProviderBounces('evil', { event: 'hard_bounce', email: 'h@x.org' }), []);
  assert.deepEqual(parseProviderBounces('mandrill', { mandrill_events: '{broken' }), []);
  assert.deepEqual(parseProviderBounces('brevo', { event: 'hard_bounce', email: 'not an address' }), []);
});

test('each service is proven the way it signs its webhooks, and a forgery is refused (negative)', () => {
  const now = Date.now();
  const ts = Math.floor(now / 1000);
  // Mailgun: HMAC-SHA256 of timestamp + token with the webhook signing key.
  const mgBody = { signature: { timestamp: String(ts), token: 'tok', signature: crypto.createHmac('sha256', 'mg-key').update(`${ts}tok`).digest('hex') } };
  assert.equal(verifyProviderRequest('mailgun', { body: mgBody, secret: 'mg-key', now }), true);
  assert.equal(verifyProviderRequest('mailgun', { body: mgBody, secret: 'other', now }), false);
  assert.equal(verifyProviderRequest('mailgun', { body: { signature: { ...mgBody.signature, timestamp: String(ts - 3600) } }, secret: 'mg-key', now }), false, 'a replay an hour later');
  // SendGrid: ECDSA over timestamp + raw body, the public key in base64 DER.
  const { privateKey, publicKey } = crypto.generateKeyPairSync('ec', { namedCurve: 'prime256v1' });
  const pub = publicKey.export({ format: 'der', type: 'spki' }).toString('base64');
  const raw = '[{"email":"h@x.org","event":"bounce"}]';
  const sgSig = crypto.sign('sha256', Buffer.from(`${ts}${raw}`), privateKey).toString('base64');
  const sgHeaders = { 'x-twilio-email-event-webhook-signature': sgSig, 'x-twilio-email-event-webhook-timestamp': String(ts) };
  assert.equal(verifyProviderRequest('sendgrid', { headers: sgHeaders, rawBody: raw, secret: pub, now }), true);
  assert.equal(verifyProviderRequest('sendgrid', { headers: sgHeaders, rawBody: raw.replace('h@', 'x@'), secret: pub, now }), false, 'a changed body');
  // Mandrill: HMAC-SHA1 of the URL and the sorted form fields.
  const url = 'https://wekan.example.com/api/inbound-email/bounces/mandrill';
  const mdBody = { mandrill_events: '[]' };
  const mdSig = crypto.createHmac('sha1', 'md-key').update(`${url}mandrill_events[]`).digest('base64');
  assert.equal(verifyProviderRequest('mandrill', { headers: { 'x-mandrill-signature': mdSig }, body: mdBody, url, secret: 'md-key', now }), true);
  assert.equal(verifyProviderRequest('mandrill', { headers: { 'x-mandrill-signature': mdSig }, body: mdBody, url: `${url}x`, secret: 'md-key', now }), false);
  // Resend (Svix): HMAC-SHA256 of id.timestamp.body with the base64 secret.
  const key = crypto.randomBytes(24);
  const rsBody = '{"type":"email.bounced"}';
  const rsSig = crypto.createHmac('sha256', key).update(`msg_1.${ts}.${rsBody}`).digest('base64');
  const rsHeaders = { 'svix-id': 'msg_1', 'svix-timestamp': String(ts), 'svix-signature': `v1,bogus v1,${rsSig}` };
  assert.equal(verifyProviderRequest('resend', { headers: rsHeaders, rawBody: rsBody, secret: `whsec_${key.toString('base64')}`, now }), true);
  assert.equal(verifyProviderRequest('resend', { headers: { ...rsHeaders, 'svix-id': 'msg_2' }, rawBody: rsBody, secret: `whsec_${key.toString('base64')}`, now }), false);
  // The basic-auth services: the password is the secret; the user name is anything.
  const basic = pw => ({ authorization: `Basic ${Buffer.from(`wekan:${pw}`).toString('base64')}` });
  for (const provider of ['postmark', 'brevo', 'mailjet', 'sparkpost']) {
    assert.equal(verifyProviderRequest(provider, { headers: basic('s3cret'), secret: 's3cret', now }), true, provider);
    assert.equal(verifyProviderRequest(provider, { headers: basic('wrong'), secret: 's3cret', now }), false, provider);
    assert.equal(verifyProviderRequest(provider, { headers: { 'x-wekan-bounce-secret': 's3cret' }, secret: 's3cret', now }), true, provider);
    assert.equal(verifyProviderRequest(provider, { headers: {}, secret: 's3cret', now }), false, `${provider} without anything`);
  }
  // No secret configured: nothing is accepted.
  for (const provider of PROVIDERS) assert.equal(verifyProviderRequest(provider, { headers: basic(''), body: mgBody, secret: '', now }), false, provider);
});
