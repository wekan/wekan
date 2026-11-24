'use strict';

// Reply-by-email token: the local part of a notification email's Reply-To
// address, so a reply posted by a mail provider's inbound-parse webhook
// (server/routes/inboundEmail.js) can be matched back to its card - see
// docs/Features/Email/Reply-By-Email.md and https://github.com/wekan/wekan/issues/2414.
//
// ReplyBleed (GHSA-mc7c-cv99-64h7): the token used to sign the CARD only, and
// the comment author was whoever the inbound From address named - a field the
// sender controls. Anyone holding a card's reply address could post a comment
// attributed to any existing user. The token now binds the card AND the one
// recipient the email was sent to, and expires:
//
//   reply+<cardId>.<userId>.<expiry>.<mac>@<domain>
//
//   expiry  the last valid day, in days since 1970-01-01, base 36
//   mac     HMAC-SHA256 over "wekan-reply-v2", card, user and expiry, keyed by
//           INBOUND_EMAIL_HMAC_SECRET, first 18 hex digits (72 bits)
//
// The author of the comment is the token's user, never the From address. With
// two 17-character Meteor ids the local part is 64 characters, the SMTP limit;
// the `reply+` prefix is kept so existing provider routes still match. A card
// id or user id outside [A-Za-z0-9] gets no Reply-To at all rather than a token
// that would not parse. The old card-only form (`reply+<cardId>-<mac>`) is
// recognized and refused: it names no recipient.

const crypto = require('crypto');

const TOKEN_PREFIX = 'reply+';
const DAY = 86400000;
const MAC_HEX = 18;
const ID = /^[A-Za-z0-9]{1,64}$/;
const EXPIRY = /^[0-9a-z]{1,8}$/;

// crypto.timingSafeEqual needs equal-length buffers; a length mismatch is
// itself "not equal" rather than a thrown error.
function safeEqualHex(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || !/^[0-9a-f]+$/.test(a)) return false;
  const bufA = Buffer.from(a, 'hex');
  const bufB = Buffer.from(b, 'hex');
  if (bufA.length === 0 || bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

function replyDays(env = process.env) {
  const days = Number(env.INBOUND_EMAIL_REPLY_DAYS || 30);
  if (!Number.isSafeInteger(days) || days < 1 || days > 365) throw new Error('INBOUND_EMAIL_REPLY_DAYS must be from 1 to 365');
  return days;
}

// Pure: the MAC for one card, one recipient and one expiry.
function computeReplyMac({ cardId, userId, expiry, secret }) {
  if (!cardId || !userId || !expiry || !secret) return '';
  return crypto.createHmac('sha256', secret)
    .update(['wekan-reply-v2', cardId, userId, expiry].join('\0'))
    .digest('hex').slice(0, MAC_HEX);
}

// Pure: the local part for one recipient of one card, valid for `days` days.
function buildReplyToLocalPart({ cardId, userId, secret, now = new Date(), days = replyDays() }) {
  if (!ID.test(cardId || '') || !ID.test(userId || '') || !secret ||
      !(now instanceof Date) || !Number.isFinite(now.getTime()) || !Number.isSafeInteger(days) || days < 1) return '';
  const expiry = (Math.floor(now.getTime() / DAY) + days).toString(36);
  const mac = computeReplyMac({ cardId, userId, expiry, secret });
  return mac ? `${TOKEN_PREFIX}${cardId}.${userId}.${expiry}.${mac}` : '';
}

// Pure: the full Reply-To address for one recipient.
function buildReplyToAddress({ domain, ...options }) {
  const local = buildReplyToLocalPart(options);
  if (!local || !domain) return '';
  return `${local}@${domain}`;
}

// Pure: parse and verify a reply token - the bare local part or a full
// address, as a provider's `to`/recipient field carries it. Returns
// { valid: true, cardId, userId } or { valid: false, reason }. Never throws.
function verifyReplyToken(token, secret, now = new Date()) {
  try {
    if (!token || typeof token !== 'string' || !secret) return { valid: false, reason: 'missing-token-or-secret' };
    // A provider may pass "Name <reply+...@domain>".
    const angle = token.match(/<([^>]+)>/);
    const address = (angle ? angle[1] : token).trim();
    const local = address.includes('@') ? address.slice(0, address.lastIndexOf('@')) : address;
    if (!local.startsWith(TOKEN_PREFIX)) return { valid: false, reason: 'bad-prefix' };
    const parts = local.slice(TOKEN_PREFIX.length).split('.');
    if (parts.length === 1 && parts[0].includes('-')) return { valid: false, reason: 'legacy-token' };
    if (parts.length !== 4) return { valid: false, reason: 'malformed' };
    const [cardId, userId, expiry, mac] = parts;
    if (!ID.test(cardId) || !ID.test(userId) || !EXPIRY.test(expiry) || mac.length !== MAC_HEX) {
      return { valid: false, reason: 'malformed' };
    }
    const expected = computeReplyMac({ cardId, userId, expiry, secret });
    if (!expected || !safeEqualHex(mac.toLowerCase(), expected)) return { valid: false, reason: 'bad-hmac' };
    // Checked after the MAC, so an expired token is known to be genuine.
    if (!(now instanceof Date) || Math.floor(now.getTime() / DAY) > parseInt(expiry, 36)) {
      return { valid: false, reason: 'expired' };
    }
    return { valid: true, cardId, userId };
  } catch (e) {
    return { valid: false, reason: 'exception' };
  }
}

module.exports = {
  TOKEN_PREFIX,
  replyDays,
  computeReplyMac,
  buildReplyToLocalPart,
  buildReplyToAddress,
  verifyReplyToken,
};
