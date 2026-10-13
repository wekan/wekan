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
