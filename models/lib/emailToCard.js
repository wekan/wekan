'use strict';

// Email to card (#794, #3948): an email sent to a member's personal board
// address becomes a card on that board, the way Trello's email-to-board does.
//
// Pure (no Meteor, no Mongo), so it is shared by the client (the settings UI)
// and the server (the inbound paths), and tested with plain Node
// (tests/emailToCard.test.cjs).
//
// Where it is configured - Notification Settings, at three levels:
//   - Admin Panel: whether inbound email is on at all, the address domain, and
//     the mail servers (IMAP accounts) with their passwords - server-side only.
//     The admin switch is a hard gate: nothing below can turn on what the
//     administrator has off.
//   - Board Settings: whether this board accepts email, which list and
//     swimlane new cards go to, and which parts of an email are used.
//   - Member Settings: whether the member's own addresses work, and the parts
//     they want (overriding the board's).
// Member over board over admin, as for the other notification settings
// (models/lib/notificationSettings.js); an unset value falls through.

// What an email can contribute to a card. `title` is always the subject.
const EMAIL_PARTS = Object.freeze({
  // The card description: 'text' (the plain-text body, or the HTML body as
  // text) or 'none'.
  description: Object.freeze(['text', 'none']),
  // Drop the quoted earlier messages ("On ... wrote:", "> ...").
  stripQuoted: 'boolean',
  // Attach the email's attachments to the card.
  attachments: 'boolean',
  // Start the description with "From: Name <address>" - the card's author is
  // the address's member, so this keeps who actually wrote a forwarded email.
  senderLine: 'boolean',
});

const DEFAULT_PARTS = Object.freeze({
  description: 'text',
  stripQuoted: true,
  attachments: true,
  senderLine: true,
});

const MAX_TITLE = 255;
const MAX_DESCRIPTION = 100000;

function validPart(name, value) {
  const kind = EMAIL_PARTS[name];
  if (Array.isArray(kind)) return kind.includes(value);
  return kind === 'boolean' && (value === true || value === false);
}

// Only known parts with valid values; anything else is dropped, so a stored
// or submitted object can never add a field the resolver does not know.
function cleanParts(parts) {
  const out = {};
  if (!parts || typeof parts !== 'object') return out;
  for (const name of Object.keys(EMAIL_PARTS)) {
    if (validPart(name, parts[name])) out[name] = parts[name];
  }
  return out;
}

const bool = value => (value === true || value === false ? value : undefined);

// The effective settings for one member on one board.
//   admin  { enabled, domain }               Settings.inboundMail
//   board  { enabled, listId, swimlaneId, parts }   board.emailToCard
//   member { enabled, parts }                user.profile.emailToCard
function resolveEmailToCard({ admin = {}, board = {}, member = {} } = {}) {
  const adminOn = bool(admin.enabled) === true && typeof admin.domain === 'string' && admin.domain.trim() !== '';
  // Off on a board until its admin turns it on; on for a member unless they
  // turn their own addresses off.
  const boardOn = bool(board.enabled) === true;
  const memberOn = bool(member.enabled) !== false;
  return {
    enabled: adminOn && boardOn && memberOn,
    reason: !adminOn ? 'admin-off' : !boardOn ? 'board-off' : !memberOn ? 'member-off' : null,
    listId: typeof board.listId === 'string' ? board.listId : null,
    swimlaneId: typeof board.swimlaneId === 'string' ? board.swimlaneId : null,
    parts: { ...DEFAULT_PARTS, ...cleanParts(board.parts), ...cleanParts(member.parts) },
  };
}

// "Name <address>" or "address", for the sender line.
function formatSender(from) {
  if (!from || !from.address) return '';
  return from.name ? `${from.name} <${from.address}>` : from.address;
}

// The HTML body as plain text, when an email has no text part: tags removed,
// block ends kept as line breaks, the common entities decoded. Good enough for
// a card description; nothing here is ever rendered as HTML.
function htmlToText(html) {
  return String(html || '')
    .replace(/<(script|style|head)\b[^>]*>[\s\S]*?<\/\1\b[^>]*>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|li|tr|h[1-6]|blockquote)\b[^>]*>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// Card fields from one parsed email, by the resolved parts.
//   message { subject, text, html, from: { name, address }, attachments }
//   options.stripQuoted  the quote stripper (server/lib/inboundEmailQuoteStrip.js),
//                        passed in so this module stays dependency-free
// Returns { title, description, attachments }.
function cardFromEmail(message = {}, parts = DEFAULT_PARTS, { stripQuoted = text => text } = {}) {
  const resolved = { ...DEFAULT_PARTS, ...cleanParts(parts) };
  let body = typeof message.text === 'string' && message.text.trim()
    ? message.text : htmlToText(message.html);
  body = String(body || '').replace(/\r\n?/g, '\n');
  if (resolved.stripQuoted) body = stripQuoted(body) || '';
  body = body.trim();

  const firstLine = body.split('\n').find(line => line.trim()) || '';
  const subject = String(message.subject || '').replace(/\s+/g, ' ').trim();
  const title = (subject || firstLine.trim() || 'Email').slice(0, MAX_TITLE);

  const lines = [];
  if (resolved.senderLine && formatSender(message.from)) lines.push(`From: ${formatSender(message.from)}`);
  if (resolved.description === 'text' && body) {
    if (lines.length) lines.push('');
    lines.push(body);
  }
  const description = lines.join('\n').slice(0, MAX_DESCRIPTION);

  const attachments = resolved.attachments && Array.isArray(message.attachments)
    ? message.attachments.filter(a => a && a.content && a.filename) : [];
  return { title, description, attachments };
}

// --- Admin Panel: the inbound side, servers and passwords ------------------
//
// Settings.inboundMail:
//   enabled, domain              the hard gate and the board-address domain
//   webhookSecret / webhookSecretSet   the provider webhook's shared secret
//   accounts: [{ id, label, host, port, secure, username, mailbox,
//                after: 'seen'|'delete', enabled }]   IMAP mailboxes polled
//   passwords: { <id>: password } / passwordSet: { <id>: true }
// The secret and the passwords are written only when one is typed, and never
// leave the server (inboundMailAdminView).

const HOST = /^(?=.{1,253}$)([A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)(\.[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)*$/;
const ACCOUNT_ID = /^[A-Za-z0-9_-]{1,40}$/;
const MAX_ACCOUNTS = 20;

const isHost = value => typeof value === 'string' && HOST.test(value);

function cleanAccount(account) {
  if (!account || typeof account !== 'object' || !ACCOUNT_ID.test(String(account.id || ''))) return null;
  const host = String(account.host || '').trim().toLowerCase();
  if (!isHost(host)) return null;
  const port = Number(account.port);
  return {
    id: String(account.id),
    label: String(account.label || '').trim().slice(0, 100),
    host,
    port: Number.isInteger(port) && port > 0 && port < 65536 ? port : (account.secure === false ? 143 : 993),
    secure: account.secure !== false,
    username: String(account.username || '').trim().slice(0, 320),
    mailbox: String(account.mailbox || 'INBOX').trim().slice(0, 200) || 'INBOX',
    after: account.after === 'delete' ? 'delete' : 'seen',
    enabled: account.enabled === true,
  };
}

// The non-secret part of a submitted admin form. Throws a string error code
// for what cannot be saved.
function cleanInboundAdmin(input = {}) {
  const domain = String(input.domain || '').trim().toLowerCase();
  if (domain && !isHost(domain)) throw new Error('inbound-domain-invalid');
  if (input.enabled === true && !domain) throw new Error('inbound-domain-required');
  const accounts = [];
  for (const raw of Array.isArray(input.accounts) ? input.accounts.slice(0, MAX_ACCOUNTS) : []) {
    const account = cleanAccount(raw);
    if (!account) throw new Error('inbound-account-invalid');
    if (accounts.some(a => a.id === account.id)) throw new Error('inbound-account-invalid');
    accounts.push(account);
  }
  return { enabled: input.enabled === true, domain, accounts };
}

// What the Admin Panel form is shown: everything but the secrets.
function inboundMailAdminView(inboundMail = {}) {
  const accounts = Array.isArray(inboundMail.accounts) ? inboundMail.accounts : [];
  const passwordSet = inboundMail.passwordSet || {};
  return {
    enabled: inboundMail.enabled === true,
    domain: typeof inboundMail.domain === 'string' ? inboundMail.domain : '',
    webhookSecretSet: inboundMail.webhookSecretSet === true,
    accounts: accounts.map(a => ({ ...a, passwordSet: passwordSet[a.id] === true })),
    sandstormBoard: inboundMail.sandstormBoard && inboundMail.sandstormBoard.boardId
      ? { boardId: inboundMail.sandstormBoard.boardId } : null,
  };
}

// A sliding-window limit per key (a board address): `limit` emails per
// `windowMs`. In memory, per server process - a flood is stopped where it
// arrives, and a restart forgetting the window costs at most one more window.
function createRateLimiter({ limit = 30, windowMs = 60 * 60 * 1000, now = Date.now } = {}) {
  const hits = new Map();
  return function allow(key) {
    const t = now();
    const recent = (hits.get(key) || []).filter(at => t - at < windowMs);
    if (recent.length >= limit) { hits.set(key, recent); return false; }
    recent.push(t);
    hits.set(key, recent);
    if (hits.size > 10000) hits.delete(hits.keys().next().value);
    return true;
  };
}

module.exports = {
  cleanInboundAdmin,
  inboundMailAdminView,
  createRateLimiter,
  EMAIL_PARTS,
  DEFAULT_PARTS,
  MAX_TITLE,
  cleanParts,
  resolveEmailToCard,
  cardFromEmail,
  htmlToText,
  formatSender,
};
