'use strict';

// Reply-by-email token: encode/verify a card-identifying token used as the
// local part of a notification email's Reply-To address, so a reply sent
// through a mail provider's inbound-parse webhook (server/routes/inboundEmail.js)
// can be matched back to the right card - see docs/Features/Reply-By-Email.md
// and https://github.com/wekan/wekan/issues/2414.
//
// Scope: this is the WEBHOOK-based approach (a mail provider such as Mailgun
// Routes or SendGrid Inbound Parse POSTs parsed inbound mail to a WeKan HTTP
// endpoint), not an IMAP-polling mail client - see the doc for why.
//
// Token shape: `reply+<cardId>-<hex-hmac>` (the local part of
// `reply+<cardId>-<hex-hmac>@<domain>`). The HMAC is keyed by a server-only
// secret so the token cannot be forged or guessed from a card id alone - a
// forged/tampered token must be REJECTED (see the negative test in
// tests/inboundEmailReplyToken.test.cjs). Plain Node `crypto`, no new
// dependency, the same approach as models/lib/oauth2ClientSecretJwt.js.

const crypto = require('crypto');

const TOKEN_PREFIX = 'reply+';
// crypto.timingSafeEqual requires equal-length buffers; a length mismatch is
// itself a "not equal" rather than a thrown error.
function safeEqualHex(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const bufA = Buffer.from(a, 'hex');
  const bufB = Buffer.from(b, 'hex');
  if (bufA.length === 0 || bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

// Pure: compute the hex HMAC for a cardId under a given secret. No I/O.
function computeCardReplyHmac(cardId, secret) {
  if (!cardId || !secret) return '';
  return crypto
    .createHmac('sha256', secret)
    .update(String(cardId))
    .digest('hex')
    .slice(0, 32); // 128 bits is plenty for this purpose and keeps addresses short
}

// Pure: build the local part of the Reply-To address for a card, e.g.
// "reply+abc123-9f8e...". Does not include "@domain" - the caller appends
// the configured inbound-mail domain.
function buildReplyToLocalPart(cardId, secret) {
  const mac = computeCardReplyHmac(cardId, secret);
  if (!mac) return '';
  return `${TOKEN_PREFIX}${cardId}-${mac}`;
}

// Pure: build the full Reply-To address.
function buildReplyToAddress(cardId, secret, domain) {
  const local = buildReplyToLocalPart(cardId, secret);
  if (!local || !domain) return '';
  return `${local}@${domain}`;
}

// Pure: parse and verify a reply token (either the bare local part, e.g.
// "reply+abc123-9f8e...", or a full "local@domain" address - callers may pass
// either the raw `to`/recipient field a mail provider sends, or an address
// already split down to its local part).
//
// Returns { valid: true, cardId } when the token verifies, or
// { valid: false, reason } otherwise. Never throws.
function verifyReplyToken(token, secret) {
  try {
    if (!token || typeof token !== 'string' || !secret) {
      return { valid: false, reason: 'missing-token-or-secret' };
    }
    const local = token.includes('@') ? token.split('@')[0] : token;
    if (!local.startsWith(TOKEN_PREFIX)) {
      return { valid: false, reason: 'bad-prefix' };
    }
    const rest = local.slice(TOKEN_PREFIX.length);
    const lastDash = rest.lastIndexOf('-');
    if (lastDash <= 0 || lastDash === rest.length - 1) {
      return { valid: false, reason: 'malformed' };
    }
    const cardId = rest.slice(0, lastDash);
    const providedMac = rest.slice(lastDash + 1);
    const expectedMac = computeCardReplyHmac(cardId, secret);
    if (!expectedMac || !safeEqualHex(providedMac, expectedMac)) {
      return { valid: false, reason: 'bad-hmac' };
    }
    return { valid: true, cardId };
  } catch (e) {
    return { valid: false, reason: 'exception' };
  }
}

module.exports = {
  TOKEN_PREFIX,
  computeCardReplyHmac,
  buildReplyToLocalPart,
  buildReplyToAddress,
  verifyReplyToken,
};
