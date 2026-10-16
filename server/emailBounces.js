// Email bounces (#794): what comes back from email WeKan sent - a mistyped
// invited address, a full mailbox, an out-of-office reply, a spam complaint -
// handled in WeKan instead of landing in the administrator's own inbox.
// Categories, actions and defaults: models/lib/emailBounce.js.
// Admin Panel -> E-mail -> Bounces: client/components/settings/emailBounces.*.
//
// Where bounces come in:
//   - Amazon SES through SNS, POST /api/inbound-email/ses: SES Bounce and
//     Complaint notifications, and mail SES RECEIVED for the address WeKan
//     sends from (a receipt rule with an SNS action). The SNS message's
//     signature is verified against Amazon's certificate, and only the topics
//     the Admin Panel lists are accepted - a valid signature proves the
//     message came from SNS, not from YOUR account's topic.
//   - Every other way email reaches WeKan (IMAP, a provider webhook, a
//     Sandstorm grain): receiveEmail() asks classifyEmail first, and a
//     delivery status notification or an auto-reply is a bounce here, never
//     a card or a comment.
//
// What is done: per category, after its threshold, the rule's actions -
// stop emailing the address (every WeKan email, by an Email.hookSend that
// takes it out of To/Cc/Bcc), tell whoever invited it, delete the pending
// invitation. One row per address in `email_bounces`, with a count per
// category and the last few events; an admin clears it to start again.
import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { check, Match } from 'meteor/check';
import { WebApp } from 'meteor/webapp';
import { Email } from 'meteor/email';
import { Random } from 'meteor/random';
import Settings from '/models/settings';
import { sendJsonResult } from '/server/apiMiddleware';

const {
  CATEGORIES, cleanBounceRules, classifySesNotification, classifyEmail, ruleDue,
} = require('/models/lib/emailBounce');
const { recordMailProblem } = require('/server/lib/mailProblems');
const { PROVIDERS, SIGNED, parseProviderBounces, verifyProviderRequest } = require('/models/lib/emailBounceProviders');

export const EmailBounces = new Mongo.Collection('email_bounces');
const HISTORY = 10;
const PAGE = 10;

Meteor.startup(async () => {
  try {
    await EmailBounces.rawCollection().createIndex({ email: 1 }, { unique: true });
    await EmailBounces.rawCollection().createIndex({ lastAt: -1 });
  } catch (e) {
    console.warn('email bounces: could not create indexes:', e && e.message);
  }
  await refreshStopped();
});

export async function bounceSettings() {
  const setting = await Settings.findOneAsync({}, { fields: { emailBounces: 1 } });
  const stored = (setting && setting.emailBounces) || {};
  const providers = {};
  for (const name of PROVIDERS) providers[name] = { enabled: !!(stored.providers && stored.providers[name] && stored.providers[name].enabled) };
  return {
    enabled: stored.enabled !== false,
    rules: cleanBounceRules(stored.rules),
    sesTopicArns: Array.isArray(stored.sesTopicArns) ? stored.sesTopicArns : [],
    providers,
    // Server-only: the keys and passwords that prove a webhook is the service's.
    providerSecrets: (stored.providerSecrets && typeof stored.providerSecrets === 'object') ? stored.providerSecrets : {},
  };
}

// What the Admin Panel is shown: no secret, only whether one is saved.
function bounceSettingsView(settings) {
  const { providerSecrets, ...rest } = settings;
  const providers = {};
  for (const name of PROVIDERS) {
    providers[name] = {
      enabled: settings.providers[name].enabled,
      secretSet: !!providerSecrets[name],
      signed: !!SIGNED[name],
      endpoint: Meteor.absoluteUrl(`api/inbound-email/bounces/${name}`),
    };
  }
  return { ...rest, providers };
}

// --- Stopping email to an address ------------------------------------------

let stopped = new Set();
async function refreshStopped() {
  try {
    const rows = await EmailBounces.find({ stopped: true }, { fields: { email: 1 } }).fetchAsync();
    stopped = new Set(rows.map(r => r.email));
  } catch (e) {
    // the collection is not there yet: nothing is stopped
  }
}

const addressOf = value => String(value || '').match(/<([^>]+)>/)?.[1] || String(value || '').trim();
function keep(list) {
  if (!list) return list;
  const items = (Array.isArray(list) ? list : String(list).split(',')).map(s => (typeof s === 'string' ? s.trim() : s)).filter(Boolean);
  return items.filter(item => !stopped.has(addressOf(typeof item === 'object' ? item.address : item).toLowerCase()));
}

// Every email WeKan sends passes here: a stopped address is taken out, and an
// email left with no recipient is not sent at all.
Email.hookSend(email => {
  if (!stopped.size) return true;
  const to = keep(email.to);
  const cc = keep(email.cc);
  const bcc = keep(email.bcc);
  if (email.to) email.to = to;
  if (email.cc) email.cc = cc;
  if (email.bcc) email.bcc = bcc;
  return (to || []).length + (cc || []).length + (bcc || []).length > 0;
});

export function isAddressStopped(address) {
  return stopped.has(String(address || '').toLowerCase());
}

// --- Recording, and the actions ---------------------------------------------

async function notifyInviter(email, bounce) {
  const InvitationCodes = require('/models/invitationCodes').default;
  const invitations = await InvitationCodes.find({ email, valid: true }).fetchAsync();
  for (const invitation of invitations) {
    const inviter = invitation.authorId && await Meteor.users.findOneAsync(invitation.authorId, { fields: { emails: 1, username: 1 } });
    const to = inviter && inviter.emails && inviter.emails[0] && inviter.emails[0].address;
    if (!to || isAddressStopped(to)) continue;
    try {
      await Email.sendAsync({
        to,
        from: require('meteor/accounts-base').Accounts.emailTemplates.from,
        subject: `WeKan: the invitation to ${email} could not be delivered`,
        text: `Your invitation to ${email} came back undelivered:\n\n${bounce.diagnostic || bounce.status || bounce.category}\n\n`
          + 'Check the address for a typo, and invite the right one.',
        headers: { 'Auto-Submitted': 'auto-generated' },
      });
    } catch (e) {
      recordMailProblem('send-failed', { source: 'bounce-notify-inviter', detail: e && e.message });
    }
  }
}

async function deleteInvitation(email) {
  const InvitationCodes = require('/models/invitationCodes').default;
  await InvitationCodes.removeAsync({ email, valid: true });
}

// bounces: [{ email, category, status, diagnostic }]; source: where from.
export async function recordBounces(bounces, { source = 'email', subject = '' } = {}) {
  const settings = await bounceSettings();
  if (!settings.enabled) return { recorded: 0 };
  let recorded = 0;
  for (const bounce of bounces || []) {
    const rule = settings.rules[bounce.category];
    if (!bounce.email || !rule || rule.actions.includes('ignore')) continue;
    const now = new Date();
    const event = { at: now, category: bounce.category, status: bounce.status || '', diagnostic: bounce.diagnostic || '',
      source, subject: String(subject || '').slice(0, 200) };
    const user = await Meteor.users.findOneAsync({ 'emails.address': bounce.email }, { fields: { _id: 1 } });
    const result = await EmailBounces.rawCollection().findOneAndUpdate(
      { email: bounce.email },
      {
        $inc: { [`counts.${bounce.category}`]: 1, total: 1 },
        $set: { lastAt: now, lastCategory: bounce.category, lastStatus: event.status, lastDiagnostic: event.diagnostic,
          lastSource: source, userId: user ? user._id : null },
        $setOnInsert: { _id: Random.id(), firstAt: now, stopped: false },
        $push: { history: { $each: [event], $slice: -HISTORY } },
      },
      { upsert: true, returnDocument: 'after' },
    );
    const row = result && (result.value !== undefined ? result.value : result);
    recorded += 1;
    const count = (row && row.counts && row.counts[bounce.category]) || 1;
    if (!ruleDue(rule, count)) continue;
    // A rule acts once, when its threshold is reached, not on every bounce after.
    const firstTime = count === rule.threshold;
    if (rule.actions.includes('stop-email') && row && !row.stopped) {
      await EmailBounces.rawCollection().updateOne({ email: bounce.email }, { $set: { stopped: true, stoppedAt: now, stoppedBy: bounce.category } });
      stopped.add(bounce.email);
    }
    if (firstTime && rule.actions.includes('notify-inviter')) await notifyInviter(bounce.email, bounce);
    if (rule.actions.includes('delete-invitation')) await deleteInvitation(bounce.email);
  }
  return { recorded };
}

// An email that reached WeKan: a bounce or an auto-reply? Then it is handled
// here and the caller makes no card of it. Returns true when it was one.
export async function handleBounceEmail(message, { source = 'email' } = {}) {
  const verdict = classifyEmail({
    headers: message.headers, from: message.from, subject: message.subject,
    text: message.text, deliveryStatus: message.deliveryStatus,
  });
  if (!verdict) return false;
  await recordBounces(verdict.bounces, { source, subject: message.subject });
  return true;
}

// --- Amazon SES through SNS -------------------------------------------------

const crypto = require('crypto');
const certCache = new Map();
const SNS_HOST = /^sns\.[a-z0-9-]+\.amazonaws\.com(\.cn)?$/;

function snsUrlAllowed(url) {
  try {
    const u = new URL(url);
    return u.protocol === 'https:' && SNS_HOST.test(u.hostname);
  } catch (e) {
    return false;
  }
}

// The string SNS signs (docs.aws.amazon.com/sns/latest/dg/sns-verify-signature-of-message.html).
export function snsStringToSign(msg) {
  const keys = msg.Type === 'Notification'
    ? ['Message', 'MessageId', 'Subject', 'Timestamp', 'TopicArn', 'Type']
    : ['Message', 'MessageId', 'SubscribeURL', 'Timestamp', 'Token', 'TopicArn', 'Type'];
  return keys.filter(k => msg[k] !== undefined && msg[k] !== null).map(k => `${k}\n${msg[k]}\n`).join('');
}

async function verifySns(msg, fetchCert = defaultFetchCert) {
  if (!msg || !msg.Signature || !snsUrlAllowed(msg.SigningCertURL) || !/\.pem$/.test(new URL(msg.SigningCertURL).pathname)) return false;
  let cert = certCache.get(msg.SigningCertURL);
  if (!cert) {
    cert = await fetchCert(msg.SigningCertURL);
    if (!cert) return false;
    certCache.set(msg.SigningCertURL, cert);
  }
  const algorithm = msg.SignatureVersion === '2' ? 'RSA-SHA256' : 'RSA-SHA1';
  try {
    return crypto.verify(algorithm, Buffer.from(snsStringToSign(msg)), cert, Buffer.from(msg.Signature, 'base64'));
  } catch (e) {
    return false;
  }
}

async function defaultFetchCert(url) {
  const res = await fetch(url);
  return res.ok ? res.text() : null;
}

// For the tests: a certificate fetcher that does not go to Amazon.
let fetchCertImpl = defaultFetchCert;
export function setSnsCertFetcherForTests(fn) { fetchCertImpl = fn || defaultFetchCert; certCache.clear(); }

function readBody(req) {
  return new Promise((resolve, reject) => {
    if (req.body && typeof req.body === 'object' && Object.keys(req.body).length) { resolve(JSON.stringify(req.body)); return; }
    const chunks = [];
    let size = 0;
    req.on('data', c => { size += c.length; if (size > 40 * 1024 * 1024) { reject(new Error('too-large')); req.destroy(); } else chunks.push(c); });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

function refuse(detail) {
  try {
    require('/server/lib/securityLog').record({ key: 'authn.inbound-email', action: 'blocked', source: 'ses', detail });
  } catch (e) {
    // logging must never break the guard
  }
}

export async function handleSnsMessage(msg) {
  if (!(await verifySns(msg, fetchCertImpl))) {
    refuse('SNS message with a missing or wrong signature');
    return { code: 403 };
  }
  const settings = await bounceSettings();
  if (!settings.sesTopicArns.includes(msg.TopicArn)) {
    refuse('SNS message from a topic the Admin Panel does not list');
    return { code: 403 };
  }
  if (msg.Type === 'SubscriptionConfirmation') {
    if (!snsUrlAllowed(msg.SubscribeURL)) { refuse('SNS SubscribeURL outside amazonaws.com'); return { code: 400 }; }
    const res = await fetch(msg.SubscribeURL).catch(e => ({ ok: false, statusText: e && e.message }));
    if (!res.ok) {
      recordMailProblem('receive-unreadable', { source: 'ses', detail: `SNS subscription could not be confirmed: ${res.statusText}` });
      return { code: 502 };
    }
    return { code: 200, confirmed: true };
  }
  if (msg.Type !== 'Notification') return { code: 200 };
  let inner;
  try {
    inner = JSON.parse(msg.Message);
  } catch (e) {
    recordMailProblem('receive-unreadable', { source: 'ses', detail: 'SNS notification whose Message is not SES JSON' });
    return { code: 400 };
  }
  const ses = classifySesNotification(inner);
  if (ses.kind === 'bounce' || ses.kind === 'complaint') {
    const { recorded } = await recordBounces(ses.bounces, { source: 'ses', subject: (ses.mail.commonHeaders || {}).subject });
    return { code: 200, recorded };
  }
  if (ses.kind === 'received') {
    if (!ses.content) {
      recordMailProblem('receive-unreadable', { source: 'ses',
        detail: 'SES received an email but the SNS action does not include it - set the receipt rule\'s SNS action encoding to Base64' });
      return { code: 200 };
    }
    const raw = (inner.receipt && inner.receipt.action && inner.receipt.action.encoding === 'BASE64')
      ? Buffer.from(ses.content, 'base64') : Buffer.from(ses.content, 'utf8');
    const { simpleParser } = require('mailparser');
    const { fromParsedMail } = require('/server/lib/inboundEmailPayload');
    const message = fromParsedMail(await simpleParser(raw, { skipImageLinks: true, skipTextLinks: true }));
    // SES knows the real envelope recipients.
    message.deliveredTo = [...(inner.receipt && inner.receipt.recipients || []), ...(message.deliveredTo || [])];
    const { receiveEmail } = require('/server/routes/inboundEmail');
    const result = await receiveEmail(message, { source: 'ses' });
    return { code: result.code || 200 };
  }
  return { code: 200 };
}

WebApp.handlers.post('/api/inbound-email/ses', async function sesHandler(req, res) {
  try {
    let msg;
    try {
      msg = JSON.parse(await readBody(req));
    } catch (e) {
      sendJsonResult(res, { code: 400, data: { error: 'Not an SNS message' } });
      return;
    }
    const result = await handleSnsMessage(msg);
    sendJsonResult(res, { code: result.code, data: { ok: result.code === 200 } });
  } catch (error) {
    recordMailProblem('receive-unreadable', { source: 'ses', detail: `unexpected: ${error && error.message}` });
    sendJsonResult(res, { code: 500, data: { error: 'Internal error' } });
  }
});

// --- The other sending services' bounce webhooks -----------------------------

// One request from a service: is it the service (its signature, or the
// password in the URL the admin gave it), and which bounces does it carry.
export async function handleProviderWebhook(provider, { headers = {}, body, rawBody = '', url = '', querySecret = '' } = {}) {
  if (!PROVIDERS.includes(provider)) return { code: 404 };
  const settings = await bounceSettings();
  if (!settings.enabled || !settings.providers[provider].enabled) return { code: 404 };
  const secret = settings.providerSecrets[provider] || '';
  const withQuery = querySecret && !SIGNED[provider] ? { ...headers, 'x-wekan-bounce-secret': querySecret } : headers;
  if (!verifyProviderRequest(provider, { headers: withQuery, body, rawBody, url, secret })) {
    refuse(`${provider} bounce webhook with a missing or wrong signature`);
    return { code: 401 };
  }
  const bounces = parseProviderBounces(provider, body);
  const { recorded } = await recordBounces(bounces, { source: provider });
  return { code: 200, recorded };
}

WebApp.handlers.post('/api/inbound-email/bounces/:provider', async function providerBounceHandler(req, res) {
  const provider = String(req.params.provider || '');
  try {
    const result = await handleProviderWebhook(provider, {
      headers: req.headers || {},
      body: req.body,
      rawBody: req.rawBody || '',
      // The URL the service posted to, as it signed it (Mandrill).
      url: Meteor.absoluteUrl(`api/inbound-email/bounces/${provider}`),
      querySecret: (req.query && typeof req.query.secret === 'string') ? req.query.secret : '',
    });
    sendJsonResult(res, { code: result.code, data: { ok: result.code === 200, recorded: result.recorded || 0 } });
  } catch (error) {
    recordMailProblem('receive-unreadable', { source: provider, detail: `bounce webhook: ${error && error.message}` });
    sendJsonResult(res, { code: 500, data: { error: 'Internal error' } });
  }
});

// --- Admin Panel ------------------------------------------------------------

async function requireAdmin(userId) {
  const user = userId && await Meteor.users.findOneAsync(userId, { fields: { isAdmin: 1 } });
  if (!user || !user.isAdmin) throw new Meteor.Error('not-authorized');
}

const escapeRegex = text => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

Meteor.methods({
  async getEmailBounceSettings() {
    await requireAdmin(this.userId);
    return { ...bounceSettingsView(await bounceSettings()), categories: CATEGORIES, sesEndpoint: Meteor.absoluteUrl('api/inbound-email/ses') };
  },

  async saveEmailBounceSettings(input) {
    check(input, { enabled: Boolean, rules: Object, sesTopicArns: [String],
      providers: Match.Optional(Object), providerSecrets: Match.Optional(Object), clearProviderSecrets: Match.Optional([String]) });
    await requireAdmin(this.userId);
    const arns = [...new Set(input.sesTopicArns.map(s => s.trim()).filter(s => /^arn:aws[a-z-]*:sns:[a-z0-9-]+:\d{12}:[A-Za-z0-9_-]{1,256}$/.test(s)))];
    if (arns.length !== input.sesTopicArns.map(s => s.trim()).filter(Boolean).length) throw new Meteor.Error('email-bounce-invalid-topic');
    const previous = await bounceSettings();
    const providers = {};
    const providerSecrets = { ...previous.providerSecrets };
    for (const name of PROVIDERS) {
      providers[name] = { enabled: !!(input.providers && input.providers[name] && input.providers[name].enabled === true) };
      // A secret is written only when one is typed, and removed only on request.
      const typed = input.providerSecrets && typeof input.providerSecrets[name] === 'string' ? input.providerSecrets[name].trim() : '';
      if (typed) providerSecrets[name] = typed.slice(0, 4096);
      if ((input.clearProviderSecrets || []).includes(name)) delete providerSecrets[name];
      if (providers[name].enabled && !providerSecrets[name]) throw new Meteor.Error('email-bounce-provider-secret-required');
    }
    const value = { enabled: input.enabled, rules: cleanBounceRules(input.rules), sesTopicArns: arns, providers, providerSecrets };
    const setting = await Settings.findOneAsync({});
    await Settings.updateAsync(setting._id, { $set: { emailBounces: value } });
    return bounceSettingsView({ ...value, providers: Object.fromEntries(PROVIDERS.map(n => [n, providers[n]])) });
  },

  // One page of bounced addresses, newest first (docs/Features/General/Table.md).
  async emailBouncesPage(options) {
    check(options, { page: Match.Optional(Number), search: Match.Optional(String), stoppedOnly: Match.Optional(Boolean) });
    await requireAdmin(this.userId);
    const selector = {};
    const search = String(options.search || '').trim().slice(0, 200);
    if (search) selector.email = { $regex: escapeRegex(search), $options: 'i' };
    if (options.stoppedOnly) selector.stopped = true;
    const page = Math.max(1, Math.floor(options.page || 1));
    const total = await EmailBounces.find(selector).countAsync();
    const rows = await EmailBounces.find(selector, { sort: { lastAt: -1 }, skip: (page - 1) * PAGE, limit: PAGE }).fetchAsync();
    return { total, page, rows };
  },

  // Start emailing an address again: the row is removed, its counts with it.
  async clearEmailBounce(email) {
    check(email, String);
    await requireAdmin(this.userId);
    await EmailBounces.removeAsync({ email: email.toLowerCase() });
    stopped.delete(email.toLowerCase());
    return true;
  },
});
