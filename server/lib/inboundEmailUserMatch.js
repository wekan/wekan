'use strict';

// Who wrote an inbound reply (#2414), decided without a database so the tests
// can drive it: tests/inboundEmailUserMatch.test.cjs.
//
// ReplyBleed (GHSA-mc7c-cv99-64h7): this module used to pick the author by
// searching EVERY user for the reply's From address - a field the sender
// controls - so anyone holding a card's reply address could comment as anyone.
// The author is now the recipient named in the signed reply token, and the From
// address only has to agree with it.

const { memberCan } = require('../../models/lib/boardRoleCapabilities');
const { isAssignedOnlyMember } = require('../../models/lib/boardCardScope');

function normalizeEmail(address) {
  if (typeof address !== 'string') return '';
  // A From header can be "Name <addr@x>" as well as a bare address.
  const angleMatch = address.match(/<([^>]+)>/);
  const raw = angleMatch ? angleMatch[1] : address;
  return raw.trim().toLowerCase();
}

// Pure: is `fromAddress` one of THIS user's own addresses?
function senderIsUser(fromAddress, user) {
  const email = normalizeEmail(fromAddress);
  if (!email || !user || !Array.isArray(user.emails)) return false;
  return user.emails.some(e => e && typeof e.address === 'string' && e.address.toLowerCase() === email);
}

// Pure: may the token's recipient `user` comment on `card` of `board` with a
// reply from `fromAddress`? Returns { ok: true } or { ok: false, code, error,
// log } - `log` is true only for what nothing but an attempt produces: a From
// address that is not the recipient's. A disabled user or a member who has
// lost access since the email was sent is a real person, so it is not logged.
function replyAuthorDecision({ user, fromAddress, card, board }) {
  if (!user || user.loginDisabled) return { ok: false, code: 403, error: 'Unrecognized sender', log: false };
  if (!senderIsUser(fromAddress, user)) {
    return { ok: false, code: 403, error: 'Unrecognized sender', log: true,
      detail: 'sender address is not the reply address recipient' };
  }
  if (!card || !board || board._id !== card.boardId || !memberCan(board.members, user._id, 'comment') ||
      (isAssignedOnlyMember(board, user._id) && !(card.assignees || []).includes(user._id))) {
    return { ok: false, code: 403, error: 'Not allowed to comment on this card', log: false };
  }
  return { ok: true };
}

module.exports = { normalizeEmail, senderIsUser, replyAuthorDecision };
