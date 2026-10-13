'use strict';

// A member's personal email address for one board (email to card, #794):
//
//   board+<token>@<domain>
//
// token  22 characters of [A-Za-z0-9], each uniform (~131 bits)
//
// The token is kept in BoardEmailAddresses, a collection no publication
// sends: the member asks for their own address through a method, so it can be
// shown again (Trello shows it every time too), and an address is revoked by
// giving the member a new one. The card an email makes is the
// address's MEMBER's card - never the From address's, which the sender
// controls (the lesson of ReplyBleed, GHSA-mc7c-cv99-64h7) - so forwarding
// somebody else's email to your own board address works, and nobody can post
// as someone else by setting From.
//
// Pure apart from crypto, so tests/emailToCard.test.cjs runs it with
// plain Node.

const crypto = require('crypto');

const PREFIX = 'board+';
const TOKEN = /^[A-Za-z0-9]{22}$/;
const ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

// Rejection sampling (RandomBleed, CWE-1204): 256 is not a multiple of 62, so
// only bytes below 248 are used - each character is then exactly uniform.
function newBoardAddressToken(random = crypto.randomBytes) {
  const limit = 256 - (256 % ALPHABET.length);
  let out = '';
  while (out.length < 22) {
    const bytes = random(22 - out.length);
    for (let i = 0; i < bytes.length && out.length < 22; i += 1) {
      if (bytes[i] < limit) out += ALPHABET[bytes[i] % ALPHABET.length];
    }
  }
  return out;
}

function boardAddress(token, domain) {
  return TOKEN.test(token || '') && domain ? `${PREFIX}${token}@${domain}` : '';
}

// The bare address from "Name <user@host>" or "user@host".
function bareAddress(value) {
  if (typeof value !== 'string') return '';
  const angle = value.match(/<([^>]+)>/);
  return (angle ? angle[1] : value).trim();
}

// The token of a board address, or null. The local part's case is kept: the
// token is case-sensitive, and mail systems preserve a local part's case.
function parseBoardAddress(value) {
  const address = bareAddress(value);
  const at = address.lastIndexOf('@');
  const local = at > 0 ? address.slice(0, at) : address;
  if (!local.toLowerCase().startsWith(PREFIX)) return null;
  const token = local.slice(PREFIX.length);
  return TOKEN.test(token) ? token : null;
}

// Every recipient a message names, in the order worth trying: the envelope
// headers a mail server adds (the address the message was actually DELIVERED
// to - a board address in Bcc appears only there) before To and Cc. Each
// entry may be "a@b, Name <c@d>" or an array of such strings / { address }.
function recipientAddresses({ deliveredTo, originalTo, to, cc } = {}) {
  const out = [];
  const add = value => {
    if (!value) return;
    if (Array.isArray(value)) { value.forEach(add); return; }
    if (typeof value === 'object') { add(value.address || value.value || value.text); return; }
    for (const part of String(value).split(',')) {
      const address = bareAddress(part);
      if (address && !out.includes(address)) out.push(address);
    }
  };
  [deliveredTo, originalTo, to, cc].forEach(add);
  return out;
}

// On Sandstorm a grain has ONE address and its whole local part is the grain
// id, so a member reaches their board by putting their token in the SUBJECT:
// "board+<token> Fix the login" or "[board+<token>] ...". Returns the token
// and the subject without it.
const SUBJECT_TOKEN = /(?:^|\s|\[)board\+([A-Za-z0-9]{22})(?:\]|\s|$)/;
function subjectBoardToken(subject) {
  const text = String(subject || '');
  const match = text.match(SUBJECT_TOKEN);
  if (!match) return { token: null, subject: text };
  return { token: match[1], subject: text.replace(match[0], ' ').replace(/\s+/g, ' ').trim() };
}

module.exports = {
  subjectBoardToken,
  PREFIX,
  newBoardAddressToken,
  boardAddress,
  parseBoardAddress,
  recipientAddresses,
  bareAddress,
};
