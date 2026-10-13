'use strict';

// Admin Panel -> Problems -> Email: what went wrong sending or receiving
// email (#794). One row per KIND of problem, folded like every other stream
// (server/lib/eventLogFold.js), so a mail server that is down for an hour is
// one row with a count, not three thousand.
//
// These are operational problems a real user meets - the mail server refused
// a send, an IMAP password stopped working, an email arrived for a board that
// no longer takes email - so they are not security events. ATTEMPTS (an
// unknown board address, a wrong webhook secret, a flood) are still recorded
// as security events under 'authn.inbound-email'.
//
// Pure: tests/emailToCard.test.cjs checks the events without a server.

const KINDS = Object.freeze({
  'send-failed': { category: 'mail-send', bleed: 'MailSendFailed', severity: 'high', action: 'failed' },
  'imap-failed': { category: 'mail-receive', bleed: 'MailImapFailed', severity: 'high', action: 'failed' },
  'receive-unreadable': { category: 'mail-receive', bleed: 'MailUnreadable', severity: 'medium', action: 'failed' },
  'delivery-refused': { category: 'mail-receive', bleed: 'MailRefused', severity: 'low', action: 'refused' },
});

// Anything that looks like a credential is cut out of the detail: an SMTP or
// IMAP error can quote the command that failed, and LOGIN carries the password.
function scrub(text) {
  return String(text || '')
    .replace(/\b(LOGIN|AUTH(?:ENTICATE)?\s+\S+)\s+\S+(\s+\S+)?/gi, '$1 [hidden]')
    .replace(/(pass(?:word)?|secret|token)\s*[=:]\s*\S+/gi, '$1=[hidden]')
    .replace(/[\r\n]+/g, ' ')
    .slice(0, 500);
}

// The event for one problem. `kind` is a key of KINDS; anything else is not a
// mail problem and returns null, so a caller cannot invent a row.
function mailProblemEvent(kind, { source = 'mail', detail = '', userId } = {}) {
  const spec = KINDS[kind];
  if (!spec) return null;
  const evt = { stream: 'mail', ...spec, source: String(source).slice(0, 100), detail: scrub(detail) };
  if (userId) evt.userId = String(userId);
  return evt;
}

module.exports = { KINDS, mailProblemEvent, scrub };
