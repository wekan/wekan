'use strict';

// Email bounces (#794): what came back from an email WeKan sent, and what to
// do about it. Pure - no Meteor, no Mongo - so tests/emailBounce.test.cjs runs
// it with plain Node, and the server (server/emailBounces.js) and the Admin
// Panel page share one catalogue.
//
// The categories and their default actions follow what established mailing
// software does - listmonk's bounce settings (soft/hard/complaint, an action
// per type after a count) and Discourse's bounce score (soft bounces count
// less than hard ones, an address is stopped after a threshold):
//
//   hard        the address does not exist or never will (5.x.x - a typo in
//               an invited address, a deleted account, an unknown domain)
//   soft        temporarily undeliverable (4.x.x - mailbox full, server busy,
//               greylisting); only a run of them means anything
//   auto-reply  an out-of-office or vacation reply, a ticket-system
//               acknowledgement - the email WAS delivered
//   complaint   the recipient marked it as spam (an ISP feedback loop or SES
//               complaint): stop at once
//
// Where they come from:
//   - Amazon SES, through SNS: Bounce and Complaint notifications, and mail
//     SES received for the bounce address (classifySesNotification);
//   - any email that reaches WeKan (IMAP, provider webhook, Sandstorm): a
//     delivery status notification (RFC 3464 multipart/report) or an
//     auto-reply (RFC 3834 Auto-Submitted, and the common vendor headers)
//     (classifyEmail).

const CATEGORIES = Object.freeze(['hard', 'soft', 'auto-reply', 'complaint']);

// What can be done, per category (Admin Panel -> Email bounces):
//   record          keep the bounce in the list, nothing else
//   stop-email      after `threshold` bounces, WeKan stops emailing that
//                   address (notifications, invitations) until an admin
//                   clears it
//   notify-inviter  tell whoever invited the address, by email and in their
//                   notification tray, that the invitation did not arrive
//   delete-invitation  remove the pending invitation as well
//   ignore          do not even record it (auto-replies, by default)
const ACTIONS = Object.freeze(['record', 'stop-email', 'notify-inviter', 'delete-invitation', 'ignore']);

const DEFAULT_RULES = Object.freeze({
  hard: Object.freeze({ actions: ['stop-email', 'notify-inviter'], threshold: 1 }),
  soft: Object.freeze({ actions: ['stop-email'], threshold: 5 }),
  'auto-reply': Object.freeze({ actions: ['ignore'], threshold: 1 }),
  complaint: Object.freeze({ actions: ['stop-email'], threshold: 1 }),
});

// The rules an admin may save: known categories, known actions, a threshold
// from 1 to 100. 'ignore' alone means ignore; with anything else it is dropped.
function cleanBounceRules(rules) {
  const out = {};
  for (const category of CATEGORIES) {
    const given = rules && typeof rules === 'object' ? rules[category] : null;
    const base = DEFAULT_RULES[category];
    let actions = Array.isArray(given && given.actions)
      ? [...new Set(given.actions.filter(a => ACTIONS.includes(a)))] : [...base.actions];
    if (actions.includes('ignore') && actions.length > 1) actions = actions.filter(a => a !== 'ignore');
    if (!actions.length) actions = ['record'];
    const n = Math.floor(Number(given && given.threshold));
    out[category] = { actions, threshold: Number.isFinite(n) && n >= 1 ? Math.min(n, 100) : base.threshold };
  }
  return out;
}

const EMAIL = /^[^\s@<>"]+@[^\s@<>"]+$/;
const lower = value => String(value || '').trim().toLowerCase();
const cleanAddress = value => {
  const text = lower(value).replace(/^rfc822;\s*/, '').replace(/^<|>$/g, '');
  return EMAIL.test(text) ? text : '';
};

// SMTP enhanced status (RFC 3463) -> category: 5.x.x permanent, 4.x.x
// transient. A few 5.x.x are really "full" or "too big" and come back.
function categoryForStatus(status) {
  const m = String(status || '').match(/\b([245])\.(\d{1,3})\.(\d{1,3})\b/);
  if (!m) return null;
  if (m[1] === '2') return null;
  if (m[1] === '4') return 'soft';
  const code = `${m[2]}.${m[3]}`;
  if (['2.2', '3.4', '4.5'].includes(code)) return 'soft';   // mailbox full, message too big, system congested
  return 'hard';
}

// --- Amazon SES through SNS -----------------------------------------------

// An SNS envelope's Message, as SES writes it. Returns
//   { kind: 'bounce'|'complaint'|'delivery'|'received'|null, bounces: [...], mail }
// bounces: [{ email, category, status, diagnostic, subType }]
function classifySesNotification(message) {
  const msg = message && typeof message === 'object' ? message : {};
  const type = msg.notificationType || msg.eventType;
  const mail = msg.mail || {};
  if (type === 'Bounce' && msg.bounce) {
    const permanent = msg.bounce.bounceType === 'Permanent';
    const subType = msg.bounce.bounceSubType || '';
    const bounces = (msg.bounce.bouncedRecipients || []).map(r => {
      const email = cleanAddress(r.emailAddress);
      const status = r.status || '';
      // SES says "Permanent" for a suppressed or non-existent address and
      // "Transient" for mailbox full, too large, or an out-of-office SES saw.
      let category = permanent ? 'hard' : 'soft';
      if (!permanent && /^(General)$/.test(subType) && /auto.?repl|out of office|vacation/i.test(r.diagnosticCode || '')) {
        category = 'auto-reply';
      }
      return { email, category, status, diagnostic: String(r.diagnosticCode || '').slice(0, 500), subType };
    }).filter(b => b.email);
    return { kind: 'bounce', bounces, mail };
  }
  if (type === 'Complaint' && msg.complaint) {
    const bounces = (msg.complaint.complainedRecipients || []).map(r => ({
      email: cleanAddress(r.emailAddress), category: 'complaint', status: '',
      diagnostic: String(msg.complaint.complaintFeedbackType || 'complaint').slice(0, 200),
      subType: msg.complaint.complaintSubType || '',
    })).filter(b => b.email);
    return { kind: 'complaint', bounces, mail };
  }
  if (type === 'Delivery') return { kind: 'delivery', bounces: [], mail };
  if (type === 'Received') return { kind: 'received', bounces: [], mail, receipt: msg.receipt || {}, content: msg.content };
  return { kind: null, bounces: [], mail };
}

// --- Any received email --------------------------------------------------

const AUTO_REPLY_SUBJECT = /^(auto(matic)?[ -]?(reply|response|antwort)|out of (the )?office|abwesend|automaattinen vastaus|r[ée]ponse automatique|risposta automatica|respuesta autom[áa]tica|vacation|on vacation|i am (currently )?away)/i;
const BOUNCE_SUBJECT = /(undeliver|delivery (status notification|failure|has failed)|returned mail|mail delivery (failed|subsystem)|failure notice|non.?delivery|delivery report|could not be delivered)/i;
const BOUNCE_SENDER = /^(mailer-daemon|postmaster)@/i;

// headers: a Map or plain object of lower-case header name -> value (string
// or { value, params } as mailparser gives). text: the body as text, which a
// DSN's human-readable part and its message/delivery-status part are in.
// Returns null (not a bounce, not an auto-reply - an ordinary email) or
//   { category, bounces: [{ email, category, status, diagnostic }] }
function classifyEmail({ headers, from, subject, text, deliveryStatus } = {}) {
  const get = name => {
    if (!headers) return '';
    const value = typeof headers.get === 'function' ? headers.get(name) : headers[name];
    if (value && typeof value === 'object' && !Array.isArray(value)) return lower(value.value || value.text || '');
    return lower(Array.isArray(value) ? value.join(' ') : value);
  };
  const fromAddress = lower(from && (from.address || from));
  const contentType = get('content-type');
  const reportType = /multipart\/report/.test(contentType) && /report-type=?"?delivery-status/.test(contentType);
  const statusText = String(deliveryStatus || '') + '\n' + String(text || '');

  // RFC 3464: per-recipient blocks of Final-Recipient / Action / Status.
  const looksLikeDsn = reportType || BOUNCE_SENDER.test(fromAddress) || BOUNCE_SUBJECT.test(subject || '');
  if (looksLikeDsn) {
    const bounces = [];
    const blocks = statusText.split(/\r?\n\s*\r?\n/);
    for (const block of blocks) {
      const recipient = block.match(/^(?:Final|Original)-Recipient:\s*(?:rfc822;)?\s*(\S+)/im);
      if (!recipient) continue;
      const action = (block.match(/^Action:\s*(\S+)/im) || [])[1] || '';
      if (/^(delivered|relayed|expanded)$/i.test(action)) continue;
      const status = (block.match(/^Status:\s*(\S+)/im) || [])[1] || '';
      const diagnostic = ((block.match(/^Diagnostic-Code:\s*(.+(?:\r?\n[ \t].+)*)/im) || [])[1] || '').replace(/\s+/g, ' ');
      const category = /^delayed$/i.test(action) ? 'soft' : (categoryForStatus(status) || (/^failed$/i.test(action) ? 'hard' : null));
      const email = cleanAddress(recipient[1]);
      if (email && category && !bounces.some(b => b.email === email)) {
        bounces.push({ email, category, status, diagnostic: diagnostic.slice(0, 500) });
      }
    }
    // A bounce without a machine-readable part (older servers): the
    // "550 5.1.1 <someone@x>: user unknown" line in the text.
    if (!bounces.length) {
      const line = statusText.match(/\b([45]\d\d)[ -]+([45]\.\d{1,3}\.\d{1,3})?[^\n]*?<?([^\s<>@]+@[^\s<>]+?)>?[:\s][^\n]*/);
      if (line) {
        const email = cleanAddress(line[3]);
        const category = categoryForStatus(line[2]) || (line[1].startsWith('5') ? 'hard' : 'soft');
        if (email) bounces.push({ email, category, status: line[2] || line[1], diagnostic: line[0].trim().slice(0, 500) });
      }
    }
    if (bounces.length) {
      const order = ['hard', 'complaint', 'soft', 'auto-reply'];
      const category = order.find(c => bounces.some(b => b.category === c));
      return { category, bounces };
    }
    if (reportType || BOUNCE_SENDER.test(fromAddress)) return { category: 'soft', bounces: [] };
  }

  // RFC 3834 and the vendor headers every major mail system sets.
  const autoSubmitted = get('auto-submitted');
  const autoReply = (autoSubmitted && autoSubmitted !== 'no')
    || get('x-autoreply') || get('x-autorespond') || get('x-auto-response-suppress') === 'all'
    || /^(auto_reply|auto-reply)$/.test(get('precedence'))
    || AUTO_REPLY_SUBJECT.test(String(subject || '').trim());
  if (autoReply) {
    const email = cleanAddress(fromAddress);
    return { category: 'auto-reply', bounces: email ? [{ email, category: 'auto-reply', status: '', diagnostic: String(subject || '').slice(0, 200) }] : [] };
  }
  return null;
}

// How many bounces of a category it takes before the rule acts: soft bounces
// count only after the threshold, the rest at once by default.
function ruleDue(rule, count) {
  return !!rule && !rule.actions.includes('ignore') && count >= rule.threshold;
}

module.exports = {
  CATEGORIES,
  ACTIONS,
  DEFAULT_RULES,
  cleanBounceRules,
  categoryForStatus,
  classifySesNotification,
  classifyEmail,
  ruleDue,
};
