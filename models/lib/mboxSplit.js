'use strict';
// Splitting an mbox (RFC 4155) into its raw messages; CommonJS so the server's
// decoder (server/lib/mailImport.js) and models/lib/mailFormat.js share it.

const MAX_MBOX_LENGTH = 256 * 1024 * 1024;
const MAX_MAIL_MESSAGES = 20000;

// The "From " separator line of an mbox: "From sender date", at the start of
// the file or after a line break.
const SEPARATOR = /^From [^\r\n]*$/;

// The raw messages of an mbox. A line ">From ..." inside a message is an
// escaped "From " (mboxrd and mboxo both escape it); one ">" is taken off.
// Text that does not start with a separator line is one message (.eml).
function splitMbox(text) {
  const source = String(text == null ? '' : text).replace(/^\uFEFF/, '');
  if (source.length > MAX_MBOX_LENGTH) throw new Error('Mail file is too large');
  const lines = source.split(/\r\n|\n/);
  if (!SEPARATOR.test(lines[0] || '')) return source.trim() ? [source] : [];
  const messages = [];
  let current = null;
  for (const line of lines) {
    if (SEPARATOR.test(line)) {
      if (current) messages.push(current.join('\n'));
      if (messages.length >= MAX_MAIL_MESSAGES) {
        current = null;
        break;
      }
      current = [];
    } else if (current) {
      current.push(/^>+From /.test(line) ? line.slice(1) : line);
    }
  }
  if (current) messages.push(current.join('\n'));
  return messages.filter(message => message.trim());
}

module.exports = { MAX_MBOX_LENGTH, MAX_MAIL_MESSAGES, splitMbox };
