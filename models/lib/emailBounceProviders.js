'use strict';

// Email bounces from the sending services other than Amazon SES (#794): each
// service's bounce/complaint webhook, read into WeKan's bounce categories
// (models/lib/emailBounce.js), and each service's own way of proving the
// webhook is from it. Plain Node (crypto only), so tests/emailBounce.test.cjs
// runs every parser and every signature check without a server.
//
//   provider   proves itself with                       Admin Panel field
//   mailgun    HMAC-SHA256(timestamp + token)           webhook signing key
//   sendgrid   ECDSA signature of timestamp + raw body  verification public key
//   mandrill   HMAC-SHA1(url + sorted form params)      webhook key
//   resend     Svix HMAC-SHA256(id.timestamp.body)      signing secret (whsec_...)
//   postmark   HTTP Basic auth in the webhook URL       password
//   brevo      HTTP Basic auth / token                  password
//   mailjet    HTTP Basic auth in the webhook URL       password
//   sparkpost  HTTP Basic auth / custom header          password
//
// A service that cannot sign is given a URL with a password in it, the way
// its own documentation says to protect the endpoint.

const crypto = require('crypto');

const PROVIDERS = Object.freeze(['mailgun', 'sendgrid', 'postmark', 'brevo', 'mailjet', 'sparkpost', 'mandrill', 'resend']);
const SIGNED = Object.freeze({ mailgun: 'hmac', sendgrid: 'ecdsa', mandrill: 'hmac', resend: 'svix' });

const EMAIL = /^[^\s@<>"]+@[^\s@<>"]+$/;
const addr = value => {
  const text = String(value || '').trim().toLowerCase().replace(/^<|>$/g, '');
  return EMAIL.test(text) ? text : '';
};
const bounce = (email, category, status, diagnostic) => {
  const e = addr(email);
  return e && category ? { email: e, category, status: String(status || '').slice(0, 50), diagnostic: String(diagnostic || '').slice(0, 500) } : null;
};
const list = value => (Array.isArray(value) ? value : (value ? [value] : []));

// --- Parsers: provider payload -> [{ email, category, status, diagnostic }] ---

const parsers = {
  // Mailgun "failed" (severity permanent|temporary) and "complained" events.
  mailgun(body) {
    const ev = body && body['event-data'];
    if (!ev) return [];
    const ds = ev['delivery-status'] || {};
    if (ev.event === 'failed') {
      return [bounce(ev.recipient, ev.severity === 'permanent' ? 'hard' : 'soft', ds.code,
        ds.description || ds.message || ev.reason)].filter(Boolean);
    }
    if (ev.event === 'complained') return [bounce(ev.recipient, 'complaint', '', 'complaint')].filter(Boolean);
    return [];
  },
  // SendGrid Event Webhook: an array of events.
  sendgrid(body) {
    return list(body).map(ev => {
      if (!ev) return null;
      if (ev.event === 'bounce') return bounce(ev.email, ev.type === 'blocked' ? 'soft' : 'hard', ev.status, ev.reason);
      if (ev.event === 'dropped' && /bounced address|invalid/i.test(ev.reason || '')) return bounce(ev.email, 'hard', ev.status, ev.reason);
      if (ev.event === 'deferred') return bounce(ev.email, 'soft', ev.status, ev.response || ev.reason);
      if (ev.event === 'spamreport') return bounce(ev.email, 'complaint', '', 'spam report');
      return null;
    }).filter(Boolean);
  },
  // Postmark Bounce and Spam Complaint webhooks.
  postmark(body) {
    if (!body) return [];
    if (body.RecordType === 'SpamComplaint' || body.Type === 'SpamComplaint') {
      return [bounce(body.Email, 'complaint', '', 'spam complaint')].filter(Boolean);
    }
    if (body.RecordType !== 'Bounce') return [];
    const type = String(body.Type || '');
    const category = type === 'AutoResponder' ? 'auto-reply'
      : /^(HardBounce|BadEmailAddress|ManuallyDeactivated|Unsubscribe|Blocked|AddressChange|DMARCPolicy|InboundError)$/.test(type) ? 'hard'
        : /^(SpamNotification|SpamComplaint)$/.test(type) ? 'complaint'
          : 'soft';
    return [bounce(body.Email, category, body.TypeCode, body.Description || body.Details)].filter(Boolean);
  },
  // Brevo (Sendinblue) transactional webhook.
  brevo(body) {
    return list(body).map(ev => {
      const event = ev && String(ev.event || '');
      const category = { hard_bounce: 'hard', invalid_email: 'hard', blocked: 'hard', soft_bounce: 'soft', deferred: 'soft',
        spam: 'complaint', complaint: 'complaint' }[event];
      return category ? bounce(ev.email, category, '', ev.reason || event) : null;
    }).filter(Boolean);
  },
  // Mailjet event API: bounce (hard_bounce true|false), blocked, spam.
  mailjet(body) {
    return list(body).map(ev => {
      if (!ev) return null;
      if (ev.event === 'bounce') return bounce(ev.email, ev.hard_bounce === true ? 'hard' : 'soft', ev.error_related_to, ev.error || ev.comment);
      if (ev.event === 'blocked') return bounce(ev.email, 'soft', ev.error_related_to, ev.error);
      if (ev.event === 'spam') return bounce(ev.email, 'complaint', '', ev.source || 'spam');
      return null;
    }).filter(Boolean);
  },
  // SparkPost: [{ msys: { message_event: {...} } }]. Bounce classes 10, 30
  // and 90 are hard ("invalid recipient", "no RCPT", "unsubscribe");
  // the rest are transient or policy.
  sparkpost(body) {
    return list(body).map(item => {
      const ev = item && item.msys && (item.msys.message_event || item.msys.track_event);
      if (!ev) return null;
      if (ev.type === 'spam_complaint') return bounce(ev.rcpt_to, 'complaint', '', ev.fbtype || 'spam complaint');
      if (ev.type === 'bounce' || ev.type === 'out_of_band') {
        const cls = Number(ev.bounce_class);
        return bounce(ev.rcpt_to, [10, 30, 90].includes(cls) ? 'hard' : 'soft', ev.error_code || cls, ev.reason || ev.raw_reason);
      }
      if (ev.type === 'delay') return bounce(ev.rcpt_to, 'soft', ev.error_code, ev.reason);
      return null;
    }).filter(Boolean);
  },
  // Mandrill: form field mandrill_events, a JSON array.
  mandrill(body) {
    let events = body && body.mandrill_events;
    if (typeof events === 'string') {
      try { events = JSON.parse(events); } catch (e) { return []; }
    }
    return list(events).map(ev => {
      const msg = (ev && ev.msg) || {};
      const category = { hard_bounce: 'hard', reject: 'hard', soft_bounce: 'soft', deferral: 'soft', spam: 'complaint' }[ev && ev.event];
      return category ? bounce(msg.email, category, msg.diag || '', msg.bounce_description || ev.event) : null;
    }).filter(Boolean);
  },
  // Resend: email.bounced (bounce.type Permanent|Transient), email.complained.
  resend(body) {
    if (!body || !body.data) return [];
    if (body.type === 'email.complained') return list(body.data.to).map(to => bounce(to, 'complaint', '', 'complaint')).filter(Boolean);
    if (body.type !== 'email.bounced') return [];
    const b = body.data.bounce || {};
    const category = b.type === 'Transient' ? 'soft' : 'hard';
    return list(body.data.to).map(to => bounce(to, category, b.subType || '', b.message)).filter(Boolean);
  },
};

function parseProviderBounces(provider, body) {
  const parse = parsers[provider];
  return parse ? parse(body) : [];
}

// --- Proving the webhook is from the service ----------------------------------

const safeEqual = (a, b) => {
  const x = Buffer.from(String(a || ''));
  const y = Buffer.from(String(b || ''));
  return x.length === y.length && x.length > 0 && crypto.timingSafeEqual(x, y);
};
const fresh = (seconds, now = Date.now()) => Number.isFinite(seconds) && Math.abs(now / 1000 - seconds) <= 15 * 60;

// headers: lower-case names. rawBody: the bytes as received. url: the full
// URL the service posted to (Mandrill signs it). secret: the Admin Panel's.
function verifyProviderRequest(provider, { headers = {}, body, rawBody = '', url = '', secret = '', now = Date.now() } = {}) {
  if (!secret) return false;
  try {
    switch (provider) {
      case 'mailgun': {
        const sig = body && body.signature;
        if (!sig || !fresh(Number(sig.timestamp), now)) return false;
        const expected = crypto.createHmac('sha256', secret).update(`${sig.timestamp}${sig.token}`).digest('hex');
        return safeEqual(expected, sig.signature);
      }
      case 'sendgrid': {
        const signature = headers['x-twilio-email-event-webhook-signature'];
        const timestamp = headers['x-twilio-email-event-webhook-timestamp'];
        if (!signature || !timestamp || !fresh(Number(timestamp), now)) return false;
        const key = crypto.createPublicKey({ key: Buffer.from(secret.replace(/\s+/g, ''), 'base64'), format: 'der', type: 'spki' });
        return crypto.verify('sha256', Buffer.concat([Buffer.from(String(timestamp)), Buffer.from(rawBody)]), key, Buffer.from(signature, 'base64'));
      }
      case 'mandrill': {
        const signature = headers['x-mandrill-signature'];
        if (!signature || !body) return false;
        const signed = url + Object.keys(body).sort().map(k => `${k}${body[k]}`).join('');
        return safeEqual(crypto.createHmac('sha1', secret).update(signed).digest('base64'), signature);
      }
      case 'resend': {
        const id = headers['svix-id'] || headers['webhook-id'];
        const timestamp = headers['svix-timestamp'] || headers['webhook-timestamp'];
        const signatures = String(headers['svix-signature'] || headers['webhook-signature'] || '');
        if (!id || !timestamp || !fresh(Number(timestamp), now)) return false;
        const key = Buffer.from(String(secret).replace(/^whsec_/, ''), 'base64');
        const expected = crypto.createHmac('sha256', key).update(`${id}.${timestamp}.${rawBody}`).digest('base64');
        return signatures.split(' ').some(part => safeEqual(part.replace(/^v1,/, ''), expected));
      }
      default: {
        // Basic auth (user is anything, the password is the secret), or the
        // secret as ?secret= / X-WeKan-Bounce-Secret.
        const auth = String(headers.authorization || '');
        if (/^basic /i.test(auth)) {
          const decoded = Buffer.from(auth.slice(6), 'base64').toString('utf8');
          return safeEqual(decoded.slice(decoded.indexOf(':') + 1), secret);
        }
        return safeEqual(headers['x-wekan-bounce-secret'] || '', secret);
      }
    }
  } catch (e) {
    return false;
  }
}

module.exports = { PROVIDERS, SIGNED, parseProviderBounces, verifyProviderRequest };
